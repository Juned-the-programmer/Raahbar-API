export const listBooksSchema = {
    querystring: {
        type: 'object',
        properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            search: { type: 'string' },
            sortBy: { type: 'string', enum: ['bookNumber', 'title', 'createdAt', 'downloadCount'] },
            sortOrder: { type: 'string', enum: ['asc', 'desc'] },
            hijriYear: { type: 'integer', minimum: 1 },
        },
    },
};

export const getBookSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string' },
        },
    },
};

export const createBookSchema = {
    body: {
        type: 'object',
        required: ['bookNumber', 'title', 'pdfUrl'],
        properties: {
            bookNumber: { type: 'integer', minimum: 1 },
            title: { type: 'string', minLength: 1, maxLength: 500 },
            titleGujarati: { type: 'string', maxLength: 500 },
            titleArabic: { type: 'string', maxLength: 500 },
            description: { type: 'string' },
            descriptionGujarati: { type: 'string' },
            author: { type: 'string', maxLength: 255 },
            pdfUrl: { type: 'string', format: 'uri', maxLength: 1000 },
            thumbnailUrl: { type: 'string', format: 'uri', maxLength: 1000 },
            totalPages: { type: 'integer', minimum: 1 },
            fileSize: { type: 'integer', minimum: 0 },
            publishedDate: { type: 'string', format: 'date' },
            hijriYear: { type: 'integer', minimum: 1 },
            hijriMonth: { type: 'integer', minimum: 1, maximum: 12 },
            hijriMonthName: { type: 'string', maxLength: 50 },
        },
    },
};

export const updateBookSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', format: 'uuid' },
        },
    },
    body: {
        type: 'object',
        properties: {
            bookNumber: { type: 'integer', minimum: 1 },
            title: { type: 'string', minLength: 1, maxLength: 500 },
            titleGujarati: { type: 'string', maxLength: 500 },
            titleArabic: { type: 'string', maxLength: 500 },
            description: { type: 'string' },
            descriptionGujarati: { type: 'string' },
            author: { type: 'string', maxLength: 255 },
            pdfUrl: { type: 'string', format: 'uri', maxLength: 1000 },
            thumbnailUrl: { type: 'string', format: 'uri', maxLength: 1000 },
            totalPages: { type: 'integer', minimum: 1 },
            fileSize: { type: 'integer', minimum: 0 },
            publishedDate: { type: 'string', format: 'date' },
            hijriYear: { type: 'integer', minimum: 1 },
            hijriMonth: { type: 'integer', minimum: 1, maximum: 12 },
            hijriMonthName: { type: 'string', maxLength: 50 },
            isActive: { type: 'boolean' },
        },
    },
};

export const bulkCreateBooksSchema = {
    body: {
        type: 'object',
        required: ['books'],
        properties: {
            books: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['bookNumber', 'title', 'pdfUrl'],
                    properties: {
                        bookNumber: { type: 'integer', minimum: 1 },
                        title: { type: 'string', minLength: 1, maxLength: 500 },
                        titleGujarati: { type: 'string', maxLength: 500 },
                        titleArabic: { type: 'string', maxLength: 500 },
                        description: { type: 'string' },
                        descriptionGujarati: { type: 'string' },
                        author: { type: 'string', maxLength: 255 },
                        pdfUrl: { type: 'string', format: 'uri', maxLength: 1000 },
                        thumbnailUrl: { type: 'string', format: 'uri', maxLength: 1000 },
                        totalPages: { type: 'integer', minimum: 1 },
                        fileSize: { type: 'integer', minimum: 0 },
                        publishedDate: { type: 'string', format: 'date' },
                        hijriYear: { type: 'integer', minimum: 1 },
                        hijriMonth: { type: 'integer', minimum: 1, maximum: 12 },
                        hijriMonthName: { type: 'string', maxLength: 50 },
                    },
                },
                minItems: 1,
                maxItems: 100,
            },
        },
    },
};
