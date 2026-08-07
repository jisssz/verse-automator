import { z } from "zod";

const OPENAI_API_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_TEXT_MODEL = "gpt-4o-mini";
const DEFAULT_IMAGE_MODEL = "dall-e-3";

const PinContentResponseSchema = z.object({
  headline: z.string().min(1),
  description: z.string().min(1),
  pinTitle: z.string().min(1),
  pinDescription: z.string().min(1),
  affiliateLink: z.string(),
});

const ImagePromptResponseSchema = z.object({
  imagePrompt: z.string().min(1),
});

const TrendIdeaResponseSchema = z.object({
  ideas: z.array(
    z.object({
      productName: z.string().min(1),
      trendNote: z.string(),
    }),
  ),
});

const ProductResearchResponseSchema = z.object({
  targetAudience: z.string().min(1),
  keyBenefits: z.array(z.string().min(1)),
  competitiveAdvantage: z.string().min(1),
  pricingInsight: z.string().min(1),
  marketTrend: z.string().min(1),
  contentAngles: z.array(z.string().min(1)),
});

const SeoKeywordsResponseSchema = z.object({
  primary: z.string().min(1),
  secondary: z.array(z.string().min(1)),
  longtail: z.array(z.string().min(1)),
  searchIntent: z.string().min(1),
});

const HashtagsResponseSchema = z.object({
  hashtags: z.array(z.string().min(1)),
  niche: z.array(z.string().min(1)),
  broad: z.array(z.string().min(1)),
});

const BlogOutlineResponseSchema = z.object({
  title: z.string().min(1),
  intro: z.string().min(1),
  sections: z.array(
    z.object({
      heading: z.string().min(1),
      subheadings: z.array(z.string().min(1)),
      keyPoints: z.array(z.string().min(1)),
    }),
  ),
  conclusion: z.string().min(1),
  cta: z.string().min(1),
});

const VideoScriptResponseSchema = z.object({
  hook: z.string().min(1),
  problem: z.string().min(1),
  solution: z.string().min(1),
  proof: z.string().min(1),
  cta: z.string().min(1),
  hashtags: z.array(z.string().min(1)),
  estimatedSeconds: z.number(),
});

const ProductSummaryResponseSchema = z.object({
  oneLiner: z.string().min(1),
  shortSummary: z.string().min(1),
  bulletPoints: z.array(z.string().min(1)),
});

const ComparisonTableResponseSchema = z.object({
  headers: z.array(z.string().min(1)),
  rows: z.array(
    z.object({
      feature: z.string().min(1),
      product: z.string().min(1),
      competitor: z.string().min(1),
    }),
  ),
  verdict: z.string().min(1),
});

const ReviewResponseSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1),
  pros: z.array(z.string().min(1)),
  cons: z.array(z.string().min(1)),
  body: z.string().min(1),
  recommendation: z.string().min(1),
});

type OpenAiResponseError = {
  code?: string;
  message?: string;
};

type OpenAiResponsesOutputText = {
  type: "output_text";
  text: string;
};

type OpenAiResponsesMessage = {
  type: "message";
  content?: Array<OpenAiResponsesOutputText | { type: string; text?: string }>;
};

type OpenAiResponsesResult = {
  status?: string;
  error?: OpenAiResponseError | null;
  output_text?: string | null;
  output?: Array<OpenAiResponsesMessage | { type: string; content?: unknown }>;
  incomplete_details?: { reason?: string } | null;
};

class OpenAiServiceError extends Error {
  statusCode?: number | undefined;

  constructor(message: string, statusCode?: number | undefined) {
    super(message);
    this.name = "OpenAiServiceError";
    this.statusCode = statusCode;
  }
}

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown) {
  if (error instanceof OpenAiServiceError) {
    return error.statusCode ? RETRYABLE_STATUS_CODES.has(error.statusCode) : false;
  }

  return error instanceof TypeError;
}

async function runWithRetries<T>(operation: () => Promise<T>, attempts = 3) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isRetryableError(error)) {
        break;
      }
      await sleep(300 * attempt);
    }
  }

  throw lastError;
}

function getOpenAiApiKey() {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    throw new OpenAiServiceError("Missing OPENAI_API_KEY");
  }
  return apiKey;
}

function buildOpenAiHeaders() {
  return {
    Authorization: `Bearer ${getOpenAiApiKey()}`,
    "Content-Type": "application/json",
  };
}

async function readResponseError(response: Response) {
  const fallbackMessage = `OpenAI request failed with status ${response.status}`;

  try {
    const payload = (await response.json()) as { error?: OpenAiResponseError };
    const message = payload.error?.message?.trim();
    const code = payload.error?.code?.trim();
    return code ? `${code}: ${message || fallbackMessage}` : message || fallbackMessage;
  } catch {
    try {
      const text = await response.text();
      return text.trim() || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }
}

async function openAiJsonRequest<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${OPENAI_API_BASE_URL}${path}`, {
    method: "POST",
    headers: buildOpenAiHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new OpenAiServiceError(await readResponseError(response), response.status);
  }

  return (await response.json()) as T;
}

function extractResponseText(response: OpenAiResponsesResult) {
  if (response.output_text?.trim()) {
    return response.output_text.trim();
  }

  const message = response.output?.find(
    (item): item is OpenAiResponsesMessage => item.type === "message",
  );
  const outputText = message?.content?.find(
    (item): item is OpenAiResponsesOutputText =>
      item.type === "output_text" && typeof item.text === "string",
  );

  return outputText?.text?.trim() || "";
}

export async function generateStructuredJson<TSchema extends z.ZodTypeAny>(options: {
  instructions: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
  validator: TSchema;
  model?: string | undefined;
  temperature?: number | undefined;
  maxOutputTokens?: number | undefined;
  safetyIdentifier?: string | undefined;
}) {
  const response = await openAiJsonRequest<OpenAiResponsesResult>("/responses", {
    model: options.model ?? DEFAULT_TEXT_MODEL,
    instructions: options.instructions,
    input: options.input,
    temperature: options.temperature ?? 0.7,
    max_output_tokens: options.maxOutputTokens ?? 300,
    ...(options.safetyIdentifier ? { safety_identifier: options.safetyIdentifier } : {}),
    tool_choice: "none",
    text: {
      format: {
        type: "json_schema",
        name: options.schemaName,
        schema: options.schema,
        strict: true,
      },
    },
  });

  if (response.error) {
    throw new OpenAiServiceError(response.error.message || "OpenAI returned an error");
  }

  if (response.status && response.status !== "completed") {
    const reason = response.incomplete_details?.reason;
    throw new OpenAiServiceError(
      reason ? `OpenAI response was not completed: ${reason}` : "OpenAI response was not completed",
    );
  }

  const text = extractResponseText(response);
  if (!text) {
    throw new OpenAiServiceError("OpenAI returned an empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new OpenAiServiceError(`OpenAI returned invalid JSON: ${text}`);
  }

  return options.validator.parse(parsed);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING GENERATION FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function generatePinCopy(options: {
  productName: string;
  trendNote?: string | undefined;
  niche?: string | undefined;
  affiliateLinkTemplate?: string | undefined;
  safetyIdentifier?: string | undefined;
}) {
  const affiliateLink = options.affiliateLinkTemplate
    ? options.affiliateLinkTemplate.replace(/\{\{product\}\}/g, options.productName)
    : "";

  try {
    const payload = await generateStructuredJson({
      instructions:
        "You write concise Pinterest affiliate marketing copy. Return only valid JSON that matches the schema.",
      input: `Product: ${options.productName}\nNiche: ${options.niche || "general"}\nTrend note: ${options.trendNote || "N/A"}\nAffiliate link: ${affiliateLink || "N/A"}\n\nCreate a catchy headline, a short body description, a Pinterest title, and a Pinterest description.`,
      schemaName: "pin_content",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          headline: { type: "string" },
          description: { type: "string" },
          pinTitle: { type: "string" },
          pinDescription: { type: "string" },
          affiliateLink: { type: "string" },
        },
        required: ["headline", "description", "pinTitle", "pinDescription", "affiliateLink"],
      },
      validator: PinContentResponseSchema,
      temperature: 0.7,
      maxOutputTokens: 300,
      ...(options.safetyIdentifier ? { safetyIdentifier: options.safetyIdentifier } : {}),
    });

    return {
      ...payload,
      affiliateLink,
    };
  } catch (err) {
    console.warn(
      "[TextProvider] OpenAI API unavailable or credit exhausted. Using luxury copy fallback:",
      err instanceof Error ? err.message : err,
    );

    return {
      headline: `Unveil Radiant Youth with ${options.productName}`,
      description: `Experience the transformative power of ${options.productName}. Formulated with ultra-hydrating botanicals and bio-active peptides to revive your natural glow.`,
      pinTitle: `${options.productName} — Luxury Skincare Essential`,
      pinDescription: `Unlock effortless radiance. Discover why beauty editors recommend ${options.productName} for your daily morning ritual.`,
      affiliateLink,
    };
  }
}

export async function generateImagePrompt(options: {
  productName: string;
  trendNote?: string | undefined;
  niche?: string | undefined;
  headline?: string | undefined;
  safetyIdentifier?: string | undefined;
}) {
  try {
    return await generateStructuredJson({
      instructions:
        "You write concise, vivid Pinterest image prompts. Return only valid JSON that matches the schema.",
      input: `Write a short image-generation prompt for a Pinterest pin about "${options.productName}".\nNiche: ${options.niche || "general"}\nTrend note: ${options.trendNote || "N/A"}\n${options.headline ? `Headline: ${options.headline}` : ""}\n\nThe image should be vertical, bright, aesthetic, and contain no text.`,
      schemaName: "image_prompt",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          imagePrompt: { type: "string" },
        },
        required: ["imagePrompt"],
      },
      validator: ImagePromptResponseSchema,
      temperature: 0.8,
      maxOutputTokens: 120,
      ...(options.safetyIdentifier ? { safetyIdentifier: options.safetyIdentifier } : {}),
    });
  } catch (err) {
    console.warn(
      "[PromptProvider] OpenAI API unavailable or credit exhausted. Using image prompt fallback:",
      err instanceof Error ? err.message : err,
    );

    return {
      imagePrompt: `A luxury glass bottle of ${options.productName} sitting on a polished white marble vanity, soft golden morning light, minimalist aesthetic, 8k resolution, editorial beauty photography, vertical composition.`,
    };
  }
}

export async function generateTrendIdeas(options: {
  niche: string;
  count: number;
  safetyIdentifier?: string | undefined;
}) {
  const response = await generateStructuredJson({
    instructions:
      "You research Pinterest-ready product ideas. Return only valid JSON that matches the schema.",
    input: `Niche: ${options.niche}\nGenerate ${options.count} concrete product ideas or topics that would perform well as Pinterest pins right now. Each idea should include a short trend note.`,
    schemaName: "trend_ideas",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        ideas: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              productName: { type: "string" },
              trendNote: { type: "string" },
            },
            required: ["productName", "trendNote"],
          },
        },
      },
      required: ["ideas"],
    },
    validator: TrendIdeaResponseSchema,
    temperature: 0.8,
    maxOutputTokens: 500,
    ...(options.safetyIdentifier ? { safetyIdentifier: options.safetyIdentifier } : {}),
  });

  return {
    ideas: response.ideas.filter(
      (idea: { productName: string; trendNote: string }) => idea.productName.trim().length > 0,
    ),
  };
}

export async function streamOpenAiImageGeneration(prompt: string) {
  const response = await runWithRetries(async () => {
    const nextResponse = await fetch(`${OPENAI_API_BASE_URL}/images/generations`, {
      method: "POST",
      headers: buildOpenAiHeaders(),
      body: JSON.stringify({
        model: DEFAULT_IMAGE_MODEL,
        prompt,
        n: 1,
        size: "1024x1792",
        quality: "standard",
        response_format: "b64_json",
      }),
    });

    if (!nextResponse.ok || !nextResponse.body) {
      throw new OpenAiServiceError(await readResponseError(nextResponse), nextResponse.status);
    }

    return nextResponse;
  });

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function generateImageFromPrompt(options: {
  prompt: string;
  size?: "1024x1024" | "1024x1792" | undefined;
  quality?: "standard" | "hd" | undefined;
  aspectRatio?: string | undefined;
}): Promise<string> {
  const size =
    options.size ||
    (options.aspectRatio === "2:3" || options.aspectRatio === "9:16" ? "1024x1792" : "1024x1024");
  const [width, height] = size.split("x").map(Number) as [number, number];

  // Try OpenAI if configured
  if (process.env["OPENAI_API_KEY"]) {
    try {
      const response = await openAiJsonRequest<{
        data?: Array<{ url?: string; b64_json?: string }>;
      }>("/images/generations", {
        model: DEFAULT_IMAGE_MODEL,
        prompt: options.prompt,
        n: 1,
        size,
        quality: options.quality || "standard",
        response_format: "url",
      });

      const url = response.data?.[0]?.url;
      if (url) return url;
    } catch (openAiErr) {
      console.warn(
        "[ImageProvider] OpenAI image generation unavailable or credit exhausted. Falling back to FLUX.1:",
        openAiErr instanceof Error ? openAiErr.message : openAiErr,
      );
    }
  }

  // FLUX.1 Free Production Provider Fallback
  const seed = Math.floor(Math.random() * 1000000);
  const encodedPrompt = encodeURIComponent(options.prompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW GENERATION FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deep product research: target audience, key benefits, competitive advantage,
 * pricing insight, market trend, and content angles.
 */
export async function generateProductResearch(options: {
  productName: string;
  niche?: string | undefined;
  trendNote?: string | undefined;
  safetyIdentifier?: string | undefined;
}) {
  return generateStructuredJson({
    instructions:
      "You are a product research analyst for affiliate marketers. Return only valid JSON matching the schema with actionable insights.",
    input: [
      `Product: ${options.productName}`,
      `Niche: ${options.niche || "general"}`,
      options.trendNote ? `Trend context: ${options.trendNote}` : "",
      "",
      "Provide: target audience description, top 5 key benefits, competitive advantage, pricing insight, current market trend, and 5 content angle ideas for Pinterest/social media.",
    ]
      .filter(Boolean)
      .join("\n"),
    schemaName: "product_research",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        targetAudience: { type: "string" },
        keyBenefits: { type: "array", items: { type: "string" } },
        competitiveAdvantage: { type: "string" },
        pricingInsight: { type: "string" },
        marketTrend: { type: "string" },
        contentAngles: { type: "array", items: { type: "string" } },
      },
      required: [
        "targetAudience",
        "keyBenefits",
        "competitiveAdvantage",
        "pricingInsight",
        "marketTrend",
        "contentAngles",
      ],
    },
    validator: ProductResearchResponseSchema,
    temperature: 0.6,
    maxOutputTokens: 600,
    ...(options.safetyIdentifier ? { safetyIdentifier: options.safetyIdentifier } : {}),
  });
}

/**
 * Standalone SEO keyword generation: primary keyword, secondary keywords,
 * long-tail phrases, and search intent classification.
 */
export async function generateSeoKeywords(options: {
  productName: string;
  niche?: string | undefined;
  safetyIdentifier?: string | undefined;
}) {
  return generateStructuredJson({
    instructions:
      "You are an SEO strategist for Pinterest and affiliate content. Return only valid JSON matching the schema.",
    input: `Product: ${options.productName}\nNiche: ${options.niche || "general"}\n\nGenerate: one primary keyword (high volume, competitive), 5 secondary keywords, 5 long-tail keyword phrases (low competition, high intent), and classify the search intent (informational/commercial/transactional).`,
    schemaName: "seo_keywords",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        primary: { type: "string" },
        secondary: { type: "array", items: { type: "string" } },
        longtail: { type: "array", items: { type: "string" } },
        searchIntent: { type: "string" },
      },
      required: ["primary", "secondary", "longtail", "searchIntent"],
    },
    validator: SeoKeywordsResponseSchema,
    temperature: 0.5,
    maxOutputTokens: 300,
    ...(options.safetyIdentifier ? { safetyIdentifier: options.safetyIdentifier } : {}),
  });
}

/**
 * Standalone hashtag generator: niche-specific, broad-reach, and trending hashtags.
 */
export async function generateHashtags(options: {
  productName: string;
  niche?: string | undefined;
  platform?: "pinterest" | "instagram" | "tiktok" | undefined;
  safetyIdentifier?: string | undefined;
}) {
  const platform = options.platform || "pinterest";
  return generateStructuredJson({
    instructions: `You generate ${platform} hashtags optimized for reach and niche discovery. Return only valid JSON matching the schema.`,
    input: `Product: ${options.productName}\nNiche: ${options.niche || "general"}\nPlatform: ${platform}\n\nGenerate: 10 hashtags total split into 5 niche-specific hashtags and 5 broad-reach hashtags.`,
    schemaName: "hashtags",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        hashtags: { type: "array", items: { type: "string" } },
        niche: { type: "array", items: { type: "string" } },
        broad: { type: "array", items: { type: "string" } },
      },
      required: ["hashtags", "niche", "broad"],
    },
    validator: HashtagsResponseSchema,
    temperature: 0.7,
    maxOutputTokens: 200,
    ...(options.safetyIdentifier ? { safetyIdentifier: options.safetyIdentifier } : {}),
  });
}

/**
 * Full blog outline: SEO-optimized H1/H2/H3 structure with key points per section.
 */
export async function generateBlogOutline(options: {
  productName: string;
  niche?: string | undefined;
  trendNote?: string | undefined;
  targetKeyword?: string | undefined;
  safetyIdentifier?: string | undefined;
}) {
  return generateStructuredJson({
    instructions:
      "You are a content strategist writing SEO blog outlines for affiliate product reviews. Return only valid JSON matching the schema.",
    input: [
      `Product: ${options.productName}`,
      `Niche: ${options.niche || "general"}`,
      options.trendNote ? `Trend: ${options.trendNote}` : "",
      options.targetKeyword ? `Target keyword: ${options.targetKeyword}` : "",
      "",
      "Create a complete blog post outline with: SEO-optimized title, compelling intro summary, 4-5 sections each with H2 heading, 2-3 H3 subheadings, and 3 key points per section, a conclusion summary, and a strong affiliate CTA.",
    ]
      .filter(Boolean)
      .join("\n"),
    schemaName: "blog_outline",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        intro: { type: "string" },
        sections: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              heading: { type: "string" },
              subheadings: { type: "array", items: { type: "string" } },
              keyPoints: { type: "array", items: { type: "string" } },
            },
            required: ["heading", "subheadings", "keyPoints"],
          },
        },
        conclusion: { type: "string" },
        cta: { type: "string" },
      },
      required: ["title", "intro", "sections", "conclusion", "cta"],
    },
    validator: BlogOutlineResponseSchema,
    temperature: 0.7,
    maxOutputTokens: 800,
    ...(options.safetyIdentifier ? { safetyIdentifier: options.safetyIdentifier } : {}),
  });
}

/**
 * Short-form video script for Reels/TikTok/Pinterest Video: hook, problem,
 * solution, proof, CTA, hashtags, estimated duration.
 */
export async function generateVideoScript(options: {
  productName: string;
  niche?: string | undefined;
  trendNote?: string | undefined;
  durationSeconds?: number | undefined;
  safetyIdentifier?: string | undefined;
}) {
  const duration = options.durationSeconds || 30;
  return generateStructuredJson({
    instructions:
      "You write high-converting short-form video scripts for Pinterest/TikTok affiliate content. Return only valid JSON matching the schema.",
    input: [
      `Product: ${options.productName}`,
      `Niche: ${options.niche || "general"}`,
      options.trendNote ? `Trend: ${options.trendNote}` : "",
      `Target duration: ${duration} seconds`,
      "",
      "Write a video script with: attention-grabbing hook (first 3 seconds), problem statement, product solution reveal, social proof or benefit, clear CTA, relevant hashtags, and estimated total seconds.",
    ]
      .filter(Boolean)
      .join("\n"),
    schemaName: "video_script",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        hook: { type: "string" },
        problem: { type: "string" },
        solution: { type: "string" },
        proof: { type: "string" },
        cta: { type: "string" },
        hashtags: { type: "array", items: { type: "string" } },
        estimatedSeconds: { type: "number" },
      },
      required: ["hook", "problem", "solution", "proof", "cta", "hashtags", "estimatedSeconds"],
    },
    validator: VideoScriptResponseSchema,
    temperature: 0.75,
    maxOutputTokens: 400,
    ...(options.safetyIdentifier ? { safetyIdentifier: options.safetyIdentifier } : {}),
  });
}

/**
 * Concise product summary: one-liner, 2-3 sentence summary, and bullet points.
 */
export async function generateProductSummary(options: {
  productName: string;
  niche?: string | undefined;
  keyBenefits?: string[] | undefined;
  safetyIdentifier?: string | undefined;
}) {
  return generateStructuredJson({
    instructions:
      "You write compelling, concise product summaries for affiliate marketers. Return only valid JSON matching the schema.",
    input: [
      `Product: ${options.productName}`,
      `Niche: ${options.niche || "general"}`,
      options.keyBenefits?.length ? `Known benefits: ${options.keyBenefits.join(", ")}` : "",
      "",
      "Generate: a punchy one-liner tagline, a 2-3 sentence product summary, and 5 bullet point highlights.",
    ]
      .filter(Boolean)
      .join("\n"),
    schemaName: "product_summary",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        oneLiner: { type: "string" },
        shortSummary: { type: "string" },
        bulletPoints: { type: "array", items: { type: "string" } },
      },
      required: ["oneLiner", "shortSummary", "bulletPoints"],
    },
    validator: ProductSummaryResponseSchema,
    temperature: 0.65,
    maxOutputTokens: 350,
    ...(options.safetyIdentifier ? { safetyIdentifier: options.safetyIdentifier } : {}),
  });
}

/**
 * Comparison table: structured feature comparison between the product and a generic competitor.
 */
export async function generateComparisonTable(options: {
  productName: string;
  competitorName?: string | undefined;
  niche?: string | undefined;
  safetyIdentifier?: string | undefined;
}) {
  const competitor = options.competitorName || "leading competitor";
  return generateStructuredJson({
    instructions:
      "You create structured product comparison tables for affiliate content. Return only valid JSON matching the schema.",
    input: `Product: ${options.productName}\nCompetitor: ${competitor}\nNiche: ${options.niche || "general"}\n\nCreate a comparison table with: column headers (Feature, ${options.productName}, ${competitor}), 6-8 comparison rows covering price, quality, features, ease of use, support, value, and a final verdict.`,
    schemaName: "comparison_table",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        headers: { type: "array", items: { type: "string" } },
        rows: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              feature: { type: "string" },
              product: { type: "string" },
              competitor: { type: "string" },
            },
            required: ["feature", "product", "competitor"],
          },
        },
        verdict: { type: "string" },
      },
      required: ["headers", "rows", "verdict"],
    },
    validator: ComparisonTableResponseSchema,
    temperature: 0.6,
    maxOutputTokens: 500,
    ...(options.safetyIdentifier ? { safetyIdentifier: options.safetyIdentifier } : {}),
  });
}

/**
 * Editorial product review: star rating, pros, cons, body copy, and recommendation.
 */
export async function generateReview(options: {
  productName: string;
  niche?: string | undefined;
  trendNote?: string | undefined;
  affiliateLink?: string | undefined;
  safetyIdentifier?: string | undefined;
}) {
  return generateStructuredJson({
    instructions:
      "You write honest, high-converting affiliate product reviews. Return only valid JSON matching the schema.",
    input: [
      `Product: ${options.productName}`,
      `Niche: ${options.niche || "general"}`,
      options.trendNote ? `Context: ${options.trendNote}` : "",
      "",
      "Write an editorial review with: star rating (1-5), review title, 4 pros, 2 cons, 3-4 paragraph review body, and a final recommendation with affiliate call to action.",
    ]
      .filter(Boolean)
      .join("\n"),
    schemaName: "product_review",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        rating: { type: "number" },
        title: { type: "string" },
        pros: { type: "array", items: { type: "string" } },
        cons: { type: "array", items: { type: "string" } },
        body: { type: "string" },
        recommendation: { type: "string" },
      },
      required: ["rating", "title", "pros", "cons", "body", "recommendation"],
    },
    validator: ReviewResponseSchema,
    temperature: 0.7,
    maxOutputTokens: 600,
    ...(options.safetyIdentifier ? { safetyIdentifier: options.safetyIdentifier } : {}),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE GENERATION — with Supabase Storage upload
// ─────────────────────────────────────────────────────────────────────────────

interface GenerateAndStoreImageResult {
  imageUrl: string;
  storagePath: string | null;
  model: string;
  promptUsed: string;
  width: number;
  height: number;
}

/**
 * Generates an image via OpenAI DALL-E, uploads to Supabase Storage bucket
 * `generated-images`, and returns a public URL + storage path.
 *
 * Falls back to returning the OpenAI URL directly if storage upload fails.
 */
async function generateFluxImageAndStore(options: {
  prompt: string;
  productId: string;
  width: number;
  height: number;
}): Promise<GenerateAndStoreImageResult> {
  const seed = Math.floor(Math.random() * 1000000);
  const encodedPrompt = encodeURIComponent(options.prompt);
  const fluxUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${options.width}&height=${options.height}&model=flux&nologo=true&seed=${seed}`;

  try {
    const res = await fetch(fluxUrl);
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const storagePath = `products/${options.productId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("pin-images")
        .upload(storagePath, buffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from("pin-images")
          .getPublicUrl(storagePath);

        return {
          imageUrl: urlData.publicUrl,
          storagePath,
          model: "flux-1-dev",
          promptUsed: options.prompt,
          width: options.width,
          height: options.height,
        };
      }
    }
  } catch (err) {
    console.warn("[FLUX Engine] Storage upload fallback:", err);
  }

  return {
    imageUrl: fluxUrl,
    storagePath: null,
    model: "flux-1-dev",
    promptUsed: options.prompt,
    width: options.width,
    height: options.height,
  };
}

export async function generateAndStoreImage(options: {
  prompt: string;
  productId: string;
  size?: "1024x1024" | "1024x1792" | "1792x1024" | undefined;
}): Promise<GenerateAndStoreImageResult> {
  const size = options.size ?? "1024x1792";
  const [width, height] = size.split("x").map(Number) as [number, number];

  // Try OpenAI if configured
  if (process.env["OPENAI_API_KEY"]) {
    try {
      const imageResponse = await runWithRetries(async () => {
        const res = await fetch(`${OPENAI_API_BASE_URL}/images/generations`, {
          method: "POST",
          headers: buildOpenAiHeaders(),
          body: JSON.stringify({
            model: DEFAULT_IMAGE_MODEL,
            prompt: options.prompt,
            n: 1,
            size,
            quality: "standard",
            response_format: "b64_json",
          }),
        });

        if (!res.ok) {
          throw new OpenAiServiceError(await readResponseError(res), res.status);
        }

        return res;
      });

      const imageData = (await imageResponse.json()) as {
        data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string }>;
      };

      const imageItem = imageData.data?.[0];
      if (imageItem?.b64_json) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const buffer = Buffer.from(imageItem.b64_json, "base64");
        const storagePath = `products/${options.productId}/${Date.now()}.png`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("pin-images")
          .upload(storagePath, buffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage
            .from("generated-images")
            .getPublicUrl(storagePath);

          return {
            imageUrl: urlData.publicUrl,
            storagePath,
            model: DEFAULT_IMAGE_MODEL,
            promptUsed: options.prompt,
            width,
            height,
          };
        }
      }
    } catch (err) {
      console.warn(
        "[ImageProvider] OpenAI image generation unavailable or credit exhausted. Executing FLUX.1 free provider:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // FLUX.1 Free Production Engine Execution
  return await generateFluxImageAndStore({
    prompt: options.prompt,
    productId: options.productId,
    width,
    height,
  });
}

export { OpenAiServiceError };
