import type { ResearchSession } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllSessions, useDeleteSession } from "@/hooks/useQueries";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  History,
  Layers,
  Search,
  Target,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface HistoryPanelProps {
  activeSessionId: string | null;
  onSelectSession: (session: ResearchSession) => void;
}

export function HistoryPanel({
  activeSessionId,
  onSelectSession,
}: HistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const { data: sessions, isLoading } = useAllSessions();
  const deleteSession = useDeleteSession();

  const filtered = sessions
    ? sessions
        .filter((s) =>
          searchText.length > 0
            ? s.title.toLowerCase().includes(searchText.toLowerCase())
            : true,
        )
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    : [];

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteSession.mutateAsync(id);
      toast.success("Session deleted");
    } catch {
      toast.error("Failed to delete session");
    }
  };

  const formatDate = (ts: bigint) => {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Tab Handle */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center gap-1.5 w-8 h-28 rounded-l-lg border border-border/60 border-r-0 bg-card hover:bg-accent transition-colors shadow-card"
        aria-label={isOpen ? "Close history panel" : "Open history panel"}
      >
        {isOpen ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        )}
        <div className="[writing-mode:vertical-rl] text-[10px] font-medium text-muted-foreground tracking-widest uppercase rotate-180">
          History
        </div>
        <History className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.aside
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              className="fixed right-8 top-0 h-full w-80 z-40 border-l border-border/60 bg-sidebar flex flex-col shadow-card-hover"
            >
              {/* Header */}
              <div className="p-4 border-b border-border/60">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    <h2 className="font-display text-base font-semibold text-foreground">
                      Research History
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setIsOpen(false)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search sessions…"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-8 h-8 text-sm bg-background/50"
                  />
                </div>
              </div>

              {/* Sessions list */}
              <ScrollArea className="flex-1 custom-scroll">
                <div className="p-3 space-y-2">
                  {isLoading ? (
                    (["sk-a", "sk-b", "sk-c", "sk-d"] as const).map((k) => (
                      <div
                        key={k}
                        className="p-3 rounded-lg border border-border/40 space-y-2"
                      >
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <div className="flex gap-2">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))
                  ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <History className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">
                        {searchText
                          ? "No matching sessions"
                          : "No research sessions yet"}
                      </p>
                    </div>
                  ) : (
                    filtered.map((session) => (
                      <motion.div
                        key={session.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group relative p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          activeSessionId === session.id
                            ? "border-primary/40 bg-primary/8 shadow-glow"
                            : "border-border/40 bg-card/40 hover:border-border hover:bg-card/80"
                        }`}
                        onClick={() => onSelectSession(session)}
                      >
                        <div className="pr-6">
                          <div className="flex items-start gap-2 mb-1.5">
                            <FileText className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                            <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">
                              {session.title}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {formatDate(session.createdAt)}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Target className="w-3 h-3" />
                              <span>
                                {session.objectives.length} objectives
                              </span>
                            </div>
                            <div
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${
                                session.status === "active"
                                  ? "bg-primary/15 text-primary"
                                  : "bg-muted/50 text-muted-foreground"
                              }`}
                            >
                              {session.status}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, session.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Footer stats */}
              {sessions && sessions.length > 0 && (
                <div className="p-3 border-t border-border/60">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Layers className="w-3.5 h-3.5" />
                    <span>
                      {sessions.length} total session
                      {sessions.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
