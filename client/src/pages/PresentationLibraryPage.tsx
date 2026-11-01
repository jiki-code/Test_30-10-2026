import React, { useState, useEffect, useMemo } from 'react';
import { Search, LayoutGrid, List, X, ArrowUpDown } from 'lucide-react';
import { PresentationTemplate, UserPresentation, api } from '../api';
import { PresentationCard } from '../features/presentations/PresentationCard';
import { PresentationPreviewModal } from '../features/presentations/PresentationPreviewModal';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';

interface PresentationLibraryPageProps {
  onPresentationCreated: (pres: UserPresentation) => void;
}

const CATEGORIES = ['Tất cả', 'Kinh doanh', 'Giáo dục', 'Sáng tạo'];

export const PresentationLibraryPage: React.FC<PresentationLibraryPageProps> = ({
  onPresentationCreated
}) => {
  const [templates, setTemplates] = useState<PresentationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'latest' | 'name'>('latest');
  const [previewTemplate, setPreviewTemplate] = useState<PresentationTemplate | null>(null);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPresentationTemplates(search, selectedCategory);
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải mẫu trình chiếu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTemplates();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => {
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title, 'vi');
      }
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });
  }, [templates, sortBy]);

  const handleUseTemplate = async (template: PresentationTemplate) => {
    try {
      setCreatingId(template.id);
      const newPres = await api.createPresentationFromTemplate(template.id);
      setPreviewTemplate(null);
      onPresentationCreated(newPres);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi khởi tạo bản trình chiếu mới từ mẫu');
    } finally {
      setCreatingId(null);
    }
  };

  const handleDeleteTemplate = async (template: PresentationTemplate) => {
    try {
      setDeletingId(template.id);
      await api.deactivatePresentationTemplate(template.id);
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi ẩn mẫu trình chiếu');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Mẫu trình chiếu
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {templates.length} bộ slide
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tạo bản sao độc lập và xuất file PowerPoint (.pptx).
          </p>
        </div>

        {/* View Switcher & Sort */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="latest">Mới nhất</option>
              <option value="name">Tên A-Z</option>
            </select>
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              title="Dạng lưới"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              title="Dạng danh sách"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="my-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm mẫu slide theo tên, chủ đề hoặc tag..."
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Categories Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : sortedTemplates.length === 0 ? (
        <EmptyState
          title="Không tìm thấy mẫu slide phù hợp"
          description="Thử tìm kiếm với từ khóa khác hoặc bỏ chọn bộ lọc hiện tại."
          onReset={() => {
            setSearch('');
            setSelectedCategory('Tất cả');
          }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {sortedTemplates.map((tpl) => (
            <PresentationCard
              key={tpl.id}
              template={tpl}
              viewMode="grid"
              onPreview={(t) => setPreviewTemplate(t)}
              onUseTemplate={handleUseTemplate}
              onDelete={handleDeleteTemplate}
              isCreating={creatingId === tpl.id}
              isDeleting={deletingId === tpl.id}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedTemplates.map((tpl) => (
            <PresentationCard
              key={tpl.id}
              template={tpl}
              viewMode="list"
              onPreview={(t) => setPreviewTemplate(t)}
              onUseTemplate={handleUseTemplate}
              onDelete={handleDeleteTemplate}
              isCreating={creatingId === tpl.id}
              isDeleting={deletingId === tpl.id}
            />
          ))}
        </div>
      )}

      {/* Deck Preview Modal */}
      <PresentationPreviewModal
        template={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUseTemplate={handleUseTemplate}
        isCreating={creatingId === previewTemplate?.id}
      />
    </div>
  );
};
