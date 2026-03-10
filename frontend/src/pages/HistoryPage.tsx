import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { DecisionBadge } from "@/components/DecisionBadge";
import { getHistory, type HistoryItem } from "@/lib/api";
import { History, ExternalLink, ChevronDown, ChevronUp, AlertTriangle, Wrench, FileCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
interface ReviewIssue {
  file_name: string;
  line_number: number | null;
  severity: string;
  description: string;
  fix_suggestion: string;
}

interface ReviewDetails {
  review_id: string;
  pr_url: string;
  decision: string;
  summary: string;
  created_at: string;
  issues: ReviewIssue[];
}

// --- API call ---
async function getReviewDetails(reviewId: string): Promise<ReviewDetails> {
  const res = await fetch(`http://localhost:8000/history/${reviewId}`);
  if (!res.ok) throw new Error("Failed to fetch review details");
  return res.json();
}

// --- Severity styling ---
const severityConfig: Record<string, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-red-500/15 text-red-400 border border-red-500/30" },
  high: { label: "High", className: "bg-orange-500/15 text-orange-400 border border-orange-500/30" },
  medium: { label: "Medium", className: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30" },
  low: { label: "Low", className: "bg-blue-500/15 text-blue-400 border border-blue-500/30" },
  info: { label: "Info", className: "bg-muted text-muted-foreground border border-border" },
};

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = severityConfig[severity.toLowerCase()] ?? severityConfig.info;
  return (
    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// --- Issue Card ---
function IssueCard({ issue, index }: { issue: ReviewIssue; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-2"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <code className="text-xs font-mono text-primary truncate">{issue.file_name}</code>
          {issue.line_number != null && (
            <span className="text-xs text-muted-foreground">:{issue.line_number}</span>
          )}
        </div>
        <SeverityBadge severity={issue.severity} />
      </div>

      <p className="text-sm text-foreground/80">{issue.description}</p>

      {issue.fix_suggestion && (
        <div className="flex items-start gap-2 rounded-md bg-accent/10 border border-accent/20 px-3 py-2">
          <Wrench className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
          <p className="text-xs text-foreground/70">{issue.fix_suggestion}</p>
        </div>
      )}
    </motion.div>
  );
}

// --- Review Detail Panel ---
function ReviewDetailPanel({ reviewId }: { reviewId: string }) {
  const [details, setDetails] = useState<ReviewDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getReviewDetails(reviewId)
      .then(setDetails)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [reviewId]);

  if (loading) {
    return (
      <div className="mt-4 space-y-2 pt-4 border-t border-border/50">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-16 shimmer rounded-lg" />
        ))}
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center py-4">Failed to load review details.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
      {details.issues.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No issues found for this review.</p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {details.issues.length} issue{details.issues.length !== 1 ? "s" : ""} found
            </span>
          </div>
          {details.issues.map((issue, i) => (
            <IssueCard key={i} issue={issue} index={i} />
          ))}
        </>
      )}
    </div>
  );
}

// --- Main Page ---
export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getHistory()
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center">
            <History className="h-5 w-5 text-accent" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Review History</h1>
        </div>
        <p className="text-muted-foreground text-sm">Browse your previously analyzed pull requests.</p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 space-y-3">
              <div className="h-4 w-32 shimmer rounded" />
              <div className="h-3 w-full shimmer rounded" />
              <div className="h-3 w-2/3 shimmer rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <GlassCard>
          <p className="text-muted-foreground text-sm text-center py-8">
            Unable to load history. Make sure the backend is running at localhost:8000.
          </p>
        </GlassCard>
      ) : items.length === 0 ? (
        <GlassCard>
          <p className="text-muted-foreground text-sm text-center py-8">
            No reviews yet. Run your first analysis to see it here.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => {
            const isExpanded = expandedId === item.id;
            return (
              <GlassCard key={item.id} transition={{ delay: i * 0.05 }}>
                {/* Clickable header row */}
                <div
                  className="flex items-start justify-between gap-4 cursor-pointer select-none"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <DecisionBadge decision={item.decision} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <code className="text-xs font-mono text-primary block truncate">{item.pr_url}</code>
                    <p className="text-sm text-foreground/70 line-clamp-2">{item.summary}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={item.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expandable detail panel */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="detail"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <ReviewDetailPanel reviewId={item.id} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}