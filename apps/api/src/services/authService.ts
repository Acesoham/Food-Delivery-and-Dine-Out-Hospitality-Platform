import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User, UserDocument } from '../models';
import type { RegisterInput, LoginInput } from 'shared-types';

const SALT_ROUNDS = 12;

/**
 * Generate JWT access token
 */
const generateAccessToken = (user: UserDocument): string => {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiry as any }
  );
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (user: UserDocument): string => {
  return jwt.sign(
    { userId: user._id.toString() },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry as any }
  );
};

/**
 * Register a new user
 */
export const registerUser = async (input: RegisterInput) => {
  // Check if email exists
  const existingUser = await User.findOne({ email: input.email.toLowerCase() });
  if (existingUser) {
    throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Create user
  const user = await User.create({
    email: input.email.toLowerCase(),
    passwordHash,
    role: input.role,
    profile: input.profile,
    loyaltyPoints: 0,
    isVerified: false,
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
};

/**
 * Login user
 */
export const loginUser = async (input: LoginInput) => {
  const user = await User.findOne({ email: input.email.toLowerCase() });
  if (!user) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Rotate refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
  }
};

/**
 * Logout user (invalidate refresh token)
 */
export const logoutUser = async (userId: string) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
};
