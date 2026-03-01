import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGeminiKey, setGeminiKey } from "@/utils/gemini";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface GeminiKeySetupProps {
  onKeyChange: (key: string) => void;
}

export function GeminiKeySetup({ onKeyChange }: GeminiKeySetupProps) {
  const [inputKey, setInputKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const stored = getGeminiKey();
    setSavedKey(stored);
    if (stored) onKeyChange(stored);
  }, [onKeyChange]);

  const handleSave = () => {
    const trimmed = inputKey.trim();
    if (!trimmed) {
      toast.error("Please enter a valid API key");
      return;
    }
    setGeminiKey(trimmed);
    setSavedKey(trimmed);
    setInputKey("");
    onKeyChange(trimmed);
    toast.success("Gemini API key saved");
  };

  const handleClear = () => {
    setGeminiKey("");
    setSavedKey("");
    setInputKey("");
    onKeyChange("");
    toast.info("API key cleared");
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-card/60 border border-border/60 rounded-lg backdrop-blur-sm">
      <div className="flex items-center gap-2 shrink-0">
        <KeyRound className="w-4 h-4 text-primary" />
        <Label className="text-sm font-medium text-foreground/80 whitespace-nowrap">
          Google AI Studio Key
        </Label>
      </div>

      {savedKey ? (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <CheckCircle2
            className="w-4 h-4 text-chart-2 shrink-0"
            style={{ color: "oklch(0.60 0.16 160)" }}
          />
          <span className="text-sm text-muted-foreground font-mono">
            {savedKey.slice(0, 8)}••••••••{savedKey.slice(-4)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive/70 hover:text-destructive ml-auto"
            onClick={handleClear}
          >
            Clear
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="AIza••••••••••••••••••••••••••••••"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="h-8 text-sm pr-9 font-mono bg-background/60"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <Button size="sm" className="h-8 px-3 text-xs" onClick={handleSave}>
              Save Key
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
