-- Enable PostGIS & UUID generation
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Enums (prevents string typos & enforces constraints)
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'DISPATCHER', 'DRIVER', 'CUSTOMER');
CREATE TYPE delivery_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE delivery_status AS ENUM ('PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED');