import { useState } from "react";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  ClipboardCheck,
  ListChecks,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAINTENANCE = [
  { id: 1, task: "Monthly HVAC Inspection", date: "Nov 30, 2024", assigned: "Service Provider A", status: "pending" },
  { id: 2, task: "Plumbing Check - All Rooms", date: "Dec 5, 2024", assigned: "Plumber B", status: "scheduled" },
  { id: 3, task: "Electrical Audit", date: "Nov 28, 2024", assigned: "Electrician C", status: "in-progress" },
  { id: 4, task: "Water Tank Cleaning", date: "Nov 25, 2024", assigned: "Service Provider D", status: "completed" },
  { id: 5, task: "Fire Safety Check", date: "Dec 10, 2024", assigned: "Safety Inspector E", status: "scheduled" },
  { id: 6, task: "Elevator Maintenance", date: "Dec 1, 2024", assigned: "Service Provider F", status: "pending" },
  { id: 7, task: "Roof Waterproofing", date: "Nov 20, 2024", assigned: "Contractor G", status: "completed" },
];

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: AlertCircle,
  },
  scheduled: {
    label: "Scheduled",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Calendar,
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
};

export default function Maintenance() {
  return (
    <>
      <div className="hidden lg:block">
        <MaintenanceDesktop />
      </div>
      <div className="lg:hidden">
        <MaintenanceMobile />
      </div>
    </>
  );
}

function MaintenanceDesktop() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter maintenance tasks
  const filteredTasks = MAINTENANCE.filter((task) => {
    if (statusFilter === "all") return true;
    return task.status === statusFilter;
  });

  const getStatusCounts = () => {
    return {
      all: MAINTENANCE.length,
      pending: MAINTENANCE.filter((t) => t.status === "pending").length,
      scheduled: MAINTENANCE.filter((t) => t.status === "scheduled").length,
      "in-progress": MAINTENANCE.filter((t) => t.status === "in-progress").length,
      completed: MAINTENANCE.filter((t) => t.status === "completed").length,
    };
  };

  const counts = getStatusCounts();

  return (
    <DesktopLayout title="Maintenance Schedule" showNav>
      {/* Gradient Hero Section */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="relative px-8 py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2" data-testid="title-maintenance">
                Maintenance Schedule
              </h2>
              <p className="text-white/80 text-sm">
                Track and manage property maintenance tasks
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white transition-all duration-300"
                data-testid="button-add-maintenance"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Maintenance
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-pending">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pending</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" data-testid="stat-pending">
                  {counts.pending}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-scheduled">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Scheduled</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent" data-testid="stat-scheduled">
                  {counts.scheduled}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-in-progress">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Clock className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">In Progress</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" data-testid="stat-in-progress">
                  {counts["in-progress"]}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-completed">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Completed</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent" data-testid="stat-completed">
                  {counts.completed}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
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
                variant={statusFilter === "scheduled" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("scheduled")}
                className={statusFilter === "scheduled" ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700" : ""}
                data-testid="filter-scheduled"
              >
                Scheduled ({counts.scheduled})
              </Button>
              <Button
                variant={statusFilter === "in-progress" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("in-progress")}
                className={statusFilter === "in-progress" ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" : ""}
                data-testid="filter-in-progress"
              >
                In Progress ({counts["in-progress"]})
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
                className={statusFilter === "completed" ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700" : ""}
                data-testid="filter-completed"
              >
                Completed ({counts.completed})
              </Button>
            </div>
          </div>
        </Card>

        {/* Maintenance Task Cards */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Wrench className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2" data-testid="text-no-tasks">
              {statusFilter === "all"
                ? "No maintenance tasks scheduled"
                : `No ${statusFilter} maintenance tasks`}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {statusFilter === "all"
                ? "Schedule your first maintenance task to get started"
                : `You don't have any ${statusFilter} tasks at the moment`}
            </p>
            <Button 
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              data-testid="button-empty-add"
            >
              <Plus className="w-4 h-4" />
              Schedule Maintenance
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = statusConfig.icon;

              return (
                <Card 
                  key={task.id} 
                  className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative"
                  data-testid={`card-task-${task.id}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <Wrench className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2" data-testid={`text-task-name-${task.id}`}>
                            {task.task}
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="w-4 h-4" />
                              <span data-testid={`text-assigned-${task.id}`}>
                                Assigned: {task.assigned}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span data-testid={`text-date-${task.id}`}>
                                {task.date}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={cn("flex items-center gap-1 font-medium", statusConfig.color)}
                          data-testid={`badge-status-${task.id}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`button-edit-${task.id}`}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DesktopLayout>
  );
}

function MaintenanceMobile() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter maintenance tasks
  const filteredTasks = MAINTENANCE.filter((task) => {
    if (statusFilter === "all") return true;
    return task.status === statusFilter;
  });

  const getStatusCounts = () => {
    return {
      all: MAINTENANCE.length,
      pending: MAINTENANCE.filter((t) => t.status === "pending").length,
      scheduled: MAINTENANCE.filter((t) => t.status === "scheduled").length,
      "in-progress": MAINTENANCE.filter((t) => t.status === "in-progress").length,
      completed: MAINTENANCE.filter((t) => t.status === "completed").length,
    };
  };

  const counts = getStatusCounts();

  return (
    <MobileLayout 
      title="Maintenance"
      action={
        <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600" data-testid="button-add-maintenance-mobile">
          <Plus className="w-4 h-4" />
        </Button>
      }
    >
      <div className="space-y-4 pb-20">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="overflow-hidden border-2" data-testid="card-stat-pending-mobile">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-3 shadow-md">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" data-testid="stat-pending-mobile">
                {counts.pending}
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2" data-testid="card-stat-scheduled-mobile">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-3 shadow-md">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Scheduled</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent" data-testid="stat-scheduled-mobile">
                {counts.scheduled}
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2" data-testid="card-stat-in-progress-mobile">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-3 shadow-md">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">In Progress</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" data-testid="stat-in-progress-mobile">
                {counts["in-progress"]}
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2" data-testid="card-stat-completed-mobile">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-3 shadow-md">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent" data-testid="stat-completed-mobile">
                {counts.completed}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "rounded-full whitespace-nowrap",
              statusFilter === "all" && "bg-gradient-to-r from-purple-600 to-blue-600"
            )}
            data-testid="filter-all-mobile"
          >
            All ({counts.all})
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
            className={cn(
              "rounded-full whitespace-nowrap",
              statusFilter === "pending" && "bg-gradient-to-r from-orange-600 to-red-600"
            )}
            data-testid="filter-pending-mobile"
          >
            Pending ({counts.pending})
          </Button>
          <Button
            variant={statusFilter === "scheduled" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("scheduled")}
            className={cn(
              "rounded-full whitespace-nowrap",
              statusFilter === "scheduled" && "bg-gradient-to-r from-blue-600 to-cyan-600"
            )}
            data-testid="filter-scheduled-mobile"
          >
            Scheduled ({counts.scheduled})
          </Button>
          <Button
            variant={statusFilter === "in-progress" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("in-progress")}
            className={cn(
              "rounded-full whitespace-nowrap",
              statusFilter === "in-progress" && "bg-gradient-to-r from-purple-600 to-pink-600"
            )}
            data-testid="filter-in-progress-mobile"
          >
            In Progress ({counts["in-progress"]})
          </Button>
          <Button
            variant={statusFilter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("completed")}
            className={cn(
              "rounded-full whitespace-nowrap",
              statusFilter === "completed" && "bg-gradient-to-r from-emerald-600 to-green-600"
            )}
            data-testid="filter-completed-mobile"
          >
            Completed ({counts.completed})
          </Button>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Wrench className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-base font-semibold mb-2" data-testid="text-no-tasks-mobile">
              {statusFilter === "all"
                ? "No tasks scheduled"
                : `No ${statusFilter} tasks`}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {statusFilter === "all"
                ? "Schedule your first task"
                : `No ${statusFilter} tasks at the moment`}
            </p>
            <Button 
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
              data-testid="button-empty-add-mobile"
            >
              <Plus className="w-4 h-4" />
              Schedule Task
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = statusConfig.icon;

              return (
                <Card 
                  key={task.id} 
                  className="overflow-hidden border-2"
                  data-testid={`card-task-${task.id}-mobile`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Wrench className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-2" data-testid={`text-task-name-${task.id}-mobile`}>
                          {task.task}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn("flex items-center gap-1 font-medium w-fit", statusConfig.color)}
                          data-testid={`badge-status-${task.id}-mobile`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate" data-testid={`text-assigned-${task.id}-mobile`}>{task.assigned}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span data-testid={`text-date-${task.id}-mobile`}>{task.date}</span>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      data-testid={`button-edit-${task.id}-mobile`}
                    >
                      Edit Task
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
