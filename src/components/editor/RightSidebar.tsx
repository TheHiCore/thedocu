import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Template, SignerData } from "@/types/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  User,
  PenTool,
  Upload,
  AlignLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { EditorSection } from "./EditorSection";
import { CoordinateField } from "./CoordinateField";
import { SliderControl } from "./SliderControl";
import { CoordinateField as CoordinateFieldType } from "@/types/template";

interface RightSidebarProps {
  template: Template | null;
  signers: SignerData[];
  width: number;
  collapsed: boolean;
  onWidthChange: (width: number) => void;
  onCollapsedChange: (collapsed: boolean) => void;
  onTemplateChange: (updates: Partial<Template>) => void;
  onSignersChange: (signers: SignerData[]) => void;
}

const MIN_WIDTH = 280;
const MAX_WIDTH = 500;

const createDefaultSigner = (): SignerData => ({
  name: "",
  role: "",
  image: "",
  position: { x: 130, y: 240, size: 45 },
});

export function RightSidebar({
  template,
  signers,
  width,
  collapsed,
  onWidthChange,
  onCollapsedChange,
  onTemplateChange,
  onSignersChange,
}: RightSidebarProps) {
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth - (e.clientX - startX);
      if (newWidth < MIN_WIDTH - 50) {
        onCollapsedChange(true);
      } else {
        onCollapsedChange(false);
        onWidthChange(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [width, onWidthChange, onCollapsedChange]);

  const handleSignatureChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const updated = [...signers];
        updated[index] = { ...updated[index], image: reader.result as string };
        onSignersChange(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateSigner = (index: number, updates: Partial<SignerData>) => {
    const updated = [...signers];
    updated[index] = { ...updated[index], ...updates };
    onSignersChange(updated);
  };

  const updateSignerPosition = (index: number, key: string, value: number) => {
    const updated = [...signers];
    updated[index] = {
      ...updated[index],
      position: { ...updated[index].position, [key]: value },
    };
    onSignersChange(updated);
  };

  const addSigner = () => {
    if (signers.length < 3) {
      onSignersChange([...signers, createDefaultSigner()]);
    }
  };

  const removeSigner = (index: number) => {
    if (index > 0) {
      const updated = signers.filter((_, i) => i !== index);
      onSignersChange(updated);
    }
  };

  const updateCoordinate = (
    field: keyof Template["coordinates"],
    value: CoordinateFieldType
  ) => {
    if (!template) return;
    onTemplateChange({
      coordinates: {
        ...template.coordinates,
        [field]: value,
      },
    });
  };

  const updatePosition = (
    section: keyof Template["positions"],
    key: string,
    value: number
  ) => {
    if (!template) return;
    onTemplateChange({
      positions: {
        ...template.positions,
        [section]: {
          ...template.positions[section],
          [key]: value,
        },
      },
    });
  };

  if (collapsed) {
    return (
      <div className="w-8 bg-card border-l border-border flex flex-col items-center pt-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onCollapsedChange(false)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="bg-card border-l border-border flex flex-col h-full relative"
      style={{ width }}
    >
      {/* Resize Handle - Full height */}
      <div
        className={`absolute left-0 top-0 w-2 h-full cursor-ew-resize z-20 hover:bg-primary/20 transition-colors ${isResizing ? "bg-primary/30" : ""}`}
        onMouseDown={handleMouseDown}
      />

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -left-3 top-4 z-10 h-6 w-6 rounded-full bg-card border border-border shadow-sm"
        onClick={() => onCollapsedChange(true)}
      >
        <ChevronRight className="h-3 w-3" />
      </Button>

      {/* Header */}
      <div className="p-4 border-b border-border shrink-0 ml-2">
        <h2 className="text-sm font-semibold text-foreground">
          Document Settings
        </h2>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 ml-2">
        <div className="p-3 space-y-1 pb-32">
          {/* Sender Details */}
          <EditorSection title="Sender Details" icon={<User className="h-4 w-4 text-primary" />}>
            <CoordinateField
              field={template?.coordinates.name || { label: "Name:", color: "#000000", value: "" }}
              onChange={(v) => updateCoordinate("name", v)}
              placeholder="Full name"
            />
            <CoordinateField
              field={template?.coordinates.role || { label: "Role:", color: "#000000", value: "" }}
              onChange={(v) => updateCoordinate("role", v)}
              placeholder="Position/Role"
            />
            <CoordinateField
              field={template?.coordinates.phone || { label: "Phone:", color: "#000000", value: "" }}
              onChange={(v) => updateCoordinate("phone", v)}
              placeholder="+1 234 567 890"
            />
            <CoordinateField
              field={template?.coordinates.email || { label: "Email:", color: "#000000", value: "" }}
              onChange={(v) => updateCoordinate("email", v)}
              placeholder="email@example.com"
            />
            <SliderControl
              label="Y Position"
              value={template?.positions.coordinates.y || 50}
              min={0}
              max={297}
              onChange={(v) => updatePosition("coordinates", "y", v)}
            />
          </EditorSection>

          <Separator />


          {/* Signature - Multi-signer */}
          <EditorSection title="Signature" icon={<PenTool className="h-4 w-4 text-primary" />} defaultOpen={true}>
            <div className="space-y-4">
              {signers.map((signer, index) => (
                <div key={index} className="space-y-3 p-3 bg-muted/50 rounded-lg relative">
                  {/* Signer header with remove button */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Signer {index + 1}
                    </span>
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removeSigner(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={signer.name}
                      onChange={(e) => updateSigner(index, { name: e.target.value })}
                      placeholder="Signer name"
                      className="h-9 text-sm"
                    />
                    <Input
                      value={signer.role}
                      onChange={(e) => updateSigner(index, { role: e.target.value })}
                      placeholder="Signer role"
                      className="h-9 text-sm"
                    />
                  </div>

                  <input
                    ref={(el) => (fileInputRefs.current[index] = el)}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleSignatureChange(index, e)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => fileInputRefs.current[index]?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {signer.image ? "Change Signature" : "Upload Signature"}
                  </Button>

                  {signer.image && (
                    <div className="mt-2 p-2 bg-background rounded-lg flex justify-center">
                      <img
                        src={signer.image}
                        alt={`Signature ${index + 1}`}
                        className="max-h-12 object-contain"
                      />
                    </div>
                  )}

                  <div className="space-y-3 mt-3">
                    <SliderControl
                      label="X Position"
                      value={signer.position.x}
                      min={0}
                      max={210}
                      onChange={(v) => updateSignerPosition(index, "x", v)}
                    />
                    <SliderControl
                      label="Y Position"
                      value={signer.position.y}
                      min={0}
                      max={297}
                      onChange={(v) => updateSignerPosition(index, "y", v)}
                    />
                    <SliderControl
                      label="Size"
                      value={signer.position.size}
                      min={10}
                      max={80}
                      onChange={(v) => updateSignerPosition(index, "size", v)}
                    />
                  </div>
                </div>
              ))}

              {/* Add Signer Button */}
              {signers.length < 3 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={addSigner}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Signer ({signers.length}/3)
                </Button>
              )}
            </div>
          </EditorSection>
        </div>
      </ScrollArea>
    </motion.div>
  );
}
