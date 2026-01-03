# Kingston, NY Sample Data

This directory contains sample GeoJSON data for the Kingston, NY jurisdiction. In production, these files should be replaced with actual public data from authoritative sources.

## Data Sources

### Parcels (`parcels/parcels.geojson`)
- **Source**: Ulster County GIS Open Data Portal
- **URL**: https://gis.co.ulster.ny.us/
- **Update Frequency**: Quarterly
- **License**: Public Domain
- **Properties**:
  - `parcel_id`: Tax parcel identifier (SBL format)
  - `address`: Street address
  - `lot_area_sqft`: Lot area in square feet
  - `zoning`: Zoning district code
  - `owner`: Property owner name

### Zoning (`zoning/zoning.geojson`)
- **Source**: City of Kingston Planning Department
- **URL**: https://www.kingston-ny.gov/planning
- **Update Frequency**: As amended
- **License**: Public Domain
- **Properties**:
  - `zone_code`: Zoning district code (R1, R2, R3, MU, C1, etc.)
  - `zone_name`: Full district name
  - `description`: Brief description

### Floodplain (`floodplain/floodplain.geojson`)
- **Source**: FEMA National Flood Hazard Layer (NFHL)
- **URL**: https://msc.fema.gov/portal/home
- **Update Frequency**: Per FEMA map updates
- **License**: Public Domain
- **Properties**:
  - `fld_zone`: Flood zone designation (A, AE, X, etc.)
  - `fld_ar_id`: FEMA flood area ID
  - `zone_subty`: Zone subtype (FLOODWAY, etc.)
  - `static_bfe`: Base Flood Elevation in feet

## How to Update Data

1. Download the latest datasets from the sources above
2. Convert to GeoJSON format (use `ogr2ogr` or QGIS)
3. Ensure coordinate system is WGS84 (EPSG:4326)
4. Maintain the property schema shown above
5. Validate GeoJSON using https://geojsonlint.com/

## Sample Data Note

The current files contain synthetic sample data for demonstration purposes. The coordinates are approximate and properties are fictional. Replace with real data before production use.
