import { FastifyRequest, FastifyReply } from 'fastify';
import { User, Otp, UserCreationAttributes, OtpCreationAttributes } from '../../models';
import { generateToken, AuthenticatedRequest } from '../../middlewares/authMiddleware';
import { BadRequest, Unauthorized, Conflict, NotFound } from '../../libs/error';
import { SendOtpInput, VerifyOtpInput, UpdateProfileInput, UpdateUserInput } from './schema';

// Static OTP for development (replace with SMS service in production)
const STATIC_OTP = '1234';
const OTP_EXPIRY_MINUTES = 5;

/**
 * Send OTP to phone number
 * For login: phone must exist
 * For signup: phone must NOT exist
 */
export async function sendOtp(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as SendOtpInput;
    const { phone, intent } = body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { phone } });

    // Validate based on intent
    if (intent === 'login') {
        if (!existingUser) {
            throw new BadRequest('No account found with this phone number. Please sign up first.');
        }
    } else if (intent === 'signup') {
        if (existingUser) {
            throw new Conflict('An account with this phone number already exists. Please login instead.');
        }
    }

    // Delete any existing unused OTPs for this phone
    await Otp.destroy({
        where: { phone, isUsed: false },
    });

    // Create new OTP record
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const otpData: OtpCreationAttributes = {
        phone,
        otp: STATIC_OTP,
        expiresAt,
    };

    await Otp.create(otpData);

    request.log.info({ phone, intent }, 'OTP sent');

    // In production, send SMS here
    return reply.send({
        success: true,
        message: 'OTP sent successfully',
        // Only include OTP in development for testing
        ...(process.env.NODE_ENV === 'development' && { otp: STATIC_OTP }),
    });
}

/**
 * Verify OTP and login/register user
 * Returns JWT token on success
 */
export async function verifyOtp(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as VerifyOtpInput;
    const { phone, otp, name, village, gender, age, bloodGroup, currentLocation, occupation } = body;

    // Find valid OTP
    const otpRecord = await Otp.findOne({
        where: { phone, otp, isUsed: false },
        order: [['createdAt', 'DESC']],
    });

    if (!otpRecord) {
        throw new Unauthorized('Invalid OTP');
    }

    // Check if OTP is valid (not expired)
    if (!otpRecord.isValid()) {
        throw new Unauthorized('OTP has expired');
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Find or create user
    let user = await User.findOne({ where: { phone } });
    let isNewUser = false;

    // Check if user exists and is active (for existing users)
    if (user && !user.isActive) {
        throw new Unauthorized('Your account has been deactivated. Please contact support.');
    }

    if (!user) {
        isNewUser = true;

        // For new users, village and gender are required
        if (!village) {
            throw new BadRequest('Village is required for new users');
        }
        if (!gender) {
            throw new BadRequest('Gender is required for new users');
        }

        const userData: UserCreationAttributes = {
            name: name || phone,
            phone,
            village,
            gender,
            age: age || null,
            bloodGroup: bloodGroup || null,
            currentLocation: currentLocation || null,
            occupation: occupation || null,
        };

        user = await User.create(userData);
        request.log.info({ userId: user.id, phone }, 'New user created via OTP');
    }

    const token = generateToken({
        userId: user.id,
        phone: user.phone,
        role: user.role,
    });

    request.log.info({ userId: user.id, phone }, 'User logged in via OTP');

    return reply.send({
        success: true,
        data: {
            user: user.toJSON(),
            token,
            isNewUser,
        },
    });
}

/**
 * Get current user info
 */
export async function getMe(request: FastifyRequest, reply: FastifyReply) {
    const authReq = request as AuthenticatedRequest;

    // Fetch full user data from database
    const user = await User.findByPk(authReq.user?.id);

    if (!user) {
        throw new Unauthorized('User not found');
    }

    return reply.send({
        success: true,
        data: user.toJSON(),
    });
}

/**
 * Get all users (admin only)
 */
export async function listUsers(request: FastifyRequest, reply: FastifyReply) {
    const users = await User.findAll({
        attributes: [
            'id', 'name', 'email', 'phone', 'role', 'isActive',
            'village', 'age', 'gender', 'bloodGroup', 'currentLocation', 'occupation',
            'createdAt'
        ],
        order: [['createdAt', 'DESC']],
    });

    return reply.send({
        success: true,
        data: users,
    });
}

/**
 * Update current user's profile
 */
export async function updateProfile(request: FastifyRequest, reply: FastifyReply) {
    const authReq = request as AuthenticatedRequest;
    const body = request.body as UpdateProfileInput;
    const { name, email, village, age, gender, bloodGroup, currentLocation, occupation } = body;

    if (!authReq.user) {
        throw new Unauthorized('Authentication required');
    }

    const user = await User.findByPk(authReq.user.id);
    if (!user) {
        throw new Unauthorized('User not found');
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;

    if (email !== undefined) {
        // Check if email is already taken
        if (email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser && existingUser.id !== user.id) {
                throw new Conflict('Email already in use');
            }
        }
        user.email = email;
    }

    if (village !== undefined) user.village = village;
    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
    if (currentLocation !== undefined) user.currentLocation = currentLocation;
    if (occupation !== undefined) user.occupation = occupation;

    await user.save();

    request.log.info({ userId: user.id }, 'User profile updated');

    return reply.send({
        success: true,
        data: user.toJSON(),
    });
}

/**
 * Get any user by ID (admin only)
 */
export async function getUserById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const user = await User.findByPk(id);

    if (!user) {
        throw new NotFound('User not found');
    }

    return reply.send({
        success: true,
        data: user.toJSON(),
    });
}

/**
 * Update any user by ID (admin only)
 */
export async function updateUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateUserInput;
    const { name, email, phone, village, age, gender, bloodGroup, currentLocation, occupation, role, isActive } = body;

    const user = await User.findByPk(id);
    if (!user) {
        throw new NotFound('User not found');
    }

    // Update profile fields
    if (name !== undefined) user.name = name;
    if (village !== undefined) user.village = village;
    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
    if (currentLocation !== undefined) user.currentLocation = currentLocation;
    if (occupation !== undefined) user.occupation = occupation;

    // Admin specific fields
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    if (phone !== undefined) {
        // Check if phone is already taken
        const existingPhoneUser = await User.findOne({ where: { phone } });
        if (existingPhoneUser && existingPhoneUser.id !== user.id) {
            throw new Conflict('Phone number already in use');
        }
        user.phone = phone;
    }

    if (email !== undefined) {
        // Check if email is already taken
        if (email) {
            const existingEmailUser = await User.findOne({ where: { email } });
            if (existingEmailUser && existingEmailUser.id !== user.id) {
                throw new Conflict('Email already in use');
            }
        }
        user.email = email;
    }

    await user.save();

    request.log.info({ userId: user.id }, 'User updated by admin');

    return reply.send({
        success: true,
        data: user.toJSON(),
    });
}

/**
 * Delete any user by ID (admin only - soft delete)
 */
export async function deleteUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const user = await User.findByPk(id);
    if (!user) {
        throw new NotFound('User not found');
    }

    await user.destroy();

    request.log.info({ userId: id }, 'User deleted by admin');

    return reply.send({
        success: true,
        message: 'User deleted successfully',
    });
}
