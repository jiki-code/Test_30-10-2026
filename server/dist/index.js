"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const mysql_1 = require("./db/mysql");
const PORT = process.env.PORT || 5001;
async function startServer() {
    // Thử kết nối MySQL
    await mysql_1.mysqlDb.init();
    app_1.default.listen(PORT, () => {
        console.log(`=================================================`);
        console.log(`🚀 Office Template Suite Backend Server Running!`);
        console.log(`📡 URL: http://localhost:${PORT}`);
        console.log(`📑 Health: http://localhost:${PORT}/api/health`);
        console.log(`🗄️ Database: ${mysql_1.mysqlDb.getStatus() ? 'MySQL 8.0 (Active)' : 'Local File Store (Fallback)'}`);
        console.log(`=================================================`);
    });
}
startServer();
