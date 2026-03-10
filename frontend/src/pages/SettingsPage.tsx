import { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { createCredential, getCredentials, type Credential } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Loader2, KeyRound, User, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loadingCreds, setLoadingCreds] = useState(true);
  const { toast } = useToast();

  const loadCredentials = () => {
    getCredentials()
      .then(setCredentials)
      .catch(() => {})
      .finally(() => setLoadingCreds(false));
  };

  useEffect(loadCredentials, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !token) return;
    setSaving(true);
    try {
      await createCredential({ email, github_username: username, github_token: token });
      toast({ title: "Credential Saved", description: `Added credential for ${username}` });
      setEmail("");
      setUsername("");
      setToken("");
      loadCredentials();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save credential",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-success/15 flex items-center justify-center">
            <Settings className="h-5 w-5 text-success" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-muted-foreground text-sm">Manage your saved GitHub credentials.</p>
      </motion.div>

      <GlassCard>
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          Add Credential
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/50 border-border/50 text-sm h-10"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" /> GitHub Username
            </Label>
            <Input
              id="username"
              placeholder="octocat"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-background/50 border-border/50 text-sm h-10"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gh-token" className="text-sm flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" /> GitHub Token
            </Label>
            <Input
              id="gh-token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="bg-background/50 border-border/50 font-mono text-sm h-10"
              disabled={saving}
            />
          </div>
          <Button
            type="submit"
            disabled={saving || !email || !username || !token}
            className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all active:scale-[0.98]"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Save Credential
          </Button>
        </form>
      </GlassCard>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Saved Credentials
        </h2>
        {loadingCreds ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="glass rounded-lg p-4">
                <div className="h-4 w-40 shimmer rounded" />
              </div>
            ))}
          </div>
        ) : credentials.length === 0 ? (
          <GlassCard>
            <p className="text-muted-foreground text-sm text-center py-4">
              No credentials saved yet. Add one above to get started.
            </p>
          </GlassCard>
        ) : (
          credentials.map((cred, i) => (
            <GlassCard key={cred.id} transition={{ delay: i * 0.05 }}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{cred.github_username}</p>
                  <p className="text-xs text-muted-foreground truncate">{cred.email}</p>
                </div>
                <code className="ml-auto text-xs font-mono text-muted-foreground">{cred.id.slice(0, 8)}</code>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
