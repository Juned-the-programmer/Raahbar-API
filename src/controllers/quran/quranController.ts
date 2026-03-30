import { FastifyRequest, FastifyReply } from 'fastify';
import { Op, WhereOptions, Order } from 'sequelize';
import {
  Quran, QuranAttributes, QuranCreationAttributes,
  SurahModel, ParahModel, AyahModel, AyahTranslationModel
} from '../../models';
import { smartConvertGujarati } from '../../utils/gujarati-converter';
import { saveUploadedFile, deleteUploadedFile, UploadedFile } from '../../utils/file-handler';
import { BadRequest, NotFound } from '../../libs/error';
import {
  CreateQuranInput, UpdateQuranInput, ListQuranQuery, IdParam, SurahParam,
  ParahParam, AyahParam, ListSurahsQuery, SurahDetailsQuery,
  ParahDetailsQuery, ListAyahsQuery, AyahDetailsQuery
} from './schema';

// ============ HANDLERS ============

/**
 * List all quran entries with pagination and filtering
 */
export async function listQurans(request: FastifyRequest<{ Querystring: ListQuranQuery }>, reply: FastifyReply) {
  const query = request.query;
  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? 20, 100);
  const offset = (page - 1) * pageSize;

  // Build where clause
  const conditions: WhereOptions<QuranAttributes>[] = [{ isActive: query.isActive ?? true }];

  if (query.surahNumber) {
    conditions.push({ surahNumber: query.surahNumber });
  }

  if (query.juzNumber) {
    conditions.push({ juzNumber: query.juzNumber });
  }

  if (query.search) {
    const searchPattern = `%${query.search}%`;
    conditions.push({
      [Op.or]: [
        { title: { [Op.iLike]: searchPattern } },
        { content: { [Op.iLike]: searchPattern } },
        { arabicText: { [Op.iLike]: searchPattern } },
      ],
    } as WhereOptions<QuranAttributes>);
  }

  const where: WhereOptions<QuranAttributes> = {
    [Op.and]: conditions,
  };

  const sortBy = query.sortBy ?? 'surahNumber';
  const sortOrder = query.sortOrder ?? 'asc';
  const order: Order = [[sortBy, sortOrder.toUpperCase()]];

  const { count, rows } = await Quran.findAndCountAll({
    where,
    order,
    limit: pageSize,
    offset,
  });

  return reply.send({
    success: true,
    data: rows,
    meta: {
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    },
  });
}

/**
 * Get a single quran entry by ID
 */
export async function getQuranById(request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) {
  const { id } = request.params;

  const quran = await Quran.findOne({
    where: { id, isActive: true },
  });

  if (!quran) {
    throw new NotFound('Quran entry not found');
  }

  return reply.send({
    success: true,
    data: quran,
  });
}

/**
 * Get all ayahs for a specific surah
 */
export async function getQuranBySurah(request: FastifyRequest<{ Params: SurahParam }>, reply: FastifyReply) {
  const { surahNumber } = request.params;

  const entries = await Quran.findAll({
    where: {
      surahNumber,
      isActive: true,
    },
    order: [['ayahNumberInSurah', 'ASC']],
  });

  return reply.send({
    success: true,
    data: entries,
    meta: { total: entries.length },
  });
}

/**
 * Create a new quran entry
 */
export async function createQuran(request: FastifyRequest<{ Body: CreateQuranInput }>, reply: FastifyReply) {
  let uploadedFile: UploadedFile | undefined;
  let bodyData: CreateQuranInput;

  // Check if this is a multipart request
  if (request.isMultipart()) {
    const parts = request.parts();
    const fields: Record<string, string> = {};

    for await (const part of parts) {
      if (part.type === 'file') {
        uploadedFile = await saveUploadedFile(part, 'quran');
        request.log.info({ file: uploadedFile }, 'PDF uploaded for quran');
      } else {
        fields[part.fieldname] = part.value as string;
      }
    }

    bodyData = {
      title: fields['title'],
      content: fields['content'],
      contentType: uploadedFile ? 'pdf' : (fields['contentType'] as 'text' | 'pdf'),
      surahNumber: fields['surahNumber'] ? parseInt(fields['surahNumber'], 10) : undefined,
      surahName: fields['surahName'],
      surahNameArabic: fields['surahNameArabic'],
      ayahNumber: fields['ayahNumber'] ? parseInt(fields['ayahNumber'], 10) : undefined,
      ayahNumberInSurah: fields['ayahNumberInSurah'] ? parseInt(fields['ayahNumberInSurah'], 10) : undefined,
      juzNumber: fields['juzNumber'] ? parseInt(fields['juzNumber'], 10) : undefined,
      arabicText: fields['arabicText'],
      transliteration: fields['transliteration'],
      metadata: fields['metadata'] ? JSON.parse(fields['metadata']) : undefined,
      createdBy: fields['createdBy'],
    };
  } else {
    bodyData = request.body;
  }

  if (!bodyData.title) {
    throw new BadRequest('Title is required');
  }

  const createData: QuranCreationAttributes = {
    title: smartConvertGujarati(bodyData.title),
    content: bodyData.content ? smartConvertGujarati(bodyData.content) : null,
    originalContent: bodyData.content ?? null,
    contentType: uploadedFile ? 'pdf' : (bodyData.contentType ?? 'text'),
    pdfPath: uploadedFile?.path ?? null,
    pdfOriginalName: uploadedFile?.originalName ?? null,
    surahNumber: bodyData.surahNumber ?? null,
    surahName: bodyData.surahName ?? null,
    surahNameArabic: bodyData.surahNameArabic ?? null,
    ayahNumber: bodyData.ayahNumber ?? null,
    ayahNumberInSurah: bodyData.ayahNumberInSurah ?? null,
    juzNumber: bodyData.juzNumber ?? null,
    arabicText: bodyData.arabicText ?? null,
    transliteration: bodyData.transliteration ?? null,
    metadata: bodyData.metadata ?? null,
    createdBy: bodyData.createdBy ?? null,
    isActive: true,
  };

  const quran = await Quran.create(createData);
  request.log.info({ quranId: quran.id }, 'Quran entry created');

  return reply.status(201).send({
    success: true,
    data: quran,
  });
}

/**
 * Update a quran entry
 */
export async function updateQuran(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateQuranInput }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  let uploadedFile: UploadedFile | undefined;
  let bodyData: UpdateQuranInput;

  if (request.isMultipart()) {
    const parts = request.parts();
    const fields: Record<string, string> = {};

    for await (const part of parts) {
      if (part.type === 'file') {
        uploadedFile = await saveUploadedFile(part, 'quran');
        request.log.info({ file: uploadedFile }, 'PDF uploaded for quran update');
      } else {
        fields[part.fieldname] = part.value as string;
      }
    }

    bodyData = {
      title: fields['title'],
      content: fields['content'],
      contentType: uploadedFile ? 'pdf' : (fields['contentType'] as 'text' | 'pdf'),
      surahNumber: fields['surahNumber'] ? parseInt(fields['surahNumber'], 10) : undefined,
      surahName: fields['surahName'],
      surahNameArabic: fields['surahNameArabic'],
      ayahNumber: fields['ayahNumber'] ? parseInt(fields['ayahNumber'], 10) : undefined,
      ayahNumberInSurah: fields['ayahNumberInSurah'] ? parseInt(fields['ayahNumberInSurah'], 10) : undefined,
      juzNumber: fields['juzNumber'] ? parseInt(fields['juzNumber'], 10) : undefined,
      arabicText: fields['arabicText'],
      transliteration: fields['transliteration'],
      metadata: fields['metadata'] ? JSON.parse(fields['metadata']) : undefined,
    };
  } else {
    bodyData = request.body;
  }

  const existingQuran = await Quran.findOne({
    where: { id, isActive: true },
  });

  if (!existingQuran) {
    throw new NotFound('Quran entry not found');
  }

  // If uploading new PDF and old one exists, delete old one
  if (uploadedFile && existingQuran.pdfPath) {
    await deleteUploadedFile(existingQuran.pdfPath);
  }

  const updateData: Partial<QuranAttributes> = {};

  if (bodyData.title !== undefined) {
    updateData.title = smartConvertGujarati(bodyData.title);
  }
  if (bodyData.content !== undefined) {
    updateData.content = bodyData.content ? smartConvertGujarati(bodyData.content) : null;
    updateData.originalContent = bodyData.content;
  }
  if (bodyData.contentType !== undefined) {
    updateData.contentType = bodyData.contentType;
  }
  if (uploadedFile) {
    updateData.contentType = 'pdf';
    updateData.pdfPath = uploadedFile.path;
    updateData.pdfOriginalName = uploadedFile.originalName;
  }
  if (bodyData.surahNumber !== undefined) updateData.surahNumber = bodyData.surahNumber;
  if (bodyData.surahName !== undefined) updateData.surahName = bodyData.surahName;
  if (bodyData.surahNameArabic !== undefined) updateData.surahNameArabic = bodyData.surahNameArabic;
  if (bodyData.ayahNumber !== undefined) updateData.ayahNumber = bodyData.ayahNumber;
  if (bodyData.ayahNumberInSurah !== undefined) updateData.ayahNumberInSurah = bodyData.ayahNumberInSurah;
  if (bodyData.juzNumber !== undefined) updateData.juzNumber = bodyData.juzNumber;
  if (bodyData.arabicText !== undefined) updateData.arabicText = bodyData.arabicText;
  if (bodyData.transliteration !== undefined) updateData.transliteration = bodyData.transliteration;
  if (bodyData.metadata !== undefined) updateData.metadata = bodyData.metadata;

  await existingQuran.update(updateData);
  request.log.info({ quranId: existingQuran.id }, 'Quran entry updated');

  return reply.send({
    success: true,
    data: existingQuran,
  });
}

/**
 * Soft delete a quran entry
 */
export async function deleteQuran(request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) {
  const { id } = request.params;

  const quran = await Quran.findByPk(id);

  if (!quran || !quran.isActive) {
    throw new NotFound('Quran entry not found');
  }

  await quran.update({ isActive: false });
  request.log.info({ quranId: id }, 'Quran entry deleted (soft)');

  return reply.send({
    success: true,
    data: { message: 'Quran entry deleted successfully' },
  });
}

// ==================== NEW NORMALIZED QURAN HANDLERS ====================

/**
 * Helper to format translations as an object
 */
function formatTranslations(translations: any[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const t of translations) {
    result[t.language] = t.text;
  }
  return result;
}

/**
 * List all surahs
 */
export async function listSurahs(
  request: FastifyRequest<{ Querystring: ListSurahsQuery }>,
  reply: FastifyReply
) {
  const { revelationType } = request.query;

  const where: WhereOptions = { isActive: true };
  if (revelationType) {
    where.revelationType = revelationType;
  }

  const surahs = await SurahModel.findAll({
    where,
    order: [['surahNumber', 'ASC']],
    attributes: [
      'id', 'surahNumber', 'nameArabic', 'nameGujarati', 'nameEnglish',
      'meaningGujarati', 'meaningEnglish', 'revelationType', 'totalAyahs', 'rukuCount'
    ],
  });

  return reply.send({
    success: true,
    data: surahs.map(s => ({
      number: s.surahNumber,
      name: {
        arabic: s.nameArabic,
        gujarati: s.nameGujarati,
        english: s.nameEnglish,
      },
      meaning: {
        gujarati: s.meaningGujarati,
        english: s.meaningEnglish,
      },
      revelationType: s.revelationType,
      totalAyahs: s.totalAyahs,
      rukuCount: s.rukuCount,
    })),
    meta: { total: surahs.length },
  });
}

/**
 * Get single surah with all ayahs and translations
 */
export async function getSurahDetails(
  request: FastifyRequest<{ Params: SurahParam; Querystring: SurahDetailsQuery }>,
  reply: FastifyReply
) {
  const { surahNumber } = request.params;
  const { includeTranslations = true, languages = ['ar_translit_en', 'ar_translit_gu', 'gu', 'en'] } = request.query;

  const surah = await SurahModel.findOne({
    where: { surahNumber, isActive: true },
  });

  if (!surah) {
    throw new NotFound(`Surah ${surahNumber} not found`);
  }

  const ayahInclude: any[] = [];
  if (includeTranslations) {
    ayahInclude.push({
      model: AyahTranslationModel,
      as: 'translations',
      where: { language: { [Op.in]: languages }, isActive: true },
      required: false,
    });
  }

  const ayahs = await AyahModel.findAll({
    where: { surahId: surah.id, isActive: true },
    include: ayahInclude,
    order: [['ayahNumberInSurah', 'ASC']],
  });

  return reply.send({
    success: true,
    data: {
      surah: {
        number: surah.surahNumber,
        name: {
          arabic: surah.nameArabic,
          gujarati: surah.nameGujarati,
          english: surah.nameEnglish,
        },
        meaning: {
          gujarati: surah.meaningGujarati,
          english: surah.meaningEnglish,
        },
        revelationType: surah.revelationType,
        totalAyahs: surah.totalAyahs,
      },
      ayahs: ayahs.map(a => ({
        number: a.ayahNumber,
        numberInSurah: a.ayahNumberInSurah,
        arabic: a.arabicText,
        translations: includeTranslations ? formatTranslations(a.translations || []) : undefined,
        page: a.pageNumber,
      })),
    },
  });
}

/**
 * List all parahs
 */
export async function listParahs(
  request: FastifyRequest<{ Querystring: ParahDetailsQuery }>,
  reply: FastifyReply
) {
  const parahs = await ParahModel.findAll({
    where: { isActive: true },
    order: [['parahNumber', 'ASC']],
  });

  return reply.send({
    success: true,
    data: parahs.map(p => ({
      number: p.parahNumber,
      name: {
        arabic: p.nameArabic,
        gujarati: p.nameGujarati,
        english: p.nameEnglish,
      },
      start: {
        surah: p.startSurahNumber,
        ayah: p.startAyahNumber,
      },
      end: {
        surah: p.endSurahNumber,
        ayah: p.endAyahNumber,
      },
    })),
    meta: { total: parahs.length },
  });
}

/**
 * Get single parah with all ayahs and translations
 */
export async function getParahDetails(
  request: FastifyRequest<{ Params: ParahParam; Querystring: ParahDetailsQuery }>,
  reply: FastifyReply
) {
  const { parahNumber } = request.params;
  const { includeTranslations = true, languages = ['ar_translit_en', 'ar_translit_gu', 'gu', 'en'] } = request.query;

  const parah = await ParahModel.findOne({
    where: { parahNumber, isActive: true },
  });

  if (!parah) {
    throw new NotFound(`Parah ${parahNumber} not found`);
  }

  const ayahInclude: any[] = [
    {
      model: SurahModel,
      as: 'surah',
      attributes: ['surahNumber', 'nameArabic', 'nameGujarati', 'nameEnglish'],
    },
  ];
  if (includeTranslations) {
    ayahInclude.push({
      model: AyahTranslationModel,
      as: 'translations',
      where: { language: { [Op.in]: languages }, isActive: true },
      required: false,
    });
  }

  const ayahs = await AyahModel.findAll({
    where: { parahId: parah.id, isActive: true },
    include: ayahInclude,
    order: [['ayahNumber', 'ASC']],
  });

  return reply.send({
    success: true,
    data: {
      parah: {
        number: parah.parahNumber,
        name: {
          arabic: parah.nameArabic,
          gujarati: parah.nameGujarati,
          english: parah.nameEnglish,
        },
        start: {
          surah: parah.startSurahNumber,
          ayah: parah.startAyahNumber,
        },
        end: {
          surah: parah.endSurahNumber,
          ayah: parah.endAyahNumber,
        },
      },
      ayahs: ayahs.map(a => ({
        number: a.ayahNumber,
        numberInSurah: a.ayahNumberInSurah,
        surah: a.surah ? {
          number: a.surah.surahNumber,
          name: {
            arabic: a.surah.nameArabic,
            gujarati: a.surah.nameGujarati,
            english: a.surah.nameEnglish,
          },
        } : undefined,
        arabic: a.arabicText,
        translations: includeTranslations ? formatTranslations(a.translations || []) : undefined,
        page: a.pageNumber,
      })),
    },
  });
}

/**
 * List ayahs with pagination and optional filtering
 */
export async function listAyahs(
  request: FastifyRequest<{ Querystring: ListAyahsQuery }>,
  reply: FastifyReply
) {
  const {
    surahNumber, parahNumber, page = 1, pageSize = 50,
    search, includeTranslations = true, languages = ['ar_translit_en', 'ar_translit_gu', 'gu', 'en']
  } = request.query;

  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions: WhereOptions[] = [{ isActive: true }];

  // Filter by surah
  if (surahNumber) {
    const surah = await SurahModel.findOne({ where: { surahNumber } });
    if (surah) {
      conditions.push({ surahId: surah.id });
    } else {
      return reply.send({ success: true, data: [], meta: { total: 0, page, pageSize } });
    }
  }

  // Filter by parah
  if (parahNumber) {
    const parah = await ParahModel.findOne({ where: { parahNumber } });
    if (parah) {
      conditions.push({ parahId: parah.id });
    } else {
      return reply.send({ success: true, data: [], meta: { total: 0, page, pageSize } });
    }
  }

  // Search in Arabic text
  if (search) {
    conditions.push({
      [Op.or]: [
        { arabicText: { [Op.iLike]: `%${search}%` } },
        { arabicTextSimple: { [Op.iLike]: `%${search}%` } },
      ],
    });
  }

  const where: WhereOptions = { [Op.and]: conditions };

  const include: any[] = [
    {
      model: SurahModel,
      as: 'surah',
      attributes: ['surahNumber', 'nameArabic', 'nameGujarati', 'nameEnglish'],
    },
  ];
  if (includeTranslations) {
    include.push({
      model: AyahTranslationModel,
      as: 'translations',
      where: { language: { [Op.in]: languages }, isActive: true },
      required: false,
    });
  }

  const { count, rows: ayahs } = await AyahModel.findAndCountAll({
    where,
    include,
    order: [['ayahNumber', 'ASC']],
    limit: Math.min(pageSize, 100),
    offset,
  });

  return reply.send({
    success: true,
    data: ayahs.map(a => ({
      number: a.ayahNumber,
      numberInSurah: a.ayahNumberInSurah,
      surah: a.surah ? {
        number: a.surah.surahNumber,
        name: {
          arabic: a.surah.nameArabic,
          gujarati: a.surah.nameGujarati,
          english: a.surah.nameEnglish,
        },
      } : undefined,
      arabic: a.arabicText,
      translations: includeTranslations ? formatTranslations(a.translations || []) : undefined,
      page: a.pageNumber,
    })),
    meta: {
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    },
  });
}

/**
 * Get a single ayah by global ayah number
 */
export async function getAyahDetails(
  request: FastifyRequest<{ Params: AyahParam; Querystring: AyahDetailsQuery }>,
  reply: FastifyReply
) {
  const { ayahNumber } = request.params;
  const { includeTranslations = true, languages = ['ar_translit_en', 'ar_translit_gu', 'gu', 'en'] } = request.query;

  const include: any[] = [
    {
      model: SurahModel,
      as: 'surah',
      attributes: ['surahNumber', 'nameArabic', 'nameGujarati', 'nameEnglish', 'revelationType'],
    },
    {
      model: ParahModel,
      as: 'parah',
      attributes: ['parahNumber', 'nameArabic', 'nameGujarati', 'nameEnglish'],
    },
  ];
  if (includeTranslations) {
    include.push({
      model: AyahTranslationModel,
      as: 'translations',
      where: { language: { [Op.in]: languages }, isActive: true },
      required: false,
    });
  }

  const ayah = await AyahModel.findOne({
    where: { ayahNumber, isActive: true },
    include,
  });

  if (!ayah) {
    throw new NotFound(`Ayah ${ayahNumber} not found`);
  }

  return reply.send({
    success: true,
    data: {
      number: ayah.ayahNumber,
      numberInSurah: ayah.ayahNumberInSurah,
      surah: ayah.surah ? {
        number: ayah.surah.surahNumber,
        name: {
          arabic: ayah.surah.nameArabic,
          gujarati: ayah.surah.nameGujarati,
          english: ayah.surah.nameEnglish,
        },
        revelationType: ayah.surah.revelationType,
      } : undefined,
      parah: ayah.parah ? {
        number: ayah.parah.parahNumber,
        name: {
          arabic: ayah.parah.nameArabic,
          gujarati: ayah.parah.nameGujarati,
          english: ayah.parah.nameEnglish,
        },
      } : undefined,
      arabic: ayah.arabicText,
      translations: includeTranslations ? formatTranslations(ayah.translations || []) : undefined,
      page: ayah.pageNumber,
      hizbQuarter: ayah.hizbQuarter,
      sajdaType: ayah.sajdaType !== 'none' ? ayah.sajdaType : undefined,
    },
  });
}
