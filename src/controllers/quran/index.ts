import { FastifyRequest, FastifyReply } from 'fastify';
import { Op, WhereOptions, Order } from 'sequelize';
import { Quran, QuranAttributes, QuranCreationAttributes } from '../../models';
import { smartConvertGujarati } from '../../utils/gujarati-converter';
import { saveUploadedFile, deleteUploadedFile, UploadedFile } from '../../utils/file-handler';
import { BadRequest, NotFound } from '../../libs/error';
import { CreateQuranInput, UpdateQuranInput, ListQuranQuery, IdParam, SurahParam } from './schema';

// ============ HANDLERS ============

/**
 * List all quran entries with pagination and filtering
 */
export async function listQurans(
  request: FastifyRequest<{ Querystring: ListQuranQuery }>,
  reply: FastifyReply
) {
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
