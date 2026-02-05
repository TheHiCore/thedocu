import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { CertificateTemplate, CertificateEntry, createDefaultCertificateTemplate, TextConfig } from "@/types/certificate";
import { useCertificateTemplates } from "@/hooks/useCertificateTemplates";
import { CertificateSidebar } from "./CertificateSidebar";
import { CertificateRightSidebar } from "./CertificateRightSidebar";
import { CertificatePreview } from "./CertificatePreview";
import { CertificateTemplateLibrary } from "./CertificateTemplateLibrary";
import { DataEntryDialog } from "./DataEntryDialog";
import { BackgroundDialog } from "./BackgroundDialog";
import { AboutDialog } from "@/components/editor/AboutDialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileDown, Library, Save, FileImage, Info, ChevronLeft, ChevronRight, Grid, LayoutTemplate, FileText, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CertificateEditorProps {
  onBack: () => void;
}

type ViewMode = "template" | "single" | "grid";

export function CertificateEditor({ onBack }: CertificateEditorProps) {
  const {
    templates,
    customFonts,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    addCustomFont,
  } = useCertificateTemplates();

  const [currentTemplate, setCurrentTemplate] = useState<CertificateTemplate | null>(null);
  const [entries, setEntries] = useState<CertificateEntry[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [dataEntryOpen, setDataEntryOpen] = useState(false);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const [previewScale, setPreviewScale] = useState(0.5);
  const [viewMode, setViewMode] = useState<ViewMode>("template");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sidebar widths
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(400);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(400);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  const selectedEntries = useMemo(() =>
    entries.filter(e => e.selected && e.name.trim()),
    [entries]
  );

  const hasData = selectedEntries.length > 0;

  // Clamp currentIndex when entries change
  useEffect(() => {
    if (currentIndex >= selectedEntries.length && selectedEntries.length > 0) {
      setCurrentIndex(selectedEntries.length - 1);
    } else if (selectedEntries.length === 0) {
      setCurrentIndex(0);
    }
  }, [selectedEntries.length, currentIndex]);

  // Auto-switch to single view when data is added (if in template mode)
  useEffect(() => {
    if (hasData && viewMode === "template") {
      setViewMode("single");
    } else if (!hasData && viewMode !== "template") {
      setViewMode("template");
    }
  }, [hasData]);

  // Calculate preview scale based on viewport
  useEffect(() => {
    const updateScale = () => {
      const leftW = leftSidebarCollapsed ? 32 : leftSidebarWidth;
      const rightW = rightSidebarCollapsed ? 32 : rightSidebarWidth;
      const availableWidth = window.innerWidth - leftW - rightW - 64;
      const availableHeight = window.innerHeight - 245; // Account for header, controls, and footer

      const isLandscape = currentTemplate?.orientation === "landscape";
      const docWidth = (isLandscape ? 297 : 210) * 3.78;
      const docHeight = (isLandscape ? 210 : 297) * 3.78;

      const scaleX = availableWidth / docWidth;
      const scaleY = availableHeight / docHeight;
      setPreviewScale(Math.min(scaleX, scaleY, 0.9));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [leftSidebarWidth, leftSidebarCollapsed, rightSidebarWidth, rightSidebarCollapsed, currentTemplate?.orientation]);

  // Keyboard navigation for single view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys in single view mode with data
      if (viewMode !== "single" || !hasData) return;

      // Don't handle if focus is in an input/textarea
      const activeElement = document.activeElement;
      if (activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentIndex(prev => Math.min(selectedEntries.length - 1, prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, hasData, selectedEntries.length]);

  // Handle entry-specific changes
  const handleEntryChange = useCallback((updates: Partial<CertificateEntry>) => {
    if (!hasData || currentIndex >= selectedEntries.length) return;

    const entryId = selectedEntries[currentIndex].id;
    setEntries(prev => prev.map(e =>
      e.id === entryId ? { ...e, ...updates } : e
    ));
  }, [currentIndex, selectedEntries, hasData]);

  const handleTemplateChange = useCallback((updates: Partial<CertificateTemplate>) => {
    if (!currentTemplate) return;
    setCurrentTemplate((prev) => (prev ? { ...prev, ...updates } : null));
  }, [currentTemplate]);

  const handleSelectTemplate = useCallback((template: CertificateTemplate) => {
    setCurrentTemplate({ ...template });
    setViewMode("template");
    toast.success(`Loaded template: ${template.name}`);
  }, []);

  const handleCreateTemplate = useCallback(() => {
    const newTemplate = createDefaultCertificateTemplate();
    setCurrentTemplate(newTemplate);
    setViewMode("template");
    toast.success("Created new template");
  }, []);

  const handleSaveTemplate = useCallback(() => {
    if (!currentTemplate) return;
    setSaveTemplateName(currentTemplate.name);
    setSaveDialogOpen(true);
  }, [currentTemplate]);

  const handleConfirmSave = useCallback(() => {
    if (!currentTemplate || !saveTemplateName.trim()) return;

    const templateToSave = {
      ...currentTemplate,
      name: saveTemplateName.trim(),
    };

    const existing = templates.find((t) => t.id === currentTemplate.id);
    if (existing) {
      updateTemplate(currentTemplate.id, templateToSave);
      toast.success("Template updated");
    } else {
      addTemplate(templateToSave);
      toast.success("Template saved");
    }

    setCurrentTemplate(templateToSave);
    setSaveDialogOpen(false);
  }, [currentTemplate, saveTemplateName, templates, updateTemplate, addTemplate]);

  const handleRenameTemplate = useCallback((id: string, name: string) => {
    updateTemplate(id, { name });
    if (currentTemplate?.id === id) {
      setCurrentTemplate((prev) => (prev ? { ...prev, name } : null));
    }
    toast.success("Template renamed");
  }, [updateTemplate, currentTemplate]);

  const handleDeleteTemplate = useCallback((id: string) => {
    deleteTemplate(id);
    if (currentTemplate?.id === id) {
      setCurrentTemplate(null);
    }
    toast.success("Template deleted");
  }, [deleteTemplate, currentTemplate]);

  const handleDuplicateTemplate = useCallback((id: string) => {
    const duplicate = duplicateTemplate(id);
    if (duplicate) {
      toast.success(`Duplicated as "${duplicate.name}"`);
    }
  }, [duplicateTemplate]);

  const handleImportTemplate = useCallback((template: CertificateTemplate) => {
    addTemplate(template);
  }, [addTemplate]);

  const handleLogoClick = useCallback(() => {
    setBackConfirmOpen(true);
  }, []);

  const handleOrientationChange = useCallback((orientation: "portrait" | "landscape") => {
    handleTemplateChange({ orientation });
  }, [handleTemplateChange]);

  const handleBackgroundChange = useCallback((background: string) => {
    handleTemplateChange({ background });
  }, [handleTemplateChange]);

  const handleExport = async () => {
    if (!currentTemplate || !hasData) return;

    toast.loading("Preparing export...");

    try {
      // Helper to merge entry-specific config with template config
      const getEffectiveConfig = (templateConfig: TextConfig, entryConfig?: Partial<TextConfig>): TextConfig => {
        if (entryConfig) {
          return { ...templateConfig, ...entryConfig };
        }
        return templateConfig;
      };

      // Generate @font-face rules for custom fonts used in the export
      const generateFontFaceRules = (): string => {
        return customFonts.map(font => `
@font-face {
  font-family: '${font.name}';
  src: url('${font.url}') format('truetype');
  font-weight: normal;
  font-style: normal;
}`).join('\n');
      };

      // Generate single HTML with all pages
      const isLandscape = currentTemplate.orientation === "landscape";
      const width = isLandscape ? 297 : 210;
      const height = isLandscape ? 210 : 297;

      // Helper for generating inline text styles with per-entry config
      const getInlineTextStyle = (config: TextConfig) => {
        // Always use the user's X position
        let left = config.x;
        // Transform based on alignment to position text correctly around the X point
        let transform = "none";
        let textAlign = config.alignment;

        if (config.alignment === "center") {
          transform = "translateX(-50%)";
        } else if (config.alignment === "right") {
          transform = "translateX(-100%)";
        }

        return `position: absolute; left: ${left}mm; top: ${config.y}mm; text-align: ${textAlign}; transform: ${transform}; font-size: ${config.fontSize}px; color: ${config.color}; font-family: ${config.fontFamily}; white-space: nowrap; margin: 0; line-height: 1;`;
      };

      const signerStyle = currentTemplate.signers?.map((signer, idx) => {
        if (!signer.image) return "";
        return `
          .signer-${idx} {
            position: absolute;
            left: ${signer.position.x}mm;
            top: ${signer.position.y}mm;
            transform: translateX(-50%);
            text-align: center;
          }
          .signer-${idx} img {
            height: ${signer.position.size}px;
            width: auto;
          }
        `;
      }).join("\n") || "";

      const pages = selectedEntries.map((entry) => {
        // Merge entry-specific config with template config for this entry
        const nameConfig = getEffectiveConfig(currentTemplate.nameConfig, entry.nameConfig);
        const subtitleConfig = getEffectiveConfig(currentTemplate.subtitleConfig, entry.subtitleConfig);
        const subsubtitleConfig = getEffectiveConfig(currentTemplate.subsubtitleConfig, entry.subsubtitleConfig);

        const signerHtml = currentTemplate.signers?.map((signer, idx) => {
          if (!signer.image) return "";
          return `
            <div class="signer-${idx}">
              <img src="${signer.image}" />
              ${signer.name ? `<p style="font-size: 10px; font-weight: 500; margin: 4px 0 0;">${signer.name}</p>` : ""}
              ${signer.role ? `<p style="font-size: 8px; color: #666; margin: 0;">${signer.role}</p>` : ""}
            </div>
          `;
        }).join("") || "";

        return `
          <div class="page">
            ${currentTemplate.background ? `<img class="bg" src="${currentTemplate.background}">` : ""}
            <div style="${getInlineTextStyle(nameConfig)}">
              ${nameConfig.prefix ? `<span style="color: ${nameConfig.prefixColor || nameConfig.color}">${nameConfig.prefix}</span>` : ""}${entry.name}
            </div>
            ${currentTemplate.subtitleEnabled ? `
              <div style="${getInlineTextStyle(subtitleConfig)}">
                ${subtitleConfig.prefix ? `<span style="color: ${subtitleConfig.prefixColor || subtitleConfig.color}">${subtitleConfig.prefix}</span>` : ""}${entry.subtitle}
              </div>` : ""}
            ${currentTemplate.subtitleEnabled && currentTemplate.subsubtitleEnabled ? `
              <div style="${getInlineTextStyle(subsubtitleConfig)}">
                ${subsubtitleConfig.prefix ? `<span style="color: ${subsubtitleConfig.prefixColor || subsubtitleConfig.color}">${subsubtitleConfig.prefix}</span>` : ""}${entry.subsubtitle}
              </div>` : ""}
            ${signerHtml}
          </div>
        `;
      }).join("");

      const fontFaceRules = generateFontFaceRules();

      const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
${fontFaceRules}
@page { size: ${isLandscape ? "A4 landscape" : "A4"}; margin: 0; }
body { 
  margin: 0; 
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  overflow: hidden;
}
.page {
  width: ${width}mm;
  height: ${height}mm;
  position: relative;
  page-break-after: always;
  overflow: hidden;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.bg { position: absolute; width: 100%; height: 100%; object-fit: contain; }
${signerStyle}
</style>
</head>
<body>
${pages}
</body>
</html>`;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();

        const images = printWindow.document.querySelectorAll("img");
        const imagePromises = Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        });

        await Promise.all(imagePromises);
        await new Promise((resolve) => setTimeout(resolve, 500));

        toast.dismiss();
        printWindow.focus();
        printWindow.print();
        toast.success("Use 'Save as PDF' in the print dialog");
      } else {
        toast.dismiss();
        toast.error("Please allow popups for PDF export");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Export failed");
      console.error(error);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
          {/* Logo and About button */}
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={handleLogoClick} className="cursor-pointer">
              <img src="/icon_full.svg" className="w-24" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAboutOpen(true)}
              title="About docu."
            >
              <Info className="h-5 w-5" />
            </Button>
          </div>

          {/* Center buttons */}
          <div className="flex items-center gap-2 relative">
            {!currentTemplate && (
              <div className="absolute right-full mr-3 flex items-center gap-2 animate-pulse whitespace-nowrap">
                <span className="text-sm text-primary font-medium">Start by creating a template</span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLibraryOpen(true)}
            >
              <Library className="h-4 w-4 mr-2" />
              Library
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBackgroundOpen(true)}
            >
              <FileImage className="h-4 w-4 mr-2" />
              Background
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveTemplate}
              disabled={!currentTemplate}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={!currentTemplate || !hasData}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Template name badge */}
          {currentTemplate ? (
            <div className="px-3 py-1.5 rounded-lg bg-accent text-primary text-sm font-medium shrink-0">
              {currentTemplate.name}
            </div>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <CertificateSidebar
            template={currentTemplate}
            customFonts={customFonts}
            width={leftSidebarWidth}
            collapsed={leftSidebarCollapsed}
            hasData={hasData}
            viewMode={viewMode}
            currentEntry={viewMode === "single" && hasData ? selectedEntries[currentIndex] : undefined}
            onWidthChange={setLeftSidebarWidth}
            onCollapsedChange={setLeftSidebarCollapsed}
            onTemplateChange={handleTemplateChange}
            onEntryChange={handleEntryChange}
            onAddCustomFont={addCustomFont}
            onOpenDataEntry={() => setDataEntryOpen(true)}
            entriesCount={entries.length}
          />

          {/* Preview Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-muted/20">
            {/* View Controls - Always visible */}
            <div className="flex items-center justify-center gap-4 py-3 border-b border-border bg-muted/30">
              {/* View Mode Buttons */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "template" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("template")}
                    >
                      <LayoutTemplate className="h-4 w-4 mr-2" />
                      Template
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit template settings</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant={viewMode === "single" ? "default" : "outline"}
                        size="sm"
                        onClick={() => hasData && setViewMode("single")}
                        disabled={!hasData}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Single
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {hasData ? "View individual certificates" : "Enter data first to view certificates"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => hasData && setViewMode("grid")}
                        disabled={!hasData}
                      >
                        <Grid className="h-4 w-4 mr-2" />
                        Grid
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {hasData ? "View all certificates" : "Enter data first to view certificates"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Preview Content */}
            {viewMode === "grid" && hasData ? (
              <ScrollArea className="flex-1 p-4">
                <div className="flex flex-wrap gap-4 justify-center items-center content-center min-h-full">
                  {selectedEntries.map((entry, index) => {
                    const isLandscape = currentTemplate?.orientation === "landscape";
                    const thumbWidth = isLandscape ? 180 : 140;
                    const thumbHeight = isLandscape ? 127 : 198;

                    return (
                      <div
                        key={entry.id}
                        className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-colors bg-muted ${index === currentIndex ? "border-primary" : "border-transparent hover:border-primary/50"
                          }`}
                        style={{ width: thumbWidth, height: thumbHeight + 32 }}
                        onClick={() => {
                          setCurrentIndex(index);
                          setViewMode("single");
                        }}
                      >
                        <div
                          className="relative overflow-hidden bg-white"
                          style={{ width: thumbWidth, height: thumbHeight }}
                        >
                          <div
                            className="origin-top-left"
                            style={{
                              transform: `scale(${thumbWidth / (isLandscape ? 297 : 210) / 3.78})`,
                            }}
                          >
                            <CertificatePreview
                              template={currentTemplate}
                              entry={entry}
                              scale={1}
                            />
                          </div>
                        </div>
                        <div className="p-2 bg-card">
                          <p className="text-xs font-medium truncate">{entry.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                  <div
                    key={viewMode === "template" ? "template" : currentIndex}
                  >
                    <CertificatePreview
                      template={currentTemplate}
                      entry={viewMode === "single" && hasData ? selectedEntries[currentIndex] : undefined}
                      scale={previewScale}
                    />
                  </div>
                </div>

                {/* Navigation Controls - Fixed at bottom for single view */}
                {(viewMode === "single" && hasData) ? (
                  <div className="flex items-center justify-center gap-4 py-3 border-t border-border bg-muted/30 h-16 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                      disabled={currentIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium tabular-nums">
                      {currentIndex + 1} / {selectedEntries.length}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentIndex(Math.min(selectedEntries.length - 1, currentIndex + 1))}
                      disabled={currentIndex >= selectedEntries.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-16 border-t border-transparent shrink-0" aria-hidden="true" />
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <CertificateRightSidebar
            template={currentTemplate}
            customFonts={customFonts}
            width={rightSidebarWidth}
            collapsed={rightSidebarCollapsed}
            hasData={hasData}
            viewMode={viewMode}
            currentEntry={viewMode === "single" && hasData ? selectedEntries[currentIndex] : undefined}
            onWidthChange={setRightSidebarWidth}
            onCollapsedChange={setRightSidebarCollapsed}
            onTemplateChange={handleTemplateChange}
            onEntryChange={handleEntryChange}
            onAddCustomFont={addCustomFont}
          />
        </div>

        {/* Template Library Modal */}
        <CertificateTemplateLibrary
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          templates={templates}
          onSelect={handleSelectTemplate}
          onRename={handleRenameTemplate}
          onDelete={handleDeleteTemplate}
          onDuplicate={handleDuplicateTemplate}
          onCreate={handleCreateTemplate}
          onImport={handleImportTemplate}
        />

        {/* About Dialog */}
        <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />

        {/* Background Dialog */}
        <BackgroundDialog
          open={backgroundOpen}
          onOpenChange={setBackgroundOpen}
          currentBackground={currentTemplate?.background}
          orientation={currentTemplate?.orientation || "landscape"}
          onOrientationChange={handleOrientationChange}
          onBackgroundChange={handleBackgroundChange}
        />

        {/* Data Entry Dialog */}
        <DataEntryDialog
          open={dataEntryOpen}
          onOpenChange={setDataEntryOpen}
          entries={entries}
          onEntriesChange={setEntries}
          subtitleEnabled={currentTemplate?.subtitleEnabled ?? true}
          onSubtitleEnabledChange={(enabled) => handleTemplateChange({ subtitleEnabled: enabled })}
          subsubtitleEnabled={currentTemplate?.subsubtitleEnabled ?? false}
          onSubsubtitleEnabledChange={(enabled) => handleTemplateChange({ subsubtitleEnabled: enabled })}
        />



        {/* Save Dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Template</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={saveTemplateName}
                onChange={(e) => setSaveTemplateName(e.target.value)}
                placeholder="Enter template name"
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmSave();
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Back Confirmation */}
        <AlertDialog open={backConfirmOpen} onOpenChange={setBackConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Go back to app selection?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to go back? Any unsaved changes will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onBack}>
                Go Back
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider >
  );
}
