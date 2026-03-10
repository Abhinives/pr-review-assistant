import { cn } from "@/lib/utils";
import { CheckCircle, MessageCircle, XCircle } from "lucide-react";

const decisionConfig: Record<string, { icon: typeof CheckCircle; label: string; className: string }> = {
  approve: {
    icon: CheckCircle,
    label: "Approved",
    className: "bg-success/15 text-success border-success/30 glow-success",
  },
  approved: {   // 👈 ADD THIS
    icon: CheckCircle,
    label: "Approved",
    className: "bg-success/15 text-success border-success/30 glow-success",
  },
  comment: {
    icon: MessageCircle,
    label: "Comment",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  request_changes: {
    icon: XCircle,
    label: "Changes Requested",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

export function DecisionBadge({ decision }: { decision: string }) {
  const config = decisionConfig[decision.toLowerCase()] || decisionConfig.comment;
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border", config.className)}>
      <Icon className="h-5 w-5" />
      {config.label}
    </span>
  );
}
