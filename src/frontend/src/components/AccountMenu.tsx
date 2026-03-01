import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useUpdateUserProfile, useUserProfile } from "@/hooks/useQueries";
import {
  Building2,
  FlaskConical,
  Loader2,
  LogOut,
  Pencil,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

export function AccountMenu() {
  const { clear, identity } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const updateProfile = useUpdateUserProfile();

  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [institution, setInstitution] = useState("");
  const [researchField, setResearchField] = useState("");

  const handleOpenEdit = () => {
    setDisplayName(profile?.displayName ?? "");
    setInstitution(profile?.institution ?? "");
    setResearchField(profile?.researchField ?? "");
    setEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    try {
      await updateProfile.mutateAsync({
        displayName: displayName.trim(),
        institution: institution.trim() || null,
        researchField: researchField.trim() || null,
      });
      toast.success("Profile updated.");
      setEditOpen(false);
    } catch {
      toast.error("Failed to update profile.");
    }
  };

  const handleSignOut = () => {
    clear();
  };

  const initials = profile?.displayName
    ? getInitials(profile.displayName)
    : identity
      ? "U"
      : "";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 h-9 px-2 hover:bg-accent/60 rounded-lg"
          >
            <Avatar className="h-7 w-7 border border-primary/30">
              <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {profile?.displayName && (
              <span className="hidden sm:block text-sm font-medium text-foreground max-w-28 truncate">
                {profile.displayName}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-64 glass-card border-border/60 p-1"
        >
          {/* Profile info header */}
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-primary/30 shrink-0">
                <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {profile?.displayName ?? "My Account"}
                </p>
                {profile?.institution && (
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3 shrink-0" />
                    {profile.institution}
                  </p>
                )}
                {profile?.researchField && (
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <FlaskConical className="w-3 h-3 shrink-0" />
                    {profile.researchField}
                  </p>
                )}
                {!profile && (
                  <p className="text-xs text-muted-foreground">
                    No profile yet
                  </p>
                )}
              </div>
            </div>
          </div>

          <DropdownMenuSeparator className="bg-border/40 my-1" />

          <DropdownMenuItem
            onClick={handleOpenEdit}
            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent/60 rounded-md"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            Edit Profile
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border/40 my-1" />

          <DropdownMenuItem
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-destructive/15 text-destructive rounded-md"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md glass-card border-border/60">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <DialogTitle className="font-display text-lg font-bold">
                Edit Profile
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Update your researcher profile information.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label htmlFor="edit-displayName" className="text-sm font-medium">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dr. Jane Smith"
                className="bg-background/60 border-border/60"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-institution" className="text-sm font-medium">
                Institution{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="edit-institution"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="University of Cambridge"
                className="bg-background/60 border-border/60"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="edit-researchField"
                className="text-sm font-medium"
              >
                Research Field{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="edit-researchField"
                value={researchField}
                onChange={(e) => setResearchField(e.target.value)}
                placeholder="Machine Learning & NLP"
                className="bg-background/60 border-border/60"
              />
            </div>

            <DialogFooter className="gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="border-border/60"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!displayName.trim() || updateProfile.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
