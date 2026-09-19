import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useInRouterContext } from 'react-router-dom';
import { useApplication } from '../../application';
import { useShortcut } from '../shortcuts/useShortcut';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Flag, Info, CheckCircle2, RotateCcw, Sparkles, BookOpen, Loader2, AlertTriangle } from 'lucide-react';
import type { ReviewQueueState } from '../../application/types';
import type { ReviewRating } from '../../domain/event';

type ReviewState = 'question' | 'answered';

export const ReviewView: React.FC = () => {
  const { reviewService, seedLibrary, refreshCount, isSignedOut, isUnconfigured, isEphemeralDev, isDev, syncState, pendingWritesCount, syncError } = useApplication();

  const inRouter = useInRouterContext();
  const navigate = inRouter ? useNavigate() : null;

  const [queueState, setQueueState] = useState<ReviewQueueState>({ status: 'loading' });
  const [reviewState, setReviewState] = useState<ReviewState>('question');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [showFullExplanation, setShowFullExplanation] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [focusCardIndex, setFocusCardIndex] = useState(1);
  const [focusSetComplete, setFocusSetComplete] = useState(false);

  const loadNextCard = useCallback(async () => {
    try {
      const next = await reviewService.getNextReview();
      setQueueState(next);
      setReviewState('question');
      setSelectedOption(null);
      setShowWhy(false);
      setShowFullExplanation(false);
    } catch (err: any) {
      setQueueState({
        status: 'error',
        message: err.message || 'Failed to load next review card',
      });
    }
  }, [reviewService]);

  useEffect(() => {
    loadNextCard();
  }, [loadNextCard, refreshCount]);

  const activeCard = queueState.status === 'ready' ? queueState.active.card : null;
  const activeItem = queueState.status === 'ready' ? queueState.active.knowledgeItem : null;
  const activeState = queueState.status === 'ready' ? queueState.active.cardState : null;

  const handleReveal = () => {
    if (
      reviewState === 'question' &&
      activeCard &&
      (activeCard.type === 'free_recall' || activeCard.type === 'flashcard')
    ) {
      setReviewState('answered');
    }
  };

  const handleCheckAnswer = () => {
    if (
      reviewState === 'question' &&
      activeCard &&
      (activeCard.type === 'mcq' || activeCard.type === 'true_false')
    ) {
      if (selectedOption !== null) {
        setReviewState('answered');
      }
    }
  };

  const handleContinue = async (isCorrect: boolean, guessed = false) => {
    if (!activeCard || !activeItem || !activeState || isSignedOut || (isUnconfigured && !isEphemeralDev)) return;

    const rating: ReviewRating = isCorrect ? (guessed ? 'hard' : 'good') : 'again';
    await reviewService.submitReview({
      card: activeCard,
      knowledgeItem: activeItem,
      currentState: activeState,
      rating,
      objectiveCorrect: isCorrect,
      guessedOrStruggled: guessed,
    });
    if (focusCardIndex >= 5) {
      setFocusSetComplete(true);
    } else {
      setFocusCardIndex((prev) => prev + 1);
      await loadNextCard();
    }
  };

  const handleRating = async (rating: ReviewRating) => {
    if (!activeCard || !activeItem || !activeState || isSignedOut || (isUnconfigured && !isEphemeralDev)) return;

    await reviewService.submitReview({
      card: activeCard,
      knowledgeItem: activeItem,
      currentState: activeState,
      rating,
      objectiveCorrect: null,
      guessedOrStruggled: rating === 'hard' || rating === 'again',
    });
    if (focusCardIndex >= 5) {
      setFocusSetComplete(true);
    } else {
      setFocusCardIndex((prev) => prev + 1);
      await loadNextCard();
    }
  };

  const handleContinueReviewing = async () => {
    setFocusSetComplete(false);
    setFocusCardIndex(1);
    await loadNextCard();
  };

  const handleGoToLibrary = () => {
    if (navigate) {
      navigate('/library');
    } else if (typeof window !== 'undefined') {
      window.location.hash = '#/library';
    }
  };

  const handleSelectOption = (idx: number) => {
    if (reviewState === 'question') {
      setSelectedOption(idx);
    }
  };

  const handleFlagAttention = async () => {
    if (!activeItem) return;
    await reviewService.flagKnowledgeItem(activeItem.id);
    await loadNextCard();
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedLibrary();
      await loadNextCard();
    } finally {
      setIsSeeding(false);
    }
  };

  // Keyboard shortcuts
  useShortcut('review.reveal', handleReveal);
  useShortcut('review.confirm', () => {
    if (reviewState === 'question') {
      handleCheckAnswer();
    } else if (activeCard?.type === 'mcq') {
      const isCorrect = selectedOption === activeCard.correctOptionIndex;
      handleContinue(isCorrect);
    } else if (activeCard?.type === 'true_false') {
      const isCorrect = selectedOption === (activeCard.isTrue ? 1 : 0);
      handleContinue(isCorrect);
    }
  });
  useShortcut('review.continue', () => {
    if (focusSetComplete) {
      handleContinueReviewing();
    } else if (reviewState === 'answered') {
      if (activeCard?.type === 'mcq') {
        const isCorrect = selectedOption === activeCard.correctOptionIndex;
        handleContinue(isCorrect);
      } else if (activeCard?.type === 'true_false') {
        const isCorrect = selectedOption === (activeCard.isTrue ? 1 : 0);
        handleContinue(isCorrect);
      }
    }
  });

  useShortcut('review.again', () => reviewState === 'answered' && (activeCard?.type === 'free_recall' || activeCard?.type === 'flashcard') && handleRating('again'));
  useShortcut('review.hard', () => reviewState === 'answered' && (activeCard?.type === 'free_recall' || activeCard?.type === 'flashcard') && handleRating('hard'));
  useShortcut('review.good', () => reviewState === 'answered' && (activeCard?.type === 'free_recall' || activeCard?.type === 'flashcard') && handleRating('good'));
  useShortcut('review.easy', () => reviewState === 'answered' && (activeCard?.type === 'free_recall' || activeCard?.type === 'flashcard') && handleRating('easy'));

  useShortcut('review.option1', () => handleSelectOption(0));
  useShortcut('review.option2', () => handleSelectOption(1));
  useShortcut('review.option3', () => handleSelectOption(2));
  useShortcut('review.option4', () => handleSelectOption(3));

  useShortcut('review.why', () => setShowWhy((prev) => !prev));
  useShortcut('review.flag', handleFlagAttention);

  // Signed out state
  if (isSignedOut) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center max-w-md p-8 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl paper-shadow">
          <div className="w-16 h-16 bg-[var(--elevated-color)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-2xl font-semibold mb-2 font-ui">Sign in to start reviewing</h2>
          <p className="text-sm text-[var(--muted-color)] mb-6 font-content">
            Your personal spaced-repetition cards and review history are stored securely in Cloud Firestore. Sign in to access your library.
          </p>
        </div>
      </div>
    );
  }

  // Focus set complete state
  if (focusSetComplete) {
    return (
      <div className="flex flex-col h-full content-container pt-safe relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 pb-2">
          <div className="flex items-center gap-4 flex-1">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--muted-color)]">
              Focus Set
            </span>

            {/* 5-Card Focus Set Progress Indicator showing 5/5 complete */}
            <div
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--surface-color)] border border-[var(--border-color)]"
              title="5 of 5 completed in active focus set"
              aria-label="5 of 5 completed in active focus set"
            >
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className="h-1.5 w-3 rounded-full transition-all duration-200 bg-[var(--color-primary)]"
                  />
                ))}
              </div>
              <span className="text-xs font-mono font-medium text-[var(--muted-color)]">
                5/5
              </span>
            </div>
          </div>
        </div>

        {/* Focus Set Complete Card */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center mx-auto mb-6 paper-shadow">
              <CheckCircle2 className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 font-ui">Focus set complete</h2>
            <p className="text-[var(--muted-color)] mb-8 font-medium font-content">
              5 useful reviews completed
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleContinueReviewing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] cursor-pointer"
              >
                Continue reviewing
              </button>
              <button
                type="button"
                onClick={handleGoToLibrary}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-color)] rounded-xl font-medium font-ui hover:bg-[var(--elevated-color)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] cursor-pointer"
              >
                Library
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (queueState.status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-[var(--muted-color)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          <span className="text-sm font-medium font-ui">Loading review queue...</span>
        </div>
      </div>
    );
  }

  // Empty library state
  if (queueState.status === 'empty') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center mx-auto mb-6 paper-shadow">
            <BookOpen className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-2xl font-semibold mb-2 font-ui">No knowledge available yet</h2>
          <p className="text-[var(--muted-color)] mb-8 font-medium font-content">
            {queueState.message}
          </p>
          <button
            onClick={handleSeed}
            disabled={isSeeding || isSignedOut || (isUnconfigured && !isEphemeralDev)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50"
          >
            {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isSeeding ? 'Seeding Library...' : 'Seed Standard Library (32 items)'}
          </button>
          {isUnconfigured && !isEphemeralDev && (
            <p className="text-xs text-[var(--muted-color)] mt-3 font-content">
              {!isDev
                ? 'Configuration required: Firebase Firestore credentials are not configured. Cloud persistence is unavailable and library seeding is disabled.'
                : 'Cloud Firestore is unconfigured. Opt in to Ephemeral Developer Mode in Settings to seed and test with temporary data.'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Caught up state
  if (queueState.status === 'caught_up') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center mx-auto mb-6 paper-shadow">
            <CheckCircle2 className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-2xl font-semibold mb-2 font-ui">All caught up</h2>
          <p className="text-[var(--muted-color)] mb-6 font-medium font-content">
            {queueState.message}
          </p>
          <div className="grid grid-cols-2 gap-3 mb-8 p-4 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-left text-xs font-ui">
            <div>
              <span className="text-[var(--muted-color)] block">Due Cards</span>
              <span className="font-semibold text-sm">{queueState.stats.reviewDueCount}</span>
            </div>
            <div>
              <span className="text-[var(--muted-color)] block">Learning / Relearning</span>
              <span className="font-semibold text-sm">{queueState.stats.learningDueCount}</span>
            </div>
            <div>
              <span className="text-[var(--muted-color)] block">Active Candidates</span>
              <span className="font-semibold text-sm">{queueState.stats.activeCandidates}</span>
            </div>
            <div>
              <span className="text-[var(--muted-color)] block">Buried Cards (Siblings)</span>
              <span className="font-semibold text-sm">{queueState.stats.buriedCount}</span>
            </div>
          </div>
          <button
            onClick={() => {
              reviewService.resetSession();
              setFocusCardIndex(1);
              setFocusSetComplete(false);
              loadNextCard();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Session & Check Again
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (queueState.status === 'error') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center max-w-lg p-8 bg-[var(--surface-color)] border border-[var(--color-error)] rounded-2xl paper-shadow">
          <div className="w-14 h-14 bg-[var(--color-soft-attention)] text-[var(--color-error)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-[var(--color-error)] font-ui">Review Error</h2>
          <p className="text-sm text-[var(--text-color)] mb-3 font-content">{queueState.message}</p>
          {queueState.cardId && (
            <p className="text-xs font-mono text-[var(--muted-color)] mb-4">Affected Card ID: {queueState.cardId}</p>
          )}
          <button
            onClick={loadNextCard}
            className="px-6 py-2.5 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Ready state: active card and item
  const { card, knowledgeItem, cardState, reason, evidence, stats } = queueState.active;

  const isMcqCorrect = card.type === 'mcq' && selectedOption === card.correctOptionIndex;
  const isTfCorrect = card.type === 'true_false' && selectedOption === (card.isTrue ? 1 : 0);
  const isCorrect = card.type === 'mcq' ? isMcqCorrect : isTfCorrect;

  const questionPrompt =
    card.type === 'free_recall'
      ? card.prompt
      : card.type === 'flashcard'
      ? card.front
      : card.type === 'mcq'
      ? card.question
      : card.statement;

  const answerContent =
    card.type === 'free_recall'
      ? card.answerGuidance
      : card.type === 'flashcard'
      ? card.back
      : null;

  const reasonLabels: Record<string, string> = {
    relearning_due: 'Relearning Card (Immediate Recall)',
    learning_due: 'Learning Card (Graduation Step)',
    review_due: 'Scheduled Review (FSRS Target)',
    new_card: 'New Knowledge Introduction',
    near_due_reserve: 'Near-Due Reserve (Lookahead)',
  };

  return (
    <div className="flex flex-col h-full content-container pt-safe relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 pb-2">
        <div className="flex items-center gap-4 flex-1">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--muted-color)]">
            {knowledgeItem.taxonomy.domainId} <span className="opacity-50">›</span>{' '}
            {knowledgeItem.taxonomy.topicId}
          </span>

          {/* 5-Card Focus Set Progress Indicator */}
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--surface-color)] border border-[var(--border-color)]"
            title={`Card ${focusCardIndex} of 5 in active focus set`}
            aria-label={`Card ${focusCardIndex} of 5 in active focus set`}
          >
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 w-3 rounded-full transition-all duration-200 ${
                    step < focusCardIndex
                      ? 'bg-[var(--color-primary)]'
                      : step === focusCardIndex
                      ? 'bg-[var(--color-primary)] ring-2 ring-[var(--color-soft-primary)]'
                      : 'bg-[var(--border-color)]'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-mono font-medium text-[var(--muted-color)]">
              {focusCardIndex}/5
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Truthful Sync State Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-ui px-2.5 py-1 rounded-full border border-[var(--border-color)] bg-[var(--surface-color)]">
            {syncState === 'pending_writes' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[var(--muted-color)]">
                  {pendingWritesCount > 0 ? `Syncing (${pendingWritesCount})` : 'Pending writes'}
                </span>
              </>
            )}
            {syncState === 'synced' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[var(--muted-color)]">Synced</span>
              </>
            )}
            {syncState === 'offline_or_cache' && (
              <>
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span className="text-[var(--muted-color)]">Offline Cache</span>
              </>
            )}
            {syncState === 'error' && (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-600 font-medium" title={syncError ?? 'Sync error'}>Sync Error</span>
              </>
            )}
          </div>

          <button
            onClick={() => setShowWhy(!showWhy)}
            className={`p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
              showWhy
                ? 'text-[var(--color-primary)] bg-[var(--color-soft-primary)]'
                : 'text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--surface-color)]'
            }`}
            title="Why am I seeing this?"
          >
            <Info className="w-5 h-5" />
          </button>
          <button
            onClick={handleFlagAttention}
            className={`p-2 transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
              knowledgeItem.status === 'needs_review'
                ? 'text-[var(--color-attention)] bg-[var(--color-soft-attention)]'
                : 'text-[var(--muted-color)] hover:text-[var(--color-attention)] hover:bg-[var(--surface-color)]'
            }`}
            title={
              knowledgeItem.status === 'needs_review'
                ? 'Flagged for attention'
                : 'Flag for review'
            }
          >
            <Flag className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Why This Panel (Real Scheduling Context from Router) */}
      {showWhy && (
        <div className="mx-4 md:mx-6 p-4 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-sm animate-in fade-in slide-in-from-top-2 paper-shadow">
          <div className="flex justify-between items-start mb-3 border-b border-[var(--border-color)] pb-2">
            <div>
              <h3 className="font-semibold font-ui">Scheduling Context & Decision Reason</h3>
              <span className="text-xs text-[var(--color-primary)] font-medium font-ui">
                {reasonLabels[reason] || reason}
              </span>
            </div>
            <button
              onClick={() => setShowWhy(false)}
              className="text-[var(--muted-color)] hover:text-[var(--text-color)] text-xs uppercase tracking-wider font-semibold font-ui"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 font-ui text-xs">
            <div className="text-[var(--muted-color)]">Estimated Retrievability (R)</div>
            <div className="font-medium font-mono">
              {Math.round(evidence.retrievability * 100)}%
            </div>

            <div className="text-[var(--muted-color)]">Scheduling Stage</div>
            <div className="font-medium uppercase tracking-wider font-mono">
              {cardState.state}
            </div>

            <div className="text-[var(--muted-color)]">Due Date</div>
            <div className="font-medium font-mono text-[11px]">
              {new Date(cardState.due).toLocaleString()}
            </div>

            <div className="text-[var(--muted-color)]">Stability & Difficulty</div>
            <div className="font-medium font-mono">
              {cardState.stability.toFixed(1)}d / {cardState.difficulty.toFixed(1)}
            </div>

            <div className="text-[var(--muted-color)]">Taxonomy Hierarchy</div>
            <div className="font-medium truncate">
              {knowledgeItem.taxonomy.domainId} › {knowledgeItem.taxonomy.topicId} ›{' '}
              {knowledgeItem.taxonomy.subtopicId}
            </div>

            <div className="text-[var(--muted-color)]">Active Buried Items</div>
            <div className="font-medium font-mono">
              {stats.buriedCount} in session
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-10 flex flex-col items-center">
        <div className="w-full max-w-2xl">
          {/* Card Question / Prompt */}
          <div className="text-xl md:text-2xl font-medium text-center leading-relaxed font-content text-[var(--text-strong)]">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {questionPrompt}
            </ReactMarkdown>
          </div>

          {/* MCQ Options */}
          {card.type === 'mcq' && card.options && (
            <div className="mt-8 md:mt-12 space-y-3">
              {card.options.map((opt: string, idx: number) => {
                const isSelected = selectedOption === idx;
                const isOptionCorrect = card.correctOptionIndex === idx;
                const showResult = reviewState === 'answered';

                let stateClasses =
                  'border-[var(--border-color)] bg-[var(--surface-color)] hover:border-[var(--color-primary)]';
                if (showResult) {
                  if (isOptionCorrect) {
                    stateClasses =
                      'border-[var(--color-success)] bg-[var(--color-soft-success)] text-[var(--color-success)] font-medium';
                  } else if (isSelected && !isOptionCorrect) {
                    stateClasses =
                      'border-[var(--color-error)] bg-[var(--color-soft-error)] text-[var(--color-error)]';
                  } else {
                    stateClasses =
                      'border-[var(--border-color)] bg-[var(--bg-color)] opacity-50';
                  }
                } else if (isSelected) {
                  stateClasses =
                    'border-[var(--color-primary)] bg-[var(--color-soft-primary)] ring-2 ring-[var(--color-primary)]';
                }

                return (
                  <button
                    key={idx}
                    disabled={showResult}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 flex items-center font-content paper-shadow ${stateClasses}`}
                  >
                    <span className="w-7 h-7 flex items-center justify-center border border-[var(--border-color)] rounded-lg mr-4 text-xs font-bold shrink-0 opacity-75 font-mono">
                      {idx + 1}
                    </span>
                    <span className="flex-1 leading-relaxed">
                      <ReactMarkdown>{opt}</ReactMarkdown>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* True/False Options */}
          {card.type === 'true_false' && (
            <div className="mt-8 md:mt-12 grid grid-cols-2 gap-4">
              {[
                { label: 'True', val: 1, bool: true },
                { label: 'False', val: 0, bool: false },
              ].map(({ label, val, bool }) => {
                const isSelected = selectedOption === val;
                const isOptionCorrect = card.isTrue === bool;
                const showResult = reviewState === 'answered';

                let stateClasses =
                  'border-[var(--border-color)] bg-[var(--surface-color)] hover:border-[var(--color-primary)]';
                if (showResult) {
                  if (isOptionCorrect) {
                    stateClasses =
                      'border-[var(--color-success)] bg-[var(--color-soft-success)] text-[var(--color-success)] font-medium';
                  } else if (isSelected && !isOptionCorrect) {
                    stateClasses =
                      'border-[var(--color-error)] bg-[var(--color-soft-error)] text-[var(--color-error)]';
                  } else {
                    stateClasses =
                      'border-[var(--border-color)] bg-[var(--bg-color)] opacity-50';
                  }
                } else if (isSelected) {
                  stateClasses =
                    'border-[var(--color-primary)] bg-[var(--color-soft-primary)] ring-2 ring-[var(--color-primary)]';
                }

                return (
                  <button
                    key={label}
                    disabled={showResult}
                    onClick={() => handleSelectOption(val)}
                    className={`py-5 rounded-xl border font-medium text-lg text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 font-content paper-shadow ${stateClasses}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Flashcard / Recall Answer Revealed */}
          {reviewState === 'answered' && answerContent && (
            <div className="mt-8 md:mt-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-full p-6 bg-[var(--elevated-color)] border border-[var(--border-color)] rounded-xl text-center text-lg font-content paper-shadow">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {answerContent}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Feedback & Explanations */}
          {reviewState === 'answered' && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {(card.type === 'mcq' || card.type === 'true_false') && (
                <div className="text-center mb-6">
                  <div
                    className={`text-xl font-bold mb-4 font-ui ${
                      isCorrect ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                    }`}
                  >
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </div>

                  <div className="flex justify-center gap-4">
                    {isCorrect && (
                      <button
                        onClick={() => handleContinue(true, true)}
                        className="px-6 py-3 border border-[var(--border-color)] bg-[var(--surface-color)] text-[var(--text-color)] rounded-xl font-medium font-ui hover:bg-[var(--border-color)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      >
                        I guessed
                      </button>
                    )}
                    <button
                      onClick={() => handleContinue(isCorrect, false)}
                      className="px-8 py-3 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] hover:opacity-90 transition-opacity"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Explanation Card */}
              {(((card.type === 'mcq' || card.type === 'true_false') && card.explanation) || knowledgeItem.explanationMarkdown) && (
                <div className="text-[var(--text-color)] leading-relaxed bg-[var(--elevated-color)] p-5 rounded-xl border border-[var(--border-color)] font-content paper-shadow">
                  <div className="font-semibold text-xs text-[var(--muted-color)] mb-2 uppercase tracking-wider font-ui">
                    Explanation
                  </div>
                  <div className="text-sm md:text-base font-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {((card.type === 'mcq' || card.type === 'true_false') && card.explanation) || knowledgeItem.content}
                    </ReactMarkdown>
                  </div>

                  {knowledgeItem.explanationMarkdown && (
                    <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                      <div className={`relative ${!showFullExplanation ? 'max-h-24 overflow-hidden' : ''}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {knowledgeItem.explanationMarkdown}
                        </ReactMarkdown>
                        {!showFullExplanation && (
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--elevated-color)] to-transparent pointer-events-none" />
                        )}
                      </div>
                      {!showFullExplanation && (
                        <button
                          onClick={() => setShowFullExplanation(true)}
                          className="text-[var(--color-primary)] text-sm font-medium mt-2 hover:underline font-ui"
                        >
                          Read full details
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="border-t border-[var(--border-color)] bg-[var(--surface-color)] p-4 md:p-6 flex-none pb-safe">
        <div className="max-w-2xl mx-auto">
          {/* MCQ / TrueFalse Check Answer Button */}
          {reviewState === 'question' && (card.type === 'mcq' || card.type === 'true_false') && (
            <div className="flex justify-center">
              <button
                onClick={handleCheckAnswer}
                disabled={selectedOption === null}
                className="px-8 py-3 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui disabled:opacity-40 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] flex items-center gap-2"
              >
                <span>Check answer</span>
                <span className="opacity-50 text-xs hidden md:inline font-mono uppercase">Enter</span>
              </button>
            </div>
          )}

          {/* Flashcard / Recall Reveal Button */}
          {reviewState === 'question' && (card.type === 'free_recall' || card.type === 'flashcard') && (
            <div className="flex justify-center">
              <button
                onClick={handleReveal}
                className="px-8 py-3 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] flex items-center gap-2 hover:opacity-90"
              >
                <span>Reveal answer</span>
                <span className="opacity-50 text-xs hidden md:inline font-mono uppercase">Space</span>
              </button>
            </div>
          )}

          {/* Free Recall / Flashcard Rating Buttons */}
          {reviewState === 'answered' && (card.type === 'free_recall' || card.type === 'flashcard') && (
            <div className="grid grid-cols-4 gap-2 md:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <button
                onClick={() => handleRating('again')}
                className="py-3 px-2 border border-[var(--border-color)] bg-[var(--surface-color)] rounded-xl font-medium hover:bg-[var(--color-soft-error)] hover:text-[var(--color-error)] hover:border-[var(--color-error)] transition-colors flex flex-col items-center justify-center font-ui"
              >
                <span className="mb-1 text-sm md:text-base font-semibold">Again</span>
                <span className="text-xs opacity-50 hidden md:block font-mono uppercase">1</span>
              </button>
              <button
                onClick={() => handleRating('hard')}
                className="py-3 px-2 border border-[var(--border-color)] bg-[var(--surface-color)] rounded-xl font-medium hover:bg-[var(--color-soft-warning)] hover:text-[var(--color-warning)] hover:border-[var(--color-warning)] transition-colors flex flex-col items-center justify-center font-ui"
              >
                <span className="mb-1 text-sm md:text-base font-semibold">Hard</span>
                <span className="text-xs opacity-50 hidden md:block font-mono uppercase">2</span>
              </button>
              <button
                onClick={() => handleRating('good')}
                className="py-3 px-2 border border-[var(--border-color)] bg-[var(--surface-color)] rounded-xl font-medium hover:bg-[var(--color-soft-success)] hover:text-[var(--color-success)] hover:border-[var(--color-success)] transition-colors flex flex-col items-center justify-center font-ui"
              >
                <span className="mb-1 text-sm md:text-base font-semibold">Good</span>
                <span className="text-xs opacity-50 hidden md:block font-mono uppercase">3</span>
              </button>
              <button
                onClick={() => handleRating('easy')}
                className="py-3 px-2 border border-[var(--border-color)] bg-[var(--surface-color)] rounded-xl font-medium hover:bg-[var(--color-soft-primary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors flex flex-col items-center justify-center font-ui"
              >
                <span className="mb-1 text-sm md:text-base font-semibold">Easy</span>
                <span className="text-xs opacity-50 hidden md:block font-mono uppercase">4</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
