import app from './app';
import { mysqlDb } from './db/mysql';

const PORT = process.env.PORT || 5001;

async function startServer() {
  // Thử kết nối MySQL
  await mysqlDb.init();

  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 Office Template Suite Backend Server Running!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📑 Health: http://localhost:${PORT}/api/health`);
    console.log(`🗄️ Database: ${mysqlDb.getStatus() ? 'MySQL 8.0 (Active)' : 'Local File Store (Fallback)'}`);
    console.log(`=================================================`);
  });
}

startServer();
