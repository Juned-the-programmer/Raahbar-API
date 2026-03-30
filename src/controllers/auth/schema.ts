import { FastifySchema } from 'fastify';
import { Gender, BloodGroup } from '../../models/content/UserModel';

// OTP-based authentication schemas
export const sendOtpSchema: FastifySchema = {
    body: {
        type: 'object',
        required: ['phone', 'intent'],
        properties: {
            phone: { type: 'string', minLength: 10, maxLength: 15 },
            intent: { type: 'string', enum: ['login', 'signup'] },
        },
    },
};

export const verifyOtpSchema: FastifySchema = {
    body: {
        type: 'object',
        required: ['phone', 'otp'],
        properties: {
            phone: { type: 'string', minLength: 10, maxLength: 15 },
            otp: { type: 'string', minLength: 4, maxLength: 6 },
            // User details (required for new users)
            name: { type: 'string', minLength: 1, maxLength: 255 },
            village: { type: 'string', minLength: 1, maxLength: 255 },
            gender: { type: 'string', enum: ['male', 'female', 'other'] },
            // Optional profile fields
            age: { type: 'integer', minimum: 1, maximum: 150 },
            bloodGroup: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
            currentLocation: { type: 'string', maxLength: 255 },
            occupation: { type: 'string', maxLength: 255 },
        },
    },
};

export const updateProfileSchema: FastifySchema = {
    body: {
        type: 'object',
        properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
            email: { type: 'string', format: 'email' },
            village: { type: 'string', minLength: 1, maxLength: 255 },
            age: { type: 'integer', minimum: 1, maximum: 150, nullable: true },
            gender: { type: 'string', enum: ['male', 'female', 'other'] },
            bloodGroup: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], nullable: true },
            currentLocation: { type: 'string', maxLength: 255, nullable: true },
            occupation: { type: 'string', maxLength: 255, nullable: true },
        },
    },
};

export interface SendOtpInput {
    phone: string;
    intent: 'login' | 'signup';
}

export interface VerifyOtpInput {
    phone: string;
    otp: string;
    name?: string;
    village?: string;
    gender?: Gender;
    age?: number;
    bloodGroup?: BloodGroup;
    currentLocation?: string;
    occupation?: string;
}

export interface UpdateProfileInput {
    name?: string;
    email?: string | null;
    village?: string;
    age?: number | null;
    gender?: Gender;
    bloodGroup?: BloodGroup | null;
    currentLocation?: string | null;
    occupation?: string | null;
}
