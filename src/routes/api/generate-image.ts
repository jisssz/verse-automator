import { createFileRoute } from "@tanstack/react-router";
import { OpenAiServiceError, streamOpenAiImageGeneration } from "@/lib/openai.server";

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { prompt } = (await request.json()) as { prompt: string };
          return await streamOpenAiImageGeneration(prompt);
        } catch (error) {
          const message =
            error instanceof OpenAiServiceError ? error.message : "Image generation failed";
          const status =
            error instanceof OpenAiServiceError && error.statusCode ? error.statusCode : 500;
          return new Response(message, { status });
        }
      },
    },
  },
});
