import React from 'react';
import { X, ArrowRight, Printer, FileText } from 'lucide-react';
import { DocumentTemplate } from '../../api';

interface DocumentPreviewModalProps {
  template: DocumentTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: DocumentTemplate) => void;
  isCreating?: boolean;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onUseTemplate,
  isCreating = false
}) => {
  if (!isOpen || !template) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${template.title}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; color: #111; line-height: 1.6; max-width: 800px; margin: auto; }
            h1, h2, h3 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #333; padding: 8px; }
          </style>
        </head>
        <body>
          ${template.contentHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-100 rounded-none sm:rounded-xl shadow-xl border-0 sm:border border-slate-200 w-full max-w-4xl h-full sm:h-[90vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              {template.category}
            </span>
            <h2 className="font-semibold text-slate-900 text-sm sm:text-base truncate">
              {template.title}
            </h2>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handlePrint}
              title="In bản xem trước"
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition hidden sm:inline-flex"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => onUseTemplate(template)}
              disabled={isCreating}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition active:scale-98 disabled:opacity-50"
            >
              <span>{isCreating ? 'Đang tạo...' : 'Sử dụng mẫu này'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-8 flex justify-center bg-slate-200/70">
          <div className="w-full max-w-3xl bg-white min-h-[850px] p-6 sm:p-12 shadow-sm rounded border border-slate-200 my-auto">
            {/* Header info */}
            <div className="mb-6 pb-3 border-b border-slate-200 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Mẫu văn bản gốc (Chỉ đọc)
              </span>
              <span>Định dạng chuẩn OpenXML DOCX</span>
            </div>

            {/* Document Content */}
            <div 
              className="prose prose-slate max-w-none text-slate-800 text-xs sm:text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: template.contentHtml }}
            />
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-4 sm:px-6 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>* Hệ thống sẽ tự động nhân bản nội dung độc lập, không thay đổi mẫu gốc.</span>
          <span className="hidden sm:inline">Hỗ trợ xuất file Word (.docx)</span>
        </div>
      </div>
    </div>
  );
};
