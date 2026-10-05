import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Department Activity & Workflow Management System API`);
  console.log(`📡 Server listening on: http://localhost:${env.PORT}`);
  console.log(`📚 Swagger API Docs:    http://localhost:${env.PORT}/api-docs`);
  console.log(`🌱 Environment:         ${env.NODE_ENV}`);
  console.log(`=======================================================`);
});

const handleShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('✅ PostgreSQL connection closed. Process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
