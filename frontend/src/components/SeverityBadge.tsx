import { cn } from "@/lib/utils";

const severityStyles: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/15 text-warning border-warning/30",
  low: "bg-primary/15 text-primary border-primary/30",
  info: "bg-muted text-muted-foreground border-border",
};

export function SeverityBadge({ severity }: { severity: string }) {
  const s = severity.toLowerCase();
  const style = severityStyles[s] || severityStyles.info;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium border", style)}>
      {severity}
    </span>
  );
}
