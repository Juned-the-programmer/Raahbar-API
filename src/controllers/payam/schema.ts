import { FastifySchema } from 'fastify';

// Create Payam Schema
export const createPayamSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['payamNo', 'title', 'textContent'],
    properties: {
      payamNo: { type: 'integer', minimum: 1 },
      title: { type: 'string', minLength: 1, maxLength: 500 },
      date: { type: 'string', format: 'date' },
      islamicDate: { type: 'string', maxLength: 255 },
      textContent: { type: 'string', minLength: 1 },
      reference: { type: 'string', maxLength: 500 },
      status: { type: 'string', enum: ['draft', 'scheduled', 'published'] },
      publishAt: { type: 'string', format: 'date-time' },
    },
  },
};

// Update Payam Schema
export const updatePayamSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      payamNo: { type: 'integer', minimum: 1 },
      title: { type: 'string', minLength: 1, maxLength: 500 },
      date: { type: 'string', format: 'date' },
      islamicDate: { type: 'string', maxLength: 255 },
      textContent: { type: 'string', minLength: 1 },
      reference: { type: 'string', maxLength: 500 },
      status: { type: 'string', enum: ['draft', 'scheduled', 'published', 'archived'] },
      publishAt: { type: 'string', format: 'date-time' },
    },
  },
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
  },
};

// List Payam Query Schema
export const listPayamSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      search: { type: 'string' },
      sortBy: { type: 'string', enum: ['createdAt', 'payamNo', 'title', 'date'], default: 'payamNo' },
      sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
      status: { type: 'string', enum: ['draft', 'scheduled', 'published', 'archived'] },
    },
  },
};

// Get Payam by ID Schema
export const getPayamSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
  },
};

// Delete Payam Schema
export const deletePayamSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
  },
};

// TypeScript interfaces for request types
export interface CreatePayamInput {
  payamNo: number;
  title: string;
  date?: string | null;
  islamicDate?: string | null;
  textContent: string;
  reference?: string | null;
  status?: 'draft' | 'scheduled' | 'published';
  publishAt?: string;
}

export interface UpdatePayamInput {
  payamNo?: number;
  title?: string;
  date?: string | null;
  islamicDate?: string | null;
  textContent?: string;
  reference?: string | null;
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  publishAt?: string;
}

export interface ListPayamQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: 'createdAt' | 'payamNo' | 'title' | 'date';
  sortOrder?: 'asc' | 'desc';
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
}

export interface IdParam {
  id: string;
}
