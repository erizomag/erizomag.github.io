.PHONY: help dev build test lint clean install validate-data

# Default target
help:
	@echo "Parcel Triage - Development Commands"
	@echo ""
	@echo "Available commands:"
	@echo "  make dev            - Start development server"
	@echo "  make build          - Build production bundle"
	@echo "  make test           - Run all tests"
	@echo "  make test-watch     - Run tests in watch mode"
	@echo "  make lint           - Run ESLint"
	@echo "  make lint-fix       - Fix linting issues"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make install        - Install dependencies"
	@echo "  make validate-data  - Validate GeoJSON data files"
	@echo ""

# Start development server
dev:
	npm run dev

# Build for production
build:
	npm run build

# Run tests
test:
	npm test

# Run tests in watch mode
test-watch:
	npm run test:watch

# Run linting
lint:
	npm run lint

# Fix linting issues
lint-fix:
	npm run lint -- --fix

# Clean build artifacts
clean:
	rm -rf .next
	rm -rf out
	rm -rf node_modules/.cache

# Install dependencies
install:
	npm install

# Validate GeoJSON data
validate-data:
	@echo "Validating GeoJSON data files..."
	@python3 scripts/validate-geojson.py data/kingston-ny
	@python3 scripts/validate-geojson.py data/albany-ny
	@echo "✓ All GeoJSON files valid"
