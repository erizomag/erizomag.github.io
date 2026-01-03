-- Initialize PostGIS database for Parcel Triage

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create schema for parcel data
CREATE SCHEMA IF NOT EXISTS parcel_data;

-- Parcels table
CREATE TABLE IF NOT EXISTS parcel_data.parcels (
    id SERIAL PRIMARY KEY,
    jurisdiction VARCHAR(50) NOT NULL,
    parcel_id VARCHAR(100) NOT NULL,
    address TEXT,
    lot_area_sqft NUMERIC,
    zoning VARCHAR(50),
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(jurisdiction, parcel_id)
);

-- Zoning districts table
CREATE TABLE IF NOT EXISTS parcel_data.zoning_districts (
    id SERIAL PRIMARY KEY,
    jurisdiction VARCHAR(50) NOT NULL,
    zone_code VARCHAR(50) NOT NULL,
    zone_name TEXT,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(jurisdiction, zone_code)
);

-- Floodplain table
CREATE TABLE IF NOT EXISTS parcel_data.floodplain (
    id SERIAL PRIMARY KEY,
    jurisdiction VARCHAR(50) NOT NULL,
    fld_zone VARCHAR(50),
    fld_ar_id VARCHAR(100),
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial indexes
CREATE INDEX IF NOT EXISTS idx_parcels_geom ON parcel_data.parcels USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_parcels_jurisdiction ON parcel_data.parcels (jurisdiction);
CREATE INDEX IF NOT EXISTS idx_zoning_geom ON parcel_data.zoning_districts USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_zoning_jurisdiction ON parcel_data.zoning_districts (jurisdiction);
CREATE INDEX IF NOT EXISTS idx_floodplain_geom ON parcel_data.floodplain USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_floodplain_jurisdiction ON parcel_data.floodplain (jurisdiction);

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA parcel_data TO parcel_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA parcel_data TO parcel_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA parcel_data TO parcel_user;
