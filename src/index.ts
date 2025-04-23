import OpenAI from "openai";
import * as dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function handlePrompt(prompt: string) {
  const response = await openai.responses.create({
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" }],
    input: prompt,
  });

  // Accedemos a las citas de manera segura
  const sources = (response as any).citations || [];

  return {
    response: response.output_text,
    sources,
  };
}

