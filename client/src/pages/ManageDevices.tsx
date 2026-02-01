import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, Tablet, MapPin, Clock, LogOut, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/apiClient";

interface SessionData {
  id: number;
  sessionId: string;
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export default function ManageDevices() {
  return (
    <>
      <div className="hidden md:block">
        <ManageDevicesDesktop />
      </div>
      <div className="md:hidden">
        <ManageDevicesMobile />
      </div>
    </>
  );
}

function ManageDevicesDesktop() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/api/sessions");
      setSessions(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load active sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleLogoutDevice = async (sessionId: string) => {
    try {
      await api.delete(`/api/sessions/${sessionId}`);
      toast.success("Device logged out successfully");
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to logout device");
    }
  };

  const handleLogoutAllOthers = async () => {
    try {
      await api.post("/api/sessions/logout-all");
      toast.success("Logged out from all other devices");
      setShowLogoutAllDialog(false);
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to logout from all devices");
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-5 w-5" />;
      case "tablet":
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const otherDevices = sessions.filter(s => !s.isCurrent);

  return (
    <DesktopLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Devices</h1>
            <p className="text-muted-foreground mt-1">View and manage your active login sessions</p>
          </div>
          {otherDevices.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setShowLogoutAllDialog(true)}
              data-testid="button-logout-all"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout from All Other Devices
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading sessions...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.id} data-testid={`card-session-${session.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getDeviceIcon(session.deviceType)}
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {session.deviceName}
                          {session.isCurrent && (
                            <span className="text-xs font-medium px-2 py-1 bg-primary text-primary-foreground rounded-full" data-testid="badge-current">
                              This Device
                            </span>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{session.browser} • {session.os}</p>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLogoutDevice(session.sessionId)}
                        data-testid={`button-logout-${session.id}`}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span data-testid={`text-ip-${session.id}`}>{session.ipAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span data-testid={`text-lastactive-${session.id}`}>
                      Last active {formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {sessions.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No active sessions</h3>
                  <p className="text-sm text-muted-foreground">You're not logged in on any devices</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <AlertDialog open={showLogoutAllDialog} onOpenChange={setShowLogoutAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Logout from All Other Devices?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will log you out from all other devices except this one. You'll need to sign in again on those devices.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-logout-all">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogoutAllOthers} data-testid="button-confirm-logout-all">
                Logout All Others
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DesktopLayout>
  );
}

function ManageDevicesMobile() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/api/sessions");
      setSessions(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load active sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleLogoutDevice = async (sessionId: string) => {
    try {
      await api.delete(`/api/sessions/${sessionId}`);
      toast.success("Device logged out successfully");
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to logout device");
    }
  };

  const handleLogoutAllOthers = async () => {
    try {
      await api.post("/api/sessions/logout-all");
      toast.success("Logged out from all other devices");
      setShowLogoutAllDialog(false);
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to logout from all devices");
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-5 w-5" />;
      case "tablet":
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const otherDevices = sessions.filter(s => !s.isCurrent);

  return (
    <MobileLayout title="Manage Devices">
      <div className="p-4 space-y-4">
        {otherDevices.length > 0 && (
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={() => setShowLogoutAllDialog(true)}
            data-testid="button-logout-all"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout from All Other Devices
          </Button>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading sessions...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card key={session.id} data-testid={`card-session-${session.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        {getDeviceIcon(session.deviceType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base truncate">
                          {session.deviceName}
                        </CardTitle>
                        {session.isCurrent && (
                          <span className="text-xs font-medium px-2 py-0.5 bg-primary text-primary-foreground rounded-full inline-block mt-1" data-testid="badge-current">
                            This Device
                          </span>
                        )}
                        <p className="text-sm text-muted-foreground truncate">{session.browser}</p>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLogoutDevice(session.sessionId)}
                        data-testid={`button-logout-${session.id}`}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span data-testid={`text-ip-${session.id}`} className="truncate">{session.ipAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span data-testid={`text-lastactive-${session.id}`} className="truncate">
                      {formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {sessions.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No active sessions</h3>
                  <p className="text-sm text-muted-foreground text-center">You're not logged in on any devices</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <AlertDialog open={showLogoutAllDialog} onOpenChange={setShowLogoutAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Logout from All Other Devices?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will log you out from all other devices except this one. You'll need to sign in again on those devices.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-logout-all">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogoutAllOthers} data-testid="button-confirm-logout-all">
                Logout All Others
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MobileLayout>
  );
}
