import { useState, useRef, useEffect } from "react";

const SENIORITY_OPTIONS = [
  "Junior", "Mid-level", "Senior", "Lead", "Manager", "Director+",
];

/**
 * RoleCapture — lightweight conversational preamble that captures
 * the user's job title and seniority level before the narrative canvas.
 */
export default function RoleCapture({ onComplete }) {
  const [jobTitle, setJobTitle] = useState("");
  const [seniority, setSeniority] = useState("");
  const [exiting, setExiting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-focus the input on mount
    const t = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  const titleReady = jobTitle.trim().length >= 2;
  const isValid = titleReady && seniority;

  function handleSubmit() {
    if (!isValid) return;
    setExiting(true);
    setTimeout(() => {
      onComplete({ jobTitle: jobTitle.trim(), seniority });
    }, 260);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && isValid) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div
      className={exiting ? "role-capture-exit" : "role-capture-enter"}
      style={{
        textAlign: "center",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <h2 style={{
        fontSize: 28,
        fontWeight: 700,
        color: "#1A1A1A",
        margin: "0 0 8px",
        lineHeight: 1.3,
      }}>
        What's your role?
      </h2>

      <p style={{
        fontSize: 14,
        color: "#6B7280",
        margin: "0 0 32px",
        lineHeight: 1.5,
      }}>
        This helps us ask the right questions.
      </p>

      {/* Job title input */}
      <input
        ref={inputRef}
        type="text"
        value={jobTitle}
        onChange={(e) => setJobTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. Product Designer, Data Analyst, Engineering Manager"
        style={{
          width: "100%",
          padding: "14px 18px",
          fontSize: 15,
          fontFamily: "'Google Sans', sans-serif",
          border: "1.5px solid #E5E7EB",
          borderRadius: 14,
          outline: "none",
          background: "#fff",
          color: "#1A1A1A",
          boxSizing: "border-box",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#4A5FF7";
          e.target.style.boxShadow = "0 0 0 3px rgba(74, 95, 247, 0.1)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#E5E7EB";
          e.target.style.boxShadow = "none";
        }}
      />

      {/* Seniority pills — appear after title has ≥2 chars */}
      {titleReady && (
        <div className="seniority-pills-enter" style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
          marginTop: 24,
          marginBottom: 32,
        }}>
          {SENIORITY_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setSeniority(opt)}
              style={{
                background: seniority === opt ? "#4A5FF7" : "#fff",
                color: seniority === opt ? "#fff" : "#374151",
                border: seniority === opt ? "1.5px solid #4A5FF7" : "1.5px solid #E5E7EB",
                borderRadius: 20,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "'Google Sans', sans-serif",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Continue button */}
      <button
        onClick={handleSubmit}
        disabled={!isValid}
        style={{
          marginTop: 28,
          background: isValid
            ? "linear-gradient(135deg, #4A5FF7 0%, #7B61FF 100%)"
            : "#E5E7EB",
          color: isValid ? "#fff" : "#9CA3AF",
          border: "none",
          borderRadius: 14,
          padding: "14px 36px",
          fontSize: 15,
          fontWeight: 600,
          fontFamily: "'Google Sans', sans-serif",
          cursor: isValid ? "pointer" : "default",
          boxShadow: isValid ? "0 4px 14px rgba(74, 95, 247, 0.3)" : "none",
          transition: "all 0.25s ease",
          opacity: isValid ? 1 : 0.7,
        }}
      >
        Continue →
      </button>
    </div>
  );
}
