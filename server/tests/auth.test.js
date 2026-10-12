const request = require('supertest');
const bcrypt = require('bcryptjs');

jest.mock('../utils/emailService');
const sendEmail = require('../utils/emailService');

const app = require('../app');
const User = require('../models/User');
const { createVerifiedUser } = require('./helpers');

const validUser = { name: 'Asha Rao', email: 'Asha@Example.com', password: 'secret123' };

const register = (body = validUser) => request(app).post('/api/auth/register').send(body);

describe('POST /api/auth/register', () => {
    it('creates an unverified user with a hashed password and emails an OTP', async () => {
        const res = await register();

        expect(res.status).toBe(201);
        expect(res.body.userId).toBeDefined();
        expect(res.body.email).toBe('asha@example.com');

        const user = await User.findById(res.body.userId);
        expect(user.isVerified).toBe(false);
        expect(user.password).not.toBe(validUser.password);
        expect(await bcrypt.compare(validUser.password, user.password)).toBe(true);
        expect(user.otp).toMatch(/^\d{6}$/);
        expect(user.otpExpiry.getTime()).toBeGreaterThan(Date.now());

        expect(sendEmail).toHaveBeenCalledTimes(1);
        expect(sendEmail.mock.calls[0][0].email).toBe('asha@example.com');
        expect(sendEmail.mock.calls[0][0].message).toContain(user.otp);
    });

    it('still registers the user when the OTP email fails to send', async () => {
        sendEmail.mockRejectedValueOnce(new Error('SMTP down'));

        const res = await register();

        expect(res.status).toBe(201);
        expect(await User.countDocuments()).toBe(1);
    });

    it.each([
        ['missing fields', { email: 'a@b.com' }, 'Name, email, and password are required'],
        ['an invalid email', { ...validUser, email: 'not-an-email' }, 'Please provide a valid email address'],
        ['a short password', { ...validUser, password: '123' }, 'Password must be at least 6 characters long'],
        ['a short name', { ...validUser, name: 'A' }, 'Name must be at least 2 characters long'],
    ])('rejects %s with 400', async (_, body, message) => {
        const res = await register(body);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(message);
        expect(await User.countDocuments()).toBe(0);
    });

    it('rejects an email that is already registered (case-insensitive)', async () => {
        await register();

        const res = await register({ ...validUser, email: 'ASHA@example.com' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already registered/);
    });
});

describe('POST /api/auth/verify-otp', () => {
    const registerAndGetOtp = async () => {
        const res = await register();
        const user = await User.findById(res.body.userId);
        return { userId: res.body.userId, otp: user.otp };
    };

    const verify = (body) => request(app).post('/api/auth/verify-otp').send(body);

    it('verifies the user, clears the OTP and returns a JWT', async () => {
        const { userId, otp } = await registerAndGetOtp();

        const res = await verify({ userId, otp });

        expect(res.status).toBe(200);
        expect(res.body.token).toEqual(expect.any(String));

        const user = await User.findById(userId);
        expect(user.isVerified).toBe(true);
        expect(user.otp).toBeUndefined();
        expect(user.otpExpiry).toBeUndefined();
    });

    it('rejects a wrong OTP', async () => {
        const { userId, otp } = await registerAndGetOtp();
        const wrongOtp = otp === '123456' ? '654321' : '123456';

        const res = await verify({ userId, otp: wrongOtp });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid OTP. Please try again.');
        expect((await User.findById(userId)).isVerified).toBe(false);
    });

    it('rejects an expired OTP', async () => {
        const { userId, otp } = await registerAndGetOtp();
        await User.updateOne({ _id: userId }, { otpExpiry: new Date(Date.now() - 1000) });

        const res = await verify({ userId, otp });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/expired/);
    });

    it('rejects an OTP that is not 6 digits', async () => {
        const { userId } = await registerAndGetOtp();

        const res = await verify({ userId, otp: '12ab' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('OTP must be a 6-digit number');
    });

    it('rejects missing fields', async () => {
        const res = await verify({});

        expect(res.status).toBe(400);
    });

    it('returns 404 for an unknown user', async () => {
        const res = await verify({ userId: '64b000000000000000000000', otp: '123456' });

        expect(res.status).toBe(404);
    });

    it('rejects verifying an already verified user', async () => {
        const { userId, otp } = await registerAndGetOtp();
        await verify({ userId, otp });

        const res = await verify({ userId, otp });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already verified/);
    });
});

describe('POST /api/auth/login', () => {
    const login = (body) => request(app).post('/api/auth/login').send(body);

    it('logs in a verified user with a case-insensitive email', async () => {
        await createVerifiedUser({ email: 'test@example.com', password: 'secret123' });

        const res = await login({ email: 'TEST@example.com', password: 'secret123' });

        expect(res.status).toBe(200);
        expect(res.body.token).toEqual(expect.any(String));
        expect(res.body).not.toHaveProperty('password');
    });

    it('blocks unverified users and returns their userId', async () => {
        const reg = await register();

        const res = await login({ email: validUser.email, password: validUser.password });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Please verify your email first');
        expect(res.body.userId).toBe(reg.body.userId);
    });

    it('rejects a wrong password', async () => {
        await createVerifiedUser();

        const res = await login({ email: 'test@example.com', password: 'wrong-pass' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid email or password');
    });

    it('rejects an unknown email with the same message', async () => {
        const res = await login({ email: 'nobody@example.com', password: 'secret123' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid email or password');
    });

    it('rejects missing fields', async () => {
        const res = await login({ email: 'test@example.com' });

        expect(res.status).toBe(400);
    });
});
