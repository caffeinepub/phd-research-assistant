import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { summarizePDFText } from "@/utils/gemini";
import { extractTextFromPDF } from "@/utils/pdfExtract";
import {
  CheckCircle2,
  FileText,
  Link2,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { SourceBadge } from "./SourceBadge";

interface LocalPaper {
  id: string;
  name: string;
  type: "pdf" | "url";
  text?: string;
  summary?: string;
  isSummarizing?: boolean;
  url?: string;
}

interface UploadBlockProps {
  geminiKey: string;
}

export function UploadBlock({ geminiKey }: UploadBlockProps) {
  const [papers, setPapers] = useState<LocalPaper[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSummarizingAll, setIsSummarizingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList) => {
      const pdfs = Array.from(files).filter(
        (f) => f.type === "application/pdf" || f.name.endsWith(".pdf"),
      );
      if (pdfs.length === 0) {
        toast.error("Only PDF files are supported");
        return;
      }

      const newPapers: LocalPaper[] = [];
      for (const file of pdfs) {
        const existing = papers.find(
          (p) => p.name === file.name && p.type === "pdf",
        );
        if (existing) continue;

        const id = crypto.randomUUID();
        newPapers.push({ id, name: file.name, type: "pdf" });

        // Extract text in background
        extractTextFromPDF(file)
          .then((text) => {
            setPapers((prev) =>
              prev.map((p) => (p.id === id ? { ...p, text } : p)),
            );
          })
          .catch(() => {
            toast.error(`Failed to extract text from ${file.name}`);
          });
      }

      setPapers((prev) => [...prev, ...newPapers]);
      if (newPapers.length > 0) {
        toast.success(
          `Added ${newPapers.length} PDF${newPapers.length !== 1 ? "s" : ""}`,
        );
      }
    },
    [papers],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    const urls = url.split("\n").filter((u) => u.trim().length > 0);
    const newPapers: LocalPaper[] = urls.map((u) => ({
      id: crypto.randomUUID(),
      name: u.length > 60 ? `${u.slice(0, 60)}…` : u,
      type: "url" as const,
      url: u.trim(),
    }));
    setPapers((prev) => [...prev, ...newPapers]);
    setUrlInput("");
    toast.success(
      `Added ${newPapers.length} URL${newPapers.length !== 1 ? "s" : ""}`,
    );
  };

  const handleRemove = (id: string) => {
    setPapers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSummarize = async (id: string) => {
    const paper = papers.find((p) => p.id === id);
    if (!paper) return;

    if (!geminiKey) {
      toast.error("Please set your Gemini API key first");
      return;
    }

    if (!paper.text) {
      toast.error("Paper text not yet extracted");
      return;
    }

    setPapers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isSummarizing: true } : p)),
    );
    try {
      const summary = await summarizePDFText(paper.name, paper.text, geminiKey);
      setPapers((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, summary, isSummarizing: false } : p,
        ),
      );
      toast.success("Summary generated");
    } catch (err) {
      setPapers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isSummarizing: false } : p)),
      );
      toast.error(
        `Failed to generate summary: ${err instanceof Error ? err.message : "Unknown"}`,
      );
    }
  };

  const handleSummarizeAll = async () => {
    if (!geminiKey) {
      toast.error("Please set your Gemini API key first");
      return;
    }
    const pdfPapers = papers.filter(
      (p) => p.type === "pdf" && p.text && !p.summary,
    );
    if (pdfPapers.length === 0) {
      toast.info("No unsummarized PDFs found");
      return;
    }
    setIsSummarizingAll(true);
    for (const paper of pdfPapers) {
      await handleSummarize(paper.id);
    }
    setIsSummarizingAll(false);
    toast.success("All papers summarized");
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <label
        htmlFor="pdf-upload"
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative block border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/8 shadow-glow"
            : "border-border/50 hover:border-border hover:bg-card/40"
        }`}
      >
        <input
          id="pdf-upload"
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <motion.div
          animate={{ scale: isDragging ? 1.04 : 1 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Drop PDF files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Research papers, theses, preprints — PDF format
            </p>
          </div>
        </motion.div>
      </label>

      {/* URL input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Paste paper URLs (one per line)… arXiv, DOI, Shodhganga, etc."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.shiftKey && handleAddUrl()
            }
            className="pl-10 bg-background/50"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleAddUrl}
          disabled={!urlInput.trim()}
          className="shrink-0 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      {/* Paper list */}
      <AnimatePresence mode="popLayout">
        {papers.map((paper) => (
          <motion.div
            key={paper.id}
            layout
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border border-border/50 rounded-lg bg-card/60 overflow-hidden"
          >
            <div className="flex items-start gap-3 p-3">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                {paper.type === "url" ? (
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <FileText className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {paper.name}
                  </p>
                  <SourceBadge
                    sourceType={paper.type === "url" ? "other" : "pdf"}
                  />
                </div>

                {paper.summary && (
                  <div className="mt-2 p-2.5 rounded-lg bg-background/40 border border-border/30">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2
                        className="w-3.5 h-3.5"
                        style={{ color: "oklch(0.60 0.16 160)" }}
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        AI Summary
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">
                      {paper.summary}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {paper.type === "pdf" && paper.text && !paper.summary && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2.5 text-xs gap-1.5"
                    onClick={() => handleSummarize(paper.id)}
                    disabled={paper.isSummarizing}
                  >
                    {paper.isSummarizing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {paper.isSummarizing ? "…" : "Summarize"}
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(paper.id)}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Summarize all */}
      {papers.filter((p) => p.type === "pdf" && p.text && !p.summary).length >
        1 && (
        <Button
          variant="outline"
          onClick={handleSummarizeAll}
          disabled={isSummarizingAll}
          className="w-full gap-2"
        >
          {isSummarizingAll ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Summarizing all…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Summarize All
            </>
          )}
        </Button>
      )}

      {papers.length === 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground/60">
          Upload PDFs or paste links above to get started
        </div>
      )}
    </div>
  );
}
