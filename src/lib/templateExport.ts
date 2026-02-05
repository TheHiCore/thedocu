import JSZip from "jszip";
import { Template, createDefaultTemplate } from "@/types/template";

export interface ExportedTemplate {
  template: Template;
  version: string;
}

// Export a single template to a ZIP file
export async function exportTemplateToZip(template: Template): Promise<Blob> {
  const zip = new JSZip();
  
  // Create template JSON without base64 images
  const templateData: ExportedTemplate = {
    template: { ...template },
    version: "1.0.0",
  };
  
  // Extract and save background image separately
  if (template.background && template.background.startsWith("data:")) {
    const bgData = template.background.split(",")[1];
    const bgMime = template.background.split(";")[0].split(":")[1];
    const bgExt = bgMime.split("/")[1] || "jpg";
    zip.file(`background.${bgExt}`, bgData, { base64: true });
    templateData.template.background = `background.${bgExt}`;
  }
  
  // Extract and save signature image separately
  if (template.signatureImage && template.signatureImage.startsWith("data:")) {
    const sigData = template.signatureImage.split(",")[1];
    const sigMime = template.signatureImage.split(";")[0].split(":")[1];
    const sigExt = sigMime.split("/")[1] || "png";
    zip.file(`signature.${sigExt}`, sigData, { base64: true });
    templateData.template.signatureImage = `signature.${sigExt}`;
  }
  
  // Add template JSON
  zip.file("template.json", JSON.stringify(templateData, null, 2));
  
  return await zip.generateAsync({ type: "blob" });
}

// Import a template from a ZIP file
export async function importTemplateFromZip(file: File): Promise<Template> {
  const zip = await JSZip.loadAsync(file);
  
  // Read template JSON
  const jsonFile = zip.file("template.json");
  if (!jsonFile) {
    throw new Error("Invalid template file: missing template.json");
  }
  
  const jsonContent = await jsonFile.async("string");
  const exportedData: ExportedTemplate = JSON.parse(jsonContent);
  const template = { ...exportedData.template };
  
  // Restore background image
  if (template.background && !template.background.startsWith("data:")) {
    const bgFile = zip.file(template.background);
    if (bgFile) {
      const bgData = await bgFile.async("base64");
      const ext = template.background.split(".").pop() || "jpg";
      const mime = ext === "png" ? "image/png" : "image/jpeg";
      template.background = `data:${mime};base64,${bgData}`;
    }
  }
  
  // Restore signature image
  if (template.signatureImage && !template.signatureImage.startsWith("data:")) {
    const sigFile = zip.file(template.signatureImage);
    if (sigFile) {
      const sigData = await sigFile.async("base64");
      const ext = template.signatureImage.split(".").pop() || "png";
      const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
      template.signatureImage = `data:${mime};base64,${sigData}`;
    }
  }
  
  // Generate new ID to avoid conflicts
  template.id = crypto.randomUUID();
  template.createdAt = Date.now();
  
  return template;
}

// Download a blob as a file
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
