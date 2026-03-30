import { Model, DataTypes, Optional } from 'sequelize';
import { AyahModel, sequelize } from '../index';

export interface SurahAttributes {
    id: string;
    surahNumber: number;
    nameArabic: string;
    nameGujarati: string;
    nameEnglish: string;
    meaningGujarati: string | null;
    meaningEnglish: string | null;
    revelationType: 'meccan' | 'medinan';
    totalAyahs: number;
    orderInMushaf: number;
    rukuCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface SurahCreationAttributes extends Optional<
    SurahAttributes,
    'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'meaningGujarati' | 'meaningEnglish'
> { }

class SurahModel extends Model<SurahAttributes, SurahCreationAttributes> {
    declare id: string;
    declare surahNumber: number;
    declare nameArabic: string;
    declare nameGujarati: string;
    declare nameEnglish: string;
    declare meaningGujarati: string | null;
    declare meaningEnglish: string | null;
    declare revelationType: 'meccan' | 'medinan';
    declare totalAyahs: number;
    declare orderInMushaf: number;
    declare rukuCount: number;
    declare isActive: boolean;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    // Associations
    declare readonly ayahs?: AyahModel[];

    public static associate(models: any) {
        SurahModel.hasMany(models.AyahModel, {
            foreignKey: 'surahId',
            as: 'ayahs',
        });
    }
}

SurahModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        surahNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            validate: {
                min: 1,
                max: 114,
            },
        },
        nameArabic: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        nameGujarati: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        nameEnglish: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        meaningGujarati: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        meaningEnglish: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        revelationType: {
            type: DataTypes.ENUM('meccan', 'medinan'),
            allowNull: false,
        },
        totalAyahs: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        orderInMushaf: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        rukuCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
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
        tableName: 'surahs',
        modelName: 'SurahModel',
        indexes: [
            { fields: ['surah_number'], unique: true },
            { fields: ['is_active'] },
            { fields: ['revelation_type'] },
        ],
    }
);

export default SurahModel;
