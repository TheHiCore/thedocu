import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Upload, Image, Check, X } from "lucide-react";
import { toast } from "sonner";
import { compressImageTo300PPI } from "@/lib/imageCompression";

interface BackgroundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBackground?: string;
  orientation: "portrait" | "landscape";
  onOrientationChange: (orientation: "portrait" | "landscape") => void;
  onBackgroundChange: (background: string) => void;
  showOrientation?: boolean;
}

export function BackgroundDialog({
  open,
  onOpenChange,
  currentBackground,
  orientation,
  onOrientationChange,
  onBackgroundChange,
  showOrientation = true,
}: BackgroundDialogProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedOrientation, setSelectedOrientation] = useState(orientation);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Please select an image or PDF file");
      return;
    }

    setIsProcessing(true);
    try {
      const compressed = await compressImageTo300PPI(file, selectedOrientation);
      setPreviewImage(compressed);
    } catch (error) {
      toast.error("Failed to process image");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedOrientation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleApply = useCallback(() => {
    if (showOrientation) {
      onOrientationChange(selectedOrientation);
    }
    if (previewImage) {
      onBackgroundChange(previewImage);
    }
    onOpenChange(false);
    toast.success("Background updated");
  }, [previewImage, selectedOrientation, showOrientation, onOrientationChange, onBackgroundChange, onOpenChange]);

  const handleClear = useCallback(() => {
    setPreviewImage(null);
  }, []);

  const handleClose = useCallback(() => {
    setPreviewImage(null);
    setSelectedOrientation(orientation);
    onOpenChange(false);
  }, [orientation, onOpenChange]);

  const displayImage = previewImage || currentBackground;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Background Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Orientation Selection */}
          {showOrientation && (
            <div className="space-y-2">
              <Label>Orientation</Label>
              <ToggleGroup
                type="single"
                value={selectedOrientation}
                onValueChange={(v) => v && setSelectedOrientation(v as "portrait" | "landscape")}
                className="justify-start"
              >
                <ToggleGroupItem value="landscape" className="px-6">
                  Landscape (297×210mm)
                </ToggleGroupItem>
                <ToggleGroupItem value="portrait" className="px-6">
                  Portrait (210×297mm)
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}

          {/* Drop Zone */}
          <div className="space-y-2">
            <Label>Background Image</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {isProcessing ? (
                <div className="space-y-2">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-sm text-muted-foreground">Processing image...</p>
                </div>
              ) : displayImage ? (
                <div className="space-y-4">
                  <div 
                    className="relative mx-auto border rounded-lg overflow-hidden bg-muted"
                    style={{
                      width: selectedOrientation === "landscape" ? "280px" : "200px",
                      height: selectedOrientation === "landscape" ? "200px" : "280px",
                    }}
                  >
                    <img 
                      src={displayImage} 
                      alt="Background preview"
                      className="w-full h-full object-contain"
                    />
                    {previewImage && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Replace
                    </Button>
                    {previewImage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drop an image here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select Image
                  </Button>
                </div>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
            className="hidden"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
