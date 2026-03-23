import { useState, useEffect, useRef } from "react";

const TYPING_LABELS = ["Keep going", "Listening"];
const PROCESSING_LABELS = ["Analysing content", "Thinking"];
const IDLE_LABELS = ["Keep writing", "Try a prompt below for inspiration"];
const CYCLE_MS = 3000;

function getLabels(mode) {
  if (mode === "typing") return TYPING_LABELS;
  if (mode === "idle") return IDLE_LABELS;
  return PROCESSING_LABELS;
}

export default function V3ProcessingIndicator({ visible, mode = "processing" }) {
  const [labelIndex, setLabelIndex] = useState(0);
  const [fade, setFade] = useState("v3-pi-label-in");
  const intervalRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const labelsRef = useRef(getLabels(mode));
  const prevMode = useRef(mode);

  // Keep labelsRef in sync
  labelsRef.current = getLabels(mode);

  // On mode change: crossfade to the first label of the new set
  useEffect(() => {
    if (mode !== prevMode.current) {
      prevMode.current = mode;
      clearTimeout(fadeTimerRef.current);
      setFade("v3-pi-label-out");
      fadeTimerRef.current = setTimeout(() => {
        setLabelIndex(0);
        setFade("v3-pi-label-in");
      }, 250);
    }
  }, [mode]);

  // Cycle interval — only restarts when visibility changes
  useEffect(() => {
    clearInterval(intervalRef.current);

    if (!visible) {
      clearTimeout(fadeTimerRef.current);
      setLabelIndex(0);
      setFade("v3-pi-label-in");
      return;
    }

    intervalRef.current = setInterval(() => {
      setFade("v3-pi-label-out");
      fadeTimerRef.current = setTimeout(() => {
        setLabelIndex(i => (i + 1) % labelsRef.current.length);
        setFade("v3-pi-label-in");
      }, 250);
    }, CYCLE_MS);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(fadeTimerRef.current);
    };
  }, [visible]);

  const labels = labelsRef.current;

  return (
    <div className={`v3-processing-indicator ${visible ? "v3-processing-visible" : ""}`}>
      <span className="v3-pi-sparkle">&#x2726;</span>
      <span className={`v3-pi-label ${fade}`}>{labels[labelIndex % labels.length]}</span>
    </div>
  );
}
