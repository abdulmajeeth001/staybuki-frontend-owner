import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, Ban, PlayCircle, Eye, Search, MapPin, Phone, Mail, User, Building, FileText, File, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { api } from "@/apiClient";

interface PG {
  id: number;
  pgName: string;
  pgAddress: string;
  pgLocation?: string;
  latitude?: string;
  longitude?: string;
  imageUrl?: string;
  totalRooms: number;
  pgType?: "common" | "boys" | "girls";
  registrationNumber?: string;
  registrationDocumentUrl?: string;
  fssaiCertificateUrl?: string;
  status: string;
  isActive: boolean;
  approvedAt: string | null;
  rejectionReason: string | null;
  owner: {
    id: number;
    name: string;
    email: string;
    mobile: string;
  };
}

export default function AdminPGManagement() {
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPg, setSelectedPg] = useState<PG | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pgAmenities, setPgAmenities] = useState<Array<{ id: number; name: string; category: string }>>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const filterParam = params.get("filter");
    if (filterParam) {
      setFilter(filterParam);
    }
  }, [location]);

  // Fetch amenities when details dialog opens
  useEffect(() => {
    const fetchPgAmenities = async () => {
      if (selectedPg && showDetailsDialog) {
        try {
          const response = await api.get(`/api/admin/pgs/${selectedPg.id}/amenities`);
          setPgAmenities(response.data);
        } catch (error) {
          console.error("Failed to fetch PG amenities:", error);
          setPgAmenities([]);
        }
      } else {
        setPgAmenities([]);
      }
    };
    fetchPgAmenities();
  }, [selectedPg, showDetailsDialog]);

  const { data: pgs, isLoading } = useQuery<PG[]>({
    queryKey: [filter === "pending" ? "/api/admin/pgs/pending" : "/api/admin/pgs"],
  });

  const approveMutation = useMutation({
    mutationFn: async (pgId: number) => {
      const res = await api.post(`/api/admin/pgs/${pgId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pgs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pgs/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Success", description: "PG has been approved successfully." });
      setShowApproveDialog(false);
      setSelectedPg(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.error || error.message || "Failed to approve PG", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ pgId, reason }: { pgId: number; reason: string }) => {
      const res = await api.post(`/api/admin/pgs/${pgId}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pgs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pgs/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Success", description: "PG has been rejected." });
      setShowRejectDialog(false);
      setSelectedPg(null);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.error || error.message || "Failed to reject PG", variant: "destructive" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (pgId: number) => {
      const res = await api.post(`/api/admin/pgs/${pgId}/deactivate`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pgs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Success", description: "PG has been deactivated." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.error || error.message || "Failed to deactivate PG", variant: "destructive" });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (pgId: number) => {
      const res = await api.post(`/api/admin/pgs/${pgId}/activate`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pgs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Success", description: "PG has been activated." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.error || error.message || "Failed to activate PG", variant: "destructive" });
    },
  });

  const filteredPgs = pgs?.filter((pg) => {
    const matchesSearch = pg.pgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pg.owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pg.owner.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "pending") return pg.status === "pending" && matchesSearch;
    if (filter === "approved") return pg.status === "approved" && matchesSearch;
    if (filter === "rejected") return pg.status === "rejected" && matchesSearch;
    if (filter === "active") return pg.isActive && matchesSearch;
    if (filter === "inactive") return !pg.isActive && matchesSearch;
    return matchesSearch;
  });

  const getStatusBadge = (pg: PG) => {
    if (!pg.isActive) {
      return <Badge variant="destructive" className="font-medium" data-testid={`badge-status-${pg.id}`}>Inactive</Badge>;
    }
    switch (pg.status) {
      case "pending":
        return <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300 font-medium" data-testid={`badge-status-${pg.id}`}>Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700 font-medium" data-testid={`badge-status-${pg.id}`}>Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="font-medium" data-testid={`badge-status-${pg.id}`}>Rejected</Badge>;
      default:
        return <Badge variant="outline" className="font-medium" data-testid={`badge-status-${pg.id}`}>{pg.status}</Badge>;
    }
  };

  const content = (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-pg-management-title">
          PG Management
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Manage all registered PG properties
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by PG name, owner name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 md:h-11"
            data-testid="input-search-pgs"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-[200px] h-10 md:h-11" data-testid="select-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All PGs</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card className="border-border">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-32 animate-pulse" />
            <div className="h-4 bg-muted rounded w-48 animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse" />
            ))}
          </CardContent>
        </Card>
      ) : filteredPgs?.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No PGs found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredPgs?.map((pg, index) => (
              <motion.div
                key={pg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card className="border-border hover:border-primary/50 transition-colors" data-testid={`card-pg-${pg.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{pg.pgName}</CardTitle>
                        <CardDescription className="text-xs mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {pg.pgAddress || "No address"}
                        </CardDescription>
                      </div>
                      {getStatusBadge(pg)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Owner</p>
                        <p className="font-medium">{pg.owner.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Rooms</p>
                        <p className="font-medium">{pg.totalRooms}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-9"
                        onClick={() => {
                          setSelectedPg(pg);
                          setShowDetailsDialog(true);
                        }}
                        data-testid={`button-view-${pg.id}`}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {pg.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs h-9 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                            onClick={() => {
                              setSelectedPg(pg);
                              setShowApproveDialog(true);
                            }}
                            data-testid={`button-approve-${pg.id}`}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs h-9 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            onClick={() => {
                              setSelectedPg(pg);
                              setShowRejectDialog(true);
                            }}
                            data-testid={`button-reject-${pg.id}`}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {pg.status === "approved" && (
                        pg.isActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs h-9 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            onClick={() => deactivateMutation.mutate(pg.id)}
                            data-testid={`button-deactivate-${pg.id}`}
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs h-9 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                            onClick={() => activateMutation.mutate(pg.id)}
                            data-testid={`button-activate-${pg.id}`}
                          >
                            <PlayCircle className="h-3 w-3 mr-1" />
                            Activate
                          </Button>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden md:block border-border">
            <CardHeader>
              <CardTitle>PG List</CardTitle>
              <CardDescription>
                {filteredPgs?.length || 0} PG{filteredPgs?.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PG Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Rooms</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPgs?.map((pg) => (
                      <TableRow key={pg.id} data-testid={`row-pg-${pg.id}`}>
                        <TableCell className="font-medium">{pg.pgName}</TableCell>
                        <TableCell>{pg.owner.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {pg.owner.email}
                        </TableCell>
                        <TableCell>{pg.totalRooms}</TableCell>
                        <TableCell>{getStatusBadge(pg)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setSelectedPg(pg);
                                setShowDetailsDialog(true);
                              }}
                              data-testid={`button-view-${pg.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {pg.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => {
                                    setSelectedPg(pg);
                                    setShowApproveDialog(true);
                                  }}
                                  data-testid={`button-approve-${pg.id}`}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setSelectedPg(pg);
                                    setShowRejectDialog(true);
                                  }}
                                  data-testid={`button-reject-${pg.id}`}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {pg.status === "approved" && (
                              <>
                                {pg.isActive ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => deactivateMutation.mutate(pg.id)}
                                    data-testid={`button-deactivate-${pg.id}`}
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => activateMutation.mutate(pg.id)}
                                    data-testid={`button-activate-${pg.id}`}
                                  >
                                    <PlayCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PG Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-pg-details">
          <DialogHeader>
            <DialogTitle>PG Details</DialogTitle>
            <DialogDescription>Complete information about this property</DialogDescription>
          </DialogHeader>
          {selectedPg && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{selectedPg.pgName}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {selectedPg.pgAddress || "No address provided"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {getStatusBadge(selectedPg)}
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Total Rooms:</span>
                  <span className="ml-2 font-semibold">{selectedPg.totalRooms}</span>
                </div>
                {selectedPg.pgType && (
                  <div>
                    <span className="text-sm text-muted-foreground">PG Type:</span>
                    <span className="ml-2 font-semibold capitalize">
                      {selectedPg.pgType === "common" ? "Common (Boys & Girls)" : selectedPg.pgType === "boys" ? "Boys Only" : "Girls Only"}
                    </span>
                  </div>
                )}
              </div>

              {/* Registration Details */}
              {(selectedPg.registrationNumber || selectedPg.registrationDocumentUrl) && (
                <div className="p-4 rounded-lg border space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Registration Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedPg.registrationNumber && (
                      <div>
                        <span className="text-muted-foreground">Registration Number:</span>
                        <span className="ml-2 font-medium">{selectedPg.registrationNumber}</span>
                      </div>
                    )}
                    {selectedPg.registrationDocumentUrl && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Registration Document:</span>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => window.open(selectedPg.registrationDocumentUrl, '_blank')}
                          data-testid="button-view-registration-document"
                        >
                          View Document
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FSSAI Certificate */}
              {selectedPg.fssaiCertificateUrl && (
                <div className="p-4 rounded-lg border space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <File className="h-4 w-4" />
                    FSSAI Certificate
                  </h4>
                  <div className="flex items-center gap-2 text-sm">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Certificate:</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => window.open(selectedPg.fssaiCertificateUrl, '_blank')}
                      data-testid="button-view-fssai-certificate"
                    >
                      View Certificate
                    </Button>
                  </div>
                </div>
              )}

              {/* Amenities */}
              {pgAmenities.length > 0 && (
                <div className="p-4 rounded-lg border space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Amenities ({pgAmenities.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {pgAmenities.map((amenity) => (
                      <Badge key={amenity.id} variant="secondary" className="text-xs">
                        {amenity.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg border space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Owner Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedPg.owner.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{selectedPg.owner.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{selectedPg.owner.mobile}</span>
                  </div>
                </div>
              </div>

              {selectedPg.rejectionReason && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h4 className="font-semibold text-sm text-destructive mb-2">Rejection Reason</h4>
                  <p className="text-sm text-destructive/90">{selectedPg.rejectionReason}</p>
                </div>
              )}

              {selectedPg.approvedAt && (
                <div className="text-xs text-muted-foreground">
                  Approved on {new Date(selectedPg.approvedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent data-testid="dialog-approve-pg">
          <DialogHeader>
            <DialogTitle>Approve PG</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve "{selectedPg?.pgName}"? The owner will be able to access all features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} data-testid="button-cancel-approve">
              Cancel
            </Button>
            <Button
              onClick={() => selectedPg && approveMutation.mutate(selectedPg.id)}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent data-testid="dialog-reject-pg">
          <DialogHeader>
            <DialogTitle>Reject PG</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting "{selectedPg?.pgName}". This will be shown to the owner.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
            data-testid="input-rejection-reason"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} data-testid="button-cancel-reject">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedPg && rejectMutation.mutate({ pgId: selectedPg.id, reason: rejectionReason })}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return isMobile ? (
    <MobileLayout title="PG Management">{content}</MobileLayout>
  ) : (
    <DesktopLayout>{content}</DesktopLayout>
  );
}
