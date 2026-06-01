import { Search } from 'lucide-react';

export default function SearchBar({ searchQuery, setSearchQuery }) {
  return (
    <div className="relative max-w-2xl mx-auto my-8 px-4">
      <div className="relative flex items-center">
        <Search className="absolute left-4 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="물품 이름을 입력하세요"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-14 pl-12 pr-4 rounded-2xl glass-input text-lg text-slate-700 placeholder:text-slate-450"
        />
      </div>
    </div>
  );
}
