import { useState, useEffect } from "react";

const MESSAGES = [
  "Analysing your friction narrative...",
  "Identifying pain patterns...",
  "Building your personalised report...",
  "Mapping AI solutions to your challenges...",
];

export default function V3GeneratingView() {
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="v3-generating">
      <div className="v3-generating-spinner" />
      <p className="v3-generating-text">{MESSAGES[msgIdx]}</p>
    </div>
  );
}
