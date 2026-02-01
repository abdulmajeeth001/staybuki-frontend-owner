import { useState } from "react";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock, Plus, Filter, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/apiClient";

type Complaint = {
  id: number;
  pgId: number;
  ownerId: number;
  tenantId: number | null;
  roomId: number | null;
  title: string;
  description: string;
  priority: string;
  status: string;
  resolutionNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

type Room = {
  id: number;
  roomNumber: string;
};

type Tenant = {
  id: number;
  name: string;
};

export default function Complaints() {
  return (
    <>
      <div className="hidden lg:block">
        <ComplaintsDesktop />
      </div>
      <div className="lg:hidden">
        <ComplaintsMobile />
      </div>
    </>
  );
}

function ComplaintsDesktop() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  // Fetch complaints
  const { data: complaints = [], isLoading } = useQuery<Complaint[]>({
    queryKey: ["complaints"],
    queryFn: async () => {
      const response = await api.get("/api/complaints");
      return response.data;
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch rooms for dropdown
  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: async () => {
      const response = await api.get("/api/rooms");
      return response.data;
    },
  });

  // Fetch tenants for dropdown
  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: async () => {
      const response = await api.get("/api/tenants");
      return response.data;
    },
  });

  // Create complaint mutation
  const createComplaintMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/api/complaints", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Complaint created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.error || error.message || "Failed to create complaint", variant: "destructive" });
    },
  });

  // Update complaint mutation
  const updateComplaintMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await api.put(`/api/complaints/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      setIsUpdateDialogOpen(false);
      setSelectedComplaint(null);
      toast({ title: "Complaint updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.error || error.message || "Failed to update complaint", variant: "destructive" });
    },
  });

  // Filter complaints
  const filteredComplaints = complaints.filter((complaint) => {
    if (statusFilter !== "all" && complaint.status !== statusFilter) return false;
    if (priorityFilter !== "all" && complaint.priority !== priorityFilter) return false;
    return true;
  });

  const handleCreateComplaint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createComplaintMutation.mutate({
      title: formData.get("title"),
      description: formData.get("description"),
      priority: formData.get("priority"),
      status: "open",
      tenantId: formData.get("tenantId") ? parseInt(formData.get("tenantId") as string) : null,
      roomId: formData.get("roomId") ? parseInt(formData.get("roomId") as string) : null,
    });
  };

  const handleUpdateComplaint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    
    const formData = new FormData(e.currentTarget);
    updateComplaintMutation.mutate({
      id: selectedComplaint.id,
      data: {
        status: formData.get("status"),
        resolutionNotes: formData.get("resolutionNotes") || null,
      },
    });
  };

  const getStatusIcon = (status: string) => {
    if (status === "resolved") return <CheckCircle className="w-5 h-5" />;
    if (status === "in-progress") return <Clock className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "resolved") return "bg-green-100 text-green-600";
    if (status === "in-progress") return "bg-blue-100 text-blue-600";
    return "bg-red-100 text-red-600";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "bg-red-100 text-red-700";
    if (priority === "medium") return "bg-yellow-100 text-yellow-700";
    return "bg-blue-100 text-blue-700";
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === "high") return "🔴";
    if (priority === "medium") return "🟡";
    return "🔵";
  };

  const getRoomNumber = (roomId: number | null) => {
    if (!roomId) return "N/A";
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.roomNumber : "Unknown";
  };

  const getTenantName = (tenantId: number | null) => {
    if (!tenantId) return "N/A";
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.name : "Unknown";
  };

  // Calculate stats
  const openCount = complaints.filter(c => c.status === "open").length;
  const inProgressCount = complaints.filter(c => c.status === "in-progress").length;
  const resolvedCount = complaints.filter(c => c.status === "resolved").length;
  const highPriorityCount = complaints.filter(c => c.priority === "high" && c.status !== "resolved").length;

  const statusStats = [
    { 
      label: "Open Issues", 
      value: openCount, 
      icon: AlertCircle, 
      gradient: "from-red-500 to-orange-600",
      bgColor: "bg-red-100",
      textColor: "text-red-600"
    },
    { 
      label: "In Progress", 
      value: inProgressCount, 
      icon: Clock, 
      gradient: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600"
    },
    { 
      label: "Resolved", 
      value: resolvedCount, 
      icon: CheckCircle, 
      gradient: "from-emerald-500 to-green-600",
      bgColor: "bg-green-100",
      textColor: "text-green-600"
    },
    { 
      label: "High Priority", 
      value: highPriorityCount, 
      icon: AlertTriangle, 
      gradient: "from-orange-500 to-red-600",
      bgColor: "bg-orange-100",
      textColor: "text-orange-600"
    },
  ];

  if (isLoading) {
    return (
      <DesktopLayout title="Complaints & Issues" showNav={false}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading complaints...</p>
        </div>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout title="Complaints & Issues" showNav={false}>
      {/* Hero Section with Gradient */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative px-8 py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2">Complaints & Issues</h2>
              <p className="text-white/80 text-sm">Track and resolve tenant complaints efficiently</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white transition-all duration-300"
                  data-testid="button-create-complaint"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Complaint
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Complaint</DialogTitle>
                  <DialogDescription>Add a new complaint or issue to track</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateComplaint}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Issue Title</Label>
                      <Input id="title" name="title" required data-testid="input-complaint-title" />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" required data-testid="input-complaint-description" />
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select name="priority" defaultValue="medium" required>
                        <SelectTrigger data-testid="select-complaint-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low" data-testid="select-priority-low">Low</SelectItem>
                          <SelectItem value="medium" data-testid="select-priority-medium">Medium</SelectItem>
                          <SelectItem value="high" data-testid="select-priority-high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="roomId">Room (Optional)</Label>
                      <Select name="roomId">
                        <SelectTrigger data-testid="select-complaint-room">
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.filter(room => room?.id).map((room) => (
                            <SelectItem key={room.id} value={room.id.toString()}>
                              {room.roomNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tenantId">Tenant (Optional)</Label>
                      <Select name="tenantId">
                        <SelectTrigger data-testid="select-complaint-tenant">
                          <SelectValue placeholder="Select tenant" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.filter(tenant => tenant?.id).map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id.toString()}>
                              {tenant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="submit" disabled={createComplaintMutation.isPending} data-testid="button-submit-complaint">
                      {createComplaintMutation.isPending ? "Creating..." : "Create Complaint"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statusStats.map((stat, i) => (
          <Card key={i} className="group relative overflow-hidden border-2 hover:border-purple-200 hover:shadow-2xl transition-all duration-300" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110",
                  `bg-gradient-to-br ${stat.gradient}`
                )}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-semibold mb-1">{stat.label}</p>
                <h3 className={cn(
                  "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                  `${stat.gradient}`
                )}>{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Complaint List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="filter-status">
                  <Filter className="w-4 h-4 mr-2" />
                  Status: {statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                  <DropdownMenuRadioItem value="all" data-testid="filter-status-all">All</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="open" data-testid="filter-status-open">Open</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="in-progress" data-testid="filter-status-in-progress">In Progress</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="resolved" data-testid="filter-status-resolved">Resolved</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="filter-priority">
                  <Filter className="w-4 h-4 mr-2" />
                  Priority: {priorityFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={priorityFilter} onValueChange={setPriorityFilter}>
                  <DropdownMenuRadioItem value="all" data-testid="filter-priority-all">All</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="low" data-testid="filter-priority-low">Low</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="medium" data-testid="filter-priority-medium">Medium</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="high" data-testid="filter-priority-high">High</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {filteredComplaints.length === 0 ? (
          <Card className="border-2">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No complaints found</h3>
              <p className="text-sm text-muted-foreground" data-testid="text-no-complaints">
                {statusFilter !== "all" || priorityFilter !== "all" 
                  ? "Try adjusting your filters to see more results" 
                  : "No complaints have been reported yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => (
              <Card key={complaint.id} className="group relative overflow-hidden border-2 hover:border-purple-200 hover:shadow-xl transition-all duration-300" data-testid={`card-complaint-${complaint.id}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 group-hover:scale-110",
                        complaint.status === "resolved" ? "bg-gradient-to-br from-emerald-500 to-green-600" :
                        complaint.status === "in-progress" ? "bg-gradient-to-br from-blue-500 to-cyan-600" :
                        "bg-gradient-to-br from-red-500 to-orange-600"
                      )}>
                        <div className="text-white">
                          {getStatusIcon(complaint.status)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-foreground" data-testid={`text-complaint-title-${complaint.id}`}>{complaint.title}</h3>
                          <span className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-bold shadow-sm",
                            complaint.priority === "high" ? "bg-gradient-to-r from-red-500 to-orange-500 text-white" :
                            complaint.priority === "medium" ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white" :
                            "bg-gradient-to-r from-blue-400 to-cyan-400 text-white"
                          )} data-testid={`text-complaint-priority-${complaint.id}`}>
                            {getPriorityIcon(complaint.priority)} {complaint.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed" data-testid={`text-complaint-description-${complaint.id}`}>
                          {complaint.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground" data-testid={`text-complaint-details-${complaint.id}`}>
                          <span className="font-medium">Room {getRoomNumber(complaint.roomId)}</span>
                          <span>•</span>
                          <span>{getTenantName(complaint.tenantId)}</span>
                          <span>•</span>
                          <span>{format(new Date(complaint.createdAt), "MMM d, yyyy")}</span>
                        </div>
                        {complaint.status === "resolved" && complaint.resolvedAt && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            <p className="text-xs font-semibold text-green-700">
                              Resolved on {format(new Date(complaint.resolvedAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        )}
                        {complaint.resolutionNotes && (
                          <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                            <p className="text-xs font-semibold text-blue-900 mb-1">Resolution Notes:</p>
                            <p className="text-xs text-blue-700">{complaint.resolutionNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {complaint.status !== "resolved" && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setIsUpdateDialogOpen(true);
                          }}
                          data-testid={`button-update-complaint-${complaint.id}`}
                        >
                          Update Status
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Update Complaint Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Complaint</DialogTitle>
              <DialogDescription>Update the status and add resolution notes</DialogDescription>
            </DialogHeader>
            {selectedComplaint && (
              <form onSubmit={handleUpdateComplaint}>
                <div className="space-y-4">
                  <div>
                    <Label>Issue</Label>
                    <p className="text-sm text-muted-foreground">{selectedComplaint.title}</p>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={selectedComplaint.status} required>
                      <SelectTrigger data-testid="select-update-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open" data-testid="select-status-open">Open</SelectItem>
                        <SelectItem value="in-progress" data-testid="select-status-in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved" data-testid="select-status-resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="resolutionNotes">Resolution Notes</Label>
                    <Textarea
                      id="resolutionNotes"
                      name="resolutionNotes"
                      defaultValue={selectedComplaint.resolutionNotes || ""}
                      placeholder="Add notes about the resolution..."
                      data-testid="input-resolution-notes"
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit" disabled={updateComplaintMutation.isPending} data-testid="button-submit-update">
                    {updateComplaintMutation.isPending ? "Updating..." : "Update Complaint"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DesktopLayout>
  );
}

function ComplaintsMobile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  // Fetch complaints
  const { data: complaints = [], isLoading } = useQuery<Complaint[]>({
    queryKey: ["complaints"],
    queryFn: async () => {
      const response = await api.get("/api/complaints");
      return response.data;
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch rooms for dropdown
  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: async () => {
      const response = await api.get("/api/rooms");
      return response.data;
    },
  });

  // Fetch tenants for dropdown
  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: async () => {
      const response = await api.get("/api/tenants");
      return response.data;
    },
  });

  // Create complaint mutation
  const createComplaintMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/api/complaints", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Complaint created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.error || error.message || "Failed to create complaint", variant: "destructive" });
    },
  });

  // Update complaint mutation
  const updateComplaintMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await api.put(`/api/complaints/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      setIsUpdateDialogOpen(false);
      setSelectedComplaint(null);
      toast({ title: "Complaint updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.error || error.message || "Failed to update complaint", variant: "destructive" });
    },
  });

  // Filter complaints
  const filteredComplaints = complaints.filter((complaint) => {
    if (statusFilter !== "all" && complaint.status !== statusFilter) return false;
    if (priorityFilter !== "all" && complaint.priority !== priorityFilter) return false;
    return true;
  });

  const handleCreateComplaint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createComplaintMutation.mutate({
      title: formData.get("title"),
      description: formData.get("description"),
      priority: formData.get("priority"),
      status: "open",
      tenantId: formData.get("tenantId") ? parseInt(formData.get("tenantId") as string) : null,
      roomId: formData.get("roomId") ? parseInt(formData.get("roomId") as string) : null,
    });
  };

  const handleUpdateComplaint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    
    const formData = new FormData(e.currentTarget);
    updateComplaintMutation.mutate({
      id: selectedComplaint.id,
      data: {
        status: formData.get("status"),
        resolutionNotes: formData.get("resolutionNotes") || null,
      },
    });
  };

  const getStatusIcon = (status: string) => {
    if (status === "resolved") return <CheckCircle className="w-5 h-5" />;
    if (status === "in-progress") return <Clock className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === "high") return "🔴";
    if (priority === "medium") return "🟡";
    return "🔵";
  };

  const getRoomNumber = (roomId: number | null) => {
    if (!roomId) return "N/A";
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.roomNumber : "Unknown";
  };

  const getTenantName = (tenantId: number | null) => {
    if (!tenantId) return "N/A";
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.name : "Unknown";
  };

  // Calculate stats
  const openCount = complaints.filter(c => c.status === "open").length;
  const inProgressCount = complaints.filter(c => c.status === "in-progress").length;
  const resolvedCount = complaints.filter(c => c.status === "resolved").length;
  const highPriorityCount = complaints.filter(c => c.priority === "high" && c.status !== "resolved").length;

  if (isLoading) {
    return (
      <MobileLayout 
        title="Complaints" 
        action={
          <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600" data-testid="button-create-complaint-mobile">
            <Plus className="w-4 h-4" />
          </Button>
        }
      >
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title="Complaints"
      action={
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600" data-testid="button-create-complaint-mobile">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw]">
            <DialogHeader>
              <DialogTitle>New Complaint</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateComplaint}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title-mobile" className="text-sm">Title</Label>
                  <Input id="title-mobile" name="title" required data-testid="input-complaint-title-mobile" />
                </div>
                <div>
                  <Label htmlFor="description-mobile" className="text-sm">Description</Label>
                  <Textarea id="description-mobile" name="description" required rows={3} data-testid="input-complaint-description-mobile" />
                </div>
                <div>
                  <Label htmlFor="priority-mobile" className="text-sm">Priority</Label>
                  <Select name="priority" defaultValue="medium" required>
                    <SelectTrigger data-testid="select-complaint-priority-mobile">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-4 flex-col gap-2">
                <Button type="submit" disabled={createComplaintMutation.isPending} className="w-full" data-testid="button-submit-complaint-mobile">
                  {createComplaintMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-4 pb-20">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="overflow-hidden border-2" data-testid="card-stat-open-mobile">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mb-3 shadow-md">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Open</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                {openCount}
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2" data-testid="card-stat-in-progress-mobile">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-3 shadow-md">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">In Progress</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {inProgressCount}
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2" data-testid="card-stat-resolved-mobile">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-3 shadow-md">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Resolved</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                {resolvedCount}
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2" data-testid="card-stat-high-priority-mobile">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-3 shadow-md">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">High Priority</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {highPriorityCount}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className={cn("rounded-full whitespace-nowrap", statusFilter === "all" && "bg-gradient-to-r from-purple-600 to-blue-600")}
            data-testid="filter-status-all-mobile"
          >
            All
          </Button>
          <Button
            variant={statusFilter === "open" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("open")}
            className={cn("rounded-full whitespace-nowrap", statusFilter === "open" && "bg-gradient-to-r from-red-600 to-orange-600")}
            data-testid="filter-status-open-mobile"
          >
            Open
          </Button>
          <Button
            variant={statusFilter === "in-progress" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("in-progress")}
            className={cn("rounded-full whitespace-nowrap", statusFilter === "in-progress" && "bg-gradient-to-r from-blue-600 to-cyan-600")}
            data-testid="filter-status-in-progress-mobile"
          >
            In Progress
          </Button>
          <Button
            variant={statusFilter === "resolved" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("resolved")}
            className={cn("rounded-full whitespace-nowrap", statusFilter === "resolved" && "bg-gradient-to-r from-emerald-600 to-green-600")}
            data-testid="filter-status-resolved-mobile"
          >
            Resolved
          </Button>
        </div>

        {/* Complaints List */}
        {filteredComplaints.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-base font-semibold mb-2">No complaints found</h3>
            <p className="text-sm text-muted-foreground" data-testid="text-no-complaints-mobile">
              {statusFilter !== "all" || priorityFilter !== "all" 
                ? "Try adjusting filters" 
                : "No complaints reported yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComplaints.map((complaint) => (
              <Card key={complaint.id} className="overflow-hidden border-2" data-testid={`card-complaint-${complaint.id}-mobile`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md",
                      complaint.status === "resolved" ? "bg-gradient-to-br from-emerald-500 to-green-600" :
                      complaint.status === "in-progress" ? "bg-gradient-to-br from-blue-500 to-cyan-600" :
                      "bg-gradient-to-br from-red-500 to-orange-600"
                    )}>
                      <div className="text-white">
                        {getStatusIcon(complaint.status)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base truncate" data-testid={`text-complaint-title-${complaint.id}-mobile`}>
                          {complaint.title}
                        </h3>
                        <span className="text-xs" data-testid={`text-complaint-priority-${complaint.id}-mobile`}>
                          {getPriorityIcon(complaint.priority)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2" data-testid={`text-complaint-description-${complaint.id}-mobile`}>
                        {complaint.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Room {getRoomNumber(complaint.roomId)}</span>
                        <span>•</span>
                        <span>{format(new Date(complaint.createdAt), "MMM d")}</span>
                      </div>
                    </div>
                  </div>

                  {complaint.status !== "resolved" && (
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                      onClick={() => {
                        setSelectedComplaint(complaint);
                        setIsUpdateDialogOpen(true);
                      }}
                      data-testid={`button-update-complaint-${complaint.id}-mobile`}
                    >
                      Update Status
                    </Button>
                  )}

                  {complaint.status === "resolved" && complaint.resolvedAt && (
                    <div className="flex items-center gap-2 text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-2 rounded-lg border border-emerald-200">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">
                        Resolved {format(new Date(complaint.resolvedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Update Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="max-w-[95vw]">
            <DialogHeader>
              <DialogTitle>Update Complaint</DialogTitle>
            </DialogHeader>
            {selectedComplaint && (
              <form onSubmit={handleUpdateComplaint}>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Issue</Label>
                    <p className="text-sm text-muted-foreground">{selectedComplaint.title}</p>
                  </div>
                  <div>
                    <Label htmlFor="status-mobile" className="text-sm">Status</Label>
                    <Select name="status" defaultValue={selectedComplaint.status} required>
                      <SelectTrigger data-testid="select-update-status-mobile">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="resolutionNotes-mobile" className="text-sm">Resolution Notes</Label>
                    <Textarea
                      id="resolutionNotes-mobile"
                      name="resolutionNotes"
                      defaultValue={selectedComplaint.resolutionNotes || ""}
                      placeholder="Add resolution notes..."
                      rows={3}
                      data-testid="input-resolution-notes-mobile"
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4 flex-col gap-2">
                  <Button type="submit" disabled={updateComplaintMutation.isPending} className="w-full" data-testid="button-submit-update-mobile">
                    {updateComplaintMutation.isPending ? "Updating..." : "Update"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}
