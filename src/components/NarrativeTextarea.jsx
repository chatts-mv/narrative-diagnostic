import { useRef, useEffect, useCallback } from "react";
import { Paperclip, X } from "lucide-react";

/**
 * NarrativeTextarea — the omnipresent growing textarea with file upload.
 * Auto-grows as user types. No send button — AI auto-processes on typing pause.
 */
export default function NarrativeTextarea({
  value,
  onChange,
  attachments = [],
  onAttach,
  onRemoveAttachment,
  attachmentRequest,
  processing,
  turnsCount = 0,
}) {
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  // Auto-grow textarea height + scroll to bottom so latest text is visible
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.max(120, Math.min(el.scrollHeight, window.innerHeight * 0.32));
    el.style.height = newHeight + "px";
    // Scroll to bottom so newly appended text (e.g. from chip) is visible
    el.scrollTop = el.scrollHeight;
  }, [value]);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) return; // 5MB max
      const reader = new FileReader();
      reader.onload = () => {
        onAttach?.({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result,
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }, [onAttach]);

  const placeholder = turnsCount === 0
    ? "Start writing..."
    : "Keep going...";

  return (
    <div style={{ width: "100%" }}>
      {/* Attachment request from AI */}
      {attachmentRequest && (
        <div
          className="narrative-attachment-request"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            marginBottom: 10,
            background: "#EEF2FF",
            border: "1px solid #C7D2FE",
            borderRadius: 10,
            fontSize: 13,
            color: "#4338CA",
            cursor: "pointer",
          }}
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip size={14} style={{ flexShrink: 0 }} />
          <span>{attachmentRequest}</span>
        </div>
      )}

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div style={{
          display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap",
        }}>
          {attachments.map((att, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 8,
              background: "#F3F4F6", fontSize: 12, color: "#6B7280",
            }}>
              {att.type?.startsWith("image/") && (
                <img src={att.dataUrl} alt="" style={{
                  width: 24, height: 24, borderRadius: 4, objectFit: "cover",
                }} />
              )}
              <span style={{
                maxWidth: 120, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {att.name}
              </span>
              <button onClick={() => onRemoveAttachment?.(i)} style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 0, display: "flex", color: "#9CA3AF",
              }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Textarea container */}
      <div style={{
        background: "#fff",
        border: "1.5px solid #E5E7EB",
        borderRadius: 16,
        padding: "12px 14px 8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        transition: "border-color 0.2s ease",
      }}>
        {/* The textarea — full width, no flex sibling pushing it right */}
        <textarea
          ref={textareaRef}
          className="narrative-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            display: "block",
            width: "100%",
            border: "none",
            outline: "none",
            fontSize: 15,
            fontFamily: "'Google Sans', 'Inter', system-ui, sans-serif",
            color: "#1A1A1A",
            background: "transparent",
            resize: "none",
            minHeight: 120,
            maxHeight: "32vh",
            lineHeight: 1.6,
            padding: 0,
            boxSizing: "border-box",
          }}
        />

        {/* Bottom toolbar — attachment icon sits below the text */}
        <div style={{ display: "flex", alignItems: "center", marginTop: 6 }}>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              background: "none", border: "none",
              cursor: "pointer", padding: 4,
              display: "flex", color: "#9CA3AF",
            }}
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,.pdf,.csv,.xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* Processing indicator */}
      {processing && (
        <div style={{
          textAlign: "center",
          marginTop: 8,
          fontSize: 12,
          color: "#9CA3AF",
        }}>
          Processing your narrative...
        </div>
      )}
    </div>
  );
}
