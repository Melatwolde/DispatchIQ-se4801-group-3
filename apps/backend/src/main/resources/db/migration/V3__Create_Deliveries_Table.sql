CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    pickup_address TEXT,
    pickup_coords GEOGRAPHY(POINT, 4326),
    dropoff_address TEXT,
    dropoff_coords GEOGRAPHY(POINT, 4326),
    requested_pickup_time TIMESTAMPTZ,
    deadline TIMESTAMPTZ,
    priority delivery_priority DEFAULT 'MEDIUM',
    status delivery_status DEFAULT 'PENDING',
    special_instructions TEXT,
    proof_of_delivery_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for queries & geospatial lookups
CREATE INDEX idx_deliveries_customer_id ON deliveries(customer_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_pickup_coords ON deliveries USING GIST(pickup_coords);
CREATE INDEX idx_deliveries_dropoff_coords ON deliveries USING GIST(dropoff_coords);