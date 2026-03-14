import { useState, useEffect, useRef, useMemo } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Plus, 
  MessageSquare,
  Sparkles,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { tenantService } from "@/services/tenantService";
import { TENANT_COMPLAINTS } from "@/constants/tenantConstant";
import type { Complaint, ComplaintRequest } from "@/types/tenant";
import { useIsMobile } from "@/hooks/use-mobile";

const getStatusIcon = (status: string) => {
  if (status === "resolved") return <CheckCircle className="w-5 h-5" />;
  if (status === "in-progress") return <Clock className="w-5 h-5" />;
  return <AlertCircle className="w-5 h-5" />;
};

const getStatusConfig = (status: string) => {
  if (status === "resolved") 
    return { 
      gradient: "from-green-500 to-emerald-600", 
      bg: "from-green-50 to-emerald-50",
      text: "text-green-700",
      border: "border-green-200",
    };
  if (status === "in-progress") 
    return { 
      gradient: "from-blue-500 to-cyan-600", 
      bg: "from-blue-50 to-cyan-50",
      text: "text-blue-700",
      border: "border-blue-200",
    };
  return { 
    gradient: "from-orange-500 to-red-600", 
    bg: "from-orange-50 to-red-50",
    text: "text-orange-700",
    border: "border-orange-200",
  };
};

const getStatusText = (status: string) => {
  if (status === "resolved") return TENANT_COMPLAINTS.STATUS_RESOLVED;
  if (status === "in-progress") return TENANT_COMPLAINTS.STATUS_IN_PROGRESS;
  return TENANT_COMPLAINTS.STATUS_OPEN;
};

const getPriorityConfig = (priority: string) => {
  if (priority === "high") 
    return { 
      gradient: "from-red-500 to-pink-600",
      bg: "bg-red-100",
      text: "text-red-700",
      icon: AlertTriangle,
    };
  if (priority === "medium") 
    return { 
      gradient: "from-yellow-500 to-orange-500",
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      icon: AlertCircle,
    };
  return { 
    gradient: "from-blue-500 to-cyan-600",
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: Clock,
  };
};

export default function TenantComplaints() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [location] = useLocation();
  const complaintRefs = useRef<{ [key: number]: HTMLElement | null }>({});
  
  // Extract complaintId from query params
  const params = new URLSearchParams(location.split('?')[1] || '');
  const highlightComplaintId = params.get('complaintId') ? parseInt(params.get('complaintId')!) : null;

  // Fetch tenant complaints
  const { data: complaints = [], isLoading } = useQuery<Complaint[]>({
    queryKey: [TENANT_COMPLAINTS.QUERY_KEY],
    queryFn: tenantService.getComplaints,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Create complaint mutation
  const createComplaintMutation = useMutation({
    mutationFn: tenantService.createComplaint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TENANT_COMPLAINTS.QUERY_KEY] });
      setIsCreateDialogOpen(false);
      toast({ title: TENANT_COMPLAINTS.TOAST_SUCCESS });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.error || error.message || TENANT_COMPLAINTS.TOAST_ERROR, variant: "destructive" });
    },
  });

  const handleCreateComplaint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: ComplaintRequest = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      priority: formData.get("priority") as ComplaintRequest["priority"],
    };
    createComplaintMutation.mutate(payload);
  };

  // Scroll to highlighted complaint when complaints load
  useEffect(() => {
    if (highlightComplaintId && !isLoading && complaints.length > 0) {
      const element = complaintRefs.current[highlightComplaintId];
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [highlightComplaintId, isLoading, complaints.length]);

  // Memoize derived state to avoid recalculation on every render
  const { openComplaints, inProgressComplaints, resolvedComplaints } = useMemo(() => {
    return {
      openComplaints: complaints.filter(c => c.status === "open"),
      inProgressComplaints: complaints.filter(c => c.status === "in-progress"),
      resolvedComplaints: complaints.filter(c => c.status === "resolved")
    };
  }, [complaints]);

  if (isLoading) {
    const Skeletons = (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );

    return (
      <Layout title="My Complaints">
        {Skeletons}
      </Layout>
    );
  }

  const content = (
    <>
      {/* Hero Section */}
      <div className={cn("relative overflow-hidden mb-6", isMobile ? "-mx-4 -mt-6" : "-mx-6 -mt-6 rounded-b-3xl mb-8")}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative px-6 py-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold drop-shadow-lg">{TENANT_COMPLAINTS.PAGE_TITLE}</h1>
              <p className="text-sm text-white/90 mt-1">{TENANT_COMPLAINTS.PAGE_SUBTITLE}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
              <span className="text-sm font-semibold">{complaints.length} Total</span>
            </div>
            {openComplaints.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/30 backdrop-blur-sm border border-orange-300/30">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">{openComplaints.length} {TENANT_COMPLAINTS.STATUS_OPEN}</span>
              </div>
            )}
            {resolvedComplaints.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/30 backdrop-blur-sm border border-green-300/30">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">{resolvedComplaints.length} {TENANT_COMPLAINTS.STATUS_RESOLVED}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Create Complaint Button */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300" 
              size="lg"
              data-testid="button-create-complaint"
            >
              <Plus className="w-5 h-5 mr-2" />
              {TENANT_COMPLAINTS.BUTTON_CREATE}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {TENANT_COMPLAINTS.DIALOG_TITLE}
                </DialogTitle>
              </div>
              <DialogDescription className="text-gray-600">
                {TENANT_COMPLAINTS.DIALOG_DESC}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateComplaint}>
              <div className="space-y-5 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-700">{TENANT_COMPLAINTS.LABEL_TITLE}</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    required 
                    className="border-2 focus:border-purple-400"
                    data-testid="input-complaint-title" 
                    placeholder={TENANT_COMPLAINTS.PLACEHOLDER_TITLE} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700">{TENANT_COMPLAINTS.LABEL_DESCRIPTION}</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    required 
                    rows={4}
                    className="border-2 focus:border-purple-400 resize-none"
                    data-testid="input-complaint-description" 
                    placeholder={TENANT_COMPLAINTS.PLACEHOLDER_DESCRIPTION}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-semibold text-gray-700">{TENANT_COMPLAINTS.LABEL_PRIORITY}</Label>
                  <Select name="priority" defaultValue="medium" required>
                    <SelectTrigger className="border-2 focus:border-purple-400" data-testid="select-complaint-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" data-testid="select-priority-low">{TENANT_COMPLAINTS.PRIORITY_LOW}</SelectItem>
                      <SelectItem value="medium" data-testid="select-priority-medium">{TENANT_COMPLAINTS.PRIORITY_MEDIUM}</SelectItem>
                      <SelectItem value="high" data-testid="select-priority-high">{TENANT_COMPLAINTS.PRIORITY_HIGH}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6 gap-2">
                <Button 
                  type="submit" 
                  disabled={createComplaintMutation.isPending} 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                  data-testid="button-submit-complaint"
                >
                  {createComplaintMutation.isPending ? TENANT_COMPLAINTS.BUTTON_SUBMITTING : TENANT_COMPLAINTS.BUTTON_SUBMIT}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Complaints List */}
        {complaints.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">{TENANT_COMPLAINTS.EMPTY_TITLE}</h3>
              <p className="text-sm text-gray-600 mb-6" data-testid="text-no-complaints">
                {TENANT_COMPLAINTS.EMPTY_DESC}
              </p>
              <p className="text-xs text-gray-500">
                {TENANT_COMPLAINTS.EMPTY_FOOTER}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {complaints.map((complaint) => {
              const statusConfig = getStatusConfig(complaint.status);
              const priorityConfig = getPriorityConfig(complaint.priority);
              const PriorityIcon = priorityConfig.icon;

              return (
                <Card 
                  key={complaint.id} 
                  ref={(el) => { if (el) complaintRefs.current[complaint.id] = el; }}
                  className={cn(
                    "relative overflow-hidden border-2 hover:shadow-xl transition-all duration-300 group",
                    highlightComplaintId === complaint.id && "ring-4 ring-blue-500 ring-offset-2"
                  )}
                  data-testid={`card-complaint-${complaint.id}`}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", statusConfig.bg)} />
                  <CardContent className="relative p-5">
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110",
                        `bg-gradient-to-br ${statusConfig.gradient}`
                      )}>
                        <div className="text-white">
                          {getStatusIcon(complaint.status)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Title and Priority */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-bold text-base text-gray-800 flex-1" data-testid={`text-complaint-title-${complaint.id}`}>
                            {complaint.title}
                          </h3>
                          <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0",
                            priorityConfig.bg
                          )} data-testid={`text-complaint-priority-${complaint.id}`}>
                            <PriorityIcon className={cn("w-3.5 h-3.5", priorityConfig.text)} />
                            <span className={cn("text-xs font-bold capitalize", priorityConfig.text)}>
                              {complaint.priority}
                            </span>
                          </div>
                        </div>
                        
                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed" data-testid={`text-complaint-description-${complaint.id}`}>
                          {complaint.description}
                        </p>
                        
                        {/* Date and Status */}
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 font-medium" data-testid={`text-complaint-date-${complaint.id}`}>
                            {format(new Date(complaint.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                          <div className={cn(
                            "px-3 py-1 rounded-full border-2",
                            statusConfig.border,
                            statusConfig.text
                          )} data-testid={`text-complaint-status-${complaint.id}`}>
                            <span className="text-xs font-bold">
                              {getStatusText(complaint.status)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Resolution Notes */}
                        {complaint.status === "resolved" && complaint.resolutionNotes && (
                          <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <p className="text-sm font-bold text-green-800">{TENANT_COMPLAINTS.RESOLUTION_TITLE}</p>
                            </div>
                            <p className="text-sm text-green-700 leading-relaxed">{complaint.resolutionNotes}</p>
                            {complaint.resolvedAt && (
                              <p className="text-xs text-green-600 mt-2 font-medium">
                                {TENANT_COMPLAINTS.RESOLVED_ON} {format(new Date(complaint.resolvedAt), "MMM d, yyyy")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  return (
    <Layout title="My Complaints">
      {content}
    </Layout>
  );
}
