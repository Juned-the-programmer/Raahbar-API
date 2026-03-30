import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { isDbValidationError, normalizeStatus } from './error';

declare module 'fastify' {
  interface FastifyInstance {
    logDebug: (message: string, meta?: Record<string, any>) => void;
    logError: (message: string, meta?: Record<string, any>) => void;
    logInfo: (message: string, meta?: Record<string, any>) => void;
  }
}

const isProd = process.env.NODE_ENV === 'production';

async function addLoggingHooks(app: FastifyInstance): Promise<void> {
  // Track start time per request
  app.addHook('onRequest', async (req: FastifyRequest) => {
    (req as any)._startTime = Date.now();

    app.log.info(
      {
        requestId: req.id,
        method: req.method,
        url: req.url,
        headers: req.headers,
      },
      'Incoming request'
    );
  });

  app.addHook('onSend', async (req: FastifyRequest, _reply: FastifyReply, payload: object) => {
    req.log.debug({ payload }, 'Sending response payload');
  });

  app.addHook('onResponse', async (req: FastifyRequest, res: FastifyReply) => {
    const start = (req as any)._startTime;
    const duration = typeof start === 'number' ? Date.now() - start : undefined;

    req.log.info(
      {
        requestId: req.id,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: duration !== undefined ? `${duration}ms` : undefined,
      },
      'Request completed'
    );
  });

  app.addHook('onError', async (req: FastifyRequest, _res: FastifyReply, err: any) => {
    const statusCode = isDbValidationError(err) ? 400 : normalizeStatus(err.status || err.statusCode);

    const baseMeta = {
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode,
      message: err.message,
      name: err.name,
    };

    if (statusCode >= 500) {
      req.log.error(
        {
          ...baseMeta,
          stack: !isProd ? err.stack : undefined,
        },
        'Internal server error'
      );
    } else {
      req.log.warn(baseMeta, 'Client error');
    }
  });

  app.addHook('onRequestAbort', async (req: FastifyRequest) => {
    req.log.warn(
      {
        requestId: req.id,
        method: req.method,
        url: req.url,
      },
      'Request was aborted by the client'
    );
  });

  // Custom log methods for easy debugging
  app.decorate('logDebug', (message: string, meta: Record<string, any> = {}) => {
    app.log.debug({ ...meta }, message);
  });

  app.decorate('logInfo', (message: string, meta: Record<string, any> = {}) => {
    app.log.info({ ...meta }, message);
  });

  app.decorate('logError', (message: string, meta: Record<string, any> = {}) => {
    app.log.error({ ...meta }, message);
  });
}

export default fastifyPlugin(addLoggingHooks);
