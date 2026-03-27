import { FastifyRequest, FastifyReply } from 'fastify';
import { Op, fn, col } from 'sequelize';
import { RaahbarBook, RaahbarBookCreationAttributes, sequelize } from '../../models';
import { NotFound, BadRequest } from '../../libs/error';
import { AuthenticatedRequest } from '../../middlewares/authMiddleware';
import path from 'path';
import { uploadToSupabase, deleteFromSupabase, getSignedUrl, UploadedFile } from '../../utils/file-handler';
import { BUCKETS } from '../../libs/supabase';

// Helper to process book URLs with Signed URLs for Supabase paths
const processBookUrls = async (book: any) => {
    if (book.pdfUrl && !book.pdfUrl.startsWith('http')) {
        try {
            book.pdfUrl = await getSignedUrl(BUCKETS.RAAHBAR, book.pdfUrl);
        } catch (e) {
            // Log but don't fail, fallback to stored path
            console.error('Failed to sign PDF URL', e);
        }
    }
    if (book.thumbnailUrl && !book.thumbnailUrl.startsWith('http')) {
        try {
            book.thumbnailUrl = await getSignedUrl(BUCKETS.RAAHBAR, book.thumbnailUrl);
        } catch (e) {
            console.error('Failed to sign Thumbnail URL', e);
        }
    }
    return book;
};

export interface ListBooksQuery {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: 'bookNumber' | 'title' | 'createdAt' | 'downloadCount';
    sortOrder?: 'asc' | 'desc';
    hijriYear?: number;
}

export interface CreateBookInput {
    bookNumber: number;
    title: string;
    titleGujarati?: string;
    titleArabic?: string;
    description?: string;
    descriptionGujarati?: string;
    author?: string;
    pdfUrl: string;
    thumbnailUrl?: string;
    totalPages?: number;
    fileSize?: number;
    publishedDate?: string;
    hijriYear?: number;
    hijriMonth?: number;
    hijriMonthName?: string;
}

export interface UpdateBookInput extends Partial<CreateBookInput> {
    isActive?: boolean;
}

/**
 * Get all Raahbar books with pagination and search
 * If hijriYear is provided, returns books for that year grouped by Hijri months
 * If no hijriYear is provided, returns the latest book and list of available Hijri years
 */
export async function listBooks(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as ListBooksQuery;
    const {
        page = 1,
        pageSize = 20,
        search,
        sortBy = 'bookNumber',
        sortOrder = 'asc',
        hijriYear,
    } = query;

    // Get list of all available Hijri years
    const hijriYearsResult = await RaahbarBook.findAll({
        where: {
            isActive: true,
            hijriYear: { [Op.ne]: null as any }
        } as any,
        attributes: [[fn('DISTINCT', col('hijri_year')), 'hijriYear']],
        order: [[col('hijri_year'), 'DESC']],
        raw: true,
    }) as unknown as { hijriYear: number }[];

    const hijriYears = hijriYearsResult.map(r => r.hijriYear).filter(Boolean);

    // If no hijriYear provided, return latest book and list of Hijri years
    if (!hijriYear) {
        const latestBook = await RaahbarBook.findOne({
            where: { isActive: true },
            order: [['book_number', 'DESC']],
        });

        if (latestBook) {
            await processBookUrls(latestBook);
        }

        return reply.send({
            success: true,
            data: {
                latestBook,
                hijriYears,
            },
        });
    }

    // If hijriYear is provided, get books for that year
    const offset = (page - 1) * pageSize;
    const limit = Math.min(pageSize, 100); // Max 100 per page

    // Build where clause
    const where: any = {
        isActive: true,
        hijriYear: hijriYear,
    };

    if (search) {
        where[Op.or] = [
            { title: { [Op.iLike]: `%${search}%` } },
            { titleGujarati: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
        ];
    }

    // Map sortBy to actual column names
    const sortColumn = sortBy === 'bookNumber' ? 'book_number' :
        sortBy === 'downloadCount' ? 'download_count' :
            sortBy === 'createdAt' ? 'created_at' : sortBy;

    const { rows: books, count: total } = await RaahbarBook.findAndCountAll({
        where,
        order: [['hijri_month', 'ASC'], [sortColumn, sortOrder.toUpperCase()]],
        limit,
        offset,
    });

    // Group books by Hijri month
    const booksByMonth: { [key: string]: { month: number; monthName: string; books: typeof books } } = {};

    for (const book of books) {
        await processBookUrls(book);
        const monthKey = book.hijriMonth?.toString() || 'unknown';
        if (!booksByMonth[monthKey]) {
            booksByMonth[monthKey] = {
                month: book.hijriMonth || 0,
                monthName: book.hijriMonthName || 'Unknown',
                books: [],
            };
        }
        booksByMonth[monthKey].books.push(book);
    }

    // Convert to array sorted by month
    const groupedData = Object.values(booksByMonth).sort((a, b) => a.month - b.month);

    const totalPages = Math.ceil(total / limit);

    return reply.send({
        success: true,
        data: {
            hijriYear,
            hijriYears,
            months: groupedData,
        },
        meta: {
            page,
            pageSize: limit,
            total,
            totalPages,
            hasMore: page < totalPages,
        },
    });
}

/**
 * Get a single Raahbar book by ID or book number
 */
export async function getBook(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    // Try to find by book number first (if purely numeric), then by UUID
    let book;
    const isNumeric = /^\d+$/.test(id);

    if (isNumeric) {
        const bookNumber = parseInt(id, 10);
        book = await RaahbarBook.findOne({ where: { bookNumber, isActive: true } });
    }

    if (!book) {
        book = await RaahbarBook.findOne({ where: { id, isActive: true } });
    }

    if (!book) {
        throw new NotFound('Book not found');
    }

    await processBookUrls(book);

    return reply.send({
        success: true,
        data: book,
    });
}

function parseOptionalInt(value: string | undefined): number | undefined {
    if (value === undefined || value === '') return undefined;
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : undefined;
}

/**
 * Create a new Raahbar book (Admin only)
 *
 * - **application/json**: `bookNumber`, `title`, `pdfUrl` (and optional `thumbnailUrl`) must be valid URIs to existing files.
 * - **multipart/form-data**: `bookNumber`, `title`, and a PDF in field `pdf` (optional `thumbnail` image). Stored paths are saved as `pdfUrl` / `thumbnailUrl`.
 */
export async function createBook(request: FastifyRequest, reply: FastifyReply) {
    let body: CreateBookInput;

    request.log.info({ contentType: request.headers['content-type'], isMultipart: request.isMultipart() }, 'Create book request received');

    if (request.isMultipart()) {
        const parts = request.parts();
        const fields: Record<string, string> = {};
        let pdfFile: UploadedFile | undefined;
        let thumbFile: UploadedFile | undefined;

        for await (const part of parts) {
            if (part.type === 'file') {
                const name = part.fieldname;
                const buffer = await part.toBuffer();
                const filename = `${Date.now()}-${part.filename}`;
                
                if (name === 'pdf' || name === 'file') {
                    const storagePath = `books/${filename}`;
                    const path = await uploadToSupabase(BUCKETS.RAAHBAR, storagePath, buffer, part.mimetype);
                    pdfFile = { path, size: buffer.length, filename, originalName: part.filename, mimeType: part.mimetype };
                } else if (name === 'thumbnail') {
                    const storagePath = `thumbnails/${filename}`;
                    const path = await uploadToSupabase(BUCKETS.RAAHBAR, storagePath, buffer, part.mimetype);
                    thumbFile = { path, size: buffer.length, filename, originalName: part.filename, mimeType: part.mimetype };
                } else {
                    throw new BadRequest(`Unexpected file field "${name}". Use "pdf" (or "file") and optionally "thumbnail".`);
                }
            } else {
                fields[part.fieldname] = part.value as string;
            }
        }

        if (!pdfFile) {
            throw new BadRequest('Multipart request must include a PDF file in field "pdf" (or "file")');
        }

        const bookNumber = parseInt(fields['bookNumber'] ?? '', 10);
        if (!Number.isFinite(bookNumber) || bookNumber < 1) {
            throw new BadRequest('Field "bookNumber" must be a positive integer');
        }
        const title = fields['title']?.trim();
        if (!title) {
            throw new BadRequest('Field "title" is required');
        }

        body = {
            bookNumber,
            title,
            titleGujarati: fields['titleGujarati'] || undefined,
            titleArabic: fields['titleArabic'] || undefined,
            description: fields['description'] || undefined,
            descriptionGujarati: fields['descriptionGujarati'] || undefined,
            author: fields['author'] || undefined,
            pdfUrl: pdfFile.path,
            thumbnailUrl: thumbFile?.path,
            totalPages: parseOptionalInt(fields['totalPages']),
            fileSize: pdfFile.size,
            publishedDate: fields['publishedDate'] || undefined,
            hijriYear: parseOptionalInt(fields['hijriYear']),
            hijriMonth: parseOptionalInt(fields['hijriMonth']),
            hijriMonthName: fields['hijriMonthName'] || undefined,
        };
    } else {
        body = request.body as CreateBookInput;
        const missingFields = [];
        if (body.bookNumber == null) missingFields.push('bookNumber');
        if (!String(body.title ?? '').trim()) missingFields.push('title');
        if (!body.pdfUrl) missingFields.push('pdfUrl');

        if (missingFields.length > 0) {
            throw new BadRequest(`Missing required fields: ${missingFields.join(', ')}. Note: This error occured because the request was NOT recognized as multipart/form-data. If you are uploading a file, ensure your Content-Type is set correctly.`);
        }
    }

    // Check if book number already exists
    const existingBook = await RaahbarBook.findOne({
        where: { bookNumber: body.bookNumber },
        paranoid: false, // Include soft-deleted
    });

    if (existingBook) {
        throw new BadRequest(`Book with number ${body.bookNumber} already exists`);
    }

    const bookData: RaahbarBookCreationAttributes = {
        bookNumber: body.bookNumber,
        title: body.title,
        titleGujarati: body.titleGujarati,
        titleArabic: body.titleArabic,
        description: body.description,
        descriptionGujarati: body.descriptionGujarati,
        author: body.author,
        pdfUrl: body.pdfUrl,
        thumbnailUrl: body.thumbnailUrl,
        totalPages: body.totalPages,
        fileSize: body.fileSize,
        publishedDate: body.publishedDate ? new Date(body.publishedDate) : undefined,
        hijriYear: body.hijriYear,
        hijriMonth: body.hijriMonth,
        hijriMonthName: body.hijriMonthName,
    };

    const book = await RaahbarBook.create(bookData);

    request.log.info({ bookId: book.id, bookNumber: book.bookNumber }, 'Raahbar book created');

    return reply.status(201).send({
        success: true,
        data: book,
    });
}

/**
 * Update a Raahbar book (Admin only)
 */
export async function updateBook(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    
    let body: UpdateBookInput;
    let newPdfFile: UploadedFile | undefined;
    let newThumbFile: UploadedFile | undefined;

    if (request.isMultipart()) {
        const parts = request.parts();
        const fields: Record<string, string> = {};

        for await (const part of parts) {
            if (part.type === 'file') {
                const name = part.fieldname;
                const buffer = await part.toBuffer();
                const filename = `${Date.now()}-${part.filename}`;

                if (name === 'pdf' || name === 'file') {
                    const storagePath = `books/${filename}`;
                    const path = await uploadToSupabase(BUCKETS.RAAHBAR, storagePath, buffer, part.mimetype);
                    newPdfFile = { path, size: buffer.length, filename, originalName: part.filename, mimeType: part.mimetype };
                } else if (name === 'thumbnail') {
                    const storagePath = `thumbnails/${filename}`;
                    const path = await uploadToSupabase(BUCKETS.RAAHBAR, storagePath, buffer, part.mimetype);
                    newThumbFile = { path, size: buffer.length, filename, originalName: part.filename, mimeType: part.mimetype };
                } else {
                    throw new BadRequest(`Unexpected file field "${name}". Use "pdf" (or "file") and optionally "thumbnail".`);
                }
            } else {
                fields[part.fieldname] = part.value as string;
            }
        }

        body = {
            bookNumber: parseOptionalInt(fields['bookNumber']),
            title: fields['title'],
            titleGujarati: fields['titleGujarati'],
            titleArabic: fields['titleArabic'],
            description: fields['description'],
            descriptionGujarati: fields['descriptionGujarati'],
            author: fields['author'],
            pdfUrl: newPdfFile?.path,
            thumbnailUrl: newThumbFile?.path,
            totalPages: parseOptionalInt(fields['totalPages']),
            fileSize: newPdfFile?.size,
            publishedDate: fields['publishedDate'],
            hijriYear: parseOptionalInt(fields['hijriYear']),
            hijriMonth: parseOptionalInt(fields['hijriMonth']),
            hijriMonthName: fields['hijriMonthName'],
            isActive: fields['isActive'] === 'true' ? true : (fields['isActive'] === 'false' ? false : undefined),
        };
    } else {
        body = request.body as UpdateBookInput;
    }

    const book = await RaahbarBook.findByPk(id);
    if (!book) {
        throw new NotFound('Book not found');
    }

    // If updating book number, check for conflicts
    if (body.bookNumber && body.bookNumber !== book.bookNumber) {
        const existingBook = await RaahbarBook.findOne({
            where: { bookNumber: body.bookNumber },
            paranoid: false,
        });
        if (existingBook) {
            throw new BadRequest(`Book with number ${body.bookNumber} already exists`);
        }
    }

    // If uploading new files, delete the old ones from Supabase
    if (newPdfFile && book.pdfUrl && !book.pdfUrl.startsWith('http')) {
        await deleteFromSupabase(BUCKETS.RAAHBAR, book.pdfUrl);
    }
    if (newThumbFile && book.thumbnailUrl && !book.thumbnailUrl.startsWith('http')) {
        await deleteFromSupabase(BUCKETS.RAAHBAR, book.thumbnailUrl);
    }

    // Update fields
    if (body.bookNumber !== undefined) book.bookNumber = body.bookNumber;
    if (body.title !== undefined) book.title = body.title;
    if (body.titleGujarati !== undefined) book.titleGujarati = body.titleGujarati;
    if (body.titleArabic !== undefined) book.titleArabic = body.titleArabic;
    if (body.description !== undefined) book.description = body.description;
    if (body.descriptionGujarati !== undefined) book.descriptionGujarati = body.descriptionGujarati;
    if (body.author !== undefined) book.author = body.author;
    if (newPdfFile) {
        book.pdfUrl = newPdfFile.path;
        book.fileSize = newPdfFile.size;
    } else if (body.pdfUrl !== undefined) {
        book.pdfUrl = body.pdfUrl;
    }
    if (newThumbFile) {
        book.thumbnailUrl = newThumbFile.path;
    } else if (body.thumbnailUrl !== undefined) {
        book.thumbnailUrl = body.thumbnailUrl;
    }
    if (body.totalPages !== undefined) book.totalPages = body.totalPages;
    if (body.fileSize !== undefined) book.fileSize = body.fileSize;
    if (body.publishedDate !== undefined) book.publishedDate = body.publishedDate ? new Date(body.publishedDate) : null;
    if (body.hijriYear !== undefined) book.hijriYear = body.hijriYear;
    if (body.hijriMonth !== undefined) book.hijriMonth = body.hijriMonth;
    if (body.hijriMonthName !== undefined) book.hijriMonthName = body.hijriMonthName;
    if (body.isActive !== undefined) book.isActive = body.isActive;

    await book.save();

    request.log.info({ bookId: book.id }, 'Raahbar book updated');

    return reply.send({
        success: true,
        data: book,
    });
}

/**
 * Delete a Raahbar book (Admin only) - Soft delete
 */
export async function deleteBook(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const book = await RaahbarBook.findByPk(id);
    if (!book) {
        throw new NotFound('Book not found');
    }

    if (book.pdfUrl && !book.pdfUrl.startsWith('http')) {
        await deleteFromSupabase(BUCKETS.RAAHBAR, book.pdfUrl);
    }
    if (book.thumbnailUrl && !book.thumbnailUrl.startsWith('http')) {
        await deleteFromSupabase(BUCKETS.RAAHBAR, book.thumbnailUrl);
    }

    await book.destroy(); // Soft delete due to paranoid: true

    request.log.info({ bookId: book.id }, 'Raahbar book deleted');

    return reply.send({
        success: true,
        message: 'Book deleted successfully',
    });
}

/**
 * Increment download count for a book
 */
export async function incrementDownload(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    // Try to find by book number first (if purely numeric), then by UUID
    let book;
    const isNumeric = /^\d+$/.test(id);

    if (isNumeric) {
        const bookNumber = parseInt(id, 10);
        book = await RaahbarBook.findOne({ where: { bookNumber, isActive: true } });
    }

    if (!book) {
        book = await RaahbarBook.findOne({ where: { id, isActive: true } });
    }

    if (!book) {
        throw new NotFound('Book not found');
    }

    book.downloadCount += 1;
    await book.save();

    return reply.send({
        success: true,
        data: { downloadCount: book.downloadCount },
    });
}

/**
 * Download book PDF file
 */
export async function downloadBook(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { download } = request.query as { download?: string };

    // Find the book by ID or book number
    let book;
    const isNumeric = /^\d+$/.test(id);

    if (isNumeric) {
        const bookNumber = parseInt(id, 10);
        book = await RaahbarBook.findOne({ where: { bookNumber, isActive: true } });
    }
    
    if (!book) {
        book = await RaahbarBook.findOne({ where: { id, isActive: true } });
    }

    if (!book) {
        throw new NotFound('Book not found');
    }

    // Generate a signed URL for download
    if (book.pdfUrl && !book.pdfUrl.startsWith('http')) {
        const signedUrl = await getSignedUrl(BUCKETS.RAAHBAR, book.pdfUrl);
        return reply.redirect(signedUrl);
    }

    // Fallback if somehow it's a direct URL or local (local handling omitted for brevity/migration)
    if (book.pdfUrl && book.pdfUrl.startsWith('http')) {
        return reply.redirect(book.pdfUrl);
    }

    throw new NotFound('PDF file not found');
}

/**
 * Bulk create books (Admin only) - For initial data seeding
 */
export async function bulkCreateBooks(request: FastifyRequest, reply: FastifyReply) {
    const { books } = request.body as { books: CreateBookInput[] };

    if (!books || !Array.isArray(books) || books.length === 0) {
        throw new BadRequest('Books array is required');
    }

    const createdBooks = [];
    const errors = [];

    for (const bookInput of books) {
        try {
            // Check if book number already exists
            const existingBook = await RaahbarBook.findOne({
                where: { bookNumber: bookInput.bookNumber },
                paranoid: false,
            });

            if (existingBook) {
                errors.push({ bookNumber: bookInput.bookNumber, error: 'Book number already exists' });
                continue;
            }

            const book = await RaahbarBook.create({
                bookNumber: bookInput.bookNumber,
                title: bookInput.title,
                titleGujarati: bookInput.titleGujarati,
                titleArabic: bookInput.titleArabic,
                description: bookInput.description,
                descriptionGujarati: bookInput.descriptionGujarati,
                author: bookInput.author,
                pdfUrl: bookInput.pdfUrl,
                thumbnailUrl: bookInput.thumbnailUrl,
                totalPages: bookInput.totalPages,
                fileSize: bookInput.fileSize,
                publishedDate: bookInput.publishedDate ? new Date(bookInput.publishedDate) : undefined,
                hijriYear: bookInput.hijriYear,
                hijriMonth: bookInput.hijriMonth,
                hijriMonthName: bookInput.hijriMonthName,
            });

            createdBooks.push(book);
        } catch (err: any) {
            errors.push({ bookNumber: bookInput.bookNumber, error: err.message });
        }
    }

    request.log.info({ created: createdBooks.length, errors: errors.length }, 'Bulk book creation completed');

    return reply.status(201).send({
        success: true,
        data: {
            created: createdBooks,
            errors,
            summary: {
                total: books.length,
                success: createdBooks.length,
                failed: errors.length,
            },
        },
    });
}
