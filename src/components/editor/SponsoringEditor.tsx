import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { marked } from "marked";
import { Template, SignerData, createDefaultTemplate } from "@/types/template";
import { useTemplates } from "@/hooks/useTemplates";
import { LeftSidebar } from "@/components/editor/LeftSidebar";
import { RightSidebar } from "@/components/editor/RightSidebar";
import { DocumentPreview } from "@/components/editor/DocumentPreview";
import { TemplateLibrary } from "@/components/editor/TemplateLibrary";
import { AboutDialog } from "@/components/editor/AboutDialog";
import { DocumentBackgroundDialog } from "@/components/editor/DocumentBackgroundDialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileDown, Library, Save, FileImage, Info } from "lucide-react";
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

interface SponsoringEditorProps {
  onBack: () => void;
}

const createDefaultSigner = (): SignerData => ({
  name: "",
  role: "",
  image: "",
  position: { x: 130, y: 240, size: 45 },
});

export function SponsoringEditor({ onBack }: SponsoringEditorProps) {
  const {
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  } = useTemplates();

  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [bodyContent, setBodyContent] = useState("");
  const [signers, setSigners] = useState<SignerData[]>([createDefaultSigner()]);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const [previewScale, setPreviewScale] = useState(0.5);
  
  // Sidebar widths
  const [leftWidth, setLeftWidth] = useState(420);
  const [rightWidth, setRightWidth] = useState(360);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Calculate preview scale based on viewport
  useEffect(() => {
    const updateScale = () => {
      const leftW = leftCollapsed ? 32 : leftWidth;
      const rightW = rightCollapsed ? 32 : rightWidth;
      const availableWidth = window.innerWidth - leftW - rightW - 64;
      const availableHeight = window.innerHeight - 120;
      const docWidth = 210 * 3.78;
      const docHeight = 297 * 3.78;
      
      const scaleX = availableWidth / docWidth;
      const scaleY = availableHeight / docHeight;
      setPreviewScale(Math.min(scaleX, scaleY, 0.7));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [leftWidth, rightWidth, leftCollapsed, rightCollapsed]);

  const handleTemplateChange = useCallback((updates: Partial<Template>) => {
    if (!currentTemplate) return;
    setCurrentTemplate((prev) => (prev ? { ...prev, ...updates } : null));
  }, [currentTemplate]);

  const handleBackgroundChange = useCallback((background: string) => {
    handleTemplateChange({ background });
  }, [handleTemplateChange]);

  const handleSelectTemplate = useCallback((template: Template) => {
    setCurrentTemplate({ ...template });
    // Load signers from template or create default
    if (template.signers && template.signers.length > 0) {
      setSigners(template.signers);
    } else if (template.signatureImage || template.signatureName || template.signatureRole) {
      // Legacy single signer support
      setSigners([{
        name: template.signatureName || "",
        role: template.signatureRole || "",
        image: template.signatureImage || "",
        position: template.positions.signature,
      }]);
    } else {
      setSigners([createDefaultSigner()]);
    }
    toast.success(`Loaded template: ${template.name}`);
  }, []);

  const handleCreateTemplate = useCallback(() => {
    const newTemplate = createDefaultTemplate();
    setCurrentTemplate(newTemplate);
    setSigners([createDefaultSigner()]);
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
      signers,
      // Also save first signer as legacy fields for backwards compatibility
      signatureImage: signers[0]?.image || "",
      signatureName: signers[0]?.name || "",
      signatureRole: signers[0]?.role || "",
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
  }, [currentTemplate, saveTemplateName, signers, templates, updateTemplate, addTemplate]);

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

  const handleImportTemplate = useCallback((template: Template) => {
    addTemplate(template);
  }, [addTemplate]);

  // Configure marked
  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
  }, []);

  const buildHtml = useCallback(() => {
    if (!currentTemplate) return "";
    const { coordinates, object, positions } = currentTemplate;
    const fontFamily = currentTemplate.fontFamily || "Arial, sans-serif";
    const fontSize = currentTemplate.fontSize || 12;
    
    // Split content by page breaks
    const PAGE_BREAK_MARKER = "---pagebreak---";
    const sections = bodyContent.split(PAGE_BREAK_MARKER);
    const pages = sections.map(section => {
      const trimmedSection = section.replace(/^\n+/, '').replace(/\n+$/, '');
      if (!trimmedSection) return "";
      const withBreaks = trimmedSection.replace(/\n\n/g, '\n\n&nbsp;\n\n');
      return marked.parse(withBreaks) as string;
    });
    
    const markdownStyles = `
      .markdown-content { word-wrap: break-word; overflow-wrap: break-word; }
      .markdown-content h1 { font-size: ${fontSize * 2}px; font-weight: bold; margin: 0.5em 0; }
      .markdown-content h2 { font-size: ${fontSize * 1.5}px; font-weight: bold; margin: 0.5em 0; }
      .markdown-content h3 { font-size: ${fontSize * 1.25}px; font-weight: bold; margin: 0.4em 0; }
      .markdown-content p { margin: 0.5em 0; white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word; }
      .markdown-content ul { list-style-type: disc; padding-left: 1.5em; margin: 0.5em 0; }
      .markdown-content ol { list-style-type: decimal; padding-left: 1.5em; margin: 0.5em 0; }
      .markdown-content li { margin: 0.25em 0; }
      .markdown-content table { width: 100%; border-collapse: collapse; margin: 0.5em 0; }
      .markdown-content th, .markdown-content td { border: 1px solid #333; padding: 0.5em; text-align: center; }
      .markdown-content th { background-color: #f5f5f5; font-weight: bold; }
      .markdown-content strong { font-weight: bold; }
      .markdown-content em { font-style: italic; }
    `;

    const hasSignatures = signers.some(s => s.image || s.name || s.role);
    const lastPageIndex = pages.length - 1;

    const renderSignatures = () => {
      if (!hasSignatures) return "";
      return signers.map((signer, index) => {
        if (!signer.image && !signer.name && !signer.role) return "";
        return `
          <div class="block signature-block" style="left:${signer.position.x}mm;top:${signer.position.y}mm">
            ${signer.name ? `<div style="font-size:${fontSize}px">${signer.name}</div>` : ""}
            ${signer.role ? `<div style="font-size:${fontSize}px">${signer.role}</div>` : ""}
            ${signer.image ? `<img src="${signer.image}" style="max-width:${signer.position.size}mm;display:block;margin:8px auto 0">` : ""}
          </div>
        `;
      }).join("");
    };

    const pagesHtml = pages.map((pageContent, index) => {
      const isFirstPage = index === 0;
      const isLastPage = index === lastPageIndex;
      const bodyTop = isFirstPage ? positions.body.y : 20;

      return `
        <div class="page">
          ${currentTemplate.background ? `<img src="${currentTemplate.background}" style="position:absolute;width:100%;height:100%;object-fit:cover">` : ""}
          
          ${isFirstPage ? `
          <div class="block" style="left:${positions.coordinates.x}mm;top:${positions.coordinates.y}mm">
            <div class="coord-line"><span class="coord-label" style="color:${coordinates.name.color}">${coordinates.name.label}</span> ${coordinates.name.value}</div>
            <div class="coord-line"><span class="coord-label" style="color:${coordinates.role.color}">${coordinates.role.label}</span> ${coordinates.role.value}</div>
            <div class="coord-line"><span class="coord-label" style="color:${coordinates.phone.color}">${coordinates.phone.label}</span> ${coordinates.phone.value}</div>
            <div class="coord-line"><span class="coord-label" style="color:${coordinates.email.color}">${coordinates.email.label}</span> ${coordinates.email.value}</div>
          </div>
          ` : ""}
          
          <div class="block body-block" style="left:${positions.body.x}mm;top:${bodyTop}mm">
            ${isFirstPage ? `<div class="object-line"><span class="object-label" style="color:${object.color}">${object.label}</span> ${object.title}</div>` : ""}
            <div class="markdown-content">${pageContent}</div>
          </div>
          
          ${isLastPage ? renderSignatures() : ""}
        </div>
      `;
    }).join("");
    
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@page{size:A4;margin:0}
body{margin:0;font-family:${fontFamily};font-size:${fontSize}px}
.page{width:210mm;height:297mm;position:relative;font-family:${fontFamily};page-break-after:always;overflow:hidden}
.block{position:absolute;word-wrap:break-word;overflow-wrap:break-word}
.coord-line{font-size:${fontSize}px;line-height:1.35}
.coord-label{font-weight:bold}
.body-block{width:170mm}
.object-line{font-size:${fontSize + 4}px;margin-bottom:4mm}
.object-label{font-weight:bold}
.signature-block{text-align:center;font-weight:bold}
${markdownStyles}
</style>
</head>
<body>
${pagesHtml}
</body>
</html>`;
  }, [currentTemplate, bodyContent, signers]);

  const handleExportPDF = useCallback(async () => {
    if (!currentTemplate) return;
    
    const html = buildHtml();
    toast.loading("Preparing PDF...");
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      
      const images = printWindow.document.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      });
      
      await Promise.all(imagePromises);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.dismiss();
      printWindow.focus();
      printWindow.print();
      toast.success("Use 'Save as PDF' in the print dialog");
    } else {
      toast.dismiss();
      toast.error("Please allow popups for PDF export");
    }
  }, [currentTemplate, buildHtml]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background" style={{ overflow: 'hidden' }}>
      {/* Header with buttons and template name */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        {/* Logo and About button */}
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setBackConfirmOpen(true)} className="cursor-pointer">
            <img src="/icon_full.svg" className="w-24"/>
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
        <div className="flex items-center gap-2">
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
            onClick={handleExportPDF}
            disabled={!currentTemplate}
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
        {/* Left Sidebar - Content Editor */}
        <LeftSidebar
          template={currentTemplate}
          bodyContent={bodyContent}
          width={leftWidth}
          collapsed={leftCollapsed}
          onWidthChange={setLeftWidth}
          onCollapsedChange={setLeftCollapsed}
          onTemplateChange={handleTemplateChange}
          onBodyChange={setBodyContent}
        />

        {/* Preview Area */}
        <div className="flex-1 flex items-start justify-center p-8 overflow-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DocumentPreview
              template={currentTemplate}
              bodyContent={bodyContent}
              signers={signers}
              scale={previewScale}
            />
          </motion.div>
        </div>

        {/* Right Sidebar - Settings */}
        <RightSidebar
          template={currentTemplate}
          signers={signers}
          width={rightWidth}
          collapsed={rightCollapsed}
          onWidthChange={setRightWidth}
          onCollapsedChange={setRightCollapsed}
          onTemplateChange={handleTemplateChange}
          onSignersChange={setSigners}
        />
      </div>

      {/* Template Library Modal */}
      <TemplateLibrary
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
      <DocumentBackgroundDialog
        open={backgroundOpen}
        onOpenChange={setBackgroundOpen}
        currentBackground={currentTemplate?.background}
        onBackgroundChange={handleBackgroundChange}
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
            <Button onClick={handleConfirmSave}>Save Template</Button>
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
  );
}
