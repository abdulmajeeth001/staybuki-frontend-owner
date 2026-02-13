import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Building2, Users, UserCheck, UserX, Search, Eye, ChevronRight, Mail, Phone, Home, Calendar, IndianRupee, User, Star, FileText, AlertCircle, X, ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { api } from "@/apiClient";

interface OwnerStats {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  activePgCount: number;
  totalPgCount: number;
  totalActiveTenants: number;
  totalInactiveTenants: number;
}

interface PGStats {
  id: number;
  pgName: string;
  ownerId: number;
  ownerName: string;
  ownerEmail: string;
  status: string;
  isActive: boolean;
  pgType: string | null;
  activeTenantCount: number;
  inactiveTenantCount: number;
  totalRooms: number;
  occupiedRooms: number;
}

interface EmergencyContact {
  id: number;
  tenantId: number;
  name: string;
  phone: string;
  relationship: string;
}

interface TenantDetails {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: string | null;
  roomId: number | null;
  roomNumber: string | null;
  monthlyRent: string;
  tenantImage: string | null;
  aadharCard: string | null;
  photoUrl: string | null;
  idProofUrl: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  relationship: string | null;
  status: string;
  onboardingStatus: string;
  joinDate: string | null;
  createdAt: string;
  userId: number | null;
  pgId: number;
  ownerId: number;
  roomFloor: number | null;
  roomSharing: number | null;
  isActive: boolean;
  leaveDate: string | null;
  ownerFeedback: string | null;
  rating: number | null;
  behaviorTags: string[];
  emergencyContacts: EmergencyContact[];
}

export default function AdminOwnerAnalytics() {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [tenantSearchQuery, setTenantSearchQuery] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [selectedPG, setSelectedPG] = useState<PGStats | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<TenantDetails | null>(null);
  const [tenantFilter, setTenantFilter] = useState<"all" | "active" | "inactive">("all");

  const { data: owners, isLoading: loadingOwners } = useQuery<OwnerStats[]>({
    queryKey: ["/api/admin/owners/stats"],
    queryFn: async () => {
      const res = await api.get("/api/admin/owners/stats");
      return res.data;
    },
  });

  const { data: pgs, isLoading: loadingPGs } = useQuery<PGStats[]>({
    queryKey: ["/api/admin/pgs/stats", selectedOwnerId],
    queryFn: async () => {
      const url = selectedOwnerId 
        ? `/api/admin/pgs/stats?ownerId=${selectedOwnerId}`
        : "/api/admin/pgs/stats";
      const res = await api.get(url);
      return res.data;
    },
  });

  const { data: tenants, isLoading: loadingTenants } = useQuery<TenantDetails[]>({
    queryKey: ["/api/admin/pgs", selectedPG?.id, "tenants"],
    queryFn: async () => {
      if (!selectedPG) return [];
      const res = await api.get(`/api/admin/pgs/${selectedPG.id}/tenants`);
      return res.data;
    },
    enabled: !!selectedPG,
  });

  const filteredOwners = owners?.filter(owner => 
    owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredTenants = tenants?.filter(tenant => {
    const matchesFilter = tenantFilter === "all" || 
      (tenantFilter === "active" && tenant.isActive) ||
      (tenantFilter === "inactive" && !tenant.isActive);
    const matchesSearch = !tenantSearchQuery || 
      tenant.name.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
      tenant.phone?.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
      tenant.roomNumber?.toLowerCase().includes(tenantSearchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  const getOnboardingStatusBadge = (status: string) => {
    switch (status) {
      case "onboarded": return <Badge className="bg-green-500">Onboarded</Badge>;
      case "pending": return <Badge variant="outline" className="text-orange-500 border-orange-500">Pending</Badge>;
      default: return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  const renderStarRating = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`h-3.5 w-3.5 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  const getPgTypeLabel = (pgType: string | null) => {
    switch (pgType) {
      case "boys": return "Boys Only";
      case "girls": return "Girls Only";
      case "common": return "Co-ed";
      default: return "Not Set";
    }
  };

  const getPgTypeBadgeColor = (pgType: string | null) => {
    switch (pgType) {
      case "boys": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "girls": return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400";
      case "common": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const content = (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin-dashboard")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-page-title">
            Owner & PG Analytics
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            View owner-wise PG statistics and tenant details
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Owners</CardTitle>
                <CardDescription>Select an owner to view their PGs</CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm">
                {owners?.length || 0} owners
              </Badge>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search owners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-owners"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {loadingOwners ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredOwners.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No owners found
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredOwners.map((owner) => (
                    <motion.div
                      key={owner.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedOwnerId === owner.id ? "bg-primary/5 border-l-4 border-l-primary" : ""
                      }`}
                      onClick={() => setSelectedOwnerId(owner.id)}
                      data-testid={`card-owner-${owner.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">{owner.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">{owner.email}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Building2 className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{owner.activePgCount}</span>
                          <span className="text-muted-foreground">active PGs</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <UserCheck className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{owner.totalActiveTenants}</span>
                          <span className="text-muted-foreground">tenants</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">PG Properties</CardTitle>
                <CardDescription>
                  {selectedOwnerId 
                    ? `Showing PGs for ${owners?.find(o => o.id === selectedOwnerId)?.name || "selected owner"}`
                    : "Select an owner to filter PGs"}
                </CardDescription>
              </div>
              {selectedOwnerId && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedOwnerId(null)}
                  data-testid="button-clear-owner-filter"
                >
                  Clear filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {loadingPGs ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : !pgs || pgs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {selectedOwnerId ? "No PGs found for this owner" : "Select an owner to view their PGs"}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pgs.filter(pg => !selectedOwnerId || pg.ownerId === selectedOwnerId).map((pg) => (
                    <motion.div
                      key={pg.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-foreground">{pg.pgName}</h4>
                            <Badge className={getPgTypeBadgeColor(pg.pgType)}>
                              {getPgTypeLabel(pg.pgType)}
                            </Badge>
                            {pg.isActive && pg.status === "approved" ? (
                              <Badge variant="default" className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="secondary">{pg.status}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Owner: {pg.ownerName}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPG(pg)}
                          data-testid={`button-view-tenants-${pg.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Tenants
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                          <UserCheck className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Active</p>
                            <p className="font-semibold text-green-600">{pg.activeTenantCount}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                          <UserX className="h-4 w-4 text-red-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Vacated</p>
                            <p className="font-semibold text-red-600">{pg.inactiveTenantCount}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                          <Home className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Rooms</p>
                            <p className="font-semibold text-blue-600">{pg.totalRooms}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                          <Building2 className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Occupied</p>
                            <p className="font-semibold text-purple-600">{pg.occupiedRooms}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedPG} onOpenChange={(open) => !open && setSelectedPG(null)}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-hidden p-4 sm:p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="truncate">{selectedPG?.pgName} - Tenants</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              View all tenants (active and vacated) for this property
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative mb-3 sm:mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              value={tenantSearchQuery}
              onChange={(e) => setTenantSearchQuery(e.target.value)}
              className="pl-10 h-9 sm:h-10 text-sm"
              data-testid="input-search-tenants"
            />
          </div>
          
          <Tabs defaultValue="all" value={tenantFilter} onValueChange={(v) => setTenantFilter(v as any)}>
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="all" data-testid="tab-all-tenants" className="text-xs sm:text-sm px-2">
                All ({tenants?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="active" data-testid="tab-active-tenants" className="text-xs sm:text-sm px-2">
                Active ({tenants?.filter(t => t.isActive).length || 0})
              </TabsTrigger>
              <TabsTrigger value="inactive" data-testid="tab-inactive-tenants" className="text-xs sm:text-sm px-2">
                Vacated ({tenants?.filter(t => !t.isActive).length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={tenantFilter} className="mt-3 sm:mt-4">
              <ScrollArea className="h-[40vh] sm:h-[50vh]">
                {loadingTenants ? (
                  <div className="space-y-3 p-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : filteredTenants.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No {tenantFilter === "all" ? "" : tenantFilter} tenants found
                  </div>
                ) : isMobile ? (
                  <div className="space-y-3 p-2">
                    {filteredTenants.map((tenant) => (
                      <motion.div 
                        key={tenant.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg border bg-card cursor-pointer active:bg-muted/50"
                        onClick={() => setSelectedTenant(tenant)}
                        data-testid={`card-tenant-${tenant.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={tenant.tenantImage || tenant.photoUrl || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {tenant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{tenant.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {tenant.roomNumber ? `Room ${tenant.roomNumber}` : 'No room'} • ₹{parseFloat(tenant.monthlyRent).toLocaleString('en-IN')}
                                </p>
                              </div>
                              <div className="shrink-0">
                                {tenant.isActive ? (
                                  <Badge className="bg-green-500 text-xs">Active</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Vacated</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />{tenant.phone}
                              </span>
                              {tenant.rating && (
                                <span className="flex items-center gap-0.5">
                                  {renderStarRating(tenant.rating)}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Rent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTenants.map((tenant) => (
                        <TableRow key={tenant.id} data-testid={`row-tenant-${tenant.id}`} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedTenant(tenant)}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={tenant.tenantImage || tenant.photoUrl || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {tenant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{tenant.name}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  {tenant.gender && (
                                    <Badge variant="outline" className="text-xs">
                                      {tenant.gender}
                                    </Badge>
                                  )}
                                  {getOnboardingStatusBadge(tenant.onboardingStatus)}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {tenant.roomNumber ? (
                              <div className="text-sm">
                                <p className="font-medium">{tenant.roomNumber}</p>
                                <p className="text-muted-foreground">
                                  {tenant.roomSharing ? `${tenant.roomSharing}-sharing` : ''} 
                                  {tenant.roomFloor !== null ? ` • Floor ${tenant.roomFloor}` : ''}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="truncate max-w-[150px]">{tenant.email || '-'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{tenant.phone}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <IndianRupee className="h-3.5 w-3.5" />
                              <span className="font-medium">
                                {parseFloat(tenant.monthlyRent).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Joined: {tenant.joinDate ? format(new Date(tenant.joinDate), "dd MMM yy") : format(new Date(tenant.createdAt), "dd MMM yy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {tenant.isActive ? (
                                <Badge className="bg-green-500">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Vacated</Badge>
                              )}
                              {tenant.leaveDate && (
                                <p className="text-muted-foreground text-xs">
                                  Left: {format(new Date(tenant.leaveDate), "dd MMM yy")}
                                </p>
                              )}
                              {tenant.rating && renderStarRating(tenant.rating)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setSelectedTenant(tenant); }}
                              data-testid={`button-view-tenant-${tenant.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selectedTenant} onOpenChange={(open) => !open && setSelectedTenant(null)}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col h-full">
          <div className="p-6 pb-4 border-b shrink-0">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                  <AvatarImage src={selectedTenant?.tenantImage || selectedTenant?.photoUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-base sm:text-lg">
                    {selectedTenant?.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-base sm:text-lg">{selectedTenant?.name}</span>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {selectedTenant?.isActive ? (
                      <Badge className="bg-green-500 text-xs">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Vacated</Badge>
                    )}
                    {selectedTenant?.gender && (
                      <Badge variant="outline" className="text-xs">{selectedTenant.gender}</Badge>
                    )}
                  </div>
                </div>
              </SheetTitle>
              <SheetDescription className="sr-only">
                Complete tenant information
              </SheetDescription>
            </SheetHeader>
          </div>

          {selectedTenant && (
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-6 pb-6">
                <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contact Information</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Phone className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedTenant.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Mail className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedTenant.email || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Room & Payment</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Home className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Room</p>
                      <p className="font-medium">{selectedTenant.roomNumber || '-'}</p>
                      {selectedTenant.roomSharing && (
                        <p className="text-xs text-muted-foreground">{selectedTenant.roomSharing}-sharing</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <IndianRupee className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Rent</p>
                      <p className="font-medium">₹{parseFloat(selectedTenant.monthlyRent).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Dates</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Join Date</p>
                      <p className="font-medium">
                        {selectedTenant.joinDate 
                          ? format(new Date(selectedTenant.joinDate), "dd MMM yyyy")
                          : format(new Date(selectedTenant.createdAt), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                  {selectedTenant.leaveDate && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Leave Date</p>
                        <p className="font-medium text-red-600">{format(new Date(selectedTenant.leaveDate), "dd MMM yyyy")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Status</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Onboarding</p>
                    <div className="mt-1">{getOnboardingStatusBadge(selectedTenant.onboardingStatus)}</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Housing Status</p>
                    <div className="mt-1">
                      {selectedTenant.isActive ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Vacated</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {(selectedTenant.emergencyContactName || (selectedTenant.emergencyContacts && selectedTenant.emergencyContacts.length > 0)) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Emergency Contacts</h4>
                    <div className="space-y-2">
                      {selectedTenant.emergencyContactName && (
                        <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <div className="flex-1">
                            <p className="font-medium">{selectedTenant.emergencyContactName}</p>
                            <p className="text-sm text-muted-foreground">{selectedTenant.relationship} • {selectedTenant.emergencyContactPhone}</p>
                          </div>
                        </div>
                      )}
                      {selectedTenant.emergencyContacts?.map((contact) => (
                        <div key={contact.id} className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <div className="flex-1">
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-sm text-muted-foreground">{contact.relationship} • {contact.phone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {(selectedTenant.tenantImage || selectedTenant.aadharCard) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Documents</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedTenant.tenantImage && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Tenant Photo</p>
                          <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                            <img 
                              src={selectedTenant.tenantImage} 
                              alt="Tenant" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                      {selectedTenant.aadharCard && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Aadhar Card</p>
                          <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                            <img 
                              src={selectedTenant.aadharCard} 
                              alt="Aadhar Card" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {!selectedTenant.isActive && selectedTenant.ownerFeedback && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Owner Feedback</h4>
                    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                      {selectedTenant.rating && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Rating:</span>
                          {renderStarRating(selectedTenant.rating)}
                        </div>
                      )}
                      <p className="text-sm">{selectedTenant.ownerFeedback}</p>
                      {selectedTenant.behaviorTags && selectedTenant.behaviorTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedTenant.behaviorTags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );

  return isMobile ? (
    <MobileLayout title="Owner Analytics">{content}</MobileLayout>
  ) : (
    <DesktopLayout>{content}</DesktopLayout>
  );
}
