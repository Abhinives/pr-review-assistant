import { useState } from "react";
import { ReviewIssue } from "@/lib/api";
import { SeverityBadge } from "./SeverityBadge";
import { ChevronDown, FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function IssueCard({ issue, index }: { issue: ReviewIssue; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-lg overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors active:scale-[0.995]"
      >
        <FileCode2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <code className="text-xs font-mono text-primary truncate flex-1">{issue.file}</code>
        <span className="text-xs font-mono text-muted-foreground shrink-0">Line {issue.line}</span>
        <SeverityBadge severity={issue.severity} />
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
              <p className="text-sm text-foreground/80 leading-relaxed">{issue.description}</p>
              {issue.fix && (
                <div className="rounded-md bg-background/80 border border-border/50 p-3 overflow-x-auto">
                  <pre className="text-xs font-mono text-success whitespace-pre-wrap">{issue.fix}</pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
