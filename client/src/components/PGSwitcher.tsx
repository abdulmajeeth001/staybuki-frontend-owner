import { useLocation } from "wouter";
import { usePG, PG } from "@/hooks/use-pg";
import { Building2, ChevronDown, Plus, Check, Settings, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PGSwitcherProps {
  variant?: "sidebar" | "header";
  className?: string;
}

export function PGSwitcher({ variant = "sidebar", className = "" }: PGSwitcherProps) {
  const { pg, allPgs, selectPG, setPrimaryPG, isLoading } = usePG();
  const [, navigate] = useLocation();

  const handleSelectPG = async (selectedPg: PG) => {
    if (selectedPg.id === pg?.id) return;
    
    toast.promise(selectPG(selectedPg.id), {
      loading: `Switching to ${selectedPg.pgName}...`,
      success: () => {
        // Force a hard reload to ensure all local component states are wiped clean 
        setTimeout(() => window.location.reload(), 500);
        return `Switched to ${selectedPg.pgName}`;
      },
      error: "Failed to switch PG"
    });
  };

  const handleSetPrimary = async (pgId: number, pgName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent dropdown from switching PG
    
    toast.promise(setPrimaryPG(pgId), {
      loading: `Setting ${pgName} as primary...`,
      success: () => {
        setTimeout(() => window.location.reload(), 500);
        return `${pgName} set as primary PG`;
      },
      error: "Failed to set primary PG"
    });
  };

  const handleAddPG = () => {
    navigate("/pg-management");
  };

  const handleManagePGs = () => {
    navigate("/pg-management");
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 animate-pulse" />
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!pg && allPgs.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={`gap-2 ${className}`}
        onClick={handleAddPG}
        data-testid="button-add-first-pg"
      >
        <Plus className="h-4 w-4" />
        Add Your First PG
      </Button>
    );
  }

  if (variant === "header") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`gap-2 font-medium ${className}`}
            data-testid="dropdown-pg-switcher"
          >
            <Building2 className="h-4 w-4 text-primary" />
            <span className="max-w-[150px] truncate">{pg?.pgName || "Select PG"}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px]">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Your Properties ({allPgs.length})
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {allPgs.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onSelect={() => handleSelectPG(item)}
              className="flex items-center gap-2 cursor-pointer"
              data-testid={`menuitem-pg-${item.id}`}
            >
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-medium">{item.pgName}</p>
                  {item.isPrimary && (
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" data-testid={`icon-primary-${item.id}`} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{item.pgLocation}</p>
              </div>
              {!item.isPrimary && (
                <button
                  onClick={(e) => handleSetPrimary(item.id, item.pgName, e)}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  className="text-xs text-muted-foreground hover:text-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid={`button-set-primary-${item.id}`}
                  title="Set as primary"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              )}
              {item.id === pg?.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onSelect={() => handleAddPG()}
            className="gap-2 cursor-pointer"
            data-testid="menuitem-add-pg"
          >
            <Plus className="h-4 w-4" />
            Add New PG
          </DropdownMenuItem>
          <DropdownMenuItem 
            onSelect={() => handleManagePGs()}
            className="gap-2 cursor-pointer"
            data-testid="menuitem-manage-pgs"
          >
            <Settings className="h-4 w-4" />
            Manage PGs
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Sidebar variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className={`w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 transition-all border border-primary/20 ${className}`}
          data-testid="button-pg-switcher-sidebar"
        >
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="font-semibold text-sm truncate">{pg?.pgName || "Select PG"}</p>
            <p className="text-xs text-muted-foreground truncate">{pg?.pgLocation || "No location"}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[260px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch Property ({allPgs.length} total)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allPgs.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onSelect={() => handleSelectPG(item)}
            className="flex items-center gap-3 py-3 cursor-pointer"
            data-testid={`menuitem-sidebar-pg-${item.id}`}
          >
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              item.id === pg?.id 
                ? "bg-gradient-to-br from-primary to-primary/80" 
                : "bg-muted"
            }`}>
              <Building2 className={`h-4 w-4 ${
                item.id === pg?.id ? "text-primary-foreground" : "text-muted-foreground"
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate font-medium text-sm">{item.pgName}</p>
                {item.isPrimary && (
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" data-testid={`icon-sidebar-primary-${item.id}`} />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{item.pgAddress}</p>
            </div>
            {!item.isPrimary && (
              <button
                onClick={(e) => handleSetPrimary(item.id, item.pgName, e)}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                className="text-xs text-muted-foreground hover:text-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid={`button-sidebar-set-primary-${item.id}`}
                title="Set as primary"
              >
                <Star className="h-4 w-4" />
              </button>
            )}
            {item.id === pg?.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onSelect={() => handleAddPG()}
          className="gap-2 py-2 cursor-pointer"
          data-testid="menuitem-sidebar-add-pg"
        >
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <Plus className="h-4 w-4" />
          </div>
          <span>Add New PG</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onSelect={() => handleManagePGs()}
          className="gap-2 py-2 cursor-pointer"
          data-testid="menuitem-sidebar-manage-pgs"
        >
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <Settings className="h-4 w-4" />
          </div>
          <span>Manage All PGs</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
