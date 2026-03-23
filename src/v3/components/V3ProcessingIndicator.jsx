import { useState, useEffect, useRef } from "react";

const TYPING_LABELS = ["Keep going", "Listening"];
const PROCESSING_LABELS = ["Analysing content", "Thinking"];
const IDLE_LABELS = ["Keep writing", "Try a prompt below for inspiration"];
const CYCLE_MS = 3000;

export default function V3ProcessingIndicator({ visible, mode = "processing" }) {
  const labels = mode === "typing" ? TYPING_LABELS
    : mode === "idle" ? IDLE_LABELS
    : PROCESSING_LABELS;
  const [labelIndex, setLabelIndex] = useState(0);
  const [fade, setFade] = useState("v3-pi-label-in");
  const intervalRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const prevMode = useRef(mode);

  useEffect(() => {
    if (mode !== prevMode.current) {
      clearTimeout(fadeTimerRef.current);
      setFade("v3-pi-label-out");
      fadeTimerRef.current = setTimeout(() => {
        setLabelIndex(0);
        setFade("v3-pi-label-in");
      }, 250);
      prevMode.current = mode;
    }
  }, [mode]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    clearTimeout(fadeTimerRef.current);
    if (!visible) {
      setLabelIndex(0);
      setFade("v3-pi-label-in");
      return;
    }

    intervalRef.current = setInterval(() => {
      setFade("v3-pi-label-out");
      fadeTimerRef.current = setTimeout(() => {
        setLabelIndex(i => (i + 1) % labels.length);
        setFade("v3-pi-label-in");
      }, 250);
    }, CYCLE_MS);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(fadeTimerRef.current);
    };
  }, [visible, labels]);

  return (
    <div className={`v3-processing-indicator ${visible ? "v3-processing-visible" : ""}`}>
      <span className="v3-pi-sparkle">&#x2726;</span>
      <span className={`v3-pi-label ${fade}`}>{labels[labelIndex]}</span>
    </div>
  );
}
