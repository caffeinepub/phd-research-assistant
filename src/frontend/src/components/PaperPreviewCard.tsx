import type { Paper } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { downloadOrOpenPaper } from "@/utils/paperDownload";
import {
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Link2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SourceBadge } from "./SourceBadge";

interface PaperPreviewCardProps {
  paper: Paper;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  showCheckbox?: boolean;
}

export function PaperPreviewCard({
  paper,
  selected,
  onToggleSelect,
  showCheckbox = true,
}: PaperPreviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (!paper.sourceUrl) return;
    navigator.clipboard.writeText(paper.sourceUrl).then(() => {
      setCopiedLink(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const relevance = paper.relevanceScore ?? 0;
  const relevancePct = Math.min(100, Math.max(0, relevance * 100));

  return (
    <div
      className={`paper-card rounded-lg border p-3.5 transition-all ${
        selected
          ? "border-primary/50 bg-primary/5"
          : "border-border/50 bg-card/60"
      }`}
    >
      <div className="flex items-start gap-3">
        {showCheckbox && (
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(paper.id)}
            className="mt-0.5 shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Title & source */}
          <div className="flex items-start gap-2 mb-1.5 flex-wrap">
            <h4 className="text-sm font-semibold text-foreground leading-snug flex-1 min-w-0">
              {paper.title}
            </h4>
            <SourceBadge sourceType={paper.sourceType} className="shrink-0" />
          </div>

          {/* Authors */}
          {paper.authors.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
              <Users className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {paper.authors.slice(0, 3).join(", ")}
                {paper.authors.length > 3 &&
                  ` +${paper.authors.length - 3} more`}
              </span>
            </div>
          )}

          {/* Relevance bar */}
          {paper.relevanceScore !== undefined && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full relevance-fill rounded-full transition-all duration-500"
                  style={{ width: `${relevancePct}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                {(relevance * 100).toFixed(0)}% match
              </span>
            </div>
          )}

          {/* Abstract snippet */}
          {paper.abstractText && (
            <p
              className={`text-xs text-muted-foreground leading-relaxed ${
                expanded ? "" : "line-clamp-2"
              }`}
            >
              {paper.abstractText}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {paper.abstractText && paper.abstractText.length > 150 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    More
                  </>
                )}
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              {paper.sourceUrl && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Link2 className="w-3 h-3" />
                  {copiedLink ? "Copied!" : "Copy Link"}
                </button>
              )}
              {paper.sourceUrl && (
                <button
                  type="button"
                  onClick={() => downloadOrOpenPaper(paper)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
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
                  className="flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Full
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
