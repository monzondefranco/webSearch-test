import OpenAI from "openai";
import * as dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "webSearch",
      description: "Realiza una búsqueda web para responder la consulta del usuario.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Consulta a buscar" },
        },
        required: ["query"],
      },
    },
  },
];

async function fakeWebSearch(query: string) {
  return {
    answer: `La capital de Francia es París.`,
    sources: [
      "https://es.wikipedia.org/wiki/Par%C3%ADs",
      "https://www.britannica.com/place/Paris"
    ]
  };
}

export async function handlePrompt(prompt: string) {
  const userMessage: OpenAI.Chat.Completions.ChatCompletionUserMessageParam = {
    role: "user",
    content: prompt,
  };

  const initialResponse = await openai.chat.completions.create({
    model: "gpt-3.5-turbo", // ✅ ahora sí
    messages: [userMessage],
    tools,
    tool_choice: "auto",
  });

  const toolCalls = initialResponse.choices[0].message.tool_calls;

  if (toolCalls?.length) {
    const call = toolCalls[0];
    const args = JSON.parse(call.function.arguments);
    const webResult = await fakeWebSearch(args.query);

    const followUpResponse = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        userMessage,
        initialResponse.choices[0].message,
        {
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(webResult),
        },
      ],
    });

    const finalContent = followUpResponse.choices[0].message?.content ?? "(Sin respuesta)";
    
    return {
      response: finalContent,
      sources: webResult.sources,
    };
  } else {
    const fallback = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [userMessage],
    });

    const fallbackContent = fallback.choices[0].message?.content ?? "(Sin respuesta)";

    return {
      response: fallbackContent,
      sources: [],
    };
  }
}

handlePrompt("¿Cuál es la capital de Francia?").then(res => {
  console.log("🔹 Respuesta:", res.response);
  console.log("🔹 Fuentes:", res.sources);
});
