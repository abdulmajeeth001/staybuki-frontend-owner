import DesktopLayout from "@/components/layout/DesktopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LocationMapPicker from "@/components/LocationMapPicker";
import ImageUploader from "@/components/ImageUploader";
import { Bell, User, Building, Edit2, Wallet, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/apiClient";

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  const [pg, setPg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPg, setEditingPg] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [pgSaveLoading, setPgSaveLoading] = useState(false);
  const [paymentSaveLoading, setPaymentSaveLoading] = useState(false);
  const [autoGenerateLoading, setAutoGenerateLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({ name: "", email: "", mobile: "" });
  const [pgForm, setPgForm] = useState({ pgName: "", pgAddress: "", pgLocation: "", latitude: "", longitude: "", imageUrl: "", totalRooms: 0, rentPaymentDate: null as number | null });
  const [paymentForm, setPaymentForm] = useState({ upiId: "" });
  const [originalProfileForm, setOriginalProfileForm] = useState({ name: "", email: "", mobile: "" });
  const [originalPgForm, setOriginalPgForm] = useState({ pgName: "", pgAddress: "", pgLocation: "", latitude: "", longitude: "", imageUrl: "", totalRooms: 0, rentPaymentDate: null as number | null });
  const [originalPaymentForm, setOriginalPaymentForm] = useState({ upiId: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get("/api/users/profile");
        const userData = userRes.data;
        
          if (userData && userData.id) {
            setUser(userData);
            const profileData = { 
              name: userData.name || "", 
              email: userData.email || "", 
              mobile: userData.mobile || "" 
            };
            setProfileForm(profileData);
            setOriginalProfileForm(profileData);
            
            const paymentData = { upiId: userData.upiId || "" };
            setPaymentForm(paymentData);
            setOriginalPaymentForm(paymentData);
          }
        
        try {
          const pgRes = await api.get("/api/pg");
          const pgData = pgRes.data;
          if (pgData && pgData.id) {
            setPg(pgData);
            const pgData2 = { 
              pgName: pgData.pgName || "", 
              pgAddress: pgData.pgAddress || "", 
              pgLocation: pgData.pgLocation || "", 
              latitude: pgData.latitude || "",
              longitude: pgData.longitude || "",
              imageUrl: pgData.imageUrl || "",
              totalRooms: pgData.totalRooms || 0,
              rentPaymentDate: pgData.rentPaymentDate || null
            };
            setPgForm(pgData2);
            setOriginalPgForm(pgData2);
          }
        } catch (pgError) {
          // PG might not exist yet, ignore 404
          console.log("PG fetch info:", pgError);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast({
          title: "Error",
          description: "Failed to load settings. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEditProfile = () => {
    setEditingProfile(true);
  };

  const handleCancelProfile = () => {
    setEditingProfile(false);
    setProfileForm(originalProfileForm);
  };

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    try {
      const res = await api.post("/api/users/profile", profileForm);
      
        const data = res.data;
        setUser(data);
        setOriginalProfileForm(profileForm);
        setEditingProfile(false);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditPg = () => {
    setEditingPg(true);
  };

  const handleCancelPg = () => {
    setEditingPg(false);
    setPgForm(originalPgForm);
  };

  const handleSavePg = async () => {
    setPgSaveLoading(true);
    try {
      const isUpdate = pg?.id;
      let res;
      
      if (isUpdate) {
        res = await api.put(`/api/pg/${pg.id}`, pgForm);
      } else {
        res = await api.post("/api/pg", pgForm);
      }
      
        const data = res.data;
        setPg(data);
        setOriginalPgForm(pgForm);
        setEditingPg(false);
        toast({
          title: "Success",
          description: isUpdate ? "PG details updated successfully" : "PG created successfully",
        });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save PG details",
        variant: "destructive",
      });
    } finally {
      setPgSaveLoading(false);
    }
  };

  const handleEditPayment = () => {
    setEditingPayment(true);
  };

  const handleCancelPayment = () => {
    setEditingPayment(false);
    setPaymentForm(originalPaymentForm);
  };

  const handleSavePayment = async () => {
    setPaymentSaveLoading(true);
    try {
      const res = await api.post("/api/users/profile", paymentForm);
      
        const data = res.data;
        setUser(data);
        setOriginalPaymentForm(paymentForm);
        setEditingPayment(false);
        toast({
          title: "Success",
          description: "Payment details updated successfully",
        });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update payment details",
        variant: "destructive",
      });
    } finally {
      setPaymentSaveLoading(false);
    }
  };

  const handleAutoGenerate = async () => {
    if (!pg?.rentPaymentDate) {
      toast({
        title: "Error",
        description: "Please set a rent payment date first",
        variant: "destructive"
      });
      return;
    }

    setAutoGenerateLoading(true);
    try {
      const res = await api.post("/api/payments/auto-generate");
      
        const data = res.data;
        toast({
          title: "Success!",
          description: data.message
        });
        
        // Refresh PG data to get updated lastPaymentGeneratedAt
        const pgRes = await api.get("/api/pg");
        setPg(pgRes.data);
    } catch (error: any) {
      const errorData = error.response?.data;
      toast({
        title: "Error",
        description: errorData?.error || "Failed to generate payments",
        variant: "destructive"
      });
    } finally {
      setAutoGenerateLoading(false);
    }
  };

  if (loading) {
    return (
      <DesktopLayout title="Settings" showNav>
        <div className="flex items-center justify-center py-16">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
            <User className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout title="Settings" showNav>
      {/* Gradient Hero Section */}
      <div className="relative mb-8 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="relative px-8 py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2" data-testid="title-settings">
                Settings
              </h2>
              <p className="text-white/80 text-sm">
                Manage your account preferences and PG details
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl space-y-6 pb-24">
        {/* Profile Settings */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-profile-settings">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Manage your personal information</CardDescription>
                </div>
              </div>
              {!editingProfile && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEditProfile}
                  data-testid="button-edit-profile"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input 
                  value={profileForm.name} 
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  disabled={!editingProfile}
                  data-testid="input-settings-name" 
                  className={!editingProfile ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  disabled={!editingProfile}
                  data-testid="input-settings-email"
                  className={!editingProfile ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input 
                  value={profileForm.mobile}
                  onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                  disabled={!editingProfile}
                  data-testid="input-settings-mobile"
                  className={!editingProfile ? "bg-muted" : ""}
                />
              </div>
            </div>
            {editingProfile && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={saveLoading} 
                  data-testid="button-save-profile"
                >
                  {saveLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelProfile}
                  data-testid="button-cancel-profile"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PG Settings - Only for Owners */}
        {user?.userType === "owner" && (
        <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-pg-settings">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>PG Details</CardTitle>
                  <CardDescription>Update your property information</CardDescription>
                </div>
              </div>
              {!editingPg && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEditPg}
                  data-testid="button-edit-pg"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            <div className="space-y-2">
              <Label>PG Name</Label>
              <Input 
                value={pgForm.pgName}
                onChange={(e) => setPgForm({ ...pgForm, pgName: e.target.value })}
                disabled={!editingPg}
                data-testid="input-settings-pgname"
                className={!editingPg ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input 
                value={pgForm.pgAddress}
                onChange={(e) => setPgForm({ ...pgForm, pgAddress: e.target.value })}
                disabled={!editingPg}
                data-testid="input-settings-pgaddress"
                className={!editingPg ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Pick Location</Label>
              {editingPg ? (
                <LocationMapPicker 
                  onLocationSelect={(location) => {
                    setPgForm(prev => ({
                      ...prev,
                      pgAddress: location.address,
                      pgLocation: location.city,
                      latitude: location.lat,
                      longitude: location.lon
                    }));
                  }}
                  selectedLocation={{
                    address: pgForm.pgAddress,
                    city: pgForm.pgLocation,
                    lat: pgForm.latitude,
                    lon: pgForm.longitude
                  }}
                />
              ) : (
                <Input 
                  value={pgForm.pgLocation}
                  disabled={true}
                  data-testid="input-settings-pglocation"
                  className="bg-muted"
                />
              )}
            </div>
            {editingPg && (
              <div className="space-y-2">
                <ImageUploader 
                  onImageSelect={(base64Image) => {
                    setPgForm(prev => ({
                      ...prev,
                      imageUrl: base64Image
                    }));
                  }}
                  currentImage={pgForm.imageUrl}
                  label="PG Image (Optional)"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Total Rooms</Label>
              <Input 
                type="number" 
                value={pgForm.totalRooms || 0}
                onChange={(e) => setPgForm({ ...pgForm, totalRooms: parseInt(e.target.value) || 0 })}
                disabled={!editingPg}
                data-testid="input-settings-rooms"
                className={!editingPg ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Rent Payment Date (Day of Month)</Label>
              <Input 
                type="number" 
                min="1"
                max="31"
                value={pgForm.rentPaymentDate || ""}
                onChange={(e) => setPgForm({ ...pgForm, rentPaymentDate: e.target.value ? parseInt(e.target.value) : null })}
                disabled={!editingPg}
                placeholder="e.g., 1 for 1st of month"
                data-testid="input-settings-rent-date"
                className={!editingPg ? "bg-muted" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Payments will be auto-generated on day {pg?.rentPaymentDate || "—"} of each month
              </p>
              
              {!editingPg && pg?.rentPaymentDate && (
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900">Payment Generation</h4>
                      {pg.lastPaymentGeneratedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last generated: {new Date(pg.lastPaymentGeneratedAt).toLocaleDateString()} at {new Date(pg.lastPaymentGeneratedAt).toLocaleTimeString()}
                        </p>
                      )}
                      {!pg.lastPaymentGeneratedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          No payments generated yet
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Next scheduled: Day {pg.rentPaymentDate} of next month
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleAutoGenerate}
                    disabled={autoGenerateLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    data-testid="button-auto-generate"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {autoGenerateLoading ? "Generating..." : "Auto Generate Now"}
                  </Button>
                </div>
              )}
            </div>
            {editingPg && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSavePg} 
                  disabled={pgSaveLoading} 
                  data-testid="button-save-pg"
                >
                  {pgSaveLoading ? "Updating..." : "Update PG Info"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelPg}
                  data-testid="button-cancel-pg"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Payment Settings - Only for Owners */}
        {user?.userType === "owner" && (
        <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-payment-settings">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>Payment Settings</CardTitle>
                  <CardDescription>Manage your UPI payment details for receiving rent</CardDescription>
                </div>
              </div>
              {!editingPayment && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEditPayment}
                  data-testid="button-edit-payment"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            <div className="space-y-2">
              <Label>UPI ID</Label>
              <Input 
                value={paymentForm.upiId}
                onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
                disabled={!editingPayment}
                placeholder="yourname@upi"
                data-testid="input-settings-upiid"
                className={!editingPayment ? "bg-muted" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Tenants will use this UPI ID to pay rent. Example: yourname@paytm, yourname@phonepe
              </p>
            </div>
            {editingPayment && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSavePayment} 
                  disabled={paymentSaveLoading} 
                  data-testid="button-save-payment"
                >
                  {paymentSaveLoading ? "Saving..." : "Save UPI Details"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelPayment}
                  data-testid="button-cancel-payment"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Notification Settings */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-notification-settings">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Payment Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified when rent is due</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" data-testid="checkbox-payment-reminder" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Complaint Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified about new complaints</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" data-testid="checkbox-complaint-alerts" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Maintenance Updates</p>
                <p className="text-sm text-muted-foreground">Get notified about maintenance requests</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" data-testid="checkbox-maintenance-alerts" />
            </div>
          </CardContent>
        </Card>

      </div>
    </DesktopLayout>
  );
}
