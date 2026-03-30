import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

export interface RaahbarBookAttributes {
    id: string;
    bookNumber: number;
    title: string;
    titleGujarati?: string;
    titleArabic?: string;
    description?: string;
    descriptionGujarati?: string;
    author?: string;
    pdfUrl: string;
    thumbnailUrl?: string;
    totalPages?: number;
    fileSize?: number; // in bytes
    publishedDate?: Date;
    hijriYear?: number;        // 1447
    hijriMonth?: number;       // 1 - 12
    hijriMonthName?: string;   // Muharram, Safar, Rajab, etc.
    isActive: boolean;
    downloadCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface RaahbarBookCreationAttributes extends Optional<RaahbarBookAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'downloadCount' | 'titleGujarati' | 'titleArabic' | 'description' | 'descriptionGujarati' | 'author' | 'thumbnailUrl' | 'totalPages' | 'fileSize' | 'publishedDate' | 'hijriYear' | 'hijriMonth' | 'hijriMonthName'> { }

class RaahbarBookModel extends Model<RaahbarBookAttributes, RaahbarBookCreationAttributes> {
    declare id: string;
    declare bookNumber: number;
    declare title: string;
    declare titleGujarati: string | null;
    declare titleArabic: string | null;
    declare description: string | null;
    declare descriptionGujarati: string | null;
    declare author: string | null;
    declare pdfUrl: string;
    declare thumbnailUrl: string | null;
    declare totalPages: number | null;
    declare fileSize: number | null;
    declare publishedDate: Date | null;
    declare hijriYear: number | null;
    declare hijriMonth: number | null;
    declare hijriMonthName: string | null;
    declare isActive: boolean;
    declare downloadCount: number;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    public static associate(models: any) { }
}

RaahbarBookModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        bookNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            validate: {
                min: 1,
            },
        },
        title: {
            type: DataTypes.STRING(500),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Title cannot be empty' },
            },
        },
        titleGujarati: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        titleArabic: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        descriptionGujarati: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        author: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        pdfUrl: {
            type: DataTypes.STRING(1000),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'PDF URL cannot be empty' },
            },
        },
        thumbnailUrl: {
            type: DataTypes.STRING(1000),
            allowNull: true,
        },
        totalPages: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        fileSize: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        publishedDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        hijriYear: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        hijriMonth: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1,
                max: 12,
            },
        },
        hijriMonthName: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        downloadCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
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
        tableName: 'raahbar_books',
        modelName: 'RaahbarBookModel',
        indexes: [
            { fields: ['book_number'], unique: true },
            { fields: ['is_active'] },
            { fields: ['title'] },
            { fields: ['hijri_year'] },
            { fields: ['hijri_year', 'hijri_month'] },
        ],
    }
);

export default RaahbarBookModel;
