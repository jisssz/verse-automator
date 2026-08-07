import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  generateImagePrompt as generateOpenAiImagePrompt,
  generatePinCopy as generateOpenAiPinCopy,
  generateTrendIdeas as generateOpenAiTrendIdeas,
  generateProductResearch as generateOpenAiProductResearch,
  generateSeoKeywords as generateOpenAiSeoKeywords,
  generateHashtags as generateOpenAiHashtags,
  generateBlogOutline as generateOpenAiBlogOutline,
  generateVideoScript as generateOpenAiVideoScript,
  generateProductSummary as generateOpenAiProductSummary,
  generateComparisonTable as generateOpenAiComparisonTable,
  generateReview as generateOpenAiReview,
  generateAndStoreImage as generateOpenAiAndStoreImage,
} from "./openai.server";
import { generateDailyVerseContent } from "./daily-verse-engine";

const GenerateContentInput = z.object({
  campaignId: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string().min(1),
  trendNote: z.string().optional(),
  niche: z.string().optional(),
  affiliateLinkTemplate: z.string().optional(),
});

const GenerateImagePromptInput = z.object({
  productName: z.string().min(1),
  trendNote: z.string().optional(),
  niche: z.string().optional(),
  headline: z.string().optional(),
});

const GenerateDailyVerseContentInput = z.object({
  productName: z.string().min(1),
  productCategory: z.string().min(1),
});

const SaveGeneratedContentInput = z.object({
  productId: z.string().uuid(),
  headline: z.string().min(1),
  description: z.string().min(1),
  pinTitle: z.string().min(1),
  pinDescription: z.string().min(1),
  affiliateLink: z.string().optional(),
  imagePrompt: z.string().optional(),
  imageUrl: z.string().optional(),
});

const ProductResearchInput = z.object({
  productName: z.string().min(1),
  niche: z.string().optional(),
  trendNote: z.string().optional(),
});

const SeoKeywordsInput = z.object({
  productName: z.string().min(1),
  niche: z.string().optional(),
});

const HashtagsInput = z.object({
  productName: z.string().min(1),
  niche: z.string().optional(),
  platform: z.enum(["pinterest", "instagram", "tiktok"]).optional(),
});

const BlogOutlineInput = z.object({
  productName: z.string().min(1),
  niche: z.string().optional(),
  trendNote: z.string().optional(),
  targetKeyword: z.string().optional(),
});

const VideoScriptInput = z.object({
  productName: z.string().min(1),
  niche: z.string().optional(),
  trendNote: z.string().optional(),
  durationSeconds: z.number().min(10).max(300).optional(),
});

const ProductSummaryInput = z.object({
  productName: z.string().min(1),
  niche: z.string().optional(),
  keyBenefits: z.array(z.string()).optional(),
});

const ComparisonTableInput = z.object({
  productName: z.string().min(1),
  competitorName: z.string().optional(),
  niche: z.string().optional(),
});

const ReviewInput = z.object({
  productName: z.string().min(1),
  niche: z.string().optional(),
  trendNote: z.string().optional(),
  affiliateLink: z.string().optional(),
});

const GenerateAndStoreImageInput = z.object({
  prompt: z.string().min(1),
  productId: z.string().uuid(),
  size: z.enum(["1024x1024", "1024x1792", "1792x1024"]).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING SERVER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const generatePinContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateContentInput.parse(input))
  .handler(async ({ data }) => {
    return generateOpenAiPinCopy({
      productName: data.productName,
      trendNote: data.trendNote,
      niche: data.niche,
      affiliateLinkTemplate: data.affiliateLinkTemplate,
      safetyIdentifier: data.campaignId,
    });
  });

export const generateImagePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateImagePromptInput.parse(input))
  .handler(async ({ data }) => {
    return generateOpenAiImagePrompt({
      productName: data.productName,
      trendNote: data.trendNote,
      niche: data.niche,
      headline: data.headline,
      safetyIdentifier: data.productName,
    });
  });

export const saveGeneratedContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SaveGeneratedContentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Try to find in campaign_products
    const { data: campaignProd } = await supabase
      .from("campaign_products")
      .select("id, campaign_id, campaigns!inner(owner_id)")
      .eq("id", data.productId)
      .eq("campaigns.owner_id", userId)
      .maybeSingle();

    let isCampaignProduct = false;
    if (campaignProd) {
      isCampaignProduct = true;
    } else {
      // 2. Try to find in standalone products
      const { data: standaloneProd } = await supabase
        .from("products")
        .select("id")
        .eq("id", data.productId)
        .eq("owner_id", userId)
        .maybeSingle();

      if (!standaloneProd) {
        throw new Error("Product not found or access denied");
      }
    }

    const { error } = await supabase.from("generated_content").upsert(
      {
        campaign_product_id: isCampaignProduct ? data.productId : null,
        product_id: isCampaignProduct ? null : data.productId,
        headline: data.headline,
        description: data.description,
        pinterest_title: data.pinTitle,
        pin_description: data.pinDescription,
        affiliate_link: data.affiliateLink || null,
        image_prompt: data.imagePrompt || null,
        image_url: data.imageUrl || null,
      },
      { onConflict: isCampaignProduct ? "campaign_product_id" : "product_id" },
    );

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const generateTrendIdeas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        niche: z.string().min(1),
        count: z.number().min(1).max(30).default(15),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return generateOpenAiTrendIdeas({
      niche: data.niche,
      count: data.count,
      safetyIdentifier: data.niche,
    });
  });

export const generateDailyVerseEngine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateDailyVerseContentInput.parse(input))
  .handler(async ({ data }) => {
    return generateDailyVerseContent({
      productName: data.productName,
      productCategory: data.productCategory,
    });
  });

// ─────────────────────────────────────────────────────────────────────────────
// NEW SERVER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deep product research — target audience, key benefits, competitive advantage,
 * pricing insight, market trend, content angles.
 */
export const generateProductResearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProductResearchInput.parse(input))
  .handler(async ({ data }) => {
    return generateOpenAiProductResearch({
      productName: data.productName,
      niche: data.niche,
      trendNote: data.trendNote,
      safetyIdentifier: data.productName,
    });
  });

/**
 * Standalone SEO keyword generation — primary, secondary, long-tail, search intent.
 */
export const generateSeoKeywords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SeoKeywordsInput.parse(input))
  .handler(async ({ data }) => {
    return generateOpenAiSeoKeywords({
      productName: data.productName,
      niche: data.niche,
      safetyIdentifier: data.productName,
    });
  });

/**
 * Standalone hashtag generator — niche, broad, and combined lists.
 */
export const generateHashtags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => HashtagsInput.parse(input))
  .handler(async ({ data }) => {
    return generateOpenAiHashtags({
      productName: data.productName,
      niche: data.niche,
      platform: data.platform,
      safetyIdentifier: data.productName,
    });
  });

/**
 * Full blog post outline — H1/H2/H3 structure with key points.
 */
export const generateBlogOutline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BlogOutlineInput.parse(input))
  .handler(async ({ data }) => {
    return generateOpenAiBlogOutline({
      productName: data.productName,
      niche: data.niche,
      trendNote: data.trendNote,
      targetKeyword: data.targetKeyword,
      safetyIdentifier: data.productName,
    });
  });

/**
 * Short-form video script for Reels/TikTok/Pinterest Video.
 */
export const generateVideoScript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => VideoScriptInput.parse(input))
  .handler(async ({ data }) => {
    return generateOpenAiVideoScript({
      productName: data.productName,
      niche: data.niche,
      trendNote: data.trendNote,
      durationSeconds: data.durationSeconds,
      safetyIdentifier: data.productName,
    });
  });

/**
 * Concise product summary — one-liner, paragraph summary, bullet points.
 */
export const generateProductSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProductSummaryInput.parse(input))
  .handler(async ({ data }) => {
    return generateOpenAiProductSummary({
      productName: data.productName,
      niche: data.niche,
      keyBenefits: data.keyBenefits,
      safetyIdentifier: data.productName,
    });
  });

/**
 * Structured comparison table — product vs competitor feature comparison.
 */
export const generateComparisonTable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ComparisonTableInput.parse(input))
  .handler(async ({ data }) => {
    return generateOpenAiComparisonTable({
      productName: data.productName,
      competitorName: data.competitorName,
      niche: data.niche,
      safetyIdentifier: data.productName,
    });
  });

/**
 * Editorial product review — rating, pros, cons, body copy, recommendation.
 */
export const generateReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReviewInput.parse(input))
  .handler(async ({ data }) => {
    return generateOpenAiReview({
      productName: data.productName,
      niche: data.niche,
      trendNote: data.trendNote,
      affiliateLink: data.affiliateLink,
      safetyIdentifier: data.productName,
    });
  });

/**
 * Generate image via OpenAI DALL-E and store in Supabase Storage.
 * Returns imageUrl (public URL or data URL fallback), storagePath, model, dimensions.
 */
export const generateAndStoreImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateAndStoreImageInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify product ownership before generating
    const { data: campaignProd } = await supabase
      .from("campaign_products")
      .select("id, campaign_id, campaigns!inner(owner_id)")
      .eq("id", data.productId)
      .eq("campaigns.owner_id", userId)
      .maybeSingle();

    if (!campaignProd) {
      const { data: standaloneProd } = await supabase
        .from("products")
        .select("id")
        .eq("id", data.productId)
        .eq("owner_id", userId)
        .maybeSingle();

      if (!standaloneProd) {
        throw new Error("Product not found or access denied");
      }
    }

    const result = await generateOpenAiAndStoreImage({
      prompt: data.prompt,
      productId: data.productId,
      size: data.size,
    });

    // Write row to generated_images table
    const { error: insertError } = await supabase.from("generated_images").insert({
      product_id: data.productId,
      image_prompt: data.prompt,
      image_url: result.imageUrl,
      image_storage_path: result.storagePath,
      model_name: result.model,
      width: result.width,
      height: result.height,
      status: "completed",
      is_primary: true,
      prompt_payload: { prompt: data.prompt, size: data.size ?? "1024x1792" },
      response_payload: {
        imageUrl: result.imageUrl,
        storagePath: result.storagePath,
        model: result.model,
      },
    });

    if (insertError) {
      // Non-fatal — still return result
      console.error(
        "[generateAndStoreImage] Failed to insert generated_images row:",
        insertError.message,
      );
    }

    return result;
  });

export const listGeneratedImagesServer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        productId: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let query = supabase
      .from("generated_images")
      .select("*, products!inner(owner_id)")
      .eq("products.owner_id", userId)
      .order("created_at", { ascending: false });

    if (data.productId) {
      query = query.eq("product_id", data.productId);
    }

    const { data: images, error } = await query;
    if (error) throw new Error(error.message);
    return images || [];
  });
