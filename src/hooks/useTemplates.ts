import { useState, useEffect, useCallback } from "react";
import { Template, createDefaultTemplate } from "@/types/template";

const STORAGE_KEY = "sponsoring-templates";

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTemplates(JSON.parse(stored));
      } catch {
        setTemplates([]);
      }
    }
    setIsLoading(false);
  }, []);

  const saveTemplates = useCallback((newTemplates: Template[]) => {
    setTemplates(newTemplates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
  }, []);

  const addTemplate = useCallback((template: Template) => {
    const newTemplates = [...templates, template];
    saveTemplates(newTemplates);
    return template;
  }, [templates, saveTemplates]);

  const updateTemplate = useCallback((id: string, updates: Partial<Template>) => {
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
      const duplicate: Template = {
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

  return {
    templates,
    isLoading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    createDefaultTemplate,
  };
}
