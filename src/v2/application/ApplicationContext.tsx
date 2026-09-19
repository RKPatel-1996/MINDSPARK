import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { User } from 'firebase/auth';
import type { Repositories } from './types';
import type { SyncState } from '../persistence/repository/interfaces';
import { createRepositoriesForUser } from './repositoryFactory';
import { ReviewService } from './reviewService';
import { LibraryService } from './libraryService';
import { InsightsService } from './insightsService';
import { SettingsService } from './settingsService';
import { TaxonomyService } from './taxonomyService';
import {
  ImageAttachmentService,
  type ImageStorageGateway,
} from './imageAttachmentService';
import { getFirebaseStorage } from '../persistence/firebase/storageConfig';
import { FirebaseImageStorageService } from '../persistence/firebase/imageStorageService';
import { bootstrapUserRepositories } from './bootstrapService';
import { seedInitialLibrary, importDraftPayload, inspectImportDraft, DuplicateImportError, type SeedImportResult, type ImportDraftInspection } from './importService';
import type { TransformDraftResult } from '../import/transformDraft';
import type { KnowledgeStatus } from '../domain/knowledge';
import type { BulkLifecycleResult, LifecycleTransitionResult } from '../domain/lifecycle';
import { observeAuthState, isFirebaseConfigured, getCurrentUser } from '../auth/firebaseAuth';

export interface ApplicationContextValue {
  repos: Repositories;
  reviewService: ReviewService;
  libraryService: LibraryService;
  insightsService: InsightsService;
  settingsService: SettingsService;
  taxonomyService: TaxonomyService;
  imageAttachmentService: ImageAttachmentService | null;
  user: User | null;
  authLoading: boolean;
  isFirebaseConfigured: boolean;
  isBootstrapped: boolean;
  isSignedOut: boolean;
  isEphemeralDev: boolean;
  isUnconfigured: boolean;
  isDev: boolean;
  devModeOptIn: boolean;
  setDevModeOptIn: (optIn: boolean) => void;
  exitEphemeralMode: () => void;
  syncState: SyncState;
  pendingWritesCount: number;
  syncError: string | null;
  refreshCount: number;
  triggerRefresh: () => void;
  transitionKnowledgeItemLifecycle: (itemId: string, targetStatus: KnowledgeStatus) => Promise<LifecycleTransitionResult>;
  bulkTransitionKnowledgeItemStatus: (
    itemIds: readonly string[],
    targetStatus: KnowledgeStatus
  ) => Promise<BulkLifecycleResult>;
  seedLibrary: () => Promise<SeedImportResult>;
  importPacket: (payload: unknown) => Promise<TransformDraftResult>;
  inspectImportPacket: (payload: unknown) => Promise<ImportDraftInspection>;
}

const ApplicationContext = createContext<ApplicationContextValue | null>(null);

export interface ApplicationProviderProps {
  children: React.ReactNode;
  customRepos?: Repositories;
  customImageStorage?: ImageStorageGateway;
  isDev?: boolean;
}

export const ApplicationProvider: React.FC<ApplicationProviderProps> = ({
  children,
  customRepos,
  customImageStorage,
  isDev: propIsDev,
}) => {
  const isDev = propIsDev ?? (typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV));
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [authLoading, setAuthLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [pendingWritesCount, setPendingWritesCount] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Ephemeral developer mode opt-in is strictly session-only (in memory).
  // It is NEVER persisted to localStorage, IndexedDB, Firestore, URL parameters, or any durable storage.
  const [devModeOptInState, setDevModeOptInState] = useState<boolean>(false);

  // Ephemeral developer mode opt-in is strictly disabled in production builds
  const devModeOptIn = isDev && devModeOptInState;

  const setDevModeOptIn = useCallback((optIn: boolean) => {
    if (!isDev) return;
    setDevModeOptInState(optIn);
    if (!optIn) {
      setIsBootstrapped(false);
    }
    setRefreshCount((prev) => prev + 1);
  }, [isDev]);

  const exitEphemeralMode = useCallback(() => {
    setDevModeOptIn(false);
  }, [setDevModeOptIn]);

  useEffect(() => {
    const unsubscribe = observeAuthState((detectedUser) => {
      setUser(detectedUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshCount((prev) => prev + 1);
  }, []);

  const isSignedOut = !customRepos && isFirebaseConfigured && !authLoading && !user;
  const isUnconfigured = !customRepos && !isFirebaseConfigured;
  const isEphemeralDev = isUnconfigured && isDev && devModeOptIn;

  const repos = useMemo(() => {
    if (customRepos) return customRepos;
    return createRepositoriesForUser(user, { isDev, devModeOptIn });
  }, [user, customRepos, isDev, devModeOptIn]);

  const reviewService = useMemo(() => new ReviewService(repos), [repos]);
  const libraryService = useMemo(() => new LibraryService(repos), [repos]);
  const insightsService = useMemo(() => new InsightsService(repos), [repos]);
  const settingsService = useMemo(() => new SettingsService(repos), [repos]);
  const taxonomyService = useMemo(() => new TaxonomyService(repos), [repos]);

  const imageAttachmentService = useMemo(() => {
    if (customImageStorage) {
      return new ImageAttachmentService(repos, customImageStorage);
    }

    if (!user || !isFirebaseConfigured) {
      return null;
    }

    const storage = getFirebaseStorage();
    if (!storage) {
      return null;
    }

    return new ImageAttachmentService(
      repos,
      new FirebaseImageStorageService(storage, user.uid),
    );
  }, [repos, user, customImageStorage]);

  // Subscribe to sync state changes from reviewService
  useEffect(() => {
    const unsubscribe = reviewService.onSyncStateChange((state, count, error) => {
      setSyncState(state);
      setPendingWritesCount(count);
      setSyncError(error ?? null);
    });
    return () => unsubscribe();
  }, [reviewService]);

  // Bootstrap user repositories when authenticated or running with custom repos or dev mode
  useEffect(() => {
    let active = true;

    // Do NOT bootstrap throwaway in-memory user data while Firebase auth resolution is still pending
    // or when Firebase is configured but the user is signed out!
    if (!customRepos && isFirebaseConfigured && (authLoading || !user)) {
      setIsBootstrapped(false);
      return;
    }

    // When Firebase is unconfigured, only bootstrap if explicitly opted into dev mode in development
    if (isUnconfigured && (!isDev || !devModeOptIn)) {
      setIsBootstrapped(false);
      return;
    }

    bootstrapUserRepositories(repos).then(() => {
      if (active) {
        setIsBootstrapped(true);
      }
    });

    return () => {
      active = false;
    };
  }, [repos, user, authLoading, customRepos, isUnconfigured, isDev, devModeOptIn]);

  const seedLibrary = useCallback(async (): Promise<SeedImportResult> => {
    if (isSignedOut) {
      throw new Error('Authentication required: Sign in to import and persist knowledge in your personal cloud library.');
    }
    if (isUnconfigured && !isEphemeralDev) {
      if (!isDev) {
        throw new Error('Configuration required: Firebase Firestore is not configured. Cloud persistence is unavailable and library mutations are disabled.');
      }
      throw new Error('Cloud persistence unavailable: Firebase credentials are not configured. Durable cloud commits are disabled. Enable explicit ephemeral developer mode in Settings to explore with transient memory-only data.');
    }
    const result = await seedInitialLibrary(repos);
    reviewService.resetSession();
    triggerRefresh();
    return result;
  }, [repos, reviewService, triggerRefresh, isSignedOut, isUnconfigured, isEphemeralDev, isDev]);

  const importPacket = useCallback(
    async (payload: unknown): Promise<TransformDraftResult> => {
      if (isSignedOut) {
        throw new Error('Authentication required: Sign in to import and persist knowledge in your personal cloud library.');
      }
      if (isUnconfigured && !isEphemeralDev) {
        if (!isDev) {
          throw new Error('Configuration required: Firebase Firestore is not configured. Cloud persistence is unavailable and library mutations are disabled.');
        }
        throw new Error('Cloud persistence unavailable: Firebase credentials are not configured. Durable cloud commits are disabled. Enable explicit ephemeral developer mode in Settings to explore with transient memory-only data.');
      }
      const result = await importDraftPayload(payload, repos);
      if (!result.ok && result.status === 'duplicate') {
        throw new DuplicateImportError(result.fingerprint, result.existingKnowledgeItemId);
      }
      triggerRefresh();
      return result.result;
    },
    [repos, triggerRefresh, isSignedOut, isUnconfigured, isEphemeralDev, isDev]
  );


  const inspectImportPacket = useCallback(
    async (payload: unknown): Promise<ImportDraftInspection> => {
      return await inspectImportDraft(payload, repos);
    },
    [repos]
  );

  const transitionKnowledgeItemLifecycle = useCallback(
    async (itemId: string, targetStatus: KnowledgeStatus): Promise<LifecycleTransitionResult> => {
      const result = await libraryService.transitionKnowledgeItemStatus(itemId, targetStatus);
      if (result.success) {
        triggerRefresh();
      }
      return result;
    },
    [libraryService, triggerRefresh]
  );

  const bulkTransitionKnowledgeItemStatus = useCallback(
    async (itemIds: readonly string[], targetStatus: KnowledgeStatus): Promise<BulkLifecycleResult> => {
      const result = await libraryService.bulkTransitionKnowledgeItemStatus(itemIds, targetStatus);
      if (result.success) {
        triggerRefresh();
      }
      return result;
    },
    [libraryService, triggerRefresh]
  );

  const value: ApplicationContextValue = useMemo(
    () => ({
      repos,
      reviewService,
      libraryService,
      insightsService,
      settingsService,
      taxonomyService,
      imageAttachmentService,
      user,
      authLoading,
      isFirebaseConfigured,
      isBootstrapped,
      isSignedOut,
      isEphemeralDev,
      isUnconfigured,
      isDev,
      devModeOptIn,
      setDevModeOptIn,
      exitEphemeralMode,
      syncState,
      pendingWritesCount,
      syncError,
      refreshCount,
      triggerRefresh,
      transitionKnowledgeItemLifecycle,
      bulkTransitionKnowledgeItemStatus,
      seedLibrary,
      importPacket,
      inspectImportPacket,
    }),
    [
      repos,
      reviewService,
      libraryService,
      insightsService,
      settingsService,
      taxonomyService,
      imageAttachmentService,
      user,
      authLoading,
      isBootstrapped,
      isSignedOut,
      isEphemeralDev,
      isUnconfigured,
      isDev,
      devModeOptIn,
      setDevModeOptIn,
      exitEphemeralMode,
      syncState,
      pendingWritesCount,
      syncError,
      refreshCount,
      triggerRefresh,
      transitionKnowledgeItemLifecycle,
      bulkTransitionKnowledgeItemStatus,
      seedLibrary,
      importPacket,
      inspectImportPacket,
    ]
  );

  return <ApplicationContext.Provider value={value}>{children}</ApplicationContext.Provider>;
};

export function useApplication(): ApplicationContextValue {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error('useApplication must be used within an ApplicationProvider');
  }
  return context;
}
