import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Leaf, X, Plus, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { api } from "@/apiClient";

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
type MealType = "breakfast" | "lunch" | "dinner";

interface FoodMenuItem {
  id: number;
  pgId: number;
  dayOfWeek: DayOfWeek;
  mealType: MealType;
  items: string[];
  isVeg: boolean[];
  notes: string | null;
  ownerId: number;
}

interface FoodMenuFormData {
  pgId: number;
  dayOfWeek: DayOfWeek;
  mealType: MealType;
  items: string[];
  isVeg: boolean[];
  notes: string;
}

const DAYS: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const MEALS: MealType[] = ["breakfast", "lunch", "dinner"];

const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export default function FoodMenu() {
  return (
    <>
      <div className="hidden lg:block">
        <FoodMenuDesktop />
      </div>
      <div className="lg:hidden">
        <FoodMenuMobile />
      </div>
    </>
  );
}

function FoodMenuContent() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPgId, setSelectedPgId] = useState<number | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<FoodMenuFormData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [selectedMealForAlert, setSelectedMealForAlert] = useState<MealType>("breakfast");
  const [alertNotes, setAlertNotes] = useState("");
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const isOwner = user?.userType === "owner";

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: pgs } = useQuery<Array<{ id: number; pgName: string }>>({
    queryKey: ["/api/pgs"],
    enabled: isOwner,
  });

  const { data: tenant } = useQuery<{ pgId: number }>({
    queryKey: ["/api/tenant/profile"],
    enabled: !isOwner,
  });

  const activePgId = isOwner ? (selectedPgId || pgs?.[0]?.id) : tenant?.pgId;

  const { data: menuData = [] } = useQuery<FoodMenuItem[]>({
    queryKey: [`/api/food-menu/${activePgId}`],
    enabled: !!activePgId,
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (data: FoodMenuFormData) => {
      const res = await api.post("/api/food-menu", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/food-menu/${activePgId}`] });
      toast({ title: "Menu saved successfully" });
      setIsDialogOpen(false);
      setEditingMenuItem(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to save menu", description: error.response?.data?.error || error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/api/food-menu/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/food-menu/${activePgId}`] });
      toast({ title: "Menu item deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete menu", description: error.response?.data?.error || error.message, variant: "destructive" });
    },
  });

  const sendAlertMutation = useMutation({
    mutationFn: async (data: { pgId: number; mealType: MealType; notes: string }) => {
      const res = await api.post("/api/food-alert", data);
      return res.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Alert sent!",
        description: `Notified ${data.notificationsSent} tenants`,
      });
      setIsAlertDialogOpen(false);
      setAlertNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to send alert", description: error.response?.data?.error || error.message, variant: "destructive" });
    },
  });

  const getMenuItem = (day: DayOfWeek, meal: MealType): FoodMenuItem | undefined => {
    return menuData.find((item) => item.dayOfWeek === day && item.mealType === meal);
  };

  const handleEdit = (day: DayOfWeek, meal: MealType) => {
    if (!activePgId) return;
    const existing = getMenuItem(day, meal);
    setEditingMenuItem({
      pgId: activePgId,
      dayOfWeek: day,
      mealType: meal,
      items: existing?.items || [""],
      isVeg: existing?.isVeg || [true],
      notes: existing?.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    if (!editingMenuItem) return;
    setEditingMenuItem({
      ...editingMenuItem,
      items: [...editingMenuItem.items, ""],
      isVeg: [...editingMenuItem.isVeg, true],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!editingMenuItem) return;
    setEditingMenuItem({
      ...editingMenuItem,
      items: editingMenuItem.items.filter((_, i) => i !== index),
      isVeg: editingMenuItem.isVeg.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, value: string) => {
    if (!editingMenuItem) return;
    const newItems = [...editingMenuItem.items];
    newItems[index] = value;
    setEditingMenuItem({ ...editingMenuItem, items: newItems });
  };

  const handleVegToggle = (index: number) => {
    if (!editingMenuItem) return;
    const newIsVeg = [...editingMenuItem.isVeg];
    newIsVeg[index] = !newIsVeg[index];
    setEditingMenuItem({ ...editingMenuItem, isVeg: newIsVeg });
  };

  const handleSave = () => {
    if (!editingMenuItem) return;
    const validItems = editingMenuItem.items.filter((item) => item.trim());
    if (validItems.length === 0) {
      toast({ title: "Add at least one menu item", variant: "destructive" });
      return;
    }
    createOrUpdateMutation.mutate({
      ...editingMenuItem,
      items: validItems,
      isVeg: editingMenuItem.isVeg.slice(0, validItems.length),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this menu item?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSendAlert = () => {
    if (!activePgId) return;
    sendAlertMutation.mutate({
      pgId: activePgId,
      mealType: selectedMealForAlert,
      notes: alertNotes,
    });
  };

  const renderMealCard = (day: DayOfWeek, meal: MealType) => {
    const menuItem = getMenuItem(day, meal);
    const isEmpty = !menuItem || menuItem.items.length === 0;

    return (
      <Card key={`${day}-${meal}`} className="h-full" data-testid={`card-menu-${day}-${meal}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{capitalizeFirst(meal)}</CardTitle>
            {isOwner && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(day, meal)}
                  data-testid={`button-edit-${day}-${meal}`}
                >
                  {isEmpty ? <Plus className="h-4 w-4" /> : "Edit"}
                </Button>
                {!isEmpty && menuItem && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(menuItem.id)}
                    data-testid={`button-delete-${day}-${meal}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {isEmpty ? (
            <p className="text-sm text-muted-foreground" data-testid={`text-empty-${day}-${meal}`}>
              No items
            </p>
          ) : (
            <>
              {menuItem?.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2" data-testid={`item-${day}-${meal}-${idx}`}>
                  <Leaf className={`h-3 w-3 ${menuItem.isVeg[idx] ? "text-green-600" : "text-red-600"}`} />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
              {menuItem?.notes && (
                <p className="text-xs text-muted-foreground mt-2" data-testid={`text-notes-${day}-${meal}`}>
                  {menuItem.notes}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const visibleDays = isMobile ? [DAYS[currentDayIndex]] : DAYS;

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Food Menu
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            {isOwner ? "Manage weekly food menu for your PG" : "View this week's food menu"}
          </p>
        </div>
        {isOwner && activePgId && (
          <Button onClick={() => setIsAlertDialogOpen(true)} data-testid="button-send-alert">
            <Bell className="h-4 w-4 mr-2" />
            Send Food Alert
          </Button>
        )}
      </div>

      {isOwner && pgs && pgs.length > 1 && (
        <div className="mb-6">
          <Label>Select PG</Label>
          <Select
            value={selectedPgId?.toString() || pgs[0]?.id.toString()}
            onValueChange={(val) => setSelectedPgId(parseInt(val))}
          >
            <SelectTrigger data-testid="select-pg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pgs.map((pg: any) => (
                <SelectItem key={pg.id} value={pg.id.toString()} data-testid={`option-pg-${pg.id}`}>
                  {pg.pgName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isMobile && (
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDayIndex((prev) => (prev === 0 ? DAYS.length - 1 : prev - 1))}
            data-testid="button-prev-day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold" data-testid="text-current-day">
            {capitalizeFirst(DAYS[currentDayIndex])}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDayIndex((prev) => (prev === DAYS.length - 1 ? 0 : prev + 1))}
            data-testid="button-next-day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className={`${isMobile ? "" : "grid grid-cols-7 gap-4"}`}>
        {visibleDays.map((day) => (
          <div key={day} className={isMobile ? "mb-6" : ""}>
            {!isMobile && (
              <h2 className="text-lg font-semibold mb-3 text-center" data-testid={`text-day-${day}`}>
                {capitalizeFirst(day)}
              </h2>
            )}
            <div className="space-y-3">
              {MEALS.map((meal) => renderMealCard(day, meal))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Menu Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-menu">
          <DialogHeader>
            <DialogTitle>
              Edit {editingMenuItem && capitalizeFirst(editingMenuItem.mealType)} -{" "}
              {editingMenuItem && capitalizeFirst(editingMenuItem.dayOfWeek)}
            </DialogTitle>
            <DialogDescription>Add menu items and mark them as veg or non-veg</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {editingMenuItem?.items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    value={item}
                    onChange={(e) => handleItemChange(idx, e.target.value)}
                    placeholder="Menu item"
                    data-testid={`input-item-${idx}`}
                  />
                </div>
                <Button
                  type="button"
                  variant={editingMenuItem.isVeg[idx] ? "default" : "destructive"}
                  size="sm"
                  onClick={() => handleVegToggle(idx)}
                  data-testid={`button-veg-${idx}`}
                >
                  <Leaf className="h-4 w-4" />
                  {editingMenuItem.isVeg[idx] ? "Veg" : "Non-Veg"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(idx)}
                  data-testid={`button-remove-${idx}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={handleAddItem} className="w-full" data-testid="button-add-item">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>

            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={editingMenuItem?.notes || ""}
                onChange={(e) => setEditingMenuItem(editingMenuItem ? { ...editingMenuItem, notes: e.target.value } : null)}
                placeholder="Any special notes..."
                data-testid="input-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={createOrUpdateMutation.isPending} data-testid="button-save">
              {createOrUpdateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Alert Dialog */}
      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogContent data-testid="dialog-send-alert">
          <DialogHeader>
            <DialogTitle>Send Food Alert</DialogTitle>
            <DialogDescription>Notify all tenants that a meal is ready</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Meal Type</Label>
              <Select
                value={selectedMealForAlert}
                onValueChange={(val) => setSelectedMealForAlert(val as MealType)}
              >
                <SelectTrigger data-testid="select-meal-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast" data-testid="option-breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch" data-testid="option-lunch">Lunch</SelectItem>
                  <SelectItem value="dinner" data-testid="option-dinner">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Additional Notes (optional)</Label>
              <Textarea
                value={alertNotes}
                onChange={(e) => setAlertNotes(e.target.value)}
                placeholder="e.g., Come to dining hall"
                data-testid="input-alert-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAlertDialogOpen(false)} data-testid="button-cancel-alert">
              Cancel
            </Button>
            <Button onClick={handleSendAlert} disabled={sendAlertMutation.isPending} data-testid="button-confirm-alert">
              {sendAlertMutation.isPending ? "Sending..." : "Send Alert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FoodMenuDesktop() {
  return (
    <DesktopLayout title="Food Menu">
      <FoodMenuContent />
    </DesktopLayout>
  );
}

function FoodMenuMobile() {
  return (
    <MobileLayout title="Food Menu">
      <FoodMenuContent />
    </MobileLayout>
  );
}
