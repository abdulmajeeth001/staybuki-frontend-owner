import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Megaphone, Search, AlertCircle } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { format } from "date-fns";
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

export default function TenantAnnouncements() {
  return (
    <>
      <div className="hidden lg:block">
        <TenantAnnouncementsDesktop />
      </div>
      <div className="lg:hidden">
        <TenantAnnouncementsMobile />
      </div>
    </>
  );
}

function TenantAnnouncementsContent() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/tenant/announcements"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/tenant/announcements");
        return res.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.error || error.message || "Failed to fetch announcements");
      }
    },
    enabled: !!user && user.userType === "tenant",
  });

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      announcement.heading.toLowerCase().includes(query) ||
      announcement.details.toLowerCase().includes(query)
    );
  });

  // Sort by creation date (newest first) and priority
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    // First sort by priority (high > medium > low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (!user || user.userType !== "tenant") return null;

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2" data-testid="text-page-title">
          <Megaphone className="h-8 w-8" />
          Announcements
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          View important announcements from your PG management
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading announcements...</p>
        </div>
      ) : sortedAnnouncements.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            {searchQuery ? (
              <>
                <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2" data-testid="text-no-results">
                  No announcements found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search query
                </p>
              </>
            ) : (
              <>
                <Megaphone className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2" data-testid="text-empty-state">
                  No announcements yet
                </h3>
                <p className="text-muted-foreground">
                  You'll see important announcements from your PG management here
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedAnnouncements.map((announcement) => (
            <Card
              key={announcement.id}
              className="hover:shadow-md transition-shadow"
              data-testid={`card-announcement-${announcement.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={getPriorityColor(announcement.priority)}
                        data-testid={`badge-priority-${announcement.id}`}
                      >
                        {announcement.priority} priority
                      </Badge>
                      <CardDescription data-testid={`text-date-${announcement.id}`}>
                        {format(new Date(announcement.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                      </CardDescription>
                    </div>
                    <CardTitle className="text-xl" data-testid={`text-heading-${announcement.id}`}>
                      {announcement.heading}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap" data-testid={`text-details-${announcement.id}`}>
                  {announcement.details}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TenantAnnouncementsDesktop() {
  return (
    <DesktopLayout title="Announcements">
      <TenantAnnouncementsContent />
    </DesktopLayout>
  );
}

function TenantAnnouncementsMobile() {
  return (
    <MobileLayout title="Announcements">
      <TenantAnnouncementsContent />
    </MobileLayout>
  );
}
