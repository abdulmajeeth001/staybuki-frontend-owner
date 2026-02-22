import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "@/components/layout/MobileLayout";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Calendar, AlertCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { TenantPaymentFlow } from "@/components/TenantPaymentFlow";
import { tenantService } from "@/services/tenantService";
import { TENANT_PAYMENTS } from "@/constants/tenantConstant";
import type { TenantPaymentResponse, PaymentUpdateRequest, OwnerUpiResponse, PaymentResponse } from "@/types/tenant";

export default function TenantPayments() {
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<TenantPaymentResponse | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Fetch Payments
  const { data: payments = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["tenant-payments"],
    queryFn: tenantService.getPayments,
    select: (data) => 
      Array.isArray(data) 
        ? data.filter((p) => p.status !== TENANT_PAYMENTS.STATUS_DELETED) 
        : [],
  });

  // Fetch Owner UPI
  const { data: ownerUpi } = useQuery({
    queryKey: ["owner-upi"],
    queryFn: tenantService.getOwnerUpi,
  });

  // Update Payment Mutation
  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PaymentUpdateRequest }): Promise<PaymentResponse> =>
      tenantService.updatePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payments"] });
      toast.success(TENANT_PAYMENTS.TOAST_PAYMENT_SUBMITTED);
      setIsPaymentDialogOpen(false);
    },
    onError: (err: any) => {
      console.error("Payment submission error:", err);
      toast.error(err.response?.data?.error || TENANT_PAYMENTS.ERR_SUBMIT_PAYMENT);
    },
  });

  const handlePayNow = (payment: TenantPaymentResponse) => {
    setSelectedPayment(payment);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async (transactionId: string) => {
    if (!selectedPayment) return;

    const updateData: PaymentUpdateRequest = {
      status: "paid",
      paymentMethod: "upi",
      transactionId: transactionId.trim(),
    };

    await updatePaymentMutation.mutateAsync({
      id: selectedPayment.id,
      data: updateData,
    });
  };

  const { totalPaid, totalDue } = useMemo(() => {
    const paid = payments
      .filter((p) => p.status === TENANT_PAYMENTS.STATUS_PAID)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const due = payments
      .filter((p) => p.status !== TENANT_PAYMENTS.STATUS_PAID)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      
    return { totalPaid: paid, totalDue: due };
  }, [payments]);

  if (isPaymentsLoading) {
    return (
      <>
        <div className="hidden lg:block">
          <DesktopLayout title={TENANT_PAYMENTS.PAGE_TITLE}>
            <PaymentsSkeleton />
          </DesktopLayout>
        </div>
        <div className="lg:hidden">
          <MobileLayout title={TENANT_PAYMENTS.PAGE_TITLE}>
            <PaymentsSkeleton />
          </MobileLayout>
        </div>
      </>
    );
  }

  const contentProps = {
    payments,
    totalPaid,
    totalDue,
    ownerUpi,
    selectedPayment,
    isPaymentDialogOpen,
    setIsPaymentDialogOpen,
    onPayNow: handlePayNow,
    onPaymentSubmit: handlePaymentSubmit,
  };

  return (
    <>
      <div className="hidden lg:block">
        <DesktopLayout title={TENANT_PAYMENTS.PAGE_TITLE}>
          <TenantPaymentsContent {...contentProps} isDesktop={true} />
        </DesktopLayout>
      </div>
      <div className="lg:hidden">
        <MobileLayout title={TENANT_PAYMENTS.PAGE_TITLE}>
          <TenantPaymentsContent {...contentProps} isDesktop={false} />
        </MobileLayout>
      </div>
    </>
  );
}

function PaymentsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

interface TenantPaymentsContentProps {
  payments: TenantPaymentResponse[];
  totalPaid: number;
  totalDue: number;
  ownerUpi: OwnerUpiResponse | undefined | null;
  selectedPayment: TenantPaymentResponse | null;
  isPaymentDialogOpen: boolean;
  setIsPaymentDialogOpen: (open: boolean) => void;
  onPayNow: (payment: TenantPaymentResponse) => void;
  onPaymentSubmit: (transactionId: string) => Promise<void>;
  isDesktop: boolean;
}

function TenantPaymentsContent({
  payments,
  totalPaid,
  totalDue,
  ownerUpi,
  selectedPayment,
  isPaymentDialogOpen,
  setIsPaymentDialogOpen,
  onPayNow,
  onPaymentSubmit,
  isDesktop
}: TenantPaymentsContentProps) {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className={isDesktop ? "relative -mx-8 -mt-8 mb-8 overflow-hidden rounded-b-3xl" : "relative -mx-4 -mt-6 mb-6 overflow-hidden"}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className={isDesktop ? "relative px-8 py-10" : "relative px-6 py-8"}>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              {TENANT_PAYMENTS.PAGE_TITLE}
            </h1>
            <p className="text-purple-100 text-sm">
              {TENANT_PAYMENTS.PAGE_SUBTITLE}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <SummaryCard 
          title={TENANT_PAYMENTS.TOTAL_PAID} 
          amount={totalPaid} 
          type="paid" 
        />
        <SummaryCard 
          title={TENANT_PAYMENTS.TOTAL_DUE} 
          amount={totalDue} 
          type="due" 
        />
      </div>

      {/* Payment History */}
      <h3 className="font-bold text-xl mb-4 text-gray-800">{TENANT_PAYMENTS.HISTORY_TITLE}</h3>
      <div className="space-y-3">
        {payments.length > 0 ? (
          payments.map((payment) => (
            <PaymentCard 
              key={payment.id} 
              payment={payment} 
              onPayNow={onPayNow} 
            />
          ))
        ) : (
          <Card className="border-2 border-dashed">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-gray-600 font-medium">{TENANT_PAYMENTS.MSG_NO_PAYMENTS}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedPayment && (
            <TenantPaymentFlow
              payment={{
                id: selectedPayment.id,
                amount: String(selectedPayment.amount),
                type: selectedPayment.type,
                paymentMonth: selectedPayment.paymentMonth,
                dueDate: selectedPayment.dueDate,
              }}
              ownerUpiId={ownerUpi?.upiId}
              onSubmit={onPaymentSubmit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-components
function SummaryCard({ title, amount, type }: { title: string; amount: number; type: "paid" | "due" }) {
  const isPaid = type === "paid";
  return (
    <Card className="relative border-2 hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br ${isPaid ? "from-emerald-50 to-green-50" : "from-orange-50 to-red-50"} opacity-50 group-hover:opacity-70 transition-opacity`} />
      <CardContent className="p-5 relative">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${isPaid ? "from-emerald-500 to-green-600" : "from-orange-500 to-red-600"} flex items-center justify-center shadow-lg`}>
            {isPaid ? <ArrowDownLeft className="w-5 h-5 text-white" /> : <ArrowUpRight className="w-5 h-5 text-white" />}
          </div>
        </div>
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</span>
        <p className={`text-2xl font-bold bg-gradient-to-r ${isPaid ? "from-emerald-600 to-green-600" : "from-orange-600 to-red-600"} bg-clip-text text-transparent mt-1`} data-testid={`text-payments-${type}`}>
          ₹{amount}
        </p>
      </CardContent>
    </Card>
  );
}

function PaymentCard({ payment, onPayNow }: { payment: TenantPaymentResponse; onPayNow: (p: TenantPaymentResponse) => void }) {
  const isPaid = payment.status === TENANT_PAYMENTS.STATUS_PAID;
  const isPendingApproval = payment.status === TENANT_PAYMENTS.STATUS_PENDING_APPROVAL;
  
  return (
    <Card
      data-testid={`card-payment-${payment.id}`}
      className="border-2 hover:border-purple-200 hover:shadow-lg transition-all duration-300"
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
                isPaid
                  ? "bg-gradient-to-br from-emerald-500 to-green-600"
                  : isPendingApproval
                  ? "bg-gradient-to-br from-orange-500 to-yellow-500"
                  : "bg-gradient-to-br from-gray-400 to-gray-500"
              }`}
            >
              {isPaid ? (
                <ArrowDownLeft className="w-6 h-6 text-white" />
              ) : (
                <ArrowUpRight className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-base text-gray-800 mb-1 capitalize">{payment.type}</p>
              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Due Date: {new Date(payment.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-xl text-gray-800 mb-1">₹{payment.amount}</p>
            <p
              className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${
                isPaid
                  ? "bg-emerald-100 text-emerald-700"
                  : isPendingApproval
                  ? "bg-orange-100 text-orange-700"
                  : "bg-gray-100 text-gray-700"
              }`}
              data-testid={`status-payment-${payment.id}`}
            >
              {isPendingApproval ? TENANT_PAYMENTS.LABEL_PENDING_APPROVAL : payment.status}
            </p>
            {payment.status === TENANT_PAYMENTS.STATUS_PENDING && (
              <Button
                size="sm"
                className="mt-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                onClick={() => onPayNow(payment)}
                data-testid={`button-pay-${payment.id}`}
              >
                {TENANT_PAYMENTS.BUTTON_PAY_NOW}
              </Button>
            )}
          </div>
        </div>
        {payment.status === TENANT_PAYMENTS.STATUS_PENDING && payment.rejectionReason && (
          <div className="mt-4 pt-4 border-t border-red-100">
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800 mb-1">{TENANT_PAYMENTS.MSG_PAYMENT_REJECTED}</p>
                <p className="text-sm text-red-700" data-testid={`text-rejection-reason-${payment.id}`}>
                  {payment.rejectionReason}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
