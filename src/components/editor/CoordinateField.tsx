import { Input } from "@/components/ui/input";
import { CoordinateField as CoordinateFieldType } from "@/types/template";

interface CoordinateFieldProps {
  field: CoordinateFieldType;
  onChange: (field: CoordinateFieldType) => void;
  placeholder?: string;
}

export function CoordinateField({
  field,
  onChange,
  placeholder,
}: CoordinateFieldProps) {
  return (
    <div className="grid grid-cols-[1fr_44px_1.5fr] gap-2">
      <Input
        value={field.label}
        onChange={(e) => onChange({ ...field, label: e.target.value })}
        className="h-9 text-sm"
        placeholder="Label"
      />
      <Input
        type="color"
        value={field.color}
        onChange={(e) => onChange({ ...field, color: e.target.value })}
        className="h-9 w-11 p-1 cursor-pointer"
      />
      <Input
        value={field.value}
        onChange={(e) => onChange({ ...field, value: e.target.value })}
        className="h-9 text-sm"
        placeholder={placeholder}
      />
    </div>
  );
}
