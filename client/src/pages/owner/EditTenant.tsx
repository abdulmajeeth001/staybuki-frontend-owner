import MobileLayout from "@/components/layout/MobileLayout";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, Upload, FileText, Trash2, Plus, Briefcase, Camera, User, Building, ShieldAlert, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import pako from "pako";
import { ownerService } from "@/services/ownerService";
import type { TenantResponse, RoomResponse, BedResponse, EmergencyContactResponse } from "@/types/owner";
import { cn } from "@/lib/utils";

const RELATIONSHIPS = [
  { label: "Father", value: "Father" },
  { label: "Mother", value: "Mother" },
  { label: "Brother", value: "Brother" },
  { label: "Sister", value: "Sister" },
  { label: "Spouse", value: "Spouse" },
  { label: "Son", value: "Son" },
  { label: "Daughter", value: "Daughter" },
  { label: "Grandfather", value: "Grandfather" },
  { label: "Grandmother", value: "Grandmother" },
  { label: "Uncle", value: "Uncle" },
  { label: "Aunt", value: "Aunt" },
  { label: "Cousin", value: "Cousin" },
  { label: "Friend", value: "Friend" },
  { label: "Other", value: "Other" },
];

const PROFESSION_OPTIONS = [
  { value: "Student", label: "Student" },
  { value: "Employee", label: "Employee" },
  { value: "Entrepreneur", label: "Entrepreneur" },
  { value: "Business", label: "Business" },
  { value: "Freelancer", label: "Freelancer" },
  { value: "Other", label: "Other" },
];

export default function EditTenant() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    roomNumber: "",
    monthlyRent: "",
    tenantImage: "",
    aadharCard: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    relationship: "",
    joinDate: "",
    bedId: null as number | null,
    profession: "",
    professionIdDoc: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [aadharPreview, setAadharPreview] = useState<string>("");
  const [professionIdPreview, setProfessionIdPreview] = useState<string>("");
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactResponse[]>([]);
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "" });
  const [showAddContact, setShowAddContact] = useState(false);
  const [isPopulated, setIsPopulated] = useState(false);

  const tenantId = id ? parseInt(id) : null;

  // Fetch tenant data
  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      return ownerService.getTenantById(tenantId);
    },
    enabled: !!tenantId,
  });

  // Fetch emergency contacts
  const { data: fetchedContacts = [] } = useQuery<EmergencyContactResponse[]>({
    queryKey: ["emergencyContacts", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      try {
        const data = await ownerService.getEmergencyContacts(tenantId);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!tenantId,
  });

  // Fetch all rooms (not just active ones) so tenant's current room is included
  const { data: allRooms = [] } = useQuery<RoomResponse[]>({
    queryKey: ["rooms"],
    queryFn: async () => {
      try {
        const data = await ownerService.getRooms();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        return [];
      }
    },
  });
  
  // For the room dropdown, show: tenant's current room + rooms with available slots
  const rooms = useMemo(() => {
    return (Array.isArray(allRooms) ? allRooms : []).filter(room => {
      if (!room) return false;
      // Always include tenant's current room
      if (tenant && (String(room.roomNumber) === String(tenant.roomNumber) || String(room.id) === String((tenant as any).roomId))) return true;
      // Include rooms with available slots
      const availableSlots = (room.sharing || 1) - ((Array.isArray(room.tenantIds) && room.tenantIds.length) || 0);
      return availableSlots > 0;
    });
  }, [allRooms, tenant]);

  // Get selected room ID
  const selectedRoom = rooms.find(r => String(r.roomNumber) === String(formData.roomNumber));
  const selectedRoomId = selectedRoom?.id;

  // Fetch all beds for the selected room (both available and occupied)
  const { data: allBeds = [] } = useQuery<BedResponse[]>({
    queryKey: ["room-beds", selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId) return [];
      try {
        const data = await ownerService.getBedsByRoom(selectedRoomId);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!selectedRoomId,
  });

  // Available beds = beds with status "available" OR the tenant's current bed
  const availableBeds = useMemo(() => {
    return (Array.isArray(allBeds) ? allBeds : []).filter(bed => {
      if (bed?.status?.toLowerCase() === "available") return true;
      if (tenant && String(bed?.id) === String(tenant.bedId)) return true;
      if (tenant && String(bed?.tenantId) === String(tenant.id)) return true;
      return false;
    });
  }, [allBeds, tenant]);

  // Update emergency contacts when fetched
  useEffect(() => {
    if (Array.isArray(fetchedContacts) && fetchedContacts.length > 0) {
      setEmergencyContacts(fetchedContacts);
    }
  }, [fetchedContacts]);

  // Populate form when tenant data loads
  useEffect(() => {
    if (tenant && !isPopulated) {
      setFormData({
        name: tenant.name || "",
        email: tenant.email || "",
        phone: tenant.phone || "",
        roomNumber: String(tenant.roomNumber || ""),
        monthlyRent: String(tenant.monthlyRent || ""),
        tenantImage: tenant.tenantImage || "",
        aadharCard: tenant.aadharCard || "",
        emergencyContactName: tenant.emergencyContactName || "",
        emergencyContactPhone: tenant.emergencyContactPhone || "",
        relationship: tenant.relationship || "",
        joinDate: tenant.joinDate ? new Date(tenant.joinDate).toISOString().split('T')[0] : "",
        bedId: tenant.bedId || null,
        profession: tenant.profession || "",
        professionIdDoc: tenant.professionIdDocUrl || tenant.professionIdDoc || "",
      });
      if (tenant.tenantImage) {
        setPhotoPreview(tenant.tenantImage);
      }
      if (tenant.aadharCard) {
        setAadharPreview("Document uploaded");
      }
      if (tenant.professionIdDocUrl || tenant.professionIdDoc) {
        setProfessionIdPreview("Document uploaded");
      }
      setIsPopulated(true);
    }
  }, [tenant, isPopulated]);



  const compressImage = (base64: string, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const compressed = canvas.toDataURL("image/jpeg", quality);
          resolve(compressed);
        }
      };
      img.src = base64;
    });
  };

  const compressDocument = (base64: string): string => {
    try {
      const dataPart = base64.split(",")[1];
      if (!dataPart) return base64;
      
      const binaryString = atob(dataPart);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const compressed = pako.deflate(bytes);
      const compressedBinary = String.fromCharCode.apply(null, Array.from(compressed));
      const compressedBase64 = btoa(compressedBinary);
      
      return `data:application/gzip;base64,${compressedBase64}`;
    } catch (error) {
      console.error("Compression failed:", error);
      return base64;
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const compressed = await compressImage(base64, 0.7);
        setFormData({...formData, tenantImage: compressed});
        setPhotoPreview(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAadharUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const compressed = compressDocument(base64);
        setFormData({...formData, aadharCard: compressed});
        setAadharPreview(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfessionIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const compressed = compressDocument(base64);
        setFormData({...formData, professionIdDoc: compressed});
        setProfessionIdPreview(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateTenantMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!tenantId) throw new Error("No tenant ID");
      return ownerService.updateTenant(tenantId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenant", tenantId] });
      setLocation("/tenants");
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      alert(error.response?.data?.details || error.response?.data?.error || error.message || "Failed to update tenant");
    },
  });

  const addEmergencyContactMutation = useMutation({
    mutationFn: async (contact: typeof newContact) => {
      if (!contact.name || !contact.phone || !contact.relationship) {
        throw new Error("All fields are required");
      }
      if (!tenantId) throw new Error("No tenant ID");
      return ownerService.addEmergencyContact(tenantId, contact);
    },
    onSuccess: (data) => {
      setEmergencyContacts([...emergencyContacts, data.contact]);
      setNewContact({ name: "", phone: "", relationship: "" });
      setShowAddContact(false);
      // Invalidate cache so ViewTenant shows updated contacts
      queryClient.invalidateQueries({ queryKey: ["emergencyContacts", tenantId] });
    },
  });

  const deleteEmergencyContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      return ownerService.deleteEmergencyContact(contactId);
    },
    onSuccess: (_, contactId) => {
      setEmergencyContacts(emergencyContacts.filter(c => c.id !== contactId));
      // Invalidate cache so ViewTenant shows updated contacts
      queryClient.invalidateQueries({ queryKey: ["emergencyContacts", tenantId] });
    },
  });

  const handleAddContact = () => {
    addEmergencyContactMutation.mutate(newContact);
  };

  const handleDeleteContact = (contactId: number) => {
    if (confirm("Are you sure you want to delete this emergency contact?")) {
      deleteEmergencyContactMutation.mutate(contactId);
    }
  };

  const handleUpdateContact = (contactId: number, field: string, value: string) => {
    setEmergencyContacts(emergencyContacts.map(c => 
      c.id === contactId ? { ...c, [field]: value } : c
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roomNumber) {
      alert("Please select a room");
      return;
    }
    if (!formData.bedId) {
      alert("Please select a bed position");
      return;
    }
    updateTenantMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Layout title="Edit Tenant" showNav={false}>
        <div className="text-center py-8">Loading...</div>
      </Layout>
    );
  }

  if (!tenant) {
    return (
      <Layout title="Edit Tenant" showNav={false}>
        <div className="text-center py-8">Tenant not found</div>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Tenant" showNav={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 py-4 sm:px-6 shadow-sm">
          <div className="flex items-center gap-4 max-w-3xl mx-auto">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setLocation("/tenants")}
              className="h-10 w-10 rounded-xl border-2 hover:bg-slate-100 transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">Edit Tenant</h1>
              <p className="text-sm text-slate-500 font-medium">Update tenant details and assignments</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 sm:p-6 space-y-8 relative">
          {/* Photo Upload */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" data-testid="img-edit-tenant-preview" />
                ) : (
                  <User className="w-12 h-12 text-slate-300" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg hover:from-purple-700 hover:to-blue-700 transition-transform hover:scale-105">
                <Camera className="w-5 h-5" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="hidden"
                  data-testid="input-edit-photo"
                />
              </label>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300 p-6 sm:p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md shadow-purple-200 group-hover:scale-110 transition-transform duration-300">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
                  <p className="text-sm text-slate-500 font-medium">Basic details of the tenant</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-medium">Full Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Rahul Kumar" 
                    required 
                    className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    data-testid="input-edit-name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-700 font-medium">Phone Number *</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+91" 
                      required 
                      className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      data-testid="input-edit-phone"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="tenant@example.com" 
                      className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      data-testid="input-edit-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profession" className="text-slate-700 font-medium">Profession (Optional)</Label>
                  <Select value={formData.profession || ""} onValueChange={(val) => setFormData({...formData, profession: val})}>
                    <SelectTrigger className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors text-slate-900" data-testid="select-edit-profession">
                      <SelectValue placeholder="Select profession" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFESSION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Stay Details */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300 p-6 sm:p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Stay Details</h2>
                  <p className="text-sm text-slate-500 font-medium">Room, rent, and move-in information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="room" className="text-slate-700 font-medium">Room Number *</Label>
                <Select value={formData.roomNumber ? String(formData.roomNumber) : undefined} onValueChange={(val) => {
                  const selectedRoom = rooms.find(r => String(r.roomNumber) === val);
                  setFormData({
                    ...formData, 
                    roomNumber: val,
                    monthlyRent: selectedRoom ? String(selectedRoom.monthlyRent) : formData.monthlyRent,
                    bedId: null
                  });
                }}>
                    <SelectTrigger className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors text-slate-900" data-testid="select-edit-room">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={String(room.roomNumber)}>
                          {room.roomNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bed" className="text-slate-700 font-medium">Bed Position</Label>
                  <Select 
                    value={formData.bedId ? String(formData.bedId) : "none"} 
                    onValueChange={(val) => setFormData({...formData, bedId: val === "none" ? null : parseInt(val)})}
                    disabled={!formData.roomNumber || availableBeds.length === 0}
                  >
                    <SelectTrigger className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors text-slate-900" data-testid="select-edit-bed">
                      <SelectValue placeholder={availableBeds.length === 0 ? "No beds available" : "Select bed"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (unassign)</SelectItem>
                      {availableBeds.map((bed) => (
                        <SelectItem key={bed.id} value={bed.id.toString()}>
                          {bed.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.roomNumber && availableBeds.length === 0 && (
                    <p className="text-xs text-slate-500 font-medium">No bed positions configured for this room</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rent" className="text-slate-700 font-medium">Monthly Rent (₹) *</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-500 font-medium">₹</span>
                    <Input 
                      id="rent" 
                      type="number" 
                      className="h-12 pl-8 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors text-lg font-semibold" 
                      placeholder="5000"
                      value={formData.monthlyRent}
                      onChange={(e) => setFormData({...formData, monthlyRent: e.target.value})}
                      data-testid="input-edit-rent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinDate" className="text-slate-700 font-medium">Join Date</Label>
                  <Input 
                    id="joinDate" 
                    type="date" 
                    className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors" 
                    value={formData.joinDate}
                    onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                    data-testid="input-edit-join-date"
                  />
                  <p className="text-xs text-slate-500 font-medium">Used for pro-rated electricity billing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300 p-6 sm:p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md shadow-emerald-200 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Documents</h2>
                  <p className="text-sm text-slate-500 font-medium">Update tenant identity proof</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="aadhar" className="text-slate-700 font-medium">ID Proof (Aadhar/PAN)</Label>
                  <label htmlFor="aadhar" className="block h-full">
                    <Card className={cn(
                      "h-full border-2 border-dashed cursor-pointer transition-all duration-300",
                      aadharPreview ? "border-green-400 bg-green-50/50 hover:bg-green-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-purple-300"
                    )}>
                      <CardContent className="flex flex-col items-center justify-center py-10 text-slate-600 space-y-2 h-full">
                        {aadharPreview ? (
                          <>
                            <FileText className="w-8 h-8 text-green-600 mb-2" />
                            <span className="text-green-700 font-bold text-sm text-center px-4 truncate w-full">{aadharPreview}</span>
                            <span className="text-xs text-green-600/70 font-medium">Click to replace document</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                            <span className="text-slate-700 font-semibold">Upload ID Document</span>
                            <span className="text-xs text-slate-500 font-medium">Supports JPG, PNG or PDF</span>
                          </>
                        )}
                      </CardContent>
                    </Card>
                    <input 
                      id="aadhar"
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleAadharUpload} 
                      className="hidden"
                      data-testid="input-edit-aadhar"
                    />
                  </label>
                </div>

                {formData.profession && (
                  <div className="space-y-3">
                    <Label htmlFor="professionId" className="text-slate-700 font-medium">
                      {formData.profession === "Student" ? "Student ID Card" : formData.profession === "Employee" ? "Employee ID Card" : "Profession ID/Proof"} (Optional)
                    </Label>
                    <label htmlFor="professionId" className="block h-full">
                      <Card className={cn(
                        "h-full border-2 border-dashed cursor-pointer transition-all duration-300",
                        professionIdPreview ? "border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-purple-300"
                      )}>
                        <CardContent className="flex flex-col items-center justify-center py-10 text-slate-600 space-y-2 h-full">
                          {professionIdPreview ? (
                            <>
                              <Briefcase className="w-8 h-8 text-indigo-600 mb-2" />
                              <span className="text-indigo-700 font-bold text-sm text-center px-4 truncate w-full">{professionIdPreview}</span>
                              <span className="text-xs text-indigo-600/70 font-medium">Click to replace document</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-slate-400 mb-2" />
                              <span className="text-slate-700 font-semibold">Upload {formData.profession === "Student" ? "Student ID" : "Work ID"}</span>
                              <span className="text-xs text-slate-500 font-medium">Supports JPG, PNG or PDF</span>
                            </>
                          )}
                        </CardContent>
                      </Card>
                      <input 
                        id="professionId"
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleProfessionIdUpload} 
                        className="hidden"
                        data-testid="input-edit-profession-id"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contacts Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 hover:border-purple-200 hover:shadow-lg transition-all duration-300 p-6 sm:p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md shadow-orange-200 group-hover:scale-110 transition-transform duration-300">
                    <ShieldAlert className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Emergency Contacts</h2>
                    <p className="text-sm text-slate-500 font-medium">Manage contact persons</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">{emergencyContacts.length}/5 contacts</span>
              </div>
              
              <div className="space-y-4">
                {emergencyContacts.map((contact, index) => (
                  <div key={contact.id} className="bg-slate-50/50 rounded-2xl p-5 space-y-4 border border-slate-200 hover:border-orange-200 transition-colors relative">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                        Contact Person
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteContact(contact.id)}
                        disabled={deleteEmergencyContactMutation.isPending}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        data-testid={`button-delete-contact-${contact.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 text-xs font-semibold">Name</Label>
                        <Input 
                          placeholder="e.g. John Doe" 
                          className="bg-white h-11 border-slate-200 rounded-xl"
                          value={contact.name}
                          onChange={(e) => handleUpdateContact(contact.id, 'name', e.target.value)}
                          data-testid={`input-emergency-name-${contact.id}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 text-xs font-semibold">Phone</Label>
                        <Input 
                          type="tel" 
                          placeholder="+91" 
                          className="bg-white h-11 border-slate-200 rounded-xl"
                          value={contact.phone}
                          onChange={(e) => handleUpdateContact(contact.id, 'phone', e.target.value)}
                          data-testid={`input-emergency-phone-${contact.id}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 text-xs font-semibold">Relationship</Label>
                        <Select 
                          value={contact.relationship} 
                          onValueChange={(val) => handleUpdateContact(contact.id, 'relationship', val)}
                        >
                          <SelectTrigger className="bg-white h-11 border-slate-200 rounded-xl text-slate-900" data-testid={`select-relationship-${contact.id}`}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="max-h-48">
                            {RELATIONSHIPS.map((rel) => (
                              <SelectItem key={rel.value} value={rel.value}>
                                {rel.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {showAddContact && (
                <div className="bg-orange-50/50 rounded-2xl p-5 space-y-4 border border-orange-200 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-orange-800">New Contact Details</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowAddContact(false);
                        setNewContact({ name: "", phone: "", relationship: "" });
                      }}
                      className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 text-xs font-semibold">Name</Label>
                      <Input 
                        placeholder="Contact name" 
                        className="bg-white h-11 border-slate-200 rounded-xl"
                        value={newContact.name}
                        onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                        data-testid="input-new-emergency-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 text-xs font-semibold">Phone</Label>
                      <Input 
                        type="tel" 
                        placeholder="+91" 
                        className="bg-white h-11 border-slate-200 rounded-xl"
                        value={newContact.phone}
                        onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                        data-testid="input-new-emergency-phone"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 text-xs font-semibold">Relationship</Label>
                      <Select value={newContact.relationship} onValueChange={(val) => setNewContact({...newContact, relationship: val})}>
                        <SelectTrigger className="bg-white h-11 border-slate-200 rounded-xl text-slate-900" data-testid="select-new-relationship">
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48">
                          {RELATIONSHIPS.map((rel) => (
                            <SelectItem key={rel.value} value={rel.value}>
                              {rel.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <Button 
                      type="button" 
                      onClick={handleAddContact}
                      disabled={addEmergencyContactMutation.isPending}
                      className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-11 px-6"
                      data-testid="button-confirm-add-contact"
                    >
                      {addEmergencyContactMutation.isPending ? "Adding..." : "Save Contact"}
                    </Button>
                  </div>
                </div>
              )}

              {!showAddContact && emergencyContacts.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddContact(true)}
                  className="w-full mt-4 border-2 border-dashed border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 h-12 rounded-xl font-semibold"
                  data-testid="button-add-emergency-contact"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Another Contact
                </Button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 pb-12 sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-10 px-2 mt-4">
            <Button 
              type="button"
              variant="outline" 
              className="flex-1 h-14 rounded-xl font-semibold border-2 hover:bg-slate-100 transition-colors shadow-sm bg-white/80 backdrop-blur-sm"
              onClick={() => setLocation("/tenants")}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-14 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5"
              disabled={updateTenantMutation.isPending} 
              data-testid="button-save-tenant"
            >
              {updateTenantMutation.isPending ? "Updating Tenant..." : "Update Tenant"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
