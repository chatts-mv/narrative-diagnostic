export default function V3SectionNav({ sections, activeSectionIndex, onDotClick }) {
  if (sections.length <= 1) return null;

  return (
    <div className="v3-section-nav">
      {sections.map((section, i) => (
        <button
          key={section.id}
          className={[
            "v3-nav-dot",
            i === activeSectionIndex ? "v3-nav-dot-active" : "",
            section.locked ? "v3-nav-dot-locked" : "",
          ].filter(Boolean).join(" ")}
          onClick={() => onDotClick(i)}
          aria-label={`Section ${i + 1}${section.label ? ": " + section.label : ""}`}
        />
      ))}
    </div>
  );
}
