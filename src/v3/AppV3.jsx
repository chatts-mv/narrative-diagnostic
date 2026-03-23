import { useCallback } from "react";
import "./v3.css";
import SplashScreen from "../components/SplashScreen";
import NarrativePlayback from "../components/NarrativePlayback";
import V3Canvas from "./components/V3Canvas";
import V3GeneratingView from "./components/V3GeneratingView";
import useNarrativeFlowV3 from "./hooks/useNarrativeFlowV3";

export default function AppV3() {
  const {
    state, handleTextChange, handleChipAppend,
    handleDismissSplash,
    handleGenerateResults, reset,
  } = useNarrativeFlowV3();

  const {
    phase, sections, activeSectionIndex,
    currentPrompt, readyForResults, processing, roleSection, results, error,
  } = state;

  const handleChipClick = useCallback((chip) => {
    handleChipAppend(chip);
  }, [handleChipAppend]);

  return (
    <div className="v3-root">
      {phase === "splash" && <SplashScreen onStart={handleDismissSplash} />}

      {phase === "writing" && (
        <V3Canvas
          sections={sections}
          activeSectionIndex={activeSectionIndex}
          currentPrompt={currentPrompt}
          readyForResults={readyForResults}
          onTextChange={handleTextChange}
          onChipClick={handleChipClick}
          onGenerate={handleGenerateResults}
          phase={phase}
          processing={processing}
          roleSection={roleSection}
        />
      )}

      {phase === "error" && (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF9F6",
          padding: "24px 20px",
        }}>
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 12,
            padding: "14px 18px",
            color: "#B91C1C",
            fontSize: 14,
            maxWidth: 480,
            textAlign: "center",
          }}>
            {error}
            <button
              onClick={reset}
              style={{
                display: "block",
                margin: "12px auto 0",
                background: "#fff",
                border: "1.5px solid #E5E7EB",
                borderRadius: 10,
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "'Google Sans', sans-serif",
                color: "#374151",
                cursor: "pointer",
              }}
            >
              Start over
            </button>
          </div>
        </div>
      )}

      {phase === "generating" && <V3GeneratingView />}

      {phase === "results" && results && (
        <div style={{
          minHeight: "100vh",
          background: "#FAF9F6",
          padding: "24px 20px",
        }}>
          <div style={{
            maxWidth: 640,
            margin: "0 auto",
            paddingTop: 40,
          }}>
            <NarrativePlayback results={results} onReset={reset} />
          </div>
        </div>
      )}
    </div>
  );
}
