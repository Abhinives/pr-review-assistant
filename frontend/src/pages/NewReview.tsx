import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { ProgressSteps } from "@/components/ProgressSteps";
import { DecisionBadge } from "@/components/DecisionBadge";
import { IssueCard } from "@/components/IssueCard";
import { runAnalysis, type ReviewResult } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, RotateCcw, GitPullRequest } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function NewReview() {
  const [prUrl, setPrUrl] = useState("");
  const [token, setToken] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [authMode, setAuthMode] = useState("token");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prUrl.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await runAnalysis({
        pr_url: prUrl,
        ...(authMode === "token" ? { github_token: token } : { credential_id: credentialId }),
      });
      setResult(data);
    } catch (err) {
      toast({
        title: "Analysis Failed",
        description: err instanceof Error ? err.message : "Failed to connect to backend",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setPrUrl("");
    setToken("");
    setCredentialId("");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <GitPullRequest className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Analyze Pull Request</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Enter a GitHub PR URL to get an AI-powered code review with AST analysis.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!result ? (
          <GlassCard key="form">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="pr-url" className="text-sm font-medium">Pull Request URL</Label>
                <Input
                  id="pr-url"
                  placeholder="https://github.com/owner/repo/pull/123"
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  className="bg-background/50 border-border/50 font-mono text-sm h-11"
                  disabled={loading}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Authentication</Label>
                <Tabs value={authMode} onValueChange={setAuthMode}>
                  <TabsList className="bg-secondary/50 border border-border/50">
                    <TabsTrigger value="token" className="text-xs">One-time Token</TabsTrigger>
                    <TabsTrigger value="saved" className="text-xs">Saved Credential</TabsTrigger>
                  </TabsList>
                  <TabsContent value="token" className="mt-3">
                    <Input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="bg-background/50 border-border/50 font-mono text-sm h-11"
                      disabled={loading}
                    />
                  </TabsContent>
                  <TabsContent value="saved" className="mt-3">
                    <Input
                      placeholder="Credential ID"
                      value={credentialId}
                      onChange={(e) => setCredentialId(e.target.value)}
                      className="bg-background/50 border-border/50 text-sm h-11"
                      disabled={loading}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <Button
                type="submit"
                disabled={loading || !prUrl.trim()}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all active:scale-[0.98] glow-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Run AI Review
                  </>
                )}
              </Button>

              {loading && <ProgressSteps />}
            </form>
          </GlassCard>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Result header */}
            <GlassCard className="space-y-4">
              <div className="flex items-center justify-between">
                <DecisionBadge decision={result.decision} />
                <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground hover:text-foreground">
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  New Review
                </Button>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{result.summary}</p>
              <code className="text-xs font-mono text-muted-foreground block">{prUrl}</code>
            </GlassCard>

            {/* Issues */}
            {result.issues.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Issues ({result.issues.length})
                </h2>
                {result.issues.map((issue, i) => (
                  <IssueCard key={`${issue.file}-${issue.line}-${i}`} issue={issue} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
