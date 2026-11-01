import React, { useState } from 'react';
import { Eye, ArrowRight, FileText, Trash2 } from 'lucide-react';
import { DocumentTemplate } from '../../api';

interface DocumentCardProps {
  template: DocumentTemplate;
  onPreview: (template: DocumentTemplate) => void;
  onUseTemplate: (template: DocumentTemplate) => void;
  onDelete?: (template: DocumentTemplate) => void;
  isCreating?: boolean;
  isDeleting?: boolean;
  viewMode?: 'grid' | 'list';
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
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
            <h3 className="font-semibold text-sm text-slate-900">Ẩn mẫu văn bản?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Mẫu <span className="font-medium text-slate-700">"{template.title}"</span> sẽ bị ẩn khỏi thư viện. Thao tác này có thể khôi phục trong cơ sở dữ liệu.
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

  // ── List View ───────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <>
        {confirmOpen && <ConfirmDialog />}
        <div className="group bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-xs transition p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3.5 flex-1 min-w-0">
            <div className="w-10 h-12 rounded bg-blue-50 border border-blue-200/60 flex flex-col items-center justify-center shrink-0 text-blue-700">
              <FileText className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">DOCX</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {template.category}
                </span>
                <h3
                  onClick={() => onPreview(template)}
                  className="font-medium text-sm text-slate-900 group-hover:text-blue-600 transition truncate cursor-pointer"
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
              Xem trước
            </button>
            <button
              onClick={() => onUseTemplate(template)}
              disabled={isCreating}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
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

  // ── Grid View ───────────────────────────────────────────────────────
  return (
    <>
      {confirmOpen && <ConfirmDialog />}
      <div className="group bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-xs transition flex flex-col overflow-hidden">
        {/* Thumbnail */}
        <div
          className="relative aspect-[16/10] bg-slate-100 border-b border-slate-100 overflow-hidden cursor-pointer"
          onClick={() => onPreview(template)}
        >
          <img
            src={template.thumbnailUrl}
            alt={template.title}
            className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold uppercase px-2 py-0.5 rounded tracking-wide">
              DOCX
            </span>
            <span className="bg-white/95 backdrop-blur-xs text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200/60">
              {template.category}
            </span>
          </div>

          {/* Delete button — top right, show on hover (only if not default) */}
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

          {/* Hover overlay */}
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
              className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition line-clamp-1 cursor-pointer"
              title={template.title}
            >
              {template.title}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
              {template.description}
            </p>

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
              className="flex-1 inline-flex items-center justify-center space-x-1 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
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
