import type { Paper } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  useAddPaper,
  useCreateObjective,
  useSearchExternalDatabases,
} from "@/hooks/useQueries";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  Target,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { PaperPreviewCard } from "./PaperPreviewCard";

interface ObjectiveCardProps {
  index: number;
  text: string;
  sessionId: string;
  existingObjectiveId?: string;
}

export function ObjectiveCard({
  index,
  text,
  sessionId,
  existingObjectiveId,
}: ObjectiveCardProps) {
  const [targetCount, setTargetCount] = useState(15);
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const searchMutation = useSearchExternalDatabases();
  const addPaper = useAddPaper();
  const createObjective = useCreateObjective();

  const isSearching = searchMutation.isPending;

  const handleFindPapers = async () => {
    try {
      const response = await searchMutation.mutateAsync(text);
      const allResults = [
        ...response.arxivResults,
        ...response.semanticScholarResults,
      ]
        .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
        .slice(0, targetCount);

      setSearchResults(allResults);
      // Select all by default
      setSelectedPapers(new Set(allResults.map((p) => p.id)));
      setPreviewOpen(true);
    } catch {
      toast.error("Failed to search papers. Please try again.");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedPapers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () =>
    setSelectedPapers(new Set(searchResults.map((p) => p.id)));
  const clearAll = () => setSelectedPapers(new Set());

  const handleProceed = async () => {
    const toSave = searchResults.filter((p) => selectedPapers.has(p.id));
    if (toSave.length === 0) {
      toast.error("Please select at least one paper");
      return;
    }

    try {
      // Create objective if not existing
      let objId = existingObjectiveId;
      if (!objId) {
        objId = crypto.randomUUID();
        await createObjective.mutateAsync({
          id: objId,
          sessionId,
          text,
          targetPaperCount: BigInt(targetCount),
        });
      }

      // Save papers
      const results = await Promise.allSettled(
        toSave.map((paper) =>
          addPaper.mutateAsync({
            id: paper.id || crypto.randomUUID(),
            title: paper.title,
            authors: paper.authors,
            sourceType: paper.sourceType,
            sourceUrl: paper.sourceUrl,
            abstractText: paper.abstractText,
            sessionId,
          }),
        ),
      );

      const saved = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (saved > 0) {
        toast.success(
          `Saved ${saved} paper${saved !== 1 ? "s" : ""} to session`,
        );
        if (failed > 0)
          toast.warning(
            `${failed} paper${failed !== 1 ? "s" : ""} couldn't be saved`,
          );
        setConfirmed(true);
      } else {
        toast.error("Failed to save papers");
      }
    } catch {
      toast.error("Failed to save papers");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border/60 rounded-xl bg-card/50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15 shrink-0 mt-0.5">
          <span className="text-xs font-bold text-primary font-mono">
            {index}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">
            {text}
          </p>
        </div>
        {confirmed && (
          <CheckCircle2
            className="w-5 h-5 text-chart-2 shrink-0"
            style={{ color: "oklch(0.60 0.16 160)" }}
          />
        )}
      </div>

      {/* Controls */}
      <div className="px-4 pb-4 flex flex-wrap items-center gap-4">
        {/* Paper count slider */}
        <div className="flex items-center gap-3 flex-1 min-w-48">
          <Target className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                Papers to find
              </span>
              <span className="text-xs font-mono text-primary font-semibold">
                {targetCount}
              </span>
            </div>
            <Slider
              value={[targetCount]}
              onValueChange={([v]) => setTargetCount(v)}
              min={10}
              max={25}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-0.5 text-[10px] text-muted-foreground/60">
              <span>10</span>
              <span>25</span>
            </div>
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleFindPapers}
          disabled={isSearching}
          className="shrink-0 h-9"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching…
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Find Papers
            </>
          )}
        </Button>

        {searchResults.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen((v) => !v)}
            className="shrink-0 h-9 gap-2"
          >
            <BookOpen className="w-4 h-4" />
            {searchResults.length} Papers
            {previewOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </Button>
        )}
      </div>

      {/* Preview section */}
      <AnimatePresence>
        {previewOpen && searchResults.length > 0 && (
          <motion.div
            key="preview"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/40 p-4 space-y-3 bg-background/30">
              {/* Preview header */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Found {searchResults.length} papers — select which to keep
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-primary/70 hover:text-primary transition-colors"
                  >
                    All
                  </button>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    None
                  </button>
                </div>
              </div>

              {/* Paper cards */}
              <div className="space-y-2 max-h-[480px] overflow-y-auto custom-scroll pr-1">
                {isSearching
                  ? (["sk-a", "sk-b", "sk-c", "sk-d"] as const).map((k) => (
                      <div
                        key={k}
                        className="p-3 rounded-lg border border-border/40 space-y-2"
                      >
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-1.5 w-full" />
                      </div>
                    ))
                  : searchResults.map((paper) => (
                      <PaperPreviewCard
                        key={paper.id}
                        paper={paper}
                        selected={selectedPapers.has(paper.id)}
                        onToggleSelect={toggleSelect}
                      />
                    ))}
              </div>

              {/* Proceed button */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <span className="text-xs text-muted-foreground">
                  {selectedPapers.size} selected
                </span>
                <Button
                  size="sm"
                  onClick={handleProceed}
                  disabled={
                    addPaper.isPending || selectedPapers.size === 0 || confirmed
                  }
                  className="h-9"
                >
                  {addPaper.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : confirmed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Papers Saved
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Proceed with {selectedPapers.size} Papers
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
