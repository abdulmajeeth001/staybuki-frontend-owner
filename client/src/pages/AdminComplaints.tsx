import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Search, AlertCircle, Eye, User, Building, Calendar } from "lucide-react";
import { useState } from "react";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

interface Complaint {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  pgName: string;
  tenantName: string;
  tenantEmail: string;
}

export default function AdminComplaints() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { data: complaints, isLoading } = useQuery<Complaint[]>({
    queryKey: ["/api/admin/complaints"],
  });

  const filteredComplaints = complaints?.filter((complaint) => {
    const matchesSearch =
      complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.pgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.tenantName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = priorityFilter === "all" || complaint.priority === priorityFilter;
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive" className="font-medium">High</Badge>;
      case "medium":
        return <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300 font-medium">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="font-medium">Low</Badge>;
      default:
        return <Badge variant="outline" className="font-medium">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700 font-medium">Resolved</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-medium">In Progress</Badge>;
      case "pending":
        return <Badge variant="secondary" className="font-medium">Pending</Badge>;
      default:
        return <Badge variant="outline" className="font-medium">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    return AlertCircle;
  };

  const content = (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-complaints-title">
          Complaints Management
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Monitor and manage complaints across all PGs
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 md:h-11"
            data-testid="input-search-complaints"
          />
        </div>
        <div className="flex gap-2 md:gap-3">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full md:w-[140px] h-10 md:h-11" data-testid="select-priority-filter">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[140px] h-10 md:h-11" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
      ) : filteredComplaints?.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No complaints found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredComplaints?.map((complaint, index) => {
              const CategoryIcon = getCategoryIcon(complaint.category);
              return (
                <motion.div
                  key={complaint.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className="border-border hover:border-primary/50 transition-colors" data-testid={`card-complaint-${complaint.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CategoryIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <CardTitle className="text-sm font-semibold truncate">{complaint.title}</CardTitle>
                          </div>
                          <CardDescription className="text-xs line-clamp-2">{complaint.description}</CardDescription>
                        </div>
                        {getPriorityBadge(complaint.priority)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">PG</p>
                          <p className="font-medium truncate">{complaint.pgName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <div className="mt-0.5">{getStatusBadge(complaint.status)}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setShowDetailsDialog(true);
                          }}
                          data-testid={`button-view-complaint-${complaint.id}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden md:block border-border">
            <CardHeader>
              <CardTitle>All Complaints</CardTitle>
              <CardDescription>
                {filteredComplaints?.length || 0} complaint{filteredComplaints?.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>PG</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComplaints?.map((complaint) => (
                      <TableRow key={complaint.id} data-testid={`row-complaint-${complaint.id}`}>
                        <TableCell className="font-medium max-w-[200px]">
                          <div className="truncate">{complaint.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{complaint.description}</div>
                        </TableCell>
                        <TableCell>{complaint.pgName}</TableCell>
                        <TableCell>
                          <div>{complaint.tenantName}</div>
                          <div className="text-xs text-muted-foreground">{complaint.tenantEmail}</div>
                        </TableCell>
                        <TableCell className="capitalize">{complaint.category}</TableCell>
                        <TableCell>{getPriorityBadge(complaint.priority)}</TableCell>
                        <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setShowDetailsDialog(true);
                            }}
                            data-testid={`button-view-complaint-${complaint.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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

      {/* Complaint Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md" data-testid="dialog-complaint-details">
          <DialogHeader>
            <DialogTitle>Complaint Details</DialogTitle>
            <DialogDescription>Complete information about this complaint</DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                <h3 className="font-semibold">{selectedComplaint.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedComplaint.description}</p>
                <div className="flex items-center gap-2 pt-2">
                  {getPriorityBadge(selectedComplaint.priority)}
                  {getStatusBadge(selectedComplaint.status)}
                  <Badge variant="outline" className="capitalize font-medium">{selectedComplaint.category}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">PG:</span>
                  <span className="font-medium">{selectedComplaint.pgName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tenant:</span>
                  <span className="font-medium">{selectedComplaint.tenantName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{new Date(selectedComplaint.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-card text-xs text-muted-foreground">
                <p className="font-medium mb-1">Contact Information</p>
                <p>{selectedComplaint.tenantEmail}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  return isMobile ? (
    <MobileLayout title="Complaints">{content}</MobileLayout>
  ) : (
    <DesktopLayout>{content}</DesktopLayout>
  );
}
