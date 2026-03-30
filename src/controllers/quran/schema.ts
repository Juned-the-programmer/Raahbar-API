import { FastifySchema } from 'fastify';

// Create Quran Schema
export const createQuranSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['title'],
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 500 },
      content: { type: 'string' },
      contentType: { type: 'string', enum: ['text', 'pdf'], default: 'text' },
      surahNumber: { type: 'integer', minimum: 1, maximum: 114 },
      surahName: { type: 'string', maxLength: 255 },
      surahNameArabic: { type: 'string', maxLength: 255 },
      ayahNumber: { type: 'integer', minimum: 1 },
      ayahNumberInSurah: { type: 'integer', minimum: 1 },
      juzNumber: { type: 'integer', minimum: 1, maximum: 30 },
      arabicText: { type: 'string' },
      transliteration: { type: 'string' },
      metadata: { type: 'object' },
      createdBy: { type: 'string', maxLength: 255 },
    },
  },
};

// Update Quran Schema
export const updateQuranSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 500 },
      content: { type: 'string' },
      contentType: { type: 'string', enum: ['text', 'pdf'] },
      surahNumber: { type: 'integer', minimum: 1, maximum: 114 },
      surahName: { type: 'string', maxLength: 255 },
      surahNameArabic: { type: 'string', maxLength: 255 },
      ayahNumber: { type: 'integer', minimum: 1 },
      ayahNumberInSurah: { type: 'integer', minimum: 1 },
      juzNumber: { type: 'integer', minimum: 1, maximum: 30 },
      arabicText: { type: 'string' },
      transliteration: { type: 'string' },
      metadata: { type: 'object' },
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

// List Quran Query Schema
export const listQuranSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      surahNumber: { type: 'integer', minimum: 1, maximum: 114 },
      juzNumber: { type: 'integer', minimum: 1, maximum: 30 },
      search: { type: 'string' },
      isActive: { type: 'boolean', default: true },
      sortBy: { type: 'string', enum: ['createdAt', 'surahNumber', 'ayahNumber', 'title'], default: 'surahNumber' },
      sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
    },
  },
};

// Get Quran by ID Schema
export const getQuranSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
  },
};

// Get Quran by Surah Schema
export const getSurahSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['surahNumber'],
    properties: {
      surahNumber: { type: 'integer', minimum: 1, maximum: 114 },
    },
  },
};

// Delete Quran Schema
export const deleteQuranSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
  },
};

// TypeScript interfaces for request types
export interface CreateQuranInput {
  title: string;
  content?: string | null;
  contentType?: 'text' | 'pdf';
  surahNumber?: number | null;
  surahName?: string | null;
  surahNameArabic?: string | null;
  ayahNumber?: number | null;
  ayahNumberInSurah?: number | null;
  juzNumber?: number | null;
  arabicText?: string | null;
  transliteration?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
}

export interface UpdateQuranInput {
  title?: string;
  content?: string | null;
  contentType?: 'text' | 'pdf';
  surahNumber?: number | null;
  surahName?: string | null;
  surahNameArabic?: string | null;
  ayahNumber?: number | null;
  ayahNumberInSurah?: number | null;
  juzNumber?: number | null;
  arabicText?: string | null;
  transliteration?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ListQuranQuery {
  page?: number;
  pageSize?: number;
  surahNumber?: number;
  juzNumber?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'surahNumber' | 'ayahNumber' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface IdParam {
  id: string;
}

export interface SurahParam {
  surahNumber: number;
}

export interface ParahParam {
  parahNumber: number;
}

export interface AyahParam {
  ayahNumber: number;
}

// ==================== NEW NORMALIZED QURAN SCHEMAS ====================

// List Surahs Schema
export const listSurahsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      revelationType: { type: 'string', enum: ['meccan', 'medinan'] },
    },
  },
};

// Get Surah Details Schema
export const getSurahDetailsSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['surahNumber'],
    properties: {
      surahNumber: { type: 'integer', minimum: 1, maximum: 114 },
    },
  },
  querystring: {
    type: 'object',
    properties: {
      includeTranslations: { type: 'boolean', default: true },
      languages: {
        type: 'array',
        items: { type: 'string', enum: ['ar_translit_en', 'ar_translit_gu', 'gu', 'en'] },
        default: ['ar_translit_en', 'ar_translit_gu', 'gu', 'en']
      },
    },
  },
};

// List Parahs Schema
export const listParahsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {},
  },
};

// Get Parah Details Schema
export const getParahDetailsSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['parahNumber'],
    properties: {
      parahNumber: { type: 'integer', minimum: 1, maximum: 30 },
    },
  },
  querystring: {
    type: 'object',
    properties: {
      includeTranslations: { type: 'boolean', default: true },
      languages: {
        type: 'array',
        items: { type: 'string', enum: ['ar_translit_en', 'ar_translit_gu', 'gu', 'en'] },
        default: ['ar_translit_en', 'ar_translit_gu', 'gu', 'en']
      },
    },
  },
};

// List Ayahs Schema
export const listAyahsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      surahNumber: { type: 'integer', minimum: 1, maximum: 114 },
      parahNumber: { type: 'integer', minimum: 1, maximum: 30 },
      page: { type: 'integer', minimum: 1, default: 1 },
      pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
      search: { type: 'string' },
      includeTranslations: { type: 'boolean', default: true },
      languages: {
        type: 'array',
        items: { type: 'string', enum: ['ar_translit_en', 'ar_translit_gu', 'gu', 'en'] },
        default: ['ar_translit_en', 'ar_translit_gu', 'gu', 'en']
      },
    },
  },
};

// Get Single Ayah Schema
export const getAyahSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['ayahNumber'],
    properties: {
      ayahNumber: { type: 'integer', minimum: 1, maximum: 6236 },
    },
  },
  querystring: {
    type: 'object',
    properties: {
      includeTranslations: { type: 'boolean', default: true },
      languages: {
        type: 'array',
        items: { type: 'string', enum: ['ar_translit_en', 'ar_translit_gu', 'gu', 'en'] },
        default: ['ar_translit_en', 'ar_translit_gu', 'gu', 'en']
      },
    },
  },
};

// TypeScript interfaces for new endpoints
export interface ListSurahsQuery {
  revelationType?: 'meccan' | 'medinan';
}

export interface SurahDetailsQuery {
  includeTranslations?: boolean;
  languages?: ('ar_translit_en' | 'ar_translit_gu' | 'gu' | 'en')[];
}

export interface ParahDetailsQuery {
  includeTranslations?: boolean;
  languages?: ('ar_translit_en' | 'ar_translit_gu' | 'gu' | 'en')[];
}

export interface ListAyahsQuery {
  surahNumber?: number;
  parahNumber?: number;
  page?: number;
  pageSize?: number;
  search?: string;
  includeTranslations?: boolean;
  languages?: ('ar_translit_en' | 'ar_translit_gu' | 'gu' | 'en')[];
}

export interface AyahDetailsQuery {
  includeTranslations?: boolean;
  languages?: ('ar_translit_en' | 'ar_translit_gu' | 'gu' | 'en')[];
}
