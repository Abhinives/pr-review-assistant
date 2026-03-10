import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { useEffect, useState } from "react";

const steps = [
  "Fetching PR Metadata...",
  "Skeletonizing AST...",
  "Running Ollama Inference...",
  "Generating Review Report...",
];

export function ProgressSteps() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3 py-4">
      <AnimatePresence>
        {steps.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-3 text-sm"
          >
            {i < current ? (
              <Check className="h-4 w-4 text-success shrink-0" />
            ) : i === current ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-border shrink-0" />
            )}
            <span className={i <= current ? "text-foreground" : "text-muted-foreground"}>
              {step}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
