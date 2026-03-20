import { FastifyRequest, FastifyReply } from 'fastify';
import { PdfIndexModel } from '../../models';
import { NotFound, BadRequest } from '../../libs/error';
import {
    PdfIndexParam,
    ListPdfIndexQuery,
    CreatePdfIndexInput,
    UpdatePdfIndexInput,
} from './schema';

// ==================== LIST ====================

/**
 * GET /api/pdf-index
 * List all PDF index entries, optionally filtered by bookType and/or indexType.
 * Ordered by sortOrder ASC, then referenceNumber ASC.
 */
export async function listPdfIndex(
    request: FastifyRequest<{ Querystring: ListPdfIndexQuery }>,
    reply: FastifyReply
) {
    const { bookType, indexType } = request.query;

    const where: Record<string, any> = { isActive: true };
    if (bookType) where.bookType = bookType;
    if (indexType) where.indexType = indexType;

    const entries = await PdfIndexModel.findAll({
        where,
        order: [
            ['sortOrder', 'ASC'],
            ['referenceNumber', 'ASC'],
        ],
    });

    return reply.send({
        success: true,
        data: entries.map(formatEntry),
        meta: { total: entries.length },
    });
}

// ==================== GET ONE ====================

/**
 * GET /api/pdf-index/:id
 * Get a single PDF index entry by its UUID.
 */
export async function getPdfIndexEntry(
    request: FastifyRequest<{ Params: PdfIndexParam }>,
    reply: FastifyReply
) {
    const { id } = request.params;

    const entry = await PdfIndexModel.findOne({ where: { id, isActive: true } });
    if (!entry) throw new NotFound(`PDF index entry with id "${id}" not found`);

    return reply.send({ success: true, data: formatEntry(entry) });
}

// ==================== CREATE ====================

/**
 * POST /api/pdf-index
 * Create a new PDF index entry. Admin only.
 * At least one of referenceNumber or referenceKey must be provided.
 */
export async function createPdfIndexEntry(
    request: FastifyRequest<{ Body: CreatePdfIndexInput }>,
    reply: FastifyReply
) {
    const body = request.body;

    if (body.referenceNumber == null && !body.referenceKey) {
        throw new BadRequest('Provide at least one of referenceNumber or referenceKey');
    }

    // Check uniqueness for numeric references
    if (body.referenceNumber != null) {
        const duplicate = await PdfIndexModel.findOne({
            where: {
                bookType: body.bookType,
                indexType: body.indexType,
                referenceNumber: body.referenceNumber,
                isActive: true,
            },
        });
        if (duplicate) {
            throw new BadRequest(
                `A PDF index entry for bookType="${body.bookType}", indexType="${body.indexType}", referenceNumber=${body.referenceNumber} already exists`
            );
        }
    }

    const entry = await PdfIndexModel.create({
        bookType: body.bookType,
        indexType: body.indexType,
        referenceNumber: body.referenceNumber ?? null,
        referenceKey: body.referenceKey ?? null,
        nameArabic: body.nameArabic ?? null,
        nameGujarati: body.nameGujarati ?? null,
        nameEnglish: body.nameEnglish ?? null,
        pageNumber: body.pageNumber,
        sortOrder: body.sortOrder ?? 0,
    });

    return reply.status(201).send({ success: true, data: formatEntry(entry) });
}

// ==================== UPDATE ====================

/**
 * PUT /api/pdf-index/:id
 * Update a PDF index entry. Admin only.
 */
export async function updatePdfIndexEntry(
    request: FastifyRequest<{ Params: PdfIndexParam; Body: UpdatePdfIndexInput }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const body = request.body;

    const entry = await PdfIndexModel.findOne({ where: { id, isActive: true } });
    if (!entry) throw new NotFound(`PDF index entry with id "${id}" not found`);

    await entry.update(body);
    return reply.send({ success: true, data: formatEntry(entry) });
}

// ==================== DELETE ====================

/**
 * DELETE /api/pdf-index/:id
 * Soft-delete a PDF index entry. Admin only.
 */
export async function deletePdfIndexEntry(
    request: FastifyRequest<{ Params: PdfIndexParam }>,
    reply: FastifyReply
) {
    const { id } = request.params;

    const entry = await PdfIndexModel.findOne({ where: { id, isActive: true } });
    if (!entry) throw new NotFound(`PDF index entry with id "${id}" not found`);

    await entry.update({ isActive: false });
    await entry.destroy();

    return reply.send({ success: true, message: `PDF index entry "${id}" deleted successfully` });
}

// ==================== HELPER ====================

function formatEntry(entry: PdfIndexModel) {
    return {
        id: entry.id,
        bookType: entry.bookType,
        indexType: entry.indexType,
        referenceNumber: entry.referenceNumber,
        referenceKey: entry.referenceKey,
        nameArabic: entry.nameArabic,
        nameGujarati: entry.nameGujarati,
        nameEnglish: entry.nameEnglish,
        pageNumber: entry.pageNumber,
        sortOrder: entry.sortOrder,
        isActive: entry.isActive,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
    };
}
