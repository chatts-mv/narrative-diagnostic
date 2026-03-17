/**
 * ConfidenceMeter — white header bar with MV logo and a thin progress bar
 * at the bottom showing narrative coverage. Pulses when ready for results.
 */
export default function ConfidenceMeter({ confidence = 0, themes = [], ready = false }) {
  const label =
    confidence < 25 ? "Getting started..." :
    confidence < 50 ? "Building your story..." :
    confidence < 75 ? "Good depth, keep going..." :
    "Ready to generate your report!";

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
    }}>
      {/* White header bar */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #E5E7EB",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}>
        <img src="/MV-Logo.svg" alt="Multiverse" style={{ height: 28 }} />

        {/* Progress label — right side */}
        {confidence > 0 && (
          <div style={{
            position: "absolute",
            right: 24,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 11,
            color: "#9CA3AF",
            fontFamily: "'Google Sans', sans-serif",
            whiteSpace: "nowrap",
          }}>
            {label}
          </div>
        )}
      </div>

      {/* Progress bar — sits at the bottom of the header */}
      <div style={{
        height: 3,
        background: "#E5E7EB",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Fill */}
        <div
          className={`narrative-confidence-fill${ready ? " narrative-confidence-ready" : ""}`}
          style={{
            height: "100%",
            width: `${Math.min(100, confidence)}%`,
            background: ready
              ? "linear-gradient(90deg, #4A5FF7, #22C55E)"
              : "linear-gradient(90deg, #4A5FF7, #7B61FF)",
            transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Theme notches */}
        {themes.map((theme, i) => {
          const pos = Math.min(95, ((i + 1) / Math.max(themes.length, 4)) * 100);
          return (
            <div
              key={theme.id || i}
              style={{
                position: "absolute",
                top: 0,
                left: `${pos}%`,
                width: 2,
                height: "100%",
                background: "rgba(255,255,255,0.6)",
              }}
              title={theme.name}
            />
          );
        })}
      </div>
    </div>
  );
}
