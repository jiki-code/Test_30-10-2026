import React, { useState } from 'react';
import { X, Plus, Trash2, FileText, Presentation, Image as ImageIcon, ImageOff, ExternalLink, Sparkles } from 'lucide-react';
import { api } from '../api';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultType?: 'document' | 'presentation';
}

const DOC_CATEGORIES = ['Hành chính', 'Kinh doanh', 'Nhân sự', 'Giáo dục'];
const PRES_CATEGORIES = ['Kinh doanh', 'Giáo dục', 'Sáng tạo'];

const SAMPLE_THUMBNAILS = [
  { label: 'Văn bản / Hợp đồng', url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80' },
  { label: 'Báo cáo kinh doanh', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80' },
  { label: 'Thuyết trình hiện đại', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80' },
];

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  defaultType = 'document'
}) => {
  const [templateType, setTemplateType] = useState<'document' | 'presentation'>(defaultType);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(defaultType === 'presentation' ? 'Kinh doanh' : 'Hành chính');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('công văn, hành chính');
  const [thumbnailUrl, setThumbnailUrl] = useState('https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80');
  const [imageError, setImageError] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [htmlContent, setHtmlContent] = useState(`<h2>TIÊU ĐỀ MẪU TÀI LIỆU MỚI</h2><p>Nội dung mẫu văn bản có thể chỉnh sửa ở đây...</p>`);

  const getFormattedUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^(https?:\/\/|\/|data:)/i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleThumbnailChange = (val: string) => {
    setThumbnailUrl(val);
    setImageError(false);
    if (val.trim()) {
      setIsLoadingImage(true);
    }
  };

  const handleThumbnailBlur = () => {
    const trimmed = thumbnailUrl.trim();
    if (trimmed && !/^(https?:\/\/|\/|data:)/i.test(trimmed)) {
      setThumbnailUrl(`https://${trimmed}`);
    }
  };
  
  const [slides, setSlides] = useState([
    {
      id: 'slide-1',
      slideNumber: 1,
      title: 'Slide Tiêu Đề Mới',
      subtitle: 'Phụ đề giới thiệu ngắn gọn',
      layout: 'title' as const,
      backgroundColor: '#0f172a'
    },
    {
      id: 'slide-2',
      slideNumber: 2,
      title: 'Nội Dung Chi Tiết',
      subtitle: 'Các luận điểm quan trọng',
      layout: 'bullet' as const,
      bullets: ['Nội dung luận điểm 1', 'Nội dung luận điểm 2'],
      backgroundColor: '#1e293b'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên mẫu');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      const finalThumbnailUrl = getFormattedUrl(thumbnailUrl) || thumbnailUrl;

      if (templateType === 'document') {
        await api.createNewDocumentTemplate({
          title,
          category,
          description,
          tags: tagList,
          thumbnailUrl: finalThumbnailUrl,
          contentHtml: htmlContent
        });
      } else {
        await api.createNewPresentationTemplate({
          title,
          category,
          description,
          tags: tagList,
          thumbnailUrl: finalThumbnailUrl,
          theme: {
            name: 'Standard Dark',
            primaryColor: '#3b82f6',
            secondaryColor: '#10b981',
            accentColor: '#f59e0b',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
            fontHeading: 'Inter, sans-serif',
            fontBody: 'Inter, sans-serif'
          },
          slides
        });
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo mẫu mới');
    } finally {
      setLoading(false);
    }
  };

  const addSlide = () => {
    const nextNum = slides.length + 1;
    setSlides([
      ...slides,
      {
        id: `slide-${nextNum}`,
        slideNumber: nextNum,
        title: `Slide ${nextNum}`,
        subtitle: 'Mô tả tóm tắt...',
        layout: 'bullet',
        bullets: ['Luận điểm 1', 'Luận điểm 2'],
        backgroundColor: '#0f172a'
      }
    ]);
  };

  const removeSlide = (index: number) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== index).map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
    setSlides(newSlides);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">
            Thêm mẫu mới vào thư viện
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
              {error}
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">
              Loại mẫu
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTemplateType('document');
                  setCategory('Hành chính');
                }}
                className={`py-2 px-3 rounded-lg font-medium border flex items-center justify-center space-x-1.5 transition ${
                  templateType === 'document'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Văn bản (DOCX)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemplateType('presentation');
                  setCategory('Kinh doanh');
                }}
                className={`py-2 px-3 rounded-lg font-medium border flex items-center justify-center space-x-1.5 transition ${
                  templateType === 'presentation'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Trình chiếu (PPTX)</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Tên mẫu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Thỏa thuận bảo mật thông tin (NDA)"
              className="w-full px-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer font-medium"
              >
                {(templateType === 'document' ? DOC_CATEGORIES : PRES_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Thẻ tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="công văn, hành chính"
                className="w-full px-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Mô tả tóm tắt</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả mục đích sử dụng mẫu..."
              className="w-full px-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {/* Thumbnail URL & Live Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-medium text-slate-700">Ảnh xem trước (URL)</label>
              {thumbnailUrl.trim() && (
                <span className={`text-[11px] font-medium flex items-center gap-1 ${imageError ? 'text-rose-500' : 'text-emerald-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${imageError ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                  {imageError ? 'Lỗi tải ảnh' : 'Đang xem trước'}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => handleThumbnailChange(e.target.value)}
                onBlur={handleThumbnailBlur}
                placeholder="https://example.com/hinh-anh.jpg"
                className="w-full px-3 py-1.5 pr-8 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs"
              />
              {thumbnailUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailUrl('');
                    setImageError(false);
                  }}
                  title="Xóa URL"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Gợi ý mẫu ảnh nhanh */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Gợi ý:
              </span>
              {SAMPLE_THUMBNAILS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleThumbnailChange(sample.url)}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60 transition"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            {/* Khung hiển thị ảnh xem trước */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
              {thumbnailUrl.trim() ? (
                <>
                  {!imageError ? (
                    <div className="relative aspect-[16/9] max-h-48 w-full bg-slate-900/5 flex items-center justify-center overflow-hidden group">
                      {isLoadingImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 z-10 transition-opacity">
                          <div className="flex items-center space-x-2 text-slate-600 text-xs">
                            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span>Đang tải xem trước...</span>
                          </div>
                        </div>
                      )}
                      <img
                        src={getFormattedUrl(thumbnailUrl)}
                        alt="Xem trước ảnh bìa"
                        onLoad={() => setIsLoadingImage(false)}
                        onError={() => {
                          setIsLoadingImage(false);
                          setImageError(true);
                        }}
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-102"
                      />
                      {/* Floating overlay tag */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/75 text-white text-[10px] backdrop-blur-xs flex items-center gap-1 font-medium shadow-xs">
                        <ImageIcon className="w-3 h-3 text-emerald-400" />
                        <span>Xem trước</span>
                      </div>
                      <a
                        href={getFormattedUrl(thumbnailUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-white/90 hover:bg-white text-slate-800 text-[11px] font-medium backdrop-blur-xs flex items-center gap-1 shadow-sm transition hover:shadow"
                        title="Mở ảnh gốc trong tab mới"
                      >
                        <span>Mở ảnh gốc</span>
                        <ExternalLink className="w-3 h-3 text-slate-600" />
                      </a>
                    </div>
                  ) : (
                    <div className="py-5 px-4 flex flex-col items-center justify-center text-center bg-rose-50/50">
                      <ImageOff className="w-7 h-7 text-rose-400 mb-1" />
                      <p className="text-xs font-semibold text-rose-600">Không thể tải trước hình ảnh</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
                        Đường dẫn URL không hợp lệ hoặc liên kết không cho phép truy cập. Vui lòng kiểm tra lại URL.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-4 px-3 flex flex-col items-center justify-center text-slate-400 gap-1">
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                  <span className="text-xs text-slate-500">Chưa có ảnh xem trước</span>
                  <span className="text-[10px] text-slate-400">Nhập URL hoặc chọn một mẫu gợi ý phía trên</span>
                </div>
              )}
            </div>
          </div>

          {/* Conditional Content */}
          {templateType === 'document' ? (
            <div>
              <label className="block font-medium text-slate-700 mb-1">Nội dung mẫu (HTML)</label>
              <textarea
                rows={4}
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="w-full px-3 py-1.5 font-mono text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-medium text-slate-700">Các slide mẫu ({slides.length})</label>
                <button
                  type="button"
                  onClick={addSlide}
                  className="inline-flex items-center space-x-1 text-indigo-600 font-medium hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm slide</span>
                </button>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {slides.map((s, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-2">
                    <span className="font-mono text-slate-400 w-5">#{idx + 1}</span>
                    <input
                      type="text"
                      value={s.title}
                      onChange={(e) => {
                        const newSlides = [...slides];
                        newSlides[idx].title = e.target.value;
                        setSlides(newSlides);
                      }}
                      className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                      placeholder="Tiêu đề slide"
                    />
                    {slides.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSlide(idx)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg font-medium bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Lưu mẫu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
