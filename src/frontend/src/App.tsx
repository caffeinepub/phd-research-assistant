import type { ResearchSession } from "@/backend.d";
import { AccountMenu } from "@/components/AccountMenu";
import { AuthGuard } from "@/components/AuthGuard";
import { GeminiKeySetup } from "@/components/GeminiKeySetup";
import { HistoryPanel } from "@/components/HistoryPanel";
import { LiteratureReviewTool } from "@/components/LiteratureReviewTool";
import { PaperLibrary } from "@/components/PaperLibrary";
import { ProfileSetupModal } from "@/components/ProfileSetupModal";
import { ProposalBlock } from "@/components/ProposalBlock";
import { UploadBlock } from "@/components/UploadBlock";
import { Toaster } from "@/components/ui/sonner";
import { BookMarked, BookOpen, FileSearch, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";

// Section wrapper component
function Section({
  id,
  icon: Icon,
  title,
  subtitle,
  children,
  delay = 0,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card/40 border border-border/50 rounded-2xl overflow-hidden shadow-card"
    >
      <div className="px-6 py-4 border-b border-border/40 bg-background/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground section-title">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </motion.section>
  );
}

function AppContent() {
  const [geminiKey, setGeminiKey] = useState("");
  const [activeSession, setActiveSession] = useState<ResearchSession | null>(
    null,
  );

  const handleKeyChange = useCallback((key: string) => {
    setGeminiKey(key);
  }, []);

  const handleSessionCreated = useCallback((session: ResearchSession) => {
    setActiveSession(session);
  }, []);

  const handleSelectHistorySession = useCallback((session: ResearchSession) => {
    setActiveSession(session);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.55 0.18 250 / 0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, oklch(0.78 0.14 72 / 0.05) 0%, transparent 60%)",
        }}
      />

      {/* App layout */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-md"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-4 py-3">
              {/* Logo */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-primary/30 shrink-0">
                  <img
                    src="/assets/generated/phd-research-logo-transparent.dim_64x64.png"
                    alt="ResAssta logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="font-display text-base font-bold text-foreground leading-none">
                    <span className="text-gradient">Res</span>Assta
                  </h1>
                  <p className="text-[10px] text-muted-foreground leading-none mt-0.5 tracking-wide">
                    AI-powered research discovery
                  </p>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <GeminiKeySetup onKeyChange={handleKeyChange} />
              </div>

              {/* Session indicator */}
              {activeSession && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs text-primary font-medium truncate max-w-28">
                    {activeSession.title}
                  </span>
                </div>
              )}

              {/* Account Menu */}
              <AccountMenu />
            </div>
          </div>
        </motion.header>

        {/* Main content */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 pr-12">
          <div className="space-y-5">
            {/* Upload Section */}
            <Section
              id="upload"
              icon={Upload}
              title="Upload Research Papers / Thesis / Links"
              subtitle="Drag & drop PDFs or paste URLs — get AI summaries for each"
              delay={0.05}
            >
              <UploadBlock geminiKey={geminiKey} />
            </Section>

            {/* Proposal & Objectives Section */}
            <Section
              id="proposal"
              icon={FileSearch}
              title="Research Proposal & Objective Discovery"
              subtitle="Upload or paste your proposal — extract objectives and find matching papers from arXiv, Semantic Scholar, Shodhganga & more"
              delay={0.1}
            >
              <ProposalBlock
                geminiKey={geminiKey}
                activeSession={activeSession}
                onSessionCreated={handleSessionCreated}
              />
            </Section>

            {/* Paper Library */}
            <Section
              id="library"
              icon={BookOpen}
              title="Paper Library"
              subtitle={
                activeSession
                  ? `${activeSession.title} — browse, summarize, cite`
                  : "Create a session to build your paper library"
              }
              delay={0.15}
            >
              <PaperLibrary
                sessionId={activeSession?.id || null}
                geminiKey={geminiKey}
              />
            </Section>

            {/* Literature Review — only when a session is active */}
            {activeSession && (
              <Section
                id="lit-review"
                icon={BookMarked}
                title="Literature Review"
                subtitle="Document your research gap, methodologies, and references — export as Word"
                delay={0.2}
              >
                <LiteratureReviewTool
                  sessionId={activeSession.id}
                  sessionTitle={activeSession.title}
                />
              </Section>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/40 py-4 px-6 relative z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
            <span>
              ResAssta — arXiv · Semantic Scholar · Shodhganga · Global
              Repositories
            </span>
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              © {new Date().getFullYear()}. Built with ♥ using caffeine.ai
            </a>
          </div>
        </footer>
      </div>

      {/* History Side Panel */}
      <HistoryPanel
        activeSessionId={activeSession?.id || null}
        onSelectSession={handleSelectHistorySession}
      />

      {/* Profile setup modal — shown when logged in but no profile yet */}
      <ProfileSetupModal />

      <Toaster richColors position="bottom-right" />
    </div>
  );
}

export default function App() {
  return (
    <AuthGuard>
      <AppContent />
    </AuthGuard>
  );
}
