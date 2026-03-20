// ==================== PDF INDEX SCHEMA ====================

// ---- Params ----

export interface PdfIndexParam {
    id: string;
}

// ---- Query ----

export interface ListPdfIndexQuery {
    bookType?: string;
    indexType?: string;
}

// ---- Body ----

export interface CreatePdfIndexInput {
    bookType: string;
    indexType: string;
    referenceNumber?: number;
    referenceKey?: string;
    nameArabic?: string;
    nameGujarati?: string;
    nameEnglish?: string;
    pageNumber: number;
    sortOrder?: number;
}

export interface UpdatePdfIndexInput {
    bookType?: string;
    indexType?: string;
    referenceNumber?: number;
    referenceKey?: string;
    nameArabic?: string;
    nameGujarati?: string;
    nameEnglish?: string;
    pageNumber?: number;
    sortOrder?: number;
    isActive?: boolean;
}

// ---- JSON Schemas for Fastify/Swagger ----

const pdfIndexEntryProperties = {
    id: { type: 'string', format: 'uuid' },
    bookType: { type: 'string', examples: ['quran', 'hajj', 'panjsurah'] },
    indexType: { type: 'string', examples: ['surah', 'parah', 'chapter', 'topic'] },
    referenceNumber: { type: 'number', nullable: true },
    referenceKey: { type: 'string', nullable: true },
    nameArabic: { type: 'string', nullable: true },
    nameGujarati: { type: 'string', nullable: true },
    nameEnglish: { type: 'string', nullable: true },
    pageNumber: { type: 'number' },
    sortOrder: { type: 'number' },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
};

export const listPdfIndexSchema = {
    summary: 'List PDF index entries',
    description: 'Fetch page index entries for a given PDF. Filter by bookType and/or indexType.',
    querystring: {
        type: 'object',
        properties: {
            bookType: { type: 'string', description: 'e.g. quran, hajj, panjsurah' },
            indexType: { type: 'string', description: 'e.g. surah, parah, chapter, topic' },
        },
    },
    response: {
        200: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                data: { type: 'array', items: { type: 'object', properties: pdfIndexEntryProperties } },
                meta: { type: 'object', properties: { total: { type: 'number' } } },
            },
        },
    },
};

export const getPdfIndexEntrySchema = {
    summary: 'Get a single PDF index entry',
    params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
    },
    response: {
        200: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                data: { type: 'object', properties: pdfIndexEntryProperties },
            },
        },
    },
};

export const createPdfIndexSchema = {
    summary: 'Create a PDF index entry (Admin only)',
    body: {
        type: 'object',
        required: ['bookType', 'indexType', 'pageNumber'],
        properties: {
            bookType: { type: 'string' },
            indexType: { type: 'string' },
            referenceNumber: { type: 'number' },
            referenceKey: { type: 'string' },
            nameArabic: { type: 'string' },
            nameGujarati: { type: 'string' },
            nameEnglish: { type: 'string' },
            pageNumber: { type: 'number', minimum: 1 },
            sortOrder: { type: 'number', default: 0 },
        },
    },
    response: {
        201: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                data: { type: 'object', properties: pdfIndexEntryProperties },
            },
        },
    },
};

export const updatePdfIndexSchema = {
    summary: 'Update a PDF index entry (Admin only)',
    params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
    },
    body: {
        type: 'object',
        properties: {
            bookType: { type: 'string' },
            indexType: { type: 'string' },
            referenceNumber: { type: 'number' },
            referenceKey: { type: 'string' },
            nameArabic: { type: 'string' },
            nameGujarati: { type: 'string' },
            nameEnglish: { type: 'string' },
            pageNumber: { type: 'number', minimum: 1 },
            sortOrder: { type: 'number' },
            isActive: { type: 'boolean' },
        },
    },
    response: {
        200: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                data: { type: 'object', properties: pdfIndexEntryProperties },
            },
        },
    },
};

export const deletePdfIndexSchema = {
    summary: 'Delete a PDF index entry (Admin only)',
    params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
    },
    response: {
        200: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
            },
        },
    },
};
