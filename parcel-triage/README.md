# Parcel Triage - Multifamily Feasibility Analysis MVP

A web application that helps answer: "Is this parcel likely buildable for multifamily development?"

## Overview

Parcel Triage provides preliminary feasibility analysis for multifamily development projects. The MVP targets **Kingston, NY** as the pilot jurisdiction.

**Key Features:**
- 🔍 Search parcels by address or parcel ID
- 🚦 Green/Yellow/Red feasibility scoring
- 📊 Transparent calculations (lot area, FAR, parking constraints)
- 🗺️ Interactive map with zoning and floodplain overlays
- 📏 Estimated unit range (min-max)

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

### Installation

1. **Clone the repository:**
   ```bash
   cd /path/to/erizomag.github.io/parcel-triage
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint
```

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
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

To add support for another municipality:

1. **Create jurisdiction config** in `lib/config/jurisdictions.ts`:
   ```typescript
   export const newCityNY: JurisdictionConfig = {
     id: 'newcity-ny',
     name: 'New City',
     state: 'NY',
     // ... add zoning districts, data sources, etc.
   };
   ```

2. **Add GeoJSON data** in `data/newcity-ny/`:
   - `parcels/parcels.geojson`
   - `zoning/zoning.geojson`
   - `floodplain/floodplain.geojson`

3. **Register jurisdiction** in the `jurisdictions` registry

4. **Update frontend** to allow jurisdiction selection (currently hardcoded to Kingston)

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
