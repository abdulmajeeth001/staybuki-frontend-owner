import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowUpRight, ArrowDownLeft, Calendar, Filter, Plus, Wallet, TrendingUp, DollarSign, Check, X, Zap, History, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { OwnerPaymentApproval } from "@/components/OwnerPaymentApproval";
import { usePG } from "@/hooks/use-pg";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ElectricityBillingDialog } from "@/components/ElectricityBillingDialog";

import { ownerService } from "@/services/ownerService";
import type { PaymentResponse, TenantResponse } from "@/types/owner";

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

function usePaymentsLogic() {
  const { pg } = usePG();
  const [, navigate] = useLocation();
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "pending_approval">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ tenantId: "", amount: "", dueDate: "", type: "rent" });
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [ebDialogOpen, setEbDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [autoGenResult, setAutoGenResult] = useState<{ show: boolean, message: string }>({ show: false, message: "" });
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    if (!pg?.id) {
      setLoading(false);
      return;
    }
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const [paymentsRes, tenantsRes] = await Promise.all([
        ownerService.getPaymentsByMonthAndYear(year, month),
        ownerService.getAllTenants(),
      ]);

      const activePayments = paymentsRes.filter((p: any) => p.status !== "deleted");
      setPayments(activePayments as any);

      setTenants(tenantsRes as any);
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      toast.error(error.response?.data?.error || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pg, selectedMonth]);

  const handleApprove = async () => {
    if (!selectedPayment) return;
    setIsProcessing(true);
    try {
      await ownerService.approvePayment(selectedPayment.id);

      toast.success("Payment Approved", {
        description: "Payment has been marked as paid and receipt generated.",
      });
      setShowPaymentDetails(false);
      fetchData();
    } catch (error: any) {
      toast.error("Error", {
        description: error.response?.data?.error || "Failed to approve payment",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    setIsProcessing(true);
    try {
      await ownerService.rejectPayment(selectedPayment.id, {
        rejectionReason: "Payment verification failed. Please contact owner."
      });

      toast.success("Payment Rejected", { description: "Payment has been rejected and tenant will be notified." });
      setShowPaymentDetails(false);
      fetchData();
    } catch (error: any) {
      toast.error("Error", { description: error.response?.data?.error || "Failed to reject payment" });
    } finally {
      setIsProcessing(false);
    }
  };
  const handleCreatePayment = async () => {
    if (!formData.tenantId || !formData.amount || !formData.dueDate) {
      toast.error("Please fill in all fields");
      return;
    }

    setCreating(true);
    try {
      await ownerService.createPayment({
        tenantId: parseInt(formData.tenantId),
        amount: formData.amount,
        dueDate: new Date(formData.dueDate).toISOString(),
        type: formData.type,
      });

      toast.success("Payment request created");
      setDialogOpen(false);
      setFormData({ tenantId: "", amount: "", dueDate: "", type: "rent" });
      fetchData();
    } catch (error: any) {
      console.error("Payment creation error:", error);
      toast.error(error.response?.data?.error || "Failed to create payment request");
    } finally {
      setCreating(false);
    }
  };

  const handleAutoGeneratePayments = async () => {
    if (!pg?.rentPaymentDate) {
      toast.error("Please set rent payment date in Settings first");
      return;
    }

    setCreating(true);
    try {
      const res = await ownerService.autoGeneratePayments();
      setAutoGenResult({ show: true, message: res.message || "Payments generated successfully" });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to generate payments");
    } finally {
      setCreating(false);
    }
  };

  const handleApprovePayment = async (paymentId: number) => {
    setApprovingId(paymentId);
    try {
      await ownerService.approvePayment(paymentId);
      toast.success("Payment approved successfully");
      fetchData();
    } catch (error: any) {
      console.error("Approve payment error:", error);
      toast.error(error.response?.data?.error || "Failed to approve payment");
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectPayment = (paymentId: number) => {
    setRejectingPaymentId(paymentId);
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      toast.error("Please provide a rejection reason (minimum 10 characters)");
      return;
    }

    if (!rejectingPaymentId) return;

    setRejectingId(rejectingPaymentId);
    try {
      await ownerService.rejectPayment(rejectingPaymentId, { rejectionReason });

      toast.success("Payment rejected successfully");
      setRejectDialogOpen(false);
      setRejectionReason("");
      setRejectingPaymentId(null);
      fetchData();
    } catch (error: any) {
      console.error("Reject payment error:", error);
      toast.error(error.response?.data?.error || "Failed to reject payment");
    } finally {
      setRejectingId(null);
    }
  };

  const handleDeletePayment = (paymentId: number) => {
    setDeletingPaymentId(paymentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingPaymentId) return;

    setDeletingId(deletingPaymentId);
    try {
      await ownerService.deletePayment(deletingPaymentId);

      toast.success("Payment deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingPaymentId(null);
      fetchData();
    } catch (error: any) {
      console.error("Delete payment error:", error);
      toast.error(error.response?.data?.error || "Failed to delete payment");
    } finally {
      setDeletingId(null);
    }
  };

  // Calculate totals for selected month
  const totalRevenue = payments.reduce((sum, p: any) => sum + parseFloat(p.amount), 0);
  const income = payments.filter((p: any) => p.status === "paid").reduce((sum, p: any) => sum + parseFloat(p.amount), 0);
  const expense = payments.filter((p: any) => p.status === "pending" || p.status === "pending_approval").reduce((sum, p: any) => sum + parseFloat(p.amount), 0);


  // Filter transactions
  const getFilteredTransactions = () => {
    return payments.filter((payment: any) => {
      if (filter === "all") return true;
      if (filter === "paid") return payment.status === "paid";
      if (filter === "pending") return payment.status === "pending";
      if (filter === "pending_approval") return payment.status === "pending_approval";
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((payment: any) => {
      const tenantObj = payment.tenant || tenants.find((t: any) => t.id === payment.tenantId);
      return {
        ...payment,
        name: tenantObj?.name
          ? `${tenantObj.name}${tenantObj.roomNumber ? ` - Room ${tenantObj.roomNumber}` : ''}`
          : `Tenant #${payment.tenantId}`,
        paymentType: payment.type || 'rent',
      };
    });
  };

  const filteredTransactions = getFilteredTransactions();

  const cashflowStats = [
    {
      label: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: "from-purple-500 to-pink-600",
      description: format(new Date(selectedMonth + "-01"), "MMMM yyyy")
    },
    {
      label: "Received",
      value: `₹${income.toLocaleString()}`,
      icon: ArrowDownLeft,
      gradient: "from-emerald-500 to-green-600",
      description: "Paid"
    },
    {
      label: "Pending",
      value: `₹${expense.toLocaleString()}`,
      icon: ArrowUpRight,
      gradient: "from-orange-500 to-red-600",
      description: "Outstanding"
    },
    {
      label: "Transactions",
      value: payments.length.toString(),
      icon: TrendingUp,
      gradient: "from-blue-500 to-cyan-600",
      description: "Selected month"
    },
  ];

  const monthlyPendingApproval = payments.filter((p: any) => p.status === "pending_approval");

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  };

  return {
    pg, navigate, payments, tenants, loading, filter, setFilter, dialogOpen, setDialogOpen, creating,
    formData, setFormData, approvingId, rejectingId, rejectDialogOpen, setRejectDialogOpen,
    rejectingPaymentId, rejectionReason, setRejectionReason, ebDialogOpen, setEbDialogOpen,
    deleteDialogOpen, setDeleteDialogOpen, deletingPaymentId, deletingId, autoGenResult, setAutoGenResult,
    selectedMonth, setSelectedMonth, isProcessing, showPaymentDetails, setShowPaymentDetails,
    selectedPayment, setSelectedPayment, showScreenshot, setShowScreenshot, selectedScreenshot, setSelectedScreenshot,
    fetchData, handleApprove, handleReject, handleCreatePayment, handleAutoGeneratePayments,
    handleApprovePayment, handleRejectPayment, confirmReject, handleDeletePayment, confirmDelete,
    totalRevenue, income, expense, filteredTransactions, cashflowStats, monthlyPendingApproval,
    handleViewPayment
  };
}
export default function Payments() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return (
    <Layout title="Payments" showNav={!isMobile}>
      <PaymentsContent isMobile={isMobile} />
    </Layout>
  );
}

function PaymentsContent({ isMobile }: { isMobile: boolean }) {
  const { pg, navigate, payments, tenants, loading, filter, setFilter, dialogOpen, setDialogOpen, creating, formData, setFormData, approvingId, rejectingId, rejectDialogOpen, setRejectDialogOpen, rejectingPaymentId, rejectionReason, setRejectionReason, ebDialogOpen, setEbDialogOpen, deleteDialogOpen, setDeleteDialogOpen, deletingPaymentId, deletingId, autoGenResult, setAutoGenResult, selectedMonth, setSelectedMonth, isProcessing, showPaymentDetails, setShowPaymentDetails, selectedPayment, setSelectedPayment, showScreenshot, setShowScreenshot, selectedScreenshot, setSelectedScreenshot, fetchData, handleApprove, handleReject, handleCreatePayment, handleAutoGeneratePayments, handleApprovePayment, handleRejectPayment, confirmReject, handleDeletePayment, confirmDelete, totalRevenue, income, expense, filteredTransactions, cashflowStats, monthlyPendingApproval, handleViewPayment } = usePaymentsLogic();
  return (
    <>
      {/* Hero Section with Gradient */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />

        <div className="relative px-8 py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2">Payment Management</h2>
              <p className="text-white/80 text-sm">Track rent payments and manage tenant dues</p>
            </div>  
            <div className="flex gap-3">
              <Button
                size="sm"
                variant="outline"
                className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white"
                onClick={handleAutoGeneratePayments}
                disabled={creating || !pg?.rentPaymentDate}
                data-testid="button-auto-generate"
              >
                Auto Generate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white"
                onClick={() => navigate("/electricity-history")}
                data-testid="button-view-eb-history"
              >
                <History className="w-4 h-4 mr-2" />
                EB History
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white"
                onClick={() => setEbDialogOpen(true)}
                data-testid="button-create-eb-bill"
              >
                <Zap className="w-4 h-4 mr-2" />
                EB Bill
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white transition-all duration-300"
                    data-testid="button-create-payment"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Request
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Payment Request</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="tenant">Tenant</Label>
                      <Select value={formData.tenantId} onValueChange={(val) => setFormData({ ...formData, tenantId: val })}>
                        <SelectTrigger id="tenant" data-testid="select-tenant">
                          <SelectValue placeholder="Select tenant" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.map(t => (
                            <SelectItem key={t.id} value={t.id.toString()}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Payment Type</Label>
                      <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                        <SelectTrigger id="type" data-testid="select-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rent">Rent</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        data-testid="input-amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        data-testid="input-due-date"
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-4">
                      <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
                        Cancel
                      </Button>
                      <Button onClick={handleCreatePayment} disabled={creating} data-testid="button-submit">
                        {creating ? "Creating..." : "Create"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Cashflow Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cashflowStats.map((stat, i) => (
          <Card key={i} className="group relative overflow-hidden border-2 hover:border-purple-200 hover:shadow-2xl transition-all duration-300" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110",
                  `bg-gradient-to-br ${stat.gradient}`
                )}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-semibold mb-1">{stat.label}</p>
                <h3 className={cn(
                  "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                  `${stat.gradient}`
                )}>{stat.value}</h3>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Approval Payments Section */}
      {/* {monthlyPendingApproval.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            Pending Approval ({monthlyPendingApproval.length})
          </h3>
          <div className="grid gap-4">
            {monthlyPendingApproval
              .map(payment => (
                <OwnerPaymentApproval
                  key={payment.id}
                  payment={payment}
                  onApprove={fetchData}
                  onReject={fetchData}
                />
              ))}
          </div>
        </div>
      )} */}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 items-start sm:items-center">
        <div className="flex gap-2 items-center flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            className="rounded-full px-4"
            onClick={() => setFilter("all")}
            data-testid="button-filter-all"
          >
            All
          </Button>
          <Button
            variant={filter === "paid" ? "default" : "ghost"}
            size="sm"
            className="rounded-full px-4"
            onClick={() => setFilter("paid")}
            data-testid="button-filter-income"
          >
            Received
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "ghost"}
            size="sm"
            className="rounded-full px-4"
            onClick={() => setFilter("pending")}
            data-testid="button-filter-pending"
          >
            Pending
          </Button>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border shadow-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Label className="whitespace-nowrap text-sm font-medium text-slate-700">Month:</Label>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-auto border-0 bg-transparent shadow-none focus-visible:ring-0 px-1"
          />
        </div>
      </div>

      {/* Transactions */}
      <Card className="border-2 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <History className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Payment Timeline</h3>
            </div>
            <span className="text-sm text-muted-foreground font-medium">{filteredTransactions.length} payments</span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-muted-foreground">Loading payments...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No payments found</h3>
              <p className="text-sm text-muted-foreground" data-testid="text-no-payments">
                {filter !== "all"
                  ? "Try adjusting your filters to see more results"
                  : "Create your first payment request to get started"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="group flex items-center gap-4 p-4 bg-gradient-to-r from-white to-gray-50 hover:from-purple-50 hover:to-blue-50 rounded-xl border-2 border-transparent hover:border-purple-200 transition-all duration-300"
                  data-testid={`payment-row-${tx.id}`}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 group-hover:scale-110",
                    tx.status === 'paid'
                      ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                      : tx.status === 'pending_approval'
                        ? 'bg-gradient-to-br from-orange-500 to-yellow-600'
                        : 'bg-gradient-to-br from-gray-400 to-gray-600'
                  )}>
                    {tx.status === 'paid' ? (
                      <ArrowDownLeft className="w-6 h-6 text-white" />
                    ) : (
                      <ArrowUpRight className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-foreground mb-0.5" data-testid={`text-name-${tx.id}`}>{tx.name}</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.dueDate), "MMM dd")}</p>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-bold",
                        tx.paymentType === "rent"
                          ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700"
                          : tx.paymentType === "electricity"
                            ? "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700"
                            : tx.paymentType === "maintenance"
                              ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700"
                              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700"
                      )} data-testid={`text-payment-type-${tx.id}`}>
                        {tx.paymentType === "rent" ? "Rent" : tx.paymentType === "electricity" ? "Electricity" : tx.paymentType === "maintenance" ? "Maintenance" : tx.paymentType}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-bold",
                        tx.status === "paid"
                          ? "bg-gradient-to-r from-emerald-100 to-green-100 text-green-700"
                          : tx.status === "pending_approval"
                            ? "bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700"
                            : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700"
                      )} data-testid={`text-status-${tx.id}`}>
                        {tx.status === "paid" ? "Paid" : tx.status === "pending_approval" ? "Pending Approval" : "Pending"}
                      </span>
                      {tx.transactionId && (
                        <span className="text-xs text-muted-foreground" data-testid={`text-transaction-id-${tx.id}`}>
                          ID: {tx.transactionId}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={cn(
                        "font-bold text-lg",
                        tx.status === 'paid'
                          ? 'bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent'
                          : 'text-foreground'
                      )} data-testid={`text-amount-${tx.id}`}>
                        {tx.status === 'paid' ? '+' : ''}₹{tx.amount.toLocaleString()}
                      </p>
                    </div>
                    {tx.status === 'pending_approval' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-md"
                          onClick={() => {
                            handleViewPayment(tx);
                          }}
                          disabled={approvingId === tx.id || rejectingId === tx.id || deletingId === tx.id}
                        >
                          View
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Payment Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment Confirmation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a reason for rejecting this payment (minimum 10 characters)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                data-testid="textarea-rejection-reason"
              />
              {rejectionReason && rejectionReason.trim().length < 10 && (
                <p className="text-sm text-red-500">
                  Minimum 10 characters required ({rejectionReason.trim().length}/10)
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectionReason("");
                  setRejectingPaymentId(null);
                }}
                data-testid="button-cancel-reject"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmReject}
                disabled={rejectingId !== null || !rejectionReason || rejectionReason.trim().length < 10}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-confirm-reject"
              >
                {rejectingId !== null ? "Rejecting..." : "Confirm Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Confirmation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this payment? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setDeletingPaymentId(null);
                }}
                data-testid="button-cancel-delete"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deletingId !== null}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-confirm-delete"
              >
                {deletingId !== null ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Electricity Billing Dialog */}
      <ElectricityBillingDialog
        open={ebDialogOpen}
        onOpenChange={setEbDialogOpen}
        onSuccess={fetchData}
      />

      {/* Payment Details Dialog */}
      <Dialog
        open={showPaymentDetails}
        onOpenChange={setShowPaymentDetails}
      >
        <DialogContent className="max-w-lg" data-testid="dialog-payment-details">
          {selectedPayment && (
            <OwnerPaymentApproval
              payment={selectedPayment}
              onApprove={() => { fetchData(); setShowPaymentDetails(false); }} // Refetch data on approve
              onReject={() => { fetchData(); setShowPaymentDetails(false); }}  // Refetch data on reject
            />
          )}
        </DialogContent>
      </Dialog>
      {/* Auto Generate Success Dialog */}
      <Dialog open={autoGenResult.show} onOpenChange={(open) => !open && setAutoGenResult({ show: false, message: "" })}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl">
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-center">Generation Successful!</h2>
            <p className="text-muted-foreground text-center text-sm px-4">
              {autoGenResult.message}
            </p>
            <Button
              className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
              onClick={() => setAutoGenResult({ show: false, message: "" })}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}