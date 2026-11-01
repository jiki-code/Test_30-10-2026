import React from 'react';
import { SlideItem, PresentationTheme } from '../../api';

interface SlideCanvasProps {
  slide: SlideItem;
  theme: PresentationTheme;
  isEditable?: boolean;
  onUpdateSlide?: (updated: Partial<SlideItem>) => void;
  scale?: number;
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  slide,
  theme,
  isEditable = false,
  onUpdateSlide
}) => {
  const bgColor = slide.backgroundColor || theme.backgroundColor || '#0f172a';
  const textColor = theme.textColor || '#ffffff';
  const primaryColor = theme.primaryColor || '#3b82f6';
  const accentColor = theme.accentColor || '#f59e0b';

  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: theme.fontHeading || 'Inter, sans-serif'
      }}
      className="w-full aspect-video rounded-xl shadow-2xl relative overflow-hidden flex flex-col p-8 sm:p-12 select-text"
    >
      {/* Decorative Accent Header Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Slide Layouts */}
      {slide.layout === 'title' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
          {isEditable ? (
            <input
              type="text"
              value={slide.title}
              onChange={(e) => onUpdateSlide?.({ title: e.target.value })}
              className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-transparent text-center border-b border-transparent hover:border-slate-500 focus:border-blue-400 focus:outline-none w-full mb-4"
              style={{ color: primaryColor }}
              placeholder="Nhập tiêu đề trình chiếu..."
            />
          ) : (
            <h1
              className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4"
              style={{ color: primaryColor }}
            >
              {slide.title}
            </h1>
          )}

          {isEditable ? (
            <textarea
              rows={2}
              value={slide.subtitle || ''}
              onChange={(e) => onUpdateSlide?.({ subtitle: e.target.value })}
              className="text-base sm:text-xl opacity-90 max-w-2xl bg-transparent text-center border-b border-transparent hover:border-slate-500 focus:border-blue-400 focus:outline-none w-full resize-none"
              placeholder="Nhập phụ đề hoặc thông điệp chính..."
            />
          ) : (
            slide.subtitle && (
              <p className="text-base sm:text-xl opacity-90 max-w-2xl leading-relaxed">
                {slide.subtitle}
              </p>
            )
          )}
        </div>
      )}

      {slide.layout === 'bullet' && (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-6">
            {isEditable ? (
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onUpdateSlide?.({ title: e.target.value })}
                className="text-2xl sm:text-4xl font-bold bg-transparent border-b border-transparent hover:border-slate-500 focus:border-blue-400 focus:outline-none w-full"
                style={{ color: primaryColor }}
              />
            ) : (
              <h2 className="text-2xl sm:text-4xl font-bold" style={{ color: primaryColor }}>
                {slide.title}
              </h2>
            )}

            {isEditable ? (
              <input
                type="text"
                value={slide.subtitle || ''}
                onChange={(e) => onUpdateSlide?.({ subtitle: e.target.value })}
                className="text-sm sm:text-base opacity-75 mt-1 bg-transparent border-b border-transparent hover:border-slate-500 focus:border-blue-400 focus:outline-none w-full"
                placeholder="Phụ đề slide..."
              />
            ) : (
              slide.subtitle && <p className="text-sm sm:text-base opacity-75 mt-1">{slide.subtitle}</p>
            )}
          </div>

          {/* Bullets */}
          <div className="flex-1 flex flex-col justify-center space-y-4 max-w-4xl">
            {(slide.bullets || []).map((bullet, idx) => (
              <div key={idx} className="flex items-start space-x-3 text-base sm:text-xl leading-relaxed">
                <span className="w-2.5 h-2.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: accentColor }} />
                {isEditable ? (
                  <input
                    type="text"
                    value={bullet}
                    onChange={(e) => {
                      const newBullets = [...(slide.bullets || [])];
                      newBullets[idx] = e.target.value;
                      onUpdateSlide?.({ bullets: newBullets });
                    }}
                    className="flex-1 bg-transparent border-b border-transparent hover:border-slate-500 focus:border-blue-400 focus:outline-none"
                  />
                ) : (
                  <span>{bullet}</span>
                )}
              </div>
            ))}
            {isEditable && (
              <button
                onClick={() => {
                  const newBullets = [...(slide.bullets || []), 'Nội dung mới...'];
                  onUpdateSlide?.({ bullets: newBullets });
                }}
                className="text-xs text-blue-400 hover:text-blue-300 text-left mt-2"
              >
                + Thêm gạch đầu dòng
              </button>
            )}
          </div>
        </div>
      )}

      {slide.layout === 'two-column' && (
        <div className="flex-1 flex flex-col">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-4xl font-bold" style={{ color: primaryColor }}>
              {slide.title}
            </h2>
            {slide.subtitle && <p className="text-sm sm:text-base opacity-75 mt-1">{slide.subtitle}</p>}
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            {/* Left Column */}
            <div className="space-y-3 p-5 rounded-xl bg-white/5 backdrop-blur-xs border border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Khía cạnh A</span>
              {(slide.columnLeft || []).map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-sm sm:text-base">
                  <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: primaryColor }} />
                  {isEditable ? (
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newCols = [...(slide.columnLeft || [])];
                        newCols[idx] = e.target.value;
                        onUpdateSlide?.({ columnLeft: newCols });
                      }}
                      className="flex-1 bg-transparent border-b border-transparent hover:border-slate-500 focus:border-blue-400 focus:outline-none"
                    />
                  ) : (
                    <span>{item}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div className="space-y-3 p-5 rounded-xl bg-white/5 backdrop-blur-xs border border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Khía cạnh B</span>
              {(slide.columnRight || []).map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-sm sm:text-base">
                  <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: accentColor }} />
                  {isEditable ? (
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newCols = [...(slide.columnRight || [])];
                        newCols[idx] = e.target.value;
                        onUpdateSlide?.({ columnRight: newCols });
                      }}
                      className="flex-1 bg-transparent border-b border-transparent hover:border-slate-500 focus:border-blue-400 focus:outline-none"
                    />
                  ) : (
                    <span>{item}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {slide.layout === 'metrics' && (
        <div className="flex-1 flex flex-col">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-4xl font-bold" style={{ color: primaryColor }}>
              {slide.title}
            </h2>
            {slide.subtitle && <p className="text-sm sm:text-base opacity-75 mt-1">{slide.subtitle}</p>}
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            {(slide.metrics || []).map((metric, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center flex flex-col justify-center shadow-lg"
              >
                {isEditable ? (
                  <input
                    type="text"
                    value={metric.value}
                    onChange={(e) => {
                      const newM = [...(slide.metrics || [])];
                      newM[idx].value = e.target.value;
                      onUpdateSlide?.({ metrics: newM });
                    }}
                    className="text-3xl sm:text-5xl font-extrabold mb-2 bg-transparent text-center border-b border-transparent focus:border-blue-400 focus:outline-none"
                    style={{ color: accentColor }}
                  />
                ) : (
                  <span className="text-3xl sm:text-5xl font-extrabold mb-2" style={{ color: accentColor }}>
                    {metric.value}
                  </span>
                )}

                {isEditable ? (
                  <input
                    type="text"
                    value={metric.label}
                    onChange={(e) => {
                      const newM = [...(slide.metrics || [])];
                      newM[idx].label = e.target.value;
                      onUpdateSlide?.({ metrics: newM });
                    }}
                    className="text-base font-semibold mb-1 bg-transparent text-center border-b border-transparent focus:border-blue-400 focus:outline-none"
                  />
                ) : (
                  <h4 className="text-base font-semibold mb-1">{metric.label}</h4>
                )}

                {isEditable ? (
                  <input
                    type="text"
                    value={metric.description}
                    onChange={(e) => {
                      const newM = [...(slide.metrics || [])];
                      newM[idx].description = e.target.value;
                      onUpdateSlide?.({ metrics: newM });
                    }}
                    className="text-xs opacity-70 bg-transparent text-center border-b border-transparent focus:border-blue-400 focus:outline-none"
                  />
                ) : (
                  <p className="text-xs opacity-70">{metric.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.layout === 'conclusion' && (
        <div className="flex-1 flex flex-col justify-center items-center text-center max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-4" style={{ color: primaryColor }}>
            {slide.title}
          </h2>
          {slide.subtitle && <p className="text-base sm:text-xl opacity-80 mb-8">{slide.subtitle}</p>}
          <div className="space-y-3 text-left w-full max-w-2xl bg-white/5 p-6 rounded-2xl border border-white/10">
            {(slide.bullets || []).map((bullet, idx) => (
              <div key={idx} className="flex items-center space-x-3 text-sm sm:text-lg">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slide Footer */}
      <div className="mt-auto pt-4 flex items-center justify-between text-[11px] opacity-40 border-t border-white/10">
        <span>Office Template Suite • High Quality Presentation</span>
        <span>Trang {slide.slideNumber}</span>
      </div>
    </div>
  );
};
