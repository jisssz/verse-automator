import { z } from "zod";
import { generateStructuredJson } from "./openai.server";

const DailyVerseGenerationInputSchema = z.object({
  productName: z.string().min(1),
  productCategory: z.string().min(1),
});

const DailyVerseGenerationOutputSchema = z.object({
  pinterestTitle: z.string().min(1),
  pinterestDescription: z.string().min(1),
  seoKeywords: z.array(z.string().min(1)),
  hashtags: z.array(z.string().min(1)),
  imagePrompt: z.string().min(1),
  altText: z.string().min(1),
  affiliateCTA: z.string().min(1),
});

export type DailyVerseGenerationInput = z.infer<typeof DailyVerseGenerationInputSchema>;
export type DailyVerseGenerationOutput = z.infer<typeof DailyVerseGenerationOutputSchema>;

export async function generateDailyVerseContent(
  input: DailyVerseGenerationInput,
): Promise<DailyVerseGenerationOutput> {
  const { productName, productCategory } = DailyVerseGenerationInputSchema.parse(input);

  return generateStructuredJson({
    instructions:
      "You are the Daily Verse content engine. Return only valid JSON that matches the schema, with no markdown and no extra keys.",
    input: [
      `Product name: ${productName}`,
      `Product category: ${productCategory}`,
      "",
      "Create Pinterest-ready marketing content that is clear, high-converting, and optimized for organic search.",
      "The response must include a Pinterest title, Pinterest description, SEO keywords, hashtags, image prompt, alt text, and affiliate CTA.",
      "SEO keywords should be short, relevant search phrases.",
      "Hashtags should be concise and discoverable.",
      "The image prompt should describe a vertical 2:3 Pinterest graphic with no text in the image.",
      "The alt text should be accessible and factual.",
      "The affiliate CTA should be a short, persuasive call to action.",
    ].join("\n"),
    schemaName: "daily_verse_generation",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        pinterestTitle: { type: "string" },
        pinterestDescription: { type: "string" },
        seoKeywords: {
          type: "array",
          items: { type: "string" },
        },
        hashtags: {
          type: "array",
          items: { type: "string" },
        },
        imagePrompt: { type: "string" },
        altText: { type: "string" },
        affiliateCTA: { type: "string" },
      },
      required: [
        "pinterestTitle",
        "pinterestDescription",
        "seoKeywords",
        "hashtags",
        "imagePrompt",
        "altText",
        "affiliateCTA",
      ],
    },
    validator: DailyVerseGenerationOutputSchema,
    temperature: 0.75,
    maxOutputTokens: 600,
    safetyIdentifier: productName,
  });
}
