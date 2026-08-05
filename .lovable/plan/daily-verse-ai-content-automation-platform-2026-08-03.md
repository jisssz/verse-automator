# DAILY VERSE AI Content Automation Platform

## Goal

Build a portfolio-grade web app that replaces your manual Pinterest affiliate workflow with one dashboard: research trends, generate pins (image + copy + hashtags), queue them, store assets, and publish/schedule to Pinterest automatically.

## Why this stack

- TanStack Start + React: one codebase for dashboard + server automations.
- Lovable Cloud: database, auth, file storage, and built-in Lovable AI Gateway (no separate OpenAI billing setup needed).
- Google Drive + Sheets connector: archive daily folders and campaign spreadsheets.
- Pinterest API connector: publish and schedule pins.

## Phase 1: Project foundation & auth

- Enable Lovable Cloud (database + auth + storage).
- Replace the placeholder `src/routes/index.tsx` with a landing page + "Get started" CTA.
- Create an authenticated dashboard under `src/routes/_authenticated/dashboard.tsx`.
- Add Google OAuth sign-in.

## Phase 2: Data model

Create Lovable Cloud migrations for:

```text
campaigns
  id, name, niche, status, scheduled_at, created_at, owner_id

campaign_products
  id, campaign_id, product_name, source_url, trend_note, position

generated_content
  id, product_id, pinterest_title, description, hashtags, image_prompt, image_url, status

published_pins
  id, product_id, pinterest_pin_id, pin_url, published_at, status
```

RLS: users see only their own rows.

## Phase 3: Trend ingestion (replace Grok manual copy-paste)

- Dashboard form: paste 15 product/topic ideas (name + source link + optional trend note).
- Server function `createCampaign`: batch-inserts the campaign + products.
- Future: add an `api/public/cron/grok-scrape` route to fetch trending topics via browser automation (Playwright) when Grok exposes a public page or API.

## Phase 4: AI content generation

- `createServerFn` `generateContentForProduct`: calls Lovable AI Gateway with a structured prompt to return:
  - Pinterest title
  - Description
  - Hashtags
  - Image prompt
- Store output in `generated_content`.
- UI: campaign detail page with cards, regenerate button, and edit fields.

## Phase 5: AI image generation

- Server route `POST /api/generate-image`: streams from Lovable AI Gateway image endpoint.
- Combine your DAILY VERSE brand prompt (forest aesthetic, typography, infographic rules) with today's product name.
- Save generated image to Lovable Cloud storage and link it in `generated_content.image_url`.

## Phase 6: Export & archive

- Google Drive connector: create daily folder and upload:
  - `{Product}.png`
  - `{Product}.txt` (title + description + hashtags)
  - `{Product} Prompt.txt`
- Google Sheets connector: append one row per product with campaign metadata and links.

## Phase 7: Pinterest auto-post & schedule

- Pinterest connector: server function `publishToPinterest` uploads image + title + description + affiliate link + hashtags.
- Store `published_pins` record with `pinterest_pin_id` and `pin_url`.
- Schedule: a cron endpoint `/api/public/cron/publish-queue` runs every morning and publishes the next day's approved campaign.

## Phase 8: Review & queue UX

- Dashboard queue: approve/reject each generated product.
- Campaign calendar: see scheduled posts by day.
- One-click "Run today's campaign" for manual approval.

## First build milestone

Deliver Phases 1–4 first: a working dashboard where you can create a campaign, paste 15 products, and get AI-generated titles, descriptions, hashtags, and image prompts stored in your database.

## What you need to set up

- Lovable Cloud (enabled by the build).
- Lovable AI Gateway API key (auto-generated).
- Google Drive + Sheets connector link.
- Pinterest connector link.
- Your DAILY VERSE brand prompt and affiliate link template.

## Risks / notes

- Pinterest API requires a business account and claim approval for some features; we will surface clear errors.
- Full "set and forget" scheduling needs a public cron route; we will secure it with a secret header.
- Manual review step is intentionally kept in the UI so generated content never auto-posts without approval.
