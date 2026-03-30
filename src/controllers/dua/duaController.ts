import { FastifyRequest, FastifyReply } from 'fastify';
import { Op, WhereOptions, Order } from 'sequelize';
import { Dua, DuaAttributes, DuaCreationAttributes } from '../../models';
import { smartConvertGujarati } from '../../utils/gujarati-converter';
import { BadRequest, NotFound } from '../../libs/error';
import { CreateDuaInput, UpdateDuaInput, ListDuaQuery, IdParam } from './schema';
import { AuthenticatedRequest } from '../../middlewares/authMiddleware';

// ============ HANDLERS ============

/**
 * List all duas with pagination and filtering
 * Note: Paranoid mode automatically excludes soft-deleted records
 */
export async function listDuas(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as ListDuaQuery;
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const offset = (page - 1) * pageSize;

    // Build where clause
    const conditions: WhereOptions<DuaAttributes>[] = [];

    if (query.search) {
        const searchPattern = `%${query.search}%`;
        conditions.push({
            [Op.or]: [
                { titleEn: { [Op.iLike]: searchPattern } },
                { titleGu: { [Op.iLike]: searchPattern } },
                { translationEn: { [Op.iLike]: searchPattern } },
                { translationGu: { [Op.iLike]: searchPattern } },
            ],
        } as WhereOptions<DuaAttributes>);
    }

    const where: WhereOptions<DuaAttributes> = conditions.length > 0 ? { [Op.and]: conditions } : {};

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const order: Order = [[sortBy, sortOrder.toUpperCase()]];

    const { count, rows } = await Dua.findAndCountAll({
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
 * Get a single dua by ID
 * Note: Paranoid mode automatically excludes soft-deleted records
 */
export async function getDuaById(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as IdParam;
    const { id } = params;

    const dua = await Dua.findByPk(id);

    if (!dua) {
        throw new NotFound('Dua not found');
    }

    return reply.send({
        success: true,
        data: dua,
    });
}

/**
 * Create a new dua (Admin only)
 */
export async function createDua(request: FastifyRequest, reply: FastifyReply) {
    const authReq = request as AuthenticatedRequest;
    const bodyData = request.body as CreateDuaInput;

    // Validate required fields
    if (!bodyData.titleEn) {
        throw new BadRequest('English title is required');
    }
    if (!bodyData.titleGu) {
        throw new BadRequest('Gujarati title is required');
    }
    if (!bodyData.textAr) {
        throw new BadRequest('Arabic text is required');
    }
    if (!bodyData.transliterationEn) {
        throw new BadRequest('English transliteration is required');
    }
    if (!bodyData.transliterationGu) {
        throw new BadRequest('Gujarati transliteration is required');
    }
    if (!bodyData.translationEn) {
        throw new BadRequest('English translation is required');
    }
    if (!bodyData.translationGu) {
        throw new BadRequest('Gujarati translation is required');
    }

    const createData: DuaCreationAttributes = {
        titleEn: bodyData.titleEn,
        titleGu: smartConvertGujarati(bodyData.titleGu),
        textAr: bodyData.textAr,
        transliterationEn: bodyData.transliterationEn,
        transliterationGu: smartConvertGujarati(bodyData.transliterationGu),
        translationEn: bodyData.translationEn,
        translationGu: smartConvertGujarati(bodyData.translationGu),
        referenceSource: bodyData.referenceSource ?? null,
        referenceBookName: bodyData.referenceBookName ?? null,
        referenceHadithNumber: bodyData.referenceHadithNumber ?? null,
        createdBy: authReq.user?.id ?? null,
        updatedBy: authReq.user?.id ?? null,
    };

    const dua = await Dua.create(createData);
    request.log.info({ duaId: dua.id, createdBy: authReq.user?.id }, 'Dua created');

    return reply.status(201).send({
        success: true,
        data: dua,
    });
}

/**
 * Update a dua (Admin only)
 */
export async function updateDua(request: FastifyRequest, reply: FastifyReply) {
    const authReq = request as AuthenticatedRequest;
    const params = request.params as IdParam;
    const bodyData = request.body as UpdateDuaInput;
    const { id } = params;

    const existingDua = await Dua.findByPk(id);

    if (!existingDua) {
        throw new NotFound('Dua not found');
    }

    const updateData: Partial<DuaAttributes> = {
        updatedBy: authReq.user?.id ?? null, // Track who updated
    };

    if (bodyData.titleEn !== undefined) {
        updateData.titleEn = bodyData.titleEn;
    }
    if (bodyData.titleGu !== undefined) {
        updateData.titleGu = smartConvertGujarati(bodyData.titleGu);
    }
    if (bodyData.textAr !== undefined) {
        updateData.textAr = bodyData.textAr;
    }
    if (bodyData.transliterationEn !== undefined) {
        updateData.transliterationEn = bodyData.transliterationEn;
    }
    if (bodyData.transliterationGu !== undefined) {
        updateData.transliterationGu = smartConvertGujarati(bodyData.transliterationGu);
    }
    if (bodyData.translationEn !== undefined) {
        updateData.translationEn = bodyData.translationEn;
    }
    if (bodyData.translationGu !== undefined) {
        updateData.translationGu = smartConvertGujarati(bodyData.translationGu);
    }
    if (bodyData.referenceSource !== undefined) {
        updateData.referenceSource = bodyData.referenceSource;
    }
    if (bodyData.referenceBookName !== undefined) {
        updateData.referenceBookName = bodyData.referenceBookName;
    }
    if (bodyData.referenceHadithNumber !== undefined) {
        updateData.referenceHadithNumber = bodyData.referenceHadithNumber;
    }

    await existingDua.update(updateData);
    request.log.info({ duaId: existingDua.id, updatedBy: authReq.user?.id }, 'Dua updated');

    return reply.send({
        success: true,
        data: existingDua,
    });
}

/**
 * Soft delete a dua (Admin only - paranoid mode handles this automatically)
 */
export async function deleteDua(request: FastifyRequest, reply: FastifyReply) {
    const authReq = request as AuthenticatedRequest;
    const params = request.params as IdParam;
    const { id } = params;

    const dua = await Dua.findByPk(id);

    if (!dua) {
        throw new NotFound('Dua not found');
    }

    await dua.destroy(); // Paranoid mode will set deletedAt instead of actually deleting
    request.log.info({ duaId: id, deletedBy: authReq.user?.id }, 'Dua deleted (soft)');

    return reply.send({
        success: true,
        data: { message: 'Dua deleted successfully' },
    });
}
