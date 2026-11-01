import fs from 'fs';
import path from 'path';
import { 
  DocumentTemplate, 
  UserDocument, 
  PresentationTemplate, 
  UserPresentation 
} from '../models/types';
import { initialDocumentTemplates, initialPresentationTemplates } from './seedData';

interface DatabaseSchema {
  documentTemplates: DocumentTemplate[];
  userDocuments: UserDocument[];
  presentationTemplates: PresentationTemplate[];
  userPresentations: UserPresentation[];
}

export class Database {
  private static instance: Database;
  private filePath: string;
  private data: DatabaseSchema;

  private constructor() {
    const dataDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'database.json');
    this.data = this.loadData();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return {
          documentTemplates: parsed.documentTemplates || [],
          userDocuments: parsed.userDocuments || [],
          presentationTemplates: parsed.presentationTemplates || [],
          userPresentations: parsed.userPresentations || []
        };
      }
    } catch (error) {
      console.error('Error loading database, initializing with default data:', error);
    }

    const defaultData: DatabaseSchema = {
      documentTemplates: initialDocumentTemplates,
      userDocuments: [],
      presentationTemplates: initialPresentationTemplates,
      userPresentations: []
    };
    this.saveDataDirect(defaultData);
    return defaultData;
  }

  private saveDataDirect(data: DatabaseSchema): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  public save(): void {
    this.saveDataDirect(this.data);
  }

  public resetToSeeds(): void {
    this.data = {
      documentTemplates: [...initialDocumentTemplates],
      userDocuments: [],
      presentationTemplates: [...initialPresentationTemplates],
      userPresentations: []
    };
    this.save();
  }

  // Document Templates
  public getDocumentTemplates(): DocumentTemplate[] {
    return this.data.documentTemplates.map(t => ({
      ...t,
      isDefault: t.isDefault !== undefined ? t.isDefault : true
    }));
  }

  public getDocumentTemplateById(id: string): DocumentTemplate | undefined {
    const t = this.data.documentTemplates.find(t => t.id === id);
    return t ? { ...t, isDefault: t.isDefault !== undefined ? t.isDefault : true } : undefined;
  }

  public addDocumentTemplate(template: DocumentTemplate): void {
    template.isDefault = false;
    this.data.documentTemplates.push(template);
    this.save();
  }

  public removeDocumentTemplate(id: string): boolean {
    const before = this.data.documentTemplates.length;
    this.data.documentTemplates = this.data.documentTemplates.filter(t => t.id !== id);
    if (this.data.documentTemplates.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // User Documents
  public getUserDocuments(): UserDocument[] {
    return this.data.userDocuments;
  }

  public getUserDocumentById(id: string): UserDocument | undefined {
    return this.data.userDocuments.find(d => d.id === id);
  }

  public addUserDocument(doc: UserDocument): void {
    this.data.userDocuments.unshift(doc);
    this.save();
  }

  public updateUserDocument(id: string, updates: Partial<UserDocument>): UserDocument | null {
    const index = this.data.userDocuments.findIndex(d => d.id === id);
    if (index === -1) return null;
    this.data.userDocuments[index] = {
      ...this.data.userDocuments[index],
      ...updates,
      lastModified: new Date().toISOString()
    };
    this.save();
    return this.data.userDocuments[index];
  }

  public deleteUserDocument(id: string): boolean {
    const initialLength = this.data.userDocuments.length;
    this.data.userDocuments = this.data.userDocuments.filter(d => d.id !== id);
    if (this.data.userDocuments.length !== initialLength) {
      this.save();
      return true;
    }
    return false;
  }

  // Presentation Templates
  public getPresentationTemplates(): PresentationTemplate[] {
    return this.data.presentationTemplates;
  }

  public getPresentationTemplateById(id: string): PresentationTemplate | undefined {
    return this.data.presentationTemplates.find(t => t.id === id);
  }

  public addPresentationTemplate(template: PresentationTemplate): void {
    template.isDefault = false;
    this.data.presentationTemplates.push(template);
    this.save();
  }

  public removePresentationTemplate(id: string): boolean {
    const before = this.data.presentationTemplates.length;
    this.data.presentationTemplates = this.data.presentationTemplates.filter(t => t.id !== id);
    if (this.data.presentationTemplates.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // User Presentations
  public getUserPresentations(): UserPresentation[] {
    return this.data.userPresentations;
  }

  public getUserPresentationById(id: string): UserPresentation | undefined {
    return this.data.userPresentations.find(p => p.id === id);
  }

  public addUserPresentation(pres: UserPresentation): void {
    this.data.userPresentations.unshift(pres);
    this.save();
  }

  public updateUserPresentation(id: string, updates: Partial<UserPresentation>): UserPresentation | null {
    const index = this.data.userPresentations.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.data.userPresentations[index] = {
      ...this.data.userPresentations[index],
      ...updates,
      lastModified: new Date().toISOString()
    };
    this.save();
    return this.data.userPresentations[index];
  }

  public deleteUserPresentation(id: string): boolean {
    const initialLength = this.data.userPresentations.length;
    this.data.userPresentations = this.data.userPresentations.filter(p => p.id !== id);
    if (this.data.userPresentations.length !== initialLength) {
      this.save();
      return true;
    }
    return false;
  }
}

export const db = Database.getInstance();
