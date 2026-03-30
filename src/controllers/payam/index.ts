import { FastifyRequest, FastifyReply } from 'fastify';
import { Op, WhereOptions, Order } from 'sequelize';
import { Payam, PayamAttributes, PayamCreationAttributes } from '../../models';
import { smartConvertGujarati } from '../../utils/gujarati-converter';
import { saveUploadedFile, deleteUploadedFile, UploadedFile } from '../../utils/file-handler';
import { BadRequest, NotFound } from '../../libs/error';
import { CreatePayamInput, UpdatePayamInput, ListPayamQuery, IdParam } from './schema';

// ============ HANDLERS ============

/**
 * List all payams with pagination and filtering
 */
export async function listPayams(
  request: FastifyRequest<{ Querystring: ListPayamQuery }>,
  reply: FastifyReply
) {
  const query = request.query;
  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? 20, 100);
  const offset = (page - 1) * pageSize;

  // Build where clause
  const conditions: WhereOptions<PayamAttributes>[] = [{ isActive: query.isActive ?? true }];

  if (query.category) {
    conditions.push({ category: query.category });
  }

  if (query.author) {
    conditions.push({ author: { [Op.iLike]: `%${query.author}%` } });
  }

  if (query.search) {
    const searchPattern = `%${query.search}%`;
    conditions.push({
      [Op.or]: [{ title: { [Op.iLike]: searchPattern } }, { content: { [Op.iLike]: searchPattern } }],
    } as WhereOptions<PayamAttributes>);
  }

  const where: WhereOptions<PayamAttributes> = {
    [Op.and]: conditions,
  };

  const sortBy = query.sortBy ?? 'createdAt';
  const sortOrder = query.sortOrder ?? 'desc';
  const order: Order = [[sortBy, sortOrder.toUpperCase()]];

  const { count, rows } = await Payam.findAndCountAll({
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
 * Get a single payam by ID
 */
export async function getPayamById(request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) {
  const { id } = request.params;

  const payam = await Payam.findOne({
    where: { id, isActive: true },
  });

  if (!payam) {
    throw new NotFound('Payam not found');
  }

  return reply.send({
    success: true,
    data: payam,
  });
}

/**
 * Create a new payam
 */
export async function createPayam(request: FastifyRequest<{ Body: CreatePayamInput }>, reply: FastifyReply) {
  let uploadedFile: UploadedFile | undefined;
  let bodyData: CreatePayamInput;

  // Check if this is a multipart request
  if (request.isMultipart()) {
    const parts = request.parts();
    const fields: Record<string, string> = {};

    for await (const part of parts) {
      if (part.type === 'file') {
        uploadedFile = await saveUploadedFile(part, 'payam');
        request.log.info({ file: uploadedFile }, 'PDF uploaded for payam');
      } else {
        fields[part.fieldname] = part.value as string;
      }
    }

    bodyData = {
      title: fields['title'],
      content: fields['content'],
      contentType: uploadedFile ? 'pdf' : (fields['contentType'] as 'text' | 'pdf'),
      category: fields['category'],
      author: fields['author'],
      publishDate: fields['publishDate'],
      tags: fields['tags'] ? JSON.parse(fields['tags']) : undefined,
      metadata: fields['metadata'] ? JSON.parse(fields['metadata']) : undefined,
      createdBy: fields['createdBy'],
    };
  } else {
    bodyData = request.body;
  }

  if (!bodyData.title) {
    throw new BadRequest('Title is required');
  }

  const createData: PayamCreationAttributes = {
    title: smartConvertGujarati(bodyData.title),
    content: bodyData.content ? smartConvertGujarati(bodyData.content) : null,
    originalContent: bodyData.content ?? null,
    contentType: uploadedFile ? 'pdf' : (bodyData.contentType ?? 'text'),
    pdfPath: uploadedFile?.path ?? null,
    pdfOriginalName: uploadedFile?.originalName ?? null,
    category: bodyData.category ?? null,
    author: bodyData.author ?? null,
    publishDate: bodyData.publishDate ? new Date(bodyData.publishDate) : null,
    tags: bodyData.tags ?? null,
    metadata: bodyData.metadata ?? null,
    createdBy: bodyData.createdBy ?? null,
    isActive: true,
  };

  const payam = await Payam.create(createData);
  request.log.info({ payamId: payam.id }, 'Payam created');

  return reply.status(201).send({
    success: true,
    data: payam,
  });
}

/**
 * Update a payam
 */
export async function updatePayam(
  request: FastifyRequest<{ Params: IdParam; Body: UpdatePayamInput }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  let uploadedFile: UploadedFile | undefined;
  let bodyData: UpdatePayamInput;

  if (request.isMultipart()) {
    const parts = request.parts();
    const fields: Record<string, string> = {};

    for await (const part of parts) {
      if (part.type === 'file') {
        uploadedFile = await saveUploadedFile(part, 'payam');
        request.log.info({ file: uploadedFile }, 'PDF uploaded for payam update');
      } else {
        fields[part.fieldname] = part.value as string;
      }
    }

    bodyData = {
      title: fields['title'],
      content: fields['content'],
      contentType: uploadedFile ? 'pdf' : (fields['contentType'] as 'text' | 'pdf'),
      category: fields['category'],
      author: fields['author'],
      publishDate: fields['publishDate'],
      tags: fields['tags'] ? JSON.parse(fields['tags']) : undefined,
      metadata: fields['metadata'] ? JSON.parse(fields['metadata']) : undefined,
    };
  } else {
    bodyData = request.body;
  }

  const existingPayam = await Payam.findOne({
    where: { id, isActive: true },
  });

  if (!existingPayam) {
    throw new NotFound('Payam not found');
  }

  // If uploading new PDF and old one exists, delete old one
  if (uploadedFile && existingPayam.pdfPath) {
    await deleteUploadedFile(existingPayam.pdfPath);
  }

  const updateData: Partial<PayamAttributes> = {};

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
  if (bodyData.category !== undefined) updateData.category = bodyData.category;
  if (bodyData.author !== undefined) updateData.author = bodyData.author;
  if (bodyData.publishDate !== undefined) {
    updateData.publishDate = bodyData.publishDate ? new Date(bodyData.publishDate) : null;
  }
  if (bodyData.tags !== undefined) updateData.tags = bodyData.tags;
  if (bodyData.metadata !== undefined) updateData.metadata = bodyData.metadata;

  await existingPayam.update(updateData);
  request.log.info({ payamId: existingPayam.id }, 'Payam updated');

  return reply.send({
    success: true,
    data: existingPayam,
  });
}

/**
 * Soft delete a payam
 */
export async function deletePayam(request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) {
  const { id } = request.params;

  const payam = await Payam.findByPk(id);

  if (!payam || !payam.isActive) {
    throw new NotFound('Payam not found');
  }

  await payam.update({ isActive: false });
  request.log.info({ payamId: id }, 'Payam deleted (soft)');

  return reply.send({
    success: true,
    data: { message: 'Payam deleted successfully' },
  });
}
