import { SearchInput } from '../components/SearchInput';
import { useState } from 'react';

interface SearchResult {
  response: string;
  sources: string[];
  threadState?: {
    threadId: string;
    lastMessageId: string;
  };
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [currentThreadState, setCurrentThreadState] = useState<SearchResult['threadState']>();

  const handleSearch = async (prompt: string, file: File | null) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      if (file) {
        formData.append('file', file);
      }
      if (currentThreadState) {
        formData.append('threadId', currentThreadState.threadId);
        formData.append('lastMessageId', currentThreadState.lastMessageId);
      }

      const response = await fetch('/api/search', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setMessages(prev => [...prev, 
        { role: 'user', content: prompt },
        { role: 'assistant', content: data.response }
      ]);

      if (data.threadState) {
        setCurrentThreadState(data.threadState);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold text-center mb-8">
        Buscador con IA
      </h1>
      <SearchInput 
        onSearch={(prompt, file) => handleSearch(prompt, file)} 
        loading={loading} 
      />
      
      <div className="max-w-2xl mx-auto mt-8 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              message.role === 'user' ? 'bg-blue-100 ml-12' : 'bg-white mr-12'
            }`}
          >
            <div className="font-semibold mb-2">
              {message.role === 'user' ? 'Tú' : 'Asistente'}
            </div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
      </div>
    </main>
  );
} 