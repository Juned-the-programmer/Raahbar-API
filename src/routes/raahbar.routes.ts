import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as raahbarController from '../controllers/raahbar/raahbarController';
import {
    listBooksSchema,
    getBookSchema,
    createBookSchema,
    updateBookSchema,
    bulkCreateBooksSchema,
} from '../controllers/raahbar/schema';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware';

async function raahbarRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions) {
    // GET /raahbar/books - List all books (authenticated)
    fastify.get(
        '/books',
        { schema: { ...listBooksSchema, tags: ['Raahbar'] }, preHandler: verifyToken },
        raahbarController.listBooks
    );

    // GET /raahbar/books/:id - Get single book by ID or book number (authenticated)
    fastify.get(
        '/books/:id',
        { schema: { ...getBookSchema, tags: ['Raahbar'] }, preHandler: verifyToken },
        raahbarController.getBook
    );

    // POST /raahbar/books/:id/download - Increment download count (authenticated)
    fastify.post(
        '/books/:id/download',
        { schema: { ...getBookSchema, tags: ['Raahbar'] }, preHandler: verifyToken },
        raahbarController.incrementDownload
    );

    // GET /raahbar/books/:id/download - Download book PDF (authenticated)
    fastify.get(
        '/books/:id/download',
        { schema: { ...getBookSchema, tags: ['Raahbar'] }, preHandler: verifyToken },
        raahbarController.downloadBook
    );

    // POST /raahbar/books - Create new book (admin only)
    fastify.post(
        '/books',
        {
            preHandler: requireAdmin,
            schema: { ...createBookSchema, tags: ['Raahbar'] },
        },
        raahbarController.createBook
    );

    // POST /raahbar/books/bulk - Bulk create books (admin only)
    fastify.post(
        '/books/bulk',
        {
            preHandler: requireAdmin,
            schema: { ...bulkCreateBooksSchema, tags: ['Raahbar'] },
        },
        raahbarController.bulkCreateBooks
    );

    // PUT /raahbar/books/:id - Update book (admin only)
    fastify.put(
        '/books/:id',
        {
            preHandler: requireAdmin,
            schema: { ...updateBookSchema, tags: ['Raahbar'] },
        },
        raahbarController.updateBook
    );

    // DELETE /raahbar/books/:id - Delete book (admin only)
    fastify.delete(
        '/books/:id',
        {
            preHandler: requireAdmin,
            schema: { ...getBookSchema, tags: ['Raahbar'] },
        },
        raahbarController.deleteBook
    );
}

export default raahbarRoutes;
