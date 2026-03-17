import { useCallback } from "react";
import { claude, claudeMultimodal, parseJSON } from "../lib/claude";
import {
  buildNarrativeGuidePrompt,
  buildNarrativeAnalysisPrompt,
  buildAttachmentAnalysisPrompt,
} from "../lib/narrativePrompts";

/**
 * Theme merge logic: when AI identifies themes from a new turn,
 * merge with existing themes. If a theme matches an existing one
 * (by ID or fuzzy name match), increment its depth counter.
 */
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

/**
 * Local confidence fallback calculation based on theme count and depth.
 */
function computeLocalConfidence(themes) {
  let score = 0;
  for (const t of themes) {
    score += t.depth >= 2 ? 25 : 15;
  }
  return Math.min(100, score);
}

/**
 * useNarrativeGuide — handles all AI interactions for the narrative canvas.
 */
export default function useNarrativeGuide() {

  const processNarrative = useCallback(async (newText, turns, themes, detectedRole, detectedContext) => {
    try {
      const { system, user } = buildNarrativeGuidePrompt(
        newText, turns, themes, detectedRole, detectedContext
      );

      const rawResult = await claude(system, user, 600);
      const parsed = parseJSON(rawResult);

      // Merge themes
      const turnIndex = turns.length;
      const updatedThemes = mergeThemes(themes, parsed.themesIdentified, turnIndex);

      // Use AI confidence with local fallback validation
      const localConf = computeLocalConfidence(updatedThemes);
      const aiConf = parsed.confidence || 0;
      // Use the higher of the two, but cap AI at localConf + 30 to prevent wild overestimates
      const confidence = Math.min(100, Math.max(aiConf, localConf));

      // Normalize chips: accept both string[] and {label, expandedText}[]
      const normalizedChips = (parsed.chips || []).map(c =>
        typeof c === "string" ? { label: c, expandedText: null } : c
      ).slice(0, 3);  // Enforce max 3 chips

      return {
        prompt: {
          headline: parsed.headline || "Tell me more about your day-to-day work challenges...",
          subCopy: parsed.subCopy || "",
          chips: normalizedChips,
          attachmentRequest: parsed.attachmentRequest || null,
        },
        themes: updatedThemes,
        confidence,
        readyForResults: parsed.readyForResults || confidence >= 75,
        detectedRole: parsed.detectedRole || detectedRole,
        detectedContext: {
          ...(detectedContext || {}),
          ...(parsed.detectedContext || {}),
        },
      };
    } catch (e) {
      console.error("Narrative guide failed:", e);
      // Return a sensible fallback
      const localThemes = themes.length > 0 ? themes : [];
      return {
        prompt: {
          headline: "That's really helpful. What else frustrates you about your workflow?",
          subCopy: "Think about tools, processes, or communication patterns.",
          chips: [
            { label: "Slow tools", expandedText: null },
            { label: "Too many meetings", expandedText: null },
            { label: "Manual data entry", expandedText: null },
          ],
          attachmentRequest: null,
        },
        themes: localThemes,
        confidence: computeLocalConfidence(localThemes),
        readyForResults: false,
        detectedRole,
        detectedContext,
      };
    }
  }, []);

  const generateResults = useCallback(async (narrative, themes, detectedRole, detectedContext, attachments) => {
    // If there are image attachments, analyze them first
    let attachmentDescriptions = null;
    const imageAttachments = (attachments || []).filter(a => a.type?.startsWith("image/"));
    if (imageAttachments.length > 0) {
      try {
        const descriptions = [];
        for (const att of imageAttachments.slice(0, 3)) { // max 3 images
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

    // Try with generous token limit; retry once on parse failure
    let rawResult;
    try {
      rawResult = await claude(system, user, 6000);
      return parseJSON(rawResult);
    } catch (firstErr) {
      console.warn("First analysis attempt failed, retrying:", firstErr.message);
      // Retry once — could be truncated JSON or transient API issue
      rawResult = await claude(system, user, 6000);
      return parseJSON(rawResult);
    }
  }, []);

  return { processNarrative, generateResults };
}
