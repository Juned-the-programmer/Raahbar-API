import { FastifyRequest, FastifyReply } from 'fastify';
import { Op, WhereOptions } from 'sequelize';
import {
  SurahModel, ParahModel, AyahModel, AyahTranslationModel, sequelize,
} from '../../models';
import { NotFound, BadRequest } from '../../libs/error';
import {
  CreateSurahInput, UpdateSurahInput,
  CreateParahInput, UpdateParahInput,
  CreateAyahInput, UpdateAyahTranslationInput,
  SurahParam, ParahParam, AyahParam, AyahTranslationParam,
  ListSurahsQuery, SurahDetailsQuery,
  ParahDetailsQuery, ListAyahsQuery, AyahDetailsQuery,
} from './schema';

// ==================== HELPERS ====================

function formatTranslations(translations: any[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const t of translations) {
    result[t.language] = t.text;
  }
  return result;
}

// ==================== SURAH HANDLERS ====================

/**
 * List all surahs
 */
export async function listSurahs(
  request: FastifyRequest<{ Querystring: ListSurahsQuery }>,
  reply: FastifyReply
) {
  const { revelationType } = request.query;

  const where: WhereOptions = { isActive: true };
  if (revelationType) where.revelationType = revelationType;

  const surahs = await SurahModel.findAll({
    where,
    order: [['surahNumber', 'ASC']],
    attributes: [
      'id', 'surahNumber', 'nameArabic', 'nameGujarati', 'nameEnglish',
      'meaningGujarati', 'meaningEnglish', 'revelationType', 'totalAyahs', 'rukuCount',
    ],
  });

  return reply.send({
    success: true,
    data: surahs.map(s => ({
      number: s.surahNumber,
      name: { arabic: s.nameArabic, gujarati: s.nameGujarati, english: s.nameEnglish },
      meaning: { gujarati: s.meaningGujarati, english: s.meaningEnglish },
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

  const surah = await SurahModel.findOne({ where: { surahNumber, isActive: true } });
  if (!surah) throw new NotFound(`Surah ${surahNumber} not found`);

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
        name: { arabic: surah.nameArabic, gujarati: surah.nameGujarati, english: surah.nameEnglish },
        meaning: { gujarati: surah.meaningGujarati, english: surah.meaningEnglish },
        revelationType: surah.revelationType,
        totalAyahs: surah.totalAyahs,
        rukuCount: surah.rukuCount,
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
 * Create a new Surah (Admin only)
 */
export async function createSurah(
  request: FastifyRequest<{ Body: CreateSurahInput }>,
  reply: FastifyReply
) {
  const body = request.body;

  const existing = await SurahModel.findOne({ where: { surahNumber: body.surahNumber } });
  if (existing) throw new BadRequest(`Surah ${body.surahNumber} already exists`);

  const surah = await SurahModel.create({
    surahNumber: body.surahNumber,
    nameArabic: body.nameArabic,
    nameGujarati: body.nameGujarati,
    nameEnglish: body.nameEnglish,
    meaningGujarati: body.meaningGujarati ?? null,
    meaningEnglish: body.meaningEnglish ?? null,
    revelationType: body.revelationType,
    totalAyahs: body.totalAyahs,
    orderInMushaf: body.orderInMushaf,
    rukuCount: body.rukuCount ?? 0,
  });

  return reply.status(201).send({ success: true, data: surah });
}

/**
 * Update a Surah (Admin only)
 */
export async function updateSurah(
  request: FastifyRequest<{ Params: SurahParam; Body: UpdateSurahInput }>,
  reply: FastifyReply
) {
  const { surahNumber } = request.params;
  const body = request.body;

  const surah = await SurahModel.findOne({ where: { surahNumber, isActive: true } });
  if (!surah) throw new NotFound(`Surah ${surahNumber} not found`);

  await surah.update(body);
  return reply.send({ success: true, data: surah });
}

/**
 * Delete a Surah (Admin only)
 */
export async function deleteSurah(
  request: FastifyRequest<{ Params: SurahParam }>,
  reply: FastifyReply
) {
  const { surahNumber } = request.params;
  const surah = await SurahModel.findOne({ where: { surahNumber, isActive: true } });
  if (!surah) throw new NotFound(`Surah ${surahNumber} not found`);

  // We do soft delete by default with paranoid models
  await surah.update({ isActive: false });
  await surah.destroy();

  return reply.send({ success: true, message: `Surah ${surahNumber} deleted successfully` });
}

// ==================== PARAH HANDLERS ====================

/**
 * List all parahs
 */
export async function listParahs(
  request: FastifyRequest,
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
      name: { arabic: p.nameArabic, gujarati: p.nameGujarati, english: p.nameEnglish },
      start: { surah: p.startSurahNumber, ayah: p.startAyahNumber },
      end: { surah: p.endSurahNumber, ayah: p.endAyahNumber },
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

  const parah = await ParahModel.findOne({ where: { parahNumber, isActive: true } });
  if (!parah) throw new NotFound(`Parah ${parahNumber} not found`);

  const ayahInclude: any[] = [
    { model: SurahModel, as: 'surah', attributes: ['surahNumber', 'nameArabic', 'nameGujarati', 'nameEnglish'] },
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
        name: { arabic: parah.nameArabic, gujarati: parah.nameGujarati, english: parah.nameEnglish },
        start: { surah: parah.startSurahNumber, ayah: parah.startAyahNumber },
        end: { surah: parah.endSurahNumber, ayah: parah.endAyahNumber },
      },
      ayahs: ayahs.map(a => ({
        number: a.ayahNumber,
        numberInSurah: a.ayahNumberInSurah,
        surah: a.surah ? {
          number: a.surah.surahNumber,
          name: { arabic: a.surah.nameArabic, gujarati: a.surah.nameGujarati, english: a.surah.nameEnglish },
        } : undefined,
        arabic: a.arabicText,
        translations: includeTranslations ? formatTranslations(a.translations || []) : undefined,
        page: a.pageNumber,
      })),
    },
  });
}

/**
 * Create a new Parah (Admin only)
 */
export async function createParah(
  request: FastifyRequest<{ Body: CreateParahInput }>,
  reply: FastifyReply
) {
  const body = request.body;

  const existing = await ParahModel.findOne({ where: { parahNumber: body.parahNumber } });
  if (existing) throw new BadRequest(`Parah ${body.parahNumber} already exists`);

  const parah = await ParahModel.create({
    parahNumber: body.parahNumber,
    nameArabic: body.nameArabic,
    nameGujarati: body.nameGujarati,
    nameEnglish: body.nameEnglish,
    startSurahNumber: body.startSurahNumber,
    startAyahNumber: body.startAyahNumber,
    endSurahNumber: body.endSurahNumber,
    endAyahNumber: body.endAyahNumber,
  });

  return reply.status(201).send({ success: true, data: parah });
}

/**
 * Update a Parah (Admin only)
 */
export async function updateParah(
  request: FastifyRequest<{ Params: ParahParam; Body: UpdateParahInput }>,
  reply: FastifyReply
) {
  const { parahNumber } = request.params;
  const body = request.body;

  const parah = await ParahModel.findOne({ where: { parahNumber, isActive: true } });
  if (!parah) throw new NotFound(`Parah ${parahNumber} not found`);

  await parah.update(body);
  return reply.send({ success: true, data: parah });
}

/**
 * Delete a Parah (Admin only)
 */
export async function deleteParah(
  request: FastifyRequest<{ Params: ParahParam }>,
  reply: FastifyReply
) {
  const { parahNumber } = request.params;
  const parah = await ParahModel.findOne({ where: { parahNumber, isActive: true } });
  if (!parah) throw new NotFound(`Parah ${parahNumber} not found`);

  await parah.update({ isActive: false });
  await parah.destroy();

  return reply.send({ success: true, message: `Parah ${parahNumber} deleted successfully` });
}

// ==================== AYAH HANDLERS ====================

/**
 * List ayahs with pagination and optional filtering
 */
export async function listAyahs(
  request: FastifyRequest<{ Querystring: ListAyahsQuery }>,
  reply: FastifyReply
) {
  const {
    surahNumber, parahNumber, page = 1, pageSize = 50,
    search, includeTranslations = true, languages = ['ar_translit_en', 'ar_translit_gu', 'gu', 'en'],
  } = request.query;

  const offset = (page - 1) * pageSize;
  const conditions: WhereOptions[] = [{ isActive: true }];

  if (surahNumber) {
    const surah = await SurahModel.findOne({ where: { surahNumber } });
    if (surah) {
      conditions.push({ surahId: surah.id });
    } else {
      return reply.send({ success: true, data: [], meta: { total: 0, page, pageSize } });
    }
  }

  if (parahNumber) {
    const parah = await ParahModel.findOne({ where: { parahNumber } });
    if (parah) {
      conditions.push({ parahId: parah.id });
    } else {
      return reply.send({ success: true, data: [], meta: { total: 0, page, pageSize } });
    }
  }

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
    { model: SurahModel, as: 'surah', attributes: ['surahNumber', 'nameArabic', 'nameGujarati', 'nameEnglish'] },
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
        name: { arabic: a.surah.nameArabic, gujarati: a.surah.nameGujarati, english: a.surah.nameEnglish },
      } : undefined,
      arabic: a.arabicText,
      translations: includeTranslations ? formatTranslations(a.translations || []) : undefined,
      page: a.pageNumber,
    })),
    meta: { total: count, page, pageSize, totalPages: Math.ceil(count / pageSize) },
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
    { model: SurahModel, as: 'surah', attributes: ['surahNumber', 'nameArabic', 'nameGujarati', 'nameEnglish', 'revelationType'] },
    { model: ParahModel, as: 'parah', attributes: ['parahNumber', 'nameArabic', 'nameGujarati', 'nameEnglish'] },
  ];
  if (includeTranslations) {
    include.push({
      model: AyahTranslationModel,
      as: 'translations',
      where: { language: { [Op.in]: languages }, isActive: true },
      required: false,
    });
  }

  const ayah = await AyahModel.findOne({ where: { ayahNumber, isActive: true }, include });
  if (!ayah) throw new NotFound(`Ayah ${ayahNumber} not found`);

  return reply.send({
    success: true,
    data: {
      number: ayah.ayahNumber,
      numberInSurah: ayah.ayahNumberInSurah,
      surah: ayah.surah ? {
        number: ayah.surah.surahNumber,
        name: { arabic: ayah.surah.nameArabic, gujarati: ayah.surah.nameGujarati, english: ayah.surah.nameEnglish },
        revelationType: ayah.surah.revelationType,
      } : undefined,
      parah: ayah.parah ? {
        number: ayah.parah.parahNumber,
        name: { arabic: ayah.parah.nameArabic, gujarati: ayah.parah.nameGujarati, english: ayah.parah.nameEnglish },
      } : undefined,
      arabic: ayah.arabicText,
      translations: includeTranslations ? formatTranslations(ayah.translations || []) : undefined,
      page: ayah.pageNumber,
      hizbQuarter: ayah.hizbQuarter,
      sajdaType: ayah.sajdaType !== 'none' ? ayah.sajdaType : undefined,
    },
  });
}

/**
 * Create a new Ayah with optional translations (Admin only)
 */
export async function createAyah(
  request: FastifyRequest<{ Body: CreateAyahInput }>,
  reply: FastifyReply
) {
  const body = request.body;

  // Resolve surahId from surahNumber
  const surah = await SurahModel.findOne({ where: { surahNumber: body.surahNumber, isActive: true } });
  if (!surah) throw new BadRequest(`Surah ${body.surahNumber} not found. Create the Surah first.`);

  // Resolve parahId from parahNumber
  const parah = await ParahModel.findOne({ where: { parahNumber: body.parahNumber, isActive: true } });
  if (!parah) throw new BadRequest(`Parah ${body.parahNumber} not found. Create the Parah first.`);

  // Check for duplicate
  const existing = await AyahModel.findOne({ where: { ayahNumber: body.ayahNumber } });
  if (existing) throw new BadRequest(`Ayah ${body.ayahNumber} already exists`);

  // Use a transaction to create Ayah + Translations atomically
  const result = await sequelize.transaction(async (t) => {
    const ayah = await AyahModel.create({
      surahId: surah.id,
      parahId: parah.id,
      ayahNumber: body.ayahNumber,
      ayahNumberInSurah: body.ayahNumberInSurah,
      arabicText: body.arabicText,
      arabicTextSimple: body.arabicTextSimple ?? null,
      pageNumber: body.pageNumber ?? null,
      hizbQuarter: body.hizbQuarter ?? null,
      sajdaType: body.sajdaType ?? 'none',
    }, { transaction: t });

    const translations: AyahTranslationModel[] = [];
    if (body.translations && body.translations.length > 0) {
      for (const tr of body.translations) {
        const created = await AyahTranslationModel.create({
          ayahId: ayah.id,
          language: tr.language,
          text: tr.text,
          translatorName: tr.translatorName ?? null,
        }, { transaction: t });
        translations.push(created);
      }
    }

    return { ayah, translations };
  });

  request.log.info({ ayahId: result.ayah.id, ayahNumber: result.ayah.ayahNumber }, 'Ayah created');

  return reply.status(201).send({
    success: true,
    data: {
      ...result.ayah.toJSON(),
      translations: result.translations,
    },
  });
}

/**
 * Update (or create) a translation for a specific Ayah (Admin only)
 */
export async function updateAyahTranslation(
  request: FastifyRequest<{ Params: AyahTranslationParam; Body: UpdateAyahTranslationInput }>,
  reply: FastifyReply
) {
  const { ayahNumber, language } = request.params;
  const { text, translatorName } = request.body;

  const ayah = await AyahModel.findOne({ where: { ayahNumber, isActive: true } });
  if (!ayah) throw new NotFound(`Ayah ${ayahNumber} not found`);

  // Upsert: update if exists, create if not
  const [translation, created] = await AyahTranslationModel.findOrCreate({
    where: { ayahId: ayah.id, language: language as any },
    defaults: {
      ayahId: ayah.id,
      language: language as any,
      text,
      translatorName: translatorName ?? null,
    },
  });

  if (!created) {
    await translation.update({ text, translatorName: translatorName ?? translation.translatorName });
  }

  return reply.send({ success: true, data: translation });
}

/**
 * Update an Ayah (Admin only)
 */
export async function updateAyah(
  request: FastifyRequest<{ Params: AyahParam; Body: import('./schema').UpdateAyahInput }>,
  reply: FastifyReply
) {
  const { ayahNumber } = request.params;
  const body = request.body;

  const ayah = await AyahModel.findOne({ where: { ayahNumber, isActive: true } });
  if (!ayah) throw new NotFound(`Ayah ${ayahNumber} not found`);

  // Handle surah/parah ID resolution if they are being updated
  const updateData: any = { ...body };
  
  if (body.surahNumber !== undefined) {
    const surah = await SurahModel.findOne({ where: { surahNumber: body.surahNumber, isActive: true } });
    if (!surah) throw new BadRequest(`Surah ${body.surahNumber} not found.`);
    updateData.surahId = surah.id;
    delete updateData.surahNumber;
  }

  if (body.parahNumber !== undefined) {
    const parah = await ParahModel.findOne({ where: { parahNumber: body.parahNumber, isActive: true } });
    if (!parah) throw new BadRequest(`Parah ${body.parahNumber} not found.`);
    updateData.parahId = parah.id;
    delete updateData.parahNumber;
  }

  await ayah.update(updateData);
  return reply.send({ success: true, data: ayah });
}

/**
 * Delete an Ayah (Admin only)
 */
export async function deleteAyah(
  request: FastifyRequest<{ Params: AyahParam }>,
  reply: FastifyReply
) {
  const { ayahNumber } = request.params;
  const ayah = await AyahModel.findOne({ where: { ayahNumber, isActive: true } });
  if (!ayah) throw new NotFound(`Ayah ${ayahNumber} not found`);

  await ayah.update({ isActive: false });
  await ayah.destroy();

  return reply.send({ success: true, message: `Ayah ${ayahNumber} deleted successfully` });
}
