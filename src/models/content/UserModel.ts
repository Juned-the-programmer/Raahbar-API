import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

// Gender enum
export type Gender = 'male' | 'female' | 'other';

// Blood group enum
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

// Role enum
export type UserRole = 'admin' | 'user';

export interface UserAttributes {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    role: UserRole;
    isActive: boolean;
    // Profile fields (flat columns)
    village: string;
    age: number | null;
    gender: Gender;
    bloodGroup: BloodGroup | null;
    currentLocation: string | null;
    occupation: string | null;
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes,
    'id' | 'createdAt' | 'updatedAt' | 'role' | 'isActive' | 'email' | 'age' | 'bloodGroup' | 'currentLocation' | 'occupation'
> { }

class UserModel extends Model<UserAttributes, UserCreationAttributes> {
    declare id: string;
    declare name: string;
    declare email: string | null;
    declare phone: string;
    declare role: UserRole;
    declare isActive: boolean;
    // Profile fields
    declare village: string;
    declare age: number | null;
    declare gender: Gender;
    declare bloodGroup: BloodGroup | null;
    declare currentLocation: string | null;
    declare occupation: string | null;
    // Timestamps
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    public static associate(models: any) { }
}

UserModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Name cannot be empty' },
            },
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
            validate: {
                isEmail: { msg: 'Invalid email format' },
            },
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: { msg: 'Phone cannot be empty' },
            },
        },
        role: {
            type: DataTypes.ENUM('admin', 'user'),
            allowNull: false,
            defaultValue: 'user',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        // Profile fields
        village: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Village cannot be empty' },
            },
        },
        age: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: { args: [1], msg: 'Age must be at least 1' },
                max: { args: [150], msg: 'Age must be less than 150' },
            },
        },
        gender: {
            type: DataTypes.ENUM('male', 'female', 'other'),
            allowNull: false,
        },
        bloodGroup: {
            type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
            allowNull: true,
        },
        currentLocation: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        occupation: {
            type: DataTypes.STRING(255),
            allowNull: true,
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
        tableName: 'users',
        modelName: 'UserModel',
        indexes: [
            { fields: ['phone'], unique: true },
            { fields: ['village'] }, // For filtering by village
        ],
    }
);

export default UserModel;
