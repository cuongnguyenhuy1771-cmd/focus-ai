import {
  useCallback,
  useEffect,
  useState,
} from "react";

import "./App.css";

import {
  BREAK_DURATION,
  FOCUS_DURATION,
  getNextPhase,
  type FocusPhase,
} from "./focus/focusEngine";

import {
  getSessions,
  saveSession,
  type SessionRecord,
} from "./data/sessionStore";

import Camera from "./components/Camera";

import type {
  AttentionState,
} from "./vision/attention";

function formatTime(seconds: number) {
  const minutes =
    Math.floor(seconds / 60);

  const remainingSeconds =
    seconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function App() {
  // =============================
  // Timer
  // =============================

  const [phase, setPhase] =
    useState<FocusPhase>("focus");

  const [timeLeft, setTimeLeft] =
    useState(FOCUS_DURATION);

  const [isRunning, setIsRunning] =
    useState(false);

  // =============================
  // Session
  // =============================

  const [focusedSeconds, setFocusedSeconds] =
    useState(0);

  const [breakSeconds, setBreakSeconds] =
    useState(0);

  const [completedBreaks, setCompletedBreaks] =
    useState(0);

  const [sessionStartedAt, setSessionStartedAt] =
    useState<string | null>(null);

  // =============================
  // AI attention
  // =============================

  const [cameraEnabled, setCameraEnabled] =
    useState(false);

  const [attentionState, setAttentionState] =
    useState<AttentionState>("absent");

  const [
    attentionFocusedSeconds,
    setAttentionFocusedSeconds,
  ] = useState(0);

  const [
    attentionAwaySeconds,
    setAttentionAwaySeconds,
  ] = useState(0);

  const [
    attentionAbsentSeconds,
    setAttentionAbsentSeconds,
  ] = useState(0);

  // =============================
  // Saved sessions
  // =============================

  const [sessions, setSessions] =
  useState<SessionRecord[]>(() => getSessions());

  // =============================
  // Timer
  // =============================

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer = setInterval(() => {
      // Timer statistics
      if (phase === "focus") {
        setFocusedSeconds(
          (seconds) => seconds + 1
        );
      } else {
        setBreakSeconds(
          (seconds) => seconds + 1
        );
      }

      // AI attention statistics
      if (phase === "focus") {
        if (
          attentionState ===
          "focused"
        ) {
          setAttentionFocusedSeconds(
            (seconds) => seconds + 1
          );
        }

        if (
          attentionState === "away"
        ) {
          setAttentionAwaySeconds(
            (seconds) => seconds + 1
          );
        }

        if (
          attentionState === "absent"
        ) {
          setAttentionAbsentSeconds(
            (seconds) => seconds + 1
          );
        }
      }

      // Countdown
      setTimeLeft(
        (currentTime) => {
          if (currentTime > 1) {
            return currentTime - 1;
          }

          const nextPhase =
            getNextPhase(phase);

          if (phase === "break") {
            setCompletedBreaks(
              (breaks) => breaks + 1
            );
          }

          setPhase(nextPhase);

          return nextPhase === "focus"
            ? FOCUS_DURATION
            : BREAK_DURATION;
        }
      );
    }, 1000);

    return () =>
      clearInterval(timer);
  }, [
    isRunning,
    phase,
    attentionState,
  ]);

  // =============================
  // Start / Pause / Resume
  // =============================

  function handleStartPause() {
    if (
      !isRunning &&
      sessionStartedAt === null
    ) {
      setSessionStartedAt(
        new Date().toISOString()
      );
    }

    setIsRunning(
      (running) => !running
    );
  }

  // =============================
  // Reset
  // =============================

  function handleReset() {
    setIsRunning(false);

    setPhase("focus");
    setTimeLeft(FOCUS_DURATION);

    setFocusedSeconds(0);
    setBreakSeconds(0);
    setCompletedBreaks(0);

    setAttentionFocusedSeconds(0);
    setAttentionAwaySeconds(0);
    setAttentionAbsentSeconds(0);

    setSessionStartedAt(null);

    setAttentionState("absent");
  }

  // =============================
  // End session
  // =============================

  function handleEndSession() {
    if (
      sessionStartedAt === null
    ) {
      return;
    }

    const session: SessionRecord = {
      id: crypto.randomUUID(),

      startedAt:
        sessionStartedAt,

      endedAt:
        new Date().toISOString(),

      focusedSeconds,

      breakSeconds,

      completedBreaks,

      attentionFocusedSeconds,

      attentionAwaySeconds,

      attentionAbsentSeconds,
    };

    saveSession(session);

    setSessions(
      getSessions()
    );

    // Reset current session
    setIsRunning(false);

    setSessionStartedAt(null);

    setPhase("focus");

    setTimeLeft(
      FOCUS_DURATION
    );

    setFocusedSeconds(0);

    setBreakSeconds(0);

    setCompletedBreaks(0);

    setAttentionFocusedSeconds(0);

    setAttentionAwaySeconds(0);

    setAttentionAbsentSeconds(0);

    setAttentionState("absent");
  }

  // =============================
  // Camera
  // =============================

  const handleAttentionChange =
  useCallback(
    (state: AttentionState) => {
      setAttentionState(state);
    },
    []
  );

  function toggleCamera() {
    setCameraEnabled(
      (enabled) => !enabled
    );
  }

  // =============================
  // UI
  // =============================

  return (
    <main className="app">

      {/* Header */}

      <header className="header">
        <div>
          <h1>Focus AI</h1>

          <p>
            Your AI-powered focus coach
          </p>
        </div>

        <div className="status">
          <span className="status-dot" />

          {isRunning
            ? "Running"
            : sessionStartedAt
              ? "Paused"
              : "Ready"}
        </div>
      </header>

      {/* Dashboard */}

      <section className="dashboard">

        {/* Timer */}

        <div className="card timer-card">

          <p className="label">
            {phase === "focus"
              ? "FOCUS SESSION"
              : "BREAK"}
          </p>

          <div className="timer">
            {formatTime(timeLeft)}
          </div>

          <div className="phase">
            <span className="phase-dot" />

            {phase === "focus"
              ? "Focus"
              : "Break"}
          </div>

          <button
            className="primary-button"
            onClick={
              handleStartPause
            }
          >
            {isRunning
              ? "Pause"
              : sessionStartedAt
                ? "Resume"
                : "Start Session"}
          </button>

          <button
            className="secondary-button"
            onClick={handleReset}
            style={{
              marginTop: "10px",
            }}
          >
            Reset
          </button>

          <button
            className="secondary-button"
            onClick={
              handleEndSession
            }
            disabled={
              sessionStartedAt === null
            }
            style={{
              marginTop: "10px",
            }}
          >
            End Session
          </button>

        </div>

        {/* Camera */}

        <div className="card camera-card">

          <p className="label">
            CAMERA
          </p>

          <Camera
            enabled={cameraEnabled}
            onAttentionChange={
              handleAttentionChange
            }
          />

          <button
            className="secondary-button"
            onClick={toggleCamera}
            style={{
              marginTop: "10px",
            }}
          >
            {cameraEnabled
              ? "Disable Camera"
              : "Enable Camera"}
          </button>

          {/* AI status */}

          <div
            className={`attention-status ${attentionState}`}
          >
            <span className="attention-dot" />

            {attentionState ===
              "focused" &&
              "Focused"}

            {attentionState ===
              "away" &&
              "Looking away"}

            {attentionState ===
              "absent" &&
              "Nobody detected"}
          </div>

        </div>

        {/* Statistics */}

        <div className="card stats-card">

          <p className="label">
            THIS SESSION
          </p>

          <div className="stat">
            <span>
              Focus time
            </span>

            <strong>
              {formatTime(
                focusedSeconds
              )}
            </strong>
          </div>

          <div className="stat">
            <span>
              AI focused
            </span>

            <strong>
              {formatTime(
                attentionFocusedSeconds
              )}
            </strong>
          </div>

          <div className="stat">
            <span>
              Looking away
            </span>

            <strong>
              {formatTime(
                attentionAwaySeconds
              )}
            </strong>
          </div>

          <div className="stat">
            <span>
              Breaks
            </span>

            <strong>
              {completedBreaks}
            </strong>
          </div>

        </div>

      </section>

      {/* Timeline */}

      <section className="card timeline-card">

        <p className="label">
          SESSION TIMELINE
        </p>

        <div className="timeline">

          {sessions.length === 0 ? (
            <div className="timeline-empty">
              Start a session to begin
              tracking your focus.
            </div>
          ) : (
            sessions
              .slice()
              .reverse()
              .map((session) => (
                <div
                  className="session-item"
                  key={session.id}
                >
                  <strong>
                    {new Date(
                      session.startedAt
                    ).toLocaleString()}
                  </strong>

                  <p>
                    Timer focus:{" "}
                    {formatTime(
                      session.focusedSeconds
                    )}

                    {" · "}

                    AI focused:{" "}
                    {formatTime(
                      session.attentionFocusedSeconds
                    )}

                    {" · "}

                    Away:{" "}
                    {formatTime(
                      session.attentionAwaySeconds
                    )}

                    {" · "}

                    Breaks:{" "}
                    {session.completedBreaks}
                  </p>
                </div>
              ))
          )}

        </div>

      </section>

    </main>
  );
}

export default App;