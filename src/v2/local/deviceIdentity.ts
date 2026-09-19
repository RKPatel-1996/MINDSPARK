import { generateId } from '../domain/id';

const DB_NAME = 'MindSparkV2_DeviceAuth';
const STORE_NAME = 'deviceIdentity';
const DEVICE_ID_KEY = 'current_device_id';

export type DeviceIdentityState = 'persistent' | 'ephemeral' | 'unavailable';

export interface DeviceIdentityResult {
  deviceId: string;
  state: DeviceIdentityState;
}

export interface DeviceIdentity {
  deviceId: string;
  createdAt: string;
}

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

let ephemeralId: string | null = null;

export async function getOrCreateDeviceId(): Promise<DeviceIdentityResult> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    if (!ephemeralId) ephemeralId = generateId();
    return { deviceId: ephemeralId, state: 'unavailable' };
  }

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(DEVICE_ID_KEY);

      getReq.onsuccess = () => {
        if (getReq.result) {
          resolve({ deviceId: getReq.result.deviceId, state: 'persistent' });
        } else {
          const newId = generateId();
          const identity: DeviceIdentity = {
            deviceId: newId,
            createdAt: new Date().toISOString(),
          };
          const putReq = store.put(identity, DEVICE_ID_KEY);
          putReq.onsuccess = () => resolve({ deviceId: newId, state: 'persistent' });
          putReq.onerror = () => reject(putReq.error);
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (error) {
    console.warn('Failed to access IndexedDB for device ID, generating ephemeral ID', error);
    if (!ephemeralId) ephemeralId = generateId();
    return { deviceId: ephemeralId, state: 'ephemeral' };
  }
}
