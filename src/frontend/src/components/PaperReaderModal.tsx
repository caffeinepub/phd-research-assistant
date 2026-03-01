import type { Paper } from "@/backend.d";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdatePaper } from "@/hooks/useQueries";
import { summarizePaper } from "@/utils/gemini";
import { downloadOrOpenPaper } from "@/utils/paperDownload";
import {
  CheckCheck,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SourceBadge } from "./SourceBadge";

interface PaperReaderModalProps {
  paper: Paper | null;
  open: boolean;
  onClose: () => void;
  geminiKey: string;
}

export function PaperReaderModal({
  paper,
  open,
  onClose,
  geminiKey,
}: PaperReaderModalProps) {
  const [localSummary, setLocalSummary] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const updatePaper = useUpdatePaper();

  if (!paper) return null;

  const summary = paper.summary || localSummary;

  const handleGenerateSummary = async () => {
    if (!geminiKey) {
      toast.error("Please set your Gemini API key first");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await summarizePaper(
        paper.title,
        paper.authors,
        paper.abstractText,
        paper.fetchedContent,
        geminiKey,
      );
      setLocalSummary(result);
      // Persist to backend
      await updatePaper.mutateAsync({ ...paper, summary: result });
      toast.success("Summary generated and saved");
    } catch (err) {
      toast.error(
        `Failed to generate summary: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const formatSummary = (text: string) => {
    return text.split("\n").map((line, i) => {
      const key = `line-${i}-${line.slice(0, 12)}`;
      if (/^\d+\)/.test(line) || /^[*-]/.test(line) || /^\*\*/.test(line)) {
        return (
          <p
            key={key}
            className="text-sm text-foreground/90 leading-relaxed font-medium mb-1"
          >
            {line.replace(/\*\*/g, "")}
          </p>
        );
      }
      return (
        <p
          key={key}
          className="text-sm text-muted-foreground leading-relaxed mb-2"
        >
          {line}
        </p>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 bg-popover border-border/60">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/40 shrink-0">
          <div className="flex items-start gap-3 pr-6">
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-display text-lg font-semibold text-foreground leading-snug mb-1.5">
                {paper.title}
              </DialogTitle>
              <div className="flex items-center flex-wrap gap-2">
                <SourceBadge sourceType={paper.sourceType} />
                {paper.authors.slice(0, 3).map((a) => (
                  <span key={a} className="text-xs text-muted-foreground">
                    {a}
                  </span>
                ))}
                {paper.authors.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{paper.authors.length - 3} more
                  </span>
                )}
                {paper.sourceUrl && (
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        downloadOrOpenPaper(paper);
                        toast.success("Opening paper…");
                      }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md border border-border/40 hover:border-border/70 hover:bg-muted/40"
                    >
                      <Download className="w-3 h-3" />
                      Download PDF
                    </button>
                    <a
                      href={paper.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Source
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          defaultValue={summary ? "summary" : "abstract"}
          className="flex-1 min-h-0 flex flex-col"
        >
          <TabsList className="mx-6 mt-4 shrink-0 w-fit">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="abstract">Abstract</TabsTrigger>
            <TabsTrigger value="references">References</TabsTrigger>
            <TabsTrigger value="cite">Cite</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-hidden px-6 pb-6 pt-4">
            {/* Summary Tab */}
            <TabsContent value="summary" className="h-full mt-0">
              <ScrollArea className="h-full custom-scroll">
                {summary ? (
                  <div className="space-y-1">{formatSummary(summary)}</div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 gap-4">
                    <div className="text-center">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary/40" />
                      <p className="text-sm text-muted-foreground mb-4">
                        No summary yet. Generate one using Gemini AI.
                      </p>
                    </div>
                    <Button
                      onClick={handleGenerateSummary}
                      disabled={isGenerating || !geminiKey}
                      className="gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating…
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Summary
                        </>
                      )}
                    </Button>
                    {!geminiKey && (
                      <p className="text-xs text-destructive/70">
                        Set your Gemini API key first
                      </p>
                    )}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Abstract Tab */}
            <TabsContent value="abstract" className="h-full mt-0">
              <ScrollArea className="h-full custom-scroll">
                {paper.abstractText ? (
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {paper.abstractText}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No abstract available.
                  </p>
                )}

                {/* Keywords */}
                {paper.keywords.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-border/40">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Keywords
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {paper.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded-full text-xs bg-muted/50 text-muted-foreground border border-border/50"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* References Tab */}
            <TabsContent value="references" className="h-full mt-0">
              <ScrollArea className="h-full custom-scroll">
                {paper.references.length > 0 ? (
                  <ol className="space-y-2">
                    {paper.references.map((ref, i) => (
                      <li
                        key={`ref-${i}-${ref.slice(0, 8)}`}
                        className="flex gap-3"
                      >
                        <span className="text-xs font-mono text-primary/60 shrink-0 pt-0.5 w-6 text-right">
                          [{i + 1}]
                        </span>
                        <p className="text-xs text-foreground/80 leading-relaxed">
                          {ref}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No references available.
                  </p>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Cite Tab */}
            <TabsContent value="cite" className="h-full mt-0">
              <ScrollArea className="h-full custom-scroll">
                <div className="space-y-4">
                  {/* APA */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        APA
                      </p>
                      {paper.citationAPA && (
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(paper.citationAPA!, "APA citation")
                          }
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copied === "APA citation" ? (
                            <CheckCheck className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          Copy
                        </button>
                      )}
                    </div>
                    <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                      <p className="text-xs font-mono text-foreground/80 leading-relaxed">
                        {paper.citationAPA ||
                          `${paper.authors.join(", ")} (${new Date().getFullYear()}). ${paper.title}. Retrieved from ${paper.sourceUrl}`}
                      </p>
                    </div>
                  </div>

                  {/* MLA */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        MLA
                      </p>
                      {paper.citationMLA && (
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(paper.citationMLA!, "MLA citation")
                          }
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copied === "MLA citation" ? (
                            <CheckCheck className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          Copy
                        </button>
                      )}
                    </div>
                    <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                      <p className="text-xs font-mono text-foreground/80 leading-relaxed">
                        {paper.citationMLA ||
                          `${paper.authors[0] || "Unknown"}. "${paper.title}." Web. ${new Date().toLocaleDateString()}.`}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
