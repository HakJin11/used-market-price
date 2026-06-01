import { categories } from '../data/mockData';

export default function Filter({ activeCategory, setActiveCategory }) {
  return (
    <div className="flex justify-center mb-8 px-4">
      <div className="flex flex-wrap justify-center gap-2 max-w-4xl">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              activeCategory === category
                ? 'bg-indigo-600 text-white border border-indigo-600'
                : 'bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}

