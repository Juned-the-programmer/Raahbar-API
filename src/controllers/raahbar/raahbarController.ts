import { FastifyRequest, FastifyReply } from 'fastify';
import { Op, fn, col } from 'sequelize';
import { RaahbarBook, RaahbarBookCreationAttributes, sequelize } from '../../models';
import { NotFound, BadRequest } from '../../libs/error';
import { AuthenticatedRequest } from '../../middlewares/authMiddleware';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const access = promisify(fs.access);
const stat = promisify(fs.stat);

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

    // Try to find by book number first (if numeric), then by UUID
    let book;
    const bookNumber = parseInt(id, 10);

    if (!isNaN(bookNumber)) {
        book = await RaahbarBook.findOne({ where: { bookNumber, isActive: true } });
    }

    if (!book) {
        book = await RaahbarBook.findOne({ where: { id, isActive: true } });
    }

    if (!book) {
        throw new NotFound('Book not found');
    }

    return reply.send({
        success: true,
        data: book,
    });
}

/**
 * Create a new Raahbar book (Admin only)
 */
export async function createBook(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as CreateBookInput;

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
    const body = request.body as UpdateBookInput;

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

    // Update fields
    if (body.bookNumber !== undefined) book.bookNumber = body.bookNumber;
    if (body.title !== undefined) book.title = body.title;
    if (body.titleGujarati !== undefined) book.titleGujarati = body.titleGujarati;
    if (body.titleArabic !== undefined) book.titleArabic = body.titleArabic;
    if (body.description !== undefined) book.description = body.description;
    if (body.descriptionGujarati !== undefined) book.descriptionGujarati = body.descriptionGujarati;
    if (body.author !== undefined) book.author = body.author;
    if (body.pdfUrl !== undefined) book.pdfUrl = body.pdfUrl;
    if (body.thumbnailUrl !== undefined) book.thumbnailUrl = body.thumbnailUrl;
    if (body.totalPages !== undefined) book.totalPages = body.totalPages;
    if (body.fileSize !== undefined) book.fileSize = body.fileSize;
    if (body.publishedDate !== undefined) book.publishedDate = new Date(body.publishedDate);
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

    // Try to find by book number first (if numeric), then by UUID
    let book;
    const bookNumber = parseInt(id, 10);

    if (!isNaN(bookNumber)) {
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
    const bookNumber = parseInt(id, 10);

    if (!isNaN(bookNumber)) {
        book = await RaahbarBook.findOne({ where: { bookNumber, isActive: true } });
    } else {
        book = await RaahbarBook.findByPk(id);
    }

    if (!book) {
        throw new NotFound('Book not found');
    }

    // Get the file path from the book's pdfUrl
    const filename = path.basename(book.pdfUrl);
    const filePath = path.join(process.cwd(), 'uploads', 'raahbar', filename);

    try {
        // Check if file exists and is accessible
        await access(filePath, fs.constants.F_OK);
        const fileStat = await stat(filePath);

        // Set appropriate headers for file download
        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Length', fileStat.size);

        // Set Content-Disposition header to force download or inline view
        const disposition = download === 'true' ? 'attachment' : 'inline';
        reply.header('Content-Disposition', `${disposition}; filename="${filename}"`);

        // Stream the file
        const stream = fs.createReadStream(filePath);
        return reply.send(stream);
    } catch (error) {
        console.error('Error serving file:', error);
        throw new NotFound('File not found or inaccessible');
    }
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
