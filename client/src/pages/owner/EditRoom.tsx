import MobileLayout from "@/components/layout/MobileLayout";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { ChevronLeft, Wind, Bath, Users, MapPin, X, Plus, Edit2, Bed } from "lucide-react";
import { BedPositionEditor } from "@/components/BedPositionEditor";
import { useQueryClient } from "@tanstack/react-query";
import { ownerService } from "@/services/ownerService";
import type { TenantResponse, BedResponse } from "@/types/owner";
import { cn } from "@/lib/utils";

export default function EditRoom() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [beds, setBeds] = useState<Array<Partial<BedResponse> & { position: string; displayOrder: number; status?: string; tenantId?: number | null }>>([]);
  const [initialBeds, setInitialBeds] = useState<Array<Partial<BedResponse> & { position: string; displayOrder: number; status?: string; tenantId?: number | null }>>([]);
  
  const [formData, setFormData] = useState({
    roomNumber: "",
    monthlyRent: "",
    sharing: "1",
    floor: "1",
    hasAttachedBathroom: false,
    hasAC: false,
    tenantIds: [] as number[],
    amenities: [] as string[],
  });

  const amenitiesOptions = ["WiFi", "Water", "Power"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roomId = parseInt(id || "0");
        const [roomData, allTenantsData, bedsData] = await Promise.all([
          ownerService.getRoomById(roomId),
          ownerService.getAllTenants(),
          ownerService.getBedsByRoom(roomId)
        ]);

        setFormData({
          roomNumber: roomData.roomNumber || "",
          monthlyRent: String(roomData.monthlyRent),
          sharing: roomData.sharing?.toString() || "1",
          floor: roomData.floor?.toString() || "1",
          hasAttachedBathroom: roomData.hasAttachedBathroom || false,
          hasAC: roomData.hasAC || false,
          tenantIds: Array.isArray(roomData.tenantIds) ? roomData.tenantIds : [],
          amenities: roomData.amenities || [],
        });

        setTenants(allTenantsData);
        const formattedBeds = bedsData.map((bed) => ({
          ...bed,
          position: bed.position || "",
          displayOrder: bed.displayOrder || 0,
        }));
        setBeds(formattedBeds);
        setInitialBeds(formattedBeds);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [id]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsEditing(true);
    setError("");
  };

  const addTenant = (tenantId: number) => {
    if (!formData.tenantIds.includes(tenantId)) {
      handleInputChange("tenantIds", [...formData.tenantIds, tenantId]);
    }
  };

  const removeTenant = (tenantId: number) => {
    handleInputChange("tenantIds", formData.tenantIds.filter(id => id !== tenantId));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.roomNumber || !formData.monthlyRent) {
      setError("Please fill in all required fields");
      return;
    }

    const sharingNum = parseInt(formData.sharing);
    if (formData.tenantIds.length > sharingNum) {
      setError(`Cannot assign more than ${sharingNum} tenants to this room`);
      return;
    }

    setIsLoading(true);
    try {
      const roomId = parseInt(id || "0");
      await ownerService.updateRoom(roomId, {
        roomNumber: formData.roomNumber,
        monthlyRent: parseFloat(formData.monthlyRent),
        sharing: sharingNum,
        floor: parseInt(formData.floor),
        hasAttachedBathroom: formData.hasAttachedBathroom,
        hasAC: formData.hasAC,
        tenantIds: formData.tenantIds.length > 0 ? formData.tenantIds : undefined,
        amenities: formData.amenities,
      } as any);

      // Synchronize bed positions (Create, Update, Delete)
      const currentBedIds = beds.filter((b) => b.id).map((b) => b.id);
      const bedsToDelete = initialBeds.filter((b) => b.id && !currentBedIds.includes(b.id));
      const bedsToUpdate = beds.filter((b) => {
        if (!b.id) return false;
        const initial = initialBeds.find((ib) => ib.id === b.id);
        if (!initial) return false;
        return (
          initial.position !== b.position ||
          initial.displayOrder !== b.displayOrder ||
          initial.status !== b.status
        );
      });
      const bedsToCreate = beds.filter((b) => !b.id);

      const apiCalls: Promise<any>[] = [];

      // 1. Queue deletions
      bedsToDelete.forEach((bed) => {
        if (bed.id) apiCalls.push(ownerService.deleteBed(bed.id));
      });

      // 2. Queue updates
      bedsToUpdate.forEach((bed) => {
        if (bed.id) {
          apiCalls.push(ownerService.updateBed(bed.id, {
            position: bed.position,
            displayOrder: bed.displayOrder,
            status: bed.status?.toUpperCase() || "AVAILABLE",
          }));
        }
      });

      // 3. Queue creations
      if (bedsToCreate.length > 0) {
        const bulkBedRequest = {
          beds: bedsToCreate.map((bed) => ({
            position: bed.position,
            displayOrder: bed.displayOrder,
            status: bed.status?.toUpperCase() || "AVAILABLE",
          })),
        };
        apiCalls.push(ownerService.bulkUpdateBeds(roomId, bulkBedRequest as any));
      }

      // Execute all pending changes concurrently
      if (apiCalls.length > 0) {
        await Promise.all(apiCalls);
      }

      setLocation("/rooms");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to update room");
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Layout title="Edit Room" showNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const selectedTenants = formData.tenantIds.map(id => tenants.find(t => t.id === id)).filter(Boolean) as TenantResponse[];
  const availableTenants = tenants.filter(t => !formData.tenantIds.includes(t.id) && !t.roomId);
  const sharingNum = parseInt(formData.sharing);
  const canAddMore = formData.tenantIds.length < sharingNum;

  return (
    <Layout title="Edit Room" showNav={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/rooms")}
              className="h-10 w-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">Edit Room</h1>
              <p className="text-sm text-slate-500">Manage room details and tenants</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200" data-testid="error-message">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-6">
          {/* Basic Information Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
              </div>
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                  data-testid="button-enter-edit-mode"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber" className="text-slate-700 font-medium">Room Number *</Label>
                <Input
                  id="roomNumber"
                  placeholder="e.g., 101"
                  value={formData.roomNumber}
                  onChange={(e) => handleInputChange("roomNumber", e.target.value)}
                  disabled={!isEditing}
                  required
                  data-testid="input-room-number"
                  className="h-11 border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor" className="text-slate-700 font-medium">Floor *</Label>
                <Input
                  id="floor"
                  type="number"
                  placeholder="e.g., 1"
                  value={formData.floor}
                  onChange={(e) => handleInputChange("floor", e.target.value)}
                  disabled={!isEditing}
                  required
                  data-testid="input-floor"
                  className="h-11 border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyRent" className="text-slate-700 font-medium">Monthly Rent (₹) *</Label>
              <Input
                id="monthlyRent"
                type="number"
                placeholder="e.g., 5000"
                value={formData.monthlyRent}
                onChange={(e) => handleInputChange("monthlyRent", e.target.value)}
                disabled={!isEditing}
                required
                data-testid="input-monthly-rent"
                className="h-11 border-slate-300 rounded-lg text-lg font-semibold disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Room Configuration Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-slate-900">Room Configuration</h2>
            </div>

            <div className="space-y-3">
              <Label htmlFor="sharing" className="text-slate-700 font-medium">Number of Sharing *</Label>
              <select
                id="sharing"
                value={formData.sharing}
                onChange={(e) => handleInputChange("sharing", e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 h-11 font-medium disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                data-testid="select-sharing"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num}-Sharing</option>
                ))}
              </select>
              <p className="text-xs text-slate-500">Can add up to {sharingNum} tenants to this room</p>
            </div>
          </div>

          {/* Bed Positions Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-4">
              <Bed className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-900">Bed Positions</h2>
            </div>
            <p className="text-sm text-slate-500 -mt-2 mb-3">
              Define specific bed positions to help tenants choose their preferred spot
            </p>
            <BedPositionEditor
              roomId={parseInt(id || "0")}
              sharing={sharingNum}
              beds={beds}
              onBedsChange={setBeds}
              readOnly={!isEditing}
              showOccupancy={true}
            />
          </div>

          {/* Bed Assignment Section */}
          {beds.length > 0 && selectedTenants.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <Bed className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900">Assign Beds to Tenants</h2>
              </div>
              <p className="text-sm text-slate-500 -mt-2 mb-3">
                Assign specific bed positions to each tenant in this room
              </p>
              
              <div className="space-y-3">
                {beds.map((bed) => {
                  const assignedTenant = selectedTenants.find(t => t.id === bed.tenantId);
                  return (
                    <div key={bed.id || bed.position} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Bed className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{bed.position}</p>
                            <p className="text-xs text-slate-500">
                              {bed.status?.toLowerCase() === "occupied" ? "Occupied" : "Available"}
                            </p>
                          </div>
                        </div>
                        
                        <select
                          value={bed.tenantId?.toString() || ""}
                          onChange={async (e) => {
                            const newTenantId = e.target.value ? parseInt(e.target.value) : null;
                            const bedId = bed.id;
                            
                            if (!bedId) return;
                            
                            try {
                              if (newTenantId) {
                                // Capture previous tenant before reassignment
                                const previousTenantId = bed.tenantId;
                                
                                // Assign tenant to bed
                                await ownerService.assignBed(bedId, { tenantId: newTenantId });
                                
                                // Update local state
                                setBeds(beds.map(b => 
                                  b.id === bedId ? { ...b, tenantId: newTenantId, status: "OCCUPIED" } as any : b
                                ));
                                // Invalidate queries for newly assigned tenant
                                queryClient.invalidateQueries({ queryKey: ["tenant", newTenantId] });
                                // Invalidate queries for previously assigned tenant (if any)
                                if (previousTenantId) {
                                  queryClient.invalidateQueries({ queryKey: ["tenant", previousTenantId] });
                                }
                                // Invalidate tenant list
                                queryClient.invalidateQueries({ queryKey: ["tenants"] });
                                // Invalidate room and bed queries so Edit Tenant shows fresh bed data
                                queryClient.invalidateQueries({ queryKey: ["rooms"] });
                                queryClient.invalidateQueries({ queryKey: ["room-beds", parseInt(id || "0")] });
                                } else {
                                  // Vacate bed - need to know which tenant was unassigned
                                  const oldTenantId = bed.tenantId;
                                  await ownerService.vacateBed(bedId);
                                  
                                  // Update local state
                                  setBeds(beds.map(b => 
                                    b.id === bedId ? { ...b, tenantId: null, status: "AVAILABLE" } as any : b
                                  ));
                                  // Invalidate tenant queries if there was a tenant assigned
                                  if (oldTenantId) {
                                    queryClient.invalidateQueries({ queryKey: ["tenant", oldTenantId] });
                                    queryClient.invalidateQueries({ queryKey: ["tenants"] });
                                  }
                                  // Invalidate room and bed queries
                                  queryClient.invalidateQueries({ queryKey: ["rooms"] });
                                  queryClient.invalidateQueries({ queryKey: ["room-beds", parseInt(id || "0")] });
                                }
                              } catch (err) {
                                console.error("Error updating bed assignment:", err);
                              }
                            }}
                            className="px-4 py-2 border border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-white text-slate-900 font-medium text-sm w-full sm:w-auto sm:min-w-[180px] h-11 transition-colors appearance-none"
                            data-testid={`select-bed-tenant-${bed.id}`}
                          >
                            <option value="">None</option>
                            {selectedTenants.map((tenant) => (
                              <option key={tenant.id} value={tenant.id}>
                                {tenant.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {assignedTenant && (
                          <div className="mt-3 sm:ml-13 text-xs font-bold text-green-700 bg-green-100/70 border border-green-200 px-3 py-1.5 rounded-lg inline-block">
                            Assigned to {assignedTenant.name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
          )}

          {/* Tenant Assignment Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300 p-6 sm:p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md shadow-orange-200 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Assign Tenants</h2>
                  <p className="text-sm text-slate-500 font-medium">Add residents to this room</p>
                </div>
              </div>

              {selectedTenants.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Assigned Tenants ({selectedTenants.length}/{sharingNum})</Label>
                  <div className="space-y-2">
                    {selectedTenants.map((tenant) => (
                      <div key={tenant.id} className="p-4 bg-green-50/50 rounded-xl border border-green-200 flex items-center justify-between shadow-sm">
                        <div>
                          <p className="font-bold text-slate-900">{tenant.name}</p>
                          <p className="text-sm font-medium text-slate-600">{tenant.phone}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => tenant.id !== undefined && removeTenant(tenant.id)}
                          className="text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg h-9 w-9"
                          data-testid={`button-remove-tenant-${tenant.id}`}
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canAddMore && availableTenants.length > 0 && (
                <div className="space-y-3 pt-2">
                  <Label className="text-slate-700 font-medium">Add Tenant</Label>
                  <div className="flex gap-3">
                    <select
                      id="tenantSelect"
                      className="flex-1 px-4 py-2 border border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors text-slate-900 h-12 appearance-none font-medium"
                      defaultValue=""
                      data-testid="select-available-tenant"
                    >
                      <option value="">Select a tenant...</option>
                      {availableTenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.phone})
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      onClick={() => {
                        const select = document.getElementById("tenantSelect") as HTMLSelectElement;
                        if (select.value) {
                          addTenant(parseInt(select.value));
                          select.value = "";
                        }
                      }}
                      className="gap-1 h-12 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-md"
                      data-testid="button-add-tenant"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Only shows tenants not already assigned to other rooms</p>
                </div>
              )}

              {!canAddMore && (
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 shadow-sm mt-4">
                  <p className="text-sm font-semibold text-blue-700">✓ All {sharingNum} slots are filled</p>
                </div>
              )}

              {availableTenants.length === 0 && selectedTenants.length === 0 && (
                <div className="p-4 bg-yellow-50/50 rounded-xl border border-yellow-200 shadow-sm mt-4">
                  <p className="text-sm font-semibold text-yellow-700">No available tenants (optional - you can leave this room vacant)</p>
                </div>
              )}
            </div>
          </div>

          {/* Amenities Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300 p-6 sm:p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md shadow-emerald-200 group-hover:scale-110 transition-transform duration-300">
                  <Bath className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Facilities & Amenities</h2>
                  <p className="text-sm text-slate-500 font-medium">What's included in this room</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-700 font-medium">Bathroom Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: "attached", label: "Attached Bathroom", icon: "🚿" },
                    { type: "common", label: "Common Bathroom", icon: "🛁" }
                  ].map((option) => (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => handleInputChange("hasAttachedBathroom", option.type === "attached")}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2",
                        (option.type === "attached" ? formData.hasAttachedBathroom : !formData.hasAttachedBathroom)
                          ? "border-green-500 bg-green-50/50 shadow-sm"
                          : "border-slate-200 bg-slate-50/50 hover:border-green-200 hover:bg-green-50/30"
                      )}
                      data-testid={`button-bathroom-${option.type}`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm font-bold text-slate-700">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <label 
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group",
                    formData.hasAC 
                      ? "border-blue-500 bg-blue-50/50 shadow-sm" 
                      : "border-slate-200 bg-slate-50/50 hover:border-blue-200 hover:bg-blue-50/30"
                  )}
                  onClick={(e) => { e.preventDefault(); handleInputChange("hasAC", !formData.hasAC); }}
                >
                  <input
                    type="checkbox"
                    checked={formData.hasAC}
                    className="w-5 h-5 accent-blue-600"
                    data-testid="checkbox-ac"
                    readOnly
                  />
                  <div className="flex-1">
                    <Wind className="w-5 h-5 text-blue-600 inline mr-2" />
                    <span className="font-bold text-slate-700">Air Conditioning</span>
                  </div>
                </label>
              </div>

              <div className="space-y-3 pt-4">
                <Label className="text-slate-700 font-medium">Available Amenities</Label>
                <div className="space-y-3">
                  {amenitiesOptions.map((amenity) => (
                    <label 
                      key={amenity} 
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
                        formData.amenities.includes(amenity)
                          ? "border-purple-500 bg-purple-50/50 shadow-sm"
                          : "border-slate-200 bg-slate-50/50 hover:border-purple-200 hover:bg-purple-50/30"
                      )}
                      onClick={(e) => { e.preventDefault(); toggleAmenity(amenity); }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        className="w-5 h-5 accent-purple-600"
                        data-testid={`checkbox-amenity-${amenity.toLowerCase()}`}
                        readOnly
                      />
                      <span className="font-bold text-slate-700 flex-1">{amenity}</span>
                      {formData.amenities.includes(amenity) && (
                        <span className="text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg">Selected</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 pb-12 sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-10 px-2 mt-4">
            {isEditing ? (
              <>
                <Button 
                  type="button"
                  variant="outline" 
                  className="flex-1 h-14 rounded-xl font-semibold border-2 hover:bg-slate-100 transition-colors shadow-sm bg-white/80 backdrop-blur-sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-14 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5"
                  disabled={isLoading} 
                  data-testid="button-edit-room-submit"
                >
                  {isLoading ? "Updating Room..." : "Update Room"}
                </Button>
              </>
            ) : (
              <Button 
                type="button"
                className="w-full h-14 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5"
                onClick={() => setLocation("/rooms")}
              >
                Back to Rooms
              </Button>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
}
