/**
 * NarrativeChips — contextual suggestion chips that append text to the textarea.
 * Supports both plain strings and {label, expandedText} objects.
 *
 * Uses a generation counter to force stagger-animation replay when chips change,
 * WITHOUT clearing the rendered chips first (which would cause layout shift from
 * the container briefly collapsing to zero height).
 */
import { useState, useEffect, useRef } from "react";

function normalizeChip(c) {
  return typeof c === "string" ? { label: c, expandedText: null } : c;
}

function chipKey(chips) {
  return (chips || []).map(c => (typeof c === "string" ? c : c.label)).join(",");
}

export default function NarrativeChips({ chips = [], onSelect, headerLabel }) {
  const normalized = chips.map(normalizeChip);
  const [gen, setGen] = useState(0);
  const prevKey = useRef(chipKey(chips));

  // Increment generation when chips change — forces new React keys so the
  // CSS stagger animation replays without clearing the container first.
  useEffect(() => {
    const key = chipKey(chips);
    if (key !== prevKey.current) {
      setGen(g => g + 1);
      prevKey.current = key;
    }
  }, [chips]);

  if (!normalized || normalized.length === 0) return null;

  return (
    <div style={{ textAlign: "center", marginBottom: 20 }}>
      {headerLabel && (
        <div className="narrative-chips-header" style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#9CA3AF",
          letterSpacing: "0.3px",
          marginBottom: 10,
        }}>
          {headerLabel}
        </div>
      )}
      <div
        className="narrative-chips"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
        }}
      >
        {normalized.map((chip, i) => (
          <button
            key={`${gen}-${chip.label}-${i}`}
            onClick={() => onSelect(chip)}
            style={{
              background: "#fff",
              border: "1.5px solid #E5E7EB",
              borderRadius: 20,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "'Google Sans', sans-serif",
              color: "#374151",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
