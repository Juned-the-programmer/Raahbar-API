import cron from 'node-cron';
import { Op } from 'sequelize';
import { Otp } from '../models';

/**
 * OTP Cleanup Service
 * Deletes expired and used OTPs periodically
 */

// Delete OTPs that are either expired or already used
async function cleanupExpiredOtps(): Promise<number> {
    const result = await Otp.destroy({
        where: {
            [Op.or]: [
                { isUsed: true },
                { expiresAt: { [Op.lt]: new Date() } }
            ]
        },
        force: true // Hard delete, not soft delete
    });
    return result;
}

// Start the cleanup cron job
export function startOtpCleanupJob(): void {
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
        try {
            const deletedCount = await cleanupExpiredOtps();
            if (deletedCount > 0) {
                console.log(`[OTP Cleanup] Deleted ${deletedCount} expired/used OTPs`);
            }
        } catch (error) {
            console.error('[OTP Cleanup] Error cleaning up OTPs:', error);
        }
    });

    console.log('[OTP Cleanup] Scheduled job started - runs every 30 minutes');
}

// Manual cleanup function (can be called on-demand)
export async function manualOtpCleanup(): Promise<{ deletedCount: number }> {
    const deletedCount = await cleanupExpiredOtps();
    return { deletedCount };
}
