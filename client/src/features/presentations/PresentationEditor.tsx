import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Download, Play, Plus, Trash2, 
  Copy, ArrowUp, ArrowDown, Check, Layout, 
  Palette, FileText
} from 'lucide-react';
import { UserPresentation, SlideItem, api } from '../../api';
import { SlideCanvas } from './SlideCanvas';

interface PresentationEditorProps {
  presentation: UserPresentation;
  onBack: () => void;
  onPresentationUpdated: (pres: UserPresentation) => void;
}

export const PresentationEditor: React.FC<PresentationEditorProps> = ({
  presentation: initialPres,
  onBack,
  onPresentationUpdated
}) => {
  const [pres, setPres] = useState<UserPresentation>(initialPres);
  const [title, setTitle] = useState(initialPres.title);
  const [slides, setSlides] = useState<SlideItem[]>(initialPres.slides);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentSlide = slides[currentSlideIndex] || slides[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
          e.preventDefault();
          setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Escape') {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, slides.length]);

  const handleUpdateSlide = (updates: Partial<SlideItem>) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex] = {
      ...newSlides[currentSlideIndex],
      ...updates
    };
    setSlides(newSlides);
  };

  const handleAddSlide = () => {
    const newIndex = slides.length + 1;
    const newSlide: SlideItem = {
      id: `usr-s-${Date.now()}`,
      slideNumber: newIndex,
      title: `Tiêu đề slide ${newIndex}`,
      subtitle: 'Mô tả ngắn gọn nội dung...',
      layout: 'bullet',
      bullets: ['Nội dung luận điểm 1', 'Nội dung luận điểm 2'],
      backgroundColor: pres.theme?.backgroundColor || '#0f172a'
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const handleDuplicateSlide = () => {
    const cloned: SlideItem = {
      ...JSON.parse(JSON.stringify(currentSlide)),
      id: `usr-s-${Date.now()}`,
      slideNumber: slides.length + 1,
      title: `${currentSlide.title} (Bản sao)`
    };
    const newSlides = [...slides];
    newSlides.splice(currentSlideIndex + 1, 0, cloned);
    const renumbered = newSlides.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
    setSlides(renumbered);
    setCurrentSlideIndex(currentSlideIndex + 1);
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) {
      alert('Bài trình chiếu phải có ít nhất 1 slide.');
      return;
    }
    const newSlides = slides.filter((_, idx) => idx !== currentSlideIndex).map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
    setSlides(newSlides);
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
  };

  const handleMoveSlide = (direction: 'up' | 'down') => {
    if (direction === 'up' && currentSlideIndex === 0) return;
    if (direction === 'down' && currentSlideIndex === slides.length - 1) return;

    const targetIndex = direction === 'up' ? currentSlideIndex - 1 : currentSlideIndex + 1;
    const newSlides = [...slides];
    const temp = newSlides[currentSlideIndex];
    newSlides[currentSlideIndex] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    const renumbered = newSlides.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
    setSlides(renumbered);
    setCurrentSlideIndex(targetIndex);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await api.updateUserPresentation(pres.id, {
        title,
        slides
      });
      setPres(updated);
      onPresentationUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      alert('Lỗi khi lưu bài trình chiếu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPptx = async () => {
    try {
      setIsExporting(true);
      await api.updateUserPresentation(pres.id, {
        title,
        slides
      });

      const res = await fetch(`/api/presentations/${pres.id}/export/pptx`);
      if (!res.ok) throw new Error('Không thể tải file PPTX');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^\w\s-]/gi, '') || 'presentation'}.pptx`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error: any) {
      alert(error.message || 'Lỗi khi tải file PPTX');
    } finally {
      setIsExporting(false);
    }
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center select-none">
        <div className="w-full h-full max-w-6xl max-h-[90vh] p-4 flex items-center justify-center">
          <SlideCanvas
            slide={currentSlide}
            theme={pres.theme}
            isEditable={false}
          />
        </div>

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-700 text-white flex items-center space-x-3 text-xs shadow-xl">
          <button
            onClick={() => setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev))}
            disabled={currentSlideIndex === 0}
            className="hover:text-indigo-400 disabled:opacity-30 font-medium"
          >
            ← Trước
          </button>
          <span className="font-mono text-slate-300">
            {currentSlideIndex + 1} / {slides.length}
          </span>
          <button
            onClick={() => setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : prev))}
            disabled={currentSlideIndex === slides.length - 1}
            className="hover:text-indigo-400 disabled:opacity-30 font-medium"
          >
            Sau →
          </button>
          <div className="w-[1px] h-3.5 bg-slate-700" />
          <button
            onClick={() => setIsFullscreen(false)}
            className="text-slate-400 hover:text-white"
          >
            Thoát (Esc)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 px-3 sm:px-6 py-2 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Back & Title */}
          <div className="flex items-center space-x-2.5 flex-1 min-w-0">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-semibold text-sm sm:text-base text-white bg-transparent hover:bg-slate-800 focus:bg-slate-800 px-2 py-0.5 rounded border border-transparent focus:border-slate-700 focus:outline-none w-full truncate"
                placeholder="Tiêu đề bài trình chiếu..."
              />
              <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] text-slate-400 px-2 truncate">
                <span>Mẫu: {pres.templateTitle || 'Bộ chuẩn'}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {saveSuccess ? 'Đã lưu' : 'Bản sao độc lập'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={() => setIsFullscreen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 transition"
              title="Trình chiếu (F5)"
            >
              <Play className="w-3 h-3 fill-current text-emerald-400" />
              <span className="hidden sm:inline">Trình chiếu</span>
            </button>

            <button
              onClick={handleExportPptx}
              disabled={isExporting}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">{isExporting ? 'Đang tạo...' : 'Tải PPTX'}</span>
              <span className="sm:hidden">PPTX</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition active:scale-98 disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Đã lưu</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Thumbnails Panel (Ẩn trên mobile để ưu tiên canvas) */}
        <div className="hidden sm:flex flex-col w-48 sm:w-52 bg-slate-950 border-r border-slate-800 p-2.5 justify-between shrink-0 overflow-y-auto">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1">
              <span>Slides ({slides.length})</span>
              <button
                onClick={handleAddSlide}
                className="text-indigo-400 hover:text-indigo-300 p-1 hover:bg-slate-800 rounded"
                title="Thêm slide mới"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {slides.map((s, idx) => (
              <div
                key={s.id || idx}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`cursor-pointer rounded-lg p-2 transition border ${
                  currentSlideIndex === idx
                    ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500'
                    : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Slide {idx + 1}</span>
                  <span className="text-[9px] uppercase bg-slate-800 px-1.5 py-0.2 rounded text-slate-400 font-mono">
                    {s.layout}
                  </span>
                </div>

                <div
                  className="w-full aspect-video rounded bg-slate-800 p-1.5 text-[8px] line-clamp-2 font-medium overflow-hidden border border-slate-700/50"
                  style={{
                    backgroundColor: s.backgroundColor || pres.theme?.backgroundColor,
                    color: pres.theme?.textColor
                  }}
                >
                  {s.title}
                </div>
              </div>
            ))}
          </div>

          {/* Slide Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-around gap-1 shrink-0">
            <button
              onClick={() => handleMoveSlide('up')}
              disabled={currentSlideIndex === 0}
              title="Di chuyển lên"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleMoveSlide('down')}
              disabled={currentSlideIndex === slides.length - 1}
              title="Di chuyển xuống"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDuplicateSlide}
              title="Nhân bản slide"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDeleteSlide}
              title="Xóa slide"
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/40"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-8 bg-slate-950/90 overflow-y-auto">
          <div className="w-full max-w-4xl">
            <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between">
              <span>Đang sửa slide {currentSlideIndex + 1} / {slides.length}</span>
              <span className="font-mono text-slate-500">16:9 Widescreen</span>
            </div>

            <SlideCanvas
              slide={currentSlide}
              theme={pres.theme || {
                name: 'Default',
                primaryColor: '#3b82f6',
                secondaryColor: '#10b981',
                accentColor: '#f59e0b',
                backgroundColor: '#0f172a',
                textColor: '#ffffff',
                fontHeading: 'Inter, sans-serif',
                fontBody: 'Inter, sans-serif'
              }}
              isEditable={true}
              onUpdateSlide={handleUpdateSlide}
            />
          </div>
        </div>

        {/* Right Inspector (Ẩn trên mobile/tablet nhỏ) */}
        <div className="hidden lg:block w-60 bg-slate-900 border-l border-slate-800 p-3.5 space-y-4 shrink-0 overflow-y-auto">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bố cục (Layout)</span>
            </label>
            <select
              value={currentSlide.layout}
              onChange={(e) => handleUpdateSlide({ layout: e.target.value as any })}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="title">Slide Tiêu Đề</option>
              <option value="bullet">Gạch Đầu Dòng</option>
              <option value="two-column">So Sánh 2 Cột</option>
              <option value="metrics">Thẻ Số Liệu</option>
              <option value="conclusion">Slide Kết Luận</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span>Màu Nền Slide</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                pres.theme?.backgroundColor || '#0f172a',
                '#0f172a',
                '#1e293b',
                '#0c4a6e',
                '#064e3b',
                '#18181b',
                '#312e81',
                '#581c87'
              ].map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUpdateSlide({ backgroundColor: color })}
                  style={{ backgroundColor: color }}
                  className={`w-full aspect-square rounded border transition ${
                    (currentSlide.backgroundColor || pres.theme?.backgroundColor) === color
                      ? 'border-indigo-400 ring-1 ring-indigo-400'
                      : 'border-transparent hover:scale-105'
                  }`}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Ghi Chú Diễn Giả</span>
            </label>
            <textarea
              rows={4}
              value={currentSlide.notes || ''}
              onChange={(e) => handleUpdateSlide({ notes: e.target.value })}
              placeholder="Nội dung lưu ý khi thuyết trình..."
              className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
