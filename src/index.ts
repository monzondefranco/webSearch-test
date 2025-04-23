import OpenAI from "openai";
import * as dotenv from "dotenv";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Interfaz para el estado del thread
export interface ThreadState {
  threadId: string;
  lastMessageId: string;
}

export async function handlePrompt(prompt: string, fileContent?: Buffer | null, threadState?: ThreadState) {
  try {
    // Si no hay thread existente, crear uno nuevo
    if (!threadState) {
      const thread = await openai.beta.threads.create();
      threadState = { threadId: thread.id, lastMessageId: '' };
      console.log('Nuevo thread creado:', thread.id);
    }

    // Procesar el archivo si existe
    let fileId: string | undefined;
    let tempFilePath: string | undefined;
    
    if (fileContent) {
      // Añadir logs de debug
      console.log('Tamaño del archivo:', fileContent.length, 'bytes');
      
      // Crear un archivo temporal
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, 'document.pdf');
      
      // Escribir el contenido al archivo temporal
      fs.writeFileSync(tempFilePath, fileContent);
      
      console.log('Archivo temporal creado en:', tempFilePath);

      // Subir el archivo temporal
      const file = await openai.files.create({
        file: fs.createReadStream(tempFilePath),
        purpose: "assistants",
      });

      fileId = file.id;
      console.log('Archivo subido exitosamente:', fileId);
    }

    // Añadir el mensaje al thread
    const message = await openai.beta.threads.messages.create(threadState.threadId, {
      role: "user",
      content: prompt,
      file_ids: fileId ? [fileId] : undefined
    } as any);

    console.log('Mensaje añadido al thread:', message.id);

    // Crear una ejecución del asistente
    const run = await openai.beta.threads.runs.create(threadState.threadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
      instructions: prompt
    });

    // Esperar a que la ejecución termine
    let runStatus = await openai.beta.threads.runs.retrieve(
      threadState.threadId,
      run.id
    );

    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(
        threadState.threadId,
        run.id
      );
    }

    // Obtener los mensajes después de que la ejecución termine
    const messages = await openai.beta.threads.messages.list(
      threadState.threadId
    );

    // Obtener el último mensaje del asistente
    const lastAssistantMessage = messages.data
      .filter(m => m.role === 'assistant')
      .sort((a, b) => b.created_at - a.created_at)[0];

    // Limpiar archivos si existen
    if (fileId) {
      await openai.files.del(fileId);
      if (tempFilePath) {
        fs.unlinkSync(tempFilePath);
      }
    }

    // Actualizar el estado del thread
    threadState.lastMessageId = message.id;

    return {
      response: lastAssistantMessage.content[0].type === 'text' 
        ? lastAssistantMessage.content[0].text.value 
        : 'No se pudo obtener la respuesta',
      sources: [], // Los sources se pueden obtener de las anotaciones del mensaje si es necesario
      threadState // Devolver el estado actualizado del thread
    };
  } catch (error: any) {
    // Mejorar el mensaje de error con más detalles
    console.error('Error completo:', error);
    console.error('Status:', error.status);
    console.error('Response:', error.response?.data);
    
    throw new Error(`Error en la conversación: ${error.message}
      Status: ${error.status}
      Detalles: ${JSON.stringify(error.response?.data || {})}`);
  }
}

