import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

export interface PdfIndexAttributes {
    id: string;
    bookType: string;          // 'quran' | 'hajj' | 'panjsurah' (enforced by Admin UI)
    indexType: string;         // 'surah' | 'parah' | 'chapter' | 'topic' (enforced by Admin UI)
    referenceNumber: number | null;  // Surah #, Parah #, chapter # etc. (numeric reference)
    referenceKey: string | null;     // Slug for non-numeric refs (e.g. 'duas-before-ihram')
    nameArabic: string | null;
    nameGujarati: string | null;
    nameEnglish: string | null;
    pageNumber: number;        // The PDF page to jump to
    sortOrder: number;         // For ordering entries in the list
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface PdfIndexCreationAttributes extends Optional<
    PdfIndexAttributes,
    | 'id'
    | 'referenceNumber'
    | 'referenceKey'
    | 'nameArabic'
    | 'nameGujarati'
    | 'nameEnglish'
    | 'sortOrder'
    | 'isActive'
    | 'createdAt'
    | 'updatedAt'
> {}

class PdfIndexModel extends Model<PdfIndexAttributes, PdfIndexCreationAttributes> {
    declare id: string;
    declare bookType: string;
    declare indexType: string;
    declare referenceNumber: number | null;
    declare referenceKey: string | null;
    declare nameArabic: string | null;
    declare nameGujarati: string | null;
    declare nameEnglish: string | null;
    declare pageNumber: number;
    declare sortOrder: number;
    declare isActive: boolean;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

PdfIndexModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        bookType: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'quran | hajj | panjsurah — more values can be added via Admin UI',
        },
        indexType: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'surah | parah | chapter | topic',
        },
        referenceNumber: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Numeric identifier for the section (surah number, parah number, etc.)',
        },
        referenceKey: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'Slug/key for non-numeric sections',
        },
        nameArabic: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        nameGujarati: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        nameEnglish: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        pageNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1 },
        },
        sortOrder: {
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
        tableName: 'pdf_indexes',
        modelName: 'PdfIndexModel',
        indexes: [
            { fields: ['book_type'] },
            { fields: ['index_type'] },
            { fields: ['book_type', 'index_type'] },
            { fields: ['book_type', 'index_type', 'reference_number'], unique: true, where: { reference_number: { [Symbol.for('ne')]: null } } },
            { fields: ['is_active'] },
            { fields: ['sort_order'] },
        ],
    }
);

export default PdfIndexModel;
