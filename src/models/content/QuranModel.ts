import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

export interface QuranAttributes {
  id: string;
  title: string;
  content: string | null;
  originalContent: string | null;
  contentType: 'text' | 'pdf';
  pdfPath: string | null;
  pdfOriginalName: string | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  createdBy: string | null;
  surahNumber: number | null;
  surahName: string | null;
  surahNameArabic: string | null;
  ayahNumber: number | null;
  ayahNumberInSurah: number | null;
  juzNumber: number | null;
  arabicText: string | null;
  transliteration: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuranCreationAttributes extends Optional<
  QuranAttributes,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'isActive'
  | 'originalContent'
  | 'metadata'
  | 'createdBy'
  | 'surahNumber'
  | 'surahName'
  | 'surahNameArabic'
  | 'ayahNumber'
  | 'ayahNumberInSurah'
  | 'juzNumber'
  | 'arabicText'
  | 'transliteration'
> { }

class QuranModel extends Model<QuranAttributes, QuranCreationAttributes> {
  declare id: string;
  declare title: string;
  declare content: string | null;
  declare originalContent: string | null;
  declare contentType: 'text' | 'pdf';
  declare pdfPath: string | null;
  declare pdfOriginalName: string | null;
  declare metadata: Record<string, unknown> | null;
  declare isActive: boolean;
  declare createdBy: string | null;
  declare surahNumber: number | null;
  declare surahName: string | null;
  declare surahNameArabic: string | null;
  declare ayahNumber: number | null;
  declare ayahNumberInSurah: number | null;
  declare juzNumber: number | null;
  declare arabicText: string | null;
  declare transliteration: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public static associate(models: any) { }
}

QuranModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Title cannot be empty' },
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    originalContent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contentType: {
      type: DataTypes.ENUM('text', 'pdf'),
      allowNull: false,
      defaultValue: 'text',
    },
    pdfPath: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    pdfOriginalName: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    surahNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 114,
      },
    },
    surahName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    surahNameArabic: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ayahNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ayahNumberInSurah: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    juzNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 30,
      },
    },
    arabicText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    transliteration: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    timestamps: true,
    underscored: true,
    paranoid: true,
    tableName: 'qurans',
    modelName: 'QuranModel',
    indexes: [
      { fields: ['is_active'] },
      { fields: ['surah_number'] },
      { fields: ['ayah_number'] },
      { fields: ['juz_number'] },
      { fields: ['surah_number', 'ayah_number_in_surah'], name: 'qurans_surah_ayah_idx' },
      { fields: ['created_at'] },
    ],
  }
);

export default QuranModel;
