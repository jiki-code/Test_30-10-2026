import React, { useState } from 'react';
import { Eye, ArrowRight, Layers, Presentation as PresIcon, Trash2 } from 'lucide-react';
import { PresentationTemplate } from '../../api';

interface PresentationCardProps {
  template: PresentationTemplate;
  onPreview: (template: PresentationTemplate) => void;
  onUseTemplate: (template: PresentationTemplate) => void;
  onDelete?: (template: PresentationTemplate) => void;
  isCreating?: boolean;
  isDeleting?: boolean;
  viewMode?: 'grid' | 'list';
}

export const PresentationCard: React.FC<PresentationCardProps> = ({
  template,
  onPreview,
  onUseTemplate,
  onDelete,
  isCreating = false,
  isDeleting = false,
  viewMode = 'grid'
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canDelete = !template.isDefault && !!onDelete;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmOpen(false);
    onDelete?.(template);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmOpen(false);
  };

  // ── Confirm Dialog ──────────────────────────────────────────────────
  const ConfirmDialog = () => (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={handleCancelDelete}
    >
      <div
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm mx-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <Trash2 className="w-4.5 h-4.5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Ẩn mẫu trình chiếu?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Bộ slide <span className="font-medium text-slate-700">"{template.title}"</span> sẽ bị ẩn khỏi thư viện. Thao tác này có thể khôi phục trong cơ sở dữ liệu.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={handleCancelDelete}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? 'Đang ẩn...' : 'Xác nhận ẩn'}
          </button>
        </div>
      </div>
    </div>
  );

  // Chế độ xem Danh sách (List View)
  if (viewMode === 'list') {
    return (
      <>
        {confirmOpen && <ConfirmDialog />}
        <div className="group bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-xs transition p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3.5 flex-1 min-w-0">
            <div className="w-12 h-10 rounded bg-indigo-50 border border-indigo-200/60 flex flex-col items-center justify-center shrink-0 text-indigo-700">
              <PresIcon className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">PPTX</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {template.category}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {template.slides?.length || template.pageCount || 5} slides
                </span>
                <h3 
                  onClick={() => onPreview(template)}
                  className="font-medium text-sm text-slate-900 group-hover:text-indigo-600 transition truncate cursor-pointer"
                  title={template.title}
                >
                  {template.title}
                </h3>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {template.description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <button
              onClick={() => onPreview(template)}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
            >
              Xem bộ slide
            </button>
            <button
              onClick={() => onUseTemplate(template)}
              disabled={isCreating}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <span>{isCreating ? 'Đang tạo...' : 'Dùng mẫu'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {canDelete && (
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                title="Ẩn mẫu này"
                className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  // Chế độ xem Lưới (Grid View)
  return (
    <>
      {confirmOpen && <ConfirmDialog />}
      <div className="group bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-xs transition flex flex-col overflow-hidden">
        {/* Thumbnail Aspect 16:9 */}
        <div 
          className="relative aspect-video bg-slate-900 border-b border-slate-100 overflow-hidden cursor-pointer"
          onClick={() => onPreview(template)}
        >
          <img
            src={template.thumbnailUrl}
            alt={template.title}
            className="w-full h-full object-cover group-hover:scale-102 transition duration-300 opacity-90"
            loading="lazy"
          />

          {/* Format & Slide Count Badges */}
          <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold uppercase px-2 py-0.5 rounded tracking-wide">
              PPTX
            </span>
            <span className="bg-white/95 backdrop-blur-xs text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200/60">
              {template.category}
            </span>
          </div>

          {/* Slide Counter on right */}
          <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>{template.slides?.length || template.pageCount || 5} slides</span>
          </div>

          {/* Delete button — top right, show on hover */}
          {canDelete && (
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              title="Ẩn mẫu này"
              className="absolute top-2 right-2 p-1.5 rounded-md bg-white/90 text-slate-500 hover:text-red-500 hover:bg-white opacity-0 group-hover:opacity-100 transition shadow-sm border border-slate-200/60 disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Hover View Hint */}
          <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
            <span className="bg-white text-slate-800 text-xs font-medium px-3 py-1.5 rounded-md shadow-xs flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              Xem trước
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 
              onClick={() => onPreview(template)}
              className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition line-clamp-1 cursor-pointer"
              title={template.title}
            >
              {template.title}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
              {template.description}
            </p>

            {/* Tags */}
            {template.tags && template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {template.tags.slice(0, 2).map((tag, idx) => (
                  <span key={idx} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={() => onPreview(template)}
              className="flex-1 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition text-center"
            >
              Xem trước
            </button>
            <button
              onClick={() => onUseTemplate(template)}
              disabled={isCreating}
              className="flex-1 inline-flex items-center justify-center space-x-1 py-1.5 rounded-md text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <span>{isCreating ? 'Đang tạo...' : 'Dùng mẫu'}</span>
            </button>
            {canDelete && (
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                title="Xóa / Ẩn mẫu này"
                className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition shrink-0 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
