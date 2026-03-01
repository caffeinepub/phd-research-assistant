import type { Paper } from "@/backend.d";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePapersBySession } from "@/hooks/useQueries";
import { downloadOrOpenPaper } from "@/utils/paperDownload";
import {
  BookOpen,
  Download,
  ExternalLink,
  Link2,
  Search,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { PaperReaderModal } from "./PaperReaderModal";
import { SourceBadge } from "./SourceBadge";

interface PaperLibraryProps {
  sessionId: string | null;
  geminiKey: string;
}

export function PaperLibrary({ sessionId, geminiKey }: PaperLibraryProps) {
  const { data: papers, isLoading } = usePapersBySession(sessionId);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [searchText, setSearchText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (e: React.MouseEvent, paper: Paper) => {
    e.stopPropagation();
    if (!paper.sourceUrl) return;
    navigator.clipboard.writeText(paper.sourceUrl).then(() => {
      setCopiedId(paper.id);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filtered = papers
    ? papers.filter(
        (p) =>
          searchText.length === 0 ||
          p.title.toLowerCase().includes(searchText.toLowerCase()) ||
          p.authors.some((a) =>
            a.toLowerCase().includes(searchText.toLowerCase()),
          ) ||
          p.keywords.some((k) =>
            k.toLowerCase().includes(searchText.toLowerCase()),
          ),
      )
    : [];

  return (
    <>
      <div className="space-y-4">
        {/* Search */}
        {papers && papers.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search papers by title, author, keyword…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(["sk-a", "sk-b", "sk-c", "sk-d"] as const).map((k) => (
              <div
                key={k}
                className="p-4 rounded-xl border border-border/40 space-y-3"
              >
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !sessionId && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-25" />
            <p className="text-sm font-medium mb-1">No active session</p>
            <p className="text-xs opacity-70">
              Create a research session and find papers to populate your library
            </p>
          </div>
        )}

        {!isLoading && sessionId && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-25" />
            <p className="text-sm font-medium mb-1">
              {searchText
                ? "No papers match your search"
                : "No papers in this session yet"}
            </p>
            <p className="text-xs opacity-70">
              {searchText
                ? "Try different keywords"
                : "Extract objectives and find papers above to populate your library"}
            </p>
          </div>
        )}

        {/* Papers grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((paper, idx) => (
              <motion.button
                key={paper.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="paper-card text-left p-4 rounded-xl border border-border/50 bg-card/60 hover:bg-card/90 transition-colors w-full"
                onClick={() => setSelectedPaper(paper)}
              >
                {/* Title */}
                <div className="flex items-start gap-2 mb-2.5">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                      {paper.title}
                    </h4>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <SourceBadge sourceType={paper.sourceType} />
                  {paper.summary && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary/80 border border-primary/20">
                      <Sparkles className="w-2.5 h-2.5" />
                      Summarized
                    </span>
                  )}
                </div>

                {/* Authors */}
                {paper.authors.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {paper.authors.slice(0, 2).join(", ")}
                      {paper.authors.length > 2 &&
                        ` +${paper.authors.length - 2}`}
                    </span>
                  </div>
                )}

                {/* Keywords */}
                {paper.keywords.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Tag className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                    {paper.keywords.slice(0, 3).map((kw) => (
                      <span
                        key={kw}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-muted/40 text-muted-foreground border border-border/30"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* Abstract snippet */}
                {paper.abstractText && (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {paper.abstractText}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/30 flex-wrap gap-y-1.5">
                  <span className="text-[11px] text-muted-foreground/60">
                    Click to read & summarize
                  </span>
                  <div className="flex items-center gap-2">
                    {paper.sourceUrl && (
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(e, paper)}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Link2 className="w-3 h-3" />
                        {copiedId === paper.id ? "Copied!" : "Copy Link"}
                      </button>
                    )}
                    {paper.sourceUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadOrOpenPaper(paper);
                        }}
                        className="flex items-center gap-1 text-[11px] text-primary/60 hover:text-primary transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    )}
                    {paper.sourceUrl && (
                      <a
                        href={paper.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[11px] text-primary/60 hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Source
                      </a>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground/60 text-center pt-1">
            {filtered.length} paper{filtered.length !== 1 ? "s" : ""}
            {searchText ? ` matching "${searchText}"` : " in this session"}
          </p>
        )}
      </div>

      <PaperReaderModal
        paper={selectedPaper}
        open={!!selectedPaper}
        onClose={() => setSelectedPaper(null)}
        geminiKey={geminiKey}
      />
    </>
  );
}
