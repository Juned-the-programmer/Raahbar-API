import { Model, DataTypes, Optional } from 'sequelize';
import { AyahModel, sequelize } from '../index';

export interface ParahAttributes {
    id: string;
    parahNumber: number;
    nameArabic: string;
    nameGujarati: string;
    nameEnglish: string;
    startSurahNumber: number;
    startAyahNumber: number;
    endSurahNumber: number;
    endAyahNumber: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ParahCreationAttributes extends Optional<
    ParahAttributes,
    'id' | 'createdAt' | 'updatedAt' | 'isActive'
> { }

class ParahModel extends Model<ParahAttributes, ParahCreationAttributes> {
    declare id: string;
    declare parahNumber: number;
    declare nameArabic: string;
    declare nameGujarati: string;
    declare nameEnglish: string;
    declare startSurahNumber: number;
    declare startAyahNumber: number;
    declare endSurahNumber: number;
    declare endAyahNumber: number;
    declare isActive: boolean;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    // Associations
    declare readonly ayahs?: AyahModel[];

    public static associate(models: any) {
        ParahModel.hasMany(models.AyahModel, {
            foreignKey: 'parahId',
            as: 'ayahs',
        });
    }
}

ParahModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        parahNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            validate: {
                min: 1,
                max: 30,
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
        startSurahNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        startAyahNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        endSurahNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        endAyahNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
        tableName: 'parahs',
        modelName: 'ParahModel',
        indexes: [
            { fields: ['parah_number'], unique: true },
            { fields: ['is_active'] },
        ],
    }
);

export default ParahModel;
