import OpenAI from "openai";
import { aiConfig } from "./config";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface StreamParams {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  onChunk: (text: string) => void;
  onDone: (fullText: string, usage: { inputTokens: number; outputTokens: number; totalTokens: number }) => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

export async function streamCompletion({ messages, onChunk, onDone, onError, signal }: StreamParams): Promise<void> {
  try {
    const stream = await openai.chat.completions.create({
      model: aiConfig.model,
      messages,
      max_tokens: aiConfig.maxTokens,
      temperature: aiConfig.temperature,
      stream: true,
      stream_options: { include_usage: true },
    });

    let fullText = "";
    let usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

    for await (const chunk of stream) {
      if (signal?.aborted) break;

      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        fullText += delta;
        onChunk(delta);
      }

      if (chunk.usage) {
        usage = {
          inputTokens: chunk.usage.prompt_tokens || 0,
          outputTokens: chunk.usage.completion_tokens || 0,
          totalTokens: chunk.usage.total_tokens || 0,
        };
      }
    }

    onDone(fullText, usage);
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}
