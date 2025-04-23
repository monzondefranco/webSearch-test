import OpenAI from "openai";
import * as dotenv from "dotenv";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function handlePrompt(prompt: string, fileContent?: Buffer | null) {
  if (fileContent) {
    try {
      // Añadir logs de debug
      console.log('Tamaño del archivo:', fileContent.length, 'bytes');
      
      // Crear un archivo temporal
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, 'document.pdf');
      
      // Escribir el contenido al archivo temporal
      fs.writeFileSync(tempFilePath, fileContent);
      
      console.log('Archivo temporal creado en:', tempFilePath);

      // Subir el archivo temporal
      const file = await openai.files.create({
        file: fs.createReadStream(tempFilePath),
        purpose: "assistants",
      });

      console.log('Archivo subido exitosamente:', file.id);

      // Crear un vector store con el archivo
      const vectorStore = await openai.vectorStores.create({
        name: "document_store",
        file_ids: [file.id],
      });

      console.log('Vector store creado:', vectorStore.id);

      const response = await openai.responses.create({
        model: "gpt-4o",
        tools: [
          { type: "web_search_preview" },
          { 
            type: "file_search",
            vector_store_ids: [vectorStore.id]
          }
        ],
        input: prompt,
      });

      // Limpiar
      await openai.files.del(file.id);
      fs.unlinkSync(tempFilePath);

      return {
        response: response.output_text,
        sources: (response as any).citations || [],
      };
    } catch (error: any) {
      // Mejorar el mensaje de error con más detalles
      console.error('Error completo:', error);
      console.error('Status:', error.status);
      console.error('Response:', error.response?.data);
      
      throw new Error(`Error al procesar el archivo: ${error.message}
        Status: ${error.status}
        Detalles: ${JSON.stringify(error.response?.data || {})}`);
    }
  }

  // Si no hay archivo, usar la funcionalidad básica
  const response = await openai.responses.create({
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" }],
    input: prompt,
  });

  return {
    response: response.output_text,
    sources: (response as any).citations || [],
  };
}

