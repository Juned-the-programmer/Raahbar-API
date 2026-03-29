import { FastifySchema } from 'fastify';

// ==================== SURAH ====================

export const createSurahSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['surahNumber', 'nameArabic', 'nameGujarati', 'nameEnglish', 'revelationType', 'totalAyahs', 'orderInMushaf'],
    properties: {
      surahNumber: { type: 'integer', minimum: 1, maximum: 114 },
      nameArabic: { type: 'string', minLength: 1, maxLength: 255 },
      nameGujarati: { type: 'string', minLength: 1, maxLength: 255 },
      nameEnglish: { type: 'string', minLength: 1, maxLength: 255 },
      meaningGujarati: { type: 'string', maxLength: 500 },
      meaningEnglish: { type: 'string', maxLength: 500 },
      revelationType: { type: 'string', enum: ['meccan', 'medinan'] },
      totalAyahs: { type: 'integer', minimum: 1 },
      orderInMushaf: { type: 'integer', minimum: 1, maximum: 114 },
      rukuCount: { type: 'integer', minimum: 0 },
    },
  },
};

export const updateSurahSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['surahNumber'],
    properties: {
      surahNumber: { type: 'integer', minimum: 1, maximum: 114 },
    },
  },
  body: {
    type: 'object',
    properties: {
      nameArabic: { type: 'string', minLength: 1, maxLength: 255 },
      nameGujarati: { type: 'string', minLength: 1, maxLength: 255 },
      nameEnglish: { type: 'string', minLength: 1, maxLength: 255 },
      meaningGujarati: { type: 'string', maxLength: 500 },
      meaningEnglish: { type: 'string', maxLength: 500 },
      revelationType: { type: 'string', enum: ['meccan', 'medinan'] },
      totalAyahs: { type: 'integer', minimum: 1 },
      orderInMushaf: { type: 'integer', minimum: 1, maximum: 114 },
      rukuCount: { type: 'integer', minimum: 0 },
    },
  },
};

export const deleteSurahSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['surahNumber'],
    properties: {
      surahNumber: { type: 'integer', minimum: 1, maximum: 114 },
    },
  },
};

// ==================== PARAH ====================

export const createParahSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['parahNumber', 'nameArabic', 'nameGujarati', 'nameEnglish', 'startSurahNumber', 'startAyahNumber', 'endSurahNumber', 'endAyahNumber'],
    properties: {
      parahNumber: { type: 'integer', minimum: 1, maximum: 30 },
      nameArabic: { type: 'string', minLength: 1, maxLength: 255 },
      nameGujarati: { type: 'string', minLength: 1, maxLength: 255 },
      nameEnglish: { type: 'string', minLength: 1, maxLength: 255 },
      startSurahNumber: { type: 'integer', minimum: 1, maximum: 114 },
      startAyahNumber: { type: 'integer', minimum: 1 },
      endSurahNumber: { type: 'integer', minimum: 1, maximum: 114 },
      endAyahNumber: { type: 'integer', minimum: 1 },
    },
  },
};

export const updateParahSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['parahNumber'],
    properties: {
      parahNumber: { type: 'integer', minimum: 1, maximum: 30 },
    },
  },
  body: {
    type: 'object',
    properties: {
      nameArabic: { type: 'string', minLength: 1, maxLength: 255 },
      nameGujarati: { type: 'string', minLength: 1, maxLength: 255 },
      nameEnglish: { type: 'string', minLength: 1, maxLength: 255 },
      startSurahNumber: { type: 'integer', minimum: 1, maximum: 114 },
      startAyahNumber: { type: 'integer', minimum: 1 },
      endSurahNumber: { type: 'integer', minimum: 1, maximum: 114 },
      endAyahNumber: { type: 'integer', minimum: 1 },
    },
  },
};

export const deleteParahSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['parahNumber'],
    properties: {
      parahNumber: { type: 'integer', minimum: 1, maximum: 30 },
    },
  },
};

// ==================== AYAH ====================

export const createAyahSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['surahNumber', 'parahNumber', 'ayahNumber', 'ayahNumberInSurah', 'arabicText'],
    properties: {
      surahNumber: { type: 'integer', minimum: 1, maximum: 114 },
      parahNumber: { type: 'integer', minimum: 1, maximum: 30 },
      ayahNumber: { type: 'integer', minimum: 1, maximum: 6236 },
      ayahNumberInSurah: { type: 'integer', minimum: 1 },
      arabicText: { type: 'string', minLength: 1 },
      arabicTextSimple: { type: 'string' },
      pageNumber: { type: 'integer', minimum: 1, maximum: 604 },
      hizbQuarter: { type: 'integer', minimum: 1, maximum: 240 },
      sajdaType: { type: 'string', enum: ['none', 'recommended', 'obligatory'] },
      translations: {
        type: 'array',
        items: {
          type: 'object',
          required: ['language', 'text'],
          properties: {
            language: { type: 'string', enum: ['ar_translit_en', 'ar_translit_gu', 'gu', 'en'] },
            text: { type: 'string', minLength: 1 },
            translatorName: { type: 'string', maxLength: 255 },
          },
        },
      },
    },
  },
};

export const updateAyahSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['ayahNumber'],
    properties: {
      ayahNumber: { type: 'integer', minimum: 1, maximum: 6236 },
    },
  },
  body: {
    type: 'object',
    properties: {
      surahNumber: { type: 'integer', minimum: 1, maximum: 114 },
      parahNumber: { type: 'integer', minimum: 1, maximum: 30 },
      ayahNumberInSurah: { type: 'integer', minimum: 1 },
      arabicText: { type: 'string', minLength: 1 },
      arabicTextSimple: { type: 'string' },
      pageNumber: { type: 'integer', minimum: 1, maximum: 604 },
      hizbQuarter: { type: 'integer', minimum: 1, maximum: 240 },
      sajdaType: { type: 'string', enum: ['none', 'recommended', 'obligatory'] },
    },
  },
};

export const deleteAyahSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['ayahNumber'],
    properties: {
      ayahNumber: { type: 'integer', minimum: 1, maximum: 6236 },
    },
  },
};

export const updateAyahTranslationSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['ayahNumber', 'language'],
    properties: {
      ayahNumber: { type: 'integer', minimum: 1, maximum: 6236 },
      language: { type: 'string', enum: ['ar_translit_en', 'ar_translit_gu', 'gu', 'en'] },
    },
  },
  body: {
    type: 'object',
    required: ['text'],
    properties: {
      text: { type: 'string', minLength: 1 },
      translatorName: { type: 'string', maxLength: 255 },
    },
  },
};

// ==================== GET SCHEMAS ====================

export const listSurahsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      revelationType: { type: 'string', enum: ['meccan', 'medinan'] },
    },
  },
};

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
        default: ['ar_translit_en', 'ar_translit_gu', 'gu', 'en'],
      },
    },
  },
};

export const listParahsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {},
  },
};

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
        default: ['ar_translit_en', 'ar_translit_gu', 'gu', 'en'],
      },
    },
  },
};

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
        default: ['ar_translit_en', 'ar_translit_gu', 'gu', 'en'],
      },
    },
  },
};

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
        default: ['ar_translit_en', 'ar_translit_gu', 'gu', 'en'],
      },
    },
  },
};

// ==================== TYPESCRIPT INTERFACES ====================

export interface CreateSurahInput {
  surahNumber: number;
  nameArabic: string;
  nameGujarati: string;
  nameEnglish: string;
  meaningGujarati?: string;
  meaningEnglish?: string;
  revelationType: 'meccan' | 'medinan';
  totalAyahs: number;
  orderInMushaf: number;
  rukuCount?: number;
}

export interface UpdateSurahInput extends Partial<Omit<CreateSurahInput, 'surahNumber'>> { }

export interface CreateParahInput {
  parahNumber: number;
  nameArabic: string;
  nameGujarati: string;
  nameEnglish: string;
  startSurahNumber: number;
  startAyahNumber: number;
  endSurahNumber: number;
  endAyahNumber: number;
}

export interface UpdateParahInput extends Partial<Omit<CreateParahInput, 'parahNumber'>> { }

export interface TranslationInput {
  language: 'ar_translit_en' | 'ar_translit_gu' | 'gu' | 'en';
  text: string;
  translatorName?: string;
}

export interface CreateAyahInput {
  surahNumber: number;
  parahNumber: number;
  ayahNumber: number;
  ayahNumberInSurah: number;
  arabicText: string;
  arabicTextSimple?: string;
  pageNumber?: number;
  hizbQuarter?: number;
  sajdaType?: 'none' | 'recommended' | 'obligatory';
  translations?: TranslationInput[];
}

export interface UpdateAyahInput extends Partial<Omit<CreateAyahInput, 'ayahNumber' | 'translations'>> { }

export interface UpdateAyahTranslationInput {
  text: string;
  translatorName?: string;
}

export interface SurahParam { surahNumber: number; }
export interface ParahParam { parahNumber: number; }
export interface AyahParam { ayahNumber: number; }
export interface AyahTranslationParam { ayahNumber: number; language: string; }
export interface ListSurahsQuery { revelationType?: 'meccan' | 'medinan'; }
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
