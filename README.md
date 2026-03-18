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
- `packages/db`: SQLite schema bootstrap and database helpers
- `docs/wine-liquor-tracker-plan.md`: product and architecture plan

## Getting started

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Initialize the SQLite database with `npm run db:init`.
4. Build the workspace with `npm run build`.
5. Start the API with `npm run dev:api`.

Optional image extraction configuration:

- set `OPENAI_API_KEY` to enable OpenAI-powered bottle extraction from image URLs
- override `OPENAI_VISION_MODEL` if you want to swap the default multimodal model

## Current status

This first scaffold includes:

- a shared wine and liquor inventory model
- starter recommendation heuristics for meal-to-wine and mood-to-cocktail prompts
- a Fastify API with inventory, intake, recommendation, and CellarTracker import endpoints
- a repository layer backed by a local SQLite database, matching the lightweight approach used in Epicurus AI
- automatic first-run schema initialization and demo inventory seeding, including cellar bin support
- inventory write/update/event endpoints for bottle lifecycle tracking
- persisted photo-intake jobs with reprocess, review, edit, and approve flow
- multi-bottle intake candidates with per-bottle approve or reject decisions
- OpenAI Responses API wiring for image-based extraction when `OPENAI_API_KEY` is set, with text heuristics as a fallback

The next implementation step is improving image upload/storage and then mapping CellarTracker exports more completely into the SQLite model.
