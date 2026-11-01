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
