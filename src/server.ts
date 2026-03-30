require('dotenv').config();
import app from './app';
import { database } from './models';
import { ensureUploadDirectory } from './utils/file-handler';
import { startOtpCleanupJob } from './services/otpCleanupService';
import { payamScheduler } from './services/payamScheduler';

const port = Number(process.env.PORT) ?? 3000;

async function loadServer() {
  const server = await app();

  try {
    // Ensure upload directory exists
    await ensureUploadDirectory();

    // Start the server
    await server.ready();

    await server.listen({ port, host: '0.0.0.0' });
    await database.connectWithRetry(3);

    // Start OTP cleanup scheduled job (runs every 30 minutes)
    startOtpCleanupJob();

    // Start Payam scheduler (runs every 5 minutes)
    payamScheduler.start();

    server.logInfo(`Getting requests now on port ${port}`);
  } catch (err: any) {
    server.logError('Server failed to start', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

void loadServer();

