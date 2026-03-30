import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

export interface OtpAttributes {
    id: string;
    phone: string;
    otp: string;
    expiresAt: Date;
    isUsed: boolean;
    createdAt: Date;
}

export interface OtpCreationAttributes extends Optional<OtpAttributes, 'id' | 'createdAt' | 'isUsed'> { }

class OtpModel extends Model<OtpAttributes, OtpCreationAttributes> {
    declare id: string;
    declare phone: string;
    declare otp: string;
    declare expiresAt: Date;
    declare isUsed: boolean;
    declare readonly createdAt: Date;

    // Check if OTP is valid (not expired and not used)
    isValid(): boolean {
        return !this.isUsed && new Date() < this.expiresAt;
    }

    public static associate(models: any) { }
}

OtpModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Phone cannot be empty' },
            },
        },
        otp: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        isUsed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        sequelize,
        timestamps: true,
        updatedAt: false, // OTP records don't need updatedAt
        underscored: true,
        paranoid: false, // No soft delete - just delete expired OTPs
        tableName: 'otps',
        modelName: 'OtpModel',
        indexes: [
            { fields: ['phone'] },
            { fields: ['expires_at'] }, // For cleanup queries
        ],
    }
);

export default OtpModel;
