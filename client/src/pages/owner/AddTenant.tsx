import MobileLayout from "@/components/layout/MobileLayout";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ChevronLeft, Upload, Plus, Trash2, User, Building, FileText, Camera, ShieldAlert, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { ownerService } from "@/services/ownerService";
import type { RoomResponse, BedResponse } from "@/types/owner";
import { cn } from "@/lib/utils";

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const PROFESSION_OPTIONS = [
  { value: "Student", label: "Student" },
  { value: "Employee", label: "Employee" },
  { value: "Entrepreneur", label: "Entrepreneur" },
  { value: "Business", label: "Business" },
  { value: "Freelancer", label: "Freelancer" },
  { value: "Other", label: "Other" },
];

export default function AddTenant() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "" as "" | "male" | "female" | "other",
    roomNumber: "",
    monthlyRent: "",
    joinDate: new Date().toISOString().split('T')[0], // Default to today
    bedId: null as number | null,
    profession: "",
  });
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: "", phone: "", relationship: "" }
  ]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aadharPreview, setAadharPreview] = useState<string | null>(null);
  const [tenantImageFile, setTenantImageFile] = useState<File | null>(null);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [professionIdFile, setProfessionIdFile] = useState<File | null>(null);
  const [professionIdPreview, setProfessionIdPreview] = useState<string | null>(null);

  const addEmergencyContact = () => {
    if (emergencyContacts.length < 5) {
      setEmergencyContacts([...emergencyContacts, { name: "", phone: "", relationship: "" }]);
    }
  };

  const removeEmergencyContact = (index: number) => {
    if (emergencyContacts.length > 1) {
      setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
    }
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const updated = [...emergencyContacts];
    updated[index] = { ...updated[index], [field]: value };
    setEmergencyContacts(updated);
  };

  // Fetch active rooms
  const { data: rooms = [] } = useQuery<RoomResponse[]>({
    queryKey: ["active-rooms"],
    queryFn: () => ownerService.getRooms(),
  });

  // Get selected room ID
  const selectedRoom = rooms.find((r) => String(r.roomNumber) === String(formData.roomNumber));
  const selectedRoomId = selectedRoom?.id;

  // Fetch available beds for the selected room
  const { data: availableBeds = [] } = useQuery<BedResponse[]>({
    queryKey: ["room-beds", selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId) return [];
      try {
        const beds = await ownerService.getBedsByRoom(selectedRoomId);
        // Filter only available beds
        return beds.filter((bed) => bed.status?.toLowerCase() === "available");
      } catch (error) {
        return [];
      }
    },
    enabled: !!selectedRoomId,
  });


  const createTenantMutation = useMutation({
    mutationFn: async (submitData: FormData) => {
      return ownerService.createTenant(submitData as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      setLocation("/tenants");
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      const message = error.response?.data?.details || error.response?.data?.error || error.message || "Failed to create tenant";
      alert(message);
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        alert("Please upload an image smaller than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }
      setTenantImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAadharUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        alert("Please upload a document smaller than 5MB");
        return;
      }
      setAadharFile(file);
      setAadharPreview(file.name);
    }
  };

  const handleProfessionIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        alert("Please upload a document smaller than 5MB");
        return;
      }
      setProfessionIdFile(file);
      setProfessionIdPreview(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gender) {
      alert("Please select tenant's gender");
      return;
    }
    if (!tenantImageFile) {
      alert("Please upload tenant photo");
      return;
    }
    if (!aadharFile) {
      alert("Please upload Aadhar card");
      return;
    }
    const validContacts = emergencyContacts.filter(c => c.name && c.phone && c.relationship);
    if (validContacts.length === 0) {
      alert("Please add at least one emergency contact with all details filled");
      return;
    }
    if (!formData.roomNumber) {
      alert("Please select a room");
      return;
    }
    if (!formData.bedId) {
      alert("Please select a bed position");
      return;
    }

    const submitData = new FormData();
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      gender: formData.gender,
      roomNumber: formData.roomNumber,
      monthlyRent: formData.monthlyRent,
      joinDate: formData.joinDate,
      bedId: formData.bedId,
      profession: formData.profession,
      emergencyContacts: validContacts,
    };

    submitData.append("req", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    submitData.append("tenantImage", tenantImageFile);
    submitData.append("aadharCard", aadharFile);
    if (professionIdFile) {
      submitData.append("professionIdDoc", professionIdFile);
    }

    createTenantMutation.mutate(submitData);
  };

  return (
    <Layout 
      title="Add Tenant"
      showNav={false}
    >
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">Add New Tenant</h1>
              <p className="text-sm text-slate-500 font-medium">Enter tenant details and room assignment</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 sm:p-6 space-y-8 relative">
          {/* Photo Upload */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
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
                  data-testid="input-upload-photo"
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
                    data-testid="input-add-name"
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
                      data-testid="input-add-phone"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-medium">Email Address *</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="tenant@example.com" 
                      required 
                      className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      data-testid="input-add-email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-slate-700 font-medium">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(val: "male" | "female" | "other") => setFormData({...formData, gender: val})}>
                      <SelectTrigger className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors text-slate-900" data-testid="select-add-gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 font-medium">Gender must match the PG type (Boys/Girls/Common)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profession" className="text-slate-700 font-medium">Profession (Optional)</Label>
                    <Select value={formData.profession} onValueChange={(val) => setFormData({...formData, profession: val})}>
                      <SelectTrigger className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors text-slate-900" data-testid="select-add-profession">
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
                <Select value={formData.roomNumber} onValueChange={(val) => {
                  const selectedRoom = rooms.find((r) => String(r.roomNumber) === val);
                  setFormData({
                    ...formData, 
                    roomNumber: val,
                    monthlyRent: selectedRoom ? String(selectedRoom.monthlyRent) : formData.monthlyRent,
                    bedId: null
                  });
                }}>
                    <SelectTrigger className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors text-slate-900" data-testid="select-add-room">
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
                    value={formData.bedId?.toString() || ""} 
                    onValueChange={(val) => setFormData({...formData, bedId: val ? parseInt(val) : null})}
                    disabled={!formData.roomNumber || availableBeds.length === 0}
                  >
                    <SelectTrigger className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors text-slate-900" data-testid="select-add-bed">
                      <SelectValue placeholder={availableBeds.length === 0 ? "No beds available" : "Select bed"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBeds.map((bed) => (
                        <SelectItem key={bed.id} value={String(bed.id)}>
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
                      data-testid="input-add-rent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinDate" className="text-slate-700 font-medium">Join Date *</Label>
                  <Input 
                    id="joinDate" 
                    type="date" 
                    className="h-12 border-slate-200 hover:border-purple-300 focus-visible:ring-purple-500 rounded-xl bg-slate-50/50 transition-colors" 
                    value={formData.joinDate}
                    onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                    data-testid="input-join-date"
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
                  <p className="text-sm text-slate-500 font-medium">Upload tenant identity proof</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="aadhar" className="text-slate-700 font-medium">ID Proof (Aadhar/PAN) *</Label>
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
                      data-testid="input-upload-aadhar"
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
                        data-testid="input-upload-profession-id"
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
                    <p className="text-sm text-slate-500 font-medium">Add up to 5 contact persons</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">{emergencyContacts.length}/5 contacts</span>
              </div>
              
              <div className="space-y-4">
                {emergencyContacts.map((contact, index) => (
                  <div key={index} className="bg-slate-50/50 rounded-2xl p-5 space-y-4 border border-slate-200 hover:border-orange-200 transition-colors relative">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                        Contact Person
                      </span>
                      {emergencyContacts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEmergencyContact(index)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          data-testid={`button-remove-contact-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`emergency-name-${index}`} className="text-slate-700 text-xs font-semibold">Name</Label>
                        <Input 
                          id={`emergency-name-${index}`}
                          placeholder="e.g. John Doe" 
                          className="bg-white h-11 border-slate-200 rounded-xl"
                          value={contact.name}
                          onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                          data-testid={`input-emergency-name-${index}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`emergency-phone-${index}`} className="text-slate-700 text-xs font-semibold">Phone</Label>
                        <Input 
                          id={`emergency-phone-${index}`}
                          type="tel" 
                          placeholder="+91" 
                          className="bg-white h-11 border-slate-200 rounded-xl"
                          value={contact.phone}
                          onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                          data-testid={`input-emergency-phone-${index}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`relationship-${index}`} className="text-slate-700 text-xs font-semibold">Relationship</Label>
                        <Select 
                          value={contact.relationship} 
                          onValueChange={(val) => updateEmergencyContact(index, 'relationship', val)}
                        >
                          <SelectTrigger className="bg-white h-11 border-slate-200 rounded-xl text-slate-900" data-testid={`select-relationship-${index}`}>
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

              {emergencyContacts.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addEmergencyContact}
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
              disabled={createTenantMutation.isPending} 
              data-testid="button-add-tenant"
            >
              {createTenantMutation.isPending ? "Adding Tenant..." : "Add Tenant"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
