import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as payamController from '../controllers/payam/payamController';
import {
  createPayamSchema,
  updatePayamSchema,
  listPayamSchema,
  getPayamSchema,
  deletePayamSchema,
} from '../controllers/payam/schema';
import { requireAdmin, verifyToken } from '../middlewares/authMiddleware';

async function payamRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  // ===== AUTHENTICATED ROUTES (require login) =====

  // GET /payam - List all payams (authenticated users)
  fastify.get(
    '/',
    {
      schema: { ...listPayamSchema, tags: ['Payam'] },
      preHandler: verifyToken,
    },
    payamController.listPayams
  );

  // GET /payam/:id - Get single payam (authenticated users)
  fastify.get(
    '/:id',
    {
      schema: { ...getPayamSchema, tags: ['Payam'] },
      preHandler: verifyToken,
    },
    payamController.getPayamById
  );

  // ===== ADMIN ONLY ROUTES =====

  // POST /payam - Create new payam (admin only)
  fastify.post(
    '/',
    {
      schema: { ...createPayamSchema, tags: ['Payam'] },
      preHandler: requireAdmin,
    },
    payamController.createPayam
  );

  // PUT /payam/:id - Update payam (admin only)
  fastify.put(
    '/:id',
    {
      schema: { ...updatePayamSchema, tags: ['Payam'] },
      preHandler: requireAdmin,
    },
    payamController.updatePayam
  );

  // DELETE /payam/:id - Soft delete payam (admin only)
  fastify.delete(
    '/:id',
    {
      schema: { ...deletePayamSchema, tags: ['Payam'] },
      preHandler: requireAdmin,
    },
    payamController.deletePayam
  );
}

export default payamRoutes;
