import { Model, DataTypes, Optional } from 'sequelize';
import { AyahTranslationModel, sequelize } from '../index';
import type SurahModel from './SurahModel';
import type ParahModel from './ParahModel';

export interface AyahAttributes {
    id: string;
    surahId: string;
    parahId: string;
    ayahNumber: number;
    ayahNumberInSurah: number;
    arabicText: string;
    arabicTextSimple: string | null;
    pageNumber: number | null;
    hizbQuarter: number | null;
    sajdaType: 'none' | 'recommended' | 'obligatory';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface AyahCreationAttributes extends Optional<
    AyahAttributes,
    'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'arabicTextSimple' | 'pageNumber' | 'hizbQuarter' | 'sajdaType'
> { }

class AyahModel extends Model<AyahAttributes, AyahCreationAttributes> {
    declare id: string;
    declare surahId: string;
    declare parahId: string;
    declare ayahNumber: number;
    declare ayahNumberInSurah: number;
    declare arabicText: string;
    declare arabicTextSimple: string | null;
    declare pageNumber: number | null;
    declare hizbQuarter: number | null;
    declare sajdaType: 'none' | 'recommended' | 'obligatory';
    declare isActive: boolean;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    // Associations
    declare readonly surah?: SurahModel;
    declare readonly parah?: ParahModel;
    declare readonly translations?: AyahTranslationModel[];

    public static associate(models: any) {
        AyahModel.belongsTo(models.SurahModel, {
            foreignKey: 'surahId',
            as: 'surah',
        });
        AyahModel.belongsTo(models.ParahModel, {
            foreignKey: 'parahId',
            as: 'parah',
        });
        AyahModel.hasMany(models.AyahTranslationModel, {
            foreignKey: 'ayahId',
            as: 'translations',
        });
    }
}

AyahModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        surahId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'surahs',
                key: 'id',
            },
        },
        parahId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'parahs',
                key: 'id',
            },
        },
        ayahNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            validate: {
                min: 1,
                max: 6236,
            },
        },
        ayahNumberInSurah: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
            },
        },
        arabicText: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        arabicTextSimple: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Arabic text without diacritics for easier searching',
        },
        pageNumber: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1,
                max: 604,
            },
        },
        hizbQuarter: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1,
                max: 240,
            },
        },
        sajdaType: {
            type: DataTypes.ENUM('none', 'recommended', 'obligatory'),
            allowNull: false,
            defaultValue: 'none',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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
        tableName: 'ayahs',
        modelName: 'AyahModel',
        indexes: [
            { fields: ['ayah_number'], unique: true },
            { fields: ['surah_id'] },
            { fields: ['parah_id'] },
            { fields: ['is_active'] },
            { fields: ['surah_id', 'ayah_number_in_surah'], name: 'ayahs_surah_verse_idx' },
            { fields: ['page_number'] },
        ],
    }
);

export default AyahModel;
