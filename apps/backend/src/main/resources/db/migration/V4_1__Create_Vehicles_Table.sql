CREATE TABLE vehicles (
    id UUID PRIMARY KEY,
    license_plate VARCHAR(255) NOT NULL UNIQUE,
    vin VARCHAR(255) NOT NULL UNIQUE,
    driver_id UUID,
    capacity TEXT,
    current_location VARCHAR(255),
    maintenance_status VARCHAR(50) NOT NULL,
    vehicle_status VARCHAR(50) NOT NULL,
    last_maintenance_date DATE,
    CONSTRAINT fk_vehicle_driver FOREIGN KEY (driver_id) REFERENCES users (id) ON DELETE SET NULL
);