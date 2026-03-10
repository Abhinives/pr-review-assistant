import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function GlassCard({ children, className, glow, ...props }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "glass rounded-xl p-6",
        glow && "animate-glow-pulse",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
