export const GEMINI_API_KEY_STORAGE = "gemini_api_key";

export function getGeminiKey(): string {
  return localStorage.getItem(GEMINI_API_KEY_STORAGE) || "";
}

export function setGeminiKey(key: string): void {
  localStorage.setItem(GEMINI_API_KEY_STORAGE, key);
}

export async function callGemini(
  prompt: string,
  apiKey: string,
): Promise<string> {
  if (!apiKey) throw new Error("Gemini API key not set");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} — ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text;
}

export async function extractObjectivesFromProposal(
  proposalText: string,
  apiKey: string,
): Promise<string[]> {
  const prompt = `You are a research assistant. Read this research proposal and extract all distinct research objectives as a numbered list. Format: just the objective text, one per line, numbered. Proposal: ${proposalText}`;
  const result = await callGemini(prompt, apiKey);

  // Parse numbered list
  const lines = result
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter((l) => l.length > 5);

  return lines;
}

export async function summarizePaper(
  title: string,
  authors: string[],
  abstractText: string,
  fetchedContent: string | undefined,
  apiKey: string,
): Promise<string> {
  const prompt = `Summarize this research paper for a PhD student. Include: 1) Main Objectives, 2) Methodology, 3) Key Findings, 4) Limitations, 5) Relevance to PhD research. Paper: ${title} by ${authors.join(", ")}. Abstract: ${abstractText}. Content: ${fetchedContent || "N/A"}`;
  return callGemini(prompt, apiKey);
}

export async function summarizePDFText(
  filename: string,
  text: string,
  apiKey: string,
): Promise<string> {
  const prompt = `Summarize this research paper for a PhD student. Include: 1) Main Objectives, 2) Methodology, 3) Key Findings, 4) Limitations, 5) Key Contributions. Paper title: "${filename}". Full text (excerpt): ${text.slice(0, 8000)}`;
  return callGemini(prompt, apiKey);
}
