import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Search, AlertCircle } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { format } from "date-fns";
import { tenantService } from "@/services/tenantService";
import { USER_TYPES } from "@/constants/routes";
import type { AnnouncementResponse } from "@/types/tenant";
import { TENANT_ANNOUNCEMENTS, PRIORITY_ORDER } from "@/constants/tenantConstant";

const getPriorityColor = (priority: AnnouncementResponse["priority"]) => {
  switch (priority) {
    case TENANT_ANNOUNCEMENTS.PRIORITY.HIGH:
      return "bg-red-500 text-white border-transparent";
    case TENANT_ANNOUNCEMENTS.PRIORITY.MEDIUM:
      return "bg-yellow-500 text-white border-transparent";
    case TENANT_ANNOUNCEMENTS.PRIORITY.LOW:
      return "bg-blue-500 text-white border-transparent";
    default:
      return "bg-gray-500 text-white border-transparent";
  }
};

export default function TenantAnnouncements() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: [TENANT_ANNOUNCEMENTS.QUERY_KEY],
    queryFn: tenantService.getAnnouncements,
    enabled: !!user && user.userType === USER_TYPES.TENANT,
  });

  const sortedAnnouncements = useMemo(() => {
    const filtered = announcements.filter((announcement) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        announcement.heading.toLowerCase().includes(query) ||
        announcement.details.toLowerCase().includes(query)
      );
    });

    return filtered.sort((a, b) => {
      const priorityDiff = (PRIORITY_ORDER[a.priority as string] ?? 2) - (PRIORITY_ORDER[b.priority as string] ?? 2);
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [announcements, searchQuery]);

  if (!user || user.userType !== USER_TYPES.TENANT) return null;

  return (
    <>
      <div className="hidden lg:block">
        <DesktopLayout title={TENANT_ANNOUNCEMENTS.PAGE_TITLE}>
          <TenantAnnouncementsContent
            announcements={sortedAnnouncements}
            isLoading={isLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </DesktopLayout>
      </div>
      <div className="lg:hidden">
        <MobileLayout title={TENANT_ANNOUNCEMENTS.PAGE_TITLE}>
          <TenantAnnouncementsContent
            announcements={sortedAnnouncements}
            isLoading={isLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </MobileLayout>
      </div>
    </>
  );
}

interface TenantAnnouncementsContentProps {
  announcements: AnnouncementResponse[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

function TenantAnnouncementsContent({
  announcements,
  isLoading,
  searchQuery,
  setSearchQuery,
}: TenantAnnouncementsContentProps) {
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2" data-testid="text-page-title">
          <Megaphone className="h-8 w-8" />
          {TENANT_ANNOUNCEMENTS.PAGE_TITLE}
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          {TENANT_ANNOUNCEMENTS.PAGE_DESCRIPTION}
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={TENANT_ANNOUNCEMENTS.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            {searchQuery ? (
              <>
                <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2" data-testid="text-no-results">
                  {TENANT_ANNOUNCEMENTS.NO_RESULTS_TITLE}
                </h3>
                <p className="text-muted-foreground">
                  {TENANT_ANNOUNCEMENTS.NO_RESULTS_DESC}
                </p>
              </>
            ) : (
              <>
                <Megaphone className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2" data-testid="text-empty-state">
                  {TENANT_ANNOUNCEMENTS.EMPTY_STATE_TITLE}
                </h3>
                <p className="text-muted-foreground">
                  {TENANT_ANNOUNCEMENTS.EMPTY_STATE_DESC}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
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
                        {format(new Date(announcement.createdAt), TENANT_ANNOUNCEMENTS.DATE_FORMAT)}
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
