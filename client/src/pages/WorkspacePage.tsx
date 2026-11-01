import React, { useState, useEffect } from 'react';
import { 
  FileText, Presentation, Clock, Trash2, Edit2, 
  Search, Plus, ArrowUpRight, FolderOpen, LayoutGrid, List
} from 'lucide-react';
import { UserDocument, UserPresentation, api } from '../api';

interface WorkspacePageProps {
  onOpenDocument: (doc: UserDocument) => void;
  onOpenPresentation: (pres: UserPresentation) => void;
  onNavigateToDocuments: () => void;
  onNavigateToPresentations: () => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  onOpenDocument,
  onOpenPresentation,
  onNavigateToDocuments,
  onNavigateToPresentations
}) => {
  const [filterType, setFilterType] = useState<'all' | 'docx' | 'pptx'>('all');
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [presentations, setPresentations] = useState<UserPresentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const loadData = async () => {
    try {
      setLoading(true);
      const [docs, pres] = await Promise.all([
        api.getUserDocuments(),
        api.getUserPresentations()
      ]);
      setDocuments(docs);
      setPresentations(pres);
    } catch (error) {
      console.error('Lỗi khi tải tài liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này không?')) return;
    try {
      await api.deleteUserDocument(id);
      setDocuments(documents.filter(d => d.id !== id));
    } catch (err) {
      alert('Lỗi khi xóa tài liệu');
    }
  };

  const handleDeletePresentation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản trình chiếu này không?')) return;
    try {
      await api.deleteUserPresentation(id);
      setPresentations(presentations.filter(p => p.id !== id));
    } catch (err) {
      alert('Lỗi khi xóa bản trình chiếu');
    }
  };

  // Gom chung các item lại để quản lý như File Explorer
  const allItems = [
    ...documents.map(d => ({
      id: d.id,
      title: d.title,
      type: 'docx' as const,
      templateTitle: d.templateTitle || 'Mẫu văn bản',
      lastModified: d.lastModified,
      rawDoc: d
    })),
    ...presentations.map(p => ({
      id: p.id,
      title: p.title,
      type: 'pptx' as const,
      templateTitle: p.templateTitle || 'Mẫu trình chiếu',
      lastModified: p.lastModified,
      rawPres: p
    }))
  ];

  const filteredItems = allItems
    .filter(item => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Tài liệu của tôi
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {allItems.length} tệp
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Không gian lưu trữ các tài liệu và bài trình chiếu bạn đã tạo từ mẫu.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              title="Dạng bảng"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              title="Dạng lưới"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="my-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên tệp..."
            className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterType === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Tất cả ({allItems.length})
          </button>
          <button
            onClick={() => setFilterType('docx')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterType === 'docx'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Văn bản ({documents.length})
          </button>
          <button
            onClick={() => setFilterType('pptx')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterType === 'pptx'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Trình chiếu ({presentations.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Đang tải danh sách tệp...</div>
      ) : allItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 p-8">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Chưa có tài liệu nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Hãy bắt đầu bằng cách chọn một mẫu từ thư viện để tạo văn bản hoặc bản trình chiếu đầu tiên.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={onNavigateToDocuments}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition"
            >
              Khám phá mẫu văn bản
            </button>
            <button
              onClick={onNavigateToPresentations}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition"
            >
              Khám phá mẫu slide
            </button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Không tìm thấy tài liệu nào khớp với từ khóa tìm kiếm.
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW (Clean File Manager Table) */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Tên tài liệu</th>
                  <th className="py-3 px-4 w-28">Định dạng</th>
                  <th className="py-3 px-4 hidden md:table-cell">Mẫu nguồn</th>
                  <th className="py-3 px-4 w-36 hidden sm:table-cell">Lần sửa cuối</th>
                  <th className="py-3 px-4 text-right w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      if (item.type === 'docx' && item.rawDoc) onOpenDocument(item.rawDoc);
                      if (item.type === 'pptx' && item.rawPres) onOpenPresentation(item.rawPres);
                    }}
                    className="hover:bg-slate-50/80 cursor-pointer transition group"
                  >
                    {/* Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                          item.type === 'docx' ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {item.type === 'docx' ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <Presentation className="w-4 h-4" />
                          )}
                        </div>
                        <span className="font-medium text-slate-900 group-hover:text-blue-600 transition truncate max-w-xs sm:max-w-md">
                          {item.title}
                        </span>
                      </div>
                    </td>

                    {/* Format Badge */}
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded tracking-wide ${
                        item.type === 'docx' ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {item.type.toUpperCase()}
                      </span>
                    </td>

                    {/* Template Source */}
                    <td className="py-3 px-4 hidden md:table-cell text-slate-500 truncate max-w-[180px]">
                      {item.templateTitle}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 hidden sm:table-cell text-slate-500 whitespace-nowrap">
                      {new Date(item.lastModified).toLocaleDateString('vi-VN')}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            if (item.type === 'docx' && item.rawDoc) onOpenDocument(item.rawDoc);
                            if (item.type === 'pptx' && item.rawPres) onOpenPresentation(item.rawPres);
                          }}
                          className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                          title="Mở chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            if (item.type === 'docx') handleDeleteDocument(item.id, e);
                            else handleDeletePresentation(item.id, e);
                          }}
                          className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Xóa tài liệu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.type === 'docx' && item.rawDoc) onOpenDocument(item.rawDoc);
                if (item.type === 'pptx' && item.rawPres) onOpenPresentation(item.rawPres);
              }}
              className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded tracking-wide ${
                    item.type === 'docx' ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {item.type.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.lastModified).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition line-clamp-1 mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">
                  Mẫu: {item.templateTitle}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 flex items-center gap-1">
                  Mở chỉnh sửa
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
                </span>
                <button
                  onClick={(e) => {
                    if (item.type === 'docx') handleDeleteDocument(item.id, e);
                    else handleDeletePresentation(item.id, e);
                  }}
                  className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition"
                  title="Xóa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
