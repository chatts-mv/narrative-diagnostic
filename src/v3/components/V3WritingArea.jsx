import { useRef, useEffect } from "react";

export default function V3WritingArea({ value, onChange, autoFocus }) {
  const textareaRef = useRef(null);

  // Auto-grow height
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [value]);

  // Auto-focus when requested
  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => textareaRef.current?.focus(), 500);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  return (
    <textarea
      ref={textareaRef}
      className="v3-writing-area"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Start writing..."
      rows={1}
    />
  );
}
