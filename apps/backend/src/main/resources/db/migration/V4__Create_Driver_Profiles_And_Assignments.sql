CREATE TYPE driver_structural_state AS ENUM ('AVAILABLE', 'OFFLINE', 'ON_DELIVERY', 'BREAK');
CREATE TYPE assignment_status AS ENUM ('PENDING', 'ASSIGNED', 'ACCEPTED', 'REJECTED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

CREATE TABLE driver_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    structural_state driver_structural_state NOT NULL DEFAULT 'AVAILABLE',
    capacity_cap INT NOT NULL DEFAULT 3,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    proximity_radius_meters INT NOT NULL DEFAULT 5000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status assignment_status NOT NULL DEFAULT 'ASSIGNED',
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_driver_status ON assignments(driver_id, status);
CREATE INDEX idx_assignments_delivery_id ON assignments(delivery_id);
