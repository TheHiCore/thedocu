import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Template } from "@/types/template";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Trash2,
  Copy,
  FileText,
  Plus,
  Globe,
  Upload,
} from "lucide-react";
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
import { toast } from "sonner";
import { exportTemplateToZip, importTemplateFromZip, downloadBlob } from "@/lib/templateExport";

interface TemplateLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Template[];
  onSelect: (template: Template) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onCreate: () => void;
  onImport: (template: Template) => void;
}

export function TemplateLibrary({
  open,
  onOpenChange,
  templates,
  onSelect,
  onRename,
  onDelete,
  onDuplicate,
  onCreate,
  onImport,
}: TemplateLibraryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleStartRename = (template: Template) => {
    setEditingId(template.id);
    setEditingName(template.name);
  };

  const handleSaveRename = () => {
    if (editingId && editingName.trim()) {
      onRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const handleExport = async (template: Template) => {
    try {
      toast.loading("Exporting template...");
      const blob = await exportTemplateToZip(template);
      const filename = `${template.name.replace(/[^a-z0-9]/gi, "_")}_template.zip`;
      downloadBlob(blob, filename);
      toast.dismiss();
      toast.success("Template exported successfully");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to export template");
      console.error(error);
    }
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading("Importing template...");
      const template = await importTemplateFromZip(file);
      onImport(template);
      toast.dismiss();
      toast.success(`Imported template: ${template.name}`);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to import template. Make sure it's a valid template file.");
      console.error(error);
    }

    // Reset input
    e.target.value = "";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-xl font-semibold flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              Template Library
              <input
                ref={importInputRef}
                type="file"
                accept=".zip"
                onChange={handleImportFile}
                className="hidden"
              />
              <Button
                size="sm"
                onClick={handleImportClick}
                className="bg-primary-gradient text-primary-foreground hover:bg-primary/90 ml-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {/* Create New Template Card */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onCreate();
                  onOpenChange(false);
                }}
                className="aspect-[3/4] border-2 border-dashed border-primary/30 rounded-xl flex flex-col items-center justify-center gap-3 text-primary hover:bg-primary/5 hover:border-primary/50 transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">New Template</span>
              </motion.button>

              {/* Template Cards */}
              <AnimatePresence>
                {templates.map((template) => (
                  <motion.div
                    key={template.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group"
                  >
                    <div
                      onClick={() => {
                        if (editingId !== template.id) {
                          onSelect(template);
                          onOpenChange(false);
                        }
                      }}
                      className="aspect-[3/4] border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-card transition-shadow bg-card"
                    >
                      {/* Preview */}
                      <div className="h-3/4 bg-muted flex items-center justify-center relative overflow-hidden">
                        {template.background ? (
                          <img
                            src={template.background}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-muted-foreground/40">
                            <FileText className="h-12 w-12" />
                          </div>
                        )}
                        
                        {/* Actions overlay */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-7 w-7 bg-primary-gradient text-primary-foreground hover:bg-primary/90"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExport(template);
                            }}
                            title="Export template"
                          >
                            <Globe className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(template);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicate(template.id);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(template.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Name */}
                      <div className="h-1/4 p-3 flex items-center justify-center">
                        {editingId === template.id ? (
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={handleSaveRename}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRename();
                              if (e.key === "Escape") {
                                setEditingId(null);
                                setEditingName("");
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 text-center text-sm"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium text-center line-clamp-2">
                            {template.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {templates.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>No templates yet. Create your first one!</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
