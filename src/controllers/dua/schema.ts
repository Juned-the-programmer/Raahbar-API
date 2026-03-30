import { FastifySchema } from 'fastify';

// Create Dua Schema
export const createDuaSchema: FastifySchema = {
    body: {
        type: 'object',
        required: ['titleEn', 'titleGu', 'textAr', 'transliterationEn', 'transliterationGu', 'translationEn', 'translationGu'],
        properties: {
            titleEn: { type: 'string', minLength: 1, maxLength: 500 },
            titleGu: { type: 'string', minLength: 1, maxLength: 500 },
            textAr: { type: 'string', minLength: 1 },
            transliterationEn: { type: 'string', minLength: 1 },
            transliterationGu: { type: 'string', minLength: 1 },
            translationEn: { type: 'string', minLength: 1 },
            translationGu: { type: 'string', minLength: 1 },
            referenceSource: { type: 'string', maxLength: 500 },
            referenceBookName: { type: 'string', maxLength: 500 },
            referenceHadithNumber: { type: 'string', maxLength: 100 },
        },
    },
};

// Update Dua Schema
export const updateDuaSchema: FastifySchema = {
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
            referenceSource: { type: 'string', maxLength: 500 },
            referenceBookName: { type: 'string', maxLength: 500 },
            referenceHadithNumber: { type: 'string', maxLength: 100 },
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

// List Dua Query Schema
export const listDuaSchema: FastifySchema = {
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

// Get Dua by ID Schema
export const getDuaSchema: FastifySchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', format: 'uuid' },
        },
    },
};

// Delete Dua Schema
export const deleteDuaSchema: FastifySchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', format: 'uuid' },
        },
    },
};

// TypeScript interfaces for request types
export interface CreateDuaInput {
    titleEn: string;
    titleGu: string;
    textAr: string;
    transliterationEn: string;
    transliterationGu: string;
    translationEn: string;
    translationGu: string;
    referenceSource?: string | null;
    referenceBookName?: string | null;
    referenceHadithNumber?: string | null;
}

export interface UpdateDuaInput {
    titleEn?: string;
    titleGu?: string;
    textAr?: string;
    transliterationEn?: string;
    transliterationGu?: string;
    translationEn?: string;
    translationGu?: string;
    referenceSource?: string | null;
    referenceBookName?: string | null;
    referenceHadithNumber?: string | null;
}

export interface ListDuaQuery {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: 'createdAt' | 'titleEn' | 'titleGu';
    sortOrder?: 'asc' | 'desc';
}

export interface IdParam {
    id: string;
}
