import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  BookOpen,
  GraduationCap,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";

function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  const features = [
    {
      icon: Search,
      title: "Intelligent Paper Discovery",
      desc: "Find papers from arXiv, Semantic Scholar, and global repositories with per-objective search",
    },
    {
      icon: BookOpen,
      title: "Structured Literature Reviews",
      desc: "Document research gaps, methodologies, and references — export as Word documents",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Summaries",
      desc: "Gemini-based summarization, citations in APA & MLA, and objective extraction from proposals",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background atmosphere */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% -10%, oklch(0.55 0.18 250 / 0.12) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 90% 90%, oklch(0.78 0.14 72 / 0.07) 0%, transparent 55%), radial-gradient(ellipse 40% 30% at 10% 60%, oklch(0.60 0.16 160 / 0.06) 0%, transparent 55%)",
        }}
      />

      {/* Grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.93 0.01 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.93 0.01 250) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Minimal header */}
        <header className="px-6 py-4 border-b border-border/30">
          <div className="max-w-5xl mx-auto flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-primary/30">
              <img
                src="/assets/generated/phd-research-logo-transparent.dim_64x64.png"
                alt="ResAssta"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-display text-base font-bold text-foreground">
              <span className="text-gradient">Res</span>Assta
            </span>
          </div>
        </header>

        {/* Main login area */}
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-4xl">
            <div className="grid lg:grid-cols-[1fr_340px] gap-12 items-center">
              {/* Left — headline */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
                  <GraduationCap className="w-3.5 h-3.5" />
                  For PhD Researchers
                </div>

                <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
                  Your research,{" "}
                  <span className="text-gradient">organised</span>
                  <br />
                  and amplified
                </h1>

                <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-lg">
                  Discover papers, extract objectives from proposals, build
                  structured literature reviews, and export polished Word
                  documents — all in one place.
                </p>

                <div className="space-y-3">
                  {features.map((f, i) => (
                    <motion.div
                      key={f.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/12 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <f.icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground leading-snug">
                          {f.title}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {f.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Right — sign-in card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="glass-card rounded-2xl p-8 shadow-card"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-primary/30 mx-auto mb-4">
                    <img
                      src="/assets/generated/phd-research-logo-transparent.dim_64x64.png"
                      alt="ResAssta"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h2 className="font-display text-xl font-bold text-foreground mb-1">
                    Sign in to continue
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Secure login via Internet Identity
                  </p>
                </div>

                <Button
                  onClick={login}
                  disabled={isLoggingIn}
                  className="w-full h-11 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-glow"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Sign in with Internet Identity"
                  )}
                </Button>

                <div className="mt-6 pt-6 border-t border-border/40">
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    Internet Identity provides secure, private authentication
                    without passwords. Your research data is stored on the
                    decentralised Internet Computer network.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/30 py-4 px-6 text-center">
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            © {new Date().getFullYear()}. Built with ♥ using caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-primary/30">
            <img
              src="/assets/generated/phd-research-logo-transparent.dim_64x64.png"
              alt="ResAssta"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
