import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CertificateTemplate, CertificateEntry, TextConfig, DEFAULT_FONTS, CustomFont } from "@/types/certificate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    ChevronLeft,
    ChevronRight,
    Type,
    Users,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Plus,
} from "lucide-react";
import { EditorSection } from "@/components/editor/EditorSection";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";

interface CertificateRightSidebarProps {
    template: CertificateTemplate | null;
    customFonts: CustomFont[];
    width: number;
    collapsed: boolean;
    hasData: boolean;
    viewMode: "template" | "single" | "grid";
    currentEntry?: CertificateEntry;
    onWidthChange: (width: number) => void;
    onCollapsedChange: (collapsed: boolean) => void;
    onTemplateChange: (updates: Partial<CertificateTemplate>) => void;
    onEntryChange?: (updates: Partial<CertificateEntry>) => void;
    onAddCustomFont: (file: File) => Promise<CustomFont | null>;
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 550;
const SNAP_THRESHOLD = 5;

export function CertificateRightSidebar({
    template,
    customFonts,
    width,
    collapsed,
    hasData,
    viewMode,
    currentEntry,
    onWidthChange,
    onCollapsedChange,
    onTemplateChange,
    onEntryChange,
    onAddCustomFont,
}: CertificateRightSidebarProps) {
    const [isResizing, setIsResizing] = useState(false);
    const fontInputRef = useRef<HTMLInputElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
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

    const getCenter = () => template?.orientation === "landscape" ? 148.5 : 105;
    const getMaxX = () => template?.orientation === "landscape" ? 297 : 210;
    const getMaxY = () => template?.orientation === "landscape" ? 210 : 297;

    const isSnappedToCenter = (value: number) => Math.abs(value - getCenter()) < 0.1;

    const handleXChange = (
        value: number,
        updateFn: (updates: Partial<TextConfig>) => void
    ) => {
        const center = getCenter();
        if (Math.abs(value - center) < SNAP_THRESHOLD) {
            updateFn({ x: center });
            return;
        }
        updateFn({ x: Math.max(0, Math.min(getMaxX(), value)) });
    };

    const isEditingEntry = viewMode === "single" && currentEntry && onEntryChange;

    const updateSubtitleConfig = (updates: Partial<TextConfig>) => {
        if (!template) return;
        if (isEditingEntry) {
            onEntryChange!({ subtitleConfig: { ...currentEntry!.subtitleConfig, ...updates } });
        } else {
            onTemplateChange({ subtitleConfig: { ...template.subtitleConfig, ...updates } });
        }
    };

    const updateSubsubtitleConfig = (updates: Partial<TextConfig>) => {
        if (!template) return;
        if (isEditingEntry) {
            onEntryChange!({ subsubtitleConfig: { ...currentEntry!.subsubtitleConfig, ...updates } });
        } else {
            onTemplateChange({ subsubtitleConfig: { ...template.subsubtitleConfig, ...updates } });
        }
    };

    const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        toast.loading("Loading font...");
        const font = await onAddCustomFont(file);
        toast.dismiss();
        if (font) {
            toast.success(`Font "${font.name}" added`);
        } else {
            toast.error("Failed to load font");
        }
        e.target.value = "";
    };

    const allFonts = [
        ...DEFAULT_FONTS,
        ...customFonts.map((f) => ({ name: f.name, value: `'${f.name}', sans-serif` })),
    ];

    const getEffectiveConfig = (templateConfig: TextConfig, entryConfig?: Partial<TextConfig>) => {
        if (isEditingEntry && entryConfig) {
            return { ...templateConfig, ...entryConfig };
        }
        return templateConfig;
    };

    const renderTextControls = (
        config: TextConfig | undefined,
        updateFn: (updates: Partial<TextConfig>) => void
    ) => {
        if (!config) return null;
        const snapped = isSnappedToCenter(config.x);

        return (
            <div className="space-y-3">
                <div className="flex items-center gap-6">
                    <Label className="text-sm w-12 text-nowrap">Prefix:</Label>
                    <div className="flex flex-1 gap-2">
                        <Input
                            value={config.prefix || ""}
                            onChange={(e) => updateFn({ prefix: e.target.value })}
                            placeholder="e.g. Team: "
                            className="flex-1 h-9"
                        />
                        <Input
                            type="color"
                            value={config.prefixColor || config.color}
                            onChange={(e) => updateFn({ prefixColor: e.target.value })}
                            className="h-9 w-12 p-1 cursor-pointer shrink-0"
                            title="Prefix Color"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-6 flex-1">
                        <Label className="text-sm w-12 text-nowrap">Align:</Label>
                        <ToggleGroup
                            type="single"
                            value={config.alignment}
                            onValueChange={(v) => v && updateFn({ alignment: v as "left" | "center" | "right" })}
                            className="flex-1 justify-start"
                        >
                            <ToggleGroupItem value="left" className="h-8 w-8 p-0"><AlignLeft className="h-4 w-4" /></ToggleGroupItem>
                            <ToggleGroupItem value="center" className="h-8 w-8 p-0"><AlignCenter className="h-4 w-4" /></ToggleGroupItem>
                            <ToggleGroupItem value="right" className="h-8 w-8 p-0"><AlignRight className="h-4 w-4" /></ToggleGroupItem>
                        </ToggleGroup>
                    </div>

                    <div className="flex items-center gap-2 w-[40%]">
                        <Label className="text-sm shrink-0">Size:</Label>
                        <div className="relative flex-1">
                            <Input
                                type="number"
                                value={config.fontSize}
                                onChange={(e) => updateFn({ fontSize: Math.max(1, parseInt(e.target.value) || 12) })}
                                className="w-full h-9 pr-5"
                                min={1}
                                max={200}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Label className="text-sm w-16">Font:</Label>
                    <Select value={config.fontFamily} onValueChange={(v) => updateFn({ fontFamily: v })}>
                        <SelectTrigger className="flex-1 h-9"><SelectValue placeholder="Font" /></SelectTrigger>
                        <SelectContent>
                            {allFonts.map((font) => (
                                <SelectItem key={font.value} value={font.value}>
                                    <span style={{ fontFamily: font.value }}>{font.name}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => fontInputRef.current?.click()} title="Add custom font">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>



                <div className="flex items-center gap-2">
                    <Label className="text-sm w-16">Color:</Label>
                    <Input type="color" value={config.color} onChange={(e) => updateFn({ color: e.target.value })} className="h-9 w-12 p-1 cursor-pointer" />
                    <Input value={config.color} onChange={(e) => updateFn({ color: e.target.value })} className="flex-1 h-9" />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm whitespace-nowrap">
                            X (mm)
                            {snapped && <span className="text-[10px] text-primary font-normal ml-1">(Center)</span>}
                        </Label>
                        <Input
                            type="number"
                            value={parseFloat(config.x.toFixed(1))}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                updateFn({ x: Math.max(0, Math.min(getMaxX(), val)) });
                            }}
                            className="h-8 w-20 px-2 text-left"
                            step={0.5}
                        />
                    </div>
                    <Slider
                        value={[config.x]}
                        min={0}
                        max={getMaxX()}
                        step={0.5}
                        onValueChange={([v]) => handleXChange(v, updateFn)}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm whitespace-nowrap">Y (mm)</Label>
                        <Input
                            type="number"
                            value={parseFloat(config.y.toFixed(1))}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                updateFn({ y: val });
                            }}
                            className="h-8 w-20 px-2 text-left"
                            step={0.5}
                        />
                    </div>
                    <Slider
                        value={[config.y]}
                        min={0}
                        max={getMaxY()}
                        step={0.5}
                        onValueChange={([v]) => updateFn({ y: v })}
                    />
                </div>
            </div>
        );
    };

    if (collapsed) {
        return (
            <div className="w-8 bg-card border-l border-border flex flex-col items-center pt-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onCollapsedChange(false)}>
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
            <div
                className={`absolute left-0 top-0 w-2 h-full cursor-ew-resize z-20 hover:bg-primary/20 transition-colors ${isResizing ? "bg-primary/30" : ""}`}
                onMouseDown={handleMouseDown}
            />

            <Button
                variant="ghost"
                size="icon"
                className="absolute -left-3 top-4 z-10 h-6 w-6 rounded-full bg-card border border-border shadow-sm"
                onClick={() => onCollapsedChange(true)}
            >
                <ChevronRight className="h-3 w-3" />
            </Button>

            <div className="p-4 border-b border-border shrink-0 ml-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground shrink-0">Detail Settings</h2>
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                                <Switch
                                    id="subtitle-toggle-header"
                                    checked={template?.subtitleEnabled ?? true}
                                    onCheckedChange={(v) => {
                                        if (v) {
                                            onTemplateChange({ subtitleEnabled: true });
                                        } else {
                                            onTemplateChange({ subtitleEnabled: false, subsubtitleEnabled: false });
                                        }
                                    }}
                                />
                                <Label htmlFor="subtitle-toggle-header" className="text-xs cursor-pointer">Sub</Label>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>Enable/disable subtitle</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={`flex items-center gap-1 ${!(template?.subtitleEnabled) ? "opacity-50" : ""}`}>
                                <Switch
                                    id="subsubtitle-toggle-header"
                                    checked={template?.subsubtitleEnabled ?? false}
                                    onCheckedChange={(v) => onTemplateChange({ subsubtitleEnabled: v })}
                                    disabled={!(template?.subtitleEnabled)}
                                />
                                <Label
                                    htmlFor="subsubtitle-toggle-header"
                                    className={`text-xs ${template?.subtitleEnabled ? "cursor-pointer" : "cursor-not-allowed"}`}
                                >
                                    Sub²
                                </Label>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            {template?.subtitleEnabled
                                ? "Enable/disable sub-subtitle"
                                : "Enable subtitle first"}
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>

            <ScrollArea className="flex-1 ml-2">
                <div className="p-3 space-y-4 pb-32">
                    <EditorSection
                        title="Subtitle Text"
                        icon={<Users className="h-4 w-4 text-primary" />}
                    >
                        {template?.subtitleEnabled ? renderTextControls(
                            isEditingEntry ? getEffectiveConfig(template!.subtitleConfig, currentEntry?.subtitleConfig) : template?.subtitleConfig,
                            updateSubtitleConfig
                        ) : (
                            <div className="text-sm text-muted-foreground py-2 text-center">
                                Enable subtitle to edit settings
                            </div>
                        )}
                    </EditorSection>

                    <Separator />

                    <EditorSection
                        title="Sub-subtitle Text"
                        icon={<Type className="h-4 w-4 text-primary" />}
                    >
                        {template?.subsubtitleEnabled ? renderTextControls(
                            isEditingEntry ? getEffectiveConfig(template!.subsubtitleConfig, currentEntry?.subsubtitleConfig) : template?.subsubtitleConfig,
                            updateSubsubtitleConfig
                        ) : (
                            <div className="text-sm text-muted-foreground py-2 text-center">
                                {template?.subtitleEnabled ? "Enable sub-subtitle to edit settings" : "Enable subtitle first"}
                            </div>
                        )}
                    </EditorSection>
                </div>
            </ScrollArea>

            <input ref={fontInputRef} type="file" accept=".ttf,.otf,.woff,.woff2" onChange={handleFontUpload} className="hidden" />
        </motion.div>
    );
}
