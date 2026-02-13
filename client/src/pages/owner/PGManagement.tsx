import { useState, useEffect } from "react";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { usePG, PG } from "@/hooks/use-pg";
import { Building2, Plus, Edit2, Trash2, MapPin, Home, Check, X, Upload, FileText, File, Eye, Package, Users, Grid3x3, FileCheck, Award, Sparkles, Image as ImageIcon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import LocationMapPicker from "@/components/LocationMapPicker";
import ImageUploader from "@/components/ImageUploader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { api } from "@/apiClient";

interface Amenity {
  id: number;
  name: string;
  category: string;
  requiresCertificate: boolean;
  isActive: boolean;
}

export default function PGManagement() {
  const { pg: currentPg, allPgs, selectPG, createPG, updatePG, deletePG, setPrimaryPG, isLoading, isAllPgsLoading } = usePG();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPg, setSelectedPg] = useState<PG | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [isUploadingRegistration, setIsUploadingRegistration] = useState(false);
  const [isUploadingFssai, setIsUploadingFssai] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [detailsPgAmenities, setDetailsPgAmenities] = useState<Amenity[]>([]);

  const [formData, setFormData] = useState({
    pgName: "",
    pgAddress: "",
    pgLocation: "",
    latitude: "",
    longitude: "",
    imageUrl: "",
    totalRooms: "",
    pgType: "common" as "common" | "boys" | "girls",
    registrationNumber: "",
    registrationDocumentUrl: "",
    fssaiCertificateUrl: "",
    amenityIds: [] as number[],
  });

  // Fetch amenities on mount
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const response = await api.get("/api/amenities");
        setAmenities(response.data.filter((a: Amenity) => a.isActive));
      } catch (error: any) {
        console.error("Failed to fetch amenities:", error);
        toast.error(error.response?.data?.error || "Failed to load amenities");
      }
    };
    fetchAmenities();
  }, []);

  const resetForm = () => {
    setFormData({
      pgName: "",
      pgAddress: "",
      pgLocation: "",
      latitude: "",
      longitude: "",
      imageUrl: "",
      totalRooms: "",
      pgType: "common" as "common" | "boys" | "girls",
      registrationNumber: "",
      registrationDocumentUrl: "",
      fssaiCertificateUrl: "",
      amenityIds: [],
    });
  };

  const handleRegistrationDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF and image files are allowed");
      return;
    }

    setIsUploadingRegistration(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/api/pg/upload-registration-document", formData);

      const data = response.data;
      setFormData((prev) => ({ ...prev, registrationDocumentUrl: data.url }));
      toast.success("Registration document uploaded successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to upload registration document");
    } finally {
      setIsUploadingRegistration(false);
    }
  };

  const handleFssaiCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF and image files are allowed");
      return;
    }

    setIsUploadingFssai(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/api/pg/upload-fssai-certificate", formData);

      const data = response.data;
      setFormData((prev) => ({ ...prev, fssaiCertificateUrl: data.url }));
      toast.success("FSSAI certificate uploaded successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to upload FSSAI certificate");
    } finally {
      setIsUploadingFssai(false);
    }
  };

  const toggleAmenity = (amenityId: number) => {
    setFormData((prev) => {
      const newAmenityIds = prev.amenityIds.includes(amenityId)
        ? prev.amenityIds.filter((id) => id !== amenityId)
        : [...prev.amenityIds, amenityId];
      
      return {
        ...prev,
        amenityIds: newAmenityIds
      };
    });
  };

  const selectedFoodAmenities = amenities.filter(
    (a) => a.requiresCertificate && formData.amenityIds.includes(a.id)
  );

  const openDetailsDialog = async (pg: PG) => {
    setSelectedPg(pg);
    
    // Fetch amenities for this PG
    try {
      const response = await api.get(`/api/pg/${pg.id}/amenities`);
      const pgAmenities = response.data;
      const amenityIds = pgAmenities.map((a: any) => a.amenityId);
      const selectedAmenities = amenities.filter(a => amenityIds.includes(a.id));
      setDetailsPgAmenities(selectedAmenities);
    } catch (error: any) {
      console.error("Failed to fetch PG amenities:", error);
      toast.error(error.response?.data?.error || "Failed to load PG amenities");
      setDetailsPgAmenities([]);
    }
    
    setIsDetailsDialogOpen(true);
  };

  const handleAddPG = async () => {
    if (!formData.pgName || !formData.pgAddress || !formData.pgLocation) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPG({
        pgName: formData.pgName,
        pgAddress: formData.pgAddress,
        pgLocation: formData.pgLocation,
        latitude: formData.latitude,
        longitude: formData.longitude,
        imageUrl: formData.imageUrl,
        totalRooms: formData.totalRooms ? parseInt(formData.totalRooms) : 0,
        pgType: formData.pgType,
        registrationNumber: formData.registrationNumber,
        registrationDocumentUrl: formData.registrationDocumentUrl,
        fssaiCertificateUrl: formData.fssaiCertificateUrl,
        amenityIds: formData.amenityIds,
      });
      toast.success("PG created successfully!");
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to create PG");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPG = async () => {
    if (!selectedPg) return;
    if (!formData.pgName || !formData.pgAddress || !formData.pgLocation) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePG(selectedPg.id, {
        pgName: formData.pgName,
        pgAddress: formData.pgAddress,
        pgLocation: formData.pgLocation,
        latitude: formData.latitude,
        longitude: formData.longitude,
        imageUrl: formData.imageUrl,
        totalRooms: formData.totalRooms ? parseInt(formData.totalRooms) : 0,
        pgType: formData.pgType,
        registrationNumber: formData.registrationNumber,
        registrationDocumentUrl: formData.registrationDocumentUrl,
        fssaiCertificateUrl: formData.fssaiCertificateUrl,
        amenityIds: formData.amenityIds,
      });
      toast.success("PG updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedPg(null);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to update PG");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePG = async () => {
    if (!selectedPg) return;

    setIsSubmitting(true);
    try {
      await deletePG(selectedPg.id);
      toast.success("PG deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedPg(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete PG");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = async (pg: PG) => {
    setSelectedPg(pg);
    
    // Fetch current amenities for this PG
    let currentAmenityIds: number[] = [];
    try {
      const response = await api.get(`/api/pg/${pg.id}/amenities`);
      const amenities = response.data;
      currentAmenityIds = amenities.map((a: any) => a.amenityId);
    } catch (error: any) {
      console.error("Failed to fetch PG amenities:", error);
      toast.error(error.response?.data?.error || "Failed to load PG amenities");
    }
    
    setFormData({
      pgName: pg.pgName,
      pgAddress: pg.pgAddress || "",
      pgLocation: pg.pgLocation || "",
      latitude: pg.latitude || "",
      longitude: pg.longitude || "",
      imageUrl: pg.imageUrl || "",
      totalRooms: pg.totalRooms?.toString() || "",
      pgType: ((pg as any).pgType || "common") as "common" | "boys" | "girls",
      registrationNumber: (pg as any).registrationNumber || "",
      registrationDocumentUrl: (pg as any).registrationDocumentUrl || "",
      fssaiCertificateUrl: (pg as any).fssaiCertificateUrl || "",
      amenityIds: currentAmenityIds,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (pg: PG) => {
    setSelectedPg(pg);
    setIsDeleteDialogOpen(true);
  };

  const handleSelectPG = async (pg: PG) => {
    if (pg.id === currentPg?.id) return;
    
    try {
      await selectPG(pg.id);
      toast.success(`Switched to ${pg.pgName}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || "Failed to switch PG");
    }
  };

  if (isLoading || isAllPgsLoading) {
    return (
      <DesktopLayout title="My PGs" showNav>
        <div className="flex items-center justify-center min-h-[calc(100dvh-8rem)] sm:min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-muted-foreground text-sm">Loading properties...</p>
          </div>
        </div>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout title="My PGs" showNav>
      {/* Hero Section with Gradient */}
      <div className="relative -mx-4 -mt-4 mb-4 lg:-mx-6 lg:-mt-6 sm:mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative px-4 py-6 sm:px-8 sm:py-10 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">My PG Properties</h2>
              <p className="text-white/80 text-sm">Manage all your properties in one place</p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
              className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white transition-all duration-300 w-full sm:w-auto"
              data-testid="button-add-new-pg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New PG
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-0 sm:max-w-4xl sm:mx-auto">

      {allPgs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first PG property to start managing tenants and rooms
          </p>
          <Button
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            data-testid="button-add-first-property"
          >
            <Plus className="h-4 w-4" />
            Add Your First PG
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 pb-4">
          {allPgs.map((pg) => (
            <div 
              key={pg.id} 
              className={cn(
                "group relative overflow-hidden rounded-xl transition-all duration-300 p-4 sm:p-6",
                "bg-gradient-to-r from-white to-gray-50",
                pg.id === currentPg?.id 
                  ? "border-2 border-purple-300 shadow-xl hover:shadow-2xl bg-gradient-to-r from-purple-50 to-blue-50" 
                  : "border-2 border-transparent hover:border-purple-200 shadow-sm hover:shadow-xl hover:from-purple-50 hover:to-blue-50"
              )}
              data-testid={`card-pg-${pg.id}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div className={cn(
                    "rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 h-12 w-12 sm:h-14 sm:w-14",
                    pg.id === currentPg?.id 
                      ? "bg-gradient-to-br from-purple-500 to-blue-600" 
                      : "bg-gradient-to-br from-gray-400 to-gray-500"
                  )}>
                    <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-base sm:text-xl font-bold text-foreground truncate">{pg.pgName}</h3>
                      {pg.id === currentPg?.id && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-100 to-green-100 text-green-700">
                          Active
                        </span>
                      )}
                      {pg.isPrimary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700">
                          <Star className="h-3 w-3 fill-amber-600" />
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{pg.pgLocation}</span>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons - stack on mobile */}
                <div className="flex flex-wrap gap-2 sm:items-center">
                  {!pg.isPrimary && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await setPrimaryPG(pg.id);
                          toast.success(`${pg.pgName} set as primary PG`);
                        } catch (error) {
                          toast.error("Failed to set primary PG");
                        }
                      }}
                      className="gap-1 hover:bg-amber-50 hover:border-amber-300 text-xs sm:text-sm"
                      data-testid={`button-set-primary-${pg.id}`}
                    >
                      <Star className="h-3.5 w-3.5" />
                      <span className="sm:hidden">Primary</span>
                      <span className="hidden sm:inline">Set as Primary</span>
                    </Button>
                  )}
                  {pg.id !== currentPg?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectPG(pg)}
                      className="gap-1 hover:bg-purple-50 hover:border-purple-300 text-xs sm:text-sm"
                      data-testid={`button-select-pg-${pg.id}`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Select
                    </Button>
                  )}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDetailsDialog(pg)}
                      className="hover:bg-blue-100 h-8 w-8"
                      title="View Details"
                      data-testid={`button-view-details-pg-${pg.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(pg)}
                      className="hover:bg-purple-100 h-8 w-8"
                      data-testid={`button-edit-pg-${pg.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-red-50 h-8 w-8"
                      onClick={() => openDeleteDialog(pg)}
                      disabled={allPgs.length === 1}
                      data-testid={`button-delete-pg-${pg.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 sm:gap-4 text-sm pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <Home className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Rooms</p>
                    <p className="font-bold text-foreground">{pg.totalRooms || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium text-sm text-foreground truncate">{pg.pgAddress}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add PG Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[480px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add New PG
            </DialogTitle>
            <DialogDescription>
              Create a new PG property with complete details and amenities.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3 max-h-[65vh] overflow-y-auto pr-2">
            <LocationMapPicker 
              onLocationSelect={(location) => {
                setFormData(prev => ({
                  ...prev,
                  pgAddress: location.address,
                  pgLocation: location.city,
                  latitude: location.lat,
                  longitude: location.lon
                }));
              }}
              selectedLocation={{
                address: formData.pgAddress,
                city: formData.pgLocation,
                lat: formData.latitude,
                lon: formData.longitude
              }}
            />
            
            <ImageUploader 
              onImageSelect={(base64Image) => {
                setFormData(prev => ({
                  ...prev,
                  imageUrl: base64Image
                }));
              }}
              currentImage={formData.imageUrl}
              label="PG Image (Optional)"
            />

            <div className="h-px bg-border my-2" />

            <div className="space-y-2.5">

              <div className="space-y-2">
                <Label htmlFor="pgName" className="flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5" />
                  PG Name
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pgName"
                  placeholder="e.g., Sunshine PG, Green Valley Hostel"
                  className="h-10"
                  value={formData.pgName}
                  onChange={(e) => setFormData({ ...formData, pgName: e.target.value })}
                  data-testid="input-pg-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label htmlFor="totalRooms" className="text-xs">
                    Total Rooms
                  </Label>
                  <Input
                    id="totalRooms"
                    type="number"
                    placeholder="10"
                    className="h-9"
                    value={formData.totalRooms}
                    onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })}
                    data-testid="input-pg-rooms"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pgType" className="text-xs">
                    PG Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.pgType}
                    onValueChange={(value: "common" | "boys" | "girls") => 
                      setFormData({ ...formData, pgType: value })
                    }
                  >
                    <SelectTrigger id="pgType" className="h-9" data-testid="select-pg-type">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="boys">Boys Only</SelectItem>
                      <SelectItem value="girls">Girls Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="registrationNumber" className="text-xs">
                  Registration Number
                </Label>
                <Input
                  id="registrationNumber"
                  placeholder="e.g., REG123456789"
                  className="h-9"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  data-testid="input-registration-number"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Registration Document</Label>
                <div className="p-2 bg-muted/30 border border-dashed rounded-md">
                  <input
                    id="registrationDocument"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleRegistrationDocumentUpload}
                    className="hidden"
                    data-testid="input-registration-document"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={formData.registrationDocumentUrl ? "secondary" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => document.getElementById('registrationDocument')?.click()}
                      disabled={isUploadingRegistration}
                      data-testid="button-upload-registration"
                    >
                      <Upload className="h-3.5 w-3.5 mr-2" />
                      {isUploadingRegistration ? "Uploading..." : formData.registrationDocumentUrl ? "Change" : "Upload"}
                    </Button>
                    {formData.registrationDocumentUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(formData.registrationDocumentUrl, '_blank')}
                        data-testid="button-view-registration"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {formData.registrationDocumentUrl && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-600" />
                      Document uploaded
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-border my-2" />

            <div className="space-y-2.5">
              <Label className="text-xs">Amenities</Label>

              <Card className="p-3 bg-card border">
                <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2">
                  {amenities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No amenities available</p>
                  ) : (
                    <div className="grid gap-2">
                      {amenities.map((amenity) => (
                        <Card 
                          key={amenity.id}
                          className={cn(
                            "p-2.5 cursor-pointer transition-all",
                            formData.amenityIds.includes(amenity.id)
                              ? "bg-primary/5 border-primary/30"
                              : "bg-background hover:bg-muted/50"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAmenity(amenity.id);
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <Checkbox
                              checked={formData.amenityIds.includes(amenity.id)}
                              data-testid={`checkbox-amenity-${amenity.id}`}
                              className="pointer-events-none"
                            />
                            <div className="text-sm font-medium leading-none flex-1 flex items-center gap-2">
                              {amenity.name}
                              {amenity.requiresCertificate && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200">
                                  FSSAI
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {formData.amenityIds.length > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-600" />
                  {formData.amenityIds.length} selected
                </p>
              )}
            </div>

            {/* FSSAI Certificate */}
            {selectedFoodAmenities.length > 0 && (
              <>
                <div className="h-px bg-border" />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Award className="h-4 w-4 text-primary" />
                    <span>FSSAI Certificate</span>
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Required for: {selectedFoodAmenities.map(a => a.name).join(', ')}
                  </p>

                  <Card className="p-3 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50">
                    <input
                      id="fssaiCertificate"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFssaiCertificateUpload}
                      className="hidden"
                      data-testid="input-fssai-certificate"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={formData.fssaiCertificateUrl ? "secondary" : "default"}
                        size="sm"
                        className="flex-1"
                        onClick={() => document.getElementById('fssaiCertificate')?.click()}
                        disabled={isUploadingFssai}
                        data-testid="button-upload-fssai"
                      >
                        <Upload className="h-3.5 w-3.5 mr-2" />
                        {isUploadingFssai ? "Uploading..." : formData.fssaiCertificateUrl ? "Change" : "Upload"}
                      </Button>
                      {formData.fssaiCertificateUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(formData.fssaiCertificateUrl, '_blank')}
                          data-testid="button-view-fssai"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {formData.fssaiCertificateUrl && (
                      <p className="text-xs text-green-700 dark:text-green-400 mt-2 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Certificate uploaded
                      </p>
                    )}
                  </Card>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPG} disabled={isSubmitting} data-testid="button-submit-add-pg">
              <Plus className="h-4 w-4 mr-2" />
              {isSubmitting ? "Creating..." : "Add PG"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit PG Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[480px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" />
              Edit PG
            </DialogTitle>
            <DialogDescription>
              Update your PG property details and amenities.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3 max-h-[65vh] overflow-y-auto pr-2">
            {/* Location & Image Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Location & Images</span>
              </div>
              
              <LocationMapPicker 
                onLocationSelect={(location) => {
                  setFormData(prev => ({
                    ...prev,
                    pgAddress: location.address,
                    pgLocation: location.city,
                    latitude: location.lat,
                    longitude: location.lon
                  }));
                }}
                selectedLocation={{
                  address: formData.pgAddress,
                  city: formData.pgLocation,
                  lat: formData.latitude,
                  lon: formData.longitude
                }}
              />
              
              <ImageUploader 
                onImageSelect={(base64Image) => {
                  setFormData(prev => ({
                    ...prev,
                    imageUrl: base64Image
                  }));
                }}
                currentImage={formData.imageUrl}
                label="PG Image (Optional)"
              />
            </div>

            <div className="h-px bg-border" />

            {/* Basic Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="h-4 w-4 text-primary" />
                <span>Basic Information</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-pgName" className="flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5" />
                  PG Name
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-pgName"
                  placeholder="e.g., Sunshine PG, Green Valley Hostel"
                  className="h-10"
                  value={formData.pgName}
                  onChange={(e) => setFormData({ ...formData, pgName: e.target.value })}
                  data-testid="input-edit-pg-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-totalRooms" className="flex items-center gap-1.5 text-xs">
                    <Grid3x3 className="h-3.5 w-3.5" />
                    Total Rooms
                  </Label>
                  <Input
                    id="edit-totalRooms"
                    type="number"
                    placeholder="e.g., 10"
                    className="h-10"
                    value={formData.totalRooms}
                    onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })}
                    data-testid="input-edit-pg-rooms"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-pgType" className="flex items-center gap-1.5 text-xs">
                    <Users className="h-3.5 w-3.5" />
                    PG Type
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.pgType}
                    onValueChange={(value: "common" | "boys" | "girls") => 
                      setFormData({ ...formData, pgType: value })
                    }
                  >
                    <SelectTrigger id="edit-pgType" className="h-10" data-testid="select-edit-pg-type">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="boys">Boys Only</SelectItem>
                      <SelectItem value="girls">Girls Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="h-px bg-border my-2" />

            <div className="space-y-2.5">
              <div className="space-y-1.5">
                <Label htmlFor="edit-registrationNumber" className="text-xs">
                  Registration Number
                </Label>
                <Input
                  id="edit-registrationNumber"
                  placeholder="e.g., REG123456789"
                  className="h-9"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  data-testid="input-edit-registration-number"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Registration Document</Label>
                <div className="p-2 bg-muted/30 border border-dashed rounded-md">
                  <input
                    id="edit-registrationDocument"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleRegistrationDocumentUpload}
                    className="hidden"
                    data-testid="input-edit-registration-document"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={formData.registrationDocumentUrl ? "secondary" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => document.getElementById('edit-registrationDocument')?.click()}
                      disabled={isUploadingRegistration}
                      data-testid="button-edit-upload-registration"
                    >
                      <Upload className="h-3.5 w-3.5 mr-2" />
                      {isUploadingRegistration ? "Uploading..." : formData.registrationDocumentUrl ? "Change" : "Upload"}
                    </Button>
                    {formData.registrationDocumentUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(formData.registrationDocumentUrl, '_blank')}
                        data-testid="button-edit-view-registration"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {formData.registrationDocumentUrl && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-600" />
                      Document uploaded
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-border my-2" />

            <div className="space-y-2.5">
              <Label className="text-xs">Amenities</Label>

              <Card className="p-3 bg-card border">
                <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2">
                  {amenities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No amenities available</p>
                  ) : (
                    <div className="grid gap-2">
                      {amenities.map((amenity) => (
                        <Card 
                          key={amenity.id}
                          className={cn(
                            "p-2.5 cursor-pointer transition-all",
                            formData.amenityIds.includes(amenity.id)
                              ? "bg-primary/5 border-primary/30"
                              : "bg-background hover:bg-muted/50"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAmenity(amenity.id);
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <Checkbox
                              checked={formData.amenityIds.includes(amenity.id)}
                              data-testid={`checkbox-edit-amenity-${amenity.id}`}
                              className="pointer-events-none"
                            />
                            <div className="text-sm font-medium leading-none flex-1 flex items-center gap-2">
                              {amenity.name}
                              {amenity.requiresCertificate && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200">
                                  FSSAI
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {formData.amenityIds.length > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-600" />
                  {formData.amenityIds.length} selected
                </p>
              )}
            </div>

            {/* FSSAI Certificate */}
            {selectedFoodAmenities.length > 0 && (
              <>
                <div className="h-px bg-border" />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Award className="h-4 w-4 text-primary" />
                    <span>FSSAI Certificate</span>
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Required for: {selectedFoodAmenities.map(a => a.name).join(', ')}
                  </p>

                  <Card className="p-3 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50">
                    <input
                      id="edit-fssaiCertificate"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFssaiCertificateUpload}
                      className="hidden"
                      data-testid="input-edit-fssai-certificate"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={formData.fssaiCertificateUrl ? "secondary" : "default"}
                        size="sm"
                        className="flex-1"
                        onClick={() => document.getElementById('edit-fssaiCertificate')?.click()}
                        disabled={isUploadingFssai}
                        data-testid="button-edit-upload-fssai"
                      >
                        <Upload className="h-3.5 w-3.5 mr-2" />
                        {isUploadingFssai ? "Uploading..." : formData.fssaiCertificateUrl ? "Change" : "Upload"}
                      </Button>
                      {formData.fssaiCertificateUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(formData.fssaiCertificateUrl, '_blank')}
                          data-testid="button-edit-view-fssai"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {formData.fssaiCertificateUrl && (
                      <p className="text-xs text-green-700 dark:text-green-400 mt-2 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Certificate uploaded
                      </p>
                    )}
                  </Card>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPG} disabled={isSubmitting} data-testid="button-submit-edit-pg">
              <Check className="h-4 w-4 mr-2" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete PG Property?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedPg?.pgName}"? This action cannot be undone and will remove all associated data including tenants, rooms, and payment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePG}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
              data-testid="button-confirm-delete-pg"
            >
              {isSubmitting ? "Deleting..." : "Delete PG"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PG Details Dialog (Owner View) */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PG Details</DialogTitle>
            <DialogDescription>
              Complete information about your property
            </DialogDescription>
          </DialogHeader>
          {selectedPg && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{selectedPg.pgName}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {selectedPg.pgAddress || "No address provided"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Total Rooms:</span>
                  <span className="ml-2 font-semibold">{selectedPg.totalRooms}</span>
                </div>
              </div>

              {/* Registration Details */}
              {(selectedPg.registrationNumber || selectedPg.registrationDocumentUrl) && (
                <div className="p-4 rounded-lg border space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Registration Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedPg.registrationNumber && (
                      <div>
                        <span className="text-muted-foreground">Registration Number:</span>
                        <span className="ml-2 font-medium">{selectedPg.registrationNumber}</span>
                      </div>
                    )}
                    {selectedPg.registrationDocumentUrl && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Registration Document:</span>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => window.open(selectedPg.registrationDocumentUrl, '_blank')}
                          data-testid="button-view-registration-doc"
                        >
                          View Document
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FSSAI Certificate */}
              {selectedPg.fssaiCertificateUrl && (
                <div className="p-4 rounded-lg border space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <File className="h-4 w-4" />
                    FSSAI Certificate
                  </h4>
                  <div className="flex items-center gap-2 text-sm">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Certificate:</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => window.open(selectedPg.fssaiCertificateUrl, '_blank')}
                      data-testid="button-view-fssai-cert"
                    >
                      View Certificate
                    </Button>
                  </div>
                </div>
              )}

              {/* Amenities */}
              {detailsPgAmenities.length > 0 && (
                <div className="p-4 rounded-lg border space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Amenities ({detailsPgAmenities.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {detailsPgAmenities.map((amenity) => (
                      <div
                        key={amenity.id}
                        className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
                      >
                        {amenity.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </DesktopLayout>
  );
}
