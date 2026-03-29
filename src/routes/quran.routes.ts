import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as quranController from '../controllers/quran/quranController';
import {
  createSurahSchema, updateSurahSchema, deleteSurahSchema, listSurahsSchema, getSurahDetailsSchema,
  createParahSchema, updateParahSchema, deleteParahSchema, listParahsSchema, getParahDetailsSchema,
  createAyahSchema, updateAyahSchema, deleteAyahSchema, listAyahsSchema, getAyahSchema, updateAyahTranslationSchema,
  SurahParam, ParahParam, AyahParam, AyahTranslationParam,
  ListSurahsQuery, SurahDetailsQuery, ParahDetailsQuery,
  ListAyahsQuery, AyahDetailsQuery,
  CreateSurahInput, UpdateSurahInput, CreateParahInput, UpdateParahInput,
  CreateAyahInput, UpdateAyahInput, UpdateAyahTranslationInput,
} from '../controllers/quran/schema';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware';

async function quranRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions) {

  // ==================== SURAH ROUTES ====================

  // GET /quran/surahs - List all surahs
  fastify.get<{ Querystring: ListSurahsQuery }>(
    '/surahs',
    { schema: { ...listSurahsSchema, tags: ['Quran - Surahs'] }, preHandler: verifyToken },
    quranController.listSurahs
  );

  // GET /quran/surahs/:surahNumber - Get surah with all ayahs
  fastify.get<{ Params: SurahParam; Querystring: SurahDetailsQuery }>(
    '/surahs/:surahNumber',
    { schema: { ...getSurahDetailsSchema, tags: ['Quran - Surahs'] }, preHandler: verifyToken },
    quranController.getSurahDetails
  );

  // POST /quran/surahs - Create a surah (Admin only)
  fastify.post<{ Body: CreateSurahInput }>(
    '/surahs',
    { schema: { ...createSurahSchema, tags: ['Quran - Surahs'] }, preHandler: requireAdmin },
    quranController.createSurah
  );

  // PATCH /quran/surahs/:surahNumber - Update a surah (Admin only)
  fastify.patch<{ Params: SurahParam; Body: UpdateSurahInput }>(
    '/surahs/:surahNumber',
    { schema: { ...updateSurahSchema, tags: ['Quran - Surahs'] }, preHandler: requireAdmin },
    quranController.updateSurah
  );

  // DELETE /quran/surahs/:surahNumber - Delete a surah (Admin only)
  fastify.delete<{ Params: SurahParam }>(
    '/surahs/:surahNumber',
    { schema: { ...deleteSurahSchema, tags: ['Quran - Surahs'] }, preHandler: requireAdmin },
    quranController.deleteSurah
  );

  // ==================== PARAH ROUTES ====================

  // GET /quran/parahs - List all parahs
  fastify.get(
    '/parahs',
    { schema: { ...listParahsSchema, tags: ['Quran - Parahs'] }, preHandler: verifyToken },
    quranController.listParahs
  );

  // GET /quran/parahs/:parahNumber - Get parah with all ayahs
  fastify.get<{ Params: ParahParam; Querystring: ParahDetailsQuery }>(
    '/parahs/:parahNumber',
    { schema: { ...getParahDetailsSchema, tags: ['Quran - Parahs'] }, preHandler: verifyToken },
    quranController.getParahDetails
  );

  // POST /quran/parahs - Create a parah (Admin only)
  fastify.post<{ Body: CreateParahInput }>(
    '/parahs',
    { schema: { ...createParahSchema, tags: ['Quran - Parahs'] }, preHandler: requireAdmin },
    quranController.createParah
  );

  // PATCH /quran/parahs/:parahNumber - Update a parah (Admin only)
  fastify.patch<{ Params: ParahParam; Body: UpdateParahInput }>(
    '/parahs/:parahNumber',
    { schema: { ...updateParahSchema, tags: ['Quran - Parahs'] }, preHandler: requireAdmin },
    quranController.updateParah
  );

  // DELETE /quran/parahs/:parahNumber - Delete a parah (Admin only)
  fastify.delete<{ Params: ParahParam }>(
    '/parahs/:parahNumber',
    { schema: { ...deleteParahSchema, tags: ['Quran - Parahs'] }, preHandler: requireAdmin },
    quranController.deleteParah
  );

  // ==================== AYAH ROUTES ====================

  // GET /quran/ayahs - List ayahs (filterable by surah/parah)
  fastify.get<{ Querystring: ListAyahsQuery }>(
    '/ayahs',
    { schema: { ...listAyahsSchema, tags: ['Quran - Ayahs'] }, preHandler: verifyToken },
    quranController.listAyahs
  );

  // GET /quran/ayahs/:ayahNumber - Get single ayah with translations
  fastify.get<{ Params: AyahParam; Querystring: AyahDetailsQuery }>(
    '/ayahs/:ayahNumber',
    { schema: { ...getAyahSchema, tags: ['Quran - Ayahs'] }, preHandler: verifyToken },
    quranController.getAyahDetails
  );

  // POST /quran/ayahs - Create ayah with embedded translations (Admin only)
  fastify.post<{ Body: CreateAyahInput }>(
    '/ayahs',
    { schema: { ...createAyahSchema, tags: ['Quran - Ayahs'] }, preHandler: requireAdmin },
    quranController.createAyah
  );

  // PATCH /quran/ayahs/:ayahNumber - Update an ayah (Admin only)
  fastify.patch<{ Params: AyahParam; Body: UpdateAyahInput }>(
    '/ayahs/:ayahNumber',
    { schema: { ...updateAyahSchema, tags: ['Quran - Ayahs'] }, preHandler: requireAdmin },
    quranController.updateAyah
  );

  // DELETE /quran/ayahs/:ayahNumber - Delete an ayah (Admin only)
  fastify.delete<{ Params: AyahParam }>(
    '/ayahs/:ayahNumber',
    { schema: { ...deleteAyahSchema, tags: ['Quran - Ayahs'] }, preHandler: requireAdmin },
    quranController.deleteAyah
  );

  // PATCH /quran/ayahs/:ayahNumber/translations/:language - Update a translation (Admin only)
  fastify.patch<{ Params: AyahTranslationParam; Body: UpdateAyahTranslationInput }>(
    '/ayahs/:ayahNumber/translations/:language',
    { schema: { ...updateAyahTranslationSchema, tags: ['Quran - Ayahs'] }, preHandler: requireAdmin },
    quranController.updateAyahTranslation
  );
}

export default quranRoutes;
