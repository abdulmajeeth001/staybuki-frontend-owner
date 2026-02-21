import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/apiClient";

export type Notification = {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
};

export function useNotifications() {
  const queryClient = useQueryClient();
  const [lastNotificationId, setLastNotificationId] = useState<number | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isPushAvailable, setIsPushAvailable] = useState(false);
  
  // Debug state for iOS troubleshooting
  const [debugInfo, setDebugInfo] = useState({
    isStandalone: false,
    isSafariIOS: false,
    hasServiceWorker: false,
    hasPushManager: false,
    error: null as string | null,
  });

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/notifications");
        // Normalize notification type to lowercase
        return response.data.map((n: any) => ({ ...n, type: n.type.toLowerCase() }));
      } catch (err: any) {
        throw new Error(err.response?.data?.error || err.message || "Failed to fetch notifications");
      }
    },
    staleTime: 30000, // Data stays fresh for 30 seconds
    refetchInterval: 60000, // Poll every 60 seconds
  });

  // Fetch unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/notifications/unread-count");
        return response.data;
      } catch (err: any) {
        throw new Error(err.response?.data?.error || err.message || "Failed to fetch unread count");
      }
    },
    staleTime: 30000, // Data stays fresh for 30 seconds
    refetchInterval: 60000, // Poll every 60 seconds
  });

  const unreadCount = unreadData?.count || 0;

  // Check if push notifications are available and if user has active subscription
  useEffect(() => {
    const checkPushAvailability = async () => {
      console.log("[Push Availability Check] Starting...");
      console.log("[Push Availability Check] serviceWorker in navigator:", "serviceWorker" in navigator);
      
      if (!("serviceWorker" in navigator)) {
        console.log("[Push Availability Check] Service workers not supported");
        setIsPushAvailable(false);
        return;
      }

      // Check if in PWA standalone mode (Safari iOS requirement)
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
                          (window.navigator as any).standalone === true;
      const isSafariIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      console.log("[Push Availability Check] Is standalone mode:", isStandalone);
      console.log("[Push Availability Check] Is Safari iOS:", isSafariIOS);
      console.log("[Push Availability Check] User agent:", navigator.userAgent);
      
      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        isStandalone,
        isSafariIOS,
        hasServiceWorker: true,
      }));

      try {
        // Register service worker first (required before checking availability)
        await navigator.serviceWorker.register("/sw.js");
        const registration = await navigator.serviceWorker.ready;
        console.log("[Push Availability Check] Service worker registered");
        console.log("[Push Availability Check] registration.pushManager exists:", !!registration.pushManager);
        
        // Update debug info with pushManager status
        setDebugInfo(prev => ({
          ...prev,
          hasPushManager: !!registration.pushManager,
        }));
        
        // For Safari iOS in standalone mode, always enable push (iOS PWAs don't expose PushManager on window)
        // For other browsers, check if registration.pushManager exists
        const pushAvailable = (isSafariIOS && isStandalone) || !!registration.pushManager;
        
        console.log("[Push Availability Check] Push available:", pushAvailable);
        
        if (!pushAvailable) {
          console.log("[Push Availability Check] Push not available - not iOS standalone and no pushManager");
          setIsPushAvailable(false);
          return;
        }

        setIsPushAvailable(true);
        console.log("[Push Availability Check] ✅ Set isPushAvailable to TRUE");

        // Check if user already has an active subscription (only if pushManager exists)
        if (registration.pushManager) {
          const subscription = await registration.pushManager.getSubscription();
          console.log("[Push Availability Check] Existing subscription:", !!subscription);
          setHasActiveSubscription(!!subscription);
        } else {
          console.log("[Push Availability Check] No pushManager yet, assuming no subscription");
          setHasActiveSubscription(false);
        }
      } catch (error) {
        console.error("[Push Availability Check] Error:", error);
        setIsPushAvailable(false);
        setDebugInfo(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : String(error),
        }));
      }
    };

    checkPushAvailability();
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (id: number) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, [queryClient]);

  // Show toast for new notifications
  useEffect(() => {
    if (!notifications.length) return;

    // Initialize on first load
    if (lastNotificationId === null) {
      const latestId = Math.max(...notifications.map(n => n.id));
      setLastNotificationId(latestId);
      return;
    }

    // Find all new notifications (not just the first one)
    const newNotifications = notifications
      .filter(n => n.id > lastNotificationId)
      .sort((a, b) => a.id - b.id); // Show oldest new notification first

    if (newNotifications.length > 0) {
      // Show toast for each new notification
      newNotifications.forEach((notification) => {
        toast.info(notification.title, {
          description: notification.message,
          duration: 5000,
        });
      });

      // Update last seen ID to the newest
      const latestId = Math.max(...newNotifications.map(n => n.id));
      setLastNotificationId(Math.max(lastNotificationId, latestId));
    }
  }, [notifications, lastNotificationId]);

  // Request notification permission and subscribe to push
  const requestPermission = useCallback(async () => {
    console.log("[Push Subscribe] Starting push subscription process...");
    
    if (!("Notification" in window)) {
      console.log("[Push Subscribe] Notification API not available");
      toast.error("This browser does not support notifications");
      return false;
    }

    if (!("serviceWorker" in navigator)) {
      console.log("[Push Subscribe] Service workers not supported");
      toast.error("This browser does not support push notifications");
      return false;
    }

    // Check if running in PWA standalone mode (required for Safari iOS)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
                        (window.navigator as any).standalone === true;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    console.log("[Push Subscribe] isStandalone:", isStandalone, "isIOS:", isIOS);
    
    if (!isStandalone && isIOS) {
      console.log("[Push Subscribe] iOS but not standalone - showing error");
      toast.error("For push notifications on iPhone, please: 1) Tap the Share button, 2) Select 'Add to Home Screen', 3) Open the app from your home screen.", {
        duration: 10000,
      });
      return false;
    }

    try {
      // Register service worker first
      console.log("[Push Subscribe] Registering service worker...");
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      console.log("[Push Subscribe] Service worker ready");

      // Check if pushManager is available (Safari iOS requirement)
      if (!registration.pushManager) {
        console.log("[Push Subscribe] PushManager not available");
        toast.error("Push notifications are not supported. Make sure you opened this app from your home screen icon.", {
          duration: 8000,
        });
        return false;
      }
      
      console.log("[Push Subscribe] PushManager available, fetching VAPID key...");
      
      // Fetch VAPID public key from server
      let publicKey;
      try {
        const vapidResponse = await api.get("/api/notifications/vapid-public-key");
        publicKey = vapidResponse.data.publicKey;
      } catch (error) {
        console.log("[Push Subscribe] VAPID key not available from server");
        toast.error("Push notifications are not enabled on this server.");
        return false;
      }
      console.log("[Push Subscribe] VAPID key received, requesting permission...");

      const permission = await Notification.requestPermission();
      console.log("[Push Subscribe] Permission result:", permission);
      
      if (permission === "granted") {
        console.log("[Push Subscribe] Permission granted, subscribing...");
        
        // Subscribe to push notifications using server's VAPID public key
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
        
        console.log("[Push Subscribe] Subscription created:", subscription.endpoint.substring(0, 50) + "...");

        // Send subscription to server
        try {
          await api.post("/api/notifications/subscribe", {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
              auth: arrayBufferToBase64(subscription.getKey("auth"))
            }
          });
          
          console.log("[Push Subscribe] ✅ Subscription saved to server successfully");
          setHasActiveSubscription(true);
          toast.success("Push notifications enabled! You'll receive popup alerts for new notifications.");
          return true;
        } catch (error) {
          console.log("[Push Subscribe] Failed to save subscription to server");
          toast.error("Failed to save push subscription");
          return false;
        }
      } else if (permission === "denied") {
        console.log("[Push Subscribe] Permission denied by user");
        toast.error("You blocked notifications. To enable them, go to your browser/device settings.");
        return false;
      } else {
        console.log("[Push Subscribe] Permission dismissed");
        toast.error("Please allow notifications when prompted to receive alerts.");
        return false;
      }
    } catch (error) {
      console.error("[Push Subscribe] Error:", error);
      toast.error("Failed to enable push notifications. Please try again.");
      return false;
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    requestPermission,
    hasActiveSubscription,
    isPushAvailable,
    debugInfo,
  };
}

// Helper functions for push subscription
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
