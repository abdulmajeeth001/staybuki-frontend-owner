import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  IndianRupee,
  FileText,
  Eye,
  UserCheck,
  UserX,
  Users,
  ClipboardCheck,
  FileCheck,
  Star,
  Calendar,
  History,
  Bed,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { usePG } from "@/hooks/use-pg";
import { api } from "@/apiClient";

interface TenantHistory {
  id: number;
  pgName?: string;
  pgAddress?: string;
  roomNumber?: string;
  moveInDate: string;
  moveOutDate: string;
  ownerFeedback?: string;
  rating?: number;
  behaviorTags?: string[];
  ownerName?: string;
}

interface OnboardingRequest {
  id: number;
  tenantUserId: number;
  visitRequestId?: number;
  pgId: number;
  pgName?: string;
  roomId: number;
  roomNumber?: string;
  name: string;
  email: string;
  phone: string;
  monthlyRent: string;
  tenantImage?: string;
  aadharCard?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  tenantHistory?: TenantHistory[];
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: AlertCircle,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
};

export default function OwnerOnboardingRequestsPage() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const queryClient = useQueryClient();
  const { pg, isLoading: pgLoading } = usePG();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent">("recent");
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    request?: OnboardingRequest;
  }>({ open: false });
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    request?: OnboardingRequest;
    reason: string;
  }>({ open: false, reason: "" });
  const [imagePreview, setImagePreview] = useState<{
    open: boolean;
    src?: string;
    title?: string;
  }>({ open: false });
  const [bedSelectDialog, setBedSelectDialog] = useState<{
    open: boolean;
    request?: OnboardingRequest;
    beds: Array<{ id: number; position: string; status: string; displayOrder: number }>;
    selectedBedId: number | null;
    loading: boolean;
  }>({ open: false, beds: [], selectedBedId: null, loading: false });

  // Fetch onboarding requests
  const { data: onboardingRequests = [], isLoading, error } = useQuery<OnboardingRequest[]>({
    queryKey: ["/api/owner/onboarding-requests"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/owner/onboarding-requests");
        const responseData = res.data;
        if (responseData && !Array.isArray(responseData)) {
          return responseData.data || responseData.content || responseData.requests || [];
        }
        return Array.isArray(responseData) ? responseData : [];
      } catch (err: any) {
        throw new Error(err.response?.data?.error || err.message || "Failed to fetch onboarding requests");
      }
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, bedId }: { id: number; bedId?: number }) => {
      const res = await api.post(`/api/owner/onboarding-requests/${id}/approve`, { bedId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/onboarding-requests"] });
      setBedSelectDialog({ open: false, beds: [], selectedBedId: null, loading: false });
      toast.success("Onboarding request approved successfully. Tenant has been added.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || "Failed to approve onboarding request");
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await api.post(`/api/owner/onboarding-requests/${id}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/onboarding-requests"] });
      setRejectDialog({ open: false, reason: "" });
      toast.success("Onboarding request rejected. Tenant has been notified.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || "Failed to reject onboarding request");
    },
  });

  const handleApprove = async (request: OnboardingRequest) => {
    try {
      const res = await api.get(`/api/rooms/${request.roomId}/beds`);
      const beds = res.data;
      const availableBeds = beds.filter((b: any) => b.status === "available");
      if (availableBeds.length > 0) {
        setBedSelectDialog({
          open: true,
          request,
          beds: availableBeds,
          selectedBedId: null,
          loading: false,
        });
        return;
      }
    } catch (err) {
      console.error("Error fetching beds:", err);
    }
    approveMutation.mutate({ id: request.id });
  };

  const handleConfirmApprove = () => {
    if (!bedSelectDialog.request) return;
    approveMutation.mutate({
      id: bedSelectDialog.request.id,
      bedId: bedSelectDialog.selectedBedId || undefined,
    });
  };

  const handleReject = () => {
    if (!rejectDialog.request || !rejectDialog.reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    rejectMutation.mutate({
      id: rejectDialog.request.id,
      reason: rejectDialog.reason,
    });
  };

  const openRejectDialog = (request: OnboardingRequest) => {
    setRejectDialog({ open: true, request, reason: "" });
  };

  const openDetailsDialog = (request: OnboardingRequest) => {
    setDetailsDialog({ open: true, request });
  };

  const openImagePreview = (src: string, title: string) => {
    setImagePreview({ open: true, src, title });
  };

  const filteredRequests = (Array.isArray(onboardingRequests) ? onboardingRequests : [])
    .filter((req) => {
      if (statusFilter === "all") return true;
      return req.status === statusFilter;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const counts = {
    all: onboardingRequests.length,
    pending: onboardingRequests.filter((r) => r.status === "pending").length,
    approved: onboardingRequests.filter((r) => r.status === "approved").length,
    rejected: onboardingRequests.filter((r) => r.status === "rejected").length,
  };

  const layoutProps = isMobile ? {} : { showNav: true };

  if (pgLoading) {
    return (
      <Layout title="Onboarding Requests" {...layoutProps}>
        <div className={cn("flex items-center justify-center", isMobile ? "min-h-[50vh]" : "py-16")}>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
            <ClipboardCheck className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!pg) {
    return (
      <Layout title="Onboarding Requests" {...layoutProps}>
        <div className={cn("text-center", isMobile ? "py-16 px-4" : "py-16")}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2" data-testid={`text-no-pg${isMobile ? "-mobile" : ""}`}>
            No PG Selected
          </h3>
          <p className="text-sm text-muted-foreground">
            Please select a PG to view onboarding requests
          </p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Onboarding Requests" {...layoutProps}>
        <div className={cn("text-center", isMobile ? "py-16 px-4" : "py-16")}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2" data-testid={`text-error${isMobile ? "-mobile" : ""}`}>
            {error.message === "Owner access required" ? "Owner Access Required" : "Failed to load onboarding requests"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {error.message === "Owner access required"
              ? "Only owners can access this page."
              : error.message || "Please try again later"}
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Onboarding Requests" {...layoutProps}>
      <OwnerOnboardingRequestsContent
        requests={onboardingRequests}
        filteredRequests={filteredRequests}
        counts={counts}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        detailsDialog={detailsDialog}
        setDetailsDialog={setDetailsDialog}
        openDetailsDialog={openDetailsDialog}
        rejectDialog={rejectDialog}
        setRejectDialog={setRejectDialog}
        openRejectDialog={openRejectDialog}
        handleReject={handleReject}
        rejectMutation={rejectMutation}
        bedSelectDialog={bedSelectDialog}
        setBedSelectDialog={setBedSelectDialog}
        handleApprove={handleApprove}
        handleConfirmApprove={handleConfirmApprove}
        approveMutation={approveMutation}
        imagePreview={imagePreview}
        setImagePreview={setImagePreview}
        openImagePreview={openImagePreview}
        isLoading={isLoading}
        isDesktop={!isMobile}
      />
    </Layout>
  );
}

interface OwnerOnboardingRequestsContentProps {
  requests: OnboardingRequest[];
  filteredRequests: OnboardingRequest[];
  counts: Record<string, number>;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  sortBy: string;
  setSortBy: (v: "recent") => void;
  detailsDialog: any;
  setDetailsDialog: any;
  openDetailsDialog: (r: OnboardingRequest) => void;
  rejectDialog: any;
  setRejectDialog: any;
  openRejectDialog: (r: OnboardingRequest) => void;
  handleReject: () => void;
  rejectMutation: any;
  bedSelectDialog: any;
  setBedSelectDialog: any;
  handleApprove: (r: OnboardingRequest) => void;
  handleConfirmApprove: () => void;
  approveMutation: any;
  imagePreview: any;
  setImagePreview: any;
  openImagePreview: (src: string, title: string) => void;
  isLoading: boolean;
  isDesktop: boolean;
}

function OwnerOnboardingRequestsContent({
  requests,
  filteredRequests,
  counts,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  detailsDialog,
  setDetailsDialog,
  openDetailsDialog,
  rejectDialog,
  setRejectDialog,
  openRejectDialog,
  handleReject,
  rejectMutation,
  bedSelectDialog,
  setBedSelectDialog,
  handleApprove,
  handleConfirmApprove,
  approveMutation,
  imagePreview,
  setImagePreview,
  openImagePreview,
  isLoading,
  isDesktop,
}: OwnerOnboardingRequestsContentProps) {
  
  const statCards = [
    { id: "total", label: isDesktop ? "Total Requests" : "Total", count: counts.all, icon: Users, gradient: "from-blue-500 to-cyan-600", textGradient: "from-blue-600 to-cyan-600" },
    { id: "pending", label: isDesktop ? "Pending Review" : "Pending", count: counts.pending, icon: ClipboardCheck, gradient: "from-orange-500 to-red-600", textGradient: "from-orange-600 to-red-600" },
    { id: "approved", label: "Approved", count: counts.approved, icon: UserCheck, gradient: "from-emerald-500 to-green-600", textGradient: "from-emerald-600 to-green-600" },
    { id: "rejected", label: "Rejected", count: counts.rejected, icon: UserX, gradient: "from-purple-500 to-pink-600", textGradient: "from-purple-600 to-pink-600" },
  ];

  return (
    <div className={cn(isDesktop ? "max-w-7xl mx-auto" : "space-y-4 pb-20")}>
      {/* Hero Section */}
      <div className={cn("relative overflow-hidden", isDesktop ? "-mx-6 -mt-6 mb-8 rounded-b-3xl" : "hidden")}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="relative px-8 py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2" data-testid="title-onboarding-requests">
                Onboarding Requests
              </h2>
              <p className="text-white/80 text-sm">
                Review and approve tenant onboarding applications
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={cn(isDesktop ? "space-y-6" : "")}>
        {/* Stat Cards */}
        <div className={cn("grid", isDesktop ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" : "grid-cols-2 gap-3")}>
          {statCards.map((stat) => (
            <Card key={stat.id} className={cn(isDesktop ? "group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" : "border-2 overflow-hidden")} data-testid={`card-stat-${stat.id}${isDesktop ? '' : '-mobile'}`}>
              {isDesktop && <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />}
              <CardContent className={cn("relative", isDesktop ? "p-6" : "p-4")}>
                <div className={cn("flex items-center", isDesktop ? "justify-between mb-4" : "gap-2 mb-3")}>
                  <div className={cn("rounded-xl flex items-center justify-center shadow-md", `bg-gradient-to-br ${stat.gradient}`, isDesktop ? "w-14 h-14 group-hover:scale-110 transition-transform" : "w-10 h-10")}>
                    <stat.icon className={cn("text-white", isDesktop ? "w-7 h-7" : "w-5 h-5")} />
                  </div>
                </div>
                <div>
                  <p className={cn("text-muted-foreground font-medium", isDesktop ? "text-sm mb-1" : "text-xs mb-1")}>{stat.label}</p>
                  <p className={cn("font-bold bg-gradient-to-r bg-clip-text text-transparent", `bg-gradient-to-r ${stat.textGradient}`, isDesktop ? "text-3xl" : "text-2xl")} data-testid={`stat-${stat.id}${isDesktop ? '' : '-mobile'}`}>
                    {stat.count}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Controls */}
        {isDesktop ? (
          <Card className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex gap-2 overflow-x-auto flex-wrap">
                {['all', 'pending', 'approved', 'rejected'].map(filter => (
                  <Button
                    key={filter}
                    variant={statusFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(filter)}
                    className={statusFilter === filter ? cn(
                      filter === "all" && "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
                      filter === "pending" && "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700",
                      filter === "approved" && "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700",
                      filter === "rejected" && "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    ) : ""}
                    data-testid={`filter-${filter}`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)} ({counts[filter as keyof typeof counts]})
                  </Button>
                ))}
              </div>
              <Select value={sortBy} onValueChange={(value: "recent") => setSortBy(value)}>
                <SelectTrigger className="w-[180px]" data-testid="select-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent" data-testid="sort-recent">Most Recent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'pending', 'approved', 'rejected'].map(filter => (
              <Button
                key={filter}
                variant={statusFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(filter)}
                className={cn("rounded-full whitespace-nowrap", statusFilter === filter && cn(
                  filter === "all" && "bg-gradient-to-r from-purple-600 to-blue-600",
                  filter === "pending" && "bg-gradient-to-r from-orange-600 to-red-600",
                  filter === "approved" && "bg-gradient-to-r from-emerald-600 to-green-600",
                  filter === "rejected" && "bg-gradient-to-r from-purple-600 to-pink-600"
                ))}
                data-testid={`filter-${filter}-mobile`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)} ({counts[filter as keyof typeof counts]})
              </Button>
            ))}
          </div>
        )}

        {/* Onboarding Request Cards */}
        {isLoading ? (
          <div className={cn("space-y-4", !isDesktop ? "space-y-3" : "")}>
            {isDesktop && (
              <div className="flex items-center justify-center py-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
                  <ClipboardCheck className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            )}
            <Skeleton className={cn("w-full", isDesktop ? "h-48" : "h-32")} />
            <Skeleton className={cn("w-full", isDesktop ? "h-48" : "h-32")} />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className={cn("text-center", isDesktop ? "py-16" : "py-12 px-4")}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <ClipboardCheck className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className={cn("font-semibold mb-2", isDesktop ? "text-lg" : "text-base")} data-testid={`text-no-requests${isDesktop ? '' : '-mobile'}`}>
              {statusFilter === "all"
                ? "No onboarding requests yet"
                : `No ${statusFilter} requests`}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {statusFilter === "all"
                ? "Requests will appear here"
                : `No ${statusFilter} requests at the moment`}
            </p>
          </div>
        ) : (
          <div className={cn(isDesktop ? "space-y-4" : "space-y-3")}>
            {filteredRequests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status];
              const StatusIcon = statusConfig.icon;

              return (
                <Card 
                  key={request.id} 
                  className={cn("border-2 overflow-hidden relative", isDesktop ? "group hover:shadow-lg transition-all duration-300 border-transparent hover:border-purple-200" : "transition-colors")}
                  data-testid={`card-onboarding-${request.id}${isDesktop ? '' : '-mobile'}`}
                >
                  {isDesktop && <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  
                  {isDesktop ? (
                    <>
                      <CardHeader className="relative">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            {request.tenantImage ? (
                              <img
                                src={request.tenantImage}
                                alt={request.name}
                                className="w-14 h-14 rounded-full object-cover border-2 border-purple-200 cursor-pointer hover:scale-110 transition-transform shadow-md"
                                onClick={() => openImagePreview(request.tenantImage!, "Tenant Photo")}
                                data-testid={`image-tenant-${request.id}`}
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-110 transition-transform">
                                {request.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg" data-testid={`text-tenant-name-${request.id}`}>
                                {request.name}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  <span data-testid={`text-email-${request.id}`}>{request.email}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  <span data-testid={`text-phone-${request.id}`}>{request.phone}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("flex items-center gap-1 font-medium", statusConfig.color)}
                            data-testid={`badge-status-${request.id}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </CardHeader>
                    <CardContent className="space-y-4 relative">
                        {/* PG and Room Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">PG Name</p>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium" data-testid={`text-pg-name-${request.id}`}>
                                {request.pgName || "PG"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Room Number</p>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium" data-testid={`text-room-${request.id}`}>
                                {request.roomNumber || `Room ${request.roomId}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Monthly Rent */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Monthly Rent</p>
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-green-600" />
                            <span className="text-lg font-bold text-green-700" data-testid={`text-rent-${request.id}`}>
                              ₹{parseFloat(request.monthlyRent).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Emergency Contact */}
                        {request.emergencyContactName && (
                          <div className="bg-secondary/50 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-2">Emergency Contact</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <User className="w-3 h-3 text-muted-foreground" />
                                <span data-testid={`text-emergency-name-${request.id}`}>
                                  {request.emergencyContactName}
                                </span>
                              </div>
                              {request.emergencyContactPhone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="w-3 h-3 text-muted-foreground" />
                                  <span data-testid={`text-emergency-phone-${request.id}`}>
                                    {request.emergencyContactPhone}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Document Actions */}
                        <div className="flex gap-2 flex-wrap">
                          {request.aadharCard && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openImagePreview(request.aadharCard!, "Aadhar Card")}
                              className="border-purple-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50"
                              data-testid={`button-view-aadhar-${request.id}`}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Aadhar Card
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetailsDialog(request)}
                            className="border-purple-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50"
                            data-testid={`button-view-details-${request.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Full Details
                          </Button>
                        </div>

                        {/* Rejection Reason */}
                        {request.status === "rejected" && request.rejectionReason && (
                          <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-xs text-red-600 font-medium mb-1">Rejection Reason</p>
                            <p className="text-sm text-red-700" data-testid={`text-rejection-reason-${request.id}`}>
                              {request.rejectionReason}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        {request.status === "pending" && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request)}
                              disabled={approveMutation.isPending}
                              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                              data-testid={`button-approve-${request.id}`}
                            >
                              <UserCheck className="w-4 h-4 mr-2" />
                              Approve Onboarding
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(request)}
                              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                              data-testid={`button-reject-${request.id}`}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {request.status === "approved" && request.approvedAt && (
                          <div className="flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-emerald-50 to-green-50 px-3 py-2 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">
                              Approved on {format(new Date(request.approvedAt), "MMM dd, yyyy")}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </>
                  ) : (
                    // Mobile Card Layout
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        {request.tenantImage ? (
                          <img
                            src={request.tenantImage}
                            alt={request.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                            onClick={() => openImagePreview(request.tenantImage!, "Tenant Photo")}
                            data-testid={`image-tenant-${request.id}-mobile`}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                            {request.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate" data-testid={`text-tenant-name-${request.id}-mobile`}>
                            {request.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn("flex items-center gap-1 font-medium w-fit mt-1", statusConfig.color)}
                            data-testid={`badge-status-${request.id}-mobile`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate" data-testid={`text-email-${request.id}-mobile`}>{request.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span data-testid={`text-phone-${request.id}-mobile`}>{request.phone}</span>
                        </div>
                      </div>

                      {/* Room & Rent */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-secondary/50 p-2 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Room</p>
                          <p className="text-sm font-medium truncate" data-testid={`text-room-${request.id}-mobile`}>
                            {request.roomNumber || `Room ${request.roomId}`}
                          </p>
                        </div>
                        <div className="bg-secondary/50 p-2 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Rent</p>
                          <p className="text-sm font-bold text-green-700" data-testid={`text-rent-${request.id}-mobile`}>
                            ₹{parseFloat(request.monthlyRent).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetailsDialog(request)}
                          className="w-full"
                          data-testid={`button-view-details-${request.id}-mobile`}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>

                        {request.status === "pending" && (
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request)}
                              disabled={approveMutation.isPending}
                              className="bg-gradient-to-r from-emerald-600 to-green-600 text-white"
                              data-testid={`button-approve-${request.id}-mobile`}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(request)}
                              className="bg-gradient-to-r from-red-600 to-pink-600"
                              data-testid={`button-reject-${request.id}-mobile`}
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {request.status === "approved" && request.approvedAt && (
                          <div className="flex items-center gap-2 text-xs font-medium bg-gradient-to-r from-emerald-50 to-green-50 px-3 py-2 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">
                              Approved {format(new Date(request.approvedAt), "MMM dd, yyyy")}
                            </span>
                          </div>
                        )}

                        {request.status === "rejected" && request.rejectionReason && (
                          <div className="bg-red-50 p-2 rounded-lg">
                            <p className="text-xs text-red-600 font-medium mb-1">Rejection Reason</p>
                            <p className="text-xs text-red-700" data-testid={`text-rejection-reason-${request.id}-mobile`}>
                              {request.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Details Dialog */}
        <Dialog
          open={detailsDialog.open}
          onOpenChange={(open) => !open && setDetailsDialog({ open: false })}
        >
          <DialogContent className={cn("overflow-y-auto", isDesktop ? "max-w-2xl max-h-[80vh]" : "max-w-[95vw] max-h-[85vh]")} data-testid={`dialog-details${isDesktop ? '' : '-mobile'}`}>
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
            </DialogHeader>
            {detailsDialog.request && (
              <div className={cn("py-2", isDesktop ? "space-y-4 py-4" : "space-y-4")}>
                <div className={cn("space-y-2", isDesktop ? "space-y-3" : "")}>
                  <h4 className={cn("font-semibold", isDesktop ? "" : "text-sm")}>Tenant Info</h4>
                  <div className={cn("grid gap-3", isDesktop ? "grid-cols-2 gap-4" : "grid-cols-1 text-sm")}>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Name</p>
                      <p className="font-medium">{detailsDialog.request.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Email</p>
                      <p className="break-all">{detailsDialog.request.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Phone</p>
                      <p>{detailsDialog.request.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Rent</p>
                      <p className="font-semibold text-green-700">
                        ₹{parseFloat(detailsDialog.request.monthlyRent).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {isDesktop && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Room Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">PG Name</p>
                        <p className="text-sm font-medium">{detailsDialog.request.pgName || "PG"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Room Number</p>
                        <p className="text-sm font-medium">
                          {detailsDialog.request.roomNumber || `Room ${detailsDialog.request.roomId}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {detailsDialog.request.emergencyContactName && (
                  <div className={cn("space-y-2", isDesktop ? "space-y-3" : "")}>
                    <h4 className={cn("font-semibold", isDesktop ? "" : "text-sm")}>Emergency Contact</h4>
                    <div className={cn("grid gap-3", isDesktop ? "grid-cols-2 gap-4" : "grid-cols-1 text-sm")}>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Name</p>
                        <p className="text-sm">{detailsDialog.request.emergencyContactName}</p>
                      </div>
                      {isDesktop && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Relationship</p>
                          <p className="text-sm">{detailsDialog.request.emergencyContactRelationship || "N/A"}</p>
                        </div>
                      )}
                      {detailsDialog.request.emergencyContactPhone && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Phone</p>
                          <p className="text-sm">{detailsDialog.request.emergencyContactPhone || "N/A"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(detailsDialog.request.tenantImage || detailsDialog.request.aadharCard) && (
                  <div className={cn("space-y-2", isDesktop ? "space-y-3" : "")}>
                    <h4 className={cn("font-semibold", isDesktop ? "" : "text-sm")}>Documents</h4>
                    <div className={cn("grid gap-3", isDesktop ? "grid-cols-2 gap-4" : "grid-cols-1")}>
                      {detailsDialog.request.tenantImage && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Tenant Photo</p>
                          <img
                            src={detailsDialog.request.tenantImage}
                            alt="Tenant"
                            className={cn("w-full object-cover rounded-lg border cursor-pointer hover:opacity-80 transition", isDesktop ? "h-40" : "h-32")}
                            onClick={() =>
                              openImagePreview(detailsDialog.request!.tenantImage!, "Tenant Photo")
                            }
                            data-testid={`image-detail-tenant-${detailsDialog.request.id}${isDesktop ? '' : '-mobile'}`}
                          />
                        </div>
                      )}
                      {detailsDialog.request.aadharCard && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Aadhar Card</p>
                          <img
                            src={detailsDialog.request.aadharCard}
                            alt="Aadhar"
                            className={cn("w-full object-cover rounded-lg border cursor-pointer hover:opacity-80 transition", isDesktop ? "h-40" : "h-32")}
                            onClick={() =>
                              openImagePreview(detailsDialog.request!.aadharCard!, "Aadhar Card")
                            }
                            data-testid={`image-detail-aadhar-${detailsDialog.request.id}${isDesktop ? '' : '-mobile'}`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isDesktop && detailsDialog.request.tenantHistory && detailsDialog.request.tenantHistory.length > 0 && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold">Previous PG Stays</h4>
                      <Badge variant="secondary" className="ml-2">{detailsDialog.request.tenantHistory.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {detailsDialog.request.tenantHistory.map((history, index) => (
                        <div key={history.id} className="bg-secondary/50 p-4 rounded-lg border" data-testid={`history-${index}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{history.pgName || "Previous PG"}</p>
                              <p className="text-xs text-muted-foreground">{history.pgAddress || "N/A"}</p>
                            </div>
                            {history.rating && (
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      "w-4 h-4",
                                      i < history.rating! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                    )}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                            {history.moveInDate && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>Move-in: {format(new Date(history.moveInDate), "MMM yyyy")}</span>
                              </div>
                            )}
                            {history.moveOutDate && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>Move-out: {format(new Date(history.moveOutDate), "MMM yyyy")}</span>
                              </div>
                            )}
                            {history.roomNumber && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span>Room: {history.roomNumber}</span>
                              </div>
                            )}
                            {history.ownerName && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <User className="w-3 h-3" />
                                <span>Owner: {history.ownerName}</span>
                              </div>
                            )}
                          </div>
                          {history.behaviorTags && history.behaviorTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {history.behaviorTags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs px-2 py-0.5 bg-purple-50 border-purple-200 text-purple-700">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {history.ownerFeedback && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs text-muted-foreground mb-1">Owner Feedback:</p>
                              <p className="text-sm italic text-foreground/80">"{history.ownerFeedback}"</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDetailsDialog({ open: false })}
                className={cn(!isDesktop ? "w-full" : "")}
                data-testid={`button-close-details${isDesktop ? '' : '-mobile'}`}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog
          open={rejectDialog.open}
          onOpenChange={(open) => !open && setRejectDialog({ open: false, reason: "" })}
        >
          <DialogContent className={cn(isDesktop ? "" : "max-w-[95vw]")} data-testid={`dialog-reject${isDesktop ? '' : '-mobile'}`}>
            <DialogHeader>
              <DialogTitle>Reject Request</DialogTitle>
            </DialogHeader>
            <div className={cn("space-y-4", isDesktop ? "py-4" : "py-2")}>
              <p className="text-sm text-muted-foreground">
                Provide a reason for rejection. The tenant will be notified.
              </p>
              <div className="space-y-2">
                <Label htmlFor={`rejectionReason${isDesktop ? '' : '-mobile'}`} className="text-sm">
                  Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id={`rejectionReason${isDesktop ? '' : '-mobile'}`}
                  placeholder="e.g., Incomplete documents..."
                  value={rejectDialog.reason}
                  onChange={(e) =>
                    setRejectDialog({ ...rejectDialog, reason: e.target.value })
                  }
                  rows={isDesktop ? 4 : 3}
                  data-testid={`textarea-rejection-reason${isDesktop ? '' : '-mobile'}`}
                />
              </div>
            </div>
            <DialogFooter className={cn(isDesktop ? "" : "flex-col gap-2")}>
              {isDesktop ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setRejectDialog({ open: false, reason: "" })}
                    data-testid="button-cancel-reject"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={rejectMutation.isPending || !rejectDialog.reason.trim()}
                    data-testid="button-confirm-reject"
                  >
                    {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={rejectMutation.isPending || !rejectDialog.reason.trim()}
                    className="w-full"
                    data-testid="button-confirm-reject-mobile"
                  >
                    {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRejectDialog({ open: false, reason: "" })}
                    className="w-full"
                    data-testid="button-cancel-reject-mobile"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bed Selection Dialog */}
        <Dialog
          open={bedSelectDialog.open}
          onOpenChange={(open) => !open && setBedSelectDialog({ open: false, beds: [], selectedBedId: null, loading: false })}
        >
          <DialogContent className={cn(isDesktop ? "max-w-md" : "max-w-[95vw]")} data-testid={`dialog-bed-select${isDesktop ? '' : '-mobile'}`}>
            <DialogHeader>
              <DialogTitle className={cn("flex items-center gap-2", !isDesktop ? "text-base" : "")}>
                <Bed className="w-5 h-5 text-indigo-600" />
                Select Bed Position
              </DialogTitle>
            </DialogHeader>
            <div className={cn(isDesktop ? "py-4" : "py-3")}>
              <p className={cn("text-sm text-muted-foreground", isDesktop ? "mb-4" : "mb-3")}>
                Choose a bed for {bedSelectDialog.request?.name}
              </p>
              <div className={cn("grid grid-cols-2", isDesktop ? "gap-3" : "gap-2")}>
                {bedSelectDialog.beds.map((bed) => (
                  <button
                    key={bed.id}
                    type="button"
                    onClick={() => setBedSelectDialog(prev => ({ ...prev, selectedBedId: bed.id }))}
                    className={cn(
                      "rounded-xl border-2 transition-all text-left",
                      isDesktop ? "p-4" : "p-3",
                      bedSelectDialog.selectedBedId === bed.id
                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                    )}
                    data-testid={`bed-option${isDesktop ? '' : '-mobile'}-${bed.id}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Bed className="w-4 h-4 text-indigo-600" />
                      <span className={cn("font-medium", !isDesktop ? "text-sm" : "")}>{bed.position}</span>
                    </div>
                    {isDesktop && (
                      <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                        Available
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className={cn("w-full text-gray-500", isDesktop ? "mt-3" : "mt-2 text-xs")}
                onClick={() => setBedSelectDialog(prev => ({ ...prev, selectedBedId: null }))}
              >
                Skip (assign later)
              </Button>
            </div>
            <DialogFooter className={cn(!isDesktop ? "flex-col gap-2" : "")}>
              {isDesktop ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setBedSelectDialog({ open: false, beds: [], selectedBedId: null, loading: false })}
                    data-testid="button-cancel-bed-select"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmApprove}
                    disabled={approveMutation.isPending}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                    data-testid="button-confirm-bed-select"
                  >
                    {approveMutation.isPending ? "Approving..." : "Approve Tenant"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleConfirmApprove}
                    disabled={approveMutation.isPending}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600"
                    data-testid="button-confirm-bed-select-mobile"
                  >
                    {approveMutation.isPending ? "Approving..." : "Approve Tenant"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setBedSelectDialog({ open: false, beds: [], selectedBedId: null, loading: false })}
                    className="w-full"
                    data-testid="button-cancel-bed-select-mobile"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Preview Dialog */}
        <Dialog
          open={imagePreview.open}
          onOpenChange={(open) => !open && setImagePreview({ open: false })}
        >
          <DialogContent className={cn(isDesktop ? "max-w-4xl" : "max-w-[95vw] max-h-[85vh]")} data-testid={`dialog-image-preview${isDesktop ? '' : '-mobile'}`}>
            <DialogHeader>
              <DialogTitle>{imagePreview.title}</DialogTitle>
            </DialogHeader>
            {imagePreview.src && (
              <div className={cn(isDesktop ? "py-4" : "py-2")}>
                <img
                  src={imagePreview.src}
                  alt={imagePreview.title}
                  className={cn("w-full h-auto object-contain rounded-lg", isDesktop ? "max-h-[70vh]" : "max-h-[60vh]")}
                />
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setImagePreview({ open: false })}
                className={cn(!isDesktop ? "w-full" : "")}
                data-testid={`button-close-image${isDesktop ? '' : '-mobile'}`}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
