const jwt = require('jsonwebtoken');
const User = require('../models/User');

const createVerifiedUser = async (overrides = {}) => {
    const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'secret123',
        isVerified: true,
        ...overrides,
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { user, token };
};

module.exports = { createVerifiedUser };
