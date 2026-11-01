import React from 'react';
import { FileText, Presentation, FolderGit2, Plus, LayoutGrid } from 'lucide-react';

interface NavbarProps {
  activeTab: 'documents' | 'presentations' | 'workspace';
  setActiveTab: (tab: 'documents' | 'presentations' | 'workspace') => void;
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateModal
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo Brand */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer select-none" 
            onClick={() => setActiveTab('documents')}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <LayoutGrid className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-base sm:text-lg text-slate-900 tracking-tight">
                TemplateHub
              </span>
              <span className="hidden md:inline-block text-[11px] font-medium text-slate-500 border-l border-slate-200 pl-2">
                Thư viện tài liệu văn phòng
              </span>
            </div>
          </div>

          {/* Navigation Tabs - Responsive Scrollable on Mobile */}
          <nav className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/60 overflow-x-auto max-w-[55%] sm:max-w-none">
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                activeTab === 'documents'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Văn bản</span>
            </button>

            <button
              onClick={() => setActiveTab('presentations')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                activeTab === 'presentations'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Presentation className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Trình chiếu</span>
            </button>

            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                activeTab === 'workspace'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Tài liệu của tôi</span>
            </button>
          </nav>

          {/* Action Button */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition active:scale-98 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thêm mẫu mới</span>
              <span className="sm:hidden">Thêm</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
