import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

export type PayamStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface PayamAttributes {
    id: string;
    payamNo: number;
    title: string;
    date: Date | null;
    islamicDate: string | null;
    textContent: string;
    reference: string | null;
    status: PayamStatus;
    publishAt: Date | null;
    publishedAt: Date | null;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface PayamCreationAttributes extends Optional<
    PayamAttributes,
    'id' | 'createdAt' | 'updatedAt' | 'date' | 'islamicDate' | 'reference' | 'status' | 'publishAt' | 'publishedAt' | 'createdBy' | 'updatedBy'
> { }

class PayamModel extends Model<PayamAttributes, PayamCreationAttributes> {
    declare id: string;
    declare payamNo: number;
    declare title: string;
    declare date: Date | null;
    declare islamicDate: string | null;
    declare textContent: string;
    declare reference: string | null;
    declare status: PayamStatus;
    declare publishAt: Date | null;
    declare publishedAt: Date | null;
    declare createdBy: string | null;
    declare updatedBy: string | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    public static associate(models: any) { }
}

PayamModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        payamNo: {
            type: DataTypes.BIGINT,
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
        date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        islamicDate: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        textContent: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Text content cannot be empty' },
            },
        },
        reference: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('draft', 'scheduled', 'published', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
        },
        publishAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        publishedAt: {
            type: DataTypes.DATE,
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
        tableName: 'payams',
        modelName: 'PayamModel',
        indexes: [
            { fields: ['payam_no'], unique: true },
            { fields: ['date'] },
            { fields: ['created_at'] },
            { fields: ['status'] },
            { fields: ['publish_at'] },
        ],
    }
);

export default PayamModel;
