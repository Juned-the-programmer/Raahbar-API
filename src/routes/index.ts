import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import payamRoutes from './payam.routes';
import quranRoutes from './quran.routes';
import authRoutes from './auth.routes';
import raahbarRoutes from './raahbar.routes';
import duaRoutes from './dua.routes';
import pillarOfIslamRoutes from './pillarOfIslam.routes';
import dashboardRoutes from './dashboard.routes';
import bookRoutes from './book.routes';

async function routes(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  // Register Auth routes
  fastify.register(authRoutes, { prefix: '/api/auth' });

  // Register Payam routes
  fastify.register(payamRoutes, { prefix: '/api/payam' });

  // Register Quran routes
  fastify.register(quranRoutes, { prefix: '/api/quran' });

  // Register Raahbar routes
  fastify.register(raahbarRoutes, { prefix: '/api/raahbar' });

  // Register Dua routes
  fastify.register(duaRoutes, { prefix: '/api/dua' });

  // Register Pillars of Islam routes
  fastify.register(pillarOfIslamRoutes, { prefix: '/api/pillars' });

  // Register Dashboard routes
  fastify.register(dashboardRoutes, { prefix: '/api/dashboard' });

  // Register Book routes
  fastify.register(bookRoutes, { prefix: '/api/book' });
}

export default routes;
