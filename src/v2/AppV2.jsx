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

// ── Omnipresent listening wave ────────────────────────────────────────────────
// Appears after first keystroke. Breathes gently at idle, livens up when
// the user types or the AI is processing — giving a constant sense of presence.
function ListeningWave({ visible, typing, processing }) {
  const duration = processing ? "0.45s" : typing ? "0.85s" : "2.6s";
  const color    = processing ? "#4A5FF7" : typing ? "#818CF8" : "#C7D2FE";
  // Stagger delays create a left-right wave shape
  const delays   = ["0s", "0.12s", "0.24s", "0.12s", "0s"];

  return (
    <div
      className="v2-wave"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.7s ease" }}
    >
      {delays.map((delay, i) => (
        <div
          key={i}
          className="v2-wave-bar"
          style={{
            background: color,
            animationDuration: duration,
            animationDelay: delay,
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
      minHeight: "80vh",
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

  // Reset wave on re-entry (start fresh / new session)
  useEffect(() => {
    if (phase === "splash" || phase === "role-capture") {
      setWaveVisible(false);
    }
  }, [phase]);

  // ── Chip reveal — same timing logic as V1 (4s delay if not yet typed) ────
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

  // ── Dynamic sub-copy — updates locally as narrative grows ─────────────────
  // In conversing phase, prefer AI-provided subCopy once it's been set.
  const displayPrompt = useMemo(() => {
    const useAiSubCopy = phase === "conversing" && currentPrompt.subCopy;
    return {
      ...currentPrompt,
      subCopy: useAiSubCopy
        ? currentPrompt.subCopy
        : getLocalSubCopy(narrative.length, processing),
    };
  }, [currentPrompt, narrative.length, phase, processing]);

  // ── Normalise chips for bottom bar ────────────────────────────────────────
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

      {/* ── Fixed logo header — visible on all post-splash phases ─────────── */}
      {phase !== "splash" && (
        <header className="v2-header">
          <img src="/MV-Logo.svg" alt="Multiverse" style={{ height: 28 }} />
        </header>
      )}

      {/* ── Role capture — centred below header ───────────────────────────── */}
      {phase === "role-capture" && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: "100vh", padding: "80px 20px 24px", boxSizing: "border-box",
        }}>
          <div style={{ maxWidth: 480, width: "100%" }}>
            <RoleCapture onComplete={handleRoleSubmit} />
          </div>
        </div>
      )}

      {/* ── Generating ────────────────────────────────────────────────────── */}
      {phase === "generating" && (
        <div style={{ paddingTop: 80 }}>
          <GeneratingView />
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {phase === "results" && results && (
        <div style={{ paddingTop: 80 }}>
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px 60px" }}>
            <NarrativePlayback results={results} onReset={reset} />
          </div>
        </div>
      )}

      {/* ── Narrative entry / conversing ──────────────────────────────────── */}
      {inNarrativePhase && (
        <div style={{
          maxWidth: 640,
          margin: "0 auto",
          // Top padding clears fixed header (60px) + breathing room (36px)
          // Bottom padding clears fixed bottom bar (~96px)
          padding: "96px 20px 112px",
          boxSizing: "border-box",
        }}>

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
          {/* Pass processing=false / isUserTyping=false so we suppress
              GuidancePrompt's built-in indicators — the wave handles those */}
          <GuidancePrompt
            prompt={displayPrompt}
            processing={false}
            isEntry={phase === "entry"}
            isUserTyping={false}
          />

          {/* Omnipresent listening wave — bridges prompt and textarea */}
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
                  borderRadius: 10, padding: "8px 18px",
                  fontSize: 13, fontWeight: 500,
                  fontFamily: "'Google Sans', sans-serif",
                  color: "#4A5FF7", cursor: "pointer",
                }}>Restore my text</button>
                <button onClick={handleStartFresh} style={{
                  background: "#fff", border: "1.5px solid #E5E7EB",
                  borderRadius: 10, padding: "8px 18px",
                  fontSize: 13, fontWeight: 500,
                  fontFamily: "'Google Sans', sans-serif",
                  color: "#6B7280", cursor: "pointer",
                }}>Start fresh</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom bar — chips OR CTA, pinned to viewport ─────────────────── */}
      {inNarrativePhase && (
        <div className="v2-bottom-bar">
          {readyForResults ? (
            /* CTA replaces chips once confidence threshold is hit */
            <button
              onClick={handleGenerateResults}
              className="v2-cta-btn"
            >
              Generate My Friction Report
            </button>
          ) : (
            /* Chips — staggered entry animation, same 4s reveal logic as V1 */
            chipsRevealed && normalizedChips.map((chip, i) => (
              <button
                key={`${chip.label}-${i}`}
                onClick={() => handleChipAppend(chip)}
                className="v2-chip-btn"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                {chip.label}
              </button>
            ))
          )}
        </div>
      )}

    </div>
  );
}
