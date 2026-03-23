import { useState, useEffect, useRef, useCallback } from "react";

export default function V3BottomBar({
  chips, readyForResults, onChipClick, onGenerate,
  phase, hasUserTyped, roleSection,
}) {
  const [chipsRevealed, setChipsRevealed] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const timerRef = useRef(null);
  const userTypedRef = useRef(false);

  // Chip reveal: 4s delay if user hasn't typed, immediate if conversing
  useEffect(() => {
    if (!hasUserTyped && chips.length > 0) {
      userTypedRef.current = false;
      timerRef.current = setTimeout(() => {
        if (!userTypedRef.current) {
          setChipsRevealed(true);
          setShowLabel(true);
        }
      }, 4000);
      return () => clearTimeout(timerRef.current);
    }
    if (hasUserTyped && chips.length > 0) {
      setChipsRevealed(true);
      setShowLabel(false);
    }
  }, [chips, hasUserTyped]);

  useEffect(() => {
    if (hasUserTyped) userTypedRef.current = true;
  }, [hasUserTyped]);

  const handleClick = useCallback((chip) => {
    onChipClick(chip);
    setShowLabel(false);
  }, [onChipClick]);

  if (phase !== "writing") return null;

  const normalizedChips = (chips || []).map(c =>
    typeof c === "string" ? { label: c, expandedText: null } : c
  );

  return (
    <div className="v3-bottom-bar">
      {readyForResults ? (
        <button onClick={onGenerate} className="v3-cta-btn">
          Generate My Friction Report
        </button>
      ) : chipsRevealed && normalizedChips.length > 0 && (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          {showLabel && !roleSection && (
            <div className="v3-chips-label">Conversation starters</div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {normalizedChips.map((chip, i) => (
              <button
                key={`${chip.label}-${i}`}
                onClick={() => handleClick(chip)}
                className="v3-chip-btn"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
