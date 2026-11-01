"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const documentRoutes_1 = __importDefault(require("./routes/documentRoutes"));
const presentationRoutes_1 = __importDefault(require("./routes/presentationRoutes"));
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Office Template Suite API'
    });
});
app.use('/api/documents', documentRoutes_1.default);
app.use('/api/presentations', presentationRoutes_1.default);
// Phục vụ Client Static Build nếu có (giúp chạy độc lập 1 port tiện lợi)
const clientDistPath = path_1.default.resolve(__dirname, '../../client/dist');
if (fs_1.default.existsSync(clientDistPath)) {
    app.use(express_1.default.static(clientDistPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
    });
}
// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ nội bộ',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
exports.default = app;
