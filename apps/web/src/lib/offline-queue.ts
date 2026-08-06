export type OfflineOperation = {
  operationId: string
  kind: 'upsert-session' | 'delete-session'
  recordId: string
  baseVersion: number
  payload?: Record<string, unknown>
  createdAt: string
}

type LocalRecord = { recordId: string; version: number; deleted: boolean; payload?: Record<string, unknown> }
const DB_NAME = 'family-english-offline'
const DB_VERSION = 1

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function openOfflineDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('records')) db.createObjectStore('records', { keyPath: 'recordId' })
      if (!db.objectStoreNames.contains('operations')) db.createObjectStore('operations', { keyPath: 'operationId' })
      if (!db.objectStoreNames.contains('metadata')) db.createObjectStore('metadata')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveRecordAndQueue(record: LocalRecord, operation: OfflineOperation) {
  const db = await openOfflineDatabase()
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['records', 'operations'], 'readwrite')
    transaction.objectStore('records').put(record)
    transaction.objectStore('operations').put(operation)
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onabort = transaction.onerror = () => { db.close(); reject(transaction.error) }
  })
}

export async function applyPulledChanges(changes: Array<LocalRecord & { sequence: string }>, cursor: string) {
  const db = await openOfflineDatabase()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['records', 'metadata'], 'readwrite')
    const records = tx.objectStore('records')
    for (const incoming of changes) {
      const request = records.get(incoming.recordId)
      request.onsuccess = () => {
        const local = request.result as LocalRecord | undefined
        // Tombstones win over equal/older payloads, preventing stale resurrection.
        if (!local || incoming.version > local.version || (incoming.version === local.version && incoming.deleted)) records.put(incoming)
      }
    }
    tx.objectStore('metadata').put(cursor, 'cursor')
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function pendingOperationCount() {
  const db = await openOfflineDatabase()
  const count = await requestResult(db.transaction('operations').objectStore('operations').count())
  db.close()
  return count
}

export async function readSyncCursor() {
  const db = await openOfflineDatabase()
  const cursor = await requestResult(db.transaction('metadata').objectStore('metadata').get('cursor')) as string | undefined
  db.close()
  return cursor ?? '0'
}

export async function pullChanges(fetcher: typeof fetch = fetch) {
  const cursor = await readSyncCursor()
  const response = await fetcher(`/api/sync/changes?cursor=${encodeURIComponent(cursor)}`, { credentials: 'include', cache: 'no-store' })
  if (!response.ok) throw new Error(`拉取失败：${response.status}`)
  const body = await response.json() as { changes: Array<LocalRecord & { sequence: string }>; cursor: string }
  await applyPulledChanges(body.changes, body.cursor)
  return body.changes.length
}
export async function replayQueue(fetcher: typeof fetch = fetch) {
  const db = await openOfflineDatabase()
  const operations = await requestResult(db.transaction('operations').objectStore('operations').getAll()) as OfflineOperation[]
  for (const operation of operations.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const response = await fetcher('/api/sync/operations', {
      method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(operation),
    })
    if (response.status === 409) { const detail = await response.json().catch(() => ({})); db.close(); throw new Error(`同步冲突：${JSON.stringify(detail)}`) }
    if (!response.ok) throw new Error(`同步失败：${response.status}`)
    const tx = db.transaction('operations', 'readwrite')
    tx.objectStore('operations').delete(operation.operationId)
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) })
  }
  db.close()
}

export async function resolveConflict(operationId: string, choice: 'server' | 'local', currentVersion?: number) {
  const db = await openOfflineDatabase()
  const tx = db.transaction(['operations', 'records'], 'readwrite')
  const operations = tx.objectStore('operations')
  const operation = await requestResult(operations.get(operationId)) as OfflineOperation | undefined
  if (!operation) { db.close(); return }
  if (choice === 'server') operations.delete(operationId)
  else operations.put({ ...operation, baseVersion: currentVersion ?? operation.baseVersion })
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) })
  db.close()
}

export function createOperation(input: Omit<OfflineOperation, 'operationId' | 'createdAt'>): OfflineOperation {
  return { ...input, operationId: crypto.randomUUID(), createdAt: new Date().toISOString() }
}
