import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, XCircle, Ban } from "lucide-react";
import { usePG } from "@/hooks/use-pg";

interface PGStatus {
  id: number;
  name: string;
  status: string;
  isActive: boolean;
  rejectionReason?: string;
}

export function PendingApprovalBanner() {
  const { pg } = usePG();

  const { data: pgStatus } = useQuery<PGStatus>({
    queryKey: ["/api/pg/status"],
    enabled: !!pg,
  });

  if (!pgStatus) return null;

  if (pgStatus.status === "pending") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <Card className="max-w-2xl mx-4" data-testid="card-pending-approval">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-2xl">Pending Approval</CardTitle>
            </div>
            <CardDescription>
              Your PG is awaiting admin approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Access Restricted</AlertTitle>
              <AlertDescription>
                Your PG "{pgStatus.name}" is currently pending admin approval. 
                You will not be able to access the system features until your PG has been approved by the administrator.
              </AlertDescription>
            </Alert>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">What happens next?</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>An administrator will review your PG registration</li>
                <li>You will be notified via email once your PG is approved</li>
                <li>After approval, you can access all system features</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              If you have any questions, please contact the administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pgStatus.status === "rejected") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <Card className="max-w-2xl mx-4 border-destructive" data-testid="card-rejected">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-destructive">PG Rejected</CardTitle>
            </div>
            <CardDescription>
              Your PG registration has been rejected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Registration Rejected</AlertTitle>
              <AlertDescription>
                Your PG "{pgStatus.name}" has been rejected by the administrator.
              </AlertDescription>
            </Alert>
            {pgStatus.rejectionReason && (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-destructive">Reason for Rejection:</p>
                <p className="text-sm text-muted-foreground">{pgStatus.rejectionReason}</p>
              </div>
            )}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">What can you do?</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Review the rejection reason above</li>
                <li>Contact the administrator for clarification</li>
                <li>Correct the issues and request re-evaluation</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              Please contact the administrator to resolve this issue.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pgStatus.isActive) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <Card className="max-w-2xl mx-4 border-destructive" data-testid="card-deactivated">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Ban className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-destructive">PG Deactivated</CardTitle>
            </div>
            <CardDescription>
              Your PG has been temporarily deactivated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <Ban className="h-4 w-4" />
              <AlertTitle>Account Deactivated</AlertTitle>
              <AlertDescription>
                Your PG "{pgStatus.name}" has been deactivated by the administrator.
              </AlertDescription>
            </Alert>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Why was my PG deactivated?</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Payment issues or overdue subscription</li>
                <li>Policy violations</li>
                <li>Other administrative reasons</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              Please contact the administrator immediately to reactivate your PG.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
