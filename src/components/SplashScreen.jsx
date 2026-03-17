/**
 * SplashScreen — branded landing page that sets the tone before the diagnostic begins.
 * Multiverse wordmark, headline, meta indicators, and CTA button.
 */
import { useState, useEffect } from "react";

export default function SplashScreen({ onStart }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger staggered entrance after mount
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className="splash-screen"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#FAFBFC",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      {/* Logo */}
      <div
        className={visible ? "splash-fi splash-fi-1" : "splash-fi-hidden"}
        style={{ marginBottom: 48 }}
      >
        <img src="/MV-Logo.svg" alt="Multiverse" style={{ height: 28 }} />
      </div>

      {/* Headline */}
      <h1
        className={visible ? "splash-fi splash-fi-2" : "splash-fi-hidden"}
        style={{
          fontSize: 38,
          fontWeight: 800,
          fontFamily: "'Google Sans', sans-serif",
          lineHeight: 1.2,
          color: "#1A1A1A",
          margin: "0 0 20px",
          maxWidth: 520,
        }}
      >
        Where does your week{" "}
        <span style={{ color: "#9CA3AF" }}>actually</span>{" "}
        <span style={{ color: "#4A5FF7", fontStyle: "italic" }}>go</span>
        <span style={{ color: "#4A5FF7" }}>?</span>
      </h1>

      {/* Subtitle */}
      <p
        className={visible ? "splash-fi splash-fi-3" : "splash-fi-hidden"}
        style={{
          fontSize: 16,
          color: "#6B7280",
          lineHeight: 1.6,
          maxWidth: 440,
          margin: "0 0 36px",
        }}
      >
        Answer a few questions about how you work. Get a personalised breakdown of where
        time and momentum are quietly slipping away.
      </p>

      {/* Meta indicators */}
      <div
        className={visible ? "splash-fi splash-fi-4" : "splash-fi-hidden"}
        style={{
          display: "flex",
          gap: 20,
          justifyContent: "center",
          marginBottom: 44,
          flexWrap: "wrap",
        }}
      >
        {[
          { icon: "⏱", label: "~5 min" },
          { icon: "✦", label: "AI-guided" },
          { icon: "📊", label: "Personalised report" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              color: "#9CA3AF",
              fontFamily: "'Google Sans', sans-serif",
            }}
          >
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button
        className={visible ? "splash-fi splash-fi-5" : "splash-fi-hidden"}
        onClick={onStart}
        style={{
          background: "linear-gradient(135deg, #4A5FF7 0%, #7B61FF 100%)",
          color: "#fff",
          border: "none",
          borderRadius: 14,
          padding: "16px 36px",
          fontSize: 16,
          fontWeight: 600,
          fontFamily: "'Google Sans', sans-serif",
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(74, 95, 247, 0.3)",
          transition: "all 0.2s ease",
        }}
      >
        Start the diagnostic →
      </button>
    </div>
  );
}
