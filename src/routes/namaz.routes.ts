import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as namazController from '../controllers/namaz/namazController';
import { prayerTimesSchema, weeklyPrayerTimesSchema } from '../controllers/namaz/schema';
import { verifyToken } from '../middlewares/authMiddleware';

async function namazRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions) {
    // GET /namaz/times - Get prayer times for a specific date and location (authenticated)
    fastify.get(
        '/times',
        { schema: { ...prayerTimesSchema, tags: ['Namaz'] }, preHandler: verifyToken },
        namazController.getPrayerTimes
    );

    // GET /namaz/times/weekly - Get prayer times for a week (authenticated)
    fastify.get(
        '/times/weekly',
        { schema: { ...weeklyPrayerTimesSchema, tags: ['Namaz'] }, preHandler: verifyToken },
        namazController.getWeeklyPrayerTimes
    );

    // GET /namaz/methods - Get available calculation methods (authenticated)
    fastify.get(
        '/methods',
        { schema: { tags: ['Namaz'] }, preHandler: verifyToken },
        namazController.getCalculationMethods
    );
}

export default namazRoutes;
