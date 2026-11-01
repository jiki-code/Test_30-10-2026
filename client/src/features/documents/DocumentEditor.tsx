import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  Heading1, Heading2, Heading3, Pilcrow, List, ListOrdered, 
  Quote, AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  Table as TableIcon, Undo, Redo, Save, Download, ArrowLeft,
  Printer, Check, FileDown
} from 'lucide-react';
import { UserDocument, api } from '../../api';

interface DocumentEditorProps {
  document: UserDocument;
  onBack: () => void;
  onDocumentUpdated: (doc: UserDocument) => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document: initialDoc,
  onBack,
  onDocumentUpdated
}) => {
  const [doc, setDoc] = useState<UserDocument>(initialDoc);
  const [title, setTitle] = useState(initialDoc.title);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableHeader,
      TableCell
    ],
    content: initialDoc.contentHtml,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[750px] p-6 sm:p-14 text-slate-800 leading-relaxed'
      }
    }
  });

  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      const html = editor.getHTML();
      const updated = await api.updateUserDocument(doc.id, {
        title,
        contentHtml: html
      });
      setDoc(updated);
      onDocumentUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      alert('Lỗi khi lưu tài liệu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportDocx = async () => {
    try {
      setIsExporting(true);
      if (editor) {
        await api.updateUserDocument(doc.id, {
          title,
          contentHtml: editor.getHTML()
        });
      }

      const res = await fetch(`/api/documents/my-documents/${doc.id}/export/docx`);
      if (!res.ok) throw new Error('Không thể tải file DOCX');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^\w\s-]/gi, '') || 'document'}.docx`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error: any) {
      alert(error.message || 'Lỗi khi tải file DOCX');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportHtml = () => {
    if (!editor) return;
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Times New Roman', serif; padding: 40px; color: #111; line-height: 1.6; max-width: 800px; margin: auto; }
    h1, h2, h3 { text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #333; padding: 8px; }
  </style>
</head>
<body>
  ${editor.getHTML()}
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${title}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!editor) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; color: #111; line-height: 1.6; }
            h1, h2, h3 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #333; padding: 8px; }
          </style>
        </head>
        <body>
          ${editor.getHTML()}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (!editor) return null;

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-3 sm:px-6 py-2 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Back & Document Title */}
          <div className="flex items-center space-x-2.5 flex-1 min-w-0">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition shrink-0"
              title="Quay lại thư viện"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-semibold text-sm sm:text-base text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-0.5 rounded border border-transparent focus:border-slate-300 focus:outline-none w-full truncate"
                placeholder="Tiêu đề tài liệu..."
              />
              <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] text-slate-400 px-2 truncate">
                <span>Mẫu: {doc.templateTitle || 'Mẫu chuẩn'}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {saveSuccess ? 'Đã lưu' : 'Bản sao độc lập'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={handlePrint}
              title="In / Xuất PDF"
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition hidden sm:inline-flex"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportHtml}
              title="Tải HTML"
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition hidden sm:inline-flex"
            >
              <FileDown className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportDocx}
              disabled={isExporting}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">{isExporting ? 'Đang tạo...' : 'Tải DOCX'}</span>
              <span className="sm:hidden">DOCX</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition active:scale-98 disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
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

      {/* Editor Formatting Toolbar (Responsive Scrollable) */}
      <div className="sticky top-[49px] sm:top-[57px] z-20 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 px-3 py-1.5">
        <div className="max-w-4xl mx-auto flex items-center space-x-0.5 overflow-x-auto scrollbar-none">
          {/* Headings */}
          <button
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`p-1.5 rounded hover:bg-white text-xs font-medium ${editor.isActive('paragraph') ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
            title="Đoạn văn thường"
          >
            <Pilcrow className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded hover:bg-white text-xs font-medium ${editor.isActive('heading', { level: 1 }) ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
            title="Tiêu đề 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded hover:bg-white text-xs font-medium ${editor.isActive('heading', { level: 2 }) ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
            title="Tiêu đề 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded hover:bg-white text-xs font-medium ${editor.isActive('heading', { level: 3 }) ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
            title="Tiêu đề 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 mx-1 shrink-0" />

          {/* Inline Styles */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-white ${editor.isActive('bold') ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
            title="In đậm (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-white ${editor.isActive('italic') ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
            title="In nghiêng (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded hover:bg-white ${editor.isActive('underline') ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
            title="Gạch chân (Ctrl+U)"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded hover:bg-white ${editor.isActive('strike') ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
            title="Gạch ngang chữ"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 mx-1 shrink-0" />

          {/* Alignment */}
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded hover:bg-white ${editor.isActive({ textAlign: 'left' }) ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
            title="Căn trái"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded hover:bg-white ${editor.isActive({ textAlign: 'center' }) ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
            title="Căn giữa"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded hover:bg-white ${editor.isActive({ textAlign: 'right' }) ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
            title="Căn phải"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-1.5 rounded hover:bg-white ${editor.isActive({ textAlign: 'justify' }) ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
            title="Căn đều"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 mx-1 shrink-0" />

          {/* Lists & Quotes */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-white ${editor.isActive('bulletList') ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
            title="Danh sách gạch đầu dòng"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-white ${editor.isActive('orderedList') ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
            title="Danh sách đánh số"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded hover:bg-white ${editor.isActive('blockquote') ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
            title="Trích dẫn"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 mx-1 shrink-0" />

          {/* Table */}
          <button
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className="p-1.5 rounded hover:bg-white text-slate-600"
            title="Chèn bảng"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 mx-1 shrink-0" />

          {/* History */}
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded hover:bg-white text-slate-500 disabled:opacity-30"
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded hover:bg-white text-slate-500 disabled:opacity-30"
            title="Làm lại (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Document Workspace Canvas (Clean A4 Paper) */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-8 flex justify-center">
        <div className="w-full max-w-4xl bg-white min-h-[900px] shadow-sm rounded border border-slate-200 my-2">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
