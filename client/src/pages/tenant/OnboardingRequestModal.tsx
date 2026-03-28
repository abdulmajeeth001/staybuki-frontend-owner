import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { 
  Upload, 
  X as XIcon, 
  Loader2, 
  User, 
  FileText, 
  Phone, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Briefcase,
  AlertCircle as AlertCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { applicantService } from "@/services/applicantService";
import type { RoomDetailsResponse, CreateOnboardingRequest } from "@/types/applicant";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface OnboardingRequestModalProps {
  open: boolean;
  onClose: () => void;
  visitRequestId?: number;
  pgId?: number;
  roomId?: number;
}

const RELATIONSHIP_OPTIONS = [
  { value: "Father", label: "Father" },
  { value: "Mother", label: "Mother" },
  { value: "Sibling", label: "Sibling" },
  { value: "Spouse", label: "Spouse" },
  { value: "Friend", label: "Friend" },
  { value: "Other", label: "Other" },
];

const PROFESSION_OPTIONS = [
  { value: "Student", label: "Student" },
  { value: "Employee", label: "Employee" },
  { value: "Entrepreneur", label: "Entrepreneur" },
  { value: "Business", label: "Business" },
  { value: "Freelancer", label: "Freelancer" },
  { value: "Other", label: "Other" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const STEPS = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Documents", icon: FileText },
  { id: 3, title: "Emergency Contact", icon: Phone },
  { id: 4, title: "Review", icon: CheckCircle2 },
];

const onboardingSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { required_error: "Please select your gender" }),
  monthlyRent: z.number().nullable(),
  advanceAmount: z.number().nullable(),
  tenantImage: z.instanceof(File).nullable(),
  aadharCard: z.instanceof(File).nullable(),
  profession: z.string().optional(),
  professionIdDoc: z.instanceof(File).nullable(),
  emergencyContactName: z.string().min(2, { message: "Contact name is required" }),
  emergencyContactPhone: z.string().min(10, { message: "Valid phone number is required" }),
  emergencyContactRelationship: z.string().min(1, { message: "Relationship is required" }),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const stepFields: (keyof OnboardingFormData)[][] = [
  ["name", "email", "phone", "gender"],
  [], // No required fields for documents step
  ["emergencyContactName", "emergencyContactPhone", "emergencyContactRelationship"],
];

export default function OnboardingRequestModal({
  open,
  onClose,
  visitRequestId,
  pgId,
  roomId,
}: OnboardingRequestModalProps) {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const [currentStep, setCurrentStep] = useState(1);

  // Preview states
  const [tenantImagePreview, setTenantImagePreview] = useState<string | null>(null);
  const [aadharCardPreview, setAadharCardPreview] = useState<string | null>(null);
  const [professionIdPreview, setProfessionIdPreview] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      gender: undefined as any,
      monthlyRent: null,
      advanceAmount: null,
      profession: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
    },
  });

  const watchedValues = watch();

  // Fetch room details to get monthly rent
  const { data: roomData } = useQuery<RoomDetailsResponse | null>({
    queryKey: ["tenant-room-details", roomId],
    queryFn: () => (roomId ? applicantService.getRoomDetails(roomId) : null),
    enabled: !!roomId && open,
  });

  // Pre-fill user data when modal opens
  useEffect(() => {
    if (open && user) {
      setValue("name", user.name || "");
      setValue("email", user.email || "");
      setValue("phone", user.mobile || "");
      if (user.gender) {
        setValue("gender", user.gender.toUpperCase() as "MALE" | "FEMALE" | "OTHER");
      }
    }
  }, [open, user, setValue]);

  // Set monthly rent and advance amount from room data
  useEffect(() => {
    if (roomData) {
      if ((roomData as any).monthlyRent) {
        setValue("monthlyRent", parseFloat((roomData as any).monthlyRent));
      }
      if ((roomData as any).advanceAmount) {
        setValue("advanceAmount", parseFloat((roomData as any).advanceAmount));
      }
    }
  }, [roomData, setValue]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      reset();
      setTenantImagePreview(null);
      setAadharCardPreview(null);
      setProfessionIdPreview(null);
    }
  }, [open]);

  // Create onboarding request mutation
  const createOnboardingMutation = useMutation({
    mutationFn: (formData: FormData) => applicantService.createOnboardingRequest(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantVisitRequests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/onboarding-requests"] });
      toast({
        title: "Success",
        description: "Your onboarding request has been submitted successfully! The owner will review it shortly.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to submit onboarding request",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (
    file: File,
    fieldName: keyof OnboardingFormData,
    setPreview: (value: string | null) => void
  ) => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setValue(fieldName, file, { shouldValidate: true });
      setPreview(base64String);
    };
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleNext = async () => {
    const fieldsToValidate = stepFields[currentStep - 1];
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const onSubmit = (data: OnboardingFormData) => {
    if (!pgId || !roomId || !data.monthlyRent) {
      toast({
        title: "Missing Information",
        description: "Room information is required",
        variant: "destructive",
      });
      return;
    }
    const formData = new FormData();

    // Append the DTO as a JSON string under the 'req' part
    const dto: CreateOnboardingRequest = {
      visitRequestId: visitRequestId, // Can be undefined, backend handles it
      pgId: pgId,
      roomId: roomId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
      monthlyRent: data.monthlyRent,
      advanceAmount: data.advanceAmount,
      profession: data.profession,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      emergencyContactRelationship: data.emergencyContactRelationship,
    };
    formData.append("req", new Blob([JSON.stringify(dto)], { type: "application/json" }));

    // Append files if they exist
    if (data.tenantImage) {
      formData.append("tenantImage", data.tenantImage);
    }
    if (data.aadharCard) {
      formData.append("aadharCard", data.aadharCard);
    }
    if (data.professionIdDoc) {
      formData.append("professionIdDoc", data.professionIdDoc);
    }

    createOnboardingMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-onboarding">
        {/* Header with Gradient */}
        <DialogHeader className="relative pb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Request Onboarding
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Complete your profile to join this PG
              </DialogDescription>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between gap-2 mt-6">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                        isCompleted
                          ? "bg-gradient-to-br from-green-500 to-emerald-600 border-green-500"
                          : isActive
                          ? "bg-gradient-to-br from-purple-600 to-blue-600 border-purple-600"
                          : "bg-gray-100 border-gray-300"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <Icon
                          className={cn(
                            "w-5 h-5",
                            isActive ? "text-white" : "text-gray-400"
                          )}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-2 font-medium",
                        isActive || isCompleted ? "text-gray-800" : "text-gray-400"
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 transition-colors duration-300",
                        currentStep > step.id
                          ? "bg-gradient-to-r from-green-500 to-emerald-600"
                          : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        {/* Form Steps */}
        <div className="mt-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="relative p-5 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
                <h3 className="relative font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Personal Information
                </h3>
                
                <div className="relative space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Your full name"
                      className="mt-1 border-2 focus:border-purple-400 bg-white"
                      data-testid="input-name"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <AlertCircleIcon className="w-3 h-3" /> {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="your.email@example.com"
                      className="mt-1 border-2 focus:border-purple-400 bg-white"
                      data-testid="input-email"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <AlertCircleIcon className="w-3 h-3" /> {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register("phone")}
                      placeholder="Your phone number"
                      className="mt-1 border-2 focus:border-purple-400 bg-white"
                      data-testid="input-phone"
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <AlertCircleIcon className="w-3 h-3" /> {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger
                            id="gender"
                            className="mt-1 border-2 focus:border-purple-400 bg-white"
                            data-testid="select-gender"
                          >
                            <SelectValue placeholder="Select your gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.gender && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <AlertCircleIcon className="w-3 h-3" /> {errors.gender.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="monthly-rent" className="text-sm font-semibold text-gray-700">
                      Monthly Rent
                    </Label>
                    <Input
                      id="monthly-rent"
                      type="number"
                      value={watchedValues.monthlyRent || ""}
                      disabled
                      readOnly
                      placeholder="Loading..."
                      className="mt-1 bg-gray-50 border-2"
                      data-testid="input-rent"
                    />
                    <p className="text-xs text-gray-600 mt-1.5">
                      This value is set by the room configuration
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="advance-amount" className="text-sm font-semibold text-gray-700">
                      Advance Amount
                    </Label>
                    <Input
                      id="advance-amount"
                      type="number"
                      value={watchedValues.advanceAmount || ""}
                      disabled
                      readOnly
                      placeholder="Loading..."
                      className="mt-1 bg-gray-50 border-2"
                      data-testid="input-advance"
                    />
                    <p className="text-xs text-gray-600 mt-1.5">
                      This value is set by the room configuration
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="relative p-5 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
                <h3 className="relative font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Upload Documents
                </h3>
                
                <div className="relative space-y-5">
                  {/* Tenant Photo */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Your Photo (Optional)
                    </Label>
                    <div className="mt-2">
                      {tenantImagePreview ? (
                        <div className="relative inline-block">
                          <img
                            src={tenantImagePreview}
                            alt="Tenant"
                            className="w-40 h-40 object-cover rounded-xl border-2 border-purple-200 shadow-lg"
                            data-testid="img-tenant-preview"
                          />
                          <Button
                            type="button"
                            size="icon"
                            className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg"
                            onClick={() => {
                              setTenantImage(null);
                              setTenantImagePreview(null);
                            }}
                            data-testid="button-remove-tenant-photo"
                          >
                            <XIcon className="h-4 w-4 text-white" />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Input
                            id="tenant-photo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, "tenantImage", setTenantImagePreview);
                              }
                            }}
                            className="hidden"
                            data-testid="input-tenant-photo"
                          />
                          <Label
                            htmlFor="tenant-photo"
                            className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-purple-300 rounded-xl cursor-pointer hover:bg-purple-50 transition-all duration-300 bg-white group"
                          >
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <Upload className="w-8 h-8 text-purple-600" />
                            </div>
                            <div className="text-center">
                              <span className="text-sm font-semibold text-gray-700 block">
                                Upload Photo
                              </span>
                              <span className="text-xs text-gray-500 mt-1 block">
                                Maximum 5MB
                              </span>
                            </div>
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Aadhar/ID Card */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Aadhar/ID Card (Optional)
                    </Label>
                    <div className="mt-2">
                      {aadharCardPreview ? (
                        <div className="relative inline-block">
                          <img
                            src={aadharCardPreview}
                            alt="Aadhar Card"
                            className="w-56 h-40 object-cover rounded-xl border-2 border-blue-200 shadow-lg"
                            data-testid="img-aadhar-preview"
                          />
                          <Button
                            type="button"
                            size="icon"
                            className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg"
                            onClick={() => {
                              setAadharCard(null);
                              setAadharCardPreview(null);
                            }}
                            data-testid="button-remove-aadhar"
                          >
                            <XIcon className="h-4 w-4 text-white" />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Input
                            id="aadhar-card"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, "aadharCard", setAadharCardPreview);
                              }
                            }}
                            className="hidden"
                            data-testid="input-aadhar-card"
                          />
                          <Label
                            htmlFor="aadhar-card"
                            className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer hover:bg-blue-50 transition-all duration-300 bg-white group"
                          >
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <Upload className="w-8 h-8 text-blue-600" />
                            </div>
                            <div className="text-center">
                              <span className="text-sm font-semibold text-gray-700 block">
                                Upload ID Card
                              </span>
                              <span className="text-xs text-gray-500 mt-1 block">
                                Maximum 5MB
                              </span>
                            </div>
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profession Section */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Profession (Optional)
                    </Label>
                    <Controller
                      name="profession"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="border-2 focus:border-blue-400 bg-white">
                            <SelectValue placeholder="Select your profession" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROFESSION_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Profession ID Card */}
                  {watchedValues.profession && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        {watchedValues.profession === "Student" ? "Student ID Card" : watchedValues.profession === "Employee" ? "Employee ID Card" : "Profession ID/Proof"} (Optional)
                      </Label>
                      <div className="mt-2">
                        {professionIdPreview ? (
                          <div className="relative inline-block">
                            <img
                              src={professionIdPreview}
                              alt="Profession ID Card"
                              className="w-56 h-40 object-cover rounded-xl border-2 border-indigo-200 shadow-lg"
                            />
                            <Button
                              type="button"
                              size="icon"
                              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg"
                              onClick={() => {
                                setValue("professionIdDoc", null);
                                setProfessionIdPreview(null);
                              }}
                            >
                              <XIcon className="h-4 w-4 text-white" />
                            </Button>
                          </div>
                        ) : (
                          <div className="relative">
                            <Input
                              id="profession-id"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(file, "professionIdDoc", setProfessionIdPreview);
                                }
                              }}
                              className="hidden"
                            />
                            <Label
                              htmlFor="profession-id"
                              className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer hover:bg-indigo-50 transition-all duration-300 bg-white group"
                            >
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Briefcase className="w-8 h-8 text-indigo-600" />
                              </div>
                              <div className="text-center">
                                <span className="text-sm font-semibold text-gray-700 block">
                                  Upload ID Card
                                </span>
                                <span className="text-xs text-gray-500 mt-1 block">
                                  Maximum 5MB
                                </span>
                              </div>
                            </Label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Emergency Contact */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="relative p-5 rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(251,146,60,0.1),rgba(255,255,255,0))]" />
                <h3 className="relative font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-orange-600" />
                  Emergency Contact
                </h3>
                
                <div className="relative space-y-4">
                  <div>
                    <Label htmlFor="emergency-name" className="text-sm font-semibold text-gray-700">
                      Contact Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="emergency-name"
                      {...register("emergencyContactName")}
                      placeholder="Emergency contact name"
                      className="mt-1 border-2 focus:border-orange-400 bg-white"
                      data-testid="input-emergency-name"
                    />
                    {errors.emergencyContactName && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <AlertCircleIcon className="w-3 h-3" /> {errors.emergencyContactName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="emergency-phone" className="text-sm font-semibold text-gray-700">
                      Contact Phone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="emergency-phone"
                      type="tel"
                      {...register("emergencyContactPhone")}
                      placeholder="Emergency contact phone"
                      className="mt-1 border-2 focus:border-orange-400 bg-white"
                      data-testid="input-emergency-phone"
                    />
                    {errors.emergencyContactPhone && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <AlertCircleIcon className="w-3 h-3" /> {errors.emergencyContactPhone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="emergency-relationship" className="text-sm font-semibold text-gray-700">
                      Relationship <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="emergencyContactRelationship"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger
                            id="emergency-relationship"
                            className="mt-1 border-2 focus:border-orange-400 bg-white"
                            data-testid="select-relationship"
                          >
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            {RELATIONSHIP_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value} data-testid={`relationship-${option.value.toLowerCase()}`}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.emergencyContactRelationship && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <AlertCircleIcon className="w-3 h-3" /> {errors.emergencyContactRelationship.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="relative p-5 rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.1),rgba(255,255,255,0))]" />
                <h3 className="relative font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Review Your Information
                </h3>
                
                <div className="relative space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium text-gray-800">{watchedValues.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-800">{watchedValues.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium text-gray-800">{watchedValues.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-medium text-gray-800">{watchedValues.gender ? watchedValues.gender.charAt(0) + watchedValues.gender.slice(1).toLowerCase() : ''}</span>
                      </div>
                      {watchedValues.monthlyRent && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monthly Rent:</span>
                          <span className="font-bold text-purple-600">₹{watchedValues.monthlyRent.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    {watchedValues.advanceAmount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Advance Amount:</span>
                        <span className="font-bold text-purple-600">₹{watchedValues.advanceAmount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                  {watchedValues.profession && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profession:</span>
                      <span className="font-medium text-gray-800">{watchedValues.profession}</span>
                    </div>
                  )}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Documents</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex flex-col gap-2">
                        <span className="text-gray-600">Your Photo:</span>
                        {tenantImagePreview ? (
                          <img
                            src={tenantImagePreview}
                            alt="Tenant Photo Preview"
                            className="w-24 h-24 object-cover rounded-md border border-gray-200"
                          />
                        ) : (
                          <span className="font-medium text-gray-400">Not uploaded</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-gray-600">ID Card:</span>
                        {aadharCardPreview ? (
                          <img
                            src={aadharCardPreview}
                            alt="Aadhar Card Preview"
                            className="w-32 h-24 object-cover rounded-md border border-gray-200"
                          />
                        ) : (
                          <span className="font-medium text-gray-400">Not uploaded</span>
                        )}
                      </div>
                  {watchedValues.profession && (
                    <div className="flex flex-col gap-2">
                      <span className="text-gray-600">{watchedValues.profession} ID:</span>
                      {professionIdPreview ? (
                        <img
                          src={professionIdPreview}
                          alt="Profession ID Preview"
                          className="w-32 h-24 object-cover rounded-md border border-gray-200"
                        />
                      ) : (
                        <span className="font-medium text-gray-400">Not uploaded</span>
                      )}
                    </div>
                  )}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Emergency Contact</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium text-gray-800">{watchedValues.emergencyContactName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium text-gray-800">{watchedValues.emergencyContactPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Relationship:</span>
                        <span className="font-medium text-gray-800">{watchedValues.emergencyContactRelationship}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6 pt-6 border-t-2">
          {currentStep > 1 && (
            <Button
              onClick={handleBack}
              variant="outline"
              className="border-2"
              disabled={createOnboardingMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          
          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={createOnboardingMutation.isPending}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
              data-testid="button-submit"
            >
              {createOnboardingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          )}

          <Button
            onClick={onClose}
            variant="outline"
            className="border-2"
            disabled={createOnboardingMutation.isPending}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
