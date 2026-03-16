# Bacchus AI

Bacchus AI is a private household inventory and recommendation system for wine, spirits, liqueurs, aperitifs, bitters, syrups, and cocktail pantry items.

The near-term goal is simple:

- import the current cellar and bar inventory
- add bottles from phone photos
- expose inventory-aware wine pairing and cocktail suggestions in ChatGPT
- build toward an Apple-friendly mobile intake flow

## Workspace layout

- `apps/api`: starter HTTP API for intake, inventory, and recommendation routes
- `apps/chatgpt`: typed tool catalog for the future ChatGPT MCP connector
- `packages/domain`: shared schemas and recommendation helpers
- `packages/db`: Prisma schema for the inventory database
- `docs/wine-liquor-tracker-plan.md`: product and architecture plan

## Getting started

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Validate the Prisma schema with `npm run db:validate`.
4. Build the workspace with `npm run build`.
5. Start the API with `npm run dev:api`.

## Current status

This first scaffold includes:

- a shared wine and liquor inventory model
- starter recommendation heuristics for meal-to-wine and mood-to-cocktail prompts
- a Fastify API with inventory, intake, and recommendation endpoints
- a normalized Postgres schema ready for Prisma migrations

The next implementation step is connecting the API to a real database and replacing the demo inventory with persisted data.
