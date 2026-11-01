export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
  contentHtml: string;
  contentJson?: any;
  version: number;
  isOfficial: boolean;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserDocument {
  id: string;
  templateId: string;
  templateTitle?: string;
  title: string;
  contentHtml: string;
  contentJson?: any;
  createdAt: string;
  lastModified: string;
  author: string;
}

export interface SlideItem {
  id: string;
  slideNumber: number;
  title: string;
  subtitle?: string;
  bullets?: string[];
  columnLeft?: string[];
  columnRight?: string[];
  quote?: {
    text: string;
    author: string;
  };
  metrics?: Array<{
    label: string;
    value: string;
    description: string;
  }>;
  layout: 'title' | 'bullet' | 'two-column' | 'quote' | 'metrics' | 'conclusion';
  notes?: string;
  backgroundColor?: string;
}

export interface PresentationTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontHeading: string;
  fontBody: string;
}

export interface PresentationTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
  theme: PresentationTheme;
  slides: SlideItem[];
  pageCount?: number;
  isDefault?: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPresentation {
  id: string;
  templateId: string;
  templateTitle?: string;
  title: string;
  theme: PresentationTheme;
  slides: SlideItem[];
  createdAt: string;
  lastModified: string;
  author: string;
}

const API_BASE = '/api';

export const api = {
  // Documents
  async getDocumentTemplates(search?: string, category?: string): Promise<DocumentTemplate[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'All' && category !== 'Tất cả') params.append('category', category);
    const res = await fetch(`${API_BASE}/documents/templates?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi tải mẫu văn bản');
    return data.data;
  },

  async getDocumentTemplateById(id: string): Promise<DocumentTemplate> {
    const res = await fetch(`${API_BASE}/documents/templates/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi tải chi tiết mẫu');
    return data.data;
  },

  async createDocumentFromTemplate(templateId: string, customTitle?: string): Promise<UserDocument> {
    const res = await fetch(`${API_BASE}/documents/from-template/${templateId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customTitle })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi khởi tạo tài liệu từ mẫu');
    return data.data;
  },

  async getUserDocuments(): Promise<UserDocument[]> {
    const res = await fetch(`${API_BASE}/documents/my-documents`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi tải tài liệu cá nhân');
    return data.data;
  },

  async getUserDocumentById(id: string): Promise<UserDocument> {
    const res = await fetch(`${API_BASE}/documents/my-documents/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi tải tài liệu');
    return data.data;
  },

  async updateUserDocument(id: string, updates: Partial<UserDocument>): Promise<UserDocument> {
    const res = await fetch(`${API_BASE}/documents/my-documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi lưu tài liệu');
    return data.data;
  },

  async deleteUserDocument(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/documents/my-documents/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi xóa tài liệu');
  },

  async createNewDocumentTemplate(templateData: any): Promise<DocumentTemplate> {
    const res = await fetch(`${API_BASE}/documents/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi tạo mẫu mới');
    return data.data;
  },

  // Presentations
  async getPresentationTemplates(search?: string, category?: string): Promise<PresentationTemplate[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'All' && category !== 'Tất cả') params.append('category', category);
    const res = await fetch(`${API_BASE}/presentations/templates?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi tải mẫu trình chiếu');
    return data.data;
  },

  async getPresentationTemplateById(id: string): Promise<PresentationTemplate> {
    const res = await fetch(`${API_BASE}/presentations/templates/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi tải chi tiết mẫu slide');
    return data.data;
  },

  async createPresentationFromTemplate(templateId: string, customTitle?: string): Promise<UserPresentation> {
    const res = await fetch(`${API_BASE}/presentations/from-template/${templateId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customTitle })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi khởi tạo bài trình chiếu từ mẫu');
    return data.data;
  },

  async getUserPresentations(): Promise<UserPresentation[]> {
    const res = await fetch(`${API_BASE}/presentations/my-presentations`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi tải bài trình chiếu cá nhân');
    return data.data;
  },

  async getUserPresentationById(id: string): Promise<UserPresentation> {
    const res = await fetch(`${API_BASE}/presentations/my-presentations/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi tải bài trình chiếu');
    return data.data;
  },

  async updateUserPresentation(id: string, updates: Partial<UserPresentation>): Promise<UserPresentation> {
    const res = await fetch(`${API_BASE}/presentations/my-presentations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi lưu bài trình chiếu');
    return data.data;
  },

  async deleteUserPresentation(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/presentations/my-presentations/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi xóa bài trình chiếu');
  },

  async createNewPresentationTemplate(templateData: any): Promise<PresentationTemplate> {
    const res = await fetch(`${API_BASE}/presentations/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi tạo mẫu trình chiếu mới');
    return data.data;
  },

  async deactivateDocumentTemplate(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/documents/templates/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi ẩn mẫu văn bản');
  },

  async deactivatePresentationTemplate(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/presentations/templates/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi khi ẩn mẫu trình chiếu');
  }
};
