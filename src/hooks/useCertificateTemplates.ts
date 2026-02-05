import { useState, useEffect, useCallback } from "react";
import { CertificateTemplate, createDefaultCertificateTemplate, CustomFont, createDefaultCertificateSigner } from "@/types/certificate";

const STORAGE_KEY = "certificate-templates";
const CUSTOM_FONTS_KEY = "certificate-custom-fonts";

export function useCertificateTemplates() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CertificateTemplate[];
        // Migrate old templates to new format
        const migrated = parsed.map((t) => ({
          ...t,
          // Add new fields with defaults if missing
          subsubtitleConfig: t.subsubtitleConfig || {
            alignment: "center" as const,
            x: t.orientation === "landscape" ? 148.5 : 105,
            y: 160,
            fontSize: 18,
            color: "#555555",
            fontFamily: t.nameConfig?.fontFamily || "Georgia, serif",
          },
          subsubtitleEnabled: t.subsubtitleEnabled ?? false,
          signers: t.signers || [createDefaultCertificateSigner()],
          // Migrate old fontFamily to per-text fontFamily
          nameConfig: {
            ...t.nameConfig,
            fontFamily: t.nameConfig?.fontFamily || "Georgia, serif",
          },
          subtitleConfig: {
            ...t.subtitleConfig,
            fontFamily: t.subtitleConfig?.fontFamily || "Georgia, serif",
          },
        }));
        setTemplates(migrated);
      } catch {
        setTemplates([]);
      }
    }

    const storedFonts = localStorage.getItem(CUSTOM_FONTS_KEY);
    if (storedFonts) {
      try {
        const fonts = JSON.parse(storedFonts) as CustomFont[];
        setCustomFonts(fonts);
        // Load custom fonts into document
        fonts.forEach(loadFontIntoDocument);
      } catch {
        setCustomFonts([]);
      }
    }

    setIsLoading(false);
  }, []);

  const loadFontIntoDocument = (font: CustomFont) => {
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: '${font.name}';
        src: url('${font.url}');
      }
    `;
    document.head.appendChild(style);
  };

  const saveTemplates = useCallback((newTemplates: CertificateTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
  }, []);

  const addTemplate = useCallback((template: CertificateTemplate) => {
    const newTemplates = [...templates, template];
    saveTemplates(newTemplates);
    return template;
  }, [templates, saveTemplates]);

  const updateTemplate = useCallback((id: string, updates: Partial<CertificateTemplate>) => {
    const newTemplates = templates.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    saveTemplates(newTemplates);
  }, [templates, saveTemplates]);

  const deleteTemplate = useCallback((id: string) => {
    const newTemplates = templates.filter((t) => t.id !== id);
    saveTemplates(newTemplates);
  }, [templates, saveTemplates]);

  const duplicateTemplate = useCallback((id: string) => {
    const template = templates.find((t) => t.id === id);
    if (template) {
      const duplicate: CertificateTemplate = {
        ...template,
        id: crypto.randomUUID(),
        name: `${template.name} (Copy)`,
        createdAt: Date.now(),
      };
      addTemplate(duplicate);
      return duplicate;
    }
    return null;
  }, [templates, addTemplate]);

  const addCustomFont = useCallback(async (file: File): Promise<CustomFont | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, "");
        const fontUrl = reader.result as string;
        
        const newFont: CustomFont = {
          name: fontName,
          url: fontUrl,
        };

        // Load into document
        loadFontIntoDocument(newFont);

        // Save to storage
        const updatedFonts = [...customFonts, newFont];
        setCustomFonts(updatedFonts);
        localStorage.setItem(CUSTOM_FONTS_KEY, JSON.stringify(updatedFonts));

        resolve(newFont);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }, [customFonts]);

  return {
    templates,
    customFonts,
    isLoading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    addCustomFont,
    createDefaultCertificateTemplate,
  };
}
