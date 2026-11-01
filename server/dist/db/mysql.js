"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mysqlDb = exports.MySQLDatabase = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'template_library'
};
class MySQLDatabase {
    static instance;
    pool = null;
    isConnected = false;
    constructor() { }
    static getInstance() {
        if (!MySQLDatabase.instance) {
            MySQLDatabase.instance = new MySQLDatabase();
        }
        return MySQLDatabase.instance;
    }
    async init() {
        try {
            this.pool = promise_1.default.createPool({
                host: config.host,
                port: config.port,
                user: config.user,
                password: config.password,
                database: config.database,
                charset: 'utf8mb4',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                enableKeepAlive: true,
                keepAliveInitialDelay: 0
            });
            // Test connection
            const connection = await this.pool.getConnection();
            await connection.ping();
            connection.release();
            this.isConnected = true;
            console.log(`✅ Kết nối thành công tới MySQL Database [${config.database}] tại ${config.host}:${config.port}`);
            await this.purgeDocumentsFromInactiveTemplates();
            return true;
        }
        catch (error) {
            console.warn(`⚠️ Không thể kết nối tới MySQL (${error.message}). Sẽ sử dụng Fallback Database Storage.`);
            this.isConnected = false;
            return false;
        }
    }
    getPool() {
        return this.pool;
    }
    getStatus() {
        return this.isConnected;
    }
    // --- QUERIES CHO TEMPLATES ---
    async getTemplates(docType, categorySlug, search) {
        if (!this.pool || !this.isConnected)
            return null;
        let sql = `
      SELECT 
        t.id,
        t.doc_type,
        t.name AS title,
        t.slug,
        t.description,
        t.file_path,
        t.thumbnail_path AS thumbnailUrl,
        t.content_html,
        t.content_json,
        t.page_count,
        t.file_size,
        t.license,
        t.is_default,
        t.created_at,
        t.updated_at,
        c.name AS category,
        c.slug AS category_slug,
        GROUP_CONCAT(DISTINCT tg.name) AS tags
      FROM templates t
      JOIN categories c ON c.id = t.category_id
      LEFT JOIN template_tags tt ON tt.template_id = t.id
      LEFT JOIN tags tg ON tg.id = tt.tag_id
      WHERE t.is_active = 1
    `;
        const params = [];
        if (docType) {
            sql += ` AND t.doc_type = ?`;
            params.push(docType);
        }
        if (categorySlug && categorySlug !== 'all' && categorySlug !== 'Tất cả') {
            sql += ` AND (c.slug = ? OR c.name = ?)`;
            params.push(categorySlug, categorySlug);
        }
        if (search && search.trim() !== '') {
            sql += ` AND (t.name LIKE ? OR t.description LIKE ? OR tg.name LIKE ?)`;
            const term = `%${search.trim()}%`;
            params.push(term, term, term);
        }
        sql += ` GROUP BY t.id ORDER BY t.created_at DESC`;
        const [rows] = await this.pool.query(sql, params);
        return rows.map((r) => ({
            id: String(r.id),
            docType: r.doc_type,
            title: r.title,
            slug: r.slug,
            description: r.description,
            filePath: r.file_path,
            thumbnailUrl: r.thumbnailUrl,
            contentHtml: r.content_html || '',
            contentJson: typeof r.content_json === 'string' ? JSON.parse(r.content_json) : r.content_json,
            theme: r.content_json ? (typeof r.content_json === 'string' ? JSON.parse(r.content_json).theme : r.content_json.theme) : undefined,
            slides: r.content_json ? (typeof r.content_json === 'string' ? JSON.parse(r.content_json).slides : r.content_json.slides) : [],
            pageCount: r.page_count,
            category: r.category,
            categorySlug: r.category_slug,
            tags: r.tags ? r.tags.split(',') : [],
            license: r.license,
            isDefault: Boolean(r.is_default),
            version: 1,
            isOfficial: true,
            createdAt: r.created_at,
            updatedAt: r.updated_at
        }));
    }
    async getTemplateById(id) {
        if (!this.pool || !this.isConnected)
            return null;
        const sql = `
      SELECT 
        t.id,
        t.doc_type,
        t.name AS title,
        t.slug,
        t.description,
        t.file_path,
        t.thumbnail_path AS thumbnailUrl,
        t.content_html,
        t.content_json,
        t.page_count,
        t.license,
        t.is_default,
        t.created_at,
        t.updated_at,
        c.name AS category,
        c.slug AS category_slug,
        GROUP_CONCAT(DISTINCT tg.name) AS tags
      FROM templates t
      JOIN categories c ON c.id = t.category_id
      LEFT JOIN template_tags tt ON tt.template_id = t.id
      LEFT JOIN tags tg ON tg.id = tt.tag_id
      WHERE t.id = ? OR t.slug = ?
      GROUP BY t.id
    `;
        const [rows] = await this.pool.query(sql, [id, String(id)]);
        if (rows.length === 0)
            return null;
        const r = rows[0];
        // Lấy thêm previews từng trang / slide
        const [previews] = await this.pool.query(`SELECT page_number, image_path, caption FROM template_previews WHERE template_id = ? ORDER BY page_number ASC`, [r.id]);
        const parsedJson = typeof r.content_json === 'string' ? JSON.parse(r.content_json) : r.content_json;
        return {
            id: String(r.id),
            docType: r.doc_type,
            title: r.title,
            slug: r.slug,
            description: r.description,
            filePath: r.file_path,
            thumbnailUrl: r.thumbnailUrl,
            contentHtml: r.content_html || '',
            contentJson: parsedJson,
            theme: parsedJson?.theme,
            slides: parsedJson?.slides || [],
            previews: previews,
            pageCount: r.page_count,
            category: r.category,
            categorySlug: r.category_slug,
            tags: r.tags ? r.tags.split(',') : [],
            license: r.license,
            isDefault: Boolean(r.is_default),
            version: 1,
            isOfficial: true,
            createdAt: r.created_at,
            updatedAt: r.updated_at
        };
    }
    // --- QUERIES CHO USER DOCUMENTS (BẢN SAO) ---
    async createUserDocument(doc) {
        if (!this.pool || !this.isConnected)
            return null;
        const sql = `
      INSERT INTO documents 
        (id, template_id, doc_type, title, file_path, content_html, content_json, status, session_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'saved', ?)
    `;
        await this.pool.query(sql, [
            doc.id,
            doc.templateId || null,
            doc.docType,
            doc.title,
            doc.filePath || '',
            doc.contentHtml || null,
            doc.contentJson ? JSON.stringify(doc.contentJson) : null,
            doc.sessionToken || 'default_session'
        ]);
        return doc;
    }
    async getUserDocuments(docType) {
        if (!this.pool || !this.isConnected)
            return null;
        let sql = `
      SELECT 
        d.id,
        d.template_id AS templateId,
        d.doc_type AS docType,
        d.title,
        d.file_path AS filePath,
        d.content_html AS contentHtml,
        d.content_json AS contentJson,
        d.status,
        d.created_at AS createdAt,
        d.updated_at AS lastModified,
        t.name AS templateTitle
      FROM documents d
      INNER JOIN templates t ON t.id = d.template_id AND t.is_active = 1
      WHERE d.status != 'deleted'
    `;
        const params = [];
        if (docType) {
            sql += ` AND d.doc_type = ?`;
            params.push(docType);
        }
        sql += ` ORDER BY d.updated_at DESC`;
        const [rows] = await this.pool.query(sql, params);
        return rows.map((r) => ({
            id: r.id,
            templateId: r.templateId ? String(r.templateId) : undefined,
            templateTitle: r.templateTitle || 'Mẫu chuẩn',
            title: r.title,
            contentHtml: r.contentHtml || '',
            contentJson: typeof r.contentJson === 'string' ? JSON.parse(r.contentJson) : r.contentJson,
            theme: r.contentJson ? (typeof r.contentJson === 'string' ? JSON.parse(r.contentJson).theme : r.contentJson.theme) : undefined,
            slides: r.contentJson ? (typeof r.contentJson === 'string' ? JSON.parse(r.contentJson).slides : r.contentJson.slides) : [],
            author: 'Người dùng',
            createdAt: r.createdAt,
            lastModified: r.lastModified
        }));
    }
    async updateUserDocument(id, updates) {
        if (!this.pool || !this.isConnected)
            return null;
        const fields = [];
        const values = [];
        if (updates.title !== undefined) {
            fields.push('title = ?');
            values.push(updates.title);
        }
        if (updates.contentHtml !== undefined) {
            fields.push('content_html = ?');
            values.push(updates.contentHtml);
        }
        if (updates.contentJson !== undefined) {
            fields.push('content_json = ?');
            values.push(JSON.stringify(updates.contentJson));
        }
        if (fields.length === 0)
            return null;
        values.push(id);
        const sql = `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`;
        await this.pool.query(sql, values);
        // Lấy lại bản ghi sau update
        const [rows] = await this.pool.query(`SELECT * FROM documents WHERE id = ?`, [id]);
        if (rows.length === 0)
            return null;
        const r = rows[0];
        return {
            id: r.id,
            title: r.title,
            contentHtml: r.content_html,
            contentJson: typeof r.content_json === 'string' ? JSON.parse(r.content_json) : r.content_json,
            lastModified: r.updated_at
        };
    }
    async deleteUserDocument(id) {
        if (!this.pool || !this.isConnected)
            return null;
        await this.pool.query(`UPDATE documents SET status = 'deleted' WHERE id = ?`, [id]);
        return true;
    }
    // --- ẨN TEMPLATE (SOFT DELETE) ---
    async deactivateTemplate(id) {
        if (!this.pool || !this.isConnected)
            return false;
        const sql = `UPDATE templates SET is_active = 0 WHERE (id = ? OR slug = ?)`;
        const [result] = await this.pool.query(sql, [id, String(id)]);
        // Đồng thời cập nhật trạng thái đã xóa cho các tài liệu cá nhân thuộc template bị ẩn/xóa
        try {
            await this.pool.query(`
        UPDATE documents 
        SET status = 'deleted' 
        WHERE template_id IN (
          SELECT id FROM (SELECT id FROM templates WHERE id = ? OR slug = ? OR is_active = 0) AS t
        )
      `, [id, String(id)]);
        }
        catch (err) {
            console.warn('MySQL deactivateTemplate documents update error:', err);
        }
        return result.affectedRows > 0;
    }
    async purgeDocumentsFromInactiveTemplates() {
        if (!this.pool || !this.isConnected)
            return 0;
        try {
            const [res] = await this.pool.query(`
        UPDATE documents 
        SET status = 'deleted' 
        WHERE status != 'deleted' 
          AND (template_id IS NULL OR template_id NOT IN (SELECT id FROM templates WHERE is_active = 1))
      `);
            return res.affectedRows || 0;
        }
        catch (err) {
            console.warn('MySQL purgeDocumentsFromInactiveTemplates error:', err);
            return 0;
        }
    }
    // --- TẠO TEMPLATE MỚI VÀO MYSQL ---
    async createTemplate(data) {
        if (!this.pool || !this.isConnected)
            return null;
        const conn = await this.pool.getConnection();
        try {
            await conn.beginTransaction();
            // 1. Tìm hoặc tạo category
            const catSlug = data.categoryName
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            const [catRows] = await conn.query(`SELECT id FROM categories WHERE doc_type = ? AND name = ? LIMIT 1`, [data.docType, data.categoryName]);
            let categoryId;
            if (catRows.length > 0) {
                categoryId = catRows[0].id;
            }
            else {
                const [catInsert] = await conn.query(`INSERT INTO categories (doc_type, name, slug, sort_order) VALUES (?, ?, ?, 0)`, [data.docType, data.categoryName, catSlug]);
                categoryId = catInsert.insertId;
            }
            // 2. Đảm bảo slug duy nhất
            let slug = data.slug;
            const [slugCheck] = await conn.query(`SELECT id FROM templates WHERE slug = ? LIMIT 1`, [slug]);
            if (slugCheck.length > 0) {
                slug = `${slug}-${Date.now()}`;
            }
            // 3. Insert template
            const [result] = await conn.query(`INSERT INTO templates 
          (doc_type, name, slug, category_id, description, file_path, thumbnail_path, content_html, content_json, page_count, license, is_active, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`, [
                data.docType,
                data.name,
                slug,
                categoryId,
                data.description,
                data.filePath,
                data.thumbnailPath,
                data.contentHtml || null,
                data.contentJson ? JSON.stringify(data.contentJson) : null,
                data.pageCount || 1,
                data.license || 'Người dùng tạo'
            ]);
            const templateId = result.insertId;
            // 4. Upsert tags
            if (data.tags && data.tags.length > 0) {
                for (const tagName of data.tags) {
                    if (!tagName.trim())
                        continue;
                    const [tagRow] = await conn.query(`INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`, [tagName.trim()]);
                    const tagId = tagRow.insertId;
                    await conn.query(`INSERT IGNORE INTO template_tags (template_id, tag_id) VALUES (?, ?)`, [templateId, tagId]);
                }
            }
            await conn.commit();
            return templateId;
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
    }
}
exports.MySQLDatabase = MySQLDatabase;
exports.mysqlDb = MySQLDatabase.getInstance();
