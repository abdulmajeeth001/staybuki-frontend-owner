import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LocationMapPicker from "@/components/LocationMapPicker";
import ImageUploader from "@/components/ImageUploader";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { ChevronLeft, Mail, Phone, User, Lock, Eye, EyeOff, ArrowRight, Upload, FileText, File, Building2, Home, Users, FileCheck, Award, Grid3x3, MapPin, Image as ImageIcon, Sparkles, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authService } from "@/services/authService";
import type { RegisterRequest, VerifyOtpRequest } from "@/types/auth";

export default function Register() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [amenities, setAmenities] = useState<any[]>([]);
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [fssaiFile, setFssaiFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    gender: "" as "" | "male" | "female" | "other",
    userType: "owner",
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
    password: "",
    confirmPassword: ""
  });

  // Fetch amenities on mount
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const data = await authService.getAmenities();
        setAmenities(data.filter((a) => a.isActive));
      } catch (error) {
        console.error("Failed to fetch amenities:", error);
      }
    };
    fetchAmenities();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const toggleAmenity = (amenityId: number) => {
    setFormData(prev => {
      const newAmenityIds = prev.amenityIds.includes(amenityId)
        ? prev.amenityIds.filter(id => id !== amenityId)
        : [...prev.amenityIds, amenityId];
      
      return {
        ...prev,
        amenityIds: newAmenityIds
      };
    });
  };

  const handleRegistrationDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setRegistrationFile(file);
    // Clear any previously uploaded URL if a new file is selected
    setFormData((prev) => ({ ...prev, registrationDocumentUrl: "" }));
  };

  const handleFssaiCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setFssaiFile(file);
    setFormData((prev) => ({ ...prev, fssaiCertificateUrl: "" }));
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Validate gender is required for non-owner users
      if (formData.userType !== "owner" && !formData.gender) {
        setError("Please select your gender");
        return;
      }

      setStep(3);
    } else if (step === 3) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      setIsLoading(true);
      try {
        const registerData: any = {
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          gender: formData.gender || undefined,
          userType: formData.userType,
          password: formData.password,
        };

        if (formData.userType === "owner") {
          registerData.pgDetails = {
            pgName: formData.pgName,
            pgAddress: formData.pgAddress,
            pgLocation: formData.pgLocation,
            latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
            longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
            totalRooms: formData.totalRooms ? parseInt(formData.totalRooms) : undefined,
            pgType: formData.pgType,
            registrationNumber: formData.registrationNumber,
            amenityIds: formData.amenityIds,
          };
        }

        const formDataToSend = new FormData();
        formDataToSend.append("req", new Blob([JSON.stringify(registerData)], { type: "application/json" }));

        if (registrationFile) {
          formDataToSend.append("registrationDoc", registrationFile);
        }
        if (fssaiFile) {
          formDataToSend.append("fssaiCert", fssaiFile);
        }

        await authService.register(formDataToSend as any);

        setIsLoading(false);
        setStep(4);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || "Registration failed");
        setIsLoading(false);
      }
    } else if (step === 4) {
      const otpCode = otp.join("");
      if (otpCode.length !== 6) {
        setError("Please enter all 6 digits");
        return;
      }

      setIsLoading(true);
      try {
        const verifyData: VerifyOtpRequest = {
          email: formData.email,
          otp: otpCode,
        };

        await authService.verifyOtp(verifyData);

        setIsLoading(false);
        setLocation("/dashboard");
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || "OTP verification failed");
        setIsLoading(false);
      }
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLocation("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto border-x border-border shadow-2xl relative">
      <header className="bg-card border-b border-border p-4 flex items-center h-16 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => step === 1 ? setLocation("/") : setStep(prev => prev - 1 as any)}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="font-bold text-lg ml-2">
          {step === 1 ? "Select Role" : step === 2 ? "Your Details" : step === 3 ? "Set Password" : "Verification"}
        </h1>
      </header>

      <main className="flex-1 p-6 overflow-y-auto pb-24">
        <div className="max-w-sm mx-auto space-y-6">
          <div className="flex justify-between mb-8 px-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                  step >= s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>
                  {s}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {s === 1 ? "Role" : s === 2 ? "Details" : s === 3 ? "Security" : "Verify"}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm" data-testid="error-message">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.form
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleNext}
              className="space-y-6"
            >
              {step === 1 && (
                <>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">Select how you'll use StayBuki</p>
                    
                    <div 
                      onClick={() => handleInputChange("userType", "owner")}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.userType === "owner" 
                          ? "border-primary bg-primary/10" 
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                      data-testid="button-role-owner"
                    >
                      <h3 className="font-semibold text-base">PG Owner</h3>
                      <p className="text-sm text-muted-foreground mt-1">Manage properties, rooms, tenants & payments</p>
                    </div>

                    <div 
                      onClick={() => handleInputChange("userType", "tenant")}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.userType === "tenant" 
                          ? "border-primary bg-primary/10" 
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                      data-testid="button-role-tenant"
                    >
                      <h3 className="font-semibold text-base">Tenant</h3>
                      <p className="text-sm text-muted-foreground mt-1">View payments, complaints & announcements</p>
                    </div>

                    <div 
                      onClick={() => handleInputChange("userType", "admin")}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.userType === "admin" 
                          ? "border-primary bg-primary/10" 
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                      data-testid="button-role-admin"
                    >
                      <h3 className="font-semibold text-base">Admin</h3>
                      <p className="text-sm text-muted-foreground mt-1">Manage users, properties & system settings</p>
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <Button type="submit" className="w-full h-12 text-base" data-testid="button-role-next">
                      Next <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-muted" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>

                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full h-12 border-muted"
                      onClick={handleGoogleLogin}
                      data-testid="button-register-google"
                    >
                      <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                      </svg>
                      Google
                    </Button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="name" 
                          placeholder="Enter your full name" 
                          className="pl-10 bg-card" 
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          required 
                          data-testid="input-register-name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="mobile" 
                          type="tel" 
                          placeholder="+91 98765 43210" 
                          className="pl-10 bg-card" 
                          value={formData.mobile}
                          onChange={(e) => handleInputChange("mobile", e.target.value)}
                          required 
                          data-testid="input-register-mobile"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="you@example.com" 
                          className="pl-10 bg-card" 
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required 
                          data-testid="input-register-email"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender" className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Gender
                        {formData.userType !== "owner" && <span className="text-red-500">*</span>}
                      </Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value: "male" | "female" | "other") => 
                          setFormData(prev => ({ ...prev, gender: value }))
                        }
                      >
                        <SelectTrigger id="gender" className="bg-card h-11" data-testid="select-register-gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.userType !== "owner" && (
                        <p className="text-xs text-muted-foreground">Required for matching you with appropriate PGs</p>
                      )}
                    </div>

                    {formData.userType === "owner" && (
                      <>
                        {/* PG Location & Image Section */}
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
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

                        <div className="h-px bg-border my-6" />

                        {/* Basic Information Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Building2 className="h-4 w-4 text-primary" />
                            <span>Basic Information</span>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="pgName" className="flex items-center gap-1.5">
                              <Home className="h-3.5 w-3.5" />
                              PG Name
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="pgName"
                              placeholder="e.g., Sunshine PG, Green Valley Hostel"
                              className="bg-card h-11"
                              value={formData.pgName}
                              onChange={(e) => handleInputChange("pgName", e.target.value)}
                              required
                              data-testid="input-register-pg-name"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="totalRooms" className="flex items-center gap-1.5">
                                <Grid3x3 className="h-3.5 w-3.5" />
                                Total Rooms
                              </Label>
                              <Input
                                id="totalRooms"
                                type="number"
                                placeholder="e.g., 10"
                                className="bg-card h-11"
                                value={formData.totalRooms}
                                onChange={(e) => handleInputChange("totalRooms", e.target.value)}
                                data-testid="input-register-total-rooms"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="pgType" className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                PG Type
                                <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={formData.pgType}
                                onValueChange={(value: "common" | "boys" | "girls") => 
                                  setFormData(prev => ({ ...prev, pgType: value }))
                                }
                              >
                                <SelectTrigger id="pgType" className="bg-card h-11" data-testid="select-register-pg-type">
                                  <SelectValue placeholder="Select type" />
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

                        <div className="h-px bg-border my-6" />

                        {/* Registration Documents Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <FileCheck className="h-4 w-4 text-primary" />
                            <span>Registration Documents</span>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="registrationNumber" className="flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5" />
                              Registration Number
                            </Label>
                            <Input
                              id="registrationNumber"
                              placeholder="e.g., REG123456789"
                              className="bg-card h-11"
                              value={formData.registrationNumber}
                              onChange={(e) => handleInputChange("registrationNumber", e.target.value)}
                              data-testid="input-register-registration-number"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="registrationDocument">Registration Document</Label>
                            <Card className="p-3 bg-muted/30 border-dashed">
                              <input
                                id="registrationDocument"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleRegistrationDocumentUpload}
                                className="hidden"
                                data-testid="input-register-registration-document"
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant={registrationFile || formData.registrationDocumentUrl ? "secondary" : "outline"}
                                  className="flex-1 h-10"
                                  onClick={() => document.getElementById('registrationDocument')?.click()}
                                  disabled={isLoading}
                                  data-testid="button-register-upload-registration"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  {registrationFile || formData.registrationDocumentUrl ? "Change Document" : "Upload Document"}
                                </Button>
                                {(registrationFile || formData.registrationDocumentUrl) && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10"
                                    onClick={() => window.open(registrationFile ? URL.createObjectURL(registrationFile) : formData.registrationDocumentUrl, '_blank')}
                                    data-testid="button-register-view-registration"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              {(registrationFile || formData.registrationDocumentUrl) && (
                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {registrationFile ? `${registrationFile.name} selected` : "Document uploaded successfully"}
                                </p>
                              )}
                            </Card>
                          </div>
                        </div>

                        <div className="h-px bg-border my-6" />

                        {/* Amenities Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span>Amenities</span>
                          </div>

                          <Card className="p-4 bg-card border">
                            <div className="max-h-[240px] overflow-y-auto pr-2 space-y-2.5">
                              {amenities.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Loading amenities...</p>
                              ) : (
                                <div className="grid grid-cols-1 gap-2.5">
                                  {amenities.map((amenity) => (
                                    <Card 
                                      key={amenity.id} 
                                      className={cn(
                                        "p-3 cursor-pointer transition-all hover:shadow-sm",
                                        formData.amenityIds.includes(amenity.id) 
                                          ? "bg-primary/5 border-primary/30 shadow-sm" 
                                          : "bg-background hover:bg-muted/50"
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleAmenity(amenity.id);
                                      }}
                                    >
                                      <div className="flex items-center gap-3">
                                        <Checkbox
                                          checked={formData.amenityIds.includes(amenity.id)}
                                          data-testid={`checkbox-register-amenity-${amenity.id}`}
                                          className="pointer-events-none"
                                        />
                                        <div className="text-sm font-medium leading-none flex-1 flex items-center gap-2">
                                          {amenity.name}
                                          {amenity.requiresCertificate && (
                                            <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200">
                                              FSSAI Required
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
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Check className="h-3.5 w-3.5 text-green-600" />
                              {formData.amenityIds.length} {formData.amenityIds.length === 1 ? 'amenity' : 'amenities'} selected
                            </div>
                          )}
                        </div>

                        {/* FSSAI Certificate Section (conditional) */}
                        {amenities.filter(a => a.requiresCertificate && formData.amenityIds.includes(a.id)).length > 0 && (
                          <>
                            <div className="h-px bg-border my-6" />
                            
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Award className="h-4 w-4 text-primary" />
                                <span>FSSAI Certificate</span>
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="fssaiCertificate" className="text-xs text-muted-foreground">
                                  Required for food-related amenities
                                </Label>
                                <Card className="p-3 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50">
                                  <input
                                    id="fssaiCertificate"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFssaiCertificateUpload}
                                    className="hidden"
                                    data-testid="input-register-fssai-certificate"
                                  />
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant={fssaiFile || formData.fssaiCertificateUrl ? "secondary" : "default"}
                                      className="flex-1 h-10"
                                      onClick={() => document.getElementById('fssaiCertificate')?.click()}
                                      disabled={isLoading}
                                      data-testid="button-register-upload-fssai"
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      {fssaiFile || formData.fssaiCertificateUrl ? "Change Certificate" : "Upload Certificate"}
                                    </Button>
                                    {(fssaiFile || formData.fssaiCertificateUrl) && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10"
                                        onClick={() => window.open(fssaiFile ? URL.createObjectURL(fssaiFile) : formData.fssaiCertificateUrl, '_blank')}
                                        data-testid="button-register-view-fssai"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                  {(fssaiFile || formData.fssaiCertificateUrl) && (
                                    <p className="text-xs text-green-700 dark:text-green-400 mt-2 flex items-center gap-1">
                                      <Check className="h-3 w-3" />
                                      {fssaiFile ? `${fssaiFile.name} selected` : "Certificate uploaded successfully"}
                                    </p>
                                  )}
                                </Card>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full h-12 text-base" disabled={isLoading} data-testid="button-details-next">
                      {isLoading ? "Processing..." : <>Next <ArrowRight className="ml-2 w-4 h-4" /></>}
                    </Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Create Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Min 8 characters" 
                          className="pl-10 pr-10 bg-card" 
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          required 
                          data-testid="input-register-password"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="confirmPassword" 
                          type="password" 
                          placeholder="Re-enter password" 
                          className="pl-10 bg-card" 
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          required 
                          data-testid="input-register-confirmpassword"
                        />
                      </div>
                    </div>

                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                      <li>At least 8 characters long</li>
                      <li>Contains at least one number</li>
                      <li>Contains at least one special character</li>
                    </ul>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full h-12 text-base" disabled={isLoading} data-testid="button-register-sendotp">
                      {isLoading ? "Processing..." : "Send OTP"}
                    </Button>
                  </div>
                </>
              )}

              {step === 4 && (
                <div className="text-center space-y-6">
                  <div>
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-xl">Verify your Account</h3>
                    <p className="text-muted-foreground text-sm mt-2">
                      We've sent a 6-digit code to<br/>
                      <span className="font-medium text-foreground">{formData.email}</span> and <span className="font-medium text-foreground">{formData.mobile}</span>
                    </p>
                  </div>

                  <div className="flex justify-center gap-2">
                    {otp.map((digit, idx) => (
                      <Input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        className="w-10 h-12 text-center text-lg font-bold bg-card"
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          handleOtpChange(idx, val);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !digit && idx > 0) {
                            const prevInput = document.getElementById(`otp-${idx - 1}`);
                            prevInput?.focus();
                          }
                        }}
                        data-testid={`input-otp-${idx}`}
                      />
                    ))}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Didn't receive code? <button type="button" className="text-primary font-medium hover:underline" data-testid="button-resend-otp">Resend</button>
                  </div>

                  <Button type="submit" className="w-full h-12 text-base" disabled={isLoading} data-testid="button-register-verify">
                    {isLoading ? "Verifying..." : "Verify & Register"}
                  </Button>
                </div>
              )}
            </motion.form>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
