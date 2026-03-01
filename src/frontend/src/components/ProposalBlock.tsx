import type { ResearchSession } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSession } from "@/hooks/useQueries";
import { extractObjectivesFromProposal } from "@/utils/gemini";
import { extractTextFromPDF } from "@/utils/pdfExtract";
import {
  CheckCircle2,
  FileUp,
  Loader2,
  PenLine,
  Save,
  Sparkles,
  Target,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ObjectiveCard } from "./ObjectiveCard";

interface ProposalBlockProps {
  geminiKey: string;
  activeSession: ResearchSession | null;
  onSessionCreated: (session: ResearchSession) => void;
}

export function ProposalBlock({
  geminiKey,
  activeSession,
  onSessionCreated,
}: ProposalBlockProps) {
  const [sessionTitle, setSessionTitle] = useState(activeSession?.title || "");
  const [proposalText, setProposalText] = useState(
    activeSession?.proposalText || "",
  );
  const [proposalFileName, setProposalFileName] = useState<string | null>(null);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionCreated, setSessionCreated] = useState(!!activeSession);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    activeSession?.id || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createSession = useCreateSession();

  // Load existing objectives from session
  const existingObjectives = activeSession?.objectives || [];

  const handlePDFUpload = async (file: File) => {
    try {
      const text = await extractTextFromPDF(file);
      setProposalText(text);
      setProposalFileName(file.name);
      toast.success(`Loaded proposal from ${file.name}`);
    } catch {
      toast.error("Failed to extract text from proposal PDF");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePDFUpload(file);
  };

  const handleExtractObjectives = async () => {
    if (!proposalText.trim()) {
      toast.error("Please provide proposal text first");
      return;
    }
    if (!geminiKey) {
      toast.error("Please set your Gemini API key first");
      return;
    }

    setIsExtracting(true);
    try {
      const extracted = await extractObjectivesFromProposal(
        proposalText,
        geminiKey,
      );
      if (extracted.length === 0) {
        toast.warning(
          "Could not extract objectives. Try refining the proposal text.",
        );
      } else {
        setObjectives(extracted);
        toast.success(
          `Extracted ${extracted.length} research objective${extracted.length !== 1 ? "s" : ""}`,
        );
      }
    } catch (err) {
      toast.error(
        `Failed to extract objectives: ${err instanceof Error ? err.message : "Unknown"}`,
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCreateSession = async () => {
    if (!sessionTitle.trim()) {
      toast.error("Please enter a session title");
      return;
    }
    if (!proposalText.trim()) {
      toast.error("Please provide proposal text");
      return;
    }

    setIsCreatingSession(true);
    try {
      const id = crypto.randomUUID();
      const session = await createSession.mutateAsync({
        id,
        title: sessionTitle.trim(),
        proposalText,
        proposalFileName: proposalFileName,
      });
      setCurrentSessionId(id);
      setSessionCreated(true);
      onSessionCreated(session);
      toast.success("Research session created!");
    } catch (err) {
      toast.error(
        `Failed to create session: ${err instanceof Error ? err.message : "Unknown"}`,
      );
    } finally {
      setIsCreatingSession(false);
    }
  };

  const displayObjectives =
    objectives.length > 0
      ? objectives
      : existingObjectives.map((_, i) => `Objective ${i + 1}`);

  return (
    <div className="space-y-5">
      {/* Session title */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Session Title
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Deep Learning for Medical Image Segmentation"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            disabled={sessionCreated}
            className="bg-background/50 disabled:opacity-60"
          />
          {!sessionCreated && (
            <Button
              onClick={handleCreateSession}
              disabled={
                isCreatingSession ||
                !sessionTitle.trim() ||
                !proposalText.trim()
              }
              className="shrink-0 gap-2"
            >
              {isCreatingSession ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Create Session
            </Button>
          )}
          {sessionCreated && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-xs text-primary shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Session Active
            </div>
          )}
        </div>
      </div>

      {/* Proposal text area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Research Proposal
          </Label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors"
          >
            <FileUp className="w-3.5 h-3.5" />
            Upload PDF
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div className="relative">
          {proposalText ? null : (
            <div className="absolute inset-0 flex items-start pt-3 pl-3 pointer-events-none z-10">
              <PenLine className="w-4 h-4 text-muted-foreground/40 mt-0.5 mr-2 shrink-0" />
            </div>
          )}
          <Textarea
            placeholder="Paste your research proposal text here, or upload a PDF above…"
            value={proposalText}
            onChange={(e) => setProposalText(e.target.value)}
            className={`min-h-36 bg-background/50 resize-y text-sm leading-relaxed ${proposalText ? "" : "pl-9"}`}
          />
        </div>
        {proposalFileName && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.60 0.16 160)" }}
            />
            Loaded from: {proposalFileName}
          </p>
        )}
      </div>

      {/* Extract button */}
      <Button
        onClick={handleExtractObjectives}
        disabled={isExtracting || !proposalText.trim() || !geminiKey}
        className="gap-2 w-full sm:w-auto"
        variant={objectives.length > 0 ? "outline" : "default"}
      >
        {isExtracting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Extracting objectives…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {objectives.length > 0
              ? "Re-extract Objectives"
              : "Extract Research Objectives"}
          </>
        )}
      </Button>

      {!geminiKey && (
        <p className="text-xs text-destructive/70">
          Set your Gemini API key above to use AI extraction
        </p>
      )}

      {/* Objectives list */}
      <AnimatePresence>
        {displayObjectives.length > 0 && currentSessionId && (
          <motion.div
            key="objectives"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 pt-2">
              <Target className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Research Objectives
              </h3>
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-mono">
                {displayObjectives.length}
              </span>
            </div>

            {displayObjectives.map((obj, i) => (
              <ObjectiveCard
                key={`obj-${currentSessionId}-${obj.slice(0, 20)}-${i}`}
                index={i + 1}
                text={obj}
                sessionId={currentSessionId}
                existingObjectiveId={existingObjectives[i]}
              />
            ))}
          </motion.div>
        )}

        {objectives.length > 0 && !currentSessionId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 rounded-lg bg-muted/30 border border-border/40 text-xs text-muted-foreground"
          >
            Create a session above to save and find papers for these objectives.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
