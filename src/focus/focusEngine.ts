export type FocusPhase =
  | "focus"
  | "break";

export const FOCUS_DURATION = 10;
export const BREAK_DURATION = 5;

export function getNextPhase(
  currentPhase: FocusPhase
): FocusPhase {
  return currentPhase === "focus"
    ? "break"
    : "focus";
}