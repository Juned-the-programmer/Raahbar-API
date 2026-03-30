import * as cron from 'node-cron';
import { Op } from 'sequelize';
import { Payam } from '../models';

/**
 * Scheduling service for automatically publishing scheduled payams
 * Runs every 5 minutes to check for payams that need to be published
 */
class PayamScheduler {
    private cronJob: cron.ScheduledTask | null = null;

    /**
     * Start the scheduling service
     * Runs every 5 minutes
     */
    start() {
        if (this.cronJob) {
            console.log('⚠️  Payam scheduler is already running');
            return;
        }

        // Run every 5 minutes
        this.cronJob = cron.schedule('*/5 * * * *', async () => {
            await this.publishScheduledPayams();
        });

        console.log('✅ Payam scheduler started - checking every 5 minutes');
    }

    /**
     * Stop the scheduling service
     */
    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
            console.log('🛑 Payam scheduler stopped');
        }
    }

    /**
     * Manually trigger the publishing process
     * Useful for testing or manual execution
     */
    async runNow() {
        console.log('🔄 Manually triggering payam publishing check...');
        await this.publishScheduledPayams();
    }

    /**
     * Core logic: Find and publish all scheduled payams whose time has come
     */
    private async publishScheduledPayams() {
        try {
            const now = new Date();

            // Find all scheduled payams where publishAt time has passed
            const scheduledPayams = await Payam.findAll({
                where: {
                    status: 'scheduled',
                    publishAt: {
                        [Op.lte]: now,
                    },
                },
            });

            if (scheduledPayams.length === 0) {
                console.log('📭 No payams to publish at this time');
                return;
            }

            console.log(`📬 Found ${scheduledPayams.length} payam(s) ready to publish`);

            // Publish each payam
            for (const payam of scheduledPayams) {
                try {
                    await payam.update({
                        status: 'published',
                        publishedAt: now,
                    });

                    console.log(
                        `✅ Published payam #${payam.payamNo} - "${payam.title}" (scheduled for ${payam.publishAt})`
                    );
                } catch (error: any) {
                    console.error(
                        `❌ Failed to publish payam #${payam.payamNo}:`,
                        error.message
                    );
                }
            }

            console.log(`✨ Successfully published ${scheduledPayams.length} payam(s)`);
        } catch (error: any) {
            console.error('❌ Error in publishScheduledPayams:', error.message);
        }
    }
}

// Export singleton instance
export const payamScheduler = new PayamScheduler();
