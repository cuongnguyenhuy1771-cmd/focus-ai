export interface SessionRecord {
  id: string;

  startedAt: string;
  endedAt: string;

  focusedSeconds: number;
  breakSeconds: number;
  completedBreaks: number;

  attentionFocusedSeconds: number;
  attentionAwaySeconds: number;
  attentionAbsentSeconds: number;
}

const STORAGE_KEY =
  "focus-ai-sessions";

export function getSessions(): SessionRecord[] {
  const stored =
    localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveSession(
  session: SessionRecord
) {
  const sessions = getSessions();

  sessions.push(session);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(sessions)
  );
}