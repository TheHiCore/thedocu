import { useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Template, FONT_SIZES, SYSTEM_FONTS } from "@/types/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Table,
  AlignLeft,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Type,
  CornerDownLeft,
  FileText,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface LeftSidebarProps {
  template: Template | null;
  bodyContent: string;
  width: number;
  collapsed: boolean;
  onWidthChange: (width: number) => void;
  onCollapsedChange: (collapsed: boolean) => void;
  onTemplateChange: (updates: Partial<Template>) => void;
  onBodyChange: (content: string) => void;
}

import { SliderControl } from "./SliderControl";
import { EditorSection } from "./EditorSection";





const MIN_WIDTH = 300;
const MAX_WIDTH = 600;

export function LeftSidebar({
  template,
  bodyContent,
  width,
  collapsed,
  onWidthChange,
  onCollapsedChange,
  onTemplateChange,
  onBodyChange,
}: LeftSidebarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [fontSectionOpen, setFontSectionOpen] = useState(true);
  const [subSectionOpen, setsubSectionOpen] = useState(true);


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
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
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

  const insertMarkdown = useCallback((prefix: string, suffix: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = bodyContent.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = 
      bodyContent.substring(0, start) + 
      prefix + textToInsert + suffix + 
      bodyContent.substring(end);
    
    onBodyChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + textToInsert.length + suffix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [bodyContent, onBodyChange]);

  const insertAtLineStart = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = bodyContent.lastIndexOf('\n', start - 1) + 1;
    
    const newText = 
      bodyContent.substring(0, lineStart) + 
      prefix + 
      bodyContent.substring(lineStart);
    
    onBodyChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  }, [bodyContent, onBodyChange]);

  const insertTable = useCallback(() => {
    const tableTemplate = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = 
      bodyContent.substring(0, start) + 
      tableTemplate + 
      bodyContent.substring(start);
    
    onBodyChange(newText);
    
    setTimeout(() => {
      textarea.focus();
    }, 0);
  }, [bodyContent, onBodyChange]);

  const insertLineBreak = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = 
      bodyContent.substring(0, start) + 
      "\n\n" + 
      bodyContent.substring(start);
    
    onBodyChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2);
    }, 0);
  }, [bodyContent, onBodyChange]);

  const insertPageBreak = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const pageBreakMarker = "\n\n---pagebreak---\n\n";
    const newText = 
      bodyContent.substring(0, start) + 
      pageBreakMarker + 
      bodyContent.substring(start);
    
    onBodyChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + pageBreakMarker.length, start + pageBreakMarker.length);
    }, 0);
  }, [bodyContent, onBodyChange]);

  const handleFontSizeChange = (value: string) => {
    const size = parseInt(value, 10);
    if (!isNaN(size) && size > 0) {
      onTemplateChange({ fontSize: size });
    }
  };

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown("**", "**", "bold text"), tooltip: "Bold" },
    { icon: Italic, action: () => insertMarkdown("*", "*", "italic text"), tooltip: "Italic" },
    { icon: Heading1, action: () => insertAtLineStart("# "), tooltip: "Heading 1" },
    { icon: Heading2, action: () => insertAtLineStart("## "), tooltip: "Heading 2" },
    { icon: List, action: () => insertAtLineStart("- "), tooltip: "Bullet List" },
    { icon: ListOrdered, action: () => insertAtLineStart("1. "), tooltip: "Numbered List" },
    { icon: Table, action: insertTable, tooltip: "Insert Table" },
    { icon: CornerDownLeft, action: insertLineBreak, tooltip: "Line Break" },
    { icon: FileText, action: insertPageBreak, tooltip: "New Page" },
  ];

  if (collapsed) {
    return (
      <div className="w-8 bg-card border-r border-border flex flex-col items-center pt-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onCollapsedChange(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="bg-card border-r border-border flex flex-col h-full relative"
      style={{ width }}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-4 z-10 h-6 w-6 rounded-full bg-card border border-border shadow-sm"
        onClick={() => onCollapsedChange(true)}
      >
        <ChevronLeft className="h-3 w-3" />
      </Button>

      {/* Header */}
      <div className="p-4 border-b border-border shrink-0 mr-2">
        <h2 className="text-sm font-semibold text-foreground">
          Text Editor
        </h2>
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col overflow-hidden mr-2 space-y-1">
        {/* Font Section - Collapsible */}
        <EditorSection title="Font" icon={<Type className="h-4 w-4 text-primary" />}>
          <div className="flex items-center gap-2">
              <Select
                value={template?.fontFamily || "Arial, sans-serif"}
                onValueChange={(value) => onTemplateChange({ fontFamily: value })}
              >
                <SelectTrigger className="flex-1 h-9">
                  <SelectValue placeholder="Font" />
                </SelectTrigger>
                <SelectContent>
                  {SYSTEM_FONTS.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(template?.fontSize || 12)}
                onValueChange={handleFontSizeChange}
              >
                <SelectTrigger className="w-20 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </EditorSection>

        <Separator className="mb-4" />

        {/* Subject Line */}


        <EditorSection title="Subject" icon={<MessageSquare className="h-4 w-4 text-primary" />}>
        <div className="grid grid-cols-[1fr_44px_1.5fr] gap-2">
            <Input
              value={template?.object.label || "Object:"}
              onChange={(e) =>
                onTemplateChange({
                  object: { ...template!.object, label: e.target.value },
                })
              }
              className="h-9 text-sm"
              placeholder="Label"
            />
            <Input
              type="color"
              value={template?.object.color || "#1e66d0"}
              onChange={(e) =>
                onTemplateChange({
                  object: { ...template!.object, color: e.target.value },
                })
              }
              className="h-9 w-11 p-1 cursor-pointer"
            />
            <Input
              value={template?.object.title || ""}
              onChange={(e) =>
                onTemplateChange({
                  object: { ...template!.object, title: e.target.value },
                })
              }
              className="h-9 text-sm"
              placeholder="Subject title"
            />
            </div>

            <SliderControl
              label="Y Position"
              value={template?.positions.body.y || 70}
              min={0}
              max={297}
              onChange={(v) => updatePosition("body", "y", v)}
            />
        </EditorSection>

        <Separator className="mb-4" />

        {/* Document Body */}
        <div className="flex-1 flex flex-col min-h-0 pt-2">
          <div className="flex items-center gap-2 mb-4">
            <AlignLeft className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Document Body</Label>
          </div>

          {/* Markdown Toolbar */}
          <TooltipProvider delayDuration={300}>
            <div className="flex gap-1 mb-2 p-1 bg-muted/50 rounded-lg">
              {toolbarButtons.map((btn, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={btn.action}
                    >
                      <btn.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{btn.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>

          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={bodyContent}
            onChange={(e) => onBodyChange(e.target.value)}
            placeholder="Write your sponsoring request here...

Use the toolbar above or markdown syntax:
**bold**, *italic*, # heading, - list, 1. numbered list"
            className="flex-1 text-sm resize-none font-mono"
          />
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className={`absolute right-0 top-0 w-2 h-full cursor-ew-resize z-20 hover:bg-primary/20 transition-colors ${isResizing ? "bg-primary/30" : ""}`}
        onMouseDown={handleMouseDown}
      />
    </motion.div>
  );
}
