import fastify, { FastifyInstance } from 'fastify';
import compress from '@fastify/compress';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';

import { setupLogger } from './libs/logger';
import loggingHooks from './libs/loggingHooks';
import routes from './routes';
import { globalErrorHandler } from './libs/error';

export default async function app(): Promise<FastifyInstance> {
  const app = await appSetup();
  app.log.info('Fastify instance created');
  return app;
}

export async function appSetup(): Promise<FastifyInstance> {
  const app = await fastify({
    ...setupLogger(),
  });

  /**
   * Follow the convention for plugin loading order
   * https://fastify.dev/docs/latest/Guides/Getting-Started#loading-order-of-your-plugins
   */

  // Register CORS
  await app.register(cors, {
    origin: process.env.NODE_ENV === 'development' ? true : false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    credentials: true,
  });

  // Register Helmet for security headers
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // Register multipart for file uploads
  await app.register(multipart, {
    limits: {
      fieldNameSize: 100,
      fieldSize: 100,
      fields: 10,
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
      files: 10,
      headerPairs: 2000,
      parts: 1000,
    },
  });

  // Register Swagger for API documentation
  await app.register(swagger, {
    swagger: {
      info: {
        title: 'RAHBAR API',
        description: 'API documentation for RAHBAR - Religious Content Management',
        version: '1.0.0',
      },
      host: `${process.env.SWAGGER_URL ?? 'localhost'}:${process.env.PORT ?? 3000}`,
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'Payam', description: 'Payam (messages/teachings) endpoints' },
        { name: 'Quran', description: 'Quran content endpoints' },
      ],
    },
  });

  // Register Swagger UI
  await app.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
    },
  });

  // Register compression
  app.register(compress);

  // Register static file serving
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'public'),
    prefix: '/public/',
  });

  // Register error handler
  app.register(globalErrorHandler);

  // Register logging hooks
  app.register(loggingHooks);

  // Health check route
  app.get('/health', async (request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Register routes
  app.register(routes);

  return app;
}
