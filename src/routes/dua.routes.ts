import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as duaController from '../controllers/dua/duaController';
import {
    createDuaSchema,
    updateDuaSchema,
    listDuaSchema,
    getDuaSchema,
    deleteDuaSchema,
} from '../controllers/dua/schema';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware';

async function duaRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions) {
    // ===== AUTHENTICATED ROUTES (requires valid token) =====

    // GET /dua - List all duas
    fastify.get(
        '/',
        { preHandler: verifyToken, schema: { ...listDuaSchema, tags: ['Dua'] } },
        duaController.listDuas
    );

    // GET /dua/:id - Get single dua
    fastify.get(
        '/:id',
        { preHandler: verifyToken, schema: { ...getDuaSchema, tags: ['Dua'] } },
        duaController.getDuaById
    );

    // ===== ADMIN ONLY ROUTES =====

    // POST /dua - Create new dua (admin only)
    fastify.post(
        '/',
        {
            schema: { ...createDuaSchema, tags: ['Dua'] },
            preHandler: requireAdmin,
        },
        duaController.createDua
    );

    // PUT /dua/:id - Update dua (admin only)
    fastify.put(
        '/:id',
        {
            schema: { ...updateDuaSchema, tags: ['Dua'] },
            preHandler: requireAdmin,
        },
        duaController.updateDua
    );

    // DELETE /dua/:id - Soft delete dua (admin only)
    fastify.delete(
        '/:id',
        {
            schema: { ...deleteDuaSchema, tags: ['Dua'] },
            preHandler: requireAdmin,
        },
        duaController.deleteDua
    );
}

export default duaRoutes;
