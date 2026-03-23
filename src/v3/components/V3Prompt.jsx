import { useState, useEffect, useRef } from "react";

export default function V3Prompt({ prompt, isHero }) {
  const [displayed, setDisplayed] = useState(prompt);
  const [animClass, setAnimClass] = useState("v3-prompt-enter");
  const prevHeadline = useRef(prompt?.headline);

  useEffect(() => {
    if (!prompt) return;
    if (prompt.headline !== prevHeadline.current) {
      setAnimClass("v3-prompt-exit");
      const timer = setTimeout(() => {
        setDisplayed(prompt);
        prevHeadline.current = prompt.headline;
        setAnimClass("v3-prompt-enter");
      }, 220);
      return () => clearTimeout(timer);
    } else {
      setDisplayed(prompt);
    }
  }, [prompt]);

  if (!displayed) return null;

  const positionClass = isHero ? "v3-prompt-hero" : "v3-prompt-settled";
  const headlineClass = isHero ? "v3-prompt-headline-hero" : "v3-prompt-headline-settled";

  return (
    <div className={`v3-prompt ${positionClass} ${animClass}`}>
      <h2 className={`v3-prompt-headline ${headlineClass}`}>
        {displayed.headline}
      </h2>
      {displayed.subCopy && (
        <p className="v3-prompt-subcopy">{displayed.subCopy}</p>
      )}
    </div>
  );
}
