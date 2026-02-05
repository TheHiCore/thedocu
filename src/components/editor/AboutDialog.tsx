import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Linkedin, Github, Info, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tab = "about" | "contact";

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>("about");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="flex h-[700px]">
          {/* Sidebar */}
          <div className="w-48 bg-muted/50 border-r border-border p-4 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("about")}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === "about"
                  ? "bg-primary-gradient text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Info className="h-4 w-4" />
              About docu.
            </button>
            <button
              onClick={() => setActiveTab("contact")}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === "contact"
                  ? "bg-primary-gradient text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <MessageCircle className="h-4 w-4" />
              Contact
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-auto">
            {activeTab === "about" ? (
              <div className="flex flex-col items-center text-center">
                {/* Logo placeholder */}
                <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center mb-6 border border-border">
                  <img src="/icon.svg" alt="docu. logo" className="w-16 h-16" />
                </div>
                
                <h2 className="text-2xl font-bold text-foreground mb-2">docu.</h2>
                <p className="text-muted-foreground text-sm mb-6">Version 1.0.0</p>
                
                <div className="space-y-4 text-left w-full max-w-sm">
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <h3 className="font-semibold text-foreground mb-2">About the App</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      docu. is a professional document editor designed to create beautiful sponsoring letters and formal documents with ease. Features include customizable templates, multi-signer support, and PDF export.
                    </p>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <h3 className="font-semibold text-foreground mb-2">Features</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Template management & library</li>
                      <li>• Markdown-based text editing</li>
                      <li>• Multi-page document support</li>
                      <li>• Multiple signature support</li>
                      <li>• PDF export functionality</li>
                      <li>• Template import/export</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <MessageCircle className="h-10 w-10 text-primary" />
                </div>
                
                <h2 className="text-2xl font-bold text-foreground mb-2">Get in Touch</h2>
                <p className="text-muted-foreground text-sm mb-8 max-w-sm">
                  Have questions, feedback, or want to collaborate? Reach out through any of these channels.
                </p>
                
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => window.open("mailto:khaled.ferroukhi@outlook.com")}
                  >
                    <Mail className="h-5 w-5 text-primary" />
                    <span>khaled.ferroukhi@outlook.com</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => window.open("https://www.linkedin.com/in/thehicore/")}
                  >
                    <Linkedin className="h-5 w-5 text-primary" />
                    <span>Khaled Ferroukhi</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => window.open("https://github.com/TheHiCore")}
                  >
                    <Github className="h-5 w-5 text-primary" />
                    <span>TheHiCore</span>
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground mt-8">
                  © 2025 docu. All rights reserved.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
