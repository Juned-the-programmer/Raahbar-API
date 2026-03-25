import { FastifyRequest, FastifyReply } from 'fastify';
import { uploadToSupabase, getSignedUrl } from '../../utils/file-handler';
import { BUCKETS } from '../../libs/supabase';
import { BadRequest, NotFound } from '../../libs/error';

// Supabase Paths
const HAJJ_PDF_PATH = 'Hajj/hajj.pdf';
const PANJSURAH_PDF_PATH = 'PanjSurah/panjsurah.pdf';

/**
 * Upload the Hajj PDF (Admin only)
 */
export async function uploadHajjPdf(request: FastifyRequest, reply: FastifyReply) {
    if (!request.isMultipart()) {
        throw new BadRequest('Request must be multipart/form-data');
    }

    const parts = request.parts();
    let uploaded = false;

    for await (const part of parts) {
        if (part.type === 'file' && (part.fieldname === 'pdf' || part.fieldname === 'file')) {
            if (part.mimetype !== 'application/pdf' && !part.filename.toLowerCase().endsWith('.pdf')) {
                throw new BadRequest('Only PDF files are allowed');
            }

            const buffer = await part.toBuffer();
            await uploadToSupabase(BUCKETS.RAAHBAR, HAJJ_PDF_PATH, buffer, part.mimetype);
            uploaded = true;
            break;
        }
    }

    if (!uploaded) {
        throw new BadRequest('No PDF file uploaded. Please upload the file using the "pdf" or "file" field.');
    }

    return reply.status(201).send({
        success: true,
        message: 'Hajj PDF uploaded successfully to Supabase',
    });
}

/**
 * Download the Hajj PDF
 */
export async function downloadHajjPdf(request: FastifyRequest, reply: FastifyReply) {
    try {
        const signedUrl = await getSignedUrl(BUCKETS.RAAHBAR, HAJJ_PDF_PATH);
        return reply.redirect(signedUrl);
    } catch (error) {
        throw new NotFound('Hajj PDF has not been uploaded yet or is inaccessible');
    }
}

/**
 * Upload the Panjsurah PDF (Admin only)
 */
export async function uploadPanjsurahPdf(request: FastifyRequest, reply: FastifyReply) {
    if (!request.isMultipart()) {
        throw new BadRequest('Request must be multipart/form-data');
    }

    const parts = request.parts();
    let uploaded = false;

    for await (const part of parts) {
        if (part.type === 'file' && (part.fieldname === 'pdf' || part.fieldname === 'file')) {
            if (part.mimetype !== 'application/pdf' && !part.filename.toLowerCase().endsWith('.pdf')) {
                throw new BadRequest('Only PDF files are allowed');
            }

            const buffer = await part.toBuffer();
            await uploadToSupabase(BUCKETS.RAAHBAR, PANJSURAH_PDF_PATH, buffer, part.mimetype);
            uploaded = true;
            break;
        }
    }

    if (!uploaded) {
        throw new BadRequest('No PDF file uploaded. Please upload the file using the "pdf" or "file" field.');
    }

    return reply.status(201).send({
        success: true,
        message: 'Panjsurah PDF uploaded successfully to Supabase',
    });
}

/**
 * Download the Panjsurah PDF
 */
export async function downloadPanjsurahPdf(request: FastifyRequest, reply: FastifyReply) {
    try {
        const signedUrl = await getSignedUrl(BUCKETS.RAAHBAR, PANJSURAH_PDF_PATH);
        return reply.redirect(signedUrl);
    } catch (error) {
        throw new NotFound('Panjsurah PDF has not been uploaded yet or is inaccessible');
    }
}
