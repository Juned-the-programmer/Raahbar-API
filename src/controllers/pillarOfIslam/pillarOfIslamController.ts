import { FastifyRequest, FastifyReply } from 'fastify';
import { Op, WhereOptions, Order } from 'sequelize';
import { PillarOfIslam, PillarOfIslamAttributes, PillarOfIslamCreationAttributes } from '../../models';
import { smartConvertGujarati } from '../../utils/gujarati-converter';
import { BadRequest, NotFound } from '../../libs/error';
import { CreatePillarInput, UpdatePillarInput, ListPillarQuery, IdParam } from './schema';
import { AuthenticatedRequest } from '../../middlewares/authMiddleware';

// ============ HANDLERS ============

/**
 * List all pillars with pagination and filtering
 * Note: Paranoid mode automatically excludes soft-deleted records
 */
export async function listPillars(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as ListPillarQuery;
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const offset = (page - 1) * pageSize;

    // Build where clause
    const conditions: WhereOptions<PillarOfIslamAttributes>[] = [];

    if (query.search) {
        const searchPattern = `%${query.search}%`;
        conditions.push({
            [Op.or]: [
                { titleEn: { [Op.iLike]: searchPattern } },
                { titleGu: { [Op.iLike]: searchPattern } },
                { descriptionEn: { [Op.iLike]: searchPattern } },
                { descriptionGu: { [Op.iLike]: searchPattern } },
            ],
        } as WhereOptions<PillarOfIslamAttributes>);
    }

    const where: WhereOptions<PillarOfIslamAttributes> = conditions.length > 0 ? { [Op.and]: conditions } : {};

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const order: Order = [[sortBy, sortOrder.toUpperCase()]];

    const { count, rows } = await PillarOfIslam.findAndCountAll({
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
 * Get a single pillar by ID
 * Note: Paranoid mode automatically excludes soft-deleted records
 */
export async function getPillarById(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as IdParam;
    const { id } = params;

    const pillar = await PillarOfIslam.findByPk(id);

    if (!pillar) {
        throw new NotFound('Pillar of Islam not found');
    }

    return reply.send({
        success: true,
        data: pillar,
    });
}

/**
 * Create a new pillar (Admin only)
 */
export async function createPillar(request: FastifyRequest, reply: FastifyReply) {
    const authReq = request as AuthenticatedRequest;
    const bodyData = request.body as CreatePillarInput;

    // Validate required fields
    if (!bodyData.titleEn) throw new BadRequest('English title is required');
    if (!bodyData.titleGu) throw new BadRequest('Gujarati title is required');
    if (!bodyData.textAr) throw new BadRequest('Arabic text is required');
    if (!bodyData.transliterationEn) throw new BadRequest('English transliteration is required');
    if (!bodyData.transliterationGu) throw new BadRequest('Gujarati transliteration is required');
    if (!bodyData.translationEn) throw new BadRequest('English translation is required');
    if (!bodyData.translationGu) throw new BadRequest('Gujarati translation is required');
    if (!bodyData.descriptionEn) throw new BadRequest('English description is required');
    if (!bodyData.descriptionGu) throw new BadRequest('Gujarati description is required');

    const createData: PillarOfIslamCreationAttributes = {
        titleEn: bodyData.titleEn,
        titleGu: smartConvertGujarati(bodyData.titleGu),
        textAr: bodyData.textAr,
        transliterationEn: bodyData.transliterationEn,
        transliterationGu: smartConvertGujarati(bodyData.transliterationGu),
        translationEn: bodyData.translationEn,
        translationGu: smartConvertGujarati(bodyData.translationGu),
        descriptionEn: bodyData.descriptionEn,
        descriptionGu: smartConvertGujarati(bodyData.descriptionGu),
        referenceSource: bodyData.referenceSource ?? null,
        createdBy: authReq.user?.id ?? null,
        updatedBy: authReq.user?.id ?? null,
    };

    const pillar = await PillarOfIslam.create(createData);
    request.log.info({ pillarId: pillar.id, createdBy: authReq.user?.id }, 'Pillar of Islam created');

    return reply.status(201).send({
        success: true,
        data: pillar,
    });
}

/**
 * Update a pillar (Admin only)
 */
export async function updatePillar(request: FastifyRequest, reply: FastifyReply) {
    const authReq = request as AuthenticatedRequest;
    const params = request.params as IdParam;
    const bodyData = request.body as UpdatePillarInput;
    const { id } = params;

    const existingPillar = await PillarOfIslam.findByPk(id);

    if (!existingPillar) {
        throw new NotFound('Pillar of Islam not found');
    }

    const updateData: Partial<PillarOfIslamAttributes> = {
        updatedBy: authReq.user?.id ?? null,
    };

    if (bodyData.titleEn !== undefined) updateData.titleEn = bodyData.titleEn;
    if (bodyData.titleGu !== undefined) updateData.titleGu = smartConvertGujarati(bodyData.titleGu);
    if (bodyData.textAr !== undefined) updateData.textAr = bodyData.textAr;
    if (bodyData.transliterationEn !== undefined) updateData.transliterationEn = bodyData.transliterationEn;
    if (bodyData.transliterationGu !== undefined) updateData.transliterationGu = smartConvertGujarati(bodyData.transliterationGu);
    if (bodyData.translationEn !== undefined) updateData.translationEn = bodyData.translationEn;
    if (bodyData.translationGu !== undefined) updateData.translationGu = smartConvertGujarati(bodyData.translationGu);
    if (bodyData.descriptionEn !== undefined) updateData.descriptionEn = bodyData.descriptionEn;
    if (bodyData.descriptionGu !== undefined) updateData.descriptionGu = smartConvertGujarati(bodyData.descriptionGu);
    if (bodyData.referenceSource !== undefined) updateData.referenceSource = bodyData.referenceSource;

    await existingPillar.update(updateData);
    request.log.info({ pillarId: existingPillar.id, updatedBy: authReq.user?.id }, 'Pillar of Islam updated');

    return reply.send({
        success: true,
        data: existingPillar,
    });
}

/**
 * Soft delete a pillar (Admin only - paranoid mode handles this automatically)
 */
export async function deletePillar(request: FastifyRequest, reply: FastifyReply) {
    const authReq = request as AuthenticatedRequest;
    const params = request.params as IdParam;
    const { id } = params;

    const pillar = await PillarOfIslam.findByPk(id);

    if (!pillar) {
        throw new NotFound('Pillar of Islam not found');
    }

    await pillar.destroy();
    request.log.info({ pillarId: id, deletedBy: authReq.user?.id }, 'Pillar of Islam deleted (soft)');

    return reply.send({
        success: true,
        data: { message: 'Pillar of Islam deleted successfully' },
    });
}
