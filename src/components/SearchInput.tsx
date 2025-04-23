import React, { useState, useRef, useEffect } from 'react';

interface SearchResult {
  response: string;
  sources: string[];
  threadState?: {
    threadId: string;
    lastMessageId: string;
  };
}

interface SearchInputProps {
  onSearch: (prompt: string, file: File | null, threadState?: SearchResult['threadState']) => Promise<void>;
  loading: boolean;
}

export function SearchInput({ onSearch, loading }: SearchInputProps) {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    await onSearch(prompt, file);
    setPrompt('');
    setFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto p-4">
      <div className="mb-4">
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.txt,.doc,.docx"
          className="w-full p-2 border rounded-lg mb-2"
        />
        {file && (
          <p className="text-sm text-gray-600 mb-2">
            Archivo seleccionado: {file.name}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Escribe tu pregunta..."
          className="flex-1 p-2 border rounded-lg resize-none min-h-[40px] max-h-[200px]"
          rows={1}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
    </form>
  );
} 