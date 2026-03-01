import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useCreateUserProfile, useUserProfile } from "@/hooks/useQueries";
import { GraduationCap, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ProfileSetupModal() {
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading } = useUserProfile();
  const createProfile = useCreateUserProfile();

  const [displayName, setDisplayName] = useState("");
  const [institution, setInstitution] = useState("");
  const [researchField, setResearchField] = useState("");

  const isOpen = !!identity && !isLoading && profile === null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    try {
      await createProfile.mutateAsync({
        displayName: displayName.trim(),
        institution: institution.trim() || null,
        researchField: researchField.trim() || null,
      });
      toast.success("Profile created! Welcome to PhD Research Assistant.");
    } catch {
      toast.error("Failed to create profile. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md glass-card border-border/60"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-primary" />
            </div>
            <DialogTitle className="font-display text-lg font-bold">
              Complete Your Profile
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Tell us a bit about yourself to personalise your research
            experience. You can update these details at any time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="displayName" className="text-sm font-medium">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Dr. Jane Smith"
              className="bg-background/60 border-border/60"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="institution" className="text-sm font-medium">
              Institution{" "}
              <span className="text-muted-foreground text-xs font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="University of Cambridge"
              className="bg-background/60 border-border/60"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="researchField" className="text-sm font-medium">
              Research Field{" "}
              <span className="text-muted-foreground text-xs font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="researchField"
              value={researchField}
              onChange={(e) => setResearchField(e.target.value)}
              placeholder="Machine Learning & NLP"
              className="bg-background/60 border-border/60"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold mt-2"
            disabled={!displayName.trim() || createProfile.isPending}
          >
            {createProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              "Create Profile & Continue"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
