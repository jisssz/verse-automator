import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

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

export const generatePinContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateContentInput.parse(input))
  .handler(async ({ data }) => {
    const lovableApiKey = process.env["LOVABLE_API_KEY"];
    if (!lovableApiKey) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(lovableApiKey);
    const model = gateway("google/gemini-3.6-flash");

    const affiliateLink = data.affiliateLinkTemplate
      ? data.affiliateLinkTemplate.replace(/\{\{product\}\}/g, data.productName)
      : "";

    const prompt = `You are an expert Pinterest affiliate marketer.

Product: ${data.productName}
Niche: ${data.niche || "general"}
Trend note: ${data.trendNote || "N/A"}

Write the following for a Pinterest pin promoting this product:
1. A catchy headline (max 60 chars).
2. A short body description (1-2 sentences, max 160 chars).
3. A Pinterest title (max 60 chars).
4. A Pinterest description (max 300 chars, include relevant keywords).

Format exactly as:
Headline: ...
Description: ...
PinTitle: ...
PinDescription: ...

${affiliateLink ? `End the PinDescription with the link: ${affiliateLink}` : ""}`;

    const result = await generateText({
      model,
      prompt,
      temperature: 0.7,
    });

    const text = result.text;
    const headline = text.match(/Headline:\s*(.*)/)?.[1]?.trim() || data.productName;
    const description = text.match(/Description:\s*(.*)/)?.[1]?.trim() || "";
    const pinTitle = text.match(/PinTitle:\s*(.*)/)?.[1]?.trim() || headline;
    const pinDescription = text.match(/PinDescription:\s*(.*)/)?.[1]?.trim() || "";

    return {
      headline,
      description,
      pinTitle,
      pinDescription,
      affiliateLink,
    };
  });

export const generateImagePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateImagePromptInput.parse(input))
  .handler(async ({ data }) => {
    const lovableApiKey = process.env["LOVABLE_API_KEY"];
    if (!lovableApiKey) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(lovableApiKey);
    const model = gateway("google/gemini-3.6-flash");

    const prompt = `Write a short, vivid image-generation prompt for a Pinterest pin about "${data.productName}".
Niche: ${data.niche || "general"}
Trend note: ${data.trendNote || "N/A"}
${data.headline ? `Headline: ${data.headline}` : ""}

The image should be vertical (2:3), bright, aesthetically pleasing, and suitable for a Pinterest pin. No text in the image. Keep it under 2 sentences.`;

    const result = await generateText({
      model,
      prompt,
      temperature: 0.8,
    });

    return { imagePrompt: result.text.trim() };
  });

export const saveGeneratedContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SaveGeneratedContentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: product, error: productError } = await supabase
      .from("campaign_products")
      .select("campaign_id, campaigns!inner(owner_id)")
      .eq("id", data.productId)
      .eq("campaigns.owner_id", userId)
      .single();

    if (productError || !product) {
      throw new Error(productError?.message || "Product not found or access denied");
    }

    const { error } = await supabase.from("generated_content").upsert(
      {
        product_id: data.productId,
        headline: data.headline,
        description: data.description,
        pinterest_title: data.pinTitle,
        pin_description: data.pinDescription,
        affiliate_link: data.affiliateLink || null,
        image_prompt: data.imagePrompt || null,
        image_url: data.imageUrl || null,
      },
      { onConflict: "product_id" },
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
    const lovableApiKey = process.env["LOVABLE_API_KEY"];
    if (!lovableApiKey) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(lovableApiKey);
    const model = gateway("google/gemini-3.6-flash");

    const prompt = `You are a trend researcher for Pinterest affiliate marketing.
Niche: ${data.niche}

Generate ${data.count} trending product ideas or topics that would perform well as Pinterest pins right now. Each idea should be a concrete product name or topic with a short trend note.

Format as a numbered list, one per line:
1. Product name | trend note
2. Product name | trend note
...`;

    const result = await generateText({
      model,
      prompt,
      temperature: 0.8,
    });

    const lines = result.text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^\d+\.\s*/.test(line));

    const ideas = lines.map((line) => {
      const cleaned = line.replace(/^\d+\.\s*/, "");
      const [productName, trendNote] = cleaned.split("|").map((s) => s.trim());
      return { productName, trendNote: trendNote || "" };
    });

    return { ideas: ideas.filter((i) => i.productName) };
  });
