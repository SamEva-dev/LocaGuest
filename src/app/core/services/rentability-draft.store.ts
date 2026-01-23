import { Injectable } from '@angular/core';

import { RentabilityInput, RentabilityResult } from '../models/rentability.models';

const DB_NAME = 'locaguest_rentability';
const DB_VERSION = 1;
const STORE = 'drafts';

export type RentabilityDraft = {
  id: string; // local uuid
  scenarioId?: string;
  name: string;
  input: Partial<RentabilityInput>;
  localResult?: RentabilityResult | null;
  createdAt: string;
  updatedAt: string;
  pendingSync: boolean;
  lastError?: string;
};

@Injectable({ providedIn: 'root' })
export class RentabilityDraftStore {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('pendingSync', 'pendingSync', { unique: false });
          store.createIndex('scenarioId', 'scenarioId', { unique: false });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return this.dbPromise;
  }

  async upsert(draft: RentabilityDraft): Promise<void> {
    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(draft);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async get(id: string): Promise<RentabilityDraft | null> {
    const db = await this.openDb();
    return await new Promise<RentabilityDraft | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as RentabilityDraft) ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async listPending(): Promise<RentabilityDraft[]> {
    const db = await this.openDb();
    return await new Promise<RentabilityDraft[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const index = tx.objectStore(STORE).index('pendingSync');
      // IndexedDB keys cannot be booleans; using IDBKeyRange.only(true) throws DataError.
      // So we fetch and filter in JS for compatibility.
      const req = index.getAll();
      req.onsuccess = () => {
        const all = ((req.result as RentabilityDraft[]) ?? []);
        resolve(all.filter((d) => d?.pendingSync === true));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
}
