import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

export interface DuaAttributes {
    id: string;
    titleEn: string;
    titleGu: string;
    textAr: string;
    transliterationEn: string;
    transliterationGu: string;
    translationEn: string;
    translationGu: string;
    referenceSource: string | null;
    referenceBookName: string | null;
    referenceHadithNumber: string | null;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface DuaCreationAttributes extends Optional<
    DuaAttributes,
    'id' | 'createdAt' | 'updatedAt' | 'referenceSource' | 'referenceBookName' | 'referenceHadithNumber' | 'createdBy' | 'updatedBy'
> { }

class DuaModel extends Model<DuaAttributes, DuaCreationAttributes> {
    declare id: string;
    declare titleEn: string;
    declare titleGu: string;
    declare textAr: string;
    declare transliterationEn: string;
    declare transliterationGu: string;
    declare translationEn: string;
    declare translationGu: string;
    declare referenceSource: string | null;
    declare referenceBookName: string | null;
    declare referenceHadithNumber: string | null;
    declare createdBy: string | null;
    declare updatedBy: string | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    public static associate(models: any) { }
}

DuaModel.init(
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
        referenceSource: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        referenceBookName: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        referenceHadithNumber: {
            type: DataTypes.STRING(100),
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
        tableName: 'duas',
        modelName: 'DuaModel',
        indexes: [
            { fields: ['created_at'] },
            { fields: ['title_en'] },
            { fields: ['title_gu'] },
        ],
    }
);

export default DuaModel;
