import { createSession, type SessionCreatePayload } from './api'

const OFFLINE_QUEUE_KEY = 'badminton_offline_session_queue'

export function getOfflineQueue(): SessionCreatePayload[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function enqueueOfflineSession(payload: SessionCreatePayload): void {
  const queue = getOfflineQueue()
  queue.push(payload)
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

export function removeOfflineSessionAtIndex(index: number): void {
  const queue = getOfflineQueue()
  if (index >= 0 && index < queue.length) {
    queue.splice(index, 1)
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
  }
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(OFFLINE_QUEUE_KEY)
}

export async function syncOfflineQueue(
  onSynced?: (count: number) => void
): Promise<{ successCount: number; failedCount: number }> {
  const queue = getOfflineQueue()
  if (queue.length === 0) return { successCount: 0, failedCount: 0 }

  let successCount = 0
  const remainingQueue: SessionCreatePayload[] = []

  for (const sessionPayload of queue) {
    try {
      await createSession(sessionPayload)
      successCount += 1
    } catch {
      remainingQueue.push(sessionPayload)
    }
  }

  if (remainingQueue.length > 0) {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue))
  } else {
    clearOfflineQueue()
  }

  if (successCount > 0 && onSynced) {
    onSynced(successCount)
  }

  return {
    successCount,
    failedCount: remainingQueue.length,
  }
}
