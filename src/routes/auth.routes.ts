import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as authController from '../controllers/auth/authController';
import { sendOtpSchema, verifyOtpSchema, updateProfileSchema, updateUserSchema } from '../controllers/auth/schema';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware';

async function authRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions) {
    // ===== OTP-based Authentication =====

    // POST /auth/send-otp - Send OTP to phone number
    fastify.post(
        '/send-otp',
        { schema: { ...sendOtpSchema, tags: ['Auth'] } },
        authController.sendOtp
    );

    // POST /auth/verify-otp - Verify OTP and get token (creates user if new)
    fastify.post(
        '/verify-otp',
        { schema: { ...verifyOtpSchema, tags: ['Auth'] } },
        authController.verifyOtp
    );

    // ===== Protected Routes =====

    // GET /auth/me - Get current user (requires auth)
    fastify.get('/me', { preHandler: verifyToken, schema: { tags: ['Auth'] } }, authController.getMe);

    // PUT /auth/profile - Update current user's profile (requires auth)
    fastify.put(
        '/profile',
        { preHandler: verifyToken, schema: { ...updateProfileSchema, tags: ['Auth'] } },
        authController.updateProfile
    );

    // GET /auth/users - List all users (admin only)
    fastify.get('/users', { preHandler: requireAdmin, schema: { tags: ['Auth'] } }, authController.listUsers);

    // GET /auth/users/:id - Get specific user (admin only)
    fastify.get('/users/:id', { preHandler: requireAdmin, schema: { tags: ['Auth'] } }, authController.getUserById);

    // PUT /auth/users/:id - Update specific user (admin only)
    fastify.put(
        '/users/:id',
        { preHandler: requireAdmin, schema: { ...updateUserSchema, tags: ['Auth'] } },
        authController.updateUser
    );

    // DELETE /auth/users/:id - Delete any user (admin only)
    fastify.delete('/users/:id', { preHandler: requireAdmin, schema: { tags: ['Auth'] } }, authController.deleteUser);
}

export default authRoutes;
