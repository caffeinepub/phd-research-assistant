# PhD Research Assistant

## Current State
The app allows users to search for research papers via arXiv and Semantic Scholar, preview them, select and save them to sessions, read summaries, view abstracts/references, and export literature reviews. Each paper card shows a "View Full" / "Source" link that opens the paper's source URL in a new tab. There is no direct download button or copy-link feature in the preview cards or library view.

## Requested Changes (Diff)

### Add
- A "Download PDF" button on each PaperPreviewCard (search results) that resolves a direct PDF URL from the paper's sourceUrl (arXiv → /pdf/ path; Semantic Scholar → openAccessPdf if available; DOI links → try Unpaywall open-access endpoint) and triggers a browser download or opens the PDF in a new tab.
- A "Copy Link" button on each PaperPreviewCard and PaperLibrary card to copy the paper URL to clipboard.
- A download utility function `getPaperDownloadUrl(paper)` in utils that derives the best available PDF link from a paper's sourceUrl and sourceType.
- In the PaperReaderModal, add a "Download PDF" button in the header area alongside the existing "Source" link.
- In the PaperLibrary grid cards, add "Download PDF" and "Copy Link" actions in the footer row.

### Modify
- PaperPreviewCard: add download and copy-link buttons in the actions row.
- PaperReaderModal: add download button in the header.
- PaperLibrary: add download and copy-link buttons on each card footer.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `src/frontend/src/utils/paperDownload.ts` with `getPaperDownloadUrl(paper: Paper): string | null` that maps arXiv abstract URLs to PDF URLs and passes through other source URLs.
2. Update `PaperPreviewCard.tsx` to add Download and Copy Link icon buttons in the actions row.
3. Update `PaperReaderModal.tsx` to add a Download PDF button next to the Source link in the header.
4. Update `PaperLibrary.tsx` to add Download and Copy Link buttons on each paper card footer.
