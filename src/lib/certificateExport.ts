import JSZip from "jszip";
import { CertificateTemplate, createDefaultCertificateTemplate } from "@/types/certificate";

export interface ExportedCertificateTemplate {
  template: CertificateTemplate;
  version: string;
  templateType: "certificate";
}

export async function exportCertificateTemplateToZip(template: CertificateTemplate): Promise<Blob> {
  const zip = new JSZip();

  const templateData: ExportedCertificateTemplate = {
    template: { ...template },
    version: "1.0.0",
    templateType: "certificate",
  };

  // Extract and save background image separately
  if (template.background && template.background.startsWith("data:")) {
    const bgData = template.background.split(",")[1];
    const bgMime = template.background.split(";")[0].split(":")[1];
    const bgExt = bgMime.split("/")[1] || "jpg";
    zip.file(`background.${bgExt}`, bgData, { base64: true });
    templateData.template.background = `background.${bgExt}`;
  }

  // Add template JSON
  zip.file("template.json", JSON.stringify(templateData, null, 2));

  return await zip.generateAsync({ type: "blob" });
}

export async function importCertificateTemplateFromZip(file: File): Promise<CertificateTemplate> {
  const zip = await JSZip.loadAsync(file);

  const jsonFile = zip.file("template.json");
  if (!jsonFile) {
    throw new Error("Invalid template file: missing template.json");
  }

  const jsonContent = await jsonFile.async("string");
  const exportedData: ExportedCertificateTemplate = JSON.parse(jsonContent);

  // Validate template type
  if (exportedData.templateType !== "certificate") {
    throw new Error("This is not a Certificate Generator template. Please use the correct app to import this template.");
  }

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

  // Generate new ID to avoid conflicts
  template.id = crypto.randomUUID();
  template.createdAt = Date.now();

  return template;
}

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

// Export certificates to PDF or ZIP
export async function exportCertificatesToZip(
  htmlPages: string[],
  projectName: string
): Promise<Blob> {
  const zip = new JSZip();

  // For each page, create a simple HTML file
  // In production, you'd want to use a proper PDF library
  htmlPages.forEach((html, index) => {
    const filename = `${projectName}_certificate_${String(index + 1).padStart(3, '0')}.html`;
    zip.file(filename, html);
  });

  return await zip.generateAsync({ type: "blob" });
}
