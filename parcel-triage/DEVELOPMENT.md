# Development Guide

## Development Environment Setup

### Prerequisites
- Node.js 18+ (recommend using nvm)
- npm or yarn
- Git
- VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

### Initial Setup

1. **Clone and install:**
   ```bash
   cd parcel-triage
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Architecture Overview

### Frontend (Next.js App Router)
- **app/page.tsx**: Main application page with search/results/map
- **components/**: Reusable React components
  - `SearchForm`: Address/parcel ID search
  - `ParcelResults`: Display search results
  - `FeasibilityDisplay`: Show analysis results
  - `ParcelMap`: Leaflet map with layers

### Backend (Next.js API Routes)
- **app/api/parcels/route.ts**: Parcel search
- **app/api/analyze/route.ts**: Feasibility analysis
- **app/api/layers/route.ts**: GeoJSON layer serving

### Core Logic
- **lib/calculations/feasibility.ts**: Pure calculation functions
- **lib/data/geojson-loader.ts**: Data access layer
- **lib/config/jurisdictions.ts**: Jurisdiction configurations

### Data Layer
- GeoJSON files in `data/` directory
- No database required for MVP
- Spatial queries using Turf.js

## Code Style & Conventions

### TypeScript
- Strict mode enabled
- Always define types/interfaces
- Use type imports: `import type { Foo } from ...`
- Avoid `any` - use `unknown` if needed

### React Components
- Use functional components
- Custom hooks for reusable logic
- Props interfaces named `ComponentNameProps`

### File Naming
- Components: PascalCase (e.g., `SearchForm.tsx`)
- Utilities: camelCase (e.g., `geojson-loader.ts`)
- Types: PascalCase in `index.ts`

### API Routes
- Use HTTP status codes correctly
- Validate all inputs
- Return consistent error format:
  ```typescript
  { error: string, details?: string }
  ```

## Testing Strategy

### Unit Tests
All calculation logic is unit tested:
```bash
npm test -- feasibility.test.ts
```

**What to test:**
- ✅ Pure calculation functions
- ✅ Constraint generation logic
- ✅ Edge cases (zero lot area, missing data)
- ✅ Integration scenarios

**What NOT to test:**
- ❌ UI components (for MVP)
- ❌ API routes (rely on manual testing)
- ❌ External libraries (Turf, Leaflet)

### Manual Testing Checklist

Before committing features:
- [ ] Search by address works
- [ ] Search by parcel ID works
- [ ] Map loads with all layers
- [ ] Selected parcel highlights correctly
- [ ] Feasibility analysis shows correct score
- [ ] Calculations are accurate
- [ ] Mobile responsive
- [ ] No console errors

## Adding New Features

### Adding a Zoning District

1. **Update jurisdiction config** (`lib/config/jurisdictions.ts`):
   ```typescript
   'R4': {
     code: 'R4',
     name: 'High-Density Residential',
     multifamily_allowed: true,
     min_lot_area_sqft: 15000,
     max_far: 3.0,
     // ... other params
   }
   ```

2. **Add to zoning GeoJSON** (`data/kingston-ny/zoning/zoning.geojson`)

3. **Update map colors** (if desired) in `components/ParcelMap.tsx`

### Adding a Constraint Type

1. **Define new constraint logic** in `lib/calculations/feasibility.ts`:
   ```typescript
   // Example: Slope constraint
   if (slopePercent > 15) {
     constraints.push({
       type: 'WARNING',
       message: 'Steep slope may increase construction costs',
       impact: 'Consider grading analysis and retaining walls'
     });
   }
   ```

2. **Add tests** in `__tests__/feasibility.test.ts`

3. **Update documentation**

### Adding a New Jurisdiction

See "Adding a New Jurisdiction" section in main README.md

## Debugging

### Common Issues

**Map not loading:**
- Check browser console for errors
- Ensure GeoJSON files exist in `data/` directory
- Verify coordinate format is WGS84 (EPSG:4326)

**API returning 500:**
- Check server console for stack traces
- Verify GeoJSON files are valid JSON
- Check file paths in jurisdiction config

**Tests failing:**
- Run `npm test -- --verbose` for details
- Check mock data matches expected schema
- Verify TypeScript types are correct

### Development Tools

**Useful VS Code tasks:**
```bash
# Run dev server
npm run dev

# Run tests in watch mode
npm run test:watch

# Type check without building
npx tsc --noEmit

# Lint and fix
npm run lint -- --fix
```

**Inspect API responses:**
```bash
# Search parcels
curl "http://localhost:3000/api/parcels?jurisdiction=kingston-ny&query=Broadway&type=address"

# Analyze parcel
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"jurisdiction":"kingston-ny","parcel_id":"48.28-1-1","use_type":"multifamily"}'
```

## Data Management

### Updating GeoJSON Data

1. **Download from source** (see `data/kingston-ny/README.md`)

2. **Convert to GeoJSON** (if needed):
   ```bash
   ogr2ogr -f GeoJSON -t_srs EPSG:4326 output.geojson input.shp
   ```

3. **Validate GeoJSON**:
   - Use https://geojsonlint.com/
   - Or: `npx geojson-validation output.geojson`

4. **Update properties** to match schema:
   ```javascript
   // Parcels must have:
   {
     "parcel_id": "string",
     "address": "string",
     "lot_area_sqft": number,
     "zoning": "string"
   }
   ```

5. **Replace file** in appropriate directory

6. **Test** the application to ensure data loads

## Performance Optimization

### Current Performance Profile
- GeoJSON loading: ~100ms (local files)
- Feasibility calculation: <10ms
- Map render: ~500ms initial load
- Total time to result: <1s

### Optimization Opportunities (Future)
- [ ] Cache GeoJSON layers in memory
- [ ] Use PostGIS for large jurisdictions
- [ ] Implement spatial indexing
- [ ] Add service worker for offline use
- [ ] Lazy load map libraries

## Git Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- Feature branches: `feature/your-feature-name`

### Commit Messages
Follow conventional commits:
- `feat: Add parking constraint calculation`
- `fix: Correct FAR calculation for MU zones`
- `docs: Update setup instructions`
- `test: Add tests for floodplain logic`

### Pull Request Checklist
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] No console errors
- [ ] Code reviewed

## Deployment

### Environment Variables
None required for MVP (all data is local files)

### Build Verification
```bash
# Build production bundle
npm run build

# Test production build locally
npm start
```

### Deploy to Vercel
```bash
vercel --prod
```

## Troubleshooting Development Issues

### TypeScript Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Map Not Rendering
- Ensure `leaflet/dist/leaflet.css` is imported
- Check that map container has explicit height
- Verify GeoJSON coordinates are [longitude, latitude]

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Turf.js Documentation](https://turfjs.org/docs/)
- [GeoJSON Specification](https://geojson.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
