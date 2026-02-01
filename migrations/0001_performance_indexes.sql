-- Performance optimization indexes for frequently queried columns
-- These indexes improve query performance for owner dashboard and listing pages

-- Payments indexes for owner filtering and status queries
CREATE INDEX IF NOT EXISTS idx_payments_owner_pg_status ON payments (owner_id, pg_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_owner_pg_created ON payments (owner_id, pg_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);

-- Tenants indexes for owner PG management queries
CREATE INDEX IF NOT EXISTS idx_tenants_owner_pg_status ON tenants (owner_id, pg_id, status);
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants (user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_room_id ON tenants (room_id);

-- Rooms indexes for owner PG management queries
CREATE INDEX IF NOT EXISTS idx_rooms_owner_pg_status ON rooms (owner_id, pg_id, status);
CREATE INDEX IF NOT EXISTS idx_rooms_owner_pg ON rooms (owner_id, pg_id);

-- Notifications indexes for user notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_pg ON notifications (user_id, pg_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read);
