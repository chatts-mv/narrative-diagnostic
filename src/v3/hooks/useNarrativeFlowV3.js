/**
 * useNarrativeFlowV3 — V3 state machine with section support.
 * Self-contained: does NOT import useNarrativeFlow.js.
 */
import { useReducer, useCallback, useRef, useEffect } from "react";
import useNarrativeGuideV3 from "./useNarrativeGuideV3";
import { getRoleAwareChips } from "../../lib/roleChips";

// ── Helpers ──────────────────────────────────────────────────────────

const SENIORITY_OPTIONS = ["Junior", "Mid-level", "Senior", "Lead", "Manager", "Director+"];

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

const ROLE_PROMPT = {
  headline: "What's your role?",
  subCopy: "Type your job title, then pick your seniority level below.",
  chips: SENIORITY_OPTIONS.map(s => ({ label: s })),
  attachmentRequest: null,
};

function parseSeniorityFromText(text) {
  const lower = text.toLowerCase();
  for (const opt of SENIORITY_OPTIONS) {
    if (lower.includes(opt.toLowerCase())) return opt;
  }
  return null;
}

function parseJobTitleFromText(text, seniority) {
  let title = text;
  if (seniority) {
    title = title.replace(new RegExp(seniority + "\\.?", "i"), "").trim();
  }
  // Strip trailing punctuation left over from chip append
  title = title.replace(/[.\s]+$/, "").trim();
  return title;
}

// ── Initial state ────────────────────────────────────────────────────

const initialState = {
  phase: "splash",
  userRole: null,
  roleSection: true,

  sections: [makeSection(0)],
  activeSectionIndex: 0,

  currentPrompt: ROLE_PROMPT,
  processing: false,
  lastProcessedLength: 0,
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
      return { ...state, phase: "writing", currentPrompt: ROLE_PROMPT };

    case "SET_SECTION_TEXT": {
      const sections = state.sections.map((s, i) =>
        i === state.activeSectionIndex ? { ...s, text: action.text } : s
      );
      return { ...state, sections };
    }

    case "COMPLETE_ROLE_SECTION": {
      const { jobTitle, seniority } = action;
      const userRole = { jobTitle, seniority };
      const sections = [...state.sections];
      sections[0] = {
        ...sections[0],
        locked: true,
        summary: `${seniority} ${jobTitle}`,
        label: "YOUR ROLE",
      };
      sections.push(makeSection(1));

      return {
        ...state,
        roleSection: false,
        userRole,
        detectedRole: `${seniority} ${jobTitle}`,
        detectedContext: { seniority },
        sections,
        activeSectionIndex: 1,
        lastProcessedLength: 0,
        currentPrompt: buildInitialPrompt(userRole),
      };
    }

    case "SET_PROCESSING":
      return { ...state, processing: action.value };

    case "RECORD_TURN":
      return {
        ...state,
        turns: [...state.turns, { userText: action.text, timestamp: Date.now() }],
        lastProcessedLength: state.sections[state.activeSectionIndex].text.length,
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

      if (
        action.sectionComplete &&
        action.sectionSummary &&
        state.sections[state.activeSectionIndex].text.length >= 40
      ) {
        const sections = [...nextState.sections];
        sections[state.activeSectionIndex] = {
          ...sections[state.activeSectionIndex],
          locked: true,
          summary: action.sectionSummary,
          label: action.sectionLabel || `SECTION ${state.activeSectionIndex + 1}`,
          themes: (action.themes || []).map(t => t.name),
        };
        const newIndex = sections.length;
        sections.push(makeSection(newIndex));

        nextState = {
          ...nextState,
          sections,
          activeSectionIndex: newIndex,
          lastProcessedLength: 0,
        };
      }

      const lockedCount = nextState.sections.filter(s => s.locked && s.label !== "YOUR ROLE").length;
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
  const roleTimerRef = useRef(null);

  // ── Text change ──
  const handleTextChange = useCallback((text) => {
    dispatch({ type: "SET_SECTION_TEXT", text });
  }, []);

  // ── Splash ──
  const handleDismissSplash = useCallback(() => {
    dispatch({ type: "DISMISS_SPLASH" });
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

  // ── Role section auto-complete ──
  useEffect(() => {
    clearTimeout(roleTimerRef.current);
    const s = stateRef.current;
    if (!s.roleSection || s.phase !== "writing") return;

    const text = s.sections[s.activeSectionIndex]?.text || "";
    const seniority = parseSeniorityFromText(text);
    if (!seniority) return;

    const jobTitle = parseJobTitleFromText(text, seniority);
    if (jobTitle.length < 2) return;

    roleTimerRef.current = setTimeout(() => {
      dispatch({ type: "COMPLETE_ROLE_SECTION", jobTitle, seniority });
    }, 800);

    return () => clearTimeout(roleTimerRef.current);
  }, [state.sections, state.activeSectionIndex]);

  // ── Tiered debounced auto-process ──
  useEffect(() => {
    debounceTimersRef.current.forEach(id => clearTimeout(id));
    debounceTimersRef.current = [];

    const s = stateRef.current;
    if (s.phase !== "writing" || s.roleSection) return;

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
            .filter(s => s.locked && s.label !== "YOUR ROLE")
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
      const fullNarrative = s.sections
        .filter(sec => sec.label !== "YOUR ROLE")
        .map(sec => sec.text)
        .filter(Boolean)
        .join("\n\n");
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
    clearTimeout(roleTimerRef.current);
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    handleTextChange,
    handleChipAppend,
    handleDismissSplash,
    handleGenerateResults,
    reset,
  };
}
