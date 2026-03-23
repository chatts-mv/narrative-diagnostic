import { useRef, useEffect } from "react";

export default function V3WritingArea({ value, onChange, autoFocus, chipAppendedRef }) {
  const textareaRef = useRef(null);

  // Auto-grow height, preserving scroll position across the resize
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      const prevHeight = el.offsetHeight;
      const scrollY = window.scrollY;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
      window.scrollTo(0, scrollY);

      if (el.offsetHeight > prevHeight && chipAppendedRef?.current) {
        requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          if (rect.bottom > window.innerHeight - 100) {
            window.scrollBy({ top: rect.bottom - window.innerHeight + 120, behavior: "smooth" });
          }
        });
      }
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
