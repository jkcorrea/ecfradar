# eCFRadar

Interactive explorer for the Code of Federal Regulations (CFR). View agencies, titles, and their relationships in an easy-to-navigate interface.

## Setup

```bash
cp .env.example .env # Add your API keys

# Install dependencies
bun install

# Prepare data (this will take a few minutes)
bun run bin/1-download.ts
bun run bin/2-extract.ts
bun run bin/3-summarize.ts --ai

# Start dev server
bun dev
```

## Development

The app is built with:

- React + TypeScript
- TanStack Router for routing
- Tailwind CSS for styling
- Jotai for state management

## Data Pipeline

The `/bin` directory contains scripts that:

1. Download CFR XML data from ecfr.gov
2. Extract title & chapter information
3. Generates summaries of the data
4. Prepare the data for deployment

## Deployment

This site is deployed on Cloudflare Pages. To deploy:

1. Install Wrangler:

```bash
bun add -g wrangler
```

2. Login to Cloudflare:

```bash
wrangler login
```

3. Deploy:

```bash
bun run deploy
```
