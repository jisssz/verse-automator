# Daily Verse Automator

Yes, you can automate 90–95% of your DAILY VERSE workflow. The only thing that may still need occasional human review is checking that generated images and text look good before publishing. Everything else can be automated.

Since you’re a 3rd-year CSE student, I wouldn’t jump straight into complex AI agents. Build it step by step.

Phase 1 (1–2 weeks): Learn one automation tool

Use n8n.

Why n8n?

Free and open-source.

Visual drag-and-drop workflow builder.

Doesn’t require heavy coding.

Integrates with OpenAI, Google Sheets, Drive, Gmail, APIs, etc.

Widely used in industry.

Learn:

Nodes

Webhooks

HTTP Requests

Variables

Loops

That’s enough to start.




⸻




Phase 2: Move ChatGPT into an API

Instead of manually opening ChatGPT every day, your automation calls the OpenAI API.

Example:

Topic:

Laneige Lip Sleeping Mask



↓



OpenAI API



↓



Returns:

• Pinterest title

• Description

• Hashtags

• Image prompt

• YouTube title

No copy-pasting.




⸻




Phase 3: Automate Trend Collection

Instead of manually copying from GrowK AI, use one of these:

If GrowK AI has an API, connect it.

If it doesn’t, use a browser automation tool like Playwright to log in and extract the daily topics.

Or use other trend sources with APIs.

The automation stores the 15 topics automatically.




⸻




Phase 4: Image Generation

The automation sends your stored DAILY VERSE prompt (branding, typography, forest aesthetic, infographic rules, etc.) plus today’s product name to the image generation API.

Example:

Today's product



↓



OpenAI Image API



↓



Pinterest image generated

No manual prompting.




⸻




Phase 5: Store Everything

Automatically save:

Google Drive



or



Dropbox



or



Supabase

Folder example:

August 2



Laneige.png

Laneige.txt

Laneige Prompt.txt




⸻




Phase 6: Auto Post

Connect Pinterest.

The workflow uploads:

Image

Title

Description

Affiliate link

and schedules it automatically.




⸻




Your Learning Roadmap

Week 1

Learn n8n basics.

Week 2

Learn APIs (GET, POST, authentication).

Week 3

Learn the OpenAI API.

Week 4

Build your first workflow:

Read one topic from Google Sheets.

Generate a title and description.

Save the output.

Week 5

Add image generation.

Week 6

Add automatic posting.




⸻




Can ChatGPT alone do everything?

No.

ChatGPT is the “brain.” It generates text, prompts, and images, but it doesn’t stay running in the background orchestrating all your daily tasks by itself.

You’ll need an automation platform (like n8n) to:

Run every morning.

Call the OpenAI API.

Save files.

Connect to Pinterest and other services.

Think of it like this:

n8n

        ↓

Runs every morning

        ↓

Calls OpenAI

        ↓

OpenAI thinks

        ↓

Returns content

        ↓

n8n uploads and schedules everything




⸻




If I were in your position

I would learn these in this exact order:

✅ n8n

✅ APIs (HTTP requests)

✅ OpenAI API

✅ Browser automation (Playwright)

✅ Git & GitHub

✅ Docker (later, for deploying your automation)




⸻




I think this would fit your goals very well

Since you’re already studying CSE and building DAILY VERSE, I’d actually treat this as a portfolio project rather than just an automation.

Call it something like:

AI Content Automation Platform for Affiliate Marketing

It combines AI, APIs, automation, browser scripting, cloud services, and software engineering. That kind of project is much more impressive to recruiters than another CRUD web app because it demonstrates practical automation skills and can even become a real business asset.

It also aligns well with your interests in product management and automation.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/934cd891-44ab-496c-9f6a-503e1b07900c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
