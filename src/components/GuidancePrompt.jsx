import { useState, useEffect, useRef } from "react";

/**
 * GuidancePrompt — renders the AI's current question/prompt above the textarea.
 * Animates smoothly when the prompt changes (fade out old, fade in new).
 */
export default function GuidancePrompt({ prompt, processing, isEntry, isUserTyping }) {
  const [displayed, setDisplayed] = useState(prompt);
  const [animClass, setAnimClass] = useState("narrative-prompt-enter");
  const prevHeadline = useRef(prompt?.headline);

  useEffect(() => {
    if (!prompt) return;
    // If headline changed, animate transition
    if (prompt.headline !== prevHeadline.current) {
      setAnimClass("narrative-prompt-exit");
      const timer = setTimeout(() => {
        setDisplayed(prompt);
        setAnimClass("narrative-prompt-enter");
        prevHeadline.current = prompt.headline;
      }, 280);
      return () => clearTimeout(timer);
    } else {
      setDisplayed(prompt);
    }
  }, [prompt]);

  if (!displayed) return null;

  return (
    <div
      className={animClass}
      style={{
        textAlign: "center",
        marginBottom: isEntry ? 28 : 20,
        position: "relative",
        // Fixed minHeight prevents layout collapse during the 280ms headline
        // swap transition — the container holds its space even while content
        // is invisible (opacity: 0), so nothing below it shifts.
        minHeight: isEntry ? 120 : 100,
      }}
    >
      <h2
        className="narrative-prompt-headline"
        style={{
          fontSize: isEntry ? 28 : 22,
          fontWeight: 700,
          color: "#1A1A1A",
          margin: "0 0 8px",
          lineHeight: 1.3,
          transition: "font-size 0.3s ease",
        }}
      >
        {displayed.headline}
      </h2>
      {displayed.subCopy && (
        <p
          className="narrative-prompt-subcopy"
          style={{
            fontSize: 14,
            color: "#6B7280",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {displayed.subCopy}
        </p>
      )}

      {/* Fixed-height indicator slot — prevents layout shift */}
      <div style={{
        height: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
        position: "relative",
      }}>
        {/* Thinking dots — real API processing */}
        <div
          className="narrative-thinking-dots"
          style={{
            opacity: processing ? 1 : 0,
            transition: "opacity 0.25s ease",
            position: "absolute",
          }}
        >
          <span className="narrative-thinking-dot" />
          <span className="narrative-thinking-dot" />
          <span className="narrative-thinking-dot" />
        </div>

        {/* Listening bar — user typing, API not yet called */}
        <div
          className="narrative-listening-indicator"
          style={{
            opacity: (!processing && isUserTyping) ? 1 : 0,
            transition: "opacity 0.3s ease",
            position: "absolute",
          }}
        >
          <span className="narrative-listening-bar" />
        </div>
      </div>
    </div>
  );
}
