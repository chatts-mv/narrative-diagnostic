import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "../narrative.css";
import "./v2.css";
import SplashScreen from "../components/SplashScreen";
import RoleCapture from "../components/RoleCapture";
import GuidancePrompt from "../components/GuidancePrompt";
import NarrativeTextarea from "../components/NarrativeTextarea";
import NarrativePlayback from "../components/NarrativePlayback";
import useNarrativeFlow from "../hooks/useNarrativeFlow";

// ── Dynamic sub-copy — reflects narrative depth, encourages more input ────────
function getLocalSubCopy(len, processing) {
  if (processing) return "Reading your narrative...";
  if (len === 0)   return "Describe a specific task or situation you keep running into.";
  if (len < 60)    return "Keep going — what else contributes to this?";
  if (len < 160)   return "Good detail. Any other recurring friction you'd add?";
  if (len < 320)   return "This is really useful. The more you share, the sharper your report.";
  if (len < 500)   return "Great depth — we're building a clear picture of your workflow.";
  return "Excellent context. We can generate your report whenever you're ready.";
}

// ── Centred phase wrapper ─────────────────────────────────────────────────────
// Consistent double-div centering used for role-capture, narrative, and results.
// Outer: clears the fixed header (paddingTop) + optional bottom clearance.
// Inner: flex column centred in the remaining viewport height.
function PhaseWrapper({ children, bottomClearance = 0, innerPadding = "24px 20px" }) {
  const headerH = 60;
  return (
    <div style={{
      paddingTop: headerH,
      paddingBottom: bottomClearance,
      minHeight: "100vh",
      boxSizing: "border-box",
    }}>
      <div style={{
        maxWidth: 640,
        margin: "0 auto",
        minHeight: `calc(100vh - ${headerH}px - ${bottomClearance}px)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: innerPadding,
        boxSizing: "border-box",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Omnipresent listening wave ────────────────────────────────────────────────
function ListeningWave({ visible, typing, processing }) {
  const isActive = processing || typing;
  const animName  = isActive ? "v2WaveBarActive" : "v2WaveBarIdle";
  const duration  = processing ? "0.45s" : typing ? "0.85s" : "2.6s";
  const color     = processing ? "#4A5FF7" : typing ? "#818CF8" : "#C7D2FE";
  const delays    = ["0s", "0.12s", "0.24s", "0.12s", "0s"];

  return (
    <div
      className="v2-wave"
      style={{
        opacity: visible ? 1 : 0,
        // Collapse to zero when hidden — eliminates the 52px blank gap
        height: visible ? "24px" : "0px",
        margin: visible ? "14px 0" : "0",
        overflow: "hidden",
        transition: "opacity 0.7s ease, height 0.4s ease, margin 0.4s ease",
      }}
    >
      {delays.map((delay, i) => (
        <div
          key={i}
          className="v2-wave-bar"
          style={{
            background: color,
            animationName: animName,
            animationDuration: duration,
            animationDelay: delay,
            transition: "background 0.5s ease",
          }}
        />
      ))}
    </div>
  );
}

// ── Generating/loading state ──────────────────────────────────────────────────
function GeneratingView() {
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
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      flex: 1,
    }}>
      <div style={{
        width: 36, height: 36, marginBottom: 24,
        border: "3px solid #E5E7EB", borderTopColor: "#4A5FF7",
        borderRadius: "50%", animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ fontSize: 15, color: "#6B7280", animation: "fadeInOut 2.5s ease-in-out infinite" }}>
        {messages[msgIdx]}
      </p>
    </div>
  );
}

// ── Main V2 App ───────────────────────────────────────────────────────────────
export default function AppV2() {
  const {
    state, handleTextChange, handleChipAppend,
    handleDismissSplash, handleRoleSubmit, handleAttach, handleRemoveAttachment,
    handleGenerateResults, handleRestoreNarrative, handleStartFresh, reset,
  } = useNarrativeFlow();

  const {
    narrative, attachments, phase, processing,
    currentPrompt, readyForResults,
    results, error, nudgeMessage, showRecovery, turns,
  } = state;

  // ── Typing detection — same debounce as V1 (1500ms) ──────────────────────
  const [isUserTyping, setIsUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const wrappedHandleTextChange = useCallback((text) => {
    handleTextChange(text);
    setIsUserTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsUserTyping(false), 1500);
  }, [handleTextChange]);

  useEffect(() => () => clearTimeout(typingTimeoutRef.current), []);

  // ── Wave visibility — appears on first keystroke, stays for session ───────
  const [waveVisible, setWaveVisible] = useState(false);
  useEffect(() => {
    if (narrative.length > 0 && !waveVisible) setWaveVisible(true);
  }, [narrative.length, waveVisible]);

  useEffect(() => {
    if (phase === "splash" || phase === "role-capture") setWaveVisible(false);
  }, [phase]);

  // ── Chip reveal — same 4s delay logic as V1 ──────────────────────────────
  const [chipsRevealed, setChipsRevealed] = useState(false);
  const chipsTimerRef = useRef(null);
  const userHasTypedRef = useRef(false);

  useEffect(() => {
    if (phase === "entry") {
      setChipsRevealed(false);
      userHasTypedRef.current = false;
      chipsTimerRef.current = setTimeout(() => {
        if (!userHasTypedRef.current) setChipsRevealed(true);
      }, 4000);
      return () => clearTimeout(chipsTimerRef.current);
    }
    if (phase === "conversing") setChipsRevealed(true);
  }, [phase]);

  useEffect(() => {
    if (phase === "entry" && narrative.length > 0) userHasTypedRef.current = true;
  }, [narrative, phase]);

  // ── "Conversation starters" label — show on reveal, hide on first chip click
  const [showChipsLabel, setShowChipsLabel] = useState(false);
  const prevChipsRevealedRef = useRef(false);

  useEffect(() => {
    // Show label whenever chips transition from hidden → revealed
    if (chipsRevealed && !prevChipsRevealedRef.current) {
      setShowChipsLabel(true);
    }
    prevChipsRevealedRef.current = chipsRevealed;
  }, [chipsRevealed]);

  // Also hide label when phase advances past entry (AI has responded)
  useEffect(() => {
    if (phase === "conversing") setShowChipsLabel(false);
  }, [phase]);

  const handleChipClick = useCallback((chip) => {
    handleChipAppend(chip);
    setShowChipsLabel(false);
  }, [handleChipAppend]);

  // ── Dynamic sub-copy — updates live as narrative grows ────────────────────
  const displayPrompt = useMemo(() => {
    const useAiSubCopy = phase === "conversing" && currentPrompt.subCopy;
    return {
      ...currentPrompt,
      subCopy: useAiSubCopy
        ? currentPrompt.subCopy
        : getLocalSubCopy(narrative.length, processing),
    };
  }, [currentPrompt, narrative.length, phase, processing]);

  // ── Normalise chips ───────────────────────────────────────────────────────
  const normalizedChips = useMemo(() =>
    (currentPrompt.chips || []).map(c =>
      typeof c === "string" ? { label: c, expandedText: null } : c
    ), [currentPrompt.chips]
  );

  const inNarrativePhase = phase === "entry" || phase === "conversing" || phase === "error";

  return (
    <div style={{ minHeight: "100vh", background: "#FAFBFC" }}>

      {/* ── Splash ─────────────────────────────────────────────────────────── */}
      {phase === "splash" && <SplashScreen onStart={handleDismissSplash} />}

      {/* ── Fixed logo header — all post-splash phases ────────────────────── */}
      {phase !== "splash" && (
        <header className="v2-header">
          <img src="/MV-Logo.svg" alt="Multiverse" style={{ height: 28 }} />
        </header>
      )}

      {/* ── Role capture — centred in viewport ───────────────────────────── */}
      {phase === "role-capture" && (
        <PhaseWrapper innerPadding="24px 20px">
          <div style={{ maxWidth: 480, width: "100%", margin: "0 auto" }}>
            <RoleCapture onComplete={handleRoleSubmit} />
          </div>
        </PhaseWrapper>
      )}

      {/* ── Generating — centred spinner ──────────────────────────────────── */}
      {phase === "generating" && (
        <PhaseWrapper>
          <GeneratingView />
        </PhaseWrapper>
      )}

      {/* ── Results — centred in viewport ────────────────────────────────── */}
      {phase === "results" && results && (
        <PhaseWrapper innerPadding="24px 20px">
          <NarrativePlayback results={results} onReset={reset} />
        </PhaseWrapper>
      )}

      {/* ── Narrative entry / conversing ──────────────────────────────────── */}
      {inNarrativePhase && (
        // bottomClearance=120 ensures content never scrolls behind the fixed bottom bar
        <PhaseWrapper bottomClearance={120} innerPadding="24px 20px">

          {/* Error banner */}
          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: 12, padding: "14px 18px", marginBottom: 20,
              color: "#B91C1C", fontSize: 14,
            }}>
              {error}
            </div>
          )}

          {/* Guidance prompt — headline + dynamic sub-copy */}
          {/* isEntry locked to false: keeps font size consistent (22px) throughout.
              Passing true caused a visible 28→22px shrink on first AI response. */}
          <GuidancePrompt
            prompt={displayPrompt}
            processing={false}
            isEntry={false}
            isUserTyping={false}
          />

          {/* Omnipresent listening wave */}
          <ListeningWave
            visible={waveVisible}
            typing={isUserTyping}
            processing={processing}
          />

          {/* Textarea */}
          <NarrativeTextarea
            value={narrative}
            onChange={wrappedHandleTextChange}
            attachments={attachments}
            onAttach={handleAttach}
            onRemoveAttachment={handleRemoveAttachment}
            attachmentRequest={currentPrompt.attachmentRequest}
            processing={processing}
            turnsCount={turns.length}
          />

          {/* Nudge message */}
          {nudgeMessage && !processing && (
            <div className="narrative-nudge">{nudgeMessage}</div>
          )}

          {/* Recovery prompt */}
          {showRecovery && (
            <div style={{
              textAlign: "center", margin: "20px 0",
              padding: "16px 20px", background: "#F9FAFB",
              borderRadius: 14, border: "1px solid #E5E7EB",
            }}>
              <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 12px" }}>
                Looks like you cleared your text. Want to pick up where you left off?
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={handleRestoreNarrative} style={{
                  background: "#fff", border: "1.5px solid #4A5FF7",
                  borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 500,
                  fontFamily: "'Google Sans', sans-serif", color: "#4A5FF7", cursor: "pointer",
                }}>Restore my text</button>
                <button onClick={handleStartFresh} style={{
                  background: "#fff", border: "1.5px solid #E5E7EB",
                  borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 500,
                  fontFamily: "'Google Sans', sans-serif", color: "#6B7280", cursor: "pointer",
                }}>Start fresh</button>
              </div>
            </div>
          )}
        </PhaseWrapper>
      )}

      {/* ── Bottom bar — chips OR CTA, pinned to viewport ─────────────────── */}
      {inNarrativePhase && (
        <div className="v2-bottom-bar">
          {readyForResults ? (
            <button onClick={handleGenerateResults} className="v2-cta-btn">
              Generate My Friction Report
            </button>
          ) : chipsRevealed && normalizedChips.length > 0 && (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              {/* "Conversation starters" label — fades in with chips, gone after first click */}
              {showChipsLabel && (
                <div className="v2-chips-label">Conversation starters</div>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {normalizedChips.map((chip, i) => (
                  <button
                    key={`${chip.label}-${i}`}
                    onClick={() => handleChipClick(chip)}
                    className="v2-chip-btn"
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
