import type { LitReviewReference } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetLiteratureReview,
  useSaveLiteratureReview,
} from "@/hooks/useQueries";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import {
  BookMarked,
  Download,
  FileText,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function genId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface MethodologyEntry {
  id: string;
  value: string;
}

interface RefEntry extends LitReviewReference {
  _authorsStr: string; // comma-separated display
}

function emptyMethodology(): MethodologyEntry {
  return { id: genId(), value: "" };
}

function emptyRef(): RefEntry {
  return {
    id: genId(),
    _authorsStr: "",
    authors: [],
    title: "",
    year: "",
    journal: "",
    doiOrUrl: "",
    notes: "",
  };
}

interface Props {
  sessionId: string;
  sessionTitle: string;
}

export function LiteratureReviewTool({ sessionId, sessionTitle }: Props) {
  const { data: existing, isLoading } = useGetLiteratureReview(sessionId);
  const saveMutation = useSaveLiteratureReview();

  const [researchGap, setResearchGap] = useState("");
  const [methodologies, setMethodologies] = useState<MethodologyEntry[]>([
    emptyMethodology(),
  ]);
  const [refs, setRefs] = useState<RefEntry[]>([emptyRef()]);
  const [populated, setPopulated] = useState(false);

  // Populate form from saved data once loaded
  useEffect(() => {
    if (existing && !populated) {
      setResearchGap(existing.researchGap);
      setMethodologies(
        existing.methodologies.length > 0
          ? existing.methodologies.map((m) => ({ id: genId(), value: m }))
          : [emptyMethodology()],
      );
      setRefs(
        existing.references.length > 0
          ? existing.references.map((r) => ({
              ...r,
              _authorsStr: r.authors.join(", "),
            }))
          : [emptyRef()],
      );
      setPopulated(true);
    }
  }, [existing, populated]);

  // ── Methodology helpers ───────────────────────────────────────────────────
  const addMethodology = () =>
    setMethodologies((prev) => [...prev, emptyMethodology()]);
  const updateMethodology = (id: string, val: string) =>
    setMethodologies((prev) =>
      prev.map((m) => (m.id === id ? { ...m, value: val } : m)),
    );
  const removeMethodology = (id: string) =>
    setMethodologies((prev) => prev.filter((m) => m.id !== id));

  // ── Reference helpers ─────────────────────────────────────────────────────
  const addRef = () => setRefs((prev) => [...prev, emptyRef()]);
  const removeRef = (id: string) =>
    setRefs((prev) => prev.filter((r) => r.id !== id));
  const updateRef = (id: string, field: keyof RefEntry, value: string) =>
    setRefs((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const cleanRefs: LitReviewReference[] = refs.map((r) => ({
      id: r.id,
      authors: r._authorsStr
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      title: r.title,
      year: r.year,
      journal: r.journal,
      doiOrUrl: r.doiOrUrl,
      notes: r.notes,
    }));

    const cleanMethodologies = methodologies
      .map((m) => m.value)
      .filter((m) => m.trim() !== "");

    try {
      await saveMutation.mutateAsync({
        sessionId,
        researchGap,
        methodologies: cleanMethodologies,
        refs: cleanRefs,
      });
      toast.success("Literature review saved.");
    } catch {
      toast.error("Failed to save literature review.");
    }
  };

  // ── Word Export ───────────────────────────────────────────────────────────
  const handleExport = async () => {
    const cleanRefs: LitReviewReference[] = refs.map((r) => ({
      id: r.id,
      authors: r._authorsStr
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      title: r.title,
      year: r.year,
      journal: r.journal,
      doiOrUrl: r.doiOrUrl,
      notes: r.notes,
    }));

    const cleanMethodologies = methodologies
      .map((m) => m.value)
      .filter((m) => m.trim() !== "");

    try {
      const children: Paragraph[] = [
        new Paragraph({
          text: sessionTitle,
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: "Literature Review",
          heading: HeadingLevel.HEADING_2,
        }),

        // Research Gap section
        new Paragraph({
          text: "Research Gap",
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({ text: researchGap }),
        new Paragraph({ text: "" }),

        // Methodologies
        new Paragraph({
          text: "Methodologies Used",
          heading: HeadingLevel.HEADING_3,
        }),
        ...cleanMethodologies.map(
          (m) =>
            new Paragraph({
              text: m,
              bullet: { level: 0 },
            }),
        ),
        new Paragraph({ text: "" }),

        // References
        new Paragraph({
          text: "References",
          heading: HeadingLevel.HEADING_3,
        }),
        ...cleanRefs.flatMap((r, i) => {
          const authorsStr = r.authors.join(", ");
          const apa = `${authorsStr}${authorsStr ? " " : ""}(${r.year}). ${r.title}. ${r.journal}.${r.doiOrUrl ? ` ${r.doiOrUrl}.` : ""}`;
          const paras: Paragraph[] = [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${i + 1}. `,
                  bold: true,
                }),
                new TextRun({ text: apa }),
              ],
            }),
          ];
          if (r.notes) {
            paras.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `   Notes: ${r.notes}`,
                    italics: true,
                    size: 20,
                  }),
                ],
              }),
            );
          }
          paras.push(new Paragraph({ text: "" }));
          return paras;
        }),
      ];

      const doc = new Document({
        sections: [{ children }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `literature-review-${sessionTitle.replace(/\s+/g, "-").toLowerCase()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Word document downloaded.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Word document.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading literature review...
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* ── Research Gap ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-primary/12 border border-primary/20 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-primary" />
          </div>
          <h3 className="font-display text-sm font-semibold text-foreground">
            Research Gap
          </h3>
        </div>
        <Label htmlFor="research-gap" className="text-xs text-muted-foreground">
          Describe the gap in current literature your research addresses
        </Label>
        <Textarea
          id="research-gap"
          value={researchGap}
          onChange={(e) => setResearchGap(e.target.value)}
          placeholder="Despite extensive research on X, there remains a significant gap in understanding Y. This study addresses this gap by..."
          className="min-h-[120px] bg-background/50 border-border/60 text-sm resize-none"
          rows={5}
        />
      </div>

      <Separator className="bg-border/40" />

      {/* ── Methodologies ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/12 border border-primary/20 flex items-center justify-center">
              <BookMarked className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="font-display text-sm font-semibold text-foreground">
              Methodologies Used
            </h3>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMethodology}
            className="h-7 text-xs border-border/60 gap-1"
          >
            <Plus className="w-3 h-3" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {methodologies.map((m) => (
            <div key={m.id} className="flex gap-2 items-center">
              <Input
                value={m.value}
                onChange={(e) => updateMethodology(m.id, e.target.value)}
                placeholder="e.g. Systematic Literature Review, Thematic Analysis, Mixed Methods…"
                className="bg-background/50 border-border/60 text-sm flex-1"
              />
              {methodologies.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMethodology(m.id)}
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-border/40" />

      {/* ── References ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/12 border border-primary/20 flex items-center justify-center">
              <BookMarked className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="font-display text-sm font-semibold text-foreground">
              References
            </h3>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRef}
            className="h-7 text-xs border-border/60 gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Reference
          </Button>
        </div>

        <div className="space-y-4">
          {refs.map((ref, i) => (
            <div
              key={ref.id}
              className="relative bg-background/30 border border-border/50 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Reference {i + 1}
                </span>
                {refs.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRef(ref.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {/* Title */}
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input
                    value={ref.title}
                    onChange={(e) => updateRef(ref.id, "title", e.target.value)}
                    placeholder="Paper or thesis title"
                    className="bg-background/50 border-border/60 text-sm"
                  />
                </div>

                {/* Authors */}
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Authors{" "}
                    <span className="text-muted-foreground/60">
                      (comma-separated)
                    </span>
                  </Label>
                  <Input
                    value={ref._authorsStr}
                    onChange={(e) =>
                      updateRef(ref.id, "_authorsStr", e.target.value)
                    }
                    placeholder="Smith, J., Doe, A., Johnson, K."
                    className="bg-background/50 border-border/60 text-sm"
                  />
                </div>

                {/* Published Year */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Published Year
                  </Label>
                  <Input
                    value={ref.year}
                    onChange={(e) => updateRef(ref.id, "year", e.target.value)}
                    placeholder="2024"
                    maxLength={4}
                    className="bg-background/50 border-border/60 text-sm"
                  />
                </div>

                {/* Journal / Paper */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Journal / Paper
                  </Label>
                  <Input
                    value={ref.journal}
                    onChange={(e) =>
                      updateRef(ref.id, "journal", e.target.value)
                    }
                    placeholder="Nature, arXiv, ICML Proceedings…"
                    className="bg-background/50 border-border/60 text-sm"
                  />
                </div>

                {/* DOI or URL */}
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    DOI or URL
                  </Label>
                  <Input
                    value={ref.doiOrUrl}
                    onChange={(e) =>
                      updateRef(ref.id, "doiOrUrl", e.target.value)
                    }
                    placeholder="https://doi.org/10.xxxx/... or https://arxiv.org/abs/..."
                    className="bg-background/50 border-border/60 text-sm"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Notes{" "}
                    <span className="text-muted-foreground/60">(optional)</span>
                  </Label>
                  <Input
                    value={ref.notes}
                    onChange={(e) => updateRef(ref.id, "notes", e.target.value)}
                    placeholder="Key findings, relevance to your research…"
                    className="bg-background/50 border-border/60 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-border/40" />

      {/* ── Action Buttons ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Literature Review
            </>
          )}
        </Button>

        <Button
          onClick={handleExport}
          variant="outline"
          className="border-border/60 gap-2 font-semibold"
        >
          <Download className="h-4 w-4" />
          Export as Word (.docx)
        </Button>
      </div>
    </div>
  );
}
