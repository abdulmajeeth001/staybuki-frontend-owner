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
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
        handleReject={() => rejectMutation.mutate({ id: rejectDialog.request!.id, reason: rejectDialog.reason })}
        rejectMutation={rejectMutation}
        bedSelectDialog={bedSelectDialog}
        setBedSelectDialog={setBedSelectDialog}
        handleApprove={handleApprove}
        handleConfirmApprove={() => approveMutation.mutate({ id: bedSelectDialog.request!.id, bedId: bedSelectDialog.selectedBedId || undefined })}
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
        <DialogContent className="max-w-3xl p-0">
          {detailsDialog.request && (
            <>
              <DialogHeader className="p-6 pb-4">
                <DialogTitle className="text-2xl font-bold">Onboarding Request Details</DialogTitle>
              </DialogHeader>
              <div className="max-h-[75vh] overflow-y-auto px-6 pb-6 space-y-6">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-secondary/50 rounded-xl border">
                  <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border-4 border-background shadow-md">
                    {detailsDialog.request.tenantImage ? (
                      <img src={detailsDialog.request.tenantImage} alt={detailsDialog.request.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-muted-foreground m-auto" />
                    )}
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <h3 className="text-2xl font-bold">{detailsDialog.request.name}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground justify-center sm:justify-start">
                      <Mail size={14} />
                      <span>{detailsDialog.request.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground justify-center sm:justify-start">
                      <Phone size={14} />
                      <span>{detailsDialog.request.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><Building2 size={16} className="text-primary" /> Request Details</h4>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Room</span>
                      <span className="font-medium">{detailsDialog.request.roomNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Monthly Rent</span>
                      <span className="font-bold text-green-600">₹{detailsDialog.request.monthlyRent}</span>
                    </div>
                    {detailsDialog.request.profession && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Profession</span>
                        <span className="font-medium">{detailsDialog.request.profession}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><AlertCircle size={16} className="text-destructive" /> Emergency Contact</h4>
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
                      <span className="font-medium">{detailsDialog.request.emergencyContactRelationship}</span>
                    </div>
                  </div>
                </div>

                {(detailsDialog.request.tenantImage || detailsDialog.request.aadharCard || (detailsDialog.request as any).professionIdDocUrl) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><FileText size={16} className="text-primary" /> Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {detailsDialog.request.tenantImage && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Tenant Photo</Label>
                          <img src={detailsDialog.request.tenantImage} alt="Tenant" className="mt-2 rounded-lg border w-full h-48 object-cover cursor-pointer" onClick={() => openImagePreview(detailsDialog.request!.tenantImage!, "Tenant Photo")} />
                        </div>
                      )}
                      {detailsDialog.request.aadharCard && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Aadhar Card</Label>
                          {detailsDialog.request.aadharCard.toLowerCase().endsWith('.pdf') ? (
                            <iframe src={detailsDialog.request.aadharCard} title="Aadhar Card" className="mt-2 rounded-lg border w-full h-48" />
                          ) : (
                            <img src={detailsDialog.request.aadharCard} alt="Aadhar Card" className="mt-2 rounded-lg border w-full h-48 object-cover cursor-pointer" onClick={() => openImagePreview(detailsDialog.request!.aadharCard!, "Aadhar Card")} />
                          )}
                        </div>
                      )}
                      {(detailsDialog.request as any).professionIdDocUrl && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Profession ID</Label>
                          {(detailsDialog.request as any).professionIdDocUrl.toLowerCase().endsWith('.pdf') ? (
                            <iframe src={(detailsDialog.request as any).professionIdDocUrl} title="Profession ID" className="mt-2 rounded-lg border w-full h-48" />
                          ) : (
                            <img src={(detailsDialog.request as any).professionIdDocUrl} alt="Profession ID" className="mt-2 rounded-lg border w-full h-48 object-cover cursor-pointer" onClick={() => openImagePreview((detailsDialog.request as any).professionIdDocUrl, "Profession ID")} />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isDesktop && (detailsDialog.request as any).tenantHistory && (detailsDialog.request as any).tenantHistory.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><History size={16} className="text-primary" /> Previous Stay History</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {(detailsDialog.request as any).tenantHistory.map((history: any) => (
                        <div key={history.id} className="p-4 border rounded-lg bg-secondary/50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{history.pgName}</p>
                              <p className="text-xs text-muted-foreground">{history.pgAddress}</p>
                            </div>
                            {history.rating && (
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={cn("w-4 h-4", i < history.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs mt-3 text-muted-foreground">
                            <div className="flex items-center gap-1"><Calendar size={14} /> Move-in: {format(new Date(history.moveInDate), "MMM yyyy")}</div>
                            <div className="flex items-center gap-1"><Calendar size={14} /> Move-out: {format(new Date(history.moveOutDate), "MMM yyyy")}</div>
                          </div>
                          {history.ownerFeedback && (
                            <p className="text-xs italic mt-2 text-muted-foreground">"{history.ownerFeedback}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="p-6 pt-0 bg-background rounded-b-lg">
                <Button variant="outline" onClick={() => setDetailsDialog({ open: false })}>Close</Button>
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