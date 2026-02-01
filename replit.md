# StayBuki - PG Management System

## Overview
StayBuki is a comprehensive PG (Paying Guest) hostel management application for owners and tenants. It streamlines operations for rooms, tenants, payments, complaints, maintenance, and reporting. The system offers dual interfaces to enhance tenant experience and provide owners with robust management capabilities. It is a full-stack web application using React, Express.js, PostgreSQL, and Drizzle ORM.

## User Preferences
Preferred communication style: Simple, everyday language.
**Important:** Always update this file (replit.md) whenever new functionality is added or existing functionality changes. This ensures accurate documentation for future sessions.

## System Architecture

### Technology Stack
- **Frontend:** React 18 (TypeScript, Vite), Wouter, TanStack Query, Radix UI, Tailwind CSS, Framer Motion, Shadcn UI.
- **Backend:** Express.js (TypeScript), session-based authentication, RESTful API, Bcrypt, UAParser.
- **Database:** PostgreSQL, Drizzle ORM, Neon serverless adapter.

### Application Structure
The project is organized as a monorepo with `/client` (React frontend), `/server` (Express backend), `/shared` (shared code), and `/script` (build scripts).

### Authentication & Authorization
The system uses secure, cookie-based session management with multi-device support, "Remember Me" functionality, and a "Manage Devices" screen. It supports Owner, Tenant, and Admin user types, and includes robust password management (first-time reset, OTP, email-based resets).

### Key Features
- **Multi-PG Support:** Owners can manage multiple properties with context switching and PG-specific data caching.
- **Primary PG Designation:** Owners can designate one PG as their primary property for faster access. The primary PG is auto-selected on login and displayed with a distinctive amber star badge. Database-level unique constraint ensures data integrity (only one primary per owner). Only approved and active PGs can be set as primary.
- **Responsive Design:** Mobile-first approach with adaptive layouts and PWA manifest.
- **Automated Payment Generation:** Monthly rent payment generation with notifications and configurable settings.
- **Tenant-Initiated Payments:** Flexible payment system supporting UPI (with deep links) or cash, including screenshot verification and owner approval workflows.
- **Electricity Billing System:** Room-level meter reading and billing, including cycle creation, tenant charge distribution, and history. Features **pro-rated billing** based on tenant join dates - if tenants joined mid-month, their electricity share is calculated proportionally based on the number of days they were present. The system tracks `activeDays`, `totalRoomDays`, and `sharePercentage` for each tenant charge. Owners can set a tenant's join date when adding them, which is used for accurate pro-rata calculations.
- **Onboarding System:** Two-stage process involving visit requests and a 4-step tenant application workflow. Includes gender-based PG restriction validation.
- **Gender-Based PG Restrictions:** System enforces gender compatibility between tenants and PGs. Boys PGs only accept male tenants, Girls PGs only accept female tenants, and Common/Co-ed PGs accept all genders. Validation occurs at: owner registration, tenant/applicant registration, add tenant, bulk upload, visit requests (with inline gender selection for users without stored gender), and onboarding requests.
- **Notification System:** Real-time dual notification system for both owners and tenants with in-app alerts and web push capabilities, including PG-specific filtering. Tenants receive notifications for payment requests (both individual and auto-generated), payment approvals/rejections, visit request updates, onboarding status changes, announcements, and food alerts.
- **Owner Dashboard:** Dynamic, PG-specific dashboard with real-time statistics (total tenants, revenue, pending dues, occupancy rate) and an activity feed.
- **Tenant Lifecycle Management:** Tracks tenant housing status, preserves history through soft-deletion, and provides detailed feedback mechanisms. Includes duplicate prevention, automated onboarding emails, and bulk tenant upload. **Join Date Capture:** The tenant join date is captured across all entry points for accurate pro-rated billing: (1) Add Tenant form has date picker, (2) Onboarding approval auto-sets to approval date, (3) Bulk upload CSV includes joinDate column, (4) Edit Tenant screen allows owners to update join dates post-creation.
- **Session Management:** Comprehensive multi-device session tracking with device information, "Manage Devices" page, and individual/bulk logout capabilities.
- **User Profile Menu:** Header dropdown menu available on both desktop and mobile with user avatar, name, email, role badge, quick navigation to profile/settings, and secure logout with confirmation dialog. Works for all user types (owner, tenant, admin, applicant).
- **Food Menu System:** Weekly food menu management with breakfast/lunch/dinner planning, owner CRUD operations, and food alert functionality to notify tenants via in-app and web push notifications.
- **Dynamic Reporting System:** Provides aggregated summary, revenue, payment history, occupancy, and tenant details reports. Features professional PDF generation with branding, custom templates, and pagination.
- **Admin Owner Analytics:** Admin users can view owner-wise PG statistics including active PG counts, tenant counts (active and vacated), and drill down to view detailed tenant information for any PG - same information owners see. Features include: owner list with search, PG breakdown per owner showing active/vacated tenant counts and room occupancy, tenant roster modal with Active/Vacated tabs and search, and detailed tenant sheet showing complete info (contact, room, rent, dates, emergency contacts, documents, and owner feedback for vacated tenants). Accessible via Admin Dashboard > Owner & PG Analytics.
- **Bed Position Management:** Visual bed layout management allowing owners to define specific bed positions within rooms (e.g., "Left", "Middle", "Right", "Near Window"). Features include:
  - **Owner Room Management:** Add/edit rooms with bed position configuration using preset positions or custom labels
  - **Applicant Search Display:** Room cards in PG search show visual bed layout with availability status (green=available, red=occupied)
  - **Onboarding Bed Selection:** When approving onboarding requests, owners can select specific bed positions for new tenants via a selection dialog
  - **Database Schema:** Beds table with roomId, pgId, position, displayOrder, tenantId, and status fields; bedId column on tenants table
  - **API Endpoints:** GET/POST beds by room, bulk create, assign/vacate beds
  - **Data Synchronization:** `assignBedToTenantAtomic` and `reassignTenantBedAtomic` atomically update both bed and tenant tables, ensuring tenant.bedId, tenant.roomId, and tenant.roomNumber are always synchronized with bed assignments
  - **React Query Cache Management:** Bed assignment operations invalidate all affected caches (tenant, tenants, rooms, room-beds) to ensure Edit Tenant always displays fresh data after bed assignments via Edit Room

### Data Handling
Large binary data is gzip-compressed and base64 encoded. Core entities include Users, PG Master, Rooms, Tenants, Payments, Notifications, Sessions, and Tenant History.

### Performance Optimizations
- **Database Indexes:** Composite indexes on payments, tenants, rooms, and notifications tables for faster owner/PG filtering queries. Documented in `migrations/0001_performance_indexes.sql`.
- **Backend Caching:** 15-second in-memory cache for dashboard stats and recent activity endpoints to reduce database load.
- **React Query Tuning:** Dashboard uses 2-minute refresh interval with 1-minute staleTime. Notifications use 60s/30s intervals with appropriate caching.

### Email Verification
- **Service:** ZeroBounce (with fallback support for NeverBounce, Kickbox).
- **Validation Points:** Owner registration, tenant onboarding, add tenant, and bulk tenant upload.
- **Behavior:** Rejects emails with 'invalid' status (non-existent/undeliverable). Allows 'risky' emails with a server-side warning log. Falls back to regex validation when no API key is configured.

## External Dependencies
- **Database:** Neon Serverless PostgreSQL.
- **UI Components:** Radix UI, Lucide React, Shadcn UI.
- **Forms & Validation:** React Hook Form, Zod.
- **File Handling:** Pako (gzip), Base64 encoding.
- **Maps & Location:** OpenStreetMap Nominatim API.
- **Device Detection:** UAParser.js.
- **Email Verification:** ZeroBounce API (ZEROBOUNCE_API_KEY).