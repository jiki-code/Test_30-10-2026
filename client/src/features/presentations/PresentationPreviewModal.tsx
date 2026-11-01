import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ArrowRight, Download, Layers } from 'lucide-react';
import { PresentationTemplate } from '../../api';
import { SlideCanvas } from './SlideCanvas';

interface PresentationPreviewModalProps {
  template: PresentationTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: PresentationTemplate) => void;
  isCreating?: boolean;
}

export const PresentationPreviewModal: React.FC<PresentationPreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onUseTemplate,
  isCreating = false
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  if (!isOpen || !template) return null;

  const currentSlide = template.slides[currentSlideIndex] || template.slides[0];

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : template.slides.length - 1));
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev < template.slides.length - 1 ? prev + 1 : 0));
  };

  const handleExportSamplePptx = () => {
    window.location.href = `/api/presentations/${template.id}/export/pptx`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 rounded-none sm:rounded-xl shadow-xl border-0 sm:border border-slate-800 w-full max-w-6xl h-full sm:h-[90vh] flex flex-col overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              {template.category}
            </span>
            <div className="truncate">
              <h2 className="font-semibold text-white text-sm sm:text-base truncate">
                {template.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleExportSamplePptx}
              title="Tải nhanh file PPTX"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 transition hidden sm:inline-flex"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải PPTX</span>
            </button>

            <button
              onClick={() => onUseTemplate(template)}
              disabled={isCreating}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition active:scale-98 disabled:opacity-50"
            >
              <span>{isCreating ? 'Đang tạo...' : 'Sử dụng bộ slide này'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Thumbnails Deck (Ẩn trên mobile rất nhỏ để tối ưu không gian xem) */}
          <div className="hidden sm:flex flex-col w-48 sm:w-56 bg-slate-950 border-r border-slate-800 p-2.5 space-y-2 shrink-0 overflow-y-auto">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-1 mb-1 flex items-center justify-between">
              <span>Danh sách slide</span>
              <span>{template.slides.length}</span>
            </div>

            {template.slides.map((s, idx) => (
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
                  <span className="capitalize text-[9px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-400 font-mono">
                    {s.layout}
                  </span>
                </div>
                <div
                  className="w-full aspect-video rounded bg-slate-800 p-1.5 text-[8px] line-clamp-2 font-medium overflow-hidden border border-slate-700/50"
                  style={{
                    backgroundColor: s.backgroundColor || template.theme?.backgroundColor,
                    color: template.theme?.textColor
                  }}
                >
                  {s.title}
                </div>
              </div>
            ))}
          </div>

          {/* Center Slide View Stage */}
          <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-8 bg-slate-950 relative overflow-hidden">
            {/* Prev Button */}
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center transition z-10 shadow-md"
              title="Slide trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center transition z-10 shadow-md"
              title="Slide sau"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Slide Stage Container */}
            <div className="w-full max-w-4xl max-h-[75vh] flex items-center justify-center">
              <SlideCanvas
                slide={currentSlide}
                theme={template.theme || {
                  name: 'Standard',
                  primaryColor: '#3b82f6',
                  secondaryColor: '#10b981',
                  accentColor: '#f59e0b',
                  backgroundColor: '#0f172a',
                  textColor: '#ffffff',
                  fontHeading: 'Inter, sans-serif',
                  fontBody: 'Inter, sans-serif'
                }}
                isEditable={false}
              />
            </div>

            {/* Indicator */}
            <div className="mt-3 flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800">
              <span>Slide {currentSlideIndex + 1} / {template.slides.length}</span>
              <span>•</span>
              <span className="capitalize">{currentSlide.layout}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>* Bản sao độc lập sẽ được khởi tạo khi chọn dùng mẫu.</span>
          <span className="text-slate-400">Tỷ lệ 16:9 Widescreen</span>
        </div>
      </div>
    </div>
  );
};
