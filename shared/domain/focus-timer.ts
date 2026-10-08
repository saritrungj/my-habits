export type TimerSnapshot = { version: 1; id: string; phase: 'focus'|'break'; running: boolean; remaining: number; duration: number; deadline: number; startedAt: string; selectedTask: string }
export function readTimerSnapshot(raw: unknown): TimerSnapshot | null {
  const row = raw as TimerSnapshot | null
  if (!row || row.version !== 1 || !['focus','break'].includes(row.phase) || typeof row.id !== 'string' || typeof row.running !== 'boolean' || typeof row.selectedTask !== 'string' || ![row.remaining,row.duration,row.deadline].every(Number.isFinite) || row.duration <= 0 || row.duration > 10800 || row.remaining < 0 || row.remaining > row.duration || typeof row.startedAt !== 'string' || row.startedAt && !Number.isFinite(Date.parse(row.startedAt)) || row.running && (!row.startedAt || row.deadline <= 0 || !row.id)) return null
  return row
}
export function timerRemaining(timer: TimerSnapshot, now: number): number {
  return timer.running ? Math.min(timer.duration, Math.max(0, Math.ceil((timer.deadline - now) / 1000))) : timer.remaining
}
