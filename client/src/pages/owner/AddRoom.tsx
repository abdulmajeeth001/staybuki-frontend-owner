import MobileLayout from "@/components/layout/MobileLayout";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, Wind, Bath, Users, MapPin, Plus, X, Bed } from "lucide-react";
import { BedPositionEditor } from "@/components/BedPositionEditor";
import { ownerService } from "@/services/ownerService";
import type { TenantResponse, BulkBedRequest } from "@/types/owner";
import { cn } from "@/lib/utils";

// Static options moved outside component to prevent recreation on every render
const AMENITIES_OPTIONS = ["WiFi", "Water", "Power"];

export default function AddRoom() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [, setLocation] = useLocation();
  
  // --- State Management ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [isFetchingTenants, setIsFetchingTenants] = useState(true);
  const [beds, setBeds] = useState<Array<{ id?: number; position: string; displayOrder: number; status?: string }>>([]);
  
  const [formData, setFormData] = useState({
    roomNumber: "",
    monthlyRent: "",
    advanceAmount: "",
    sharing: "1",
    floor: "1",
    hasAttachedBathroom: false,
    hasAC: false,
    tenantIds: [] as number[],
    amenities: [] as string[],
  });

  // --- Effects ---
  // Fetch available tenants on component mount
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const data = await ownerService.getAvailableTenants();
        setTenants(data);
      } catch (err) {
        console.error("Error fetching tenants:", err);
      } finally {
        setIsFetchingTenants(false);
      }
    };
    fetchTenants();
  }, []);

  // --- Handlers ---
  // Memoized generic input change handler
  const handleInputChange = useCallback((field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  }, []);

  // Memoized tenant handlers to prevent unnecessary re-renders
  const addTenant = useCallback((tenantId: number) => {
    setFormData(prev => {
      if (prev.tenantIds.includes(tenantId)) return prev;
      return { ...prev, tenantIds: [...prev.tenantIds, tenantId] };
    });
    setError("");
  }, []);

  const removeTenant = useCallback((tenantId: number) => {
    setFormData(prev => ({ ...prev, tenantIds: prev.tenantIds.filter(id => id !== tenantId) }));
  }, []);

  const toggleAmenity = useCallback((amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  }, []);

  // --- Derived State ---
  // Memoized derived calculations for optimized rendering
  const sharingNum = useMemo(() => parseInt(formData.sharing) || 1, [formData.sharing]);

  const { selectedTenants, availableTenants, canAddMore } = useMemo(() => {
    const selected = formData.tenantIds
      .map(id => tenants.find(t => t.id === id))
      .filter(Boolean) as TenantResponse[];
    const available = tenants.filter(t => t.id !== undefined && !formData.tenantIds.includes(t.id));
    const canAdd = formData.tenantIds.length < sharingNum;
    
    return { selectedTenants: selected, availableTenants: available, canAddMore: canAdd };
  }, [formData.tenantIds, tenants, sharingNum]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.roomNumber || !formData.monthlyRent) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.tenantIds.length > sharingNum) {
      setError(`Cannot assign more than ${sharingNum} tenants to this room`);
      return;
    }

    setIsLoading(true);
    try {
      const newRoom = await ownerService.createRoom({
        roomNumber: formData.roomNumber,
        monthlyRent: parseFloat(formData.monthlyRent),
        advanceAmount: formData.advanceAmount ? parseFloat(formData.advanceAmount) : undefined,
        sharing: sharingNum,
        floor: parseInt(formData.floor),
        hasAttachedBathroom: formData.hasAttachedBathroom,
        hasAC: formData.hasAC,
        tenantIds: formData.tenantIds.length > 0 ? formData.tenantIds : undefined,
        amenities: formData.amenities,
      });

      // Create bed positions if any
      if (beds.length > 0 && newRoom.id) {
        const bulkBedRequest: BulkBedRequest = {
          beds: beds.map((bed) => ({
            position: bed.position,
            displayOrder: bed.displayOrder,
            status: bed.status?.toUpperCase() as "AVAILABLE" | "OCCUPIED" | "RESERVED" | "SERVING_NOTICE" | undefined,
          })),
        };
        await ownerService.bulkCreateBeds(newRoom.id!, bulkBedRequest);
      }

      setLocation("/rooms");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to add room");
      setIsLoading(false);
    }
  }, [formData, sharingNum, beds, setLocation]);

  return (
    <Layout title="Add Room" showNav={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 py-4 sm:px-6 shadow-sm">
          <div className="flex items-center gap-4 max-w-3xl mx-auto">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setLocation("/rooms")}
              className="h-10 w-10 rounded-xl border-2 hover:bg-slate-100 transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">Add New Room</h1>
              <p className="text-sm text-slate-500 font-medium">Configure room details and capacities</p>
            </div>
          </div>

          {error && (
            <div className="max-w-3xl mx-auto mt-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-200 shadow-sm" data-testid="error-message">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 sm:p-6 space-y-8 relative">
          {/* Basic Information Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300 p-6 sm:p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Basic Information</h2>
                  <p className="text-sm text-slate-500 font-medium">Room identification and pricing</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="roomNumber" className="text-slate-700 font-medium">Room Number *</Label>
                  <Input
                    id="roomNumber"
                    placeholder="e.g., 101"
                    value={formData.roomNumber}
                    onChange={(e) => handleInputChange("roomNumber", e.target.value)}
                    required
                    data-testid="input-room-number"
                    className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors"
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
                    required
                    data-testid="input-floor"
                    className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent" className="text-slate-700 font-medium">Monthly Rent (₹) *</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    placeholder="e.g., 5000"
                    value={formData.monthlyRent}
                    onChange={(e) => handleInputChange("monthlyRent", e.target.value)}
                    required
                    data-testid="input-monthly-rent"
                    className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advanceAmount" className="text-slate-700 font-medium">Advance Amount (₹)</Label>
                  <Input
                    id="advanceAmount"
                    type="number"
                    placeholder="e.g., 10000"
                    value={formData.advanceAmount}
                    onChange={(e) => handleInputChange("advanceAmount", e.target.value)}
                    data-testid="input-advance-amount"
                    className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors text-lg font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Room Configuration Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300 p-6 sm:p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md shadow-purple-200 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Room Configuration</h2>
                  <p className="text-sm text-slate-500 font-medium">Set sharing capacity</p>
                </div>
              </div>

              {/* Sharing Type */}
              <div className="space-y-3">
                <Label htmlFor="sharing" className="text-slate-700 font-medium">Number of Sharing *</Label>
                <select
                  id="sharing"
                  value={formData.sharing}
                  onChange={(e) => handleInputChange("sharing", e.target.value)}
                  className="w-full px-4 border border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors text-slate-900 h-12 font-medium appearance-none"
                  data-testid="select-sharing"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num}-Sharing</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 font-medium">Can add up to {sharingNum} tenants to this room</p>
              </div>
            </div>
          </div>

          {/* Bed Positions Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300 p-6 sm:p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-110 transition-transform duration-300">
                  <Bed className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Bed Layout</h2>
                  <p className="text-sm text-slate-500 font-medium">Define specific bed positions for tenants</p>
                </div>
              </div>
              <BedPositionEditor
                sharing={sharingNum}
                beds={beds}
                onBedsChange={setBeds}
                readOnly={false}
              />
            </div>
          </div>

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

              {/* Selected Tenants */}
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

              {/* Add Tenant */}
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

              {/* Bathroom Type */}
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

              {/* AC */}
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

              {/* Amenities Checklist */}
              <div className="space-y-3 pt-4">
                <Label className="text-slate-700 font-medium">Available Amenities</Label>
                <div className="space-y-3">
                  {AMENITIES_OPTIONS.map((amenity) => (
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
            <Button 
              type="button"
              variant="outline" 
              className="flex-1 h-14 rounded-xl font-semibold border-2 hover:bg-slate-100 transition-colors shadow-sm bg-white/80 backdrop-blur-sm"
              onClick={() => setLocation("/rooms")}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-14 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5"
              disabled={isLoading} 
              data-testid="button-add-room-submit"
            >
              {isLoading ? "Creating Room..." : "Create Room"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
