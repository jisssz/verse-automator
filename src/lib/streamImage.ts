export async function streamImage(
  endpoint: string,
  prompt: string,
  onUpdate: (dataUrl: string | null, final: boolean) => void,
) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.body || !response.ok) {
    throw new Error(`Image generation failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") {
          onUpdate(null, true);
          return;
        }
        try {
          const parsed = JSON.parse(payload);
          const isFinal =
            Boolean(parsed.final) ||
            parsed.type === "image_generation.completed" ||
            parsed.type === "image_edit.completed";

          if (parsed.url) {
            onUpdate(parsed.url, isFinal);
          } else if (parsed.image_url) {
            onUpdate(parsed.image_url, isFinal);
          } else if (parsed.data_url) {
            onUpdate(parsed.data_url, isFinal);
          } else if (parsed.b64_json) {
            onUpdate(`data:image/png;base64,${parsed.b64_json}`, isFinal);
          } else if (parsed.data) {
            onUpdate(parsed.data, isFinal);
          }
        } catch {
          // ignore malformed lines
        }
      }
    }
  } finally {
    reader.releaseLock();
    onUpdate(null, true);
  }
}
