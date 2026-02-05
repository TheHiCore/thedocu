import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface EditorSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function EditorSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: EditorSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="group">
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-3 px-1 text-left hover:bg-accent/50 rounded-lg transition-colors">
        {icon && <span className="text-primary">{icon}</span>}
        <span className="text-sm font-semibold text-foreground flex-1">
          {title}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pb-4 space-y-3"
        >
          {children}
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}
