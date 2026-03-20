import { useReducer, useCallback, useRef, useEffect } from "react";
import useNarrativeGuide from "./useNarrativeGuide";
import { getRoleAwareChips } from "../lib/roleChips";

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

// ── Initial state ──────────────────────────────────────────────────────

const PLACEHOLDER_PROMPT = {
  headline: "",
  subCopy: "",
  chips: [],
  attachmentRequest: null,
};

const initialState = {
  narrative: "",
  attachments: [],

  phase: "splash", // splash | role-capture | entry | conversing | generating | results | error
  processing: false,
  lastProcessedLength: 0,
  currentPrompt: PLACEHOLDER_PROMPT,

  userRole: null,         // { jobTitle, seniority }
  turns: [],              // [{userText, timestamp}]
  themes: [],             // [{id, name, depth, turns}]
  confidence: 0,
  readyForResults: false,

  detectedRole: null,
  detectedContext: {},

  nudgeMessage: null,         // Lightweight encourage-typing text (no API call)
  previousNarrative: null,    // Stores text before clearing for recovery
  showRecovery: false,        // Whether to show the recovery prompt

  results: null,
  error: null,
};

// ── Reducer ────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case "SET_NARRATIVE":
      return { ...state, narrative: action.text };

    case "ADD_ATTACHMENT":
      return { ...state, attachments: [...state.attachments, action.attachment] };

    case "REMOVE_ATTACHMENT":
      return {
        ...state,
        attachments: state.attachments.filter((_, i) => i !== action.index),
      };

    case "SET_PROCESSING":
      return { ...state, processing: action.value };

    case "RECORD_TURN":
      return {
        ...state,
        turns: [...state.turns, { userText: action.text, timestamp: Date.now() }],
        lastProcessedLength: state.narrative.length,
        phase: state.phase === "entry" ? "conversing" : state.phase,
      };

    case "SET_PROMPT":
      return { ...state, currentPrompt: action.prompt };

    case "UPDATE_GUIDANCE":
      return {
        ...state,
        themes: action.themes,
        confidence: Math.max(state.confidence, action.confidence),  // never regress
        readyForResults: state.readyForResults || action.readyForResults,  // once ready, stays ready
        detectedRole: action.detectedRole ?? state.detectedRole,
        detectedContext: { ...state.detectedContext, ...(action.detectedContext || {}) },
        processing: false,
        nudgeMessage: null,  // Clear nudge when AI responds
      };

    case "SET_NUDGE":
      return { ...state, nudgeMessage: action.message };

    case "CLEAR_NUDGE":
      return { ...state, nudgeMessage: null };

    case "SHOW_RECOVERY":
      return {
        ...state,
        previousNarrative: action.previousText,
        showRecovery: true,
        nudgeMessage: null,
      };

    case "RESTORE_NARRATIVE":
      return {
        ...state,
        narrative: state.previousNarrative || "",
        showRecovery: false,
        previousNarrative: null,
      };

    case "START_FRESH":
      return {
        ...state,
        narrative: "",
        showRecovery: false,
        previousNarrative: null,
        turns: [],
        themes: [],
        confidence: 0,
        readyForResults: false,
        lastProcessedLength: 0,
        nudgeMessage: null,
        phase: "entry",
        currentPrompt: buildInitialPrompt(state.userRole),
      };

    case "CLEAR_RECOVERY":
      return { ...state, showRecovery: false };

    case "DISMISS_SPLASH":
      return { ...state, phase: "role-capture" };

    case "SET_USER_ROLE":
      return {
        ...state,
        userRole: action.userRole,
        detectedRole: `${action.userRole.seniority} ${action.userRole.jobTitle}`,
        detectedContext: { seniority: action.userRole.seniority },
        currentPrompt: action.initialPrompt,
        phase: "entry",
      };

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

// ── Tiered debounce ────────────────────────────────────────────────────

const TIERS = [
  { minChars: 10, debounceMs: 3000 },   // Short text — respond after 3s pause
  { minChars: 20, debounceMs: 2000 },   // Moderate text — respond after 2s pause
  { minChars: 40, debounceMs: 1500 },   // Flowing text — respond quickly
];

const NUDGE_MESSAGES = [
  "Tell us more...",
  "What else comes to mind?",
  "Keep going, you're building a great picture...",
];

// ── Hook ───────────────────────────────────────────────────────────────

export default function useNarrativeFlow() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const { processNarrative, generateResults } = useNarrativeGuide();

  // Tiered debounce timer refs
  const debounceTimersRef = useRef([]);
  // Track if we have a pending result to apply
  const pendingResultRef = useRef(null);
  // Nudge timer ref
  const nudgeTimerRef = useRef(null);
  // Track last substantial narrative for recovery
  const lastSubstantialNarrativeRef = useRef("");

  // ── Text change handler (with recovery detection) ──
  const handleTextChange = useCallback((text) => {
    const s = stateRef.current;

    // Save current narrative if substantial (for recovery)
    if (s.narrative.length >= 10) {
      lastSubstantialNarrativeRef.current = s.narrative;
    }

    dispatch({ type: "SET_NARRATIVE", text });

    // Detect clearing: text is now empty but we had substantial content and at least 1 turn
    if (text.length === 0 && lastSubstantialNarrativeRef.current.length >= 10 && s.turns.length > 0) {
      dispatch({ type: "SHOW_RECOVERY", previousText: lastSubstantialNarrativeRef.current });
    }

    // If user starts typing again after recovery shows, dismiss it
    if (text.length > 0 && s.showRecovery) {
      dispatch({ type: "CLEAR_RECOVERY" });
    }

    // Clear nudge when user types
    if (s.nudgeMessage) {
      dispatch({ type: "CLEAR_NUDGE" });
    }
  }, []);

  // ── Splash dismiss handler ──
  const handleDismissSplash = useCallback(() => {
    dispatch({ type: "DISMISS_SPLASH" });
  }, []);

  // ── Role submit handler ──
  const handleRoleSubmit = useCallback((userRole) => {
    const initialPrompt = buildInitialPrompt(userRole);
    dispatch({ type: "SET_USER_ROLE", userRole, initialPrompt });
  }, []);

  // ── Tiered debounced auto-process ──
  useEffect(() => {
    // Clear all existing timers
    debounceTimersRef.current.forEach(id => clearTimeout(id));
    debounceTimersRef.current = [];
    clearTimeout(nudgeTimerRef.current);

    const { phase } = stateRef.current;

    // Don't process during non-writing phases
    if (phase === "generating" || phase === "results" || phase === "role-capture") return;

    const newChars = state.narrative.length - stateRef.current.lastProcessedLength;

    // Nudge logic: if user typed something but not enough to trigger any tier,
    // show an encouraging prompt after 5 seconds of inactivity
    if (newChars > 0 && newChars < TIERS[0].minChars) {
      nudgeTimerRef.current = setTimeout(() => {
        if (!stateRef.current.processing && !stateRef.current.nudgeMessage) {
          const nudge = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];
          dispatch({ type: "SET_NUDGE", message: nudge });
        }
      }, 5000);
    }

    // Set a timer for each qualifying tier
    for (const tier of TIERS) {
      if (newChars >= tier.minChars) {
        const timerId = setTimeout(async () => {
          const s = stateRef.current;

          // Re-check conditions at fire time
          if (s.processing) return;
          if (s.narrative.length - s.lastProcessedLength < tier.minChars) return;

          // Extract new text since last process
          const newText = s.narrative.slice(s.lastProcessedLength).trim();
          if (!newText) return;

          dispatch({ type: "SET_PROCESSING", value: true });
          dispatch({ type: "RECORD_TURN", text: newText });

          try {
            const result = await processNarrative(
              newText,
              s.turns,
              s.themes,
              s.detectedRole,
              s.detectedContext,
            );

            // If user typed more while we were processing, queue the result
            if (stateRef.current.narrative.length > s.narrative.length + TIERS[TIERS.length - 1].minChars) {
              pendingResultRef.current = result;
              dispatch({ type: "SET_PROCESSING", value: false });
              return;
            }

            // Apply the result
            dispatch({ type: "SET_PROMPT", prompt: result.prompt });
            dispatch({
              type: "UPDATE_GUIDANCE",
              themes: result.themes,
              confidence: result.confidence,
              readyForResults: result.readyForResults,
              detectedRole: result.detectedRole,
              detectedContext: result.detectedContext,
            });
          } catch (e) {
            console.error("Auto-process failed:", e);
            dispatch({ type: "SET_PROCESSING", value: false });
          }
        }, tier.debounceMs);

        debounceTimersRef.current.push(timerId);
      }
    }

    return () => {
      debounceTimersRef.current.forEach(id => clearTimeout(id));
      clearTimeout(nudgeTimerRef.current);
    };
  }, [state.narrative, processNarrative]);

  // ── Chip append handler ──
  const handleChipAppend = useCallback((chip) => {
    const s = stateRef.current;
    let textToAppend = (typeof chip === "string") ? chip : (chip.expandedText || chip.label);
    // Ensure text ends with a full stop
    if (textToAppend && !/[.!?]$/.test(textToAppend)) {
      textToAppend += ".";
    }
    const isRich = typeof chip !== "string" && chip.expandedText;
    const connector = s.narrative.trim().length > 0 ? (isRich ? "\n\n" : " ") : "";
    dispatch({ type: "SET_NARRATIVE", text: s.narrative + connector + textToAppend });
  }, []);

  // ── Attachment handlers ──
  const handleAttach = useCallback((attachment) => {
    dispatch({ type: "ADD_ATTACHMENT", attachment });
  }, []);

  const handleRemoveAttachment = useCallback((index) => {
    dispatch({ type: "REMOVE_ATTACHMENT", index });
  }, []);

  // ── Generate results ──
  const handleGenerateResults = useCallback(async () => {
    // Clear any pending debounce timers
    debounceTimersRef.current.forEach(id => clearTimeout(id));
    debounceTimersRef.current = [];

    dispatch({ type: "SET_PHASE", phase: "generating" });

    try {
      const s = stateRef.current;
      const results = await generateResults(
        s.narrative,
        s.themes,
        s.detectedRole,
        s.detectedContext,
        s.attachments,
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

  // ── Recovery handlers ──
  const handleRestoreNarrative = useCallback(() => {
    dispatch({ type: "RESTORE_NARRATIVE" });
  }, []);

  const handleStartFresh = useCallback(() => {
    debounceTimersRef.current.forEach(id => clearTimeout(id));
    debounceTimersRef.current = [];
    clearTimeout(nudgeTimerRef.current);
    lastSubstantialNarrativeRef.current = "";
    dispatch({ type: "START_FRESH" });
  }, []);

  // ── Reset ──
  const reset = useCallback(() => {
    debounceTimersRef.current.forEach(id => clearTimeout(id));
    debounceTimersRef.current = [];
    clearTimeout(nudgeTimerRef.current);
    pendingResultRef.current = null;
    lastSubstantialNarrativeRef.current = "";
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    handleTextChange,
    handleChipAppend,
    handleDismissSplash,
    handleRoleSubmit,
    handleAttach,
    handleRemoveAttachment,
    handleGenerateResults,
    handleRestoreNarrative,
    handleStartFresh,
    reset,
  };
}
