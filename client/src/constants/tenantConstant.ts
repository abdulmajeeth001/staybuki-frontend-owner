export const TENANT_ANNOUNCEMENTS = {
  QUERY_KEY: "tenant-announcements",
  PAGE_TITLE: "Announcements",
  PAGE_DESCRIPTION: "View important announcements from your PG management",
  SEARCH_PLACEHOLDER: "Search announcements...",
  NO_RESULTS_TITLE: "No announcements found",
  NO_RESULTS_DESC: "Try adjusting your search query",
  EMPTY_STATE_TITLE: "No announcements yet",
  EMPTY_STATE_DESC: "You'll see important announcements from your PG management here",
  DATE_FORMAT: "MMM dd, yyyy 'at' h:mm a",
  PRIORITY: {
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
  },
} as const;

export const PRIORITY_ORDER: Record<string, number> = {
  [TENANT_ANNOUNCEMENTS.PRIORITY.HIGH]: 0,
  [TENANT_ANNOUNCEMENTS.PRIORITY.MEDIUM]: 1,
  [TENANT_ANNOUNCEMENTS.PRIORITY.LOW]: 2,
};