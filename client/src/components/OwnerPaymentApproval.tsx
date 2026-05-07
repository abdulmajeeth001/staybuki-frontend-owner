import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, Eye, Smartphone, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ownerService } from "@/services/ownerService";

interface Payment {
  id: number;
  amount: string;
  type: string;
  status: string;
  paymentMethod?: string;
  transactionId?: string;
  paymentScreenshot?: string;
  paymentMonth?: string;
  dueDate?: string;
  createdAt: string;
  tenant?: {
    name: string;
    phone: string;
  };
}

interface OwnerPaymentApprovalProps {
  payment: Payment;
  onApprove: () => void;
  onReject: () => void;
}

export function OwnerPaymentApproval({ payment, onApprove, onReject }: OwnerPaymentApprovalProps) {
  const { toast } = useToast();
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await ownerService.approvePayment(payment.id);

      toast({
        title: "Payment Approved",
        description: "Payment has been marked as paid and receipt generated.",
      });
      onApprove();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to approve payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await ownerService.rejectPayment(payment.id, { 
        rejectionReason: "Payment verification failed. Please contact owner."
      });

      toast({
        title: "Payment Rejected",
        description: "Payment has been rejected and tenant will be notified.",
      });
      onReject();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to reject payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card className="border-orange-200 bg-orange-50/50 w-full max-w-2xl">
        <CardHeader className="pb-3 md:pb-4">
          <div className="flex items-start md:items-center justify-between gap-2 flex-col md:flex-row">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base md:text-lg break-words">
                {payment.tenant?.name} - ₹{payment.amount}
              </CardTitle>
              <CardDescription className="text-xs md:text-sm mt-1">
                {payment.type} payment {payment.paymentMonth && `for ${payment.paymentMonth}`}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-orange-100 text-orange-700 text-xs whitespace-nowrap">
              Pending Approval
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 px-4 md:px-6">
          {/* Payment Method */}
          {payment.paymentMethod && (
            <div className="flex items-center gap-2 text-xs md:text-sm">
              {payment.paymentMethod === "upi" ? (
                <>
                  <Smartphone className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium">UPI Payment</span>
                </>
              ) : payment.paymentMethod === "cash" ? (
                <>
                  <Banknote className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium">Cash Payment</span>
                </>
              ) : (
                <>
                  <Banknote className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium capitalize">{payment.paymentMethod} Payment</span>
                </>
              )}
            </div>
          )}

          {/* Transaction ID - only for UPI */}
          {payment.paymentMethod === "upi" && payment.transactionId && (
            <div className="flex items-start justify-between gap-2 text-xs md:text-sm bg-white/50 p-2 md:p-2.5 rounded">
              <span className="text-muted-foreground flex-shrink-0">Transaction ID:</span>
              <span className="font-mono text-right break-all">{payment.transactionId}</span>
            </div>
          )}

          {/* Payment Screenshot - show for ANY payment that has one */}
          {payment.paymentScreenshot && (
            <Button
              variant="outline"
              onClick={() => setShowScreenshot(true)}
              className="w-full h-11 text-xs md:text-sm"
              data-testid="button-view-screenshot"
            >
              <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
              View Payment Proof
            </Button>
          )}

          <div className="text-xs text-muted-foreground bg-white/50 p-2 md:p-2.5 rounded">
            Submitted {format(new Date(payment.createdAt), "PPp")}
          </div>

          <div className="flex gap-2 md:gap-3 pt-2">
            <Button
              onClick={handleReject}
              variant="outline"
              className="flex-1 h-11 text-xs md:text-sm text-destructive hover:bg-destructive/10"
              disabled={isProcessing}
              data-testid="button-reject-payment"
            >
              <X className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              className="flex-1 h-11 text-xs md:text-sm"
              disabled={isProcessing}
              data-testid="button-approve-payment"
            >
              <Check className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
              {isProcessing ? "Processing..." : "Approve"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Screenshot Dialog */}
      <Dialog open={showScreenshot} onOpenChange={setShowScreenshot}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Payment Proof</DialogTitle>
          </DialogHeader>
          {payment.paymentScreenshot && (
            <div className="max-h-[70vh] overflow-auto">
              <img
                src={payment.paymentScreenshot}
                alt="Payment proof"
                className="w-full rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
