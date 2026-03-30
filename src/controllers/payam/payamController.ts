import { FastifyRequest, FastifyReply } from 'fastify';
import { Op, WhereOptions, Order } from 'sequelize';
import { Payam, PayamAttributes, PayamCreationAttributes } from '../../models';
import { smartConvertGujarati } from '../../utils/gujarati-converter';
import { BadRequest, NotFound } from '../../libs/error';
import { CreatePayamInput, UpdatePayamInput, ListPayamQuery, IdParam } from './schema';
import { AuthenticatedRequest } from '../../middlewares/authMiddleware';

// ============ HANDLERS ============

/**
 * List all payams with pagination and filtering
 * Note: Paranoid mode automatically excludes soft-deleted records
 */
export async function listPayams(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as ListPayamQuery;
  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? 20, 100);
  const offset = (page - 1) * pageSize;

  // Build where clause
  const conditions: WhereOptions<PayamAttributes>[] = [];

  // Get user from request (attached by verifyToken middleware)
  const user = (request as AuthenticatedRequest).user;

  // Filter by status
  // Only admins can filter by specific status
  // Regular users always see 'published' only
  if (user?.role === 'admin' && query.status) {
    conditions.push({ status: query.status } as WhereOptions<PayamAttributes>);
  } else {
    // Default: only show published payams
    // This applies to:
    // 1. Non-admin users (ignoring their status query)
    // 2. Admins who didn't provide a status query
    conditions.push({ status: 'published' } as WhereOptions<PayamAttributes>);
  }

  if (query.search) {
    const searchPattern = `%${query.search}%`;
    conditions.push({
      [Op.or]: [
        { title: { [Op.iLike]: searchPattern } },
        { textContent: { [Op.iLike]: searchPattern } },
        { reference: { [Op.iLike]: searchPattern } },
      ],
    } as WhereOptions<PayamAttributes>);
  }

  const where: WhereOptions<PayamAttributes> = conditions.length > 0 ? { [Op.and]: conditions } : {};

  const sortBy = query.sortBy ?? 'payamNo';
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
 * Note: Paranoid mode automatically excludes soft-deleted records
 */
export async function getPayamById(request: FastifyRequest, reply: FastifyReply) {
  const params = request.params as IdParam;
  const { id } = params;

  const payam = await Payam.findByPk(id);

  if (!payam) {
    throw new NotFound('Payam not found');
  }

  return reply.send({
    success: true,
    data: payam,
  });
}

/**
 * Create a new payam (Admin only)
 */
export async function createPayam(request: FastifyRequest, reply: FastifyReply) {
  const authReq = request as AuthenticatedRequest;
  const bodyData = request.body as CreatePayamInput;

  if (!bodyData.title) {
    throw new BadRequest('Title is required');
  }

  if (!bodyData.payamNo) {
    throw new BadRequest('Payam number is required');
  }

  if (!bodyData.textContent) {
    throw new BadRequest('Text content is required');
  }

  // Check if payamNo already exists
  const existingPayam = await Payam.findOne({
    where: { payamNo: bodyData.payamNo },
  });

  if (existingPayam) {
    throw new BadRequest(`Payam number ${bodyData.payamNo} already exists`);
  }

  // Validate status and publishAt
  const status = bodyData.status || 'draft';
  let publishAt: Date | null = null;
  let publishedAt: Date | null = null;

  if (status === 'scheduled') {
    if (!bodyData.publishAt) {
      throw new BadRequest('publishAt is required when status is scheduled');
    }
    publishAt = new Date(bodyData.publishAt);
    if (publishAt <= new Date()) {
      throw new BadRequest('publishAt must be in the future for scheduled payams');
    }
  } else if (status === 'published') {
    publishedAt = new Date();
  }

  const createData: PayamCreationAttributes = {
    payamNo: bodyData.payamNo,
    title: smartConvertGujarati(bodyData.title),
    date: bodyData.date ? new Date(bodyData.date) : null,
    islamicDate: bodyData.islamicDate ?? null,
    textContent: smartConvertGujarati(bodyData.textContent),
    reference: bodyData.reference ?? null,
    status,
    publishAt,
    publishedAt,
    createdBy: authReq.user?.id ?? null,
    updatedBy: authReq.user?.id ?? null,
  };

  const payam = await Payam.create(createData);
  request.log.info({ payamId: payam.id, payamNo: payam.payamNo, createdBy: authReq.user?.id }, 'Payam created');

  return reply.status(201).send({
    success: true,
    data: payam,
  });
}

/**
 * Update a payam (Admin only)
 */
export async function updatePayam(request: FastifyRequest, reply: FastifyReply) {
  const authReq = request as AuthenticatedRequest;
  const params = request.params as IdParam;
  const bodyData = request.body as UpdatePayamInput;
  const { id } = params;

  const existingPayam = await Payam.findByPk(id);

  if (!existingPayam) {
    throw new NotFound('Payam not found');
  }

  // Check if payamNo is being changed and if the new one already exists
  if (bodyData.payamNo !== undefined && bodyData.payamNo !== existingPayam.payamNo) {
    const duplicatePayam = await Payam.findOne({
      where: { payamNo: bodyData.payamNo },
    });
    if (duplicatePayam) {
      throw new BadRequest(`Payam number ${bodyData.payamNo} already exists`);
    }
  }

  const updateData: Partial<PayamAttributes> = {
    updatedBy: authReq.user?.id ?? null, // Track who updated
  };

  if (bodyData.payamNo !== undefined) {
    updateData.payamNo = bodyData.payamNo;
  }
  if (bodyData.title !== undefined) {
    updateData.title = smartConvertGujarati(bodyData.title);
  }
  if (bodyData.date !== undefined) {
    updateData.date = bodyData.date ? new Date(bodyData.date) : null;
  }
  if (bodyData.islamicDate !== undefined) {
    updateData.islamicDate = bodyData.islamicDate;
  }
  if (bodyData.textContent !== undefined) {
    updateData.textContent = smartConvertGujarati(bodyData.textContent);
  }
  if (bodyData.reference !== undefined) {
    updateData.reference = bodyData.reference;
  }

  // Handle status transitions
  if (bodyData.status !== undefined) {
    updateData.status = bodyData.status;

    // If changing to published, set publishedAt
    if (bodyData.status === 'published' && !existingPayam.publishedAt) {
      updateData.publishedAt = new Date();
    }

    // If changing to scheduled, validate publishAt
    if (bodyData.status === 'scheduled') {
      if (!bodyData.publishAt && !existingPayam.publishAt) {
        throw new BadRequest('publishAt is required when status is scheduled');
      }
      if (bodyData.publishAt) {
        const publishAt = new Date(bodyData.publishAt);
        if (publishAt <= new Date()) {
          throw new BadRequest('publishAt must be in the future for scheduled payams');
        }
        updateData.publishAt = publishAt;
      }
    }
  }

  // Handle publishAt updates
  if (bodyData.publishAt !== undefined) {
    const publishAt = new Date(bodyData.publishAt);
    if (updateData.status === 'scheduled' || existingPayam.status === 'scheduled') {
      if (publishAt <= new Date()) {
        throw new BadRequest('publishAt must be in the future for scheduled payams');
      }
    }
    updateData.publishAt = publishAt;
  }


  await existingPayam.update(updateData);
  request.log.info({ payamId: existingPayam.id, payamNo: existingPayam.payamNo, updatedBy: authReq.user?.id }, 'Payam updated');

  return reply.send({
    success: true,
    data: existingPayam,
  });
}

/**
 * Soft delete a payam (Admin only - paranoid mode handles this automatically)
 */
export async function deletePayam(request: FastifyRequest, reply: FastifyReply) {
  const authReq = request as AuthenticatedRequest;
  const params = request.params as IdParam;
  const { id } = params;

  const payam = await Payam.findByPk(id);

  if (!payam) {
    throw new NotFound('Payam not found');
  }

  await payam.destroy(); // Paranoid mode will set deletedAt instead of actually deleting
  request.log.info({ payamId: id, payamNo: payam.payamNo, deletedBy: authReq.user?.id }, 'Payam deleted (soft)');

  return reply.send({
    success: true,
    data: { message: 'Payam deleted successfully' },
  });
}
