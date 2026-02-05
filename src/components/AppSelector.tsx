import { motion } from "framer-motion";
import { FileText, Award } from "lucide-react";

interface AppSelectorProps {
  onSelectApp: (app: "document" | "certificate") => void;
}

export function AppSelector({ onSelectApp }: AppSelectorProps) {
  const apps = [
    {
      id: "document" as const,
      name: "Document Generator",
      description: "Create professional sponsorship documents with customizable templates",
      icon: FileText,
      gradient: "from-primary to-pink-500",
    },
    {
      id: "certificate" as const,
      name: "Certificate Generator",
      description: "Design and batch-generate certificates with custom backgrounds",
      icon: Award,
      gradient: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      {/* Logo and Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <img src="/icon_full.svg" className="w-32 mx-auto mb-6" alt="docu." />
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to docu.</h1>
        <p className="text-muted-foreground">Choose an application to get started</p>
      </motion.div>

      {/* App Cards */}
      <div className="flex flex-col md:flex-row gap-6 max-w-4xl w-full">
        {apps.map((app, index) => (
          <motion.button
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectApp(app.id)}
            className="flex-1 p-8 rounded-2xl border border-border bg-card hover:shadow-elevated transition-shadow text-left group"
          >
            {/* Icon */}
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <app.icon className="w-8 h-8 text-white" />
            </div>

            {/* Content */}
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {app.name}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {app.description}
            </p>

            {/* Arrow indicator */}
            <div className="mt-6 flex items-center text-primary font-medium text-sm">
              Open App
              <motion.span
                className="ml-2"
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
              >
                →
              </motion.span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
