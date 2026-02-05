import { useState } from "react";
import { CertificateTemplate, CertificateEntry, CustomFont, TextConfig } from "@/types/certificate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileDown } from "lucide-react";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CertificateTemplate | null;
  entries: CertificateEntry[];
  customFonts: CustomFont[];
}

export function ExportDialog({
  open,
  onOpenChange,
  template,
  entries,
  customFonts,
}: ExportDialogProps) {
  const [projectName, setProjectName] = useState("certificates");

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

  const handleExport = async () => {
    if (!template || entries.length === 0) return;

    toast.loading("Preparing export...");

    try {
      // Generate single HTML with all pages
      const isLandscape = template.orientation === "landscape";
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

      const signerStyle = template.signers?.map((signer, idx) => {
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

      const pages = entries.map((entry) => {
        // Merge entry-specific config with template config for this entry
        const nameConfig = getEffectiveConfig(template.nameConfig, entry.nameConfig);
        const subtitleConfig = getEffectiveConfig(template.subtitleConfig, entry.subtitleConfig);
        const subsubtitleConfig = getEffectiveConfig(template.subsubtitleConfig, entry.subsubtitleConfig);

        const signerHtml = template.signers?.map((signer, idx) => {
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
            ${template.background ? `<img class="bg" src="${template.background}">` : ""}
            <div style="${getInlineTextStyle(nameConfig)}">
              ${nameConfig.prefix ? `<span style="color: ${nameConfig.prefixColor || nameConfig.color}">${nameConfig.prefix}</span>` : ""}${entry.name}
            </div>
            ${template.subtitleEnabled ? `
              <div style="${getInlineTextStyle(subtitleConfig)}">
                ${subtitleConfig.prefix ? `<span style="color: ${subtitleConfig.prefixColor || subtitleConfig.color}">${subtitleConfig.prefix}</span>` : ""}${entry.subtitle}
              </div>` : ""}
            ${template.subtitleEnabled && template.subsubtitleEnabled ? `
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
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            Export Certificates
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="certificates"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Files will be named: {projectName}_certificate_001, {projectName}_certificate_002, etc.
            </p>
          </div>

          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">Export Summary</p>
            <p className="text-muted-foreground">
              {entries.length} certificate{entries.length !== 1 ? "s" : ""} will be exported as a single PDF
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
