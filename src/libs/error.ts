import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { ACRLTError, code } from './interfaces';

// === Error Model ===
export class ModelError {
  type?: string;
  title?: string;
  detail?: string;

  static attributeTypeMap = [
    { name: 'type', baseName: 'type', type: 'string' },
    { name: 'title', baseName: 'title', type: 'string' },
    { name: 'detail', baseName: 'detail', type: 'string' },
  ];

  static getAttributeTypeMap() {
    return ModelError.attributeTypeMap;
  }
}

// === Global Error Handling Plugin ===
export const globalErrorHandler = fastifyPlugin(async function (fastify: FastifyInstance) {
  fastify.setErrorHandler((error: ACRLTError, request: FastifyRequest, reply: FastifyReply) => {
    const wrappedError = wrapError(error);

    const statusCode = isDbValidationError(error) ? 400 : normalizeStatus(error.status || error.statusCode);

    if (statusCode >= 500) {
      request.log.error(error, 'Internal server error');
    }

    return reply.status(statusCode).send(wrappedError);
  });

  fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    const notFoundError = new NotFound(`Route not found: ${request.url}`);
    request.log.info('Route not found: %s', request.url);
    return reply.status(404).send(wrapError(notFoundError));
  });
});

// === Helpers ===
export function stackAsObject(err: Error): string[] {
  return err.stack
    ? err.stack
      .trim()
      .split('\n')
      .map(line => line.trim())
    : [];
}

export function wrapError(error: ACRLTError): ModelError {
  const status = isDbValidationError(error) ? 400 : normalizeStatus(error.status || error.statusCode);
  const detail = extractDetailMessage(error);

  switch (status) {
    case 400:
      return { type: code.BAD_REQUEST, title: 'Bad Request', detail };
    case 401:
      return { type: code.UNAUTHORIZED, title: 'Unauthorized', detail };
    case 403:
      return { type: code.FORBIDDEN, title: 'Forbidden', detail };
    case 404:
      return { type: code.NOT_FOUND, title: 'Not Found', detail };
    case 409:
      return { type: code.CONFLICT, title: 'Conflict', detail };
    case 500:
    default:
      return { type: code.SERVER_ERROR, title: 'Server Error', detail };
  }
}

export function normalizeStatus(status: unknown): number {
  if (typeof status === 'number') return status;
  if (typeof status === 'string') {
    const parsed = parseInt(status, 10);
    return isNaN(parsed) ? 500 : parsed;
  }
  return 500;
}

function extractDetailMessage(error: ACRLTError): string {
  // Handle known Sequelize / SQL-related validation errors
  if (isDbValidationError(error)) {
    return parseDbValidationMessage(error);
  }

  // Default message fallback
  return error.message || getDefaultMessage(normalizeStatus(error.status || error.statusCode));
}

export function isDbValidationError(error: any): boolean {
  return (
    error?.name?.includes('Sequelize') ||
    error?.name === 'ValidationError' ||
    error?.code === 'ER_BAD_FIELD_ERROR' || // MySQL
    error?.code === '23505' || // Postgres unique_violation
    error?.code === '22P02' // Postgres invalid_text_representation
  );
}

function parseDbValidationMessage(error: any): string {
  // Sequelize
  if (error?.errors && Array.isArray(error.errors)) {
    return error.errors.map((e: any) => `${e.path || e.field}: ${e.message}`).join('; ');
  }

  // Postgres or MySQL error.message
  if (error?.message) return error.message;

  return 'Invalid input or database constraint violation.';
}

function getDefaultMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Bad Request';
    case 404:
      return 'The requested resource was not found';
    case 500:
      return 'Internal Server Error';
    default:
      return 'Unexpected Error';
  }
}

// === Custom Error Classes ===
export class BadRequest extends Error implements ACRLTError {
  name = 'BadRequest';
  status = 400;
  statusCode = code.BAD_REQUEST;
  constructor(message: string = 'Bad Request') {
    super(message);
    Object.setPrototypeOf(this, BadRequest.prototype);
  }
}

export class NotFound extends Error implements ACRLTError {
  name = 'NotFound';
  status = 404;
  statusCode = code.NOT_FOUND;
  constructor(message: string = 'Not Found') {
    super(message);
    Object.setPrototypeOf(this, NotFound.prototype);
  }
}

export class ServerError extends Error implements ACRLTError {
  name = 'ServerError';
  status = 500;
  statusCode = code.SERVER_ERROR;
  constructor(message: string = 'Internal Server Error') {
    super(message);
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

export class Unauthorized extends Error implements ACRLTError {
  name = 'Unauthorized';
  status = 401;
  statusCode = code.UNAUTHORIZED;
  constructor(message: string = 'Unauthorized') {
    super(message);
    Object.setPrototypeOf(this, Unauthorized.prototype);
  }
}

export class Forbidden extends Error implements ACRLTError {
  name = 'Forbidden';
  status = 403;
  statusCode = code.FORBIDDEN;
  constructor(message: string = 'Forbidden') {
    super(message);
    Object.setPrototypeOf(this, Forbidden.prototype);
  }
}

export class Conflict extends Error implements ACRLTError {
  name = 'Conflict';
  status = 409;
  statusCode = code.CONFLICT;
  constructor(message: string = 'Conflict') {
    super(message);
    Object.setPrototypeOf(this, Conflict.prototype);
  }
}
