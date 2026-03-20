import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as pdfIndexController from '../controllers/pdfIndex/pdfIndexController';
import {
    listPdfIndexSchema,
    getPdfIndexEntrySchema,
    createPdfIndexSchema,
    updatePdfIndexSchema,
    deletePdfIndexSchema,
    PdfIndexParam,
    ListPdfIndexQuery,
    CreatePdfIndexInput,
    UpdatePdfIndexInput,
} from '../controllers/pdfIndex/schema';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware';

async function pdfIndexRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions) {

    // ==================== PDF INDEX ROUTES ====================

    // GET /api/pdf-index - List entries (filterable by bookType & indexType)
    fastify.get<{ Querystring: ListPdfIndexQuery }>(
        '/',
        { schema: { ...listPdfIndexSchema, tags: ['PDF Index'] }, preHandler: verifyToken },
        pdfIndexController.listPdfIndex
    );

    // GET /api/pdf-index/:id - Get a single entry
    fastify.get<{ Params: PdfIndexParam }>(
        '/:id',
        { schema: { ...getPdfIndexEntrySchema, tags: ['PDF Index'] }, preHandler: verifyToken },
        pdfIndexController.getPdfIndexEntry
    );

    // POST /api/pdf-index - Create a new entry (Admin only)
    fastify.post<{ Body: CreatePdfIndexInput }>(
        '/',
        { schema: { ...createPdfIndexSchema, tags: ['PDF Index'] }, preHandler: requireAdmin },
        pdfIndexController.createPdfIndexEntry
    );

    // PUT /api/pdf-index/:id - Update an entry (Admin only)
    fastify.put<{ Params: PdfIndexParam; Body: UpdatePdfIndexInput }>(
        '/:id',
        { schema: { ...updatePdfIndexSchema, tags: ['PDF Index'] }, preHandler: requireAdmin },
        pdfIndexController.updatePdfIndexEntry
    );

    // DELETE /api/pdf-index/:id - Soft-delete an entry (Admin only)
    fastify.delete<{ Params: PdfIndexParam }>(
        '/:id',
        { schema: { ...deletePdfIndexSchema, tags: ['PDF Index'] }, preHandler: requireAdmin },
        pdfIndexController.deletePdfIndexEntry
    );
}

export default pdfIndexRoutes;
