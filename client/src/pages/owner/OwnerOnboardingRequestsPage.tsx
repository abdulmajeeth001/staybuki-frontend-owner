import { useState } from "react";
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
import { ownerService } from "@/services/ownerService";
import { 
  OnboardingResponse, 
  BedResponse, 
  ApproveOnboardingRequestPayload, 
  RejectOnboardingRequestPayload 
} from "@/types/owner";

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
    request?: OnboardingResponse;
  }>({ open: false });
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    request?: OnboardingResponse;
    reason: string;
  }>({ open: false, reason: "" });
  const [imagePreview, setImagePreview] = useState<{
    open: boolean;
    src?: string;
    title?: string;
    isPdf?: boolean;
    isImage?: boolean;
  }>({ open: false });
  const [bedSelectDialog, setBedSelectDialog] = useState<{
    open: boolean;
    request?: OnboardingResponse;
    beds: BedResponse[];
    selectedBedId: number | null;
    loading: boolean;
  }>({ open: false, beds: [], selectedBedId: null, loading: false });

  const { data: onboardingRequests = [], isLoading, error } = useQuery({
    queryKey: ["/api/owner/onboarding-requests"],
    queryFn: () => ownerService.getOnboardingRequests(),
    select: (data) => (Array.isArray(data) ? data : []),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, bedId }: { id: number; bedId?: number }) => {
      const payload: ApproveOnboardingRequestPayload = { bedId };
      return ownerService.approveOnboardingRequest(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/onboarding-requests"] });
      setBedSelectDialog({ open: false, beds: [], selectedBedId: null, loading: false });
      toast.success("Onboarding approved.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => {
      const payload: RejectOnboardingRequestPayload = { reason };
      return ownerService.rejectOnboardingRequest(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/onboarding-requests"] });
      setRejectDialog({ open: false, reason: "" });
      toast.success("Request rejected.");
    },
  });

  const handleApprove = async (request: OnboardingResponse) => {
    try {
      const beds = await ownerService.getRoomBeds(request.roomId);
      const availableBeds = beds.filter((b) => b.status === "available");
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

  const openImagePreview = (src: string, title: string) => {
    const lowerSrc = src.toLowerCase();
    const isPdf = lowerSrc.endsWith(".pdf");
    const isImage = !isPdf && (lowerSrc.endsWith(".jpg") || lowerSrc.endsWith(".jpeg") || lowerSrc.endsWith(".png"));
    setImagePreview({ open: true, src, title, isPdf, isImage });
  };

  const filteredRequests = onboardingRequests
    .filter((req) => statusFilter === "all" || req.status === statusFilter)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const counts = {
    all: onboardingRequests.length,
    pending: onboardingRequests.filter((r) => r.status === "pending").length,
    approved: onboardingRequests.filter((r) => r.status === "approved").length,
    rejected: onboardingRequests.filter((r) => r.status === "rejected").length,
  };

  if (pgLoading) return <Layout title="Onboarding Requests"><div className="py-20 text-center"><Skeleton className="h-12 w-12 mx-auto rounded-full" /></div></Layout>;
  if (!pg) return <Layout title="Onboarding Requests"><div className="py-20 text-center">Please select a PG.</div></Layout>;

  return (
    <Layout title="Onboarding Requests" showNav={!isMobile}>
      <OwnerOnboardingRequestsContent
        filteredRequests={filteredRequests}
        counts={counts}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        detailsDialog={detailsDialog}
        setDetailsDialog={setDetailsDialog}
        rejectDialog={rejectDialog}
        setRejectDialog={setRejectDialog}
        handleReject={() => {
          if (rejectDialog.request?.id) {
            rejectMutation.mutate({ id: rejectDialog.request.id, reason: rejectDialog.reason });
          }
        }}
        rejectMutation={rejectMutation}
        bedSelectDialog={bedSelectDialog}
        setBedSelectDialog={setBedSelectDialog}
        handleApprove={handleApprove}
        handleConfirmApprove={() => {
          if (bedSelectDialog.request?.id) {
            approveMutation.mutate({ id: bedSelectDialog.request.id, bedId: bedSelectDialog.selectedBedId || undefined });
          }
        }}
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

// --- Content Component ---

function OwnerOnboardingRequestsContent({
  filteredRequests,
  counts,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  detailsDialog,
  setDetailsDialog,
  rejectDialog,
  setRejectDialog,
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
}: any) {
  
  const statCards = [
    { id: "total", label: "Total", count: counts.all, icon: Users, gradient: "from-blue-500 to-cyan-600" },
    { id: "pending", label: "Pending", count: counts.pending, icon: ClipboardCheck, gradient: "from-orange-500 to-red-600" },
    { id: "approved", label: "Approved", count: counts.approved, icon: UserCheck, gradient: "from-emerald-500 to-green-600" },
    { id: "rejected", label: "Rejected", count: counts.rejected, icon: UserX, gradient: "from-purple-500 to-pink-600" },
  ];

  return (
    <div className={cn(isDesktop ? "max-w-7xl mx-auto space-y-6" : "space-y-4 pb-20")}>
      {/* Stat Cards */}
      <div className={cn("grid gap-4", isDesktop ? "grid-cols-4" : "grid-cols-2")}>
        {statCards.map((stat) => (
          <Card key={stat.id} className="border-2">
            <CardContent className="p-4">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-2 bg-gradient-to-br text-white", stat.gradient)}>
                <stat.icon size={20} />
              </div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold">{stat.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <Button key={f} variant={statusFilter === f ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(f)}>
            {f.toUpperCase()}
          </Button>
        ))}
      </div>

      {/* Requests */}
      <div className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : filteredRequests.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">No requests found.</p>
        ) : (
          filteredRequests.map((req: OnboardingResponse) => {
            const Config = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG];
            return (
              <Card key={req.id} className="group hover:border-purple-200 transition-all">
                <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    <div 
                      className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden cursor-pointer"
                      onClick={() => req.tenantImage && openImagePreview(req.tenantImage, "Tenant Photo")}
                    >
                      {req.tenantImage ? <img src={req.tenantImage} className="object-cover w-full h-full" /> : <User className="m-auto mt-2" />}
                    </div>
                    <div>
                      <h4 className="font-bold">{req.name}</h4>
                      <p className="text-sm text-muted-foreground">{req.phone}</p>
                      <Badge className={cn("mt-1", Config.color)} variant="outline">{Config.label}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDetailsDialog({ open: true, request: req })}>
                      <Eye size={16} className="mr-1" /> Details
                    </Button>
                    {req.status === "pending" && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(req)}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => setRejectDialog({ open: true, request: req, reason: "" })}>Reject</Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onOpenChange={(v) => !v && setDetailsDialog({ open: false })}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-0 shadow-2xl [&>button]:text-white [&>button]:top-5 [&>button]:right-5">
          {detailsDialog.request && (
            <>
              <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-5 flex justify-between items-center shadow-md z-10 relative">
                <DialogTitle className="text-xl font-bold text-white tracking-wide">
                  Onboarding Request Details
                </DialogTitle>
              </div>
              <div className="max-h-[80vh] overflow-y-auto p-6 space-y-8 bg-slate-50">
                {/* Premium Profile Header */}
                <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-100/60 to-white p-6 shadow-sm">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full blur-3xl opacity-50" />
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative">
                    <div className="w-24 h-24 rounded-full bg-slate-100 flex-shrink-0 border-4 border-white shadow-md overflow-hidden">
                      {detailsDialog.request.tenantImage ? (
                        <img src={detailsDialog.request.tenantImage} alt={detailsDialog.request.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-slate-400 m-auto h-full" />
                      )}
                    </div>
                    <div className="space-y-3 text-center sm:text-left flex-1 w-full">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{detailsDialog.request.name}</h3>
                        <p className="text-sm text-purple-600 font-medium mt-1">Applicant</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                          <Mail size={14} className="text-blue-500" />
                          <span>{detailsDialog.request.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                          <Phone size={14} className="text-green-500" />
                          <span>{detailsDialog.request.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Stay Info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2 border-b border-purple-100 pb-2">
                      <div className="p-1.5 bg-purple-100 rounded-md">
                        <Building2 size={16} className="text-purple-600" />
                      </div>
                      Stay Details
                    </h4>
                    <div className="space-y-3 bg-gradient-to-br from-purple-100/60 to-white p-5 rounded-xl border border-purple-200/80 shadow-sm">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Room</span>
                        <span className="font-medium bg-gray-50 px-2 py-0.5 rounded border shadow-sm">{detailsDialog.request.roomNumber}</span>
                      </div>
                      {detailsDialog.request.gender && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Gender</span>
                          <span className="font-medium">{detailsDialog.request.gender.charAt(0).toUpperCase() + detailsDialog.request.gender.slice(1).toLowerCase()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Monthly Rent</span>
                        <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">₹{detailsDialog.request.monthlyRent}</span>
                      </div>
                      {(detailsDialog.request as any).advanceAmount != null && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Advance Amount</span>
                          <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">₹{(detailsDialog.request as any).advanceAmount}</span>
                        </div>
                      )}
                      {detailsDialog.request.profession && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Profession</span>
                          <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{detailsDialog.request.profession}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2 border-b border-orange-100 pb-2">
                      <div className="p-1.5 bg-orange-100 rounded-md">
                        <AlertCircle size={16} className="text-orange-600" />
                      </div>
                      Emergency Contact
                    </h4>
                    <div className="space-y-3 bg-gradient-to-br from-orange-100/60 to-white p-5 rounded-xl border border-orange-200/80 shadow-sm h-[calc(100%-2.5rem)]">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-medium">{detailsDialog.request.emergencyContactName}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium">{detailsDialog.request.emergencyContactPhone}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Relationship</span>
                        <span className="font-medium bg-gray-50 px-2 py-0.5 rounded border shadow-sm">{detailsDialog.request.emergencyContactRelationship}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                {(detailsDialog.request.tenantImage || detailsDialog.request.aadharCard || (detailsDialog.request as any).professionIdDocUrl) && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2 border-b border-blue-100 pb-2">
                      <div className="p-1.5 bg-blue-100 rounded-md">
                        <FileText size={16} className="text-blue-600" />
                      </div>
                      Attached Documents
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {detailsDialog.request.tenantImage && (
                        <div 
                          className="group relative rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-100/60 to-white overflow-hidden cursor-pointer hover:border-blue-300 hover:shadow-md transition-all flex flex-col"
                          onClick={() => openImagePreview(detailsDialog.request!.tenantImage!, "Tenant Photo")}
                        >
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Eye className="w-8 h-8 text-white drop-shadow-md" />
                          </div>
                          <div className="h-32 p-2 bg-white/50 flex-1">
                            <img src={detailsDialog.request.tenantImage} alt="Tenant" className="w-full h-full object-cover rounded-lg shadow-sm" />
                          </div>
                          <div className="py-2.5 px-3 bg-white/80 border-t border-blue-100 text-sm font-medium text-center text-gray-700">Tenant Photo</div>
                        </div>
                      )}
                      {detailsDialog.request.aadharCard && (
                        <div 
                          className="group relative rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-100/60 to-white overflow-hidden cursor-pointer hover:border-blue-300 hover:shadow-md transition-all flex flex-col"
                          onClick={() => {
                            if (!detailsDialog.request!.aadharCard!.toLowerCase().endsWith('.pdf')) {
                               openImagePreview(detailsDialog.request!.aadharCard!, "Aadhar Card");
                            }
                          }}
                        >
                          {!detailsDialog.request.aadharCard.toLowerCase().endsWith('.pdf') && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                              <Eye className="w-8 h-8 text-white drop-shadow-md" />
                            </div>
                          )}
                          <div className="h-32 p-2 bg-white/50 flex-1">
                            {detailsDialog.request.aadharCard.toLowerCase().endsWith('.pdf') ? (
                              <iframe src={detailsDialog.request.aadharCard} title="Aadhar Card" className="w-full h-full rounded-lg shadow-sm" />
                            ) : (
                              <img src={detailsDialog.request.aadharCard} alt="Aadhar Card" className="w-full h-full object-cover rounded-lg shadow-sm" />
                            )}
                          </div>
                          <div className="py-2.5 px-3 bg-white/80 border-t border-blue-100 text-sm font-medium text-center text-gray-700">Aadhar Card</div>
                        </div>
                      )}
                      {(detailsDialog.request as any).professionIdDocUrl && (
                        <div 
                          className="group relative rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-100/60 to-white overflow-hidden cursor-pointer hover:border-blue-300 hover:shadow-md transition-all flex flex-col"
                          onClick={() => {
                            if (!(detailsDialog.request as any).professionIdDocUrl.toLowerCase().endsWith('.pdf')) {
                               openImagePreview((detailsDialog.request as any).professionIdDocUrl, "Profession ID");
                            }
                          }}
                        >
                          {!(detailsDialog.request as any).professionIdDocUrl.toLowerCase().endsWith('.pdf') && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                              <Eye className="w-8 h-8 text-white drop-shadow-md" />
                            </div>
                          )}
                          <div className="h-32 p-2 bg-white/50 flex-1">
                            {(detailsDialog.request as any).professionIdDocUrl.toLowerCase().endsWith('.pdf') ? (
                              <iframe src={(detailsDialog.request as any).professionIdDocUrl} title="Profession ID" className="w-full h-full rounded-lg shadow-sm" />
                            ) : (
                              <img src={(detailsDialog.request as any).professionIdDocUrl} alt="Profession ID" className="w-full h-full object-cover rounded-lg shadow-sm" />
                            )}
                          </div>
                          <div className="py-2.5 px-3 bg-white/80 border-t border-blue-100 text-sm font-medium text-center text-gray-700">Profession ID</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Stay History Section */}
                {isDesktop && (detailsDialog.request as any).tenantHistory && (detailsDialog.request as any).tenantHistory.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2 border-b border-emerald-100 pb-2">
                      <div className="p-1.5 bg-emerald-100 rounded-md">
                        <History size={16} className="text-emerald-600" />
                      </div>
                      Previous Stay History
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
                      {(detailsDialog.request as any).tenantHistory.map((history: any) => (
                        <div key={history.id} className="p-5 border border-emerald-100 rounded-xl bg-gradient-to-br from-emerald-100/60 to-white hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-gray-900">{history.pgName}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin size={12} /> {history.pgAddress}
                              </p>
                            </div>
                            {history.rating && (
                              <div className="flex items-center gap-0.5 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={cn("w-3 h-3", i < history.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs mt-4 py-2 border-y border-dashed border-gray-100 text-muted-foreground">
                            <div className="flex items-center gap-1.5"><Calendar size={14} className="text-blue-500" /> <span className="font-medium text-gray-700">{format(new Date(history.moveInDate), "MMM yyyy")}</span></div>
                            <div className="flex items-center gap-1.5"><Calendar size={14} className="text-orange-500" /> <span className="font-medium text-gray-700">{format(new Date(history.moveOutDate), "MMM yyyy")}</span></div>
                          </div>
                          {history.ownerFeedback && (
                            <p className="text-sm italic mt-3 text-gray-600 border-l-2 border-purple-300 pl-3">"{history.ownerFeedback}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="p-4 px-6 border-t bg-gray-50/50 rounded-b-lg flex sm:justify-end gap-2">
                <Button variant="outline" className="border-2" onClick={() => setDetailsDialog({ open: false })}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(v) => !v && setRejectDialog({ open: false, reason: "" })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Request</DialogTitle></DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Reason for rejection</Label>
            <Textarea 
              value={rejectDialog.reason} 
              onChange={(e) => setRejectDialog({...rejectDialog, reason: e.target.value})} 
              placeholder="Explain why the request is being rejected..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, reason: "" })}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending || !rejectDialog.reason.trim()}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bed Select Dialog */}
      <Dialog open={bedSelectDialog.open} onOpenChange={(v) => !v && setBedSelectDialog({ open: false, beds: [], selectedBedId: null, loading: false })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Select Bed Position</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {bedSelectDialog.beds.map((b: any) => (
              <Button 
                key={b.id} 
                variant={bedSelectDialog.selectedBedId === b.id ? "default" : "outline"}
                onClick={() => setBedSelectDialog({...bedSelectDialog, selectedBedId: b.id})}
              >
                {b.position}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleConfirmApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? "Approving..." : "Confirm & Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={imagePreview.open} onOpenChange={(v) => !v && setImagePreview({ open: false })}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{imagePreview.title}</DialogTitle></DialogHeader>
          <div className="flex justify-center p-4">
            {imagePreview.isPdf ? (
              <iframe src={imagePreview.src} className="w-full h-[70vh]" />
            ) : (
              <img src={imagePreview.src} className="max-w-full max-h-[70vh] object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}