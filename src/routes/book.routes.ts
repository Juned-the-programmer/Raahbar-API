import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as bookController from '../controllers/book/bookController';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware';

async function bookRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions) {

    // ==================== HAJJ PDF ROUTES ====================

    // GET /api/book/hajj/pdf - Download the Hajj PDF
    fastify.get(
        '/hajj/pdf',
        { schema: { tags: ['Book - Hajj PDF'] }, preHandler: verifyToken },
        bookController.downloadHajjPdf
    );

    // POST /api/book/hajj/pdf - Upload the Hajj PDF (Admin only)
    fastify.post(
        '/hajj/pdf',
        { schema: { tags: ['Book - Hajj PDF'] }, preHandler: requireAdmin },
        bookController.uploadHajjPdf
    );

    // ==================== PANJSURAH PDF ROUTES ====================

    // GET /api/book/panjsurah/pdf - Download the Panjsurah PDF
    fastify.get(
        '/panjsurah/pdf',
        { schema: { tags: ['Book - Panjsurah PDF'] }, preHandler: verifyToken },
        bookController.downloadPanjsurahPdf
    );

    // POST /api/book/panjsurah/pdf - Upload the Panjsurah PDF (Admin only)
    fastify.post(
        '/panjsurah/pdf',
        { schema: { tags: ['Book - Panjsurah PDF'] }, preHandler: requireAdmin },
        bookController.uploadPanjsurahPdf
    );
}

export default bookRoutes;
