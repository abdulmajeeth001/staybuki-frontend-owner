import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, boolean, timestamp, decimal, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users/Owners table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  mobile: text("mobile").notNull(),
  password: text("password"), // nullable for OAuth users
  userType: text("user_type").default("owner"), // owner, tenant, admin, applicant
  gender: text("gender"), // male, female, other - required for tenant/applicant, optional for owner
  pgAddress: text("pg_address"),
  pgLocation: text("pg_location"),
  isVerified: boolean("is_verified").default(false),
  requiresPasswordReset: boolean("requires_password_reset").default(false), // For first-time login after invitation
  googleId: text("google_id"),
  subscriptionTier: text("subscription_tier").default("none"), // none, starter, pro, enterprise
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  upiId: text("upi_id"), // UPI ID for receiving payments
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true,
  isVerified: true
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// OTP verification codes
export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  mobile: text("mobile").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtpSchema = createInsertSchema(otpCodes).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;

// PG Master table (defined before tenants and rooms to satisfy foreign key references)
export const pgMaster = pgTable("pg_master", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  pgName: text("pg_name").notNull(),
  pgAddress: text("pg_address").notNull(),
  pgLocation: text("pg_location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }), // Latitude for location-based search
  longitude: decimal("longitude", { precision: 10, scale: 7 }), // Longitude for location-based search
  imageUrl: text("image_url"), // PG image (base64 or URL)
  totalRooms: integer("total_rooms").default(0),
  rentPaymentDate: integer("rent_payment_date"), // Day of month (1-31) when rent is due
  status: text("status").default("pending"), // pending, approved, rejected - Admin approval status
  approvedBy: integer("approved_by").references(() => users.id), // Admin who approved
  approvedAt: timestamp("approved_at"), // When it was approved
  rejectionReason: text("rejection_reason"), // Reason for rejection if status is rejected
  isActive: boolean("is_active").default(true), // Can be deactivated by admin for non-payment
  subscriptionStatus: text("subscription_status").default("trial"), // trial, active, expired, suspended
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  
  // Payment generation tracking
  lastPaymentGeneratedAt: timestamp("last_payment_generated_at"), // When payments were last auto-generated
  lastPaymentGeneratedMonth: text("last_payment_generated_month"), // Format: YYYY-MM (e.g., "2025-01")
  
  // Registration and compliance documents
  registrationNumber: text("registration_number"), // PG registration number (mandatory)
  registrationDocumentUrl: text("registration_document_url"), // PG registration certificate
  fssaiCertificateUrl: text("fssai_certificate_url"), // FSSAI certificate (mandatory if food amenities selected)
  
  // Amenities and filters for tenant search (deprecated - moved to pg_amenities table)
  pgType: text("pg_type").default("common"), // male, female, common
  hasFood: boolean("has_food").default(false),
  hasParking: boolean("has_parking").default(false),
  hasAC: boolean("has_ac").default(false),
  hasCCTV: boolean("has_cctv").default(false),
  hasWifi: boolean("has_wifi").default(false),
  hasLaundry: boolean("has_laundry").default(false),
  hasGym: boolean("has_gym").default(false),
  
  // Rating aggregates (updated when ratings are added)
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  totalRatings: integer("total_ratings").default(0),
  
  // Primary PG designation - one PG per owner can be marked as primary
  isPrimary: boolean("is_primary").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Partial unique index to ensure only one primary PG per owner
  primaryPerOwnerIdx: uniqueIndex("pg_master_primary_per_owner_idx")
    .on(table.ownerId)
    .where(sql`${table.isPrimary} = true`),
}));

export const insertPgMasterSchema = createInsertSchema(pgMaster).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertPgMaster = z.infer<typeof insertPgMasterSchema>;
export type PgMaster = typeof pgMaster.$inferSelect;

// Amenities Master table - Admin managed list of amenities
export const amenitiesMaster = pgTable("amenities_master", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "WiFi", "Food Service", "Parking"
  category: text("category").notNull(), // e.g., "basic", "security", "food", "comfort"
  requiresCertificate: boolean("requires_certificate").default(false), // If true, FSSAI certificate required
  isActive: boolean("is_active").default(true), // Can be archived
  displayOrder: integer("display_order").default(0), // For sorting in UI
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAmenitiesMasterSchema = createInsertSchema(amenitiesMaster).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});
export type InsertAmenitiesMaster = z.infer<typeof insertAmenitiesMasterSchema>;
export type AmenitiesMaster = typeof amenitiesMaster.$inferSelect;

// PG Amenities junction table - Maps PGs to their selected amenities
export const pgAmenities = pgTable("pg_amenities", {
  id: serial("id").primaryKey(),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id, { onDelete: "cascade" }),
  amenityId: integer("amenity_id").notNull().references(() => amenitiesMaster.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPgAmenitiesSchema = createInsertSchema(pgAmenities).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertPgAmenities = z.infer<typeof insertPgAmenitiesSchema>;
export type PgAmenities = typeof pgAmenities.$inferSelect;

// Tenants table
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  pgId: integer("pg_id").references(() => pgMaster.id),
  roomId: integer("room_id").references(() => rooms.id), // Direct room assignment
  bedId: integer("bed_id"), // Assigned bed position (references beds.id but no FK to avoid circular deps)
  userId: integer("user_id").references(() => users.id), // Link to tenant user account
  name: text("name").notNull(),
  email: text("email").default(""), // Email of tenant (when added by owner)
  phone: text("phone").notNull(),
  gender: text("gender"), // male, female, other - for gender-based PG validation
  roomNumber: text("room_number").notNull(),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  tenantImage: text("tenant_image"), // Base64 encoded image
  aadharCard: text("aadhar_card"), // Base64 encoded Aadhar/ID document
  photoUrl: text("photo_url"),
  idProofUrl: text("id_proof_url"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  relationship: text("relationship"), // Father, Mother, Brother, Sister, Spouse, Other
  status: text("status").default("active"), // active, inactive
  onboardingStatus: text("onboarding_status").default("not_onboarded"), // not_onboarded, pending, onboarded
  joinDate: timestamp("join_date"), // When tenant joined (for pro-rated billing). Falls back to createdAt if null.
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTenantSchema = createInsertSchema(tenants).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

// Emergency Contacts table (one-to-many relationship with tenants)
export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  relationship: text("relationship").notNull(), // Father, Mother, Brother, Sister, Spouse, Other
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;

// Tenant History table - Tracks tenant's previous stays across PGs for credibility
export const tenantHistory = pgTable("tenant_history", {
  id: serial("id").primaryKey(),
  tenantUserId: integer("tenant_user_id").notNull().references(() => users.id), // User account of the tenant
  pgId: integer("pg_id").references(() => pgMaster.id), // Which PG they stayed at (optional - some tenants may not have pgId)
  roomId: integer("room_id").references(() => rooms.id), // Which room (optional)
  roomNumber: text("room_number"), // Room number as backup if room deleted
  moveInDate: timestamp("move_in_date").notNull(), // When they moved in
  moveOutDate: timestamp("move_out_date").notNull(), // When they moved out
  ownerFeedback: text("owner_feedback"), // Owner's feedback about the tenant
  rating: integer("rating"), // 1-5 star rating from owner
  behaviorTags: text("behavior_tags").array().default([]), // quiet, paid_on_time, cooperative, etc.
  recordedByOwnerId: integer("recorded_by_owner_id").notNull().references(() => users.id), // Which owner recorded this
  verificationStatus: text("verification_status").default("verified"), // verified, pending, disputed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTenantHistorySchema = createInsertSchema(tenantHistory).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertTenantHistory = z.infer<typeof insertTenantHistorySchema>;
export type TenantHistory = typeof tenantHistory.$inferSelect;

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id), // Always valid since tenants are never deleted (soft delete with status)
  ownerId: integer("owner_id").notNull().references(() => users.id),
  pgId: integer("pg_id").references(() => pgMaster.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // rent, maintenance, electricity, other
  status: text("status").default("pending"), // pending, pending_approval, paid, overdue, rejected, deleted
  paymentMethod: text("payment_method"), // upi, cash, bank_transfer, other
  transactionId: text("transaction_id"), // UPI transaction ID or reference number
  paymentScreenshot: text("payment_screenshot"), // Base64 encoded screenshot of payment success
  rejectionReason: text("rejection_reason"), // Reason provided by owner when rejecting payment
  paymentMonth: text("payment_month"), // Format: YYYY-MM (e.g., "2025-01") for tracking which month this payment is for
  generatedAt: timestamp("generated_at"), // When this payment was auto-generated
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  deletedBy: integer("deleted_by").references(() => users.id), // Owner who deleted this payment
  deletedAt: timestamp("deleted_at"), // When this payment was soft-deleted
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  pgId: integer("pg_id").references(() => pgMaster.id), // Nullable - which PG this notification belongs to (for filtering)
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // visit_request, onboarding_request, payment, complaint, rent_reminder, system, message
  referenceId: integer("reference_id"), // ID of the related entity (visit request, onboarding request, payment, or complaint)
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ 
  id: true, 
  createdAt: true,
  isRead: true
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Push Subscriptions table (for web push notifications)
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(), // Encryption key
  auth: text("auth").notNull(), // Authentication secret
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ 
  id: true, 
  createdAt: true
});
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// Sessions table (for device management and multi-session support)
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id),
  deviceName: text("device_name"), // e.g., "Chrome on Windows"
  deviceType: text("device_type"), // mobile, tablet, desktop
  browser: text("browser"), // Chrome, Firefox, Safari, etc.
  os: text("os"), // Windows, macOS, Linux, Android, iOS
  ipAddress: text("ip_address"),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({ 
  id: true, 
  createdAt: true,
  lastActiveAt: true
});
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

// Rooms table
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  pgId: integer("pg_id").references(() => pgMaster.id),
  roomNumber: text("room_number").notNull(),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  tenantIds: integer("tenant_ids").array().default([]), // Array of tenant IDs, This column needs to be created in the database.
  sharing: integer("sharing").default(1), // 1-6 for number of people sharing
  floor: integer("floor").default(1), // Floor number
  hasAttachedBathroom: boolean("has_attached_bathroom").default(false), // true for attached, false for common
  hasAC: boolean("has_ac").default(false), // true if AC, false if no AC
  status: text("status").default("vacant"), // vacant, partially_occupied, fully_occupied
  amenities: text("amenities").array().default([]), // WiFi, Water, Power
  meterNumber: text("meter_number"), // Electricity meter number for this room
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({ 
  id: true, 
  createdAt: true,
  ownerId: true,
  pgId: true,
});
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;

// Beds table - Individual bed positions within a room
export const beds = pgTable("beds", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id, { onDelete: "cascade" }),
  position: text("position").notNull(), // left, middle, right, top-left, top-right, bottom-left, bottom-right, etc.
  displayOrder: integer("display_order").default(1), // Order for visual display (1, 2, 3...)
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "set null" }), // Assigned tenant (null if vacant)
  status: text("status").default("available"), // available, occupied, reserved
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBedSchema = createInsertSchema(beds).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertBed = z.infer<typeof insertBedSchema>;
export type Bed = typeof beds.$inferSelect;

// Complaints table
export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  tenantId: integer("tenant_id").references(() => tenants.id),
  roomId: integer("room_id").references(() => rooms.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").default("medium"), // low, medium, high
  status: text("status").default("open"), // open, in-progress, resolved
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertComplaintSchema = createInsertSchema(complaints).omit({ 
  id: true, 
  createdAt: true,
  resolvedAt: true
});
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaints.$inferSelect;

// Subscription Plans table (configured by admin)
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Starter, Pro, Enterprise
  description: text("description"),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }),
  maxRooms: integer("max_rooms"), // null for unlimited
  maxTenants: integer("max_tenants"), // null for unlimited
  features: text("features").array().default([]), // Array of feature descriptions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// PG Subscriptions table (tracks subscription payments for each PG)
export const pgSubscriptions = pgTable("pg_subscriptions", {
  id: serial("id").primaryKey(),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id, { onDelete: "cascade" }),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  billingCycle: text("billing_cycle").notNull(), // monthly, yearly
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"), // pending, paid, overdue, cancelled
  paymentMethod: text("payment_method"), // upi, bank_transfer, card, other
  transactionId: text("transaction_id"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  paidAt: timestamp("paid_at"),
  invoiceUrl: text("invoice_url"), // Link to invoice PDF
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPgSubscriptionSchema = createInsertSchema(pgSubscriptions).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertPgSubscription = z.infer<typeof insertPgSubscriptionSchema>;
export type PgSubscription = typeof pgSubscriptions.$inferSelect;

// PG Ratings table (tenant reviews of PGs)
export const pgRatings = pgTable("pg_ratings", {
  id: serial("id").primaryKey(),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id, { onDelete: "cascade" }),
  tenantUserId: integer("tenant_user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review"),
  cleanliness: integer("cleanliness"), // 1-5
  safety: integer("safety"), // 1-5
  facilities: integer("facilities"), // 1-5
  valueForMoney: integer("value_for_money"), // 1-5
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPgRatingSchema = createInsertSchema(pgRatings).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertPgRating = z.infer<typeof insertPgRatingSchema>;
export type PgRating = typeof pgRatings.$inferSelect;

// Visit Requests table (tenant requests to visit PG)
export const visitRequests = pgTable("visit_requests", {
  id: serial("id").primaryKey(),
  tenantUserId: integer("tenant_user_id").notNull().references(() => users.id),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id, { onDelete: "cascade" }),
  roomId: integer("room_id").references(() => rooms.id), // Optional: specific room interest
  ownerId: integer("owner_id").notNull().references(() => users.id),
  
  // Visit scheduling
  requestedDate: timestamp("requested_date").notNull(),
  requestedTime: text("requested_time").notNull(), // e.g., "10:00 AM"
  status: text("status").default("pending"), // pending, approved, rescheduled, completed, cancelled
  
  // Rescheduling by owner
  rescheduledDate: timestamp("rescheduled_date"),
  rescheduledTime: text("rescheduled_time"),
  rescheduledBy: text("rescheduled_by"), // owner or tenant
  
  // Confirmation
  confirmedDate: timestamp("confirmed_date"), // Final confirmed date after any rescheduling
  confirmedTime: text("confirmed_time"),
  
  notes: text("notes"), // Additional notes from tenant
  ownerNotes: text("owner_notes"), // Notes from owner
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVisitRequestSchema = createInsertSchema(visitRequests).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});
export type InsertVisitRequest = z.infer<typeof insertVisitRequestSchema>;
export type VisitRequest = typeof visitRequests.$inferSelect;

// Onboarding Requests table (tenant requests to join PG after visit)
export const onboardingRequests = pgTable("onboarding_requests", {
  id: serial("id").primaryKey(),
  tenantUserId: integer("tenant_user_id").notNull().references(() => users.id),
  visitRequestId: integer("visit_request_id").references(() => visitRequests.id),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id, { onDelete: "cascade" }),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  
  // Tenant details for onboarding
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  
  // Documents (base64 encoded)
  tenantImage: text("tenant_image"),
  aadharCard: text("aadhar_card"),
  
  // Emergency contacts
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactRelationship: text("emergency_contact_relationship"),
  
  status: text("status").default("pending"), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export const insertOnboardingRequestSchema = createInsertSchema(onboardingRequests).omit({ 
  id: true, 
  createdAt: true,
  approvedAt: true
});
export type InsertOnboardingRequest = z.infer<typeof insertOnboardingRequestSchema>;
export type OnboardingRequest = typeof onboardingRequests.$inferSelect;

// Electricity Billing Cycles table (tracks monthly billing cycles for electricity)
export const electricityBillingCycles = pgTable("electricity_billing_cycles", {
  id: serial("id").primaryKey(),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id, { onDelete: "cascade" }),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  periodStart: timestamp("period_start").notNull(), // Start date of billing period
  periodEnd: timestamp("period_end").notNull(), // End date of billing period
  billingMonth: text("billing_month").notNull(), // Format: YYYY-MM (e.g., "2025-01")
  invoiceNumber: text("invoice_number"), // Optional invoice reference from electricity provider
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0"), // Total bill amount across all rooms
  status: text("status").default("draft"), // draft, confirmed, settled
  confirmedAt: timestamp("confirmed_at"), // When owner confirmed and created payments
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniquePgMonth: sql`UNIQUE (pg_id, billing_month)`,
}));

export const insertElectricityBillingCycleSchema = createInsertSchema(electricityBillingCycles).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertElectricityBillingCycle = z.infer<typeof insertElectricityBillingCycleSchema>;
export type ElectricityBillingCycle = typeof electricityBillingCycles.$inferSelect;

// Electricity Room Bills table (meter readings and bill per room)
export const electricityRoomBills = pgTable("electricity_room_bills", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").notNull().references(() => electricityBillingCycles.id, { onDelete: "cascade" }),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id),
  meterNumber: text("meter_number"), // Meter number for this room
  previousReading: decimal("previous_reading", { precision: 10, scale: 2 }), // Previous meter reading
  currentReading: decimal("current_reading", { precision: 10, scale: 2 }).notNull(), // Current meter reading
  unitsConsumed: decimal("units_consumed", { precision: 10, scale: 2 }).notNull(), // Calculated or manual entry
  roomAmount: decimal("room_amount", { precision: 10, scale: 2 }).notNull(), // Total bill for this room
  ratePerUnit: decimal("rate_per_unit", { precision: 10, scale: 4 }), // Rate per unit (optional)
  notes: text("notes"), // Additional notes
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertElectricityRoomBillSchema = createInsertSchema(electricityRoomBills).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertElectricityRoomBill = z.infer<typeof insertElectricityRoomBillSchema>;
export type ElectricityRoomBill = typeof electricityRoomBills.$inferSelect;

// Electricity Tenant Charges table (split bill per tenant)
export const electricityTenantCharges = pgTable("electricity_tenant_charges", {
  id: serial("id").primaryKey(),
  roomBillId: integer("room_bill_id").notNull().references(() => electricityRoomBills.id, { onDelete: "cascade" }),
  cycleId: integer("cycle_id").notNull().references(() => electricityBillingCycles.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id),
  shareAmount: decimal("share_amount", { precision: 10, scale: 2 }).notNull(), // Tenant's share of room bill
  activeDays: integer("active_days"), // Number of days tenant was active during billing period
  totalRoomDays: integer("total_room_days"), // Total weighted days for all tenants in room
  sharePercentage: decimal("share_percentage", { precision: 5, scale: 2 }), // Percentage share of the bill
  dueDate: timestamp("due_date"), // Payment due date
  paymentId: integer("payment_id").references(() => payments.id), // Links to payment record when created
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertElectricityTenantChargeSchema = createInsertSchema(electricityTenantCharges).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertElectricityTenantCharge = z.infer<typeof insertElectricityTenantChargeSchema>;
export type ElectricityTenantCharge = typeof electricityTenantCharges.$inferSelect;

// Food Menu table (weekly menu for breakfast, lunch, dinner)
export const foodMenu = pgTable("food_menu", {
  id: serial("id").primaryKey(),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id, { onDelete: "cascade" }),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  dayOfWeek: text("day_of_week").notNull(), // monday, tuesday, wednesday, thursday, friday, saturday, sunday
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner
  items: text("items").array().notNull(), // Array of food items
  isVeg: boolean("is_veg").array().notNull(), // Corresponding veg/non-veg marker for each item
  notes: text("notes"), // Additional notes about the meal
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniquePgDayMeal: sql`UNIQUE (pg_id, day_of_week, meal_type)`,
}));

export const insertFoodMenuSchema = createInsertSchema(foodMenu).omit({ 
  id: true, 
  ownerId: true,
  createdAt: true,
  updatedAt: true
});
export type InsertFoodMenu = z.infer<typeof insertFoodMenuSchema>;
export type FoodMenu = typeof foodMenu.$inferSelect;

// Announcements table - Owner announcements to tenants
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id, { onDelete: "cascade" }),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  heading: text("heading").notNull(),
  details: text("details").notNull(),
  priority: text("priority").default("medium"), // low, medium, high
  targetRooms: integer("target_rooms").array(), // Array of room IDs to target (null means all rooms)
  targetFloors: integer("target_floors").array(), // Array of floor numbers to target (null means all floors)
  targetTenants: integer("target_tenants").array(), // Array of tenant IDs to target (null means all tenants)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ 
  id: true, 
  ownerId: true,
  createdAt: true 
});
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;
