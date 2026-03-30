import { FastifySchema } from 'fastify';

// Create Pillar Schema
export const createPillarSchema: FastifySchema = {
    body: {
        type: 'object',
        required: ['titleEn', 'titleGu', 'textAr', 'transliterationEn', 'transliterationGu', 'translationEn', 'translationGu', 'descriptionEn', 'descriptionGu'],
        properties: {
            titleEn: { type: 'string', minLength: 1, maxLength: 500 },
            titleGu: { type: 'string', minLength: 1, maxLength: 500 },
            textAr: { type: 'string', minLength: 1 },
            transliterationEn: { type: 'string', minLength: 1 },
            transliterationGu: { type: 'string', minLength: 1 },
            translationEn: { type: 'string', minLength: 1 },
            translationGu: { type: 'string', minLength: 1 },
            descriptionEn: { type: 'string', minLength: 1 },
            descriptionGu: { type: 'string', minLength: 1 },
            referenceSource: { type: 'string', maxLength: 500 },
        },
    },
};

// Update Pillar Schema
export const updatePillarSchema: FastifySchema = {
    body: {
        type: 'object',
        properties: {
            titleEn: { type: 'string', minLength: 1, maxLength: 500 },
            titleGu: { type: 'string', minLength: 1, maxLength: 500 },
            textAr: { type: 'string', minLength: 1 },
            transliterationEn: { type: 'string', minLength: 1 },
            transliterationGu: { type: 'string', minLength: 1 },
            translationEn: { type: 'string', minLength: 1 },
            translationGu: { type: 'string', minLength: 1 },
            descriptionEn: { type: 'string', minLength: 1 },
            descriptionGu: { type: 'string', minLength: 1 },
            referenceSource: { type: 'string', maxLength: 500 },
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

// List Pillar Query Schema
export const listPillarSchema: FastifySchema = {
    querystring: {
        type: 'object',
        properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            search: { type: 'string' },
            sortBy: { type: 'string', enum: ['createdAt', 'titleEn', 'titleGu'], default: 'createdAt' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
    },
};

// Get Pillar by ID Schema
export const getPillarSchema: FastifySchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', format: 'uuid' },
        },
    },
};

// Delete Pillar Schema
export const deletePillarSchema: FastifySchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', format: 'uuid' },
        },
    },
};

// TypeScript interfaces for request types
export interface CreatePillarInput {
    titleEn: string;
    titleGu: string;
    textAr: string;
    transliterationEn: string;
    transliterationGu: string;
    translationEn: string;
    translationGu: string;
    descriptionEn: string;
    descriptionGu: string;
    referenceSource?: string | null;
}

export interface UpdatePillarInput {
    titleEn?: string;
    titleGu?: string;
    textAr?: string;
    transliterationEn?: string;
    transliterationGu?: string;
    translationEn?: string;
    translationGu?: string;
    descriptionEn?: string;
    descriptionGu?: string;
    referenceSource?: string | null;
}

export interface ListPillarQuery {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: 'createdAt' | 'titleEn' | 'titleGu';
    sortOrder?: 'asc' | 'desc';
}

export interface IdParam {
    id: string;
}
