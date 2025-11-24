import { GoogleGenAI, Type } from "@google/genai";
import { INITIAL_VOCABULARY } from "../data/vocabulary";

// Lazy initialization to prevent crash on load if Env var is missing
const getAI = () => {
  const key = process.env.API_KEY;
  if (!key) {
    console.warn("Google GenAI API Key is missing.");
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
};

interface TranslationResult {
  dutch: string;
  type: string;
  gender?: string;
  grammarNotes?: string;
  success: boolean;
}

const addArticleIfNeeded = (dutch: string, gender?: string, type?: string): string => {
    if (type?.toLowerCase() !== 'noun' || !gender) return dutch;
    
    const word = dutch.toLowerCase().trim();
    if (word.startsWith('de ') || word.startsWith('het ') || word.startsWith('een ')) return dutch;

    if (gender === 'n') return `het ${dutch}`;
    if (['m', 'f', 'm/f'].includes(gender)) return `de ${dutch}`;
    
    return dutch;
};

export const translateLatinWord = async (latinWord: string): Promise<TranslationResult> => {
  // 1. Fallback / Cache: Check Local Dictionary First
  const localMatch = INITIAL_VOCABULARY.find(w => w.latin.toLowerCase() === latinWord.toLowerCase().trim());
  if (localMatch) {
      console.log("Found in local dictionary");
      return {
          dutch: localMatch.dutch,
          type: localMatch.type,
          gender: localMatch.gender,
          grammarNotes: localMatch.grammarNotes,
          success: true
      };
  }

  const ai = getAI();
  if (!ai) {
    return { dutch: "", type: "", success: false };
  }

  // 2. Gemini API
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Translate the Latin word "${latinWord}" to Dutch. 
      Provide the translation (include article de/het), grammatical type (noun, verb, etc.), gender (m/f/n) if noun.
      If it is a NOUN, provide the genitive form in grammarNotes.
      If it is a VERB, provide the principal parts (stamtijden) in grammarNotes (e.g. laudō, laudāre, laudāvī, laudātum).
      Return JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dutch: { type: Type.STRING, description: "Dutch translation with article" },
            type: { type: Type.STRING, description: "Part of speech (noun, verb, etc)" },
            gender: { type: Type.STRING, description: "m, f, or n (if applicable)" },
            grammarNotes: { type: Type.STRING, description: "Genitive form (nouns) or Principal Parts/Stem (verbs)" }
          }
        }
      }
    });

    let text = response.text || "{}";
    
    // Cleanup Markdown code blocks if present
    if (text.includes("```json")) {
        text = text.replace(/```json/g, "").replace(/```/g, "");
    }

    if (text) {
      const data = JSON.parse(text);
      
      // 3. Post-process: Auto-add article if missing
      if (data.type === 'noun') {
          data.dutch = addArticleIfNeeded(data.dutch, data.gender, data.type);
      }

      return { ...data, success: true };
    }
    throw new Error("Empty response");

  } catch (error) {
    console.error("Gemini Translation Error:", error);
    return { dutch: "", type: "", success: false };
  }
};