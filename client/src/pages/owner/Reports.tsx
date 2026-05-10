import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download,
  FileText,
  IndianRupee,
  Home,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/apiClient";
import { ownerService } from "@/services/ownerService";

type ReportType = 'revenue' | 'payment-history' | 'occupancy' | 'tenant-details';

interface ReportSummary {
  totalRevenue: number;
  occupancyRate: number;
  averageRent: number;
  pendingDues: number;
  totalRooms: number;
  occupiedRooms: number;
  totalTenants: number;
  paidTenants: number;
  pendingTenants: number;
  newTenantsThisMonth: number;
  leavingTenantsThisMonth: number;
  complaintsThisMonth: number;
}

interface RevenueData {
  month: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentCount: number;
}

interface OccupancyData {
  roomsBySharing: { sharing: number; totalRooms: number; occupiedRooms: number; vacantRooms: number; }[];
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  occupancyRate: number;
}

export default function Reports() {
  return (
    <>
      <div className="hidden lg:block">
        <ReportsDesktop />
      </div>
      <div className="lg:hidden">
        <ReportsMobile />
      </div>
    </>
  );
}

function ReportsDesktop() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('revenue');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloadingReport, setDownloadingReport] = useState(false);
  const { toast } = useToast();

  // Fetch report summary
  const { data: summary, isLoading: summaryLoading } = useQuery<ReportSummary>({
    queryKey: ['report-summary'],
    queryFn: () => ownerService.getReportSummary(),
  });

  // Fetch revenue data
  const { data: revenueData, isLoading: revenueLoading } = useQuery<RevenueData[]>({
    queryKey: ['report', 'revenue'],
    queryFn: async () => {
      const data = await ownerService.getReportByType('revenue');
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch occupancy data
  const { data: occupancyData } = useQuery<OccupancyData>({
    queryKey: ['report', 'occupancy'],
    queryFn: () => ownerService.getReportByType('occupancy'),
  });

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    try {
      const reportData = await ownerService.getReportByType(selectedReport, startDate, endDate);
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${selectedReport}-report-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      toast({
        title: "Report Downloaded",
        description: "Report has been downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.response?.data?.error || error.message || "Failed to download report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingReport(false);
    }
  };

  // Calculate revenue trend for last 6 months
  const safeRevenueData = Array.isArray(revenueData) ? revenueData : [];
  const revenueChartData = safeRevenueData.slice(-6).map((item) => {
    const maxAmount = Math.max(...(safeRevenueData.map(d => d.totalAmount) || [1]));
    const percentage = (item.totalAmount / maxAmount) * 100;
    return {
      month: item.month?.split('-')[1] || '',
      value: item.totalAmount,
      percentage: Math.min(percentage, 100),
    };
  });

  return (
    <DesktopLayout title="Reports & Analytics" showNav>
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="relative px-8 py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2" data-testid="title-reports">
                Reports & Analytics
              </h2>
              <p className="text-white/80 text-sm">
                Track performance metrics and generate custom reports
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {summaryLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-revenue">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <IndianRupee className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-1" data-testid="stat-revenue">
                      ₹{summary?.totalRevenue.toLocaleString() || '0'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-occupancy">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Occupancy Rate</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1" data-testid="stat-occupancy">
                      {summary?.occupancyRate.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">{summary?.occupiedRooms} of {summary?.totalRooms} rooms</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-avg-rent">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Rent</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1" data-testid="stat-avg-rent">
                      ₹{summary?.averageRent.toFixed(0) || '0'}
                    </p>
                    <p className="text-xs text-muted-foreground">Per room/month</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-dues">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Pending Dues</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1" data-testid="stat-dues">
                      ₹{summary?.pendingDues.toLocaleString() || '0'}
                    </p>
                    <p className="text-xs text-muted-foreground">From {summary?.pendingTenants || 0} tenants</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Report Generator */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend Chart */}
              <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-revenue-chart">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">Revenue Trend (Last 6 Months)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {revenueLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      {revenueChartData.length > 0 ? revenueChartData.map((item) => (
                        <div key={item.month} className="space-y-1" data-testid={`chart-bar-${item.month}`}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-muted-foreground">Month {item.month}</span>
                            <span className="font-semibold">₹{(item.value / 1000).toFixed(0)}k</span>
                          </div>
                          <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full transition-all duration-500"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      )) : (
                        <p className="text-center text-muted-foreground py-6">No revenue data available</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Report Generator */}
              <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-report-generator">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">Report Generator</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 relative">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="report-type">
                      Select Report Type
                    </label>
                    <Select value={selectedReport} onValueChange={(value: ReportType) => setSelectedReport(value)}>
                      <SelectTrigger id="report-type" data-testid="select-report-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue" data-testid="option-revenue">
                          Monthly Revenue Report
                        </SelectItem>
                        <SelectItem value="payment-history" data-testid="option-payment">
                          Payment History
                        </SelectItem>
                        <SelectItem value="occupancy" data-testid="option-occupancy">
                          Occupancy Summary
                        </SelectItem>
                        <SelectItem value="tenant-details" data-testid="option-tenant">
                          Tenant Details
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="start-date">
                        From Date
                      </label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        data-testid="input-start-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="end-date">
                        To Date
                      </label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        data-testid="input-end-date"
                      />
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white gap-2"
                    onClick={handleDownloadReport}
                    disabled={downloadingReport}
                    data-testid="button-generate"
                  >
                    {downloadingReport ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download Report Data
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Additional Analytics Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-room-types">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                      <Home className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-base">Room Types</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 relative">
                  {occupancyData?.roomsBySharing?.map((room, index) => (
                    <div key={`room-${room.sharing}-${index}`} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {room.sharing === 1 ? 'Single' : `${room.sharing}-Sharing`}
                      </span>
                      <span className="font-semibold">{room.totalRooms} rooms</span>
                    </div>
                  )) || (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Single</span>
                        <span className="font-semibold">0 rooms</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">2-Sharing</span>
                        <span className="font-semibold">0 rooms</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-payment-status">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-base">Payment Status</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 relative">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-semibold text-green-600">{summary?.paidTenants || 0} tenants</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-semibold text-orange-600">{summary?.pendingTenants || 0} tenants</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overdue</span>
                    <span className="font-semibold text-red-600">0 tenants</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-recent-activity">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-base">This Month</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 relative">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">New Tenants</span>
                    <span className="font-semibold">{summary?.newTenantsThisMonth || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Check-outs</span>
                    <span className="font-semibold">{summary?.leavingTenantsThisMonth || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Maintenance</span>
                    <span className="font-semibold">{summary?.complaintsThisMonth || 0} tasks</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DesktopLayout>
  );
}

function ReportsMobile() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('revenue');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloadingReport, setDownloadingReport] = useState(false);
  const { toast } = useToast();

  // Fetch report summary
  const { data: summary, isLoading: summaryLoading } = useQuery<ReportSummary>({
    queryKey: ['report-summary'],
    queryFn: () => ownerService.getReportSummary(),
  });

  // Fetch occupancy data
  const { data: occupancyData } = useQuery<OccupancyData>({
    queryKey: ['report', 'occupancy'],
    queryFn: () => ownerService.getReportByType('occupancy'),
  });

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    try {
      const reportData = await ownerService.getReportByType(selectedReport, startDate, endDate);
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${selectedReport}-report-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      toast({
        title: "Report Downloaded",
        description: "Report has been downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.response?.data?.error || error.message || "Failed to download report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <MobileLayout 
      title="Reports"
      action={
        <Button 
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-9"
          onClick={handleDownloadReport}
          disabled={downloadingReport}
          data-testid="button-export-mobile"
        >
          {downloadingReport ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export
        </Button>
      }
    >
      <div className="space-y-4 pb-20">
        {summaryLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-revenue-mobile">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-4 relative">
                  <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                      <IndianRupee className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-full">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Total Revenue</p>
                      <p className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent" data-testid="stat-revenue-mobile">
                        ₹{((summary?.totalRevenue || 0) / 100000).toFixed(1)}L
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-occupancy-mobile">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-4 relative">
                  <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-full">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Occupancy</p>
                      <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent" data-testid="stat-occupancy-mobile">
                        {summary?.occupancyRate.toFixed(0)}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">{summary?.occupiedRooms}/{summary?.totalRooms} rooms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-avg-rent-mobile">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-4 relative">
                  <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-full">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Avg. Rent</p>
                      <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" data-testid="stat-avg-rent-mobile">
                        ₹{summary?.averageRent.toFixed(0) || '0'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Per room</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-dues-mobile">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-4 relative">
                  <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-full">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Pending Dues</p>
                      <p className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" data-testid="stat-dues-mobile">
                        ₹{((summary?.pendingDues || 0) / 1000).toFixed(0)}K
                      </p>
                      <p className="text-[10px] text-muted-foreground">{summary?.pendingTenants || 0} tenants</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-report-generator-mobile">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-base">Generate Report</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 relative">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={selectedReport} onValueChange={(value: ReportType) => setSelectedReport(value)}>
                    <SelectTrigger data-testid="select-report-type-mobile">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue Report</SelectItem>
                      <SelectItem value="payment-history">Payment History</SelectItem>
                      <SelectItem value="occupancy">Occupancy Report</SelectItem>
                      <SelectItem value="tenant-details">Tenant Details</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">From Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-sm"
                      data-testid="input-start-date-mobile"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">To Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-sm"
                      data-testid="input-end-date-mobile"
                    />
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white gap-2"
                  onClick={handleDownloadReport}
                  disabled={downloadingReport}
                  data-testid="button-generate-mobile"
                >
                  {downloadingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Data
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Room Types */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-room-types-mobile">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                    <Home className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-base">Room Types</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 relative">
                {occupancyData?.roomsBySharing?.map((room, index) => (
                  <div key={`room-mobile-${room.sharing}-${index}`} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {room.sharing === 1 ? 'Single' : `${room.sharing}-Sharing`}
                    </span>
                    <span className="font-semibold">{room.totalRooms} rooms</span>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground text-sm py-2">No room data</p>
                )}
              </CardContent>
            </Card>

            {/* Payment Status */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-payment-status-mobile">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-base">Payment Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 relative">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-semibold text-green-600">{summary?.paidTenants || 0} tenants</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-semibold text-orange-600">{summary?.pendingTenants || 0} tenants</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overdue</span>
                  <span className="font-semibold text-red-600">0 tenants</span>
                </div>
              </CardContent>
            </Card>

            {/* This Month */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-this-month-mobile">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-base">This Month</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 relative">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">New Tenants</span>
                  <span className="font-semibold">{summary?.newTenantsThisMonth || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Check-outs</span>
                  <span className="font-semibold">{summary?.leavingTenantsThisMonth || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Maintenance</span>
                  <span className="font-semibold">{summary?.complaintsThisMonth || 0} tasks</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
