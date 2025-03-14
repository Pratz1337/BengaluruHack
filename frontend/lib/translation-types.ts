/**
 * Supported language codes for the Sarvam translation service
 * These codes will be used with "-IN" suffix when making API calls
 */
export type SupportedLanguage =
  | "en"  // English
  | "hi"  // Hindi
  | "bn"  // Bengali
  | "gu"  // Gujarati
  | "kn"  // Kannada
  | "ml"  // Malayalam
  | "mr"  // Marathi
  | "od"  // Odia
  | "pa"  // Punjabi
  | "ta"  // Tamil
  | "te"; // Telugu

/**
 * Export language names for reference
 */
export const languageNames: Record<SupportedLanguage, string> = {
  en: "English",
  hi: "Hindi",
  bn: "Bengali",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  mr: "Marathi",
  od: "Odia",
  pa: "Punjabi",
  ta: "Tamil",
  te: "Telugu"
};