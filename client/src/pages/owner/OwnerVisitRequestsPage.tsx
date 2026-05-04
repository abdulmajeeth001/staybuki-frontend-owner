import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
  Calendar,
  Clock,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  MessageSquare,
  CalendarCheck,
  CalendarClock,
  Users,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ownerService } from "@/services/ownerService";
import type { OwnerVisitRequestResponse } from "@/types/owner";


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
    icon: AlertCircle,
  },
};

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM",
];

function useVisitRequestsLogic() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "date">("recent");
  const [rescheduleModal, setRescheduleModal] = useState<{
    open: boolean;
    request?: OwnerVisitRequestResponse;
    newDate: string;
    newTime: string;
    ownerNotes: string;
  }>({
    open: false,
    newDate: "",
    newTime: "",
    ownerNotes: "",
  });

  // Fetch visit requests
  const { data: visitRequests = [], isLoading, error } = useQuery<OwnerVisitRequestResponse[]>({
    queryKey: ["/api/visit-requests"],
    queryFn: () => ownerService.getVisitRequests(),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: number) => ownerService.approveVisitRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visit-requests"] });
      toast.success("Visit request approved successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || "Failed to approve visit request");
    },
  });

  // Reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: ({ id, newDate, newTime }: { id: number; newDate: string; newTime: string }) => 
      ownerService.rescheduleVisitRequest(id, { newDate, newTime }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visit-requests"] });
      setRescheduleModal({ open: false, newDate: "", newTime: "", ownerNotes: "" });
      toast.success("Visit rescheduled successfully. Tenant will be notified.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || "Failed to reschedule visit request");
    },
  });

  const handleApprove = (id: number) => {
    approveMutation.mutate(id);
  };

  const handleReschedule = () => {
    if (!rescheduleModal.request || !rescheduleModal.newDate || !rescheduleModal.newTime) {
      toast.error("Please select both date and time");
      return;
    }

    rescheduleMutation.mutate({
      id: rescheduleModal.request.id,
      newDate: rescheduleModal.newDate,
      newTime: rescheduleModal.newTime,
    });
  };

  const openRescheduleModal = (request: OwnerVisitRequestResponse) => {
    setRescheduleModal({
      open: true,
      request,
      newDate: "",
      newTime: "",
      ownerNotes: "",
    });
  };

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    return visitRequests
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
  }, [visitRequests, statusFilter, sortBy]);

  const counts = useMemo(() => {
    return {
      all: visitRequests.length,
      pending: visitRequests.filter((r) => r.status === "pending").length,
      approved: visitRequests.filter((r) => r.status === "approved").length,
      completed: visitRequests.filter((r) => r.status === "completed").length,
    };
  }, [visitRequests]);

  return {
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    rescheduleModal,
    setRescheduleModal,
    isLoading,
    error,
    approveMutation,
    rescheduleMutation,
    handleApprove,
    handleReschedule,
    openRescheduleModal,
    filteredRequests,
    counts,
  };
}

export default function OwnerVisitRequestsPage() {
  return (
    <>
      <div className="hidden lg:block">
        <OwnerVisitRequestsDesktop />
      </div>
      <div className="lg:hidden">
        <OwnerVisitRequestsMobile />
      </div>
    </>
  );
}

function OwnerVisitRequestsDesktop() {
  const {
    statusFilter, setStatusFilter, sortBy, setSortBy, rescheduleModal, setRescheduleModal,
    isLoading, error, approveMutation, rescheduleMutation, handleApprove, handleReschedule,
    openRescheduleModal, filteredRequests, counts
  } = useVisitRequestsLogic();

  if (error) {
    return (
      <DesktopLayout title="Visit Requests" showNav>
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2" data-testid="text-error">
            {error.message === "Owner access required" 
              ? "Owner Access Required" 
              : "Failed to load visit requests"}
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
    <DesktopLayout title="Visit Requests" showNav>
      {/* Gradient Hero Section */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="relative px-8 py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2" data-testid="title-visit-requests">
                Visit Requests
              </h2>
              <p className="text-white/80 text-sm">
                Manage property tour requests from prospective tenants
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
                  <AlertCircle className="w-7 h-7 text-white" />
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
                  <CalendarCheck className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Approved Visits</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent" data-testid="stat-approved">
                  {counts.approved}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-completed">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Completed</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" data-testid="stat-completed">
                  {counts.completed}
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
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
                className={statusFilter === "completed" ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" : ""}
                data-testid="filter-completed"
              >
                Completed ({counts.completed})
              </Button>
            </div>
            <Select value={sortBy} onValueChange={(value: "recent" | "date") => setSortBy(value)}>
              <SelectTrigger className="w-[180px]" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent" data-testid="sort-recent">Most Recent</SelectItem>
                <SelectItem value="date" data-testid="sort-date">By Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Visit Request Cards */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
                <CalendarClock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <CalendarClock className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2" data-testid="text-no-requests">
              {statusFilter === "all"
                ? "No visit requests yet"
                : `No ${statusFilter} visit requests`}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {statusFilter === "all"
                ? "Visit requests from prospective tenants will appear here"
                : `You don't have any ${statusFilter} visit requests at the moment`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const visitDate = request.confirmedDate || request.requestedDate;
              const visitTime = request.confirmedTime || request.requestedTime;

              return (
                <Card 
                  key={request.id} 
                  className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative"
                  data-testid={`card-visit-${request.id}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg" data-testid={`text-tenant-name-${request.id}`}>
                              {request.tenantName || "Tenant"}
                            </h3>
                            {request.tenantEmail && (
                              <span className="text-sm text-muted-foreground">
                                {request.tenantEmail}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span data-testid={`text-pg-name-${request.id}`}>{request.pgName || "PG"}</span>
                          </div>
                          {request.roomNumber && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span data-testid={`text-room-${request.id}`}>Room {request.roomNumber}</span>
                            </div>
                          )}
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
                    {/* Visit Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg">
                        <p className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Requested Date & Time
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-blue-900" data-testid={`text-requested-date-${request.id}`}>
                            {format(new Date(request.requestedDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span className="text-sm text-blue-700" data-testid={`text-requested-time-${request.id}`}>
                            {request.requestedTime}
                          </span>
                        </div>
                      </div>

                      {(request.confirmedDate || request.rescheduledDate) && (
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-lg">
                          <p className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1">
                            <CalendarCheck className="w-3 h-3" />
                            {request.status === "rescheduled" ? "Rescheduled" : "Confirmed"} Date & Time
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-emerald-900" data-testid={`text-confirmed-date-${request.id}`}>
                              {format(
                                new Date(request.confirmedDate || request.rescheduledDate!),
                                "MMM dd, yyyy"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span className="text-sm text-emerald-700" data-testid={`text-confirmed-time-${request.id}`}>
                              {request.confirmedTime || request.rescheduledTime}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {request.notes && (
                      <div className="bg-secondary/50 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Tenant Notes</p>
                            <p className="text-sm" data-testid={`text-notes-${request.id}`}>
                              {request.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rescheduled Info */}
                    {request.status === "rescheduled" && request.rescheduledBy && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-700" data-testid={`text-rescheduled-by-${request.id}`}>
                          Rescheduled by {request.rescheduledBy}. Waiting for tenant confirmation.
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {request.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={approveMutation.isPending}
                            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                            data-testid={`button-approve-${request.id}`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve Visit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRescheduleModal(request)}
                            className="border-purple-200 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 hover:text-white transition-all"
                            data-testid={`button-reschedule-${request.id}`}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Reschedule
                          </Button>
                        </>
                      )}

                      {request.status === "approved" && (
                        <div className="flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-emerald-50 to-green-50 px-3 py-2 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-700">Visit confirmed for {format(new Date(visitDate), "MMM dd")} at {visitTime}</span>
                        </div>
                      )}

                      {request.status === "completed" && (
                        <div className="flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-gray-50 to-slate-50 px-3 py-2 rounded-lg border border-gray-200">
                          <CheckCircle2 className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-700">Visit completed</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      <Dialog open={rescheduleModal.open} onOpenChange={(open) => !open && setRescheduleModal({ open: false, newDate: "", newTime: "", ownerNotes: "" })}>
        <DialogContent data-testid="dialog-reschedule">
            <DialogHeader>
              <DialogTitle>Reschedule Visit Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newDate">New Date</Label>
                <Input
                  id="newDate"
                  type="date"
                  value={rescheduleModal.newDate}
                  onChange={(e) =>
                    setRescheduleModal({ ...rescheduleModal, newDate: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  data-testid="input-reschedule-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newTime">New Time</Label>
                <Select
                  value={rescheduleModal.newTime}
                  onValueChange={(value) =>
                    setRescheduleModal({ ...rescheduleModal, newTime: value })
                  }
                >
                  <SelectTrigger id="newTime" data-testid="select-reschedule-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem 
                        key={time} 
                        value={time}
                        data-testid={`option-reschedule-time-${time.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerNotes">Owner Notes (Optional)</Label>
                <Textarea
                  id="ownerNotes"
                  placeholder="Add any notes for the tenant..."
                  value={rescheduleModal.ownerNotes}
                  onChange={(e) =>
                    setRescheduleModal({ ...rescheduleModal, ownerNotes: e.target.value })
                  }
                  rows={3}
                  data-testid="textarea-owner-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRescheduleModal({ open: false, newDate: "", newTime: "", ownerNotes: "" })}
                data-testid="button-cancel-reschedule"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={rescheduleMutation.isPending}
                data-testid="button-confirm-reschedule"
              >
                {rescheduleMutation.isPending ? "Sending..." : "Send Reschedule Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </DesktopLayout>
  );
}

function OwnerVisitRequestsMobile() {
  const {
    statusFilter, setStatusFilter, rescheduleModal, setRescheduleModal,
    isLoading, error, approveMutation, rescheduleMutation, handleApprove, handleReschedule,
    openRescheduleModal, filteredRequests, counts
  } = useVisitRequestsLogic();

  if (error) {
    return (
      <MobileLayout title="Visit Requests">
        <div className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-sm text-muted-foreground" data-testid="text-error-mobile">
            {error.message === "Owner access required" ? "Owner Access Required" : "Failed to load"}
          </p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Visit Requests">
      <div className="space-y-4">
        {/* Stats Cards - 2 column grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-2" data-testid="card-stat-total-mobile">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-semibold">Total</p>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">{counts.all}</h3>
            </CardContent>
          </Card>

          <Card className="border-2" data-testid="card-stat-pending-mobile">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-semibold">Pending</p>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">{counts.pending}</h3>
            </CardContent>
          </Card>

          <Card className="border-2" data-testid="card-stat-approved-mobile">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-semibold">Approved</p>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">{counts.approved}</h3>
            </CardContent>
          </Card>

          <Card className="border-2" data-testid="card-stat-completed-mobile">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-semibold">Completed</p>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">{counts.completed}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Filters - Scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="rounded-full flex-shrink-0"
            data-testid="filter-all-mobile"
          >
            All ({counts.all})
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
            className="rounded-full flex-shrink-0"
            data-testid="filter-pending-mobile"
          >
            Pending ({counts.pending})
          </Button>
          <Button
            variant={statusFilter === "approved" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("approved")}
            className="rounded-full flex-shrink-0"
            data-testid="filter-approved-mobile"
          >
            Approved ({counts.approved})
          </Button>
          <Button
            variant={statusFilter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("completed")}
            className="rounded-full flex-shrink-0"
            data-testid="filter-completed-mobile"
          >
            Completed ({counts.completed})
          </Button>
        </div>

        {/* Visit Requests List - Stacked cards */}
        <div className="space-y-3">
          {isLoading ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
                  <CalendarClock className="w-6 h-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          ) : filteredRequests.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  <CalendarClock className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-no-requests-mobile">
                  {statusFilter === "all" ? "No visit requests yet" : `No ${statusFilter} requests`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const visitDate = request.confirmedDate || request.requestedDate;
              const visitTime = request.confirmedTime || request.requestedTime;

              return (
                <Card 
                  key={request.id}
                  className="border-2 hover:border-purple-200 transition-colors"
                  data-testid={`card-visit-mobile-${request.id}`}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm" data-testid={`text-tenant-name-mobile-${request.id}`}>
                            {request.tenantName || "Tenant"}
                          </h4>
                          {request.roomNumber && (
                            <p className="text-xs text-muted-foreground">Room {request.roomNumber}</p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("flex items-center gap-1 text-xs", statusConfig.color)}
                        data-testid={`badge-status-mobile-${request.id}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Visit Date & Time */}
                    <div className="space-y-2 mb-3">
                      <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-xs text-blue-700 mb-1">Requested</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-900" data-testid={`text-requested-date-mobile-${request.id}`}>
                            {format(new Date(request.requestedDate), "MMM dd, yyyy")}
                          </span>
                          <Clock className="w-3 h-3 text-blue-600 ml-2" />
                          <span className="text-sm text-blue-700">{request.requestedTime}</span>
                        </div>
                      </div>

                      {(request.confirmedDate || request.rescheduledDate) && (
                        <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                          <p className="text-xs text-green-700 mb-1">
                            {request.status === "rescheduled" ? "Rescheduled" : "Confirmed"}
                          </p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-green-600" />
                            <span className="text-sm font-semibold text-green-900">
                              {format(new Date(request.confirmedDate || request.rescheduledDate!), "MMM dd, yyyy")}
                            </span>
                            <Clock className="w-3 h-3 text-green-600 ml-2" />
                            <span className="text-sm text-green-700">{request.confirmedTime || request.rescheduledTime}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {request.notes && (
                      <div className="mb-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm">{request.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          disabled={approveMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                          data-testid={`button-approve-mobile-${request.id}`}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRescheduleModal(request)}
                          className="flex-1"
                          data-testid={`button-reschedule-mobile-${request.id}`}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Reschedule
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      <Dialog open={rescheduleModal.open} onOpenChange={(open) => !open && setRescheduleModal({ open: false, newDate: "", newTime: "", ownerNotes: "" })}>
        <DialogContent data-testid="dialog-reschedule-mobile">
          <DialogHeader>
            <DialogTitle>Reschedule Visit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newDate-mobile">New Date</Label>
              <Input
                id="newDate-mobile"
                type="date"
                value={rescheduleModal.newDate}
                onChange={(e) =>
                  setRescheduleModal({ ...rescheduleModal, newDate: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
                data-testid="input-reschedule-date-mobile"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newTime-mobile">New Time</Label>
              <Select
                value={rescheduleModal.newTime}
                onValueChange={(value) =>
                  setRescheduleModal({ ...rescheduleModal, newTime: value })
                }
              >
                <SelectTrigger id="newTime-mobile" data-testid="select-reschedule-time-mobile">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleModal({ open: false, newDate: "", newTime: "", ownerNotes: "" })}
              data-testid="button-cancel-reschedule-mobile"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={rescheduleMutation.isPending}
              data-testid="button-confirm-reschedule-mobile"
            >
              {rescheduleMutation.isPending ? "Sending..." : "Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
