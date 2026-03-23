import { useEffect, useRef, useCallback } from "react";
import V3Header from "./V3Header";
import V3SectionNav from "./V3SectionNav";
import V3LockedSection from "./V3LockedSection";
import V3ActiveSection from "./V3ActiveSection";
import V3BottomBar from "./V3BottomBar";

export default function V3Canvas({
  sections, activeSectionIndex, currentPrompt,
  readyForResults, onTextChange, onChipClick,
  onGenerate, phase, processing, roleSection,
}) {
  const prevActiveRef = useRef(activeSectionIndex);

  // Auto-scroll to new section when activeSectionIndex changes
  useEffect(() => {
    if (activeSectionIndex > prevActiveRef.current) {
      const el = document.getElementById(`v3-section-${activeSectionIndex}`);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    }
    prevActiveRef.current = activeSectionIndex;
  }, [activeSectionIndex]);

  const handleDotClick = useCallback((index) => {
    const el = document.getElementById(`v3-section-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const activeSection = sections[activeSectionIndex];
  const hasUserTyped = activeSection ? activeSection.text.length > 0 : false;

  return (
    <>
      <V3Header />
      <V3SectionNav
        sections={sections}
        activeSectionIndex={activeSectionIndex}
        onDotClick={handleDotClick}
      />

      <div className="v3-canvas-content">
        {/* Locked sections */}
        {sections.map((section, i) =>
          section.locked ? (
            <V3LockedSection key={section.id} section={section} index={i} />
          ) : null
        )}

        {/* Active section */}
        {activeSection && !activeSection.locked && (
          <V3ActiveSection
            section={activeSection}
            sectionIndex={activeSectionIndex}
            prompt={currentPrompt}
            onTextChange={onTextChange}
            processing={processing}
          />
        )}
      </div>

      <V3BottomBar
        chips={currentPrompt.chips}
        readyForResults={readyForResults}
        onChipClick={onChipClick}
        onGenerate={onGenerate}
        phase={phase}
        hasUserTyped={hasUserTyped}
        roleSection={roleSection}
      />
    </>
  );
}
