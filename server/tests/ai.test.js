const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('axios');
const axios = require('axios');

const app = require('../app');
const User = require('../models/User');
const EmailHistory = require('../models/EmailHistory');
const { createVerifiedUser } = require('./helpers');

const aiOutput = {
    subject: 'Backend Intern Application',
    emailBody: 'Hi, I would love to join your backend team.',
    linkedInDM: 'Hi! Interested in the backend intern role.',
    followUpEmail: 'Following up on my previous email.',
};

const groqReply = (content) => ({ data: { choices: [{ message: { content } }] } });

describe('JWT protect middleware', () => {
    it('rejects requests without a token', async () => {
        const res = await request(app).get('/api/ai/history');

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Not authorized, no token provided');
    });

    it('rejects a malformed token', async () => {
        const res = await request(app).get('/api/ai/history').set('Authorization', 'Bearer not-a-jwt');

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Not authorized, token failed');
    });

    it('rejects a token signed with a different secret', async () => {
        const { user } = await createVerifiedUser();
        const forged = jwt.sign({ id: user._id }, 'attacker-secret');

        const res = await request(app).get('/api/ai/history').set('Authorization', `Bearer ${forged}`);

        expect(res.status).toBe(401);
    });

    it('rejects a valid token for a user that no longer exists', async () => {
        const { user, token } = await createVerifiedUser();
        await User.deleteOne({ _id: user._id });

        const res = await request(app).get('/api/ai/history').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});

describe('POST /api/ai/generate-email', () => {
    let token;
    let user;

    beforeEach(async () => {
        ({ user, token } = await createVerifiedUser());
    });

    const generate = (body) =>
        request(app).post('/api/ai/generate-email').set('Authorization', `Bearer ${token}`).send(body);

    it('generates an outreach kit and saves it to history', async () => {
        axios.post.mockResolvedValueOnce(groqReply(JSON.stringify(aiOutput)));

        const res = await generate({ prompt: 'Backend intern at Razorpay' });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ ...aiOutput, prompt: 'Backend intern at Razorpay' });

        const saved = await EmailHistory.find({ userId: user._id });
        expect(saved).toHaveLength(1);
        expect(saved[0].subject).toBe(aiOutput.subject);
    });

    it('calls the Groq API with the configured key and JSON mode', async () => {
        axios.post.mockResolvedValueOnce(groqReply(JSON.stringify(aiOutput)));

        await generate({ prompt: 'Backend intern at Razorpay' });

        const [url, body, config] = axios.post.mock.calls[0];
        expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
        expect(body.response_format).toEqual({ type: 'json_object' });
        expect(body.messages[0].content).toContain('Backend intern at Razorpay');
        expect(config.headers.Authorization).toBe('Bearer test-groq-key');
    });

    it('extracts JSON even when the model wraps it in extra text', async () => {
        axios.post.mockResolvedValueOnce(groqReply(`Here you go:\n${JSON.stringify(aiOutput)}\nGood luck!`));

        const res = await generate({ prompt: 'Frontend role' });

        expect(res.status).toBe(200);
        expect(res.body.subject).toBe(aiOutput.subject);
    });

    it('returns 500 and saves nothing when the model returns invalid JSON', async () => {
        axios.post.mockResolvedValueOnce(groqReply('definitely not json'));

        const res = await generate({ prompt: 'Frontend role' });

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Failed to parse AI response');
        expect(await EmailHistory.countDocuments()).toBe(0);
    });

    it('passes through a 429 when the Groq rate limit is hit', async () => {
        axios.post.mockRejectedValueOnce({ response: { status: 429, data: {} } });

        const res = await generate({ prompt: 'Frontend role' });

        expect(res.status).toBe(429);
        expect(res.body.error).toBe('Rate limit exceeded');
    });

    it.each([
        ['a missing prompt', {}, 'Prompt is required'],
        ['a non-string prompt', { prompt: 42 }, 'Prompt must be a string'],
        ['a blank prompt', { prompt: '   ' }, 'Prompt cannot be empty'],
        ['a prompt over 2000 characters', { prompt: 'a'.repeat(2001) }, 'Prompt cannot exceed 2000 characters'],
    ])('rejects %s with 400 without calling the AI', async (_, body, message) => {
        const res = await generate(body);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(message);
        expect(axios.post).not.toHaveBeenCalled();
    });
});

describe('GET /api/ai/history', () => {
    it("returns only the current user's history, newest first", async () => {
        const { user, token } = await createVerifiedUser();
        const { user: other } = await createVerifiedUser({ email: 'other@example.com' });

        const entry = (userId, subject, createdAt) => ({
            userId, prompt: 'p', subject, emailBody: 'b', linkedInDM: 'd', followUpEmail: 'f', createdAt,
        });
        await EmailHistory.create([
            entry(user._id, 'older', new Date('2026-01-01')),
            entry(user._id, 'newer', new Date('2026-02-01')),
            entry(other._id, 'someone else', new Date('2026-03-01')),
        ]);

        const res = await request(app).get('/api/ai/history').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.map((h) => h.subject)).toEqual(['newer', 'older']);
    });
});
