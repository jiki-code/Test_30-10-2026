import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DocumentLibraryPage } from './pages/DocumentLibraryPage';
import { PresentationLibraryPage } from './pages/PresentationLibraryPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { DocumentEditor } from './features/documents/DocumentEditor';
import { PresentationEditor } from './features/presentations/PresentationEditor';
import { CreateTemplateModal } from './components/CreateTemplateModal';
import { UserDocument, UserPresentation } from './api';

export function App() {
  const [activeTab, setActiveTab] = useState<'documents' | 'presentations' | 'workspace'>('documents');
  const [activeDocument, setActiveDocument] = useState<UserDocument | null>(null);
  const [activePresentation, setActivePresentation] = useState<UserPresentation | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Nếu đang mở Document Editor
  if (activeDocument) {
    return (
      <DocumentEditor
        document={activeDocument}
        onBack={() => setActiveDocument(null)}
        onDocumentUpdated={(updated) => setActiveDocument(updated)}
      />
    );
  }

  // Nếu đang mở Presentation Editor
  if (activePresentation) {
    return (
      <PresentationEditor
        presentation={activePresentation}
        onBack={() => setActivePresentation(null)}
        onPresentationUpdated={(updated) => setActivePresentation(updated)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
        }}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Main Body Pages */}
      <main className="flex-1">
        {activeTab === 'documents' && (
          <DocumentLibraryPage
            key={`doc-${refreshKey}`}
            onDocumentCreated={(newDoc) => {
              setActiveDocument(newDoc);
            }}
          />
        )}

        {activeTab === 'presentations' && (
          <PresentationLibraryPage
            key={`pres-${refreshKey}`}
            onPresentationCreated={(newPres) => {
              setActivePresentation(newPres);
            }}
          />
        )}

        {activeTab === 'workspace' && (
          <WorkspacePage
            key={`ws-${refreshKey}`}
            onOpenDocument={(doc) => setActiveDocument(doc)}
            onOpenPresentation={(pres) => setActivePresentation(pres)}
            onNavigateToDocuments={() => setActiveTab('documents')}
            onNavigateToPresentations={() => setActiveTab('presentations')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© 2026 TemplateHub. Thư viện mẫu tài liệu và trình chiếu văn phòng.</p>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Hỗ trợ định dạng OpenXML DOCX & PPTX</span>
            <span>•</span>
            <span>Cơ chế bảo vệ dữ liệu gốc Copy-on-Write</span>
          </div>
        </div>
      </footer>

      {/* Create New Template Modal */}
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultType={activeTab === 'presentations' ? 'presentation' : 'document'}
        onCreated={() => {
          setRefreshKey((prev) => prev + 1);
        }}
      />
    </div>
  );
}

export default App;
