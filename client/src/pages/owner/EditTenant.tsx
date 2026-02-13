import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, Upload, FileText, Trash2, Plus } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import pako from "pako";
import { api } from "@/apiClient";

interface Room {
  id: number;
  roomNumber: string;
  monthlyRent: string;
  status: string;
  sharing: number;
  tenantIds?: number[];
}

interface Bed {
  id: number;
  position: string;
  status: string;
  tenantId: number | null;
}

interface EmergencyContact {
  id: number;
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

export default function EditTenant() {
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
  });
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [aadharPreview, setAadharPreview] = useState<string>("");
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "" });
  const [showAddContact, setShowAddContact] = useState(false);

  const tenantId = id ? parseInt(id) : null;

  // Fetch tenant data
  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: async () => {
      const res = await api.get(`/api/tenants/${tenantId}`);
      return res.data;
    },
    enabled: !!tenantId,
  });

  // Fetch emergency contacts
  const { data: fetchedContacts = [] } = useQuery<EmergencyContact[]>({
    queryKey: ["emergencyContacts", tenantId],
    queryFn: async () => {
      const res = await api.get(`/api/tenants/${tenantId}/emergency-contacts`);
      return res.data;
    },
    enabled: !!tenantId,
  });

  // Fetch all rooms (not just active ones) so tenant's current room is included
  const { data: allRooms = [] } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await api.get("/api/rooms");
      return res.data;
    },
  });
  
  // For the room dropdown, show: tenant's current room + rooms with available slots
  const rooms = allRooms.filter(room => {
    // Always include tenant's current room
    if (String(room.roomNumber) === String(formData.roomNumber)) return true;
    // Include rooms with available slots
    const availableSlots = room.sharing - ((Array.isArray(room.tenantIds) && room.tenantIds.length) || 0);
    return availableSlots > 0;
  });

  // Get selected room ID
  const selectedRoom = rooms.find(r => String(r.roomNumber) === String(formData.roomNumber));
  const selectedRoomId = selectedRoom?.id;

  // Fetch all beds for the selected room (both available and occupied)
  const { data: allBeds = [] } = useQuery<Bed[]>({
    queryKey: ["room-beds", selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId) return [];
      try {
        const res = await api.get(`/api/rooms/${selectedRoomId}/beds`);
        return res.data;
      } catch (error) {
        return [];
      }
    },
    enabled: !!selectedRoomId,
  });

  // Available beds = beds with status "available" OR the tenant's current bed
  const availableBeds = allBeds.filter(bed => 
    bed.status === "available" || bed.id === formData.bedId
  );

  // Update emergency contacts when fetched
  useEffect(() => {
    if (fetchedContacts && fetchedContacts.length > 0) {
      setEmergencyContacts(fetchedContacts);
    }
  }, [fetchedContacts]);

  // Populate form when tenant data loads
  useEffect(() => {
    if (tenant) {
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
      });
      if (tenant.tenantImage) {
        setPhotoPreview(tenant.tenantImage);
      }
      if (tenant.aadharCard) {
        setAadharPreview("Document uploaded");
      }
    }
  }, [tenant]);

  // Update monthlyRent when room is changed (and reset bedId if room changes)
  useEffect(() => {
    if (formData.roomNumber) {
      const selectedRoom = rooms.find(r => String(r.roomNumber) === String(formData.roomNumber));
      if (selectedRoom) {
        // Only reset bedId if room actually changed (not initial load)
        if (tenant && String(tenant.roomNumber) !== String(formData.roomNumber)) {
          setFormData(prev => ({ ...prev, monthlyRent: selectedRoom.monthlyRent, bedId: null }));
        } else {
          setFormData(prev => ({ ...prev, monthlyRent: selectedRoom.monthlyRent }));
        }
      }
    }
  }, [formData.roomNumber, rooms, tenant]);


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

  const updateTenantMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.put(`/api/tenants/${tenantId}`, data);
      return response.data;
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
      const response = await api.post(`/api/tenants/${tenantId}/emergency-contacts`, contact);
      return response.data;
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
      const response = await api.delete(`/api/emergency-contacts/${contactId}`);
      return response.data;
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
    updateTenantMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <MobileLayout title="Edit Tenant">
        <div className="text-center py-8">Loading...</div>
      </MobileLayout>
    );
  }

  if (!tenant) {
    return (
      <MobileLayout title="Edit Tenant">
        <div className="text-center py-8">Tenant not found</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title="Edit Tenant"
      action={
        <Button variant="ghost" size="icon" onClick={() => setLocation("/tenants")}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload */}
        <div className="flex justify-center">
          {photoPreview ? (
            <label className="cursor-pointer">
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover" data-testid="img-edit-tenant-preview" />
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" data-testid="input-edit-photo" />
            </label>
          ) : (
            <label className="cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-secondary/80 transition-colors">
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-[10px]">Upload Photo</span>
              </div>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" data-testid="input-edit-photo" />
            </label>
          )}
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
              data-testid="input-edit-name"
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
              data-testid="input-edit-email"
            />
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
              data-testid="input-edit-phone"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room">Room No.</Label>
              <Select value={formData.roomNumber || ""} onValueChange={(val) => setFormData({...formData, roomNumber: val})}>
                <SelectTrigger className="bg-card" data-testid="select-edit-room">
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
              <Label htmlFor="bed">Bed Position</Label>
              <Select 
                value={formData.bedId?.toString() || ""} 
                onValueChange={(val) => setFormData({...formData, bedId: val ? parseInt(val) : null})}
                disabled={!formData.roomNumber || availableBeds.length === 0}
              >
                <SelectTrigger className="bg-card" data-testid="select-edit-bed">
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
                <p className="text-xs text-muted-foreground">No bed positions configured</p>
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
                data-testid="input-edit-rent"
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
              data-testid="input-edit-join-date"
            />
            <p className="text-xs text-muted-foreground">
              Used for pro-rated electricity billing calculations
            </p>
          </div>

          <div className="space-y-2">
            <Label>ID Proof (Aadhar/PAN)</Label>
            <label className="cursor-pointer">
              <Card className="bg-card border-dashed hover:bg-secondary/30 transition-colors">
                <CardContent className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        {aadharPreview ? aadharPreview : "Click to upload document"}
                      </p>
                      {aadharPreview && <p className="text-xs text-muted-foreground/70">Click to replace</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleAadharUpload} className="hidden" data-testid="input-edit-aadhar" />
            </label>
          </div>

          {/* Emergency Contacts Section */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-red-900">Emergency Contacts ({emergencyContacts.length})</h3>
              {!showAddContact && (
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowAddContact(true)}
                  className="gap-1"
                  data-testid="button-add-emergency-contact"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              )}
            </div>

            {/* Existing Contacts - Scrollable List */}
            {emergencyContacts.length > 0 && (
              <div className="space-y-3 max-h-60 overflow-y-auto border-t pt-4">
                {emergencyContacts.map((contact, index) => (
                  <div key={contact.id} className="border border-red-200 rounded-lg p-3 bg-white space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm text-red-900">Contact {index + 1}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteContact(contact.id)}
                        disabled={deleteEmergencyContactMutation.isPending}
                        data-testid={`button-delete-contact-${contact.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium text-gray-600">Name:</span> {contact.name}</p>
                      <p><span className="font-medium text-gray-600">Phone:</span> {contact.phone}</p>
                      <p><span className="font-medium text-gray-600">Relationship:</span> {contact.relationship}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Contact Form */}
            {showAddContact && (
              <div className="border-t pt-4 space-y-3 bg-white rounded p-3">
                <p className="text-sm font-semibold text-red-900">Add New Emergency Contact</p>
                <div className="space-y-2">
                  <Label className="text-xs">Name</Label>
                  <Input 
                    placeholder="Contact name" 
                    className="bg-white text-sm"
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                    data-testid="input-new-emergency-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Phone</Label>
                  <Input 
                    type="tel" 
                    placeholder="+91" 
                    className="bg-white text-sm"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                    data-testid="input-new-emergency-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Relationship</Label>
                  <Select value={newContact.relationship} onValueChange={(val) => setNewContact({...newContact, relationship: val})}>
                    <SelectTrigger className="bg-white text-sm" data-testid="select-new-relationship">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent className="max-h-40">
                      {RELATIONSHIPS.map((rel) => (
                        <SelectItem key={rel.value} value={rel.value}>
                          {rel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={handleAddContact}
                    disabled={addEmergencyContactMutation.isPending}
                    className="flex-1"
                    data-testid="button-confirm-add-contact"
                  >
                    {addEmergencyContactMutation.isPending ? "Adding..." : "Add Contact"}
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setShowAddContact(false);
                      setNewContact({ name: "", phone: "", relationship: "" });
                    }}
                    data-testid="button-cancel-add-contact"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full h-12 text-base" disabled={updateTenantMutation.isPending} data-testid="button-save-tenant">
            {updateTenantMutation.isPending ? "Updating..." : "Update Tenant"}
          </Button>
        </div>
      </form>
    </MobileLayout>
  );
}
