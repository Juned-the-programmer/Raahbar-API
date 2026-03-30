import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as quranController from '../controllers/quran/quranController';
import {
  createQuranSchema,
  updateQuranSchema,
  listQuranSchema,
  getQuranSchema,
  getSurahSchema,
  deleteQuranSchema,
  // New normalized schemas
  listSurahsSchema,
  getSurahDetailsSchema,
  listParahsSchema,
  getParahDetailsSchema,
  listAyahsSchema,
  getAyahSchema,
  // Types
  ListSurahsQuery,
  SurahDetailsQuery,
  SurahParam,
  ParahDetailsQuery,
  ParahParam,
  ListAyahsQuery,
  AyahDetailsQuery,
  AyahParam,
  ListQuranQuery,
  IdParam,
} from '../controllers/quran/schema';
import { verifyToken } from '../middlewares/authMiddleware';

async function quranRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  // ==================== NEW NORMALIZED ENDPOINTS ====================

  // Surah endpoints (authenticated)
  fastify.get<{ Querystring: ListSurahsQuery }>('/surahs', { schema: { ...listSurahsSchema, tags: ['Quran - Surahs'] }, preHandler: verifyToken }, quranController.listSurahs);
  fastify.get<{ Params: SurahParam; Querystring: SurahDetailsQuery }>('/surahs/:surahNumber', { schema: { ...getSurahDetailsSchema, tags: ['Quran - Surahs'] }, preHandler: verifyToken }, quranController.getSurahDetails);

  // Parah endpoints (authenticated)
  fastify.get<{ Querystring: ParahDetailsQuery }>('/parahs', { schema: { ...listParahsSchema, tags: ['Quran - Parahs'] }, preHandler: verifyToken }, quranController.listParahs);
  fastify.get<{ Params: ParahParam; Querystring: ParahDetailsQuery }>('/parahs/:parahNumber', { schema: { ...getParahDetailsSchema, tags: ['Quran - Parahs'] }, preHandler: verifyToken }, quranController.getParahDetails);

  // Ayah endpoints (authenticated)
  fastify.get<{ Querystring: ListAyahsQuery }>('/ayahs', { schema: { ...listAyahsSchema, tags: ['Quran - Ayahs'] }, preHandler: verifyToken }, quranController.listAyahs);
  fastify.get<{ Params: AyahParam; Querystring: AyahDetailsQuery }>('/ayahs/:ayahNumber', { schema: { ...getAyahSchema, tags: ['Quran - Ayahs'] }, preHandler: verifyToken }, quranController.getAyahDetails);

  // ==================== LEGACY ENDPOINTS (kept for backward compatibility) ====================

  // GET /quran - List all quran entries (legacy, authenticated)
  fastify.get<{ Querystring: ListQuranQuery }>('/', { schema: { ...listQuranSchema, tags: ['Quran - Legacy'] }, preHandler: verifyToken }, quranController.listQurans);

  // GET /quran/surah/:surahNumber - Get all ayahs for a surah (legacy, authenticated)
  fastify.get<{ Params: SurahParam }>(
    '/surah/:surahNumber',
    { schema: { ...getSurahSchema, tags: ['Quran - Legacy'] }, preHandler: verifyToken },
    quranController.getQuranBySurah
  );

  // GET /quran/:id - Get single quran entry (legacy, authenticated)
  fastify.get<{ Params: IdParam }>('/:id', { schema: { ...getQuranSchema, tags: ['Quran - Legacy'] }, preHandler: verifyToken }, quranController.getQuranById);

  // POST /quran - Create new quran entry (legacy)
  fastify.post('/', { schema: { ...createQuranSchema, tags: ['Quran - Legacy'] } }, quranController.createQuran);

  // PUT /quran/:id - Update quran entry (legacy)
  fastify.put('/:id', { schema: { ...updateQuranSchema, tags: ['Quran - Legacy'] } }, quranController.updateQuran);

  // DELETE /quran/:id - Soft delete quran entry (legacy)
  fastify.delete('/:id', { schema: { ...deleteQuranSchema, tags: ['Quran - Legacy'] } }, quranController.deleteQuran);
}

export default quranRoutes;

