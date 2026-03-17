import { useState, useEffect, useRef, useCallback } from "react";
import "./narrative.css";
import NarrativeShell from "./components/NarrativeShell";
import SplashScreen from "./components/SplashScreen";
import RoleCapture from "./components/RoleCapture";
import GuidancePrompt from "./components/GuidancePrompt";
import NarrativeChips from "./components/NarrativeChips";
import NarrativeTextarea from "./components/NarrativeTextarea";
import ConfidenceMeter from "./components/ConfidenceMeter";
import NarrativePlayback from "./components/NarrativePlayback";
import useNarrativeFlow from "./hooks/useNarrativeFlow";

function LoadingView() {
  const messages = [
    "Analysing your friction narrative...",
    "Identifying pain patterns...",
    "Building your personalised report...",
    "Mapping AI solutions to your challenges...",
  ];
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{
        width: 32, height: 32, margin: "0 auto 20px",
        border: "3px solid #E5E7EB", borderTopColor: "#4A5FF7",
        borderRadius: "50%", animation: "spin 0.8s linear infinite",
      }} />
      <p style={{
        fontSize: 15, color: "#6B7280",
        animation: "fadeInOut 2.5s ease-in-out infinite",
      }}>
        {messages[msgIdx]}
      </p>
    </div>
  );
}

export default function App() {
  const {
    state, handleTextChange, handleChipAppend,
    handleDismissSplash, handleRoleSubmit, handleAttach, handleRemoveAttachment,
    handleGenerateResults, handleRestoreNarrative, handleStartFresh, reset,
  } = useNarrativeFlow();

  const {
    narrative, attachments, phase, processing,
    currentPrompt, themes, confidence, readyForResults,
    results, error, nudgeMessage, showRecovery,
  } = state;

  // ── Change 4: Track user typing for listening animation ──
  const [isUserTyping, setIsUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const wrappedHandleTextChange = useCallback((text) => {
    handleTextChange(text);
    setIsUserTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false);
    }, 1500);
  }, [handleTextChange]);

  // ── Change 3: Delayed chip reveal for entry phase ──
  const [chipsRevealed, setChipsRevealed] = useState(false);
  const chipsTimerRef = useRef(null);
  const userHasTypedRef = useRef(false);

  // Reset chip reveal when entering entry phase
  useEffect(() => {
    if (phase === "entry") {
      setChipsRevealed(false);
      userHasTypedRef.current = false;

      // Reveal chips after 4s if user hasn't started typing
      chipsTimerRef.current = setTimeout(() => {
        if (!userHasTypedRef.current) {
          setChipsRevealed(true);
        }
      }, 4000);

      return () => clearTimeout(chipsTimerRef.current);
    }
    // In conversing phase, AI chips should appear immediately
    if (phase === "conversing") {
      setChipsRevealed(true);
    }
  }, [phase]);

  // Track typing to suppress initial chip reveal if user starts writing
  useEffect(() => {
    if (phase === "entry" && narrative.length > 0) {
      userHasTypedRef.current = true;
    }
  }, [narrative, phase]);

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => clearTimeout(typingTimeoutRef.current);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#FAFBFC" }}>
      {/* Splash screen */}
      {phase === "splash" && (
        <SplashScreen onStart={handleDismissSplash} />
      )}

      {/* Header bar + confidence meter — visible from role-capture onwards */}
      {phase !== "splash" && phase !== "results" && phase !== "generating" && (
        <ConfidenceMeter confidence={confidence} themes={themes} ready={readyForResults} />
      )}

      {phase !== "splash" && (
      <NarrativeShell centered={phase !== "entry" && phase !== "conversing" && phase !== "error"}>
        {/* Role capture step */}
        {phase === "role-capture" && (
          <RoleCapture onComplete={handleRoleSubmit} />
        )}

        {/* Error banner */}
        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FECACA",
            borderRadius: 12, padding: "14px 18px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 10,
            color: "#B91C1C", fontSize: 14,
          }}>
            <span style={{ flex: 1 }}>{error}</span>
          </div>
        )}

        {(phase === "entry" || phase === "conversing" || phase === "error") && (
          <>
            {/* Dynamic AI prompt */}
            <GuidancePrompt
              prompt={currentPrompt}
              processing={processing}
              isEntry={phase === "entry"}
              isUserTyping={isUserTyping}
            />

            {/* Contextual chips — delayed reveal in entry, immediate in conversing */}
            {chipsRevealed && currentPrompt.chips?.length > 0 && (
              <NarrativeChips
                chips={currentPrompt.chips}
                onSelect={handleChipAppend}
                headerLabel={phase === "entry" ? "Conversation starters" : null}
              />
            )}

            {/* The omnipresent textarea */}
            <NarrativeTextarea
              value={narrative}
              onChange={wrappedHandleTextChange}
              attachments={attachments}
              onAttach={handleAttach}
              onRemoveAttachment={handleRemoveAttachment}
              attachmentRequest={currentPrompt.attachmentRequest}
              processing={processing}
              turnsCount={state.turns.length}
            />

            {/* Nudge message — gentle encouragement when user pauses */}
            {nudgeMessage && !processing && (
              <div className="narrative-nudge">
                {nudgeMessage}
              </div>
            )}

            {/* Recovery prompt — when user clears all text */}
            {showRecovery && (
              <div className="narrative-recovery" style={{
                textAlign: "center",
                margin: "16px 0",
                padding: "16px 20px",
                background: "#F9FAFB",
                borderRadius: 14,
                border: "1px solid #E5E7EB",
              }}>
                <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 12px" }}>
                  Looks like you cleared your text. Want to pick up where you left off?
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button
                    onClick={handleRestoreNarrative}
                    style={{
                      background: "#fff",
                      border: "1.5px solid #4A5FF7",
                      borderRadius: 10,
                      padding: "8px 18px",
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: "'Google Sans', sans-serif",
                      color: "#4A5FF7",
                      cursor: "pointer",
                    }}
                  >
                    Restore my text
                  </button>
                  <button
                    onClick={handleStartFresh}
                    style={{
                      background: "#fff",
                      border: "1.5px solid #E5E7EB",
                      borderRadius: 10,
                      padding: "8px 18px",
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: "'Google Sans', sans-serif",
                      color: "#6B7280",
                      cursor: "pointer",
                    }}
                  >
                    Start fresh
                  </button>
                </div>
              </div>
            )}

            {/* Generate results button — appears when ready */}
            {readyForResults && (
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button
                  onClick={handleGenerateResults}
                  className="narrative-generate-btn"
                  style={{
                    background: "linear-gradient(135deg, #4A5FF7 0%, #7B61FF 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 14,
                    padding: "14px 32px",
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: "'Google Sans', sans-serif",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(74, 95, 247, 0.3)",
                    transition: "all 0.2s ease",
                  }}
                >
                  Generate My Friction Report
                </button>
              </div>
            )}
          </>
        )}

        {phase === "generating" && <LoadingView />}

        {phase === "results" && results && (
          <NarrativePlayback results={results} onReset={reset} />
        )}
      </NarrativeShell>
      )}
    </div>
  );
}
