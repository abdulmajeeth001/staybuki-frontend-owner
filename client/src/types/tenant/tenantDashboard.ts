// PgInfoDto
export interface PgInfo {
  id: number;
  pgName: string;
  pgAddress: string;
  pgLocation: string;

  hasFood: boolean;
  hasParking: boolean;
  hasAC: boolean;
  hasCCTV: boolean;
  hasWifi: boolean;
  hasLaundry: boolean;
  hasGym: boolean;
}

// RoomInfoDto
export interface RoomInfo {
  id: number;
  roomNumber: string;
  floor: number;
  sharing: number;
  hasAttachedBathroom: boolean;
  hasAC: boolean;
  amenities: string[];
}

// PaymentSummaryDto
export interface PaymentSummary {
  totalPaid: number;     // BigDecimal → number
  totalPending: number;  // BigDecimal → number
  totalOverdue: number;  // BigDecimal → number
  recentPayments: unknown[]; // refine later if needed
}

// TenantDashboardResponseDto
export interface TenantDashboardResponse {
  name: string;
  roomNumber: string;
  monthlyRent: number; // BigDecimal → number

  pgInfo: PgInfo;
  roomDetails: RoomInfo;
  paymentSummary: PaymentSummary;
}