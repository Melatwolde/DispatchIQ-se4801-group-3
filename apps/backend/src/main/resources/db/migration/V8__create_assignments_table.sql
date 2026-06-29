CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED',
    priority INT NOT NULL DEFAULT 1,
    notes TEXT,
    pickup_lat DOUBLE PRECISION NOT NULL,
    pickup_lng DOUBLE PRECISION NOT NULL,
    dropoff_lat DOUBLE PRECISION NOT NULL,
    dropoff_lng DOUBLE PRECISION NOT NULL,
    pickup_address TEXT,
    dropoff_address TEXT,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- This acts exactly like an ENUM but uses standard SQL syntax
    CONSTRAINT chk_assignment_status CHECK (status IN ('ASSIGNED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'))
);

CREATE INDEX idx_assignments_delivery_id ON assignments(delivery_id);
CREATE INDEX idx_assignments_driver_id ON assignments(driver_id);