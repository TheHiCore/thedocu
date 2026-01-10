import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function SliderControl({
  label,
  value,
  min,
  max,
  unit = "mm",
  onChange,
}: SliderControlProps) {
  const step = (delta: number) => {
    const newValue = Math.min(max, Math.max(min, value + delta));
    onChange(newValue);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-24 shrink-0">{label}</span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => step(-1)}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={([v]) => onChange(v)}
        className="flex-1"
      />
      <span className="text-sm font-medium w-16 text-right tabular-nums">
        {value} {unit}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => step(1)}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
