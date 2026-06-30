
CREATE TABLE driver_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    structural_state VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    capacity_cap INT NOT NULL DEFAULT 3,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    proximity_radius_meters INT NOT NULL DEFAULT 5000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
   
    CONSTRAINT chk_structural_state CHECK (structural_state IN ('AVAILABLE', 'OFFLINE', 'ON_DELIVERY', 'BREAK'))
);