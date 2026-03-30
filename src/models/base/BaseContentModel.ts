import { Model, DataTypes, Optional, ModelAttributes, Sequelize } from 'sequelize';

// Ensure _previousDataValues is typed
declare module 'sequelize' {
  interface Model<TModelAttributes extends {} = any, TCreationAttributes extends {} = TModelAttributes> {
    _previousDataValues?: Partial<TModelAttributes>;
  }
}

// Common attributes for all content models
export interface BaseContentAttributes {
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
  createdAt: Date;
  updatedAt: Date;
}

// For creation, id and timestamps are optional
export interface BaseContentCreationAttributes
  extends Optional<
    BaseContentAttributes,
    'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'originalContent' | 'metadata' | 'createdBy'
  > {}

// Base model class with common functionality
export abstract class BaseContentModel<
  TAttributes extends BaseContentAttributes = BaseContentAttributes,
  TCreationAttributes extends BaseContentCreationAttributes = BaseContentCreationAttributes,
> extends Model<TAttributes, TCreationAttributes> {
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
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Common column definitions
export const baseContentColumns: ModelAttributes<BaseContentModel> = {
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
    field: 'original_content',
  },
  contentType: {
    type: DataTypes.ENUM('text', 'pdf'),
    allowNull: false,
    defaultValue: 'text',
    field: 'content_type',
  },
  pdfPath: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    field: 'pdf_path',
  },
  pdfOriginalName: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'pdf_original_name',
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
    field: 'is_active',
  },
  createdBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'created_by',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at',
  },
};

// Common model options
export const getBaseModelOptions = (sequelize: Sequelize) => ({
  sequelize,
  timestamps: true,
  underscored: true,
  paranoid: false,
});

export default BaseContentModel;
