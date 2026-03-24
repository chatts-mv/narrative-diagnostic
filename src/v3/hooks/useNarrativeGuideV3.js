/**
 * useNarrativeGuideV3 — V3 AI wrapper with section detection.
 * Self-contained: imports shared claude.js and roleChips.js read-only.
 */
import { useCallback } from "react";
import { claude, claudeMultimodal, parseJSON } from "../../lib/claude";
import { getFollowUpChips } from "../../lib/roleChips";
import {
  buildNarrativeGuidePromptV3,
  buildNarrativeAnalysisPrompt,
  buildAttachmentAnalysisPrompt,
} from "../lib/narrativePromptsV3";

function mergeThemes(existingThemes, newThemeIds, turnIndex) {
  const merged = [...existingThemes];
  for (const identified of (newThemeIds || [])) {
    const existing = merged.find(t =>
      t.id === identified.id ||
      t.name.toLowerCase().includes(identified.name.toLowerCase().split(" ")[0])
    );
    if (existing) {
      existing.depth += 1;
      if (!existing.turns.includes(turnIndex)) {
        existing.turns.push(turnIndex);
      }
    } else {
      merged.push({
        id: identified.id,
        name: identified.name,
        depth: 1,
        turns: [turnIndex],
      });
    }
  }
  return merged;
}

function computeLocalConfidence(themes) {
  let score = 0;
  for (const t of themes) {
    score += t.depth >= 2 ? 25 : 15;
  }
  return Math.min(100, score);
}

export default function useNarrativeGuideV3() {

  const processNarrative = useCallback(async (
    newText, turns, themes, detectedRole, detectedContext,
    currentSectionIndex, completedSections, sectionTurnCount
  ) => {
    try {
      const { system, user } = buildNarrativeGuidePromptV3(
        newText, turns, themes, detectedRole, detectedContext,
        currentSectionIndex, completedSections, sectionTurnCount
      );

      const rawResult = await claude(system, user, 800);
      const parsed = parseJSON(rawResult);

      const turnIndex = turns.length;
      const updatedThemes = mergeThemes(themes, parsed.themesIdentified, turnIndex);

      const localConf = computeLocalConfidence(updatedThemes);
      const aiConf = parsed.confidence || 0;
      const confidence = Math.min(100, Math.max(aiConf, localConf));

      const normalizedChips = (parsed.chips || []).map(c =>
        typeof c === "string" ? { label: c, expandedText: null } : c
      ).slice(0, 3);

      return {
        prompt: {
          headline: parsed.headline || "Tell me more about your day-to-day work challenges...",
          subCopy: parsed.subCopy || "",
          chips: normalizedChips,
          attachmentRequest: parsed.attachmentRequest || null,
        },
        themes: updatedThemes,
        confidence,
        readyForResults: parsed.readyForResults || false,
        detectedRole: parsed.detectedRole || detectedRole,
        detectedContext: {
          ...(detectedContext || {}),
          ...(parsed.detectedContext || {}),
        },
        // V3 section fields
        sectionComplete: parsed.sectionComplete || false,
        sectionSummary: parsed.sectionSummary || null,
        sectionLabel: parsed.sectionLabel || null,
      };
    } catch (e) {
      console.error("V3 narrative guide failed:", e);
      const localThemes = themes.length > 0 ? themes : [];
      return {
        prompt: {
          headline: "That's really helpful. What else frustrates you about your workflow?",
          subCopy: "Think about tools, processes, or communication patterns.",
          chips: getFollowUpChips(),
          attachmentRequest: null,
        },
        themes: localThemes,
        confidence: computeLocalConfidence(localThemes),
        readyForResults: false,
        detectedRole,
        detectedContext,
        sectionComplete: false,
        sectionSummary: null,
        sectionLabel: null,
      };
    }
  }, []);

  const generateResults = useCallback(async (narrative, themes, detectedRole, detectedContext, attachments) => {
    let attachmentDescriptions = null;
    const imageAttachments = (attachments || []).filter(a => a.type?.startsWith("image/"));
    if (imageAttachments.length > 0) {
      try {
        const descriptions = [];
        for (const att of imageAttachments.slice(0, 3)) {
          const systemPrompt = buildAttachmentAnalysisPrompt();
          const contentBlocks = [
            { type: "image", source: { type: "base64", media_type: att.type, data: att.dataUrl.split(",")[1] } },
            { type: "text", text: "Describe the friction-relevant details in this image." },
          ];
          const desc = await claudeMultimodal(systemPrompt, contentBlocks, 300);
          descriptions.push(`[${att.name}]: ${desc}`);
        }
        attachmentDescriptions = descriptions.join("\n");
      } catch (e) {
        console.warn("Attachment analysis failed:", e);
      }
    }

    const { system, user } = buildNarrativeAnalysisPrompt(
      narrative, themes, detectedRole, detectedContext, attachmentDescriptions
    );

    let rawResult;
    try {
      rawResult = await claude(system, user, 6000);
      return parseJSON(rawResult);
    } catch (firstErr) {
      console.warn("First analysis attempt failed, retrying:", firstErr.message);
      rawResult = await claude(system, user, 6000);
      return parseJSON(rawResult);
    }
  }, []);

  return { processNarrative, generateResults };
}
