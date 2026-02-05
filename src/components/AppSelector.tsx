import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Award, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AboutDialog } from "@/components/editor/AboutDialog";

interface AppSelectorProps {
  onSelectApp: (app: "document" | "certificate") => void;
}

export function AppSelector({ onSelectApp }: AppSelectorProps) {
  const [aboutOpen, setAboutOpen] = useState(false);

  const apps = [
    {
      id: "document" as const,
      name: "Document Generator",
      description: "Create professional sponsorship documents with customizable templates",
      icon: FileText,
    },
    {
      id: "certificate" as const,
      name: "Certificate Generator",
      description: "Design and batch-generate certificates with custom backgrounds",
      icon: Award,
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Mesh Gradient with Logo */}
      <div
        className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center"
        style={{
          backgroundColor: "rgb(180 32 92)",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 3000 3000' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"), radial-gradient(circle at 0% 99%, rgb(187, 27, 102) 0%, transparent 67%), radial-gradient(circle at 46% 94%, rgb(229, 62, 93) 0%, transparent 81%), radial-gradient(circle at 93% 95%, rgb(187, 27, 102) 0%, transparent 66%), radial-gradient(circle at 50% 8%, rgb(131, 7, 57) 50%, transparent 100%)`,
          backgroundBlendMode: "overlay, normal, normal, normal, normal"
        }}
      >
        {/* White Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="w-48 h-48 flex items-center justify-center">
            <img src="/icon_white.svg" alt="docu. logo" className="w-200 h-200" draggable="false" />
          </div>
        </motion.div>
      </div>

      {/* Right Side - App Selection */}
      <div className="flex-1 lg:w-1/2 bg-background flex flex-col items-center justify-center p-8 relative">
        {/* Welcome Text */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to docu.</h1>
          <p className="text-muted-foreground">Choose an application to get started</p>
        </motion.div>

        {/* App Cards - Stacked Vertically */}
        <div className="flex flex-col gap-4 max-w-md w-full">
          {apps.map((app, index) => (
            <motion.button
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              onClick={() => onSelectApp(app.id)}
              className="app-card p-6 rounded-2xl border-2 border-transparent bg-card text-left relative overflow-hidden transition-all duration-200 hover:scale-[1.03]"
            >
              <div className="flex items-center gap-4 relative z-10">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shrink-0 transition-transform duration-200">
                  <app.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground mb-1">
                    {app.name}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                    {app.description}
                  </p>
                </div>

                {/* Arrow */}
                <span className="text-primary text-xl shrink-0">
                  →
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* About Button - Bottom Right */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-6 right-6"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAboutOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Info className="h-4 w-4 mr-2" />
            About
          </Button>
        </motion.div>

        {/* About Dialog */}
        <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
      </div>

      {/* CSS Animations */}
      <style>{`
        .app-card {
          background: linear-gradient(var(--card), var(--card)) padding-box,
                      linear-gradient(to right, var(--card), var(--card)) border-box;
          transition: all 0.2s ease;
        }
        .app-card:hover {
          background: linear-gradient(var(--card), var(--card)) padding-box,
                      linear-gradient(135deg, hsl(var(--primary)), #ec4899) border-box;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        }
      `}</style>
    </div>
  );
}
