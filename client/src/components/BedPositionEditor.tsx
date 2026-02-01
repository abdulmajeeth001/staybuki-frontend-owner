import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Bed, User, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface BedPosition {
  id?: number;
  position: string;
  displayOrder: number;
  status?: string;
  tenantId?: number | null;
  tenant?: {
    id: number;
    name: string;
    phone?: string;
  } | null;
}

interface BedPositionEditorProps {
  roomId?: number;
  sharing: number;
  beds: BedPosition[];
  onBedsChange: (beds: BedPosition[]) => void;
  readOnly?: boolean;
  showOccupancy?: boolean;
}

const POSITION_PRESETS = [
  { label: "Left", value: "Left" },
  { label: "Middle", value: "Middle" },
  { label: "Right", value: "Right" },
  { label: "Top Left", value: "Top Left" },
  { label: "Top Right", value: "Top Right" },
  { label: "Bottom Left", value: "Bottom Left" },
  { label: "Bottom Right", value: "Bottom Right" },
  { label: "Near Window", value: "Near Window" },
  { label: "Near Door", value: "Near Door" },
];

export function BedPositionEditor({
  roomId,
  sharing,
  beds,
  onBedsChange,
  readOnly = false,
  showOccupancy = false,
}: BedPositionEditorProps) {
  const [newPosition, setNewPosition] = useState("");
  const [showPresets, setShowPresets] = useState(false);

  const handleAddBed = () => {
    if (!newPosition.trim()) return;
    if (beds.length >= sharing) return;

    const newBed: BedPosition = {
      position: newPosition.trim(),
      displayOrder: beds.length + 1,
      status: "available",
    };
    onBedsChange([...beds, newBed]);
    setNewPosition("");
    setShowPresets(false);
  };

  const handleRemoveBed = (index: number) => {
    const newBeds = beds.filter((_, i) => i !== index).map((bed, i) => ({
      ...bed,
      displayOrder: i + 1,
    }));
    onBedsChange(newBeds);
  };

  const handleAddPreset = (preset: string) => {
    if (beds.length >= sharing) return;
    if (beds.some(b => b.position === preset)) return;

    const newBed: BedPosition = {
      position: preset,
      displayOrder: beds.length + 1,
      status: "available",
    };
    onBedsChange([...beds, newBed]);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "occupied":
        return "bg-red-100 border-red-300 text-red-700";
      case "reserved":
        return "bg-yellow-100 border-yellow-300 text-yellow-700";
      default:
        return "bg-green-100 border-green-300 text-green-700";
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "occupied":
        return <Badge className="bg-red-500 text-xs">Occupied</Badge>;
      case "reserved":
        return <Badge className="bg-yellow-500 text-xs">Reserved</Badge>;
      default:
        return <Badge className="bg-green-500 text-xs">Available</Badge>;
    }
  };

  const unusedPresets = POSITION_PRESETS.filter(
    p => !beds.some(b => b.position === p.value)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-slate-700 font-medium">
          Bed Positions ({beds.length}/{sharing})
        </Label>
        {!readOnly && beds.length < sharing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPresets(!showPresets)}
            className="gap-1.5 text-xs"
            data-testid="button-toggle-presets"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Bed
          </Button>
        )}
      </div>

      {beds.length === 0 ? (
        <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center">
          <Bed className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            No bed positions defined yet
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Add bed positions to help tenants visualize the room layout
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {beds.map((bed, index) => (
            <div
              key={index}
              className={cn(
                "relative p-3 rounded-xl border-2 transition-all",
                showOccupancy ? getStatusColor(bed.status) : "bg-slate-50 border-slate-200"
              )}
              data-testid={`bed-position-${index}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    bed.status === "occupied" ? "bg-red-200" : "bg-blue-100"
                  )}>
                    {bed.status === "occupied" ? (
                      <User className="w-4 h-4 text-red-600" />
                    ) : (
                      <Bed className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{bed.position}</p>
                    {showOccupancy && (
                      <div className="mt-1">
                        {getStatusBadge(bed.status)}
                      </div>
                    )}
                  </div>
                </div>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => handleRemoveBed(index)}
                    data-testid={`button-remove-bed-${index}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {showOccupancy && bed.tenant && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-700">{bed.tenant.name}</p>
                  {bed.tenant.phone && (
                    <p className="text-xs text-slate-500">{bed.tenant.phone}</p>
                  )}
                </div>
              )}
              <div className="absolute top-1 right-1 text-xs text-slate-400 font-medium">
                #{bed.displayOrder}
              </div>
            </div>
          ))}
        </div>
      )}

      {!readOnly && showPresets && beds.length < sharing && (
        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="space-y-2">
            <Label className="text-sm text-slate-600">Quick Add (Presets)</Label>
            <div className="flex flex-wrap gap-2">
              {unusedPresets.slice(0, 6).map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPreset(preset.value)}
                  className="text-xs h-8"
                  data-testid={`button-preset-${preset.value.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-600">Custom Position</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Corner, Window side..."
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddBed())}
                className="flex-1 h-9 text-sm"
                data-testid="input-custom-position"
              />
              <Button
                type="button"
                onClick={handleAddBed}
                disabled={!newPosition.trim()}
                size="sm"
                className="h-9"
                data-testid="button-add-custom-bed"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {beds.length > 0 && beds.length < sharing && !showPresets && !readOnly && (
        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
          You can add {sharing - beds.length} more bed position{sharing - beds.length > 1 ? 's' : ''} to match the room's sharing capacity
        </p>
      )}
    </div>
  );
}

export function BedPositionViewer({
  beds,
  onBedSelect,
  selectedBedId,
}: {
  beds: BedPosition[];
  onBedSelect?: (bed: BedPosition) => void;
  selectedBedId?: number | null;
}) {
  if (beds.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm">
        No beds defined for this room
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {beds.map((bed) => {
        const isAvailable = bed.status === "available";
        const isSelected = selectedBedId === bed.id;

        return (
          <button
            key={bed.id}
            type="button"
            disabled={!isAvailable || !onBedSelect}
            onClick={() => onBedSelect && isAvailable && onBedSelect(bed)}
            className={cn(
              "p-3 rounded-lg border-2 transition-all text-left",
              isAvailable 
                ? "bg-green-50 border-green-300 hover:border-green-500 cursor-pointer" 
                : "bg-red-50 border-red-200 cursor-not-allowed opacity-75",
              isSelected && "ring-2 ring-blue-500 border-blue-500"
            )}
            data-testid={`bed-select-${bed.id}`}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded flex items-center justify-center",
                isAvailable ? "bg-green-200" : "bg-red-200"
              )}>
                {isAvailable ? (
                  <Bed className="w-3.5 h-3.5 text-green-700" />
                ) : (
                  <User className="w-3.5 h-3.5 text-red-700" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs truncate">{bed.position}</p>
                <Badge 
                  variant={isAvailable ? "default" : "secondary"} 
                  className={cn(
                    "text-[10px] mt-0.5",
                    isAvailable ? "bg-green-500" : "bg-red-400"
                  )}
                >
                  {isAvailable ? "Available" : "Occupied"}
                </Badge>
              </div>
            </div>
            {bed.tenant && (
              <p className="text-[10px] text-slate-600 mt-1 truncate">
                {bed.tenant.name}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
