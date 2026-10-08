import type { MyhabitState } from '#shared/domain/types'

type Snapshot = { key: string; state: MyhabitState; revision: number; savedAt: string }
const DB_NAME = 'myhabit-v2'
const STORE_NAME = 'snapshots'

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'key' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function readSnapshot(key: string): Promise<Snapshot | null> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME)
    transaction.oncomplete = () => db.close()
    transaction.onabort = () => { db.close(); reject(transaction.error) }
    const request = transaction.objectStore(STORE_NAME).get(key)
    request.onsuccess = () => resolve((request.result as Snapshot | undefined) ?? null)
    request.onerror = () => reject(request.error)
  })
}

export async function writeSnapshot(key: string, state: MyhabitState, revision = 0): Promise<void> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put({ key, state, revision, savedAt: new Date().toISOString() } satisfies Snapshot)
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onerror = () => { db.close(); reject(transaction.error) }
    transaction.onabort = () => { db.close(); reject(transaction.error) }
  })
}

export async function clearSnapshot(key: string): Promise<void> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(key)
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onerror = () => { db.close(); reject(transaction.error) }
    transaction.onabort = () => { db.close(); reject(transaction.error) }
  })
}
