const request = require('supertest');
const app = require('../app');

describe('App', () => {
    it('GET /api/health reports the database as connected', async () => {
        const res = await request(app).get('/api/health');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ok', db: 'connected' });
    });

    it('returns 404 JSON for unknown API routes', async () => {
        const res = await request(app).get('/api/does-not-exist');

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('API route not found');
    });
});
