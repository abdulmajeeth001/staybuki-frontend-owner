import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { Leaf, X, Plus, Bell, ChevronLeft, ChevronRight, Coffee, Sun, Moon, Edit2, Trash2, UtensilsCrossed, Info, Utensils } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { usePG } from "@/hooks/use-pg";
import { ownerService } from "@/services/ownerService";
import type { FoodMenuResponse, FoodMenuRequest, FoodAlertRequest, FoodAlertResponse } from "@/types/owner";

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
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return (
    <Layout title="Food Menu" showNav>
      <FoodMenuContent isMobile={isMobile} />
    </Layout>
  );
}

function FoodMenuContent({ isMobile }: { isMobile: boolean }) {
  const { user } = useUser();
  const { toast } = useToast();
  const { pg, allPgs } = usePG();
  const queryClient = useQueryClient();
  const [editingMenuItem, setEditingMenuItem] = useState<FoodMenuFormData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [selectedMealForAlert, setSelectedMealForAlert] = useState<MealType>("breakfast");
  const [alertNotes, setAlertNotes] = useState("");
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  const isOwner = user?.userType === "owner";

  const { data: tenant } = useQuery<{ pgId: number }>({
    queryKey: ["/api/tenant/profile"],
    queryFn: () => ownerService.getTenantProfile(),
    enabled: !isOwner,
  });

  const activePgId = isOwner ? pg?.id : tenant?.pgId;

  const { data: menuData = [] } = useQuery<FoodMenuResponse[]>({
    queryKey: [`/api/food-menu/${activePgId}`],
    queryFn: () => ownerService.getFoodMenu(activePgId!),
    enabled: !!activePgId,
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: (data: FoodMenuRequest | any) => ownerService.createOrUpdateFoodMenu(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/food-menu/${activePgId}`] });
      toast({ title: "Menu saved successfully" });
      setIsDialogOpen(false);
      setEditingMenuItem(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to save menu", 
        description: error.response?.data?.error || error.message, 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ownerService.deleteFoodMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/food-menu/${activePgId}`] });
      toast({ title: "Menu item deleted" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete menu", 
        description: error.response?.data?.error || error.message, 
        variant: "destructive" 
      });
    },
  });

  const sendAlertMutation = useMutation({
    mutationFn: (data: FoodAlertRequest | any) => ownerService.sendFoodAlert(data),
    onSuccess: (data: any) => {
      toast({
        title: "Alert sent!",
        description: `Notified ${data.notificationsSent} tenants`,
      });
      setIsAlertDialogOpen(false);
      setAlertNotes("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to send alert", 
        description: error.response?.data?.error || error.message, 
        variant: "destructive" 
      });
    },
  });

  const getMenuItem = (day: DayOfWeek, meal: MealType): FoodMenuResponse | undefined => {
    return menuData.find((item: any) => 
      item.dayOfWeek?.toLowerCase() === day.toLowerCase() && 
      item.mealType?.toLowerCase() === meal.toLowerCase()
    );
  };

  const handleEdit = (day: DayOfWeek, meal: MealType) => {
    if (!activePgId) {
      toast({ title: "No PG selected", variant: "destructive" });
      return;
    }
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

    const MealIcon = meal === "breakfast" ? Coffee : meal === "lunch" ? Sun : Moon;
    const mealColor = meal === "breakfast" ? "text-amber-500 bg-amber-50" : meal === "lunch" ? "text-orange-500 bg-orange-50" : "text-indigo-500 bg-indigo-50";
    const mealBorder = meal === "breakfast" ? "hover:border-amber-300" : meal === "lunch" ? "hover:border-orange-300" : "hover:border-indigo-300";

    return (
      <Card 
        key={`${day}-${meal}`} 
        className={cn("h-full border-2 transition-all duration-300 shadow-sm hover:shadow-md group overflow-hidden", mealBorder)} 
        data-testid={`card-menu-${day}-${meal}`}
      >
        <CardHeader className="pb-3 px-2.5 pt-3 border-b border-gray-50 bg-gray-50/50 relative">
          <div className="flex items-center gap-1.5 min-w-0 pr-14 lg:pr-0">
            <div className={cn("p-1.5 rounded-lg shrink-0", mealColor)}>
              <MealIcon className="w-3.5 h-3.5" />
            </div>
            <CardTitle className="text-sm font-bold text-gray-800 truncate">{capitalizeFirst(meal)}</CardTitle>
          </div>
          {isOwner && (
            <div className="absolute right-1.5 top-1.5 flex gap-0.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50/95 backdrop-blur-sm rounded-md p-0.5">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleEdit(day, meal)}
                className="h-7 w-7 rounded-md hover:bg-orange-50 hover:text-orange-600 shrink-0"
                data-testid={`button-edit-${day}-${meal}`}
              >
                {isEmpty ? <Plus className="h-4 w-4" /> : <Edit2 className="h-3.5 w-3.5" />}
              </Button>
              {!isEmpty && menuItem && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(menuItem.id)}
                  className="h-7 w-7 rounded-md hover:bg-red-50 hover:text-red-600 text-red-500 shrink-0"
                  data-testid={`button-delete-${day}-${meal}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-2.5 space-y-2 relative">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <UtensilsCrossed className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-xs font-medium text-gray-400" data-testid={`text-empty-${day}-${meal}`}>
                No items added
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                {menuItem?.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2" data-testid={`item-${day}-${meal}-${idx}`}>
                    <div className={cn(
                      "mt-0.5 p-0.5 rounded-full flex-shrink-0",
                      menuItem.isVeg[idx] ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    )}>
                      <Leaf className="h-3 w-3" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 leading-tight break-words min-w-0 flex-1">{item}</span>
                  </div>
                ))}
              </div>
              {menuItem?.notes && (
                <div className="pt-2 border-t border-dashed border-gray-200">
                  <p className="text-[11px] font-medium text-gray-500 italic flex items-start gap-1" data-testid={`text-notes-${day}-${meal}`}>
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    {menuItem.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const visibleDays = isMobile ? [DAYS[currentDayIndex]] : DAYS;

  if (!user) return null;

  return (
    <div className={cn(!isMobile ? "max-w-7xl mx-auto" : "")}>
      {/* Hero Section */}
      <div className={cn("relative overflow-hidden mb-8", !isMobile ? "-mx-6 -mt-6 rounded-b-3xl" : "-mx-4 -mt-6")}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className={cn("relative text-white", !isMobile ? "px-8 py-10" : "px-6 py-8")}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className={cn("font-bold tracking-tight mb-2", !isMobile ? "text-4xl" : "text-2xl")} data-testid="text-page-title">
                Food Menu
              </h2>
              <p className="text-white/90 text-sm font-medium" data-testid="text-page-description">
                {isOwner ? "Manage weekly food menu for your PG" : "View this week's food menu"}
              </p>
            </div>
            {isOwner && activePgId && (
              <Button 
                onClick={() => setIsAlertDialogOpen(true)}
                className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white shadow-lg w-full sm:w-auto transition-all"
                data-testid="button-send-alert"
              >
                <Bell className="w-4 h-4 mr-2" />
                Send Food Alert
              </Button>
            )}
          </div>
        </div>
      </div>

      {isMobile && (
        <div className="flex items-center justify-between mb-6 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mx-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDayIndex((prev) => (prev === 0 ? DAYS.length - 1 : prev - 1))}
            className="h-10 w-10 rounded-xl hover:bg-purple-50 hover:text-purple-600"
            data-testid="button-prev-day"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-bold text-gray-800" data-testid="text-current-day">
            {capitalizeFirst(DAYS[currentDayIndex])}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDayIndex((prev) => (prev === DAYS.length - 1 ? 0 : prev + 1))}
            className="h-10 w-10 rounded-xl hover:bg-purple-50 hover:text-purple-600"
            data-testid="button-next-day"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className={cn(isMobile ? "space-y-6 px-4 pb-20" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 pb-12")}>
        {visibleDays.map((day) => (
          <div key={day} className={isMobile ? "mb-6" : ""}>
            {!isMobile && (
              <h2 className="text-lg font-bold mb-4 text-center text-gray-800 border-b-2 border-purple-100 pb-2" data-testid={`text-day-${day}`}>
                {capitalizeFirst(day)}
              </h2>
            )}
            <div className="space-y-4">
              {MEALS.map((meal) => renderMealCard(day, meal))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Menu Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:rounded-2xl" data-testid="dialog-edit-menu">
          <DialogHeader className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 -mx-6 -mt-6 border-b border-purple-100 mb-6">
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-purple-600" />
              Edit {editingMenuItem && capitalizeFirst(editingMenuItem.mealType)} -{" "}
              {editingMenuItem && capitalizeFirst(editingMenuItem.dayOfWeek)}
            </DialogTitle>
            <DialogDescription className="text-gray-600 font-medium">
              Add menu items and specify if they are veg or non-veg.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Menu Items</Label>
              <div className="space-y-3">
                {editingMenuItem?.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start group bg-gray-50/50 p-2 rounded-xl border border-gray-100 hover:border-purple-200 transition-colors">
                    <div className="flex-1">
                      <Input
                        value={item}
                        onChange={(e) => handleItemChange(idx, e.target.value)}
                        placeholder="e.g., Dal Makhani, Roti, Rice"
                        className="h-11 bg-white border-gray-200 focus-visible:ring-purple-500"
                        data-testid={`input-item-${idx}`}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-11 px-3 transition-colors border-2",
                        editingMenuItem.isVeg[idx] 
                          ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800" 
                          : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
                      )}
                      onClick={() => handleVegToggle(idx)}
                      data-testid={`button-veg-${idx}`}
                      title={editingMenuItem.isVeg[idx] ? "Mark as Non-Veg" : "Mark as Veg"}
                    >
                      <Leaf className="h-4 w-4 mr-1.5" />
                      <span className="font-bold">{editingMenuItem.isVeg[idx] ? "Veg" : "Non-Veg"}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(idx)}
                      className="h-11 w-11 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                      data-testid={`button-remove-${idx}`}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddItem} 
                className="w-full h-11 border-2 border-dashed border-gray-300 text-gray-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 font-semibold rounded-xl" 
                data-testid="button-add-item"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Item
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Additional Notes (Optional)</Label>
              <Textarea
                value={editingMenuItem?.notes || ""}
                onChange={(e) => setEditingMenuItem(editingMenuItem ? { ...editingMenuItem, notes: e.target.value } : null)}
                placeholder="e.g., Special Jain food available on request..."
                className="resize-none min-h-[100px] border-2 focus-visible:ring-purple-500 rounded-xl"
                data-testid="input-notes"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-11 font-semibold" data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={createOrUpdateMutation.isPending} 
              className="rounded-xl h-11 font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md text-white"
              data-testid="button-save"
            >
              {createOrUpdateMutation.isPending ? "Saving..." : "Save Menu"}
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
