import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

export interface PillarOfIslamAttributes {
    id: string;
    titleEn: string;
    titleGu: string;
    textAr: string;
    transliterationEn: string;
    transliterationGu: string;
    translationEn: string;
    translationGu: string;
    descriptionEn: string;
    descriptionGu: string;
    referenceSource: string | null;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface PillarOfIslamCreationAttributes extends Optional<
    PillarOfIslamAttributes,
    'id' | 'createdAt' | 'updatedAt' | 'referenceSource' | 'createdBy' | 'updatedBy'
> { }

class PillarOfIslamModel extends Model<PillarOfIslamAttributes, PillarOfIslamCreationAttributes> {
    declare id: string;
    declare titleEn: string;
    declare titleGu: string;
    declare textAr: string;
    declare transliterationEn: string;
    declare transliterationGu: string;
    declare translationEn: string;
    declare translationGu: string;
    declare descriptionEn: string;
    declare descriptionGu: string;
    declare referenceSource: string | null;
    declare createdBy: string | null;
    declare updatedBy: string | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    public static associate(models: any) { }
}

PillarOfIslamModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        titleEn: {
            type: DataTypes.STRING(500),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'English title cannot be empty' },
            },
        },
        titleGu: {
            type: DataTypes.STRING(500),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Gujarati title cannot be empty' },
            },
        },
        textAr: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Arabic text cannot be empty' },
            },
        },
        transliterationEn: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'English transliteration cannot be empty' },
            },
        },
        transliterationGu: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Gujarati transliteration cannot be empty' },
            },
        },
        translationEn: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'English translation cannot be empty' },
            },
        },
        translationGu: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Gujarati translation cannot be empty' },
            },
        },
        descriptionEn: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'English description cannot be empty' },
            },
        },
        descriptionGu: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Gujarati description cannot be empty' },
            },
        },
        referenceSource: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        updatedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
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
        tableName: 'pillars_of_islam',
        modelName: 'PillarOfIslamModel',
        indexes: [
            { fields: ['created_at'] },
            { fields: ['title_en'] },
            { fields: ['title_gu'] },
        ],
    }
);

export default PillarOfIslamModel;
