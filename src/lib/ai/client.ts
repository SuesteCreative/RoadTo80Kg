import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_SECRET;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY (ou ANTHROPIC_SECRET) não definida. Adiciona em .env.local e Vercel.",
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

export const AI_MODEL = "claude-haiku-4-5" as const;
