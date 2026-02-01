import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Plus, Pencil, Trash2, AlertCircle, Users, Building2, Layers, ChevronRight, Bell, Clock, X } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { usePG } from "@/hooks/use-pg";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/apiClient";

type Priority = "low" | "medium" | "high";

interface Announcement {
  id: number;
  pgId: number;
  ownerId: number;
  heading: string;
  details: string;
  priority: Priority;
  targetRooms: number[] | null;
  targetFloors: number[] | null;
  targetTenants: number[] | null;
  createdAt: string;
}

interface Room {
  id: number;
  roomNumber: string;
  floor: number | null;
}

interface Tenant {
  id: number;
  name: string;
  roomId: number | null;
}

interface AnnouncementFormData {
  heading: string;
  details: string;
  priority: Priority;
  targetRooms: number[];
  targetFloors: number[];
  targetTenants: number[];
}

export default function Announcements() {
  return (
    <DesktopLayout title="Announcements">
      <AnnouncementsContent />
    </DesktopLayout>
  );
}

function AnnouncementsContent() {
  const { user, isLoading: isUserLoading } = useUser();
  const { pg: selectedPg, isLoading: isPgLoading } = usePG();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [sendToAll, setSendToAll] = useState(true);
  const [formData, setFormData] = useState<AnnouncementFormData>({
    heading: "",
    details: "",
    priority: "medium",
    targetRooms: [],
    targetFloors: [],
    targetTenants: [],
  });

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/announcements");
        return res.data;
      } catch (error) {
        return [];
      }
    },
    enabled: !!selectedPg,
  });

  const { data: roomsData = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/rooms");
        return res.data.map((item: { room: Room; tenants: unknown[] }) => item.room);
      } catch (error) {
        return [];
      }
    },
    enabled: !!selectedPg,
  });

  const { data: tenantsData = [] } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/tenants");
        return res.data;
      } catch (error) {
        return [];
      }
    },
    enabled: !!selectedPg,
  });

  const rooms = roomsData.filter(r => r && r.id != null);
  const tenants = tenantsData.filter(t => t && t.id != null);

  const createMutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      const res = await api.post("/api/announcements", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Announcement created and tenants notified" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create announcement", description: error.response?.data?.error || error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AnnouncementFormData }) => {
      const res = await api.put(`/api/announcements/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Announcement updated" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update announcement", description: error.response?.data?.error || error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/api/announcements/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Announcement deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete announcement", description: error.response?.data?.error || error.message, variant: "destructive" });
    },
  });

  const handleCreateNew = () => {
    setEditingAnnouncement(null);
    setSendToAll(true);
    setFormData({
      heading: "",
      details: "",
      priority: "medium",
      targetRooms: [],
      targetFloors: [],
      targetTenants: [],
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    const hasTargets = (announcement.targetRooms?.length || 0) > 0 || 
                       (announcement.targetFloors?.length || 0) > 0 || 
                       (announcement.targetTenants?.length || 0) > 0;
    setSendToAll(!hasTargets);
    setFormData({
      heading: announcement.heading,
      details: announcement.details,
      priority: announcement.priority,
      targetRooms: announcement.targetRooms || [],
      targetFloors: announcement.targetFloors || [],
      targetTenants: announcement.targetTenants || [],
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAnnouncement(null);
  };

  const handleSubmit = () => {
    if (!formData.heading.trim()) {
      toast({ title: "Heading is required", variant: "destructive" });
      return;
    }
    if (!formData.details.trim()) {
      toast({ title: "Details are required", variant: "destructive" });
      return;
    }

    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      deleteMutation.mutate(id);
    }
  };

  const getPriorityStyles = (priority: Priority) => {
    switch (priority) {
      case "high":
        return {
          bg: "bg-gradient-to-r from-red-500 to-rose-600",
          text: "text-white",
          border: "border-red-200",
          glow: "shadow-red-100",
          icon: "text-red-500",
          indicator: "bg-red-500"
        };
      case "medium":
        return {
          bg: "bg-gradient-to-r from-amber-500 to-orange-500",
          text: "text-white",
          border: "border-amber-200",
          glow: "shadow-amber-100",
          icon: "text-amber-500",
          indicator: "bg-amber-500"
        };
      case "low":
        return {
          bg: "bg-gradient-to-r from-blue-500 to-indigo-500",
          text: "text-white",
          border: "border-blue-200",
          glow: "shadow-blue-100",
          icon: "text-blue-500",
          indicator: "bg-blue-500"
        };
      default:
        return {
          bg: "bg-gradient-to-r from-gray-500 to-slate-500",
          text: "text-white",
          border: "border-gray-200",
          glow: "shadow-gray-100",
          icon: "text-gray-500",
          indicator: "bg-gray-500"
        };
    }
  };

  const getTargetingInfo = (announcement: Announcement) => {
    if (!announcement.targetRooms?.length && !announcement.targetFloors?.length && !announcement.targetTenants?.length) {
      return { icon: Users, label: "All Tenants", count: tenants.length };
    }
    
    const parts = [];
    if (announcement.targetRooms?.length) {
      parts.push(`${announcement.targetRooms.length} Room${announcement.targetRooms.length > 1 ? 's' : ''}`);
    }
    if (announcement.targetFloors?.length) {
      parts.push(`${announcement.targetFloors.length} Floor${announcement.targetFloors.length > 1 ? 's' : ''}`);
    }
    if (announcement.targetTenants?.length) {
      parts.push(`${announcement.targetTenants.length} Tenant${announcement.targetTenants.length > 1 ? 's' : ''}`);
    }
    
    return { icon: Users, label: parts.join(", "), count: null };
  };

  const uniqueFloors = Array.from(new Set(rooms.map(r => r.floor).filter((f): f is number => f != null))).sort((a, b) => a - b);

  if (isUserLoading || isPgLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md w-full p-8 text-center shadow-lg">
          <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to continue</p>
        </Card>
      </div>
    );
  }

  if (user.userType !== "owner") {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md w-full p-8 text-center shadow-lg">
          <AlertCircle className="h-16 w-16 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">This page is only accessible to PG owners</p>
        </Card>
      </div>
    );
  }

  if (!selectedPg) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md w-full p-8 text-center shadow-lg">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">No PG Selected</h2>
          <p className="text-muted-foreground">Please select a PG to manage announcements</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-background to-muted/20 pb-24">
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Megaphone className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-page-title">
                    Announcements
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground mt-0.5" data-testid="text-page-description">
                    Communicate with your tenants
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleCreateNew} 
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300"
                data-testid="button-create-announcement"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Announcement
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span>{announcements.length} announcement{announcements.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-muted-foreground">Loading announcements...</p>
            </div>
          </div>
        ) : announcements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-dashed border-2 bg-gradient-to-br from-muted/30 to-muted/10">
              <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-6">
                  <Megaphone className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2" data-testid="text-empty-state">
                  No announcements yet
                </h3>
                <p className="text-muted-foreground mb-8 max-w-sm">
                  Create your first announcement to keep your tenants informed about important updates
                </p>
                <Button 
                  onClick={handleCreateNew} 
                  size="lg"
                  className="shadow-lg"
                  data-testid="button-create-first"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Announcement
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {announcements.map((announcement, index) => {
                const priorityStyles = getPriorityStyles(announcement.priority);
                const targetInfo = getTargetingInfo(announcement);
                const TargetIcon = targetInfo.icon;
                
                return (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={`overflow-hidden border-l-4 ${priorityStyles.border} hover:shadow-xl transition-all duration-300 group`}
                      style={{ borderLeftColor: priorityStyles.indicator.replace('bg-', '') }}
                      data-testid={`card-announcement-${announcement.id}`}
                    >
                      <div className={`h-1 ${priorityStyles.indicator}`} />
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge 
                                  className={`${priorityStyles.bg} ${priorityStyles.text} text-xs font-semibold px-2.5 py-0.5 shadow-sm`}
                                  data-testid={`badge-priority-${announcement.id}`}
                                >
                                  {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)} Priority
                                </Badge>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span data-testid={`text-date-${announcement.id}`}>
                                    {format(new Date(announcement.createdAt), "MMM dd, yyyy")}
                                  </span>
                                </div>
                              </div>
                              <h3 
                                className="text-lg sm:text-xl font-bold text-foreground mb-2 line-clamp-2"
                                data-testid={`text-heading-${announcement.id}`}
                              >
                                {announcement.heading}
                              </h3>
                              <p 
                                className="text-sm sm:text-base text-muted-foreground line-clamp-2 sm:line-clamp-3"
                                data-testid={`text-details-${announcement.id}`}
                              >
                                {announcement.details}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-border/50">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full w-fit">
                              <TargetIcon className="h-4 w-4" />
                              <span>{targetInfo.label}</span>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(announcement)}
                                className="flex-1 sm:flex-none hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors"
                                data-testid={`button-edit-${announcement.id}`}
                              >
                                <Pencil className="h-4 w-4 mr-1.5" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(announcement.id)}
                                className="flex-1 sm:flex-none hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors"
                                data-testid={`button-delete-${announcement.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-1.5" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0" data-testid="dialog-announcement">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}
              </DialogTitle>
              <DialogDescription>
                {editingAnnouncement
                  ? "Update the announcement details below"
                  : "Create an announcement and notify your tenants instantly"}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="heading" className="text-sm font-semibold">
                Heading <span className="text-destructive">*</span>
              </Label>
              <Input
                id="heading"
                value={formData.heading}
                onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                placeholder="e.g., Water Supply Timing Change"
                className="h-12 text-base"
                data-testid="input-heading"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="details" className="text-sm font-semibold">
                Details <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="details"
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                placeholder="Provide detailed information about the announcement..."
                rows={4}
                className="text-base resize-none"
                data-testid="input-details"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-semibold">Priority Level</Label>
              <Select
                value={formData.priority}
                onValueChange={(val) => setFormData({ ...formData, priority: val as Priority })}
              >
                <SelectTrigger id="priority" className="h-12" data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" data-testid="option-priority-low">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      Low Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="medium" data-testid="option-priority-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Medium Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="high" data-testid="option-priority-high">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      High Priority
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Target Audience</h3>
                  <p className="text-xs text-muted-foreground">Choose who receives this announcement</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setSendToAll(true);
                    setFormData({
                      ...formData,
                      targetRooms: [],
                      targetFloors: [],
                      targetTenants: [],
                    });
                  }}
                  className={`py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                    sendToAll 
                      ? 'bg-background shadow-sm text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid="button-send-to-all"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>All Tenants</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSendToAll(false)}
                  className={`py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                    !sendToAll 
                      ? 'bg-background shadow-sm text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid="button-custom-targeting"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Layers className="h-4 w-4" />
                    <span>Custom</span>
                  </div>
                </button>
              </div>
              
              {sendToAll && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <Bell className="h-4 w-4 text-primary" />
                  <span className="text-sm">{tenants.length} tenants will be notified</span>
                </div>
              )}
              
              <AnimatePresence>
                {!sendToAll && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                      <AlertCircle className="h-3.5 w-3.5 text-blue-500" />
                      <span>Select any combination of floors, rooms, or tenants. Leave all empty to notify everyone.</span>
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">Target by Floor</Label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {uniqueFloors.length > 0 ? uniqueFloors.map((floor) => {
                          const isSelected = formData.targetFloors.includes(floor);
                          return (
                            <button
                              key={floor}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setFormData({ ...formData, targetFloors: formData.targetFloors.filter(f => f !== floor) });
                                } else {
                                  setFormData({ ...formData, targetFloors: [...formData.targetFloors, floor] });
                                }
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                                isSelected 
                                  ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                                  : 'bg-background border-border hover:border-primary/50 hover:bg-primary/5'
                              }`}
                              data-testid={`button-floor-${floor}`}
                            >
                              Floor {floor}
                            </button>
                          );
                        }) : (
                          <span className="text-sm text-muted-foreground italic">No floors available</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">Target by Room</Label>
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {rooms.length > 0 ? rooms.map((room) => {
                          const isSelected = formData.targetRooms.includes(room.id);
                          return (
                            <button
                              key={room.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setFormData({ ...formData, targetRooms: formData.targetRooms.filter(id => id !== room.id) });
                                } else {
                                  setFormData({ ...formData, targetRooms: [...formData.targetRooms, room.id] });
                                }
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                                isSelected 
                                  ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                                  : 'bg-background border-border hover:border-primary/50 hover:bg-primary/5'
                              }`}
                              data-testid={`button-room-${room.id}`}
                            >
                              {room.roomNumber}
                            </button>
                          );
                        }) : (
                          <span className="text-sm text-muted-foreground italic">No rooms available</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">Target Specific Tenants</Label>
                        <span className="text-xs text-muted-foreground">(optional)</span>
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        {tenants.length > 0 ? tenants.map((tenant) => {
                          const isSelected = formData.targetTenants.includes(tenant.id);
                          return (
                            <button
                              key={tenant.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setFormData({ ...formData, targetTenants: formData.targetTenants.filter(id => id !== tenant.id) });
                                } else {
                                  setFormData({ ...formData, targetTenants: [...formData.targetTenants, tenant.id] });
                                }
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                                isSelected 
                                  ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                                  : 'bg-background border-border hover:border-primary/50 hover:bg-primary/5'
                              }`}
                              data-testid={`button-tenant-${tenant.id}`}
                            >
                              {tenant.name}
                            </button>
                          );
                        }) : (
                          <span className="text-sm text-muted-foreground italic">No tenants available</span>
                        )}
                      </div>
                    </div>
                    
                    {(formData.targetFloors.length > 0 || formData.targetRooms.length > 0 || formData.targetTenants.length > 0) && (
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                          <Bell className="h-4 w-4" />
                          <span>
                            {[
                              formData.targetFloors.length > 0 && `${formData.targetFloors.length} floor${formData.targetFloors.length > 1 ? 's' : ''}`,
                              formData.targetRooms.length > 0 && `${formData.targetRooms.length} room${formData.targetRooms.length > 1 ? 's' : ''}`,
                              formData.targetTenants.length > 0 && `${formData.targetTenants.length} tenant${formData.targetTenants.length > 1 ? 's' : ''}`
                            ].filter(Boolean).join(', ')} selected
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, targetFloors: [], targetRooms: [], targetTenants: [] })}
                          className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 underline"
                          data-testid="button-clear-selection"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/30">
            <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={handleCloseDialog} 
                className="w-full sm:w-auto"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 shadow-lg"
                data-testid="button-submit"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : editingAnnouncement ? (
                  "Update Announcement"
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Create & Notify
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
