import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Home as HomeIcon,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format, isPast } from "date-fns";
import OnboardingRequestModal from "@/components/OnboardingRequestModal";
import { api } from "@/apiClient";

interface VisitRequest {
  id: number;
  pgId: number;
  pgName?: string;
  pgAddress?: string;
  roomId?: number;
  roomNumber?: string;
  requestedDate: string;
  requestedTime: string;
  confirmedDate?: string;
  confirmedTime?: string;
  rescheduledDate?: string;
  rescheduledTime?: string;
  status: "pending" | "approved" | "rescheduled" | "completed" | "cancelled";
  notes?: string;
  ownerNotes?: string;
  createdAt: string;
}

interface OnboardingRequest {
  id: number;
  status: "pending" | "approved" | "rejected";
  pgId: number;
  roomId: number;
  rejectionReason?: string;
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
  rescheduled: {
    label: "Rescheduled",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
};

export default function TenantVisitRequestsPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "date">("recent");
  const [onboardingModal, setOnboardingModal] = useState<{
    open: boolean;
    visitRequestId?: number;
    pgId?: number;
    roomId?: number;
  }>({ open: false });

  // Fetch visit requests
  const { data: visitRequests = [], isLoading, error } = useQuery<VisitRequest[]>({
    queryKey: ["/api/tenant/visit-requests"],
    queryFn: async () => {
      const res = await api.get("/api/tenant/visit-requests");
      return res.data;
    },
    staleTime: 0, // Always consider data stale
    refetchOnMount: "always", // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Fetch onboarding requests for all unique PG IDs
  const uniquePgIds = Array.from(new Set(visitRequests.map(req => req.pgId)));
  
  const { data: onboardingRequestsMap = {} } = useQuery<Record<number, OnboardingRequest>>({
    queryKey: ["/api/tenant/onboarding-requests", uniquePgIds],
    enabled: uniquePgIds.length > 0,
    queryFn: async () => {
      const requests = await Promise.all(
        uniquePgIds.map(async (pgId) => {
          try {
            const res = await api.get(`/api/tenant/onboarding-requests/${pgId}`);
            return { pgId, data: res.data };
          } catch {
            return { pgId, data: null };
          }
        })
      );
      
      const map: Record<number, OnboardingRequest> = {};
      requests.forEach(({ pgId, data }) => {
        if (data) {
          map[pgId] = data;
        }
      });
      return map;
    },
  });

  // Accept reschedule mutation
  const acceptRescheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.patch(`/api/tenant/visit-requests/${id}/accept-reschedule`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/visit-requests"] });
      toast({
        title: "Success",
        description: "New visit time accepted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to accept reschedule",
        variant: "destructive",
      });
    },
  });

  // Complete visit mutation
  const completeVisitMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.patch(`/api/tenant/visit-requests/${id}/complete`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/visit-requests"] });
      toast({
        title: "Success",
        description: "Visit marked as completed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to mark as completed",
        variant: "destructive",
      });
    },
  });

  // Cancel visit mutation
  const cancelVisitMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/api/tenant/visit-requests/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/visit-requests"] });
      toast({
        title: "Success",
        description: "Visit request cancelled",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to cancel visit request",
        variant: "destructive",
      });
    },
  });

  const handleOpenOnboarding = (visitRequest: VisitRequest) => {
    setOnboardingModal({
      open: true,
      visitRequestId: visitRequest.id,
      pgId: visitRequest.pgId,
      roomId: visitRequest.roomId,
    });
  };

  // Filter and sort requests
  const filteredRequests = visitRequests
    .filter((req) => {
      if (statusFilter === "all") return true;
      return req.status === statusFilter;
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        const dateA = new Date(a.requestedDate).getTime();
        const dateB = new Date(b.requestedDate).getTime();
        return dateB - dateA;
      }
    });

  const getStatusCounts = () => {
    return {
      all: visitRequests.length,
      pending: visitRequests.filter((r) => r.status === "pending").length,
      approved: visitRequests.filter((r) => r.status === "approved").length,
      completed: visitRequests.filter((r) => r.status === "completed").length,
    };
  };

  const counts = getStatusCounts();

  if (isLoading) {
    return (
      <MobileLayout title="My Visit Requests" showNav={true}>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout title="My Visit Requests" showNav={true}>
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-error">
              Failed to load visit requests
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error.message || "Please try again later"}
            </p>
            <Button onClick={() => navigate("/tenant-search-pgs")} data-testid="button-search-pgs">
              Search PGs
            </Button>
          </CardContent>
        </Card>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      title="My Visit Requests"
      showNav={true}
      action={
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/tenant-dashboard")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      }
    >
      {/* Hero Section */}
      <div className="relative -mx-4 -mt-6 mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative px-6 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              My Visits
            </h1>
            <p className="text-purple-100 text-sm">
              Track your PG visit requests and schedules
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 max-w-[200px]">
            <Select value={sortBy} onValueChange={(value: "recent" | "date") => setSortBy(value)}>
              <SelectTrigger data-testid="select-sort" className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent" data-testid="sort-recent">Most Recent</SelectItem>
                <SelectItem value="date" data-testid="sort-date">By Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => navigate("/tenant-search-pgs")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg h-9 text-sm"
            data-testid="button-new-visit"
          >
            + New Visit
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 h-auto p-1">
            <TabsTrigger value="all" data-testid="tab-all" className="text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending" className="text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              Pending ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved" className="text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              Approved ({counts.approved})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed" className="text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              Completed ({counts.completed})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Visit Request Cards */}
        {filteredRequests.length === 0 ? (
          <Card className="text-center py-12 border-2 border-dashed">
            <CardContent>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800" data-testid="text-no-requests">
                {statusFilter === "all"
                  ? "No visit requests yet"
                  : `No ${statusFilter} visits`}
              </h3>
              <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                {statusFilter === "all"
                  ? "Start exploring PGs and schedule your first visit to find your perfect home"
                  : `You don't have any ${statusFilter} visit requests at the moment`}
              </p>
              {statusFilter === "all" && (
                <Button 
                  onClick={() => navigate("/tenant-search-pgs")} 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                  data-testid="button-search-pgs-empty"
                >
                  Explore PGs
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status];
              const StatusIcon = statusConfig.icon;
              const visitDate = request.confirmedDate || request.requestedDate;
              const visitTime = request.confirmedTime || request.requestedTime;
              const isPastVisit = visitDate ? isPast(new Date(visitDate)) : false;
              
              // Check if onboarding request exists for this PG
              const onboardingRequest = onboardingRequestsMap[request.pgId];
              const hasOnboardingRequest = onboardingRequest && 
                (onboardingRequest.status === "pending" || onboardingRequest.status === "approved");
              
              // Show onboarding button only if visit is approved/completed, has roomId, and NO existing onboarding request
              const showOnboardingButton =
                (request.status === "approved" || request.status === "completed") && 
                request.roomId && 
                !hasOnboardingRequest;

              return (
                <Card 
                  key={request.id} 
                  data-testid={`card-visit-${request.id}`}
                  className="border-2 hover:border-purple-200 hover:shadow-xl transition-all duration-300 group overflow-hidden"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold mb-2 text-gray-800" data-testid={`text-pg-name-${request.id}`}>
                          {request.pgName || "PG"}
                        </CardTitle>
                        {request.pgAddress && (
                          <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-1.5">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span data-testid={`text-address-${request.id}`}>{request.pgAddress}</span>
                          </p>
                        )}
                        {request.roomNumber && (
                          <p className="text-sm text-gray-600 flex items-center gap-1.5">
                            <HomeIcon className="w-4 h-4 text-gray-500" />
                            Room {request.roomNumber}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("gap-1.5 px-3 py-1 font-semibold border-2", statusConfig.color)}
                        data-testid={`badge-status-${request.id}`}
                      >
                        <StatusIcon className="w-4 h-4" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Visit Details Timeline */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="font-semibold text-gray-800 mb-1">Requested Time</p>
                          <p className="text-gray-600">
                            <span data-testid={`text-requested-date-${request.id}`}>
                              {format(new Date(request.requestedDate), "MMM dd, yyyy")}
                            </span>
                            {" at "}
                            <span data-testid={`text-requested-time-${request.id}`}>{request.requestedTime}</span>
                          </p>
                        </div>
                      </div>

                      {request.confirmedDate && request.confirmedTime && (
                        <div className="flex items-start gap-3 text-sm">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="font-semibold text-gray-800 mb-1">Confirmed Time</p>
                            <p className="text-gray-600">
                              <span data-testid={`text-confirmed-date-${request.id}`}>
                                {format(new Date(request.confirmedDate), "MMM dd, yyyy")}
                              </span>
                              {" at "}
                              <span data-testid={`text-confirmed-time-${request.id}`}>{request.confirmedTime}</span>
                            </p>
                          </div>
                        </div>
                      )}

                      {request.status === "rescheduled" &&
                        request.rescheduledDate &&
                        request.rescheduledTime && (
                          <div className="flex items-start gap-3 text-sm bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border-2 border-blue-200">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                              <Clock className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 pt-1">
                              <p className="font-semibold text-blue-900 mb-1">New Proposed Time</p>
                              <p className="text-blue-700 font-medium">
                                <span data-testid={`text-rescheduled-date-${request.id}`}>
                                  {format(new Date(request.rescheduledDate), "MMM dd, yyyy")}
                                </span>
                                {" at "}
                                <span data-testid={`text-rescheduled-time-${request.id}`}>
                                  {request.rescheduledTime}
                                </span>
                              </p>
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Notes */}
                    {request.notes && (
                      <div className="text-sm bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                          Your Notes
                        </p>
                        <p className="text-gray-700" data-testid={`text-notes-${request.id}`}>
                          {request.notes}
                        </p>
                      </div>
                    )}

                    {request.ownerNotes && (
                      <div className="text-sm bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200">
                        <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Owner's Message
                        </p>
                        <p className="text-gray-700" data-testid={`text-owner-notes-${request.id}`}>
                          {request.ownerNotes}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {request.status === "pending" && (
                        <Button
                          onClick={() => cancelVisitMutation.mutate(request.id)}
                          variant="destructive"
                          size="sm"
                          disabled={cancelVisitMutation.isPending}
                          className="shadow-md hover:shadow-lg transition-all"
                          data-testid={`button-cancel-${request.id}`}
                        >
                          {cancelVisitMutation.isPending ? "Cancelling..." : "Cancel Request"}
                        </Button>
                      )}

                      {request.status === "rescheduled" && (
                        <Button
                          onClick={() => acceptRescheduleMutation.mutate(request.id)}
                          size="sm"
                          disabled={acceptRescheduleMutation.isPending}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all"
                          data-testid={`button-accept-reschedule-${request.id}`}
                        >
                          {acceptRescheduleMutation.isPending ? "Accepting..." : "Accept New Time"}
                        </Button>
                      )}

                      {request.status === "approved" && isPastVisit && (
                        <Button
                          onClick={() => completeVisitMutation.mutate(request.id)}
                          variant="outline"
                          size="sm"
                          disabled={completeVisitMutation.isPending}
                          className="border-2 hover:border-purple-300 hover:bg-purple-50 transition-all"
                          data-testid={`button-complete-${request.id}`}
                        >
                          {completeVisitMutation.isPending ? "Marking..." : "Mark as Completed"}
                        </Button>
                      )}

                      {showOnboardingButton && (
                        <Button
                          onClick={() => handleOpenOnboarding(request)}
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all"
                          data-testid={`button-onboarding-${request.id}`}
                        >
                          Request Onboarding
                        </Button>
                      )}

                      {(request.status === "approved" || request.status === "completed") && (
                        <Button
                          onClick={() => cancelVisitMutation.mutate(request.id)}
                          variant="outline"
                          size="sm"
                          disabled={cancelVisitMutation.isPending}
                          className="border-2 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all"
                          data-testid={`button-delete-${request.id}`}
                        >
                          {cancelVisitMutation.isPending ? "Deleting..." : "Delete Request"}
                        </Button>
                      )}
                    </div>

                    {/* Onboarding Status Badge */}
                    {onboardingRequest && (
                      <div className="pt-3 border-t">
                        {onboardingRequest.status === "pending" && (
                          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border-2 border-orange-200">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                              <span className="font-semibold text-orange-900" data-testid={`text-onboarding-status-${request.id}`}>
                                Onboarding Request Pending
                              </span>
                            </div>
                            <p className="text-sm text-orange-700">
                              Your onboarding request is being reviewed by the owner. You'll be notified once it's processed.
                            </p>
                          </div>
                        )}
                        
                        {onboardingRequest.status === "approved" && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <span className="font-semibold text-green-900" data-testid={`text-onboarding-status-${request.id}`}>
                                Onboarding Approved!
                              </span>
                            </div>
                            <p className="text-sm text-green-700">
                              Congratulations! Your onboarding has been approved. You are now a tenant at this PG.
                            </p>
                          </div>
                        )}
                        
                        {onboardingRequest.status === "rejected" && (
                          <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border-2 border-red-200">
                            <div className="flex items-center gap-2 mb-2">
                              <XCircle className="w-5 h-5 text-red-600" />
                              <span className="font-semibold text-red-900" data-testid={`text-onboarding-status-${request.id}`}>
                                Onboarding Request Declined
                              </span>
                            </div>
                            <p className="text-sm text-red-700 mb-2">
                              Unfortunately, your onboarding request was not approved.
                            </p>
                            {onboardingRequest.rejectionReason && (
                              <p className="text-sm text-red-600 font-medium bg-red-100 p-2 rounded" data-testid={`text-rejection-reason-${request.id}`}>
                                Reason: {onboardingRequest.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      <OnboardingRequestModal
        open={onboardingModal.open}
        onClose={() => setOnboardingModal({ open: false })}
        visitRequestId={onboardingModal.visitRequestId}
        pgId={onboardingModal.pgId}
        roomId={onboardingModal.roomId}
      />
    </MobileLayout>
  );
}
