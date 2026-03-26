import { Op, fn, col } from 'sequelize';
import {
  UserModel, PayamModel, RaahbarBookModel, ParahModel, SurahModel, AyahModel, AyahTranslationModel, sequelize
} from '../models';

// Quranic Constants
const TOTAL_SURAHS = 114;
const TOTAL_PARAHS = 30;
const TOTAL_AYAHS = 6236;

// Standard Ayah counts per Parah (Juz)
const PARAH_AYAH_COUNTS: Record<number, number> = {
  1: 148, 2: 111, 3: 126, 4: 131, 5: 124, 6: 110, 7: 149, 8: 142, 9: 159, 10: 127,
  11: 151, 12: 170, 13: 154, 14: 227, 15: 185, 16: 188, 17: 190, 18: 202, 19: 339, 20: 171,
  21: 178, 22: 169, 23: 357, 24: 175, 25: 246, 26: 195, 27: 399, 28: 137, 29: 431, 30: 564
};

export async function getDashboardStats() {
  // 1. User Statistics
  const totalUsers = await UserModel.count({ where: { role: 'user' } });
  const activeUsers = await UserModel.count({ where: { role: 'user', isActive: true } });
  const inactiveUsers = await UserModel.count({ where: { role: 'user', isActive: false } });

  // 2. Payam Statistics
  const totalPayams = await PayamModel.count();
  const sentPayams = await PayamModel.count({ where: { status: 'published' } });
  const scheduledPayams = await PayamModel.count({ where: { status: 'scheduled' } });

  // 3. Library Progress
  const addedSurahs = await SurahModel.count();
  const addedParahs = await ParahModel.count();
  const addedAyahs = await AyahModel.count();
  const totalBooks = await RaahbarBookModel.count();

  const library = {
    surahs: {
      total: TOTAL_SURAHS,
      added: addedSurahs,
      percentage: Number(((addedSurahs / TOTAL_SURAHS) * 100).toFixed(2))
    },
    parahs: {
      total: TOTAL_PARAHS,
      added: addedParahs,
      percentage: Number(((addedParahs / TOTAL_PARAHS) * 100).toFixed(2))
    },
    ayahs: {
      total: TOTAL_AYAHS,
      added: addedAyahs,
      percentage: Number(((addedAyahs / TOTAL_AYAHS) * 100).toFixed(2))
    },
    books: totalBooks
  };

  // 4. Translation Progress
  const gujaratiCount = await AyahTranslationModel.count({
    where: { language: 'gu', isActive: true }
  });
  const englishCount = await AyahTranslationModel.count({
    where: { language: 'en', isActive: true }
  });

  const translations = {
    gujarati: {
      added: gujaratiCount,
      total: TOTAL_AYAHS,
      percentage: Number(((gujaratiCount / TOTAL_AYAHS) * 100).toFixed(2))
    },
    english: {
      added: englishCount,
      total: TOTAL_AYAHS,
      percentage: Number(((englishCount / TOTAL_AYAHS) * 100).toFixed(2))
    }
  };

  // 5. Per-Surah Progress
  const surahProgressData = await SurahModel.findAll({
    attributes: [
      'surahNumber',
      'nameEnglish',
      'totalAyahs',
      [fn('COUNT', col('ayahs.id')), 'addedCount']
    ],
    include: [{
      model: AyahModel,
      as: 'ayahs',
      attributes: [],
      required: false
    }],
    group: ['SurahModel.id'],
    order: [['surahNumber', 'ASC']]
  });

  const surahProgress = surahProgressData.map((item: any) => {
    const added = parseInt(item.get('addedCount'));
    const total = item.totalAyahs;
    return {
      number: item.surahNumber,
      name: item.nameEnglish,
      added,
      total,
      percentage: Number(((added / total) * 100).toFixed(2))
    };
  });

  // 6. Per-Parah Progress
  const parahProgressData = await ParahModel.findAll({
    attributes: [
      'parahNumber',
      'nameEnglish',
      [fn('COUNT', col('ayahs.id')), 'addedCount']
    ],
    include: [{
      model: AyahModel,
      as: 'ayahs',
      attributes: [],
      required: false
    }],
    group: ['ParahModel.id'],
    order: [['parahNumber', 'ASC']]
  });

  const parahProgress = parahProgressData.map((item: any) => {
    const added = parseInt(item.get('addedCount'));
    const parahNumber = item.parahNumber;
    const total = PARAH_AYAH_COUNTS[parahNumber] || 0;
    return {
      number: parahNumber,
      name: item.nameEnglish,
      added,
      total,
      percentage: total > 0 ? Number(((added / total) * 100).toFixed(2)) : 0
    };
  });

  // 7. Raahbar Books Details
  const latestBook = await RaahbarBookModel.findOne({
    order: [['createdAt', 'DESC']],
    attributes: ['title', 'bookNumber', 'createdAt']
  });

  const raahbar = {
    totalBooks,
    latestBook: latestBook ? {
      title: latestBook.title,
      number: latestBook.bookNumber,
      addedAt: latestBook.createdAt
    } : null
  };

  // 8. Admin Activity
  const activeAdmins = await UserModel.count({ where: { role: 'admin', isActive: true } });

  // 9. Recent Activity (Last 10 signups)
  const recentSignups = await UserModel.findAll({
    where: { role: 'user' },
    limit: 10,
    order: [['createdAt', 'DESC']],
    attributes: ['id', 'name', 'phone', 'village', 'createdAt', 'isActive']
  });

  return {
    coreStats: {
      users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers },
      payams: { total: totalPayams, sent: sentPayams, scheduled: scheduledPayams },
      library,
      admins: { active: activeAdmins }
    },
    recentSignups,
    contentStatus: {
      translations,
      surahProgress,
      parahProgress,
      raahbar
    }
  };
}
