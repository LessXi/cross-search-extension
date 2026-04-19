import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Platform } from '../types/search';

interface SearchHeaderProps {
  onSearch: (query: string, platforms: Platform[]) => void;
  onPlatformChange: (platforms: Platform[]) => void;
  isLoading: boolean;
  selectedPlatforms: Platform[];
}

const platformOptions: { value: Platform; label: string; icon: string; color: string }[] = [
  { value: 'baidu', label: '百度', icon: '🔍', color: 'bg-[#FFFEF0] border-[#FFE88C]' },
  { value: 'google', label: 'Google', icon: '🌐', color: 'bg-[#F0FFF5] border-[#A3F5C9]' },
  { value: 'bilibili', label: 'B站', icon: '📺', color: 'bg-[#FFF0F5] border-[#FF9999]' },
  { value: 'zhihu', label: '知乎', icon: '💡', color: 'bg-[#F0F9FF] border-[#9DD5FF]' },
];

export function SearchHeader({ onSearch, onPlatformChange, isLoading, selectedPlatforms }: SearchHeaderProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim() && selectedPlatforms.length > 0) {
      onSearch(query.trim(), selectedPlatforms);
    }
  };

  const handlePlatformToggle = (platform: Platform) => {
    const newPlatforms = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter(p => p !== platform)
      : [...selectedPlatforms, platform];

    onPlatformChange(newPlatforms);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border-b border-white/40 px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B9D] to-[#FFB84D] flex items-center justify-center">
          <Search className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-[#333]">聚合搜索</span>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="输入搜索关键词..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 bg-white
                   placeholder:text-gray-400 focus:outline-none focus:border-[#FF6B9D]"
          disabled={isLoading}
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !query.trim() || selectedPlatforms.length === 0}
          className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#FF6B9D] to-[#FFB84D]
                   text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed
                   hover:shadow-lg transition-all"
        >
          搜索
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {platformOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handlePlatformToggle(option.value)}
            disabled={isLoading}
            className={`
              px-3 py-1.5 rounded-full text-xs font-semibold border
              transition-all duration-200
              ${selectedPlatforms.includes(option.value)
                ? `${option.color} border-current shadow-sm`
                : 'bg-white/60 border-gray-200 text-gray-500'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
            `}
          >
            <span className="mr-1">{option.icon}</span>{option.label}
          </button>
        ))}
      </div>

      {selectedPlatforms.length === 0 && (
        <p className="text-xs text-[#FF6B9D] mt-2">请至少选择一个平台</p>
      )}
    </div>
  );
}
