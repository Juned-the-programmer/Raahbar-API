import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';
import type AyahModel from './AyahModel';

export type TranslationLanguage = 'ar_translit_en' | 'ar_translit_gu' | 'gu' | 'en';

export interface AyahTranslationAttributes {
    id: string;
    ayahId: string;
    language: TranslationLanguage;
    text: string;
    translatorName: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface AyahTranslationCreationAttributes extends Optional<
    AyahTranslationAttributes,
    'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'translatorName'
> { }

class AyahTranslationModel extends Model<AyahTranslationAttributes, AyahTranslationCreationAttributes> {
    declare id: string;
    declare ayahId: string;
    declare language: TranslationLanguage;
    declare text: string;
    declare translatorName: string | null;
    declare isActive: boolean;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    // Associations
    declare readonly ayah?: AyahModel;

    public static associate(models: any) {
        AyahTranslationModel.belongsTo(models.AyahModel, {
            foreignKey: 'ayahId',
            as: 'ayah',
        });
    }
}

AyahTranslationModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        ayahId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'ayahs',
                key: 'id',
            },
        },
        language: {
            type: DataTypes.ENUM('ar_translit_en', 'ar_translit_gu', 'gu', 'en'),
            allowNull: false,
            // Language codes:
            // ar_translit_en = Arabic transliteration in English letters (e.g., "Bismillahir Rahmanir Raheem")
            // ar_translit_gu = Arabic transliteration in Gujarati script (e.g., "બિસ્મિલ્લાહિર રહમાનિર રહીમ")
            // gu = Gujarati translation
            // en = English translation
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        translatorName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'Name of the translator for attribution',
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
        tableName: 'ayah_translations',
        modelName: 'AyahTranslationModel',
        indexes: [
            { fields: ['ayah_id'] },
            { fields: ['language'] },
            { fields: ['ayah_id', 'language'], unique: true, name: 'ayah_translations_unique_lang' },
            { fields: ['is_active'] },
        ],
    }
);

export default AyahTranslationModel;
