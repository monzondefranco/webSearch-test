import { SearchInput } from '../components/SearchInput';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold text-center mb-8">
        Buscador con IA
      </h1>
      <SearchInput />
    </main>
  );
} 