# DailyVerse AI — Automated Pinterest Content & Marketing Platform

DailyVerse AI is an enterprise-grade, end-to-end content automation platform built with **TanStack Start**, **React 19**, **TailwindCSS**, **Supabase**, **OpenAI**, **Google Sheets API**, **Pinterest API v5**, and **n8n Webhook Integration**.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Key Features](#key-features)
3. [Environment Variable Guide](#environment-variable-guide)
4. [Deployment Guide](#deployment-guide)
5. [REST & n8n API Documentation](#rest--n8n-api-documentation)
6. [Known Limitations](#known-limitations)
7. [Future Improvements](#future-improvements)

---

## Architecture Overview

DailyVerse AI follows a full-stack, serverless-first architecture optimized for Cloudflare Workers, Vercel, or Node.js runtimes.

```
                  ┌────────────────────────┐
                  │   DailyVerse AI Web    │
                  │   (TanStack Start)     │
                  └───────────┬────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Supabase   │      │    OpenAI    │      │  Pinterest   │
│ (PostgreSQL) │      │  (GPT & Image│      │   REST API   │
│ + Realtime   │      │  Generation) │      │      v5      │
└──────────────┘      └──────────────┘      └──────────────┘
       ▲                      ▲                      ▲
       └──────────────────────┼──────────────────────┘
                              │
                   ┌────────────────────┐
                   │  n8n Webhooks API  │
                   └────────────────────┘
```

### Technology Stack

- **Framework:** TanStack Start (SSR, Server Functions, React 19)
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Realtime Engine)
- **AI Engine:** OpenAI API (`gpt-4o-mini`, DALL·E 3 / GPT Image Gen)
- **External Integrations:** Google Sheets API v4, Pinterest REST API v5
- **Automation:** Dedicated n8n Webhook REST Endpoints (`/api/n8n/*`)

---

## Key Features

### 1. Product Pipeline & AI Generation

- Multi-channel product import (AI Trends Discovery, Manual Input, Google Sheets Sync).
- Bulk AI Copy Generation (Headlines, Body Copy, Pinterest Titles, Pin Descriptions, Affiliate Links).
- AI Image Prompt & Visual Asset Generation.
- Optimistic UI updates with live progress bars.

### 2. Pinterest Publishing System

- Direct pin publishing & scheduling (`Publish Now`, `Schedule Pin`, `Retry Failed`).
- Queue, Published History, and Failed Pin management views (`/pins`).
- Server-side Pinterest API secrets isolation.

### 3. Google Sheets Bidirectional Sync

- Sync product records from Google Sheets.
- Export full campaign dataset, AI-generated copy, or image prompts to Google Sheets.

### 4. n8n Automation Engine

- REST Webhooks: `POST /api/n8n/generate-content`, `POST /api/n8n/generate-image`, `POST /api/n8n/publish-pin`, `POST /api/n8n/import-products`, `POST /api/n8n/retry-workflow`, `GET /api/n8n/logs`, `POST /api/n8n/test`.
- Secure API key authorization (`x-api-key` header).

### 5. Realtime Analytics Dashboard

- Live KPI cards: Campaigns, Products, Generated, Published, Errors, Success Rate %.
- Interactive Recharts breakdown.
- Realtime Supabase change notifications.

---

## Environment Variable Guide

Add the following environment variables to `.env.local` or host settings:

```env
# Supabase Configuration
VITE_SUPABASE_URL="https://your-supabase-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# OpenAI AI Engine
OPENAI_API_KEY="sk-..."

# Google Sheets Integration
GOOGLE_SHEETS_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_SHEETS_SPREADSHEET_ID="your-spreadsheet-id"

# Pinterest API v5 Integration
PINTEREST_ACCESS_TOKEN="pina_..."
PINTEREST_BOARD_ID="123456789"
PINTEREST_SANDBOX_MODE="true" # Set to 'false' for live production pins

# n8n Automation Engine
N8N_API_KEY="your-secure-n8n-api-key"
```

---

## Deployment Guide

### Cloudflare Pages / Workers Deployment

DailyVerse AI is pre-configured with Nitro for Cloudflare Workers / Pages deployment.

1. Build the application bundle:

   ```bash
   npm run build
   ```

2. Deploy using Wrangler:
   ```bash
   npx wrangler deploy
   ```

### Node.js / Server Deployment

```bash
npm run build
node .output/server/index.mjs
```

---

## REST & n8n API Documentation

All n8n webhooks require `x-api-key` or `Authorization: Bearer <key>` header authorization.

### Endpoints Reference

#### `POST /api/n8n/generate-content`

- **Body:** `{ "productName": "Stanley Tumbler 40oz", "niche": "kitchen", "trendNote": "Viral trend" }`
- **Response:** `{ "success": true, "headline": "...", "description": "...", "pinTitle": "...", "pinDescription": "...", "affiliateLink": "..." }`

#### `POST /api/n8n/generate-image`

- **Body:** `{ "productName": "Stanley Tumbler 40oz", "niche": "kitchen", "headline": "Viral Hydration" }`
- **Response:** `{ "success": true, "imagePrompt": "..." }`

#### `POST /api/n8n/publish-pin`

- **Body:** `{ "title": "Viral Tumbler", "description": "Best tumbler for summer", "imageUrl": "https://...", "boardId": "123" }`
- **Response:** `{ "success": true, "pinId": "...", "pinUrl": "...", "publishedAt": "..." }`

#### `POST /api/n8n/import-products`

- **Body:** `{ "campaignId": "uuid", "products": [{ "productName": "Stanley 40oz" }] }`
- **Response:** `{ "success": true, "count": 1, "insertedProducts": [...] }`

#### `POST /api/n8n/retry-workflow`

- **Body:** `{ "productId": "uuid", "workflowStep": "content" }`
- **Response:** `{ "success": true, "message": "Successfully retried 'content' workflow" }`

---

## Known Limitations

1. **Pinterest Sandbox Mode:** In sandbox mode, pin links require an approved Pinterest developer app account for live external link redirection.
2. **Google Sheets Auth Token Expiry:** JWT assertion tokens expire after 1 hour and are automatically refreshed by the server caching mechanism.
3. **Realtime Channels:** Browser tabs subscribe to Supabase Postgres changes; standard browser websocket connection limits apply.

---

## Future Improvements

1. Multi-platform social publishing (Instagram Reels, TikTok Shop, Amazon Influencer Storefront).
2. Advanced AI Image Inpainting & Brand Watermarking.
3. Automated CRON pin scheduling workers.
