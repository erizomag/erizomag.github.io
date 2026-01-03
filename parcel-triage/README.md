# Parcel Triage - Multifamily Feasibility Analysis MVP

A web application that helps answer: "Is this parcel likely buildable for multifamily development?"

## Overview

Parcel Triage provides preliminary feasibility analysis for multifamily development projects. The MVP includes **Kingston, NY** (pilot) and **Albany, NY** (demo) jurisdictions.

**Key Features:**
- 🏙️ **Multi-Jurisdiction Support** - Switch between jurisdictions via dropdown
- 🔍 **Parcel Search** - Search by address or parcel ID
- 🚦 **Feasibility Scoring** - Green/Yellow/Red color-coded results
- 📊 **Transparent Calculations** - Lot area, FAR, parking constraints
- 🗺️ **Interactive Map** - Leaflet-based with zoning and floodplain overlays
- 📏 **Unit Estimates** - Min-max unit range based on constraints
- 🛠️ **Developer Tools** - Makefile, CI/CD, Docker support
- ✅ **Data Validation** - Python script to validate GeoJSON files

**Non-Goals (explicitly excluded):**
- ❌ No legal determinations
- ❌ No full zoning text parsing
- ❌ No permit submission
- ❌ No detailed massing/architectural drawings
- ❌ No financial pro forma

## Tech Stack

- **Frontend:** Next.js 15 (TypeScript) + Tailwind CSS
- **Mapping:** Leaflet.js (no API key required)
- **Spatial Analysis:** Turf.js
- **Testing:** Jest + React Testing Library
- **Data:** Local GeoJSON files (public data sources)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- Make (optional, for convenience commands)
- Python 3.8+ (optional, for data validation)
- Docker + Docker Compose (optional, for containerized deployment)

### Installation

#### Option 1: Using Makefile (Recommended)

```bash
cd /path/to/erizomag.github.io/parcel-triage

# Install dependencies
make install

# Start development server
make dev

# Open http://localhost:3000 in your browser
```

#### Option 2: Using npm directly

```bash
cd /path/to/erizomag.github.io/parcel-triage

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

#### Option 3: Using Docker

```bash
cd /path/to/erizomag.github.io/parcel-triage

# Build and start all services
docker-compose up --build

# Open http://localhost:3000 in your browser
# PostGIS available on localhost:5432
# PgAdmin (dev profile) on localhost:5050
```

### Running Tests

```bash
# Using Make
make test              # Run all tests
make test-watch        # Run tests in watch mode
make lint              # Run ESLint
make lint-fix          # Fix linting issues

# Using npm
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run lint           # Run ESLint
```

### Building for Production

```bash
# Using Make
make build

# Using npm
npm run build

# Start production server
npm start
```

### Data Validation

```bash
# Validate GeoJSON files for all jurisdictions
make validate-data

# Or validate a specific jurisdiction
python3 scripts/validate-geojson.py data/kingston-ny

# Validate and simplify geometries
python3 scripts/validate-geojson.py data/kingston-ny --simplify --tolerance=0.0001
```

## Project Structure

```
parcel-triage/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── analyze/          # Feasibility analysis endpoint
│   │   ├── parcels/          # Parcel search endpoint
│   │   └── layers/           # GeoJSON layer endpoints
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Main page
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── SearchForm.tsx        # Parcel search form
│   ├── ParcelResults.tsx     # Search results list
│   ├── ParcelMap.tsx         # Leaflet map component
│   └── FeasibilityDisplay.tsx # Results display
├── lib/                      # Core logic
│   ├── types/                # TypeScript types
│   ├── config/               # Jurisdiction configs
│   │   └── jurisdictions.ts  # Kingston, NY config
│   ├── calculations/         # Feasibility calculation engine
│   │   └── feasibility.ts
│   └── data/                 # Data access layer
│       └── geojson-loader.ts
├── data/                     # GeoJSON data files
│   └── kingston-ny/
│       ├── parcels/
│       ├── zoning/
│       └── floodplain/
├── __tests__/                # Test files
│   └── feasibility.test.ts
└── README.md                 # This file
```

## How It Works

### 1. User Input
User enters an address (e.g., "123 Broadway") or parcel ID (e.g., "48.28-1-1").

### 2. Parcel Lookup
- API searches GeoJSON parcel data
- Returns matching parcels with basic info

### 3. Feasibility Analysis
When a parcel is selected, the system:

1. **Loads parcel data** (geometry, lot area, zoning)
2. **Determines zoning district** (spatial intersection)
3. **Checks floodplain status** (spatial intersection)
4. **Calculates constraints:**
   - Is multifamily allowed in this zone?
   - Does lot meet minimum size requirements?
   - Calculate buildable area (lot area × max coverage)
   - Calculate max units by FAR
   - Calculate max units by parking constraints
5. **Applies business logic:**
   - Most restrictive constraint wins
   - Generate Green/Yellow/Red score
   - List all constraints with impact descriptions

### 4. Results Display
- Map shows parcel boundary with color-coded feasibility
- Side panel displays:
  - Feasibility score (Green/Yellow/Red)
  - Estimated unit range (e.g., 8-12 units)
  - Key calculations (lot area, buildable area, FAR)
  - Constraints and considerations

## Feasibility Scoring Logic

| Score | Meaning | Criteria |
|-------|---------|----------|
| 🟢 **GREEN** | Feasible | No critical constraints, 0-1 warnings |
| 🟡 **YELLOW** | Conditional | 1+ warnings (e.g., floodplain, limited parking) |
| 🔴 **RED** | Not Feasible | 1+ critical constraints (e.g., not zoned for multifamily) |

### Sample Calculations

**Example: 12,000 sqft lot in R3 zone**

```
Zoning: R3 (Multifamily Residential)
- Multifamily allowed: ✓ Yes
- Min lot area: 10,000 sqft ✓
- Max FAR: 1.0
- Max coverage: 40%
- Min parking: 1.5 spaces/unit

Calculations:
1. Buildable area: 12,000 × 0.4 = 4,800 sqft
2. Max floor area: 12,000 × 1.0 = 12,000 sqft
3. Max units by FAR: 12,000 / 900 = 13 units
4. Remaining for parking: 12,000 - 4,800 = 7,200 sqft
5. Parking spaces: 7,200 / 180 = 40 spaces
6. Max units by parking: 40 / (1.5 × 0.8) = 33 units

Result: 13 units (FAR is limiting factor)
Score: 🟢 GREEN (no constraints)
```

## Adding a New Jurisdiction

The system is designed for easy expansion to new municipalities. Follow these steps:

### 1. Review the Template

```bash
# View the jurisdiction configuration template
cat jurisdictions/template.json
```

The template documents all required and optional fields.

### 2. Prepare GeoJSON Data

Collect three GeoJSON files:
- **Parcels** - Must include `parcel_id`, `lot_area_sqft`, `zoning` properties
- **Zoning Districts** - Must include `zone_code` property
- **Floodplain** - Can be empty FeatureCollection if not applicable

**Data Sources:**
- County GIS departments
- State open data portals
- FEMA National Flood Hazard Layer (for floodplain)

**Convert to GeoJSON if needed:**
```bash
# Example: Convert Shapefile to GeoJSON
ogr2ogr -f GeoJSON -t_srs EPSG:4326 output.geojson input.shp
```

### 3. Create Directory Structure

```bash
mkdir -p data/your-city-st/{parcels,zoning,floodplain}
```

Place your GeoJSON files:
```
data/your-city-st/
├── parcels/parcels.geojson
├── zoning/zoning.geojson
└── floodplain/floodplain.geojson
```

### 4. Validate Data

```bash
# Install Python dependencies
pip install -r scripts/requirements.txt

# Validate GeoJSON files
python3 scripts/validate-geojson.py data/your-city-st

# Optionally simplify geometries for performance
python3 scripts/validate-geojson.py data/your-city-st --simplify --tolerance=0.0001
```

### 5. Create Jurisdiction Configuration

Add to `lib/config/jurisdictions.ts`:

```typescript
export const yourCityST: JurisdictionConfig = {
  id: 'your-city-st',
  name: 'Your City',
  state: 'ST',
  data_sources: {
    parcels: '/data/your-city-st/parcels/parcels.geojson',
    zoning: '/data/your-city-st/zoning/zoning.geojson',
    floodplain: '/data/your-city-st/floodplain/floodplain.geojson',
  },
  zoning_districts: {
    'R-1': {
      code: 'R-1',
      name: 'Single-Family Residential',
      multifamily_allowed: false,
      min_lot_area_sqft: 5000,
      max_lot_coverage: 0.30,
      min_parking_per_unit: 2.0,
      max_height_ft: 35,
    },
    // Add all zoning districts from your city...
  },
  default_assumptions: {
    avg_unit_size_sqft: 900,
    parking_reduction_factor: 0.8,
  },
};

// Register in the jurisdictions object
export const jurisdictions: Record<string, JurisdictionConfig> = {
  'kingston-ny': kingstonNY,
  'albany-ny': albanyNY,
  'your-city-st': yourCityST,  // Add here
};
```

### 6. Test the New Jurisdiction

```bash
# Run tests
make test

# Start dev server
make dev

# Test in browser:
# 1. Select your jurisdiction from dropdown
# 2. Search for a parcel
# 3. Verify feasibility analysis works
```

### 7. Verify CI/CD

The GitHub Actions workflow will automatically validate your GeoJSON files:

```yaml
# .github/workflows/ci.yml includes:
python scripts/validate-geojson.py data/your-city-st
```

### Jurisdiction Configuration Checklist

- [ ] GeoJSON files validated
- [ ] All parcels have required properties
- [ ] Zoning districts in GeoJSON match config
- [ ] Coordinate system is WGS84 (EPSG:4326)
- [ ] Config added to `jurisdictions.ts`
- [ ] Jurisdiction appears in dropdown
- [ ] Tests pass
- [ ] Search and analysis work correctly

## Data Sources (Kingston, NY)

All data comes from public sources:

| Layer | Source | License |
|-------|--------|---------|
| Parcels | Ulster County GIS | Public Domain |
| Zoning | City of Kingston Planning Dept | Public Domain |
| Floodplain | FEMA NFHL | Public Domain |

**Note:** Current data is sample/synthetic. Replace with real data from sources listed in `data/kingston-ny/README.md`.

## API Endpoints

### GET `/api/parcels`
Search for parcels by address or parcel ID.

**Query Parameters:**
- `jurisdiction` (string): e.g., "kingston-ny"
- `query` (string): search term
- `type` (string): "address" or "parcel_id"

**Response:**
```json
{
  "jurisdiction": "kingston-ny",
  "count": 1,
  "results": [
    {
      "type": "Feature",
      "geometry": { ... },
      "properties": {
        "parcel_id": "48.28-1-1",
        "address": "123 Broadway, Kingston, NY 12401",
        "lot_area_sqft": 12000,
        "zoning": "MU"
      }
    }
  ]
}
```

### POST `/api/analyze`
Analyze parcel feasibility for multifamily development.

**Request Body:**
```json
{
  "jurisdiction": "kingston-ny",
  "parcel_id": "48.28-1-1",
  "use_type": "multifamily"
}
```

**Response:**
```json
{
  "parcel_id": "48.28-1-1",
  "address": "123 Broadway, Kingston, NY 12401",
  "score": "GREEN",
  "max_units_range": { "min": 2, "max": 13 },
  "constraints": [],
  "calculations": {
    "lot_area_sqft": 12000,
    "buildable_area_sqft": 8400,
    "parking_capacity": 20,
    "max_far": 2.5,
    "applied_far": 1.3
  },
  "zoning": {
    "district": "MU",
    "multifamily_allowed": true
  },
  "floodplain": {
    "in_floodplain": false
  },
  "parcel_geometry": { ... }
}
```

### GET `/api/layers`
Get GeoJSON layers for map display.

**Query Parameters:**
- `jurisdiction` (string): e.g., "kingston-ny"
- `type` (string): "parcels", "zoning", or "floodplain"

## Testing

The project includes comprehensive unit tests for core calculation logic:

```bash
npm test
```

**Test Coverage:**
- ✓ Buildable area calculations
- ✓ FAR-based unit calculations
- ✓ Parking constraint calculations
- ✓ Constraint generation logic
- ✓ Feasibility scoring
- ✓ End-to-end analysis scenarios

## Deployment

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Docker
```bash
# Build image
docker build -t parcel-triage .

# Run container
docker run -p 3000:3000 parcel-triage
```

### Option 3: Static Export (if no API needed)
```bash
npm run build
# Deploy /out directory to any static host
```

## Limitations & Disclaimers

⚠️ **IMPORTANT:**

- This tool provides **preliminary analysis only**
- It is **not a legal determination** of buildability
- Results are **estimates** based on simplified zoning rules
- Always consult with:
  - Local planning/zoning officials
  - Licensed architects
  - Real estate attorneys
  - Civil engineers
- Actual development may require:
  - Variances
  - Special permits
  - Environmental reviews
  - Site-specific studies

## Roadmap

**MVP (Current):**
- [x] Single jurisdiction (Kingston, NY)
- [x] Single use type (multifamily)
- [x] Basic feasibility scoring
- [x] Interactive map
- [x] Transparent calculations

**Future Enhancements:**
- [ ] Multi-jurisdiction support
- [ ] Additional use types (commercial, mixed-use)
- [ ] Historical permit data integration
- [ ] User accounts & saved searches
- [ ] PDF report generation
- [ ] Advanced constraints (wetlands, historic districts)
- [ ] Integration with property listing APIs
- [ ] Cost estimator (basic pro forma)

## Contributing

This is an MVP. Contributions welcome!

1. Fork the repo
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- File an issue on GitHub
- Check the documentation in `/data/kingston-ny/README.md`
- Review test files for usage examples

---

**Built with ❤️ for transparent, data-driven development decisions**
