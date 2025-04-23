import OpenAI from "openai";
import * as dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function createAssistant() {
  try {
    const assistant = await openai.beta.assistants.create({
      name: "Search Assistant",
      instructions: "You are a helpful assistant that can search through documents and answer questions.",
      model: "gpt-4-turbo-preview",
      tools: [
        { type: "file_search" },
        { type: "code_interpreter" }
      ]
    });

    console.log('Assistant created successfully!');
    console.log('Assistant ID:', assistant.id);
    console.log('Please add this ID to your .env file as OPENAI_ASSISTANT_ID');
  } catch (error) {
    console.error('Error creating assistant:', error);
  }
}

createAssistant(); 