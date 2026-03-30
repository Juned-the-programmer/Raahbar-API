import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { Unauthorized, Forbidden } from '../libs/error';

const JWT_SECRET = process.env.JWT_SECRET || 'rahbar@17249876763hjjshsuk';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
    userId: string;
    phone: string;
    role: 'admin' | 'user';
}

export interface AuthenticatedRequest extends FastifyRequest {
    user?: {
        id: string;
        phone: string;
        name: string;
        role: 'admin' | 'user';
        isActive: boolean;
    };
}

// Generate JWT token
export function generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

// Verify JWT token middleware
export async function verifyToken(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Unauthorized('No token provided');
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // Fetch user from database to ensure they still exist
        const user = await User.findByPk(decoded.userId);

        if (!user) {
            throw new Unauthorized('User not found');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new Unauthorized('Account is deactivated');
        }

        // Attach user to request
        request.user = {
            id: user.id,
            phone: user.phone,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
        };
    } catch (error: any) {
        if (error.name === 'JsonWebTokenError') {
            throw new Unauthorized('Invalid token');
        }
        if (error.name === 'TokenExpiredError') {
            throw new Unauthorized('Token expired');
        }
        throw error;
    }
}

// Require admin role middleware
export async function requireAdmin(request: AuthenticatedRequest, reply: FastifyReply) {
    // First verify the token
    await verifyToken(request, reply);

    // Check if user has admin role
    if (request.user?.role !== 'admin') {
        throw new Forbidden('Admin access required');
    }
}
