import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as pillarOfIslamController from '../controllers/pillarOfIslam/pillarOfIslamController';
import {
    createPillarSchema,
    updatePillarSchema,
    listPillarSchema,
    getPillarSchema,
    deletePillarSchema,
} from '../controllers/pillarOfIslam/schema';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware';

async function pillarOfIslamRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions) {
    // ===== AUTHENTICATED ROUTES (requires valid token) =====

    // GET /pillars - List all pillars
    fastify.get(
        '/',
        { preHandler: verifyToken, schema: { ...listPillarSchema, tags: ['Pillars of Islam'] } },
        pillarOfIslamController.listPillars
    );

    // GET /pillars/:id - Get single pillar
    fastify.get(
        '/:id',
        { preHandler: verifyToken, schema: { ...getPillarSchema, tags: ['Pillars of Islam'] } },
        pillarOfIslamController.getPillarById
    );

    // ===== ADMIN ONLY ROUTES =====

    // POST /pillars - Create new pillar (admin only)
    fastify.post(
        '/',
        {
            schema: { ...createPillarSchema, tags: ['Pillars of Islam'] },
            preHandler: requireAdmin,
        },
        pillarOfIslamController.createPillar
    );

    // PUT /pillars/:id - Update pillar (admin only)
    fastify.put(
        '/:id',
        {
            schema: { ...updatePillarSchema, tags: ['Pillars of Islam'] },
            preHandler: requireAdmin,
        },
        pillarOfIslamController.updatePillar
    );

    // DELETE /pillars/:id - Soft delete pillar (admin only)
    fastify.delete(
        '/:id',
        {
            schema: { ...deletePillarSchema, tags: ['Pillars of Islam'] },
            preHandler: requireAdmin,
        },
        pillarOfIslamController.deletePillar
    );
}

export default pillarOfIslamRoutes;
