import { useState, useRef, useCallback } from "react";
import { CertificateEntry } from "@/types/certificate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Upload, Download } from "lucide-react";
import { toast } from "sonner";

interface DataEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: CertificateEntry[];
  onEntriesChange: (entries: CertificateEntry[]) => void;
  subtitleEnabled: boolean;
  onSubtitleEnabledChange: (enabled: boolean) => void;
  subsubtitleEnabled: boolean;
  onSubsubtitleEnabledChange: (enabled: boolean) => void;
}

export function DataEntryDialog({
  open,
  onOpenChange,
  entries,
  onEntriesChange,
  subtitleEnabled,
  onSubtitleEnabledChange,
  subsubtitleEnabled,
  onSubsubtitleEnabledChange,
}: DataEntryDialogProps) {
  const [rowsToAdd, setRowsToAdd] = useState("1");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addRows = useCallback((count: number) => {
    const newEntries: CertificateEntry[] = [];
    for (let i = 0; i < count; i++) {
      newEntries.push({
        id: crypto.randomUUID(),
        name: "",
        subtitle: "",
        subsubtitle: "",
        selected: true,
      });
    }
    onEntriesChange([...entries, ...newEntries]);
  }, [entries, onEntriesChange]);

  const updateEntry = useCallback((id: string, updates: Partial<CertificateEntry>) => {
    onEntriesChange(
      entries.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }, [entries, onEntriesChange]);

  const deleteEntry = useCallback((id: string) => {
    onEntriesChange(entries.filter((e) => e.id !== id));
  }, [entries, onEntriesChange]);

  const deleteSelected = useCallback(() => {
    onEntriesChange(entries.filter((e) => !e.selected));
  }, [entries, onEntriesChange]);

  const toggleAll = useCallback((checked: boolean) => {
    onEntriesChange(entries.map((e) => ({ ...e, selected: checked })));
  }, [entries, onEntriesChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (!text) return;

    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return;

    e.preventDefault();

    const newEntries: CertificateEntry[] = lines.map((line) => {
      const parts = line.split("\t");
      return {
        id: crypto.randomUUID(),
        name: parts[0]?.trim() || "",
        subtitle: parts[1]?.trim() || "",
        subsubtitle: parts[2]?.trim() || "",
        selected: true,
      };
    });

    onEntriesChange([...entries, ...newEntries]);
    toast.success(`Pasted ${newEntries.length} entries`);
  }, [entries, onEntriesChange]);

  const handleCSVImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split("\n").filter((line) => line.trim());
      // Skip header if it looks like one
      const startIndex = lines[0]?.toLowerCase().includes("name") ? 1 : 0;
      
      const newEntries: CertificateEntry[] = lines.slice(startIndex).map((line) => {
        // Handle both comma and semicolon separators
        const parts = line.includes(";") ? line.split(";") : line.split(",");
        return {
          id: crypto.randomUUID(),
          name: parts[0]?.trim().replace(/^"|"$/g, "") || "",
          subtitle: parts[1]?.trim().replace(/^"|"$/g, "") || "",
          subsubtitle: parts[2]?.trim().replace(/^"|"$/g, "") || "",
          selected: true,
        };
      });

      onEntriesChange([...entries, ...newEntries]);
      toast.success(`Imported ${newEntries.length} entries from CSV`);
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [entries, onEntriesChange]);

  const exportCSV = useCallback(() => {
    let header = "Name";
    if (subtitleEnabled) header += ",Subtitle";
    if (subsubtitleEnabled) header += ",Subsubtitle";
    
    const rows = entries.map((e) => {
      let row = `"${e.name}"`;
      if (subtitleEnabled) row += `,"${e.subtitle}"`;
      if (subsubtitleEnabled) row += `,"${e.subsubtitle}"`;
      return row;
    });
    const csv = [header, ...rows].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "certificate_data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Exported to CSV");
  }, [entries, subtitleEnabled, subsubtitleEnabled]);

  const allSelected = entries.length > 0 && entries.every((e) => e.selected);
  const someSelected = entries.some((e) => e.selected);

  // Calculate column count for colspan
  let colCount = 4; // checkbox, #, name, delete
  if (subtitleEnabled) colCount++;
  if (subsubtitleEnabled) colCount++;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-5xl flex flex-col" 
        style={{ height: "80vh" }}
        onPaste={handlePaste}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-semibold">
            Certificate Data
          </DialogTitle>
        </DialogHeader>

        {/* Toggles */}
        <div className="flex items-center gap-6 py-2 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Switch
              id="subtitle-toggle"
              checked={subtitleEnabled}
              onCheckedChange={onSubtitleEnabledChange}
            />
            <Label htmlFor="subtitle-toggle" className="text-sm font-normal">
              Enable Subtitles
            </Label>
          </div>
          {subtitleEnabled && (
            <div className="flex items-center gap-2">
              <Switch
                id="subsubtitle-toggle"
                checked={subsubtitleEnabled}
                onCheckedChange={onSubsubtitleEnabledChange}
              />
              <Label htmlFor="subsubtitle-toggle" className="text-sm font-normal">
                Enable Sub-subtitle
              </Label>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 py-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addRows(1)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Row
          </Button>
          
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="1"
              max="100"
              value={rowsToAdd}
              onChange={(e) => setRowsToAdd(e.target.value)}
              className="w-16 h-8"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const count = parseInt(rowsToAdd) || 1;
                addRows(count);
              }}
            >
              Add {rowsToAdd} Rows
            </Button>
          </div>

          <div className="flex-1" />

          {/* Delete Selected - moved before import/export */}
          {someSelected && (
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteSelected}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Import CSV"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={entries.length === 0}
            title="Export CSV"
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>

        {/* Paste hint */}
        <p className="text-xs text-muted-foreground shrink-0">
          Tip: Copy data from Excel or Google Sheets and paste directly into this dialog
        </p>

        {/* Table with proper scrolling */}
        <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Name</TableHead>
                  {subtitleEnabled && <TableHead>Subtitle / Team</TableHead>}
                  {subsubtitleEnabled && <TableHead>Sub-subtitle</TableHead>}
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={colCount} 
                      className="text-center py-12 text-muted-foreground"
                    >
                      No entries yet. Add rows or paste data from a spreadsheet.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry, index) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Checkbox
                          checked={entry.selected}
                          onCheckedChange={(checked) =>
                            updateEntry(entry.id, { selected: !!checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={entry.name}
                          onChange={(e) =>
                            updateEntry(entry.id, { name: e.target.value })
                          }
                          placeholder="Enter name..."
                          className="h-8"
                        />
                      </TableCell>
                      {subtitleEnabled && (
                        <TableCell>
                          <Input
                            value={entry.subtitle}
                            onChange={(e) =>
                              updateEntry(entry.id, { subtitle: e.target.value })
                            }
                            placeholder="Enter subtitle..."
                            className="h-8"
                          />
                        </TableCell>
                      )}
                      {subsubtitleEnabled && (
                        <TableCell>
                          <Input
                            value={entry.subsubtitle}
                            onChange={(e) =>
                              updateEntry(entry.id, { subsubtitle: e.target.value })
                            }
                            placeholder="Enter sub-subtitle..."
                            className="h-8"
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteEntry(entry.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="shrink-0 pt-4">
          <div className="text-sm text-muted-foreground mr-auto">
            {entries.length} entries ({entries.filter(e => e.selected).length} selected)
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
