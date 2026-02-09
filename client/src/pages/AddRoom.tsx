import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { ChevronLeft, Wind, Bath, Users, MapPin, Plus, X, Bed } from "lucide-react";
import { BedPositionEditor } from "@/components/BedPositionEditor";
import { api } from "@/apiClient";

interface Tenant {
  id: number;
  name: string;
  phone: string;
}

export default function AddRoom() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isFetchingTenants, setIsFetchingTenants] = useState(true);
  const [beds, setBeds] = useState<Array<{ id?: number; position: string; displayOrder: number; status?: string }>>([]);
  
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
    const fetchTenants = async () => {
      try {
        const res = await api.get("/api/tenants/available-tenants");
        setTenants(res.data);
      } catch (err) {
        console.error("Error fetching tenants:", err);
      } finally {
        setIsFetchingTenants(false);
      }
    };
    fetchTenants();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      const res = await api.post("/api/rooms", {
        roomNumber: formData.roomNumber,
        monthlyRent: formData.monthlyRent,
        sharing: sharingNum,
        floor: parseInt(formData.floor),
        hasAttachedBathroom: formData.hasAttachedBathroom,
        hasAC: formData.hasAC,
        tenantIds: formData.tenantIds.length > 0 ? formData.tenantIds : null,
        amenities: formData.amenities,
      });

      const newRoom = res.data;

      // Create bed positions if any
      if (beds.length > 0 && newRoom.id) {
        await api.post(`/api/rooms/${newRoom.id}/beds/bulk`, { beds });
      }

      setLocation("/rooms");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to add room");
      setIsLoading(false);
    }
  };

  const selectedTenants = formData.tenantIds.map(id => tenants.find(t => t.id === id)).filter(Boolean) as Tenant[];
  const availableTenants = tenants.filter(t => !formData.tenantIds.includes(t.id));
  const sharingNum = parseInt(formData.sharing);
  const canAddMore = formData.tenantIds.length < sharingNum;

  return (
    <MobileLayout title="Add Room" showNav={false}>
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
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Add New Room</h1>
              <p className="text-sm text-slate-500">Create a new room in your hostel</p>
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
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber" className="text-slate-700 font-medium">Room Number *</Label>
                <Input
                  id="roomNumber"
                  placeholder="e.g., 101"
                  value={formData.roomNumber}
                  onChange={(e) => handleInputChange("roomNumber", e.target.value)}
                  required
                  data-testid="input-room-number"
                  className="h-11 border-slate-300 rounded-lg"
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
                  className="h-11 border-slate-300 rounded-lg"
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
                required
                data-testid="input-monthly-rent"
                className="h-11 border-slate-300 rounded-lg text-lg font-semibold"
              />
            </div>
          </div>

          {/* Room Configuration Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-slate-900">Room Configuration</h2>
            </div>

            {/* Sharing Type */}
            <div className="space-y-3">
              <Label htmlFor="sharing" className="text-slate-700 font-medium">Number of Sharing *</Label>
              <select
                id="sharing"
                value={formData.sharing}
                onChange={(e) => handleInputChange("sharing", e.target.value)}
                className="w-full px-3 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 h-11 font-medium"
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
              sharing={sharingNum}
              beds={beds}
              onBedsChange={setBeds}
              readOnly={false}
            />
          </div>

          {/* Tenant Assignment Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-slate-900">Assign Tenants</h2>
            </div>

            {/* Selected Tenants */}
            {selectedTenants.length > 0 && (
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Assigned Tenants ({selectedTenants.length}/{sharingNum})</Label>
                <div className="space-y-2">
                  {selectedTenants.map((tenant) => (
                    <div key={tenant.id} className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{tenant.name}</p>
                        <p className="text-sm text-slate-600">{tenant.phone}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTenant(tenant.id)}
                        className="text-red-600 hover:bg-red-50"
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
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Add Tenant</Label>
                <div className="flex gap-2">
                  <select
                    id="tenantSelect"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 h-10"
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
                    className="gap-1 bg-green-600 hover:bg-green-700"
                    data-testid="button-add-tenant"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </Button>
                </div>
                <p className="text-xs text-slate-500">Only shows tenants not already assigned to other rooms</p>
              </div>
            )}

            {!canAddMore && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">✓ All {sharingNum} slots are filled</p>
              </div>
            )}

            {availableTenants.length === 0 && selectedTenants.length === 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700">No available tenants (optional - you can leave this room vacant)</p>
              </div>
            )}
          </div>

          {/* Amenities Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-4">
              <Bath className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-slate-900">Facilities</h2>
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
                    className={`p-4 rounded-xl border-2 transition-all ${
                      (option.type === "attached" ? formData.hasAttachedBathroom : !formData.hasAttachedBathroom)
                        ? "border-green-500 bg-green-50"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                    data-testid={`button-bathroom-${option.type}`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    <div className="text-sm font-medium text-slate-700">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* AC */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 cursor-pointer transition-all group hover:bg-blue-50"
                onClick={() => handleInputChange("hasAC", !formData.hasAC)}
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
                  <span className="font-medium text-slate-700">Air Conditioning</span>
                </div>
              </label>
            </div>

            {/* Amenities Checklist */}
            <div className="space-y-3 pt-2">
              <Label className="text-slate-700 font-medium">Available Amenities</Label>
              <div className="space-y-2">
                {amenitiesOptions.map((amenity) => (
                  <label key={amenity} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition-all hover:bg-slate-50"
                    onClick={() => toggleAmenity(amenity)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      className="w-4 h-4 accent-purple-600"
                      data-testid={`checkbox-amenity-${amenity.toLowerCase()}`}
                      readOnly
                    />
                    <span className="font-medium text-slate-700 flex-1">{amenity}</span>
                    {formData.amenities.includes(amenity) && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Selected</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-6">
            <Button 
              type="button"
              variant="outline" 
              className="flex-1 h-12 rounded-lg"
              onClick={() => setLocation("/rooms")}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isLoading} 
              data-testid="button-add-room-submit"
            >
              {isLoading ? "Creating Room..." : "Create Room"}
            </Button>
          </div>
        </form>
      </div>
    </MobileLayout>
  );
}
