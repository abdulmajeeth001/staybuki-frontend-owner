import MobileLayout from "@/components/layout/MobileLayout";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ChevronLeft, Upload, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import pako from "pako";
import { api } from "@/apiClient";

interface Room {
  id: number;
  roomNumber: string;
  monthlyRent: string;
  status: string;
}

interface Bed {
  id: number;
  position: string;
  status: string;
  tenantId: number | null;
}

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
    tenantImage: "",
    aadharCard: "",
    bedId: null as number | null,
  });
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: "", phone: "", relationship: "" }
  ]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aadharPreview, setAadharPreview] = useState<string | null>(null);

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
  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["active-rooms"],
    queryFn: async () => {
      const res = await api.get("/api/active-rooms");
      return res.data;
    },
  });

  // Get selected room ID
  const selectedRoom = rooms.find(r => r.roomNumber === formData.roomNumber);
  const selectedRoomId = selectedRoom?.id;

  // Fetch available beds for the selected room
  const { data: availableBeds = [] } = useQuery<Bed[]>({
    queryKey: ["room-beds", selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId) return [];
      try {
        const res = await api.get(`/api/rooms/${selectedRoomId}/beds`);
        const beds = res.data;
        // Filter only available beds
        return beds.filter((bed: Bed) => bed.status === "available");
      } catch (error) {
        return [];
      }
    },
    enabled: !!selectedRoomId,
  });

  // Set monthlyRent when room is selected
  useEffect(() => {
    if (formData.roomNumber) {
      const selectedRoom = rooms.find(r => r.roomNumber === formData.roomNumber);
      if (selectedRoom) {
        setFormData(prev => ({ ...prev, monthlyRent: selectedRoom.monthlyRent, bedId: null }));
      }
    }
  }, [formData.roomNumber, rooms]);

  const createTenantMutation = useMutation({
    mutationFn: async (data: { formData: typeof formData; emergencyContacts: EmergencyContact[] }) => {
      const response = await api.post("/api/tenants", {
        ...data.formData,
        emergencyContacts: data.emergencyContacts,
      });
      return response.data;
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
      // Extract the actual data part (after "data:...;base64,")
      const dataPart = base64.split(",")[1];
      if (!dataPart) return base64;
      
      // Convert base64 to binary
      const binaryString = atob(dataPart);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Compress using pako
      const compressed = pako.deflate(bytes);
      
      // Convert compressed data to base64
      const compressedBinary = String.fromCharCode.apply(null, Array.from(compressed));
      const compressedBase64 = btoa(compressedBinary);
      
      // Return with metadata
      return `data:application/gzip;base64,${compressedBase64}`;
    } catch (error) {
      console.error("Compression failed:", error);
      return base64;
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gender) {
      alert("Please select tenant's gender");
      return;
    }
    if (!formData.tenantImage) {
      alert("Please upload tenant photo");
      return;
    }
    if (!formData.aadharCard) {
      alert("Please upload Aadhar card");
      return;
    }
    const validContacts = emergencyContacts.filter(c => c.name && c.phone && c.relationship);
    if (validContacts.length === 0) {
      alert("Please add at least one emergency contact with all details filled");
      return;
    }
    createTenantMutation.mutate({ formData, emergencyContacts: validContacts });
  };

  return (
    <Layout 
      title="Add Tenant"
      showNav={false}
      action={
        <Button variant="ghost" size="icon" onClick={() => setLocation("/tenants")}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 md:py-8 max-w-3xl mx-auto">
        {/* Photo Upload */}
        <div className="flex justify-center">
          <label className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-secondary/80 transition-colors">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full rounded-full object-cover" />
            ) : (
              <>
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-[10px]">Upload Photo</span>
              </>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className="hidden"
              data-testid="input-upload-photo"
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. Rahul Kumar" 
              required 
              className="bg-card"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              data-testid="input-add-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="tenant@example.com" 
              required 
              className="bg-card"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              data-testid="input-add-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
            <Select value={formData.gender} onValueChange={(val: "male" | "female" | "other") => setFormData({...formData, gender: val})}>
              <SelectTrigger className="bg-card" data-testid="select-add-gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Gender must match the PG type (Boys/Girls/Common)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="+91" 
              required 
              className="bg-card"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              data-testid="input-add-phone"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room">Room No.</Label>
              <Select value={formData.roomNumber} onValueChange={(val) => setFormData({...formData, roomNumber: val})}>
                <SelectTrigger className="bg-card" data-testid="select-add-room">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.roomNumber}>
                      {room.roomNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bed">Bed Position</Label>
              <Select 
                value={formData.bedId?.toString() || ""} 
                onValueChange={(val) => setFormData({...formData, bedId: val ? parseInt(val) : null})}
                disabled={!formData.roomNumber || availableBeds.length === 0}
              >
                <SelectTrigger className="bg-card" data-testid="select-add-bed">
                  <SelectValue placeholder={availableBeds.length === 0 ? "No beds available" : "Select bed"} />
                </SelectTrigger>
                <SelectContent>
                  {availableBeds.map((bed) => (
                    <SelectItem key={bed.id} value={bed.id.toString()}>
                      {bed.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.roomNumber && availableBeds.length === 0 && (
                <p className="text-xs text-muted-foreground">No bed positions configured for this room</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rent">Monthly Rent</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
              <Input 
                id="rent" 
                type="number" 
                className="pl-7 bg-card" 
                placeholder="5000"
                value={formData.monthlyRent}
                onChange={(e) => setFormData({...formData, monthlyRent: e.target.value})}
                data-testid="input-add-rent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="joinDate">Join Date</Label>
            <Input 
              id="joinDate" 
              type="date" 
              className="bg-card" 
              value={formData.joinDate}
              onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
              data-testid="input-join-date"
            />
            <p className="text-xs text-muted-foreground">Used for pro-rated electricity billing</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aadhar">ID Proof (Aadhar/PAN)</Label>
            <label htmlFor="aadhar" className="block">
              <Card className="bg-card border-dashed cursor-pointer hover:bg-secondary/50 transition-colors">
                <CardContent className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                  {aadharPreview ? (
                    <span className="text-foreground font-medium">{aadharPreview}</span>
                  ) : (
                    "Click to upload document"
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

          {/* Emergency Contacts Section */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-orange-900">Emergency Contacts</h3>
              <span className="text-xs text-orange-600">{emergencyContacts.length}/5 contacts</span>
            </div>
            
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="bg-white rounded-lg p-3 space-y-3 border border-orange-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-800">Contact {index + 1}</span>
                  {emergencyContacts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEmergencyContact(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      data-testid={`button-remove-contact-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`emergency-name-${index}`}>Contact Person Name</Label>
                  <Input 
                    id={`emergency-name-${index}`}
                    placeholder="e.g. John Doe" 
                    className="bg-white"
                    value={contact.name}
                    onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                    data-testid={`input-emergency-name-${index}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`emergency-phone-${index}`}>Contact Phone</Label>
                  <Input 
                    id={`emergency-phone-${index}`}
                    type="tel" 
                    placeholder="+91" 
                    className="bg-white"
                    value={contact.phone}
                    onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                    data-testid={`input-emergency-phone-${index}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`relationship-${index}`}>Relationship</Label>
                  <Select 
                    value={contact.relationship} 
                    onValueChange={(val) => updateEmergencyContact(index, 'relationship', val)}
                  >
                    <SelectTrigger className="bg-white" data-testid={`select-relationship-${index}`}>
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
            ))}

            {emergencyContacts.length < 5 && (
              <Button
                type="button"
                variant="outline"
                onClick={addEmergencyContact}
                className="w-full border-dashed border-orange-300 text-orange-700 hover:bg-orange-100"
                data-testid="button-add-emergency-contact"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Contact
              </Button>
            )}
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full h-12 text-base" disabled={createTenantMutation.isPending} data-testid="button-add-tenant">
            {createTenantMutation.isPending ? "Adding..." : "Add Tenant"}
          </Button>
        </div>
      </form>
    </Layout>
  );
}
