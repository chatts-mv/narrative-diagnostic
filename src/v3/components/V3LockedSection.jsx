export default function V3LockedSection({ section, index }) {
  return (
    <div className="v3-locked-section" id={`v3-section-${index}`}>
      <p className="v3-section-label">
        SECTION {index + 1}: {section.label}
      </p>
      <h3 className="v3-section-summary">
        {section.summary}
      </h3>
      <p className="v3-section-original-text">
        {section.text}
      </p>
    </div>
  );
}
