import type { NextApiRequest, NextApiResponse } from 'next';
import { handlePrompt } from '../../index';
import formidable from 'formidable';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    
    const prompt = fields.prompt?.[0];
    const file = files.file?.[0];

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    let fileContent = null;
    if (file) {
      fileContent = await fs.readFile(file.filepath);
    }

    const result = await handlePrompt(prompt, fileContent);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 