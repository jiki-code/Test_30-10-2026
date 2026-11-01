"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.Database = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const seedData_1 = require("./seedData");
class Database {
    static instance;
    filePath;
    data;
    constructor() {
        const dataDir = path_1.default.resolve(__dirname, '../../data');
        if (!fs_1.default.existsSync(dataDir)) {
            fs_1.default.mkdirSync(dataDir, { recursive: true });
        }
        this.filePath = path_1.default.join(dataDir, 'database.json');
        this.data = this.loadData();
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    loadData() {
        try {
            if (fs_1.default.existsSync(this.filePath)) {
                const fileContent = fs_1.default.readFileSync(this.filePath, 'utf-8');
                const parsed = JSON.parse(fileContent);
                return {
                    documentTemplates: parsed.documentTemplates || [],
                    userDocuments: parsed.userDocuments || [],
                    presentationTemplates: parsed.presentationTemplates || [],
                    userPresentations: parsed.userPresentations || []
                };
            }
        }
        catch (error) {
            console.error('Error loading database, initializing with default data:', error);
        }
        const defaultData = {
            documentTemplates: seedData_1.initialDocumentTemplates,
            userDocuments: [],
            presentationTemplates: seedData_1.initialPresentationTemplates,
            userPresentations: []
        };
        this.saveDataDirect(defaultData);
        return defaultData;
    }
    saveDataDirect(data) {
        fs_1.default.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
    save() {
        this.saveDataDirect(this.data);
    }
    resetToSeeds() {
        this.data = {
            documentTemplates: [...seedData_1.initialDocumentTemplates],
            userDocuments: [],
            presentationTemplates: [...seedData_1.initialPresentationTemplates],
            userPresentations: []
        };
        this.save();
    }
    // Document Templates
    getDocumentTemplates() {
        return this.data.documentTemplates.map(t => ({
            ...t,
            isDefault: t.isDefault !== undefined ? t.isDefault : true
        }));
    }
    getDocumentTemplateById(id) {
        const t = this.data.documentTemplates.find(t => t.id === id);
        return t ? { ...t, isDefault: t.isDefault !== undefined ? t.isDefault : true } : undefined;
    }
    addDocumentTemplate(template) {
        template.isDefault = false;
        this.data.documentTemplates.push(template);
        this.save();
    }
    removeDocumentTemplate(id) {
        const before = this.data.documentTemplates.length;
        this.data.documentTemplates = this.data.documentTemplates.filter(t => t.id !== id);
        if (this.data.documentTemplates.length !== before) {
            this.save();
            return true;
        }
        return false;
    }
    // User Documents
    getUserDocuments() {
        return this.data.userDocuments;
    }
    getUserDocumentById(id) {
        return this.data.userDocuments.find(d => d.id === id);
    }
    addUserDocument(doc) {
        this.data.userDocuments.unshift(doc);
        this.save();
    }
    updateUserDocument(id, updates) {
        const index = this.data.userDocuments.findIndex(d => d.id === id);
        if (index === -1)
            return null;
        this.data.userDocuments[index] = {
            ...this.data.userDocuments[index],
            ...updates,
            lastModified: new Date().toISOString()
        };
        this.save();
        return this.data.userDocuments[index];
    }
    deleteUserDocument(id) {
        const initialLength = this.data.userDocuments.length;
        this.data.userDocuments = this.data.userDocuments.filter(d => d.id !== id);
        if (this.data.userDocuments.length !== initialLength) {
            this.save();
            return true;
        }
        return false;
    }
    // Presentation Templates
    getPresentationTemplates() {
        return this.data.presentationTemplates;
    }
    getPresentationTemplateById(id) {
        return this.data.presentationTemplates.find(t => t.id === id);
    }
    addPresentationTemplate(template) {
        template.isDefault = false;
        this.data.presentationTemplates.push(template);
        this.save();
    }
    removePresentationTemplate(id) {
        const before = this.data.presentationTemplates.length;
        this.data.presentationTemplates = this.data.presentationTemplates.filter(t => t.id !== id);
        if (this.data.presentationTemplates.length !== before) {
            this.save();
            return true;
        }
        return false;
    }
    // User Presentations
    getUserPresentations() {
        return this.data.userPresentations;
    }
    getUserPresentationById(id) {
        return this.data.userPresentations.find(p => p.id === id);
    }
    addUserPresentation(pres) {
        this.data.userPresentations.unshift(pres);
        this.save();
    }
    updateUserPresentation(id, updates) {
        const index = this.data.userPresentations.findIndex(p => p.id === id);
        if (index === -1)
            return null;
        this.data.userPresentations[index] = {
            ...this.data.userPresentations[index],
            ...updates,
            lastModified: new Date().toISOString()
        };
        this.save();
        return this.data.userPresentations[index];
    }
    deleteUserPresentation(id) {
        const initialLength = this.data.userPresentations.length;
        this.data.userPresentations = this.data.userPresentations.filter(p => p.id !== id);
        if (this.data.userPresentations.length !== initialLength) {
            this.save();
            return true;
        }
        return false;
    }
}
exports.Database = Database;
exports.db = Database.getInstance();
