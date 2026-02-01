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
  return (
    <>
      <div className="hidden lg:block">
        <OwnerOnboardingRequestsPageDesktop />
      </div>
      <div className="lg:hidden">
        <OwnerOnboardingRequestsPageMobile />
      </div>
    </>
  );
}

function OwnerOnboardingRequestsPageDesktop() {
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
    queryKey: ["/api/onboarding-requests"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/onboarding-requests");
        return res.data;
      } catch (err: any) {
        throw new Error(err.response?.data?.error || err.message || "Failed to fetch onboarding requests");
      }
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, bedId }: { id: number; bedId?: number }) => {
      const res = await api.post(`/api/onboarding-requests/${id}/approve`, { bedId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-requests"] });
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
      const res = await api.post(`/api/onboarding-requests/${id}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-requests"] });
      setRejectDialog({ open: false, reason: "" });
      toast.success("Onboarding request rejected. Tenant has been notified.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || "Failed to reject onboarding request");
    },
  });

  const handleApprove = async (request: OnboardingRequest) => {
    // First check if there are beds defined for this room
    try {
      const res = await api.get(`/api/rooms/${request.roomId}/beds`);
        const beds = res.data;
        const availableBeds = beds.filter((b: any) => b.status === "available");
        if (availableBeds.length > 0) {
          // Show bed selection dialog
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
    // No beds defined or none available, proceed without bed selection
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
    setRejectDialog({
      open: true,
      request,
      reason: "",
    });
  };

  const openDetailsDialog = (request: OnboardingRequest) => {
    setDetailsDialog({
      open: true,
      request,
    });
  };

  const openImagePreview = (src: string, title: string) => {
    setImagePreview({ open: true, src, title });
  };

  // Filter and sort requests
  const filteredRequests = onboardingRequests
    .filter((req) => {
      if (statusFilter === "all") return true;
      return req.status === statusFilter;
    })
    .sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getStatusCounts = () => {
    return {
      all: onboardingRequests.length,
      pending: onboardingRequests.filter((r) => r.status === "pending").length,
      approved: onboardingRequests.filter((r) => r.status === "approved").length,
      rejected: onboardingRequests.filter((r) => r.status === "rejected").length,
    };
  };

  const counts = getStatusCounts();

  if (pgLoading) {
    return (
      <DesktopLayout title="Onboarding Requests" showNav>
        <div className="space-y-4">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
            <ClipboardCheck className="w-6 h-6 text-purple-600" />
          </div>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DesktopLayout>
    );
  }

  if (!pg) {
    return (
      <DesktopLayout title="Onboarding Requests" showNav>
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2" data-testid="text-no-pg">
            No PG Selected
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please select a PG to view onboarding requests
          </p>
        </div>
      </DesktopLayout>
    );
  }

  if (error) {
    return (
      <DesktopLayout title="Onboarding Requests" showNav>
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2" data-testid="text-error">
            {error.message === "Owner access required" 
              ? "Owner Access Required" 
              : "Failed to load onboarding requests"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {error.message === "Owner access required"
              ? "Only owners can access this page. Please log in as an owner."
              : error.message || "Please try again later"}
          </p>
        </div>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout title="Onboarding Requests" showNav>
      {/* Gradient Hero Section */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl">
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

      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-total">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Requests</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent" data-testid="stat-total">
                  {counts.all}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-pending">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <ClipboardCheck className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pending Review</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" data-testid="stat-pending">
                  {counts.pending}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-approved">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <UserCheck className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Approved</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent" data-testid="stat-approved">
                  {counts.approved}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-rejected">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <UserX className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Rejected</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" data-testid="stat-rejected">
                  {counts.rejected}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sort and Filter Controls */}
        <Card className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-2 overflow-x-auto flex-wrap">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className={statusFilter === "all" ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" : ""}
                data-testid="filter-all"
              >
                All ({counts.all})
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
                className={statusFilter === "pending" ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700" : ""}
                data-testid="filter-pending"
              >
                Pending ({counts.pending})
              </Button>
              <Button
                variant={statusFilter === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("approved")}
                className={statusFilter === "approved" ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700" : ""}
                data-testid="filter-approved"
              >
                Approved ({counts.approved})
              </Button>
              <Button
                variant={statusFilter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("rejected")}
                className={statusFilter === "rejected" ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" : ""}
                data-testid="filter-rejected"
              >
                Rejected ({counts.rejected})
              </Button>
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

        {/* Onboarding Request Cards */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
                <ClipboardCheck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <ClipboardCheck className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2" data-testid="text-no-requests">
              {statusFilter === "all"
                ? "No onboarding requests yet"
                : `No ${statusFilter} onboarding requests`}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {statusFilter === "all"
                ? "Onboarding requests from prospective tenants will appear here"
                : `You don't have any ${statusFilter} onboarding requests at the moment`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status];
              const StatusIcon = statusConfig.icon;

              return (
                <Card 
                  key={request.id} 
                  className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative"
                  data-testid={`card-onboarding-${request.id}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  <CardContent className="space-y-4">
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-details">
            <DialogHeader>
              <DialogTitle>Onboarding Request Details</DialogTitle>
            </DialogHeader>
            {detailsDialog.request && (
              <div className="space-y-4 py-4">
                {/* Tenant Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Tenant Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Name</p>
                      <p className="text-sm font-medium">{detailsDialog.request.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Email</p>
                      <p className="text-sm">{detailsDialog.request.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Phone</p>
                      <p className="text-sm">{detailsDialog.request.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Monthly Rent</p>
                      <p className="text-sm font-semibold text-green-700">
                        ₹{parseFloat(detailsDialog.request.monthlyRent).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Room Info */}
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

                {/* Emergency Contact */}
                {detailsDialog.request.emergencyContactName && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Emergency Contact</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Name</p>
                        <p className="text-sm">{detailsDialog.request.emergencyContactName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Relationship</p>
                        <p className="text-sm">{detailsDialog.request.emergencyContactRelationship || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Phone</p>
                        <p className="text-sm">{detailsDialog.request.emergencyContactPhone || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Documents</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {detailsDialog.request.tenantImage && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Tenant Photo</p>
                        <img
                          src={detailsDialog.request.tenantImage}
                          alt="Tenant"
                          className="w-full h-40 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition"
                          onClick={() =>
                            openImagePreview(detailsDialog.request!.tenantImage!, "Tenant Photo")
                          }
                          data-testid={`image-detail-tenant-${detailsDialog.request.id}`}
                        />
                      </div>
                    )}
                    {detailsDialog.request.aadharCard && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Aadhar Card</p>
                        <img
                          src={detailsDialog.request.aadharCard}
                          alt="Aadhar Card"
                          className="w-full h-40 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition"
                          onClick={() =>
                            openImagePreview(detailsDialog.request!.aadharCard!, "Aadhar Card")
                          }
                          data-testid={`image-detail-aadhar-${detailsDialog.request.id}`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Tenant History */}
                {detailsDialog.request.tenantHistory && detailsDialog.request.tenantHistory.length > 0 && (
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
                data-testid="button-close-details"
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
          <DialogContent data-testid="dialog-reject">
            <DialogHeader>
              <DialogTitle>Reject Onboarding Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Please provide a reason for rejecting this onboarding request. The tenant will be
                notified with your reason.
              </p>
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">
                  Rejection Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="e.g., Incomplete documents, Room already occupied, etc."
                  value={rejectDialog.reason}
                  onChange={(e) =>
                    setRejectDialog({ ...rejectDialog, reason: e.target.value })
                  }
                  rows={4}
                  data-testid="textarea-rejection-reason"
                />
              </div>
            </div>
            <DialogFooter>
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
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bed Selection Dialog */}
        <Dialog
          open={bedSelectDialog.open}
          onOpenChange={(open) => !open && setBedSelectDialog({ open: false, beds: [], selectedBedId: null, loading: false })}
        >
          <DialogContent className="max-w-md" data-testid="dialog-bed-select">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bed className="w-5 h-5 text-indigo-600" />
                Select Bed Position
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Choose a specific bed position for {bedSelectDialog.request?.name} in Room {bedSelectDialog.request?.roomNumber}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {bedSelectDialog.beds.map((bed) => (
                  <button
                    key={bed.id}
                    type="button"
                    onClick={() => setBedSelectDialog(prev => ({ ...prev, selectedBedId: bed.id }))}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left",
                      bedSelectDialog.selectedBedId === bed.id
                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                    )}
                    data-testid={`bed-option-${bed.id}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Bed className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium">{bed.position}</span>
                    </div>
                    <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                      Available
                    </Badge>
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-gray-500"
                onClick={() => setBedSelectDialog(prev => ({ ...prev, selectedBedId: null }))}
              >
                Skip bed selection (assign later)
              </Button>
            </div>
            <DialogFooter>
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
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Preview Dialog */}
        <Dialog
          open={imagePreview.open}
          onOpenChange={(open) => !open && setImagePreview({ open: false })}
        >
          <DialogContent className="max-w-4xl" data-testid="dialog-image-preview">
            <DialogHeader>
              <DialogTitle>{imagePreview.title}</DialogTitle>
            </DialogHeader>
            {imagePreview.src && (
              <div className="py-4">
                <img
                  src={imagePreview.src}
                  alt={imagePreview.title}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setImagePreview({ open: false })}
                data-testid="button-close-image"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DesktopLayout>
  );
}

function OwnerOnboardingRequestsPageMobile() {
  const queryClient = useQueryClient();
  const { pg, isLoading: pgLoading } = usePG();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
    queryKey: ["/api/onboarding-requests"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/onboarding-requests");
        return res.data;
      } catch (err: any) {
        throw new Error(err.response?.data?.error || err.message || "Failed to fetch onboarding requests");
      }
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, bedId }: { id: number; bedId?: number }) => {
      const res = await api.post(`/api/onboarding-requests/${id}/approve`, { bedId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-requests"] });
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
      const res = await api.post(`/api/onboarding-requests/${id}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-requests"] });
      setRejectDialog({ open: false, reason: "" });
      toast.success("Onboarding request rejected. Tenant has been notified.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || "Failed to reject onboarding request");
    },
  });

  const handleApprove = async (request: OnboardingRequest) => {
    // First check if there are beds defined for this room
    try {
      const res = await api.get(`/api/rooms/${request.roomId}/beds`);
        const beds = res.data;
        const availableBeds = beds.filter((b: any) => b.status === "available");
        if (availableBeds.length > 0) {
          // Show bed selection dialog
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
    // No beds defined or none available, proceed without bed selection
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
    setRejectDialog({
      open: true,
      request,
      reason: "",
    });
  };

  const openDetailsDialog = (request: OnboardingRequest) => {
    setDetailsDialog({
      open: true,
      request,
    });
  };

  const openImagePreview = (src: string, title: string) => {
    setImagePreview({ open: true, src, title });
  };

  // Filter and sort requests
  const filteredRequests = onboardingRequests
    .filter((req) => {
      if (statusFilter === "all") return true;
      return req.status === statusFilter;
    })
    .sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getStatusCounts = () => {
    return {
      all: onboardingRequests.length,
      pending: onboardingRequests.filter((r) => r.status === "pending").length,
      approved: onboardingRequests.filter((r) => r.status === "approved").length,
      rejected: onboardingRequests.filter((r) => r.status === "rejected").length,
    };
  };

  const counts = getStatusCounts();

  if (pgLoading) {
    return (
      <MobileLayout title="Onboarding Requests">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
            <ClipboardCheck className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!pg) {
    return (
      <MobileLayout title="Onboarding Requests">
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2" data-testid="text-no-pg-mobile">
            No PG Selected
          </h3>
          <p className="text-sm text-muted-foreground">
            Please select a PG to view onboarding requests
          </p>
        </div>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout title="Onboarding Requests">
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2" data-testid="text-error-mobile">
            {error.message === "Owner access required" 
              ? "Owner Access Required" 
              : "Failed to load onboarding requests"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {error.message === "Owner access required"
              ? "Only owners can access this page."
              : error.message || "Please try again later"}
          </p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Onboarding Requests">
      <div className="space-y-4 pb-20">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="overflow-hidden border-2" data-testid="card-stat-total-mobile">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-3 shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent" data-testid="stat-total-mobile">
                {counts.all}
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2" data-testid="card-stat-pending-mobile">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-3 shadow-md">
                <ClipboardCheck className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" data-testid="stat-pending-mobile">
                {counts.pending}
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2" data-testid="card-stat-approved-mobile">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-3 shadow-md">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Approved</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent" data-testid="stat-approved-mobile">
                {counts.approved}
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2" data-testid="card-stat-rejected-mobile">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-3 shadow-md">
                <UserX className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Rejected</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" data-testid="stat-rejected-mobile">
                {counts.rejected}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "rounded-full whitespace-nowrap",
              statusFilter === "all" && "bg-gradient-to-r from-purple-600 to-blue-600"
            )}
            data-testid="filter-all-mobile"
          >
            All ({counts.all})
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
            className={cn(
              "rounded-full whitespace-nowrap",
              statusFilter === "pending" && "bg-gradient-to-r from-orange-600 to-red-600"
            )}
            data-testid="filter-pending-mobile"
          >
            Pending ({counts.pending})
          </Button>
          <Button
            variant={statusFilter === "approved" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("approved")}
            className={cn(
              "rounded-full whitespace-nowrap",
              statusFilter === "approved" && "bg-gradient-to-r from-emerald-600 to-green-600"
            )}
            data-testid="filter-approved-mobile"
          >
            Approved ({counts.approved})
          </Button>
          <Button
            variant={statusFilter === "rejected" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("rejected")}
            className={cn(
              "rounded-full whitespace-nowrap",
              statusFilter === "rejected" && "bg-gradient-to-r from-purple-600 to-pink-600"
            )}
            data-testid="filter-rejected-mobile"
          >
            Rejected ({counts.rejected})
          </Button>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <ClipboardCheck className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-base font-semibold mb-2" data-testid="text-no-requests-mobile">
              {statusFilter === "all"
                ? "No onboarding requests yet"
                : `No ${statusFilter} requests`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter === "all"
                ? "Requests will appear here"
                : `No ${statusFilter} requests at the moment`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status];
              const StatusIcon = statusConfig.icon;

              return (
                <Card 
                  key={request.id} 
                  className="overflow-hidden border-2"
                  data-testid={`card-onboarding-${request.id}-mobile`}
                >
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
                </Card>
              );
            })}
          </div>
        )}

        {/* Shared Dialogs */}
        <Dialog
          open={detailsDialog.open}
          onOpenChange={(open) => !open && setDetailsDialog({ open: false })}
        >
          <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto" data-testid="dialog-details-mobile">
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
            </DialogHeader>
            {detailsDialog.request && (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Tenant Info</h4>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-medium">{detailsDialog.request.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="break-all">{detailsDialog.request.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p>{detailsDialog.request.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rent</p>
                      <p className="font-semibold text-green-700">
                        ₹{parseFloat(detailsDialog.request.monthlyRent).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {detailsDialog.request.emergencyContactName && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Emergency Contact</h4>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p>{detailsDialog.request.emergencyContactName}</p>
                      </div>
                      {detailsDialog.request.emergencyContactPhone && (
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p>{detailsDialog.request.emergencyContactPhone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(detailsDialog.request.tenantImage || detailsDialog.request.aadharCard) && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Documents</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {detailsDialog.request.tenantImage && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Tenant Photo</p>
                          <img
                            src={detailsDialog.request.tenantImage}
                            alt="Tenant"
                            className="w-full h-32 object-cover rounded-lg border"
                            onClick={() =>
                              openImagePreview(detailsDialog.request!.tenantImage!, "Tenant Photo")
                            }
                          />
                        </div>
                      )}
                      {detailsDialog.request.aadharCard && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Aadhar Card</p>
                          <img
                            src={detailsDialog.request.aadharCard}
                            alt="Aadhar"
                            className="w-full h-32 object-cover rounded-lg border"
                            onClick={() =>
                              openImagePreview(detailsDialog.request!.aadharCard!, "Aadhar Card")
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDetailsDialog({ open: false })}
                className="w-full"
                data-testid="button-close-details-mobile"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={rejectDialog.open}
          onOpenChange={(open) => !open && setRejectDialog({ open: false, reason: "" })}
        >
          <DialogContent className="max-w-[95vw]" data-testid="dialog-reject-mobile">
            <DialogHeader>
              <DialogTitle>Reject Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Provide a reason for rejection. The tenant will be notified.
              </p>
              <div className="space-y-2">
                <Label htmlFor="rejectionReason-mobile" className="text-sm">
                  Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="rejectionReason-mobile"
                  placeholder="e.g., Incomplete documents..."
                  value={rejectDialog.reason}
                  onChange={(e) =>
                    setRejectDialog({ ...rejectDialog, reason: e.target.value })
                  }
                  rows={3}
                  data-testid="textarea-rejection-reason-mobile"
                />
              </div>
            </div>
            <DialogFooter className="flex-col gap-2">
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
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bed Selection Dialog - Mobile */}
        <Dialog
          open={bedSelectDialog.open}
          onOpenChange={(open) => !open && setBedSelectDialog({ open: false, beds: [], selectedBedId: null, loading: false })}
        >
          <DialogContent className="max-w-[95vw]" data-testid="dialog-bed-select-mobile">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Bed className="w-5 h-5 text-indigo-600" />
                Select Bed Position
              </DialogTitle>
            </DialogHeader>
            <div className="py-3">
              <p className="text-sm text-muted-foreground mb-3">
                Choose a bed for {bedSelectDialog.request?.name}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {bedSelectDialog.beds.map((bed) => (
                  <button
                    key={bed.id}
                    type="button"
                    onClick={() => setBedSelectDialog(prev => ({ ...prev, selectedBedId: bed.id }))}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all text-left",
                      bedSelectDialog.selectedBedId === bed.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200"
                    )}
                    data-testid={`bed-option-mobile-${bed.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <Bed className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-sm">{bed.position}</span>
                    </div>
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-gray-500 text-xs"
                onClick={() => setBedSelectDialog(prev => ({ ...prev, selectedBedId: null }))}
              >
                Skip (assign later)
              </Button>
            </div>
            <DialogFooter className="flex-col gap-2">
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
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={imagePreview.open}
          onOpenChange={(open) => !open && setImagePreview({ open: false })}
        >
          <DialogContent className="max-w-[95vw] max-h-[85vh]" data-testid="dialog-image-preview-mobile">
            <DialogHeader>
              <DialogTitle>{imagePreview.title}</DialogTitle>
            </DialogHeader>
            {imagePreview.src && (
              <div className="py-2">
                <img
                  src={imagePreview.src}
                  alt={imagePreview.title}
                  className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                />
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setImagePreview({ open: false })}
                className="w-full"
                data-testid="button-close-image-mobile"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}
