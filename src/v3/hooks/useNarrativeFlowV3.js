/**
 * useNarrativeFlowV3 — V3 state machine with section support.
 * Self-contained: does NOT import useNarrativeFlow.js.
 */
import { useReducer, useCallback, useRef, useEffect } from "react";
import useNarrativeGuideV3 from "./useNarrativeGuideV3";
import { getRoleAwareChips } from "../../lib/roleChips";

// ── Helpers ──────────────────────────────────────────────────────────

function makeSection(index) {
  return {
    id: `section_${index}`,
    text: "",
    locked: false,
    summary: null,
    label: null,
    themes: [],
  };
}

function buildInitialPrompt(userRole) {
  if (!userRole) {
    return {
      headline: "What's the biggest thing that drains your energy at work each week?",
      subCopy: "Describe a specific task or situation.",
      chips: getRoleAwareChips("", ""),
      attachmentRequest: null,
    };
  }
  const { jobTitle, seniority } = userRole;
  return {
    headline: "What drains your energy most each week?",
    subCopy: "Describe a specific task or situation you keep running into.",
    chips: getRoleAwareChips(jobTitle, seniority),
    attachmentRequest: null,
  };
}

// ── Initial state ────────────────────────────────────────────────────

const initialState = {
  phase: "splash",
  userRole: null,

  sections: [makeSection(0)],
  activeSectionIndex: 0,

  currentPrompt: { headline: "", subCopy: "", chips: [], attachmentRequest: null },
  processing: false,
  lastProcessedLength: 0,
  sectionTurnCount: 0,
  turns: [],
  themes: [],
  confidence: 0,
  readyForResults: false,

  detectedRole: null,
  detectedContext: {},

  results: null,
  error: null,
};

// ── Reducer ──────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case "DISMISS_SPLASH":
      return { ...state, phase: "role-capture" };

    case "SET_USER_ROLE":
      return {
        ...state,
        userRole: action.userRole,
        detectedRole: `${action.userRole.seniority} ${action.userRole.jobTitle}`,
        detectedContext: { seniority: action.userRole.seniority },
        currentPrompt: action.initialPrompt,
        phase: "writing",
        sections: [makeSection(0)],
        activeSectionIndex: 0,
      };

    case "SET_SECTION_TEXT": {
      const sections = state.sections.map((s, i) =>
        i === state.activeSectionIndex ? { ...s, text: action.text } : s
      );
      return { ...state, sections };
    }

    case "SET_PROCESSING":
      return { ...state, processing: action.value };

    case "RECORD_TURN":
      return {
        ...state,
        turns: [...state.turns, { userText: action.text, timestamp: Date.now() }],
        lastProcessedLength: state.sections[state.activeSectionIndex].text.length,
        sectionTurnCount: state.sectionTurnCount + 1,
      };

    case "SET_PROMPT":
      return { ...state, currentPrompt: action.prompt };

    case "UPDATE_GUIDANCE": {
      let nextState = {
        ...state,
        themes: action.themes,
        confidence: Math.max(state.confidence, action.confidence),
        detectedRole: action.detectedRole ?? state.detectedRole,
        detectedContext: { ...state.detectedContext, ...(action.detectedContext || {}) },
        processing: false,
      };

      const activeText = state.sections[state.activeSectionIndex].text;
      const aiWantsComplete = action.sectionComplete && action.sectionSummary && activeText.length >= 40;
      const forceComplete = !aiWantsComplete && state.sectionTurnCount >= 4 && activeText.length >= 80;

      if (aiWantsComplete || forceComplete) {
        const sections = [...nextState.sections];
        sections[state.activeSectionIndex] = {
          ...sections[state.activeSectionIndex],
          locked: true,
          summary: aiWantsComplete
            ? action.sectionSummary
            : activeText.slice(0, 60).replace(/\s+\S*$/, "") + "...",
          label: (aiWantsComplete && action.sectionLabel)
            ? action.sectionLabel
            : `FRICTION POINT`,
          themes: (action.themes || []).map(t => t.name),
        };
        const newIndex = sections.length;
        sections.push(makeSection(newIndex));

        nextState = {
          ...nextState,
          sections,
          activeSectionIndex: newIndex,
          lastProcessedLength: 0,
          sectionTurnCount: 0,
        };
      }

      const lockedCount = nextState.sections.filter(s => s.locked).length;
      nextState.readyForResults = lockedCount >= 3;

      return nextState;
    }

    case "SET_PHASE":
      return { ...state, phase: action.phase, error: null };

    case "SET_RESULTS":
      return { ...state, results: action.results, phase: "results" };

    case "SET_ERROR":
      return { ...state, error: action.error, phase: "error", processing: false };

    case "RESET":
      return { ...initialState };

    default:
      return state;
  }
}

// ── Tiered debounce ──────────────────────────────────────────────────

const TIERS = [
  { minChars: 10, debounceMs: 3000 },
  { minChars: 20, debounceMs: 2000 },
  { minChars: 40, debounceMs: 1500 },
];

// ── Hook ─────────────────────────────────────────────────────────────

export default function useNarrativeFlowV3() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const { processNarrative, generateResults } = useNarrativeGuideV3();

  const debounceTimersRef = useRef([]);

  // ── Text change ──
  const handleTextChange = useCallback((text) => {
    dispatch({ type: "SET_SECTION_TEXT", text });
  }, []);

  // ── Splash / role ──
  const handleDismissSplash = useCallback(() => {
    dispatch({ type: "DISMISS_SPLASH" });
  }, []);

  const handleRoleSubmit = useCallback((userRole) => {
    const initialPrompt = buildInitialPrompt(userRole);
    dispatch({ type: "SET_USER_ROLE", userRole, initialPrompt });
  }, []);

  // ── Chip append ──
  const handleChipAppend = useCallback((chip) => {
    const s = stateRef.current;
    const activeSection = s.sections[s.activeSectionIndex];
    let textToAppend = (typeof chip === "string") ? chip : (chip.expandedText || chip.label);
    if (textToAppend && !/[.!?]$/.test(textToAppend)) {
      textToAppend += ".";
    }
    const isRich = typeof chip !== "string" && chip.expandedText;
    const connector = activeSection.text.trim().length > 0 ? (isRich ? "\n\n" : " ") : "";
    dispatch({ type: "SET_SECTION_TEXT", text: activeSection.text + connector + textToAppend });
  }, []);

  // ── Tiered debounced auto-process ──
  useEffect(() => {
    debounceTimersRef.current.forEach(id => clearTimeout(id));
    debounceTimersRef.current = [];

    const s = stateRef.current;
    if (s.phase !== "writing") return;

    const activeSection = s.sections[s.activeSectionIndex];
    if (!activeSection || activeSection.locked) return;

    const newChars = activeSection.text.length - s.lastProcessedLength;

    for (const tier of TIERS) {
      if (newChars >= tier.minChars) {
        const timerId = setTimeout(async () => {
          const s2 = stateRef.current;
          const sec = s2.sections[s2.activeSectionIndex];
          if (s2.processing) return;
          if (!sec || sec.locked) return;
          if (sec.text.length - s2.lastProcessedLength < tier.minChars) return;

          const newText = sec.text.slice(s2.lastProcessedLength).trim();
          if (!newText) return;

          dispatch({ type: "SET_PROCESSING", value: true });
          dispatch({ type: "RECORD_TURN", text: newText });

          const completedSections = s2.sections
            .filter(s => s.locked)
            .map(s => ({ label: s.label, summary: s.summary }));

          try {
            const result = await processNarrative(
              newText,
              s2.turns,
              s2.themes,
              s2.detectedRole,
              s2.detectedContext,
              s2.activeSectionIndex,
              completedSections,
              s2.sectionTurnCount + 1,
            );

            dispatch({ type: "SET_PROMPT", prompt: result.prompt });
            dispatch({
              type: "UPDATE_GUIDANCE",
              themes: result.themes,
              confidence: result.confidence,
              readyForResults: result.readyForResults,
              detectedRole: result.detectedRole,
              detectedContext: result.detectedContext,
              sectionComplete: result.sectionComplete,
              sectionSummary: result.sectionSummary,
              sectionLabel: result.sectionLabel,
            });
          } catch (e) {
            console.error("V3 auto-process failed:", e);
            dispatch({ type: "SET_PROCESSING", value: false });
          }
        }, tier.debounceMs);

        debounceTimersRef.current.push(timerId);
      }
    }

    return () => {
      debounceTimersRef.current.forEach(id => clearTimeout(id));
    };
  }, [state.sections, state.activeSectionIndex, processNarrative]);

  // ── Generate results ──
  const handleGenerateResults = useCallback(async () => {
    debounceTimersRef.current.forEach(id => clearTimeout(id));
    debounceTimersRef.current = [];

    dispatch({ type: "SET_PHASE", phase: "generating" });

    try {
      const s = stateRef.current;
      const fullNarrative = s.sections.map(sec => sec.text).filter(Boolean).join("\n\n");
      const results = await generateResults(
        fullNarrative,
        s.themes,
        s.detectedRole,
        s.detectedContext,
        [],
      );
      dispatch({ type: "SET_RESULTS", results });
    } catch (e) {
      console.error("Results generation failed:", e);
      dispatch({
        type: "SET_ERROR",
        error: "Failed to generate your friction report. Please try again.",
      });
    }
  }, [generateResults]);

  // ── Reset ──
  const reset = useCallback(() => {
    debounceTimersRef.current.forEach(id => clearTimeout(id));
    debounceTimersRef.current = [];
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    handleTextChange,
    handleChipAppend,
    handleDismissSplash,
    handleRoleSubmit,
    handleGenerateResults,
    reset,
  };
}
