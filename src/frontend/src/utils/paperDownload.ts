import type { Paper } from "@/backend.d";

/**
 * Returns the best direct PDF URL for a paper, or null if none is available.
 * - arXiv abstract URLs (arxiv.org/abs/XXXX) → arxiv.org/pdf/XXXX
 * - arXiv PDF URLs → pass through
 * - Semantic Scholar / other URLs → return sourceUrl as-is (opens in browser)
 */
export function getPaperDownloadUrl(paper: Paper): string | null {
  const url = paper.sourceUrl;
  if (!url) return null;

  // arXiv: convert /abs/ to /pdf/
  const arxivAbsMatch = url.match(/arxiv\.org\/abs\/([\d.v]+)/i);
  if (arxivAbsMatch) {
    return `https://arxiv.org/pdf/${arxivAbsMatch[1]}`;
  }

  // arXiv PDF already
  if (/arxiv\.org\/pdf\//i.test(url)) {
    return url;
  }

  // For all other sources, just return the source URL (opens in browser)
  return url;
}

/**
 * Trigger a PDF download or open in a new tab.
 * For arXiv PDFs, opens the PDF directly in a new tab.
 */
export function downloadOrOpenPaper(paper: Paper): void {
  const url = getPaperDownloadUrl(paper);
  if (!url) return;

  window.open(url, "_blank", "noopener,noreferrer");
}
