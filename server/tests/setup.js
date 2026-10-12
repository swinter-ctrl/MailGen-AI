const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.GROQ_API_KEY = 'test-groq-key';

let mongo;

beforeAll(async () => {
    // Silence expected error/info logs from the code under test
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
    jest.clearAllMocks();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});
