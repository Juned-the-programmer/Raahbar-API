import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDashboardStats } from '../controllers/dashboardController';
import { requireAdmin } from '../middlewares/authMiddleware';

async function dashboardRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  // All dashboard routes require admin token
  fastify.addHook('preHandler', requireAdmin);

  // GET /api/dashboard
  fastify.get('/', getDashboardStats);
}

export default dashboardRoutes;
