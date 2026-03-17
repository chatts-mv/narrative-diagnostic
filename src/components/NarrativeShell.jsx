/**
 * NarrativeShell — max-width centered container for the V4 narrative canvas.
 *
 * `centered` (default) uses justify-content:center for phases where content is
 * static (role-capture, generating, results). For entry/conversing phases pass
 * `centered={false}` so content is anchored to the top — this prevents the
 * entire page from shifting when child heights change (headline length, chips,
 * indicator slot, etc.).
 */
export default function NarrativeShell({ children, centered = true }) {
  return (
    <div
      className="narrative-shell"
      style={{
        maxWidth: 680,
        margin: "0 auto",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: centered ? "center" : "flex-start",
        padding: centered
          ? "72px 20px 24px"
          : "max(72px, 20vh) 20px 24px",
        fontFamily: "'Google Sans', 'Inter', system-ui, sans-serif",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}
