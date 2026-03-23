import { useState, useEffect, useRef } from "react";
import V3ProcessingIndicator from "./V3ProcessingIndicator";
import V3Prompt from "./V3Prompt";
import V3WritingArea from "./V3WritingArea";

const TYPING_IDLE_MS = 1200;
const IDLE_NUDGE_MS = 4000;
const INITIAL_IDLE_MS = 5000;

export default function V3ActiveSection({ section, sectionIndex, prompt, onTextChange, processing, chipAppendedRef }) {
  const isFirstSection = sectionIndex === 0;
  const [hasUserTyped, setHasUserTyped] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const typingTimer = useRef(null);
  const idleTimer = useRef(null);
  const initialIdleTimer = useRef(null);
  const prevTextLen = useRef(section.text.length);
  const prevProcessing = useRef(false);

  useEffect(() => {
    if (section.text.length > 0 && !hasUserTyped) {
      setHasUserTyped(true);
    }
  }, [section.text, hasUserTyped]);

  // On section mount: if empty, start a timer to show idle nudge
  useEffect(() => {
    setHasUserTyped(section.text.length > 0);
    setIsIdle(false);
    setIsTyping(false);
    prevTextLen.current = section.text.length;
    clearTimeout(initialIdleTimer.current);
    clearTimeout(typingTimer.current);
    clearTimeout(idleTimer.current);

    if (section.text.length === 0) {
      initialIdleTimer.current = setTimeout(() => setIsIdle(true), INITIAL_IDLE_MS);
    }

    return () => clearTimeout(initialIdleTimer.current);
  }, [sectionIndex]);

  useEffect(() => {
    if (section.text.length !== prevTextLen.current && section.text.length > 0) {
      const wasChip = chipAppendedRef?.current;
      if (chipAppendedRef) chipAppendedRef.current = false;

      clearTimeout(initialIdleTimer.current);
      clearTimeout(typingTimer.current);
      clearTimeout(idleTimer.current);

      if (!wasChip) {
        setIsTyping(true);
        setIsIdle(false);
      }

      typingTimer.current = setTimeout(() => {
        setIsTyping(false);
        idleTimer.current = setTimeout(() => setIsIdle(true), IDLE_NUDGE_MS);
      }, TYPING_IDLE_MS);
    }
    prevTextLen.current = section.text.length;
    return () => {
      clearTimeout(typingTimer.current);
      clearTimeout(idleTimer.current);
    };
  }, [section.text]);

  useEffect(() => {
    if (processing) {
      setIsTyping(false);
      setIsIdle(false);
      clearTimeout(typingTimer.current);
      clearTimeout(idleTimer.current);
      clearTimeout(initialIdleTimer.current);
    } else if (prevProcessing.current) {
      idleTimer.current = setTimeout(() => setIsIdle(true), IDLE_NUDGE_MS);
    }
    prevProcessing.current = processing;
  }, [processing]);

  const isHero = isFirstSection && !hasUserTyped;
  const indicatorVisible = !isHero && (isTyping || processing || isIdle);
  const indicatorMode = processing ? "processing" : isTyping ? "typing" : "idle";

  return (
    <div className="v3-active-section" id={`v3-section-${sectionIndex}`}>
      <div className={isHero ? "" : "v3-prompt-sticky"}>
        <V3ProcessingIndicator visible={indicatorVisible} mode={indicatorMode} />
        <V3Prompt prompt={prompt} isHero={isHero} />
      </div>
      <V3WritingArea
        value={section.text}
        onChange={onTextChange}
        autoFocus={sectionIndex > 0}
      />
    </div>
  );
}
