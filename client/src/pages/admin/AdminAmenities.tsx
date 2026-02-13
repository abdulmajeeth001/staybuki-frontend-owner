import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Archive, ArchiveRestore, Tag, Check, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { api } from "@/apiClient";

interface AmenityMaster {
  id: number;
  name: string;
  category: string;
  requiresCertificate: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface AmenityFormData {
  name: string;
  category: string;
  requiresCertificate: boolean;
  isActive: boolean;
  displayOrder: number;
}

const categoryLabels: Record<string, string> = {
  basic: "Basic",
  food: "Food & Dining",
  comfort: "Comfort & Convenience",
  security: "Security & Safety",
};

const categoryColors: Record<string, string> = {
  basic: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  food: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  comfort: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  security: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
};

export default function AdminAmenities() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<AmenityMaster | null>(null);
  const [formData, setFormData] = useState<AmenityFormData>({
    name: "",
    category: "basic",
    requiresCertificate: false,
    isActive: true,
    displayOrder: 0,
  });

  const { data: amenities, isLoading } = useQuery<AmenityMaster[]>({
    queryKey: ["/api/admin/amenities"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: AmenityFormData) => {
      const response = await api.post("/api/admin/amenities", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/amenities"] });
      toast({ title: "Amenity created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.error || error.message || "Failed to create amenity", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AmenityFormData> }) => {
      const response = await api.patch(`/api/admin/amenities/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/amenities"] });
      toast({ title: "Amenity updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.error || error.message || "Failed to update amenity", variant: "destructive" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/api/admin/amenities/${id}/archive`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/amenities"] });
      toast({ title: "Amenity archived successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.error || error.message || "Failed to archive amenity", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "basic",
      requiresCertificate: false,
      isActive: true,
      displayOrder: 0,
    });
    setEditingAmenity(null);
  };

  const handleOpenDialog = (amenity?: AmenityMaster) => {
    if (amenity) {
      setEditingAmenity(amenity);
      setFormData({
        name: amenity.name,
        category: amenity.category,
        requiresCertificate: amenity.requiresCertificate,
        isActive: amenity.isActive,
        displayOrder: amenity.displayOrder,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAmenity) {
      updateMutation.mutate({ id: editingAmenity.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleArchiveToggle = (amenity: AmenityMaster) => {
    updateMutation.mutate({
      id: amenity.id,
      data: { isActive: !amenity.isActive },
    });
  };

  const groupedAmenities = amenities?.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, AmenityMaster[]>);

  const content = (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-admin-amenities-title">
            Amenities Management
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Manage amenities available for PGs
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-amenity">
              <Plus className="w-4 h-4 mr-2" />
              Add Amenity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">
                {editingAmenity ? "Edit Amenity" : "Add New Amenity"}
              </DialogTitle>
              <DialogDescription>
                {editingAmenity ? "Update the amenity details below" : "Create a new amenity for PGs to select"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Amenity Name *</Label>
                  <Input
                    id="name"
                    data-testid="input-amenity-name"
                    placeholder="e.g., WiFi, Parking, Food Service"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category" data-testid="select-amenity-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key} data-testid={`option-category-${key}`}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    data-testid="input-display-order"
                    type="number"
                    placeholder="0"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                </div>
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="requiresCertificate" className="text-sm font-medium">
                      Requires Certificate
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      FSSAI or other certification required
                    </p>
                  </div>
                  <Switch
                    id="requiresCertificate"
                    data-testid="switch-requires-certificate"
                    checked={formData.requiresCertificate}
                    onCheckedChange={(checked) => setFormData({ ...formData, requiresCertificate: checked })}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="text-sm font-medium">
                      Active Status
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Show this amenity to PG owners
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    data-testid="switch-is-active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  data-testid="button-submit-amenity"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingAmenity ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-12 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groupedAmenities && Object.keys(groupedAmenities).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {Object.entries(groupedAmenities)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, categoryAmenities]) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-border h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-muted-foreground" />
                      <CardTitle className="text-lg" data-testid={`text-category-${category}`}>
                        {categoryLabels[category] || category}
                      </CardTitle>
                    </div>
                    <CardDescription>
                      {categoryAmenities.length} {categoryAmenities.length === 1 ? "amenity" : "amenities"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryAmenities
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((amenity) => (
                          <div
                            key={amenity.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                            data-testid={`card-amenity-${amenity.id}`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm" data-testid={`text-amenity-name-${amenity.id}`}>
                                    {amenity.name}
                                  </p>
                                  {amenity.requiresCertificate && (
                                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800">
                                      Cert Required
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={`text-xs ${categoryColors[amenity.category]}`}>
                                    {categoryLabels[amenity.category] || amenity.category}
                                  </Badge>
                                  {amenity.isActive ? (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                                      <Check className="w-3 h-3 mr-1" />
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800">
                                      <X className="w-3 h-3 mr-1" />
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(amenity)}
                                data-testid={`button-edit-amenity-${amenity.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArchiveToggle(amenity)}
                                data-testid={`button-toggle-amenity-${amenity.id}`}
                              >
                                {amenity.isActive ? (
                                  <Archive className="w-4 h-4 text-orange-600" />
                                ) : (
                                  <ArchiveRestore className="w-4 h-4 text-green-600" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No amenities yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first amenity to get started</p>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-first-amenity">
              <Plus className="w-4 h-4 mr-2" />
              Add Amenity
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (isMobile) {
    return <MobileLayout>{content}</MobileLayout>;
  }

  return <DesktopLayout>{content}</DesktopLayout>;
}
