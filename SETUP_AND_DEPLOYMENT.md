# ✅ AI Cold Email Generator - Complete Setup & Deployment Checklist

## 🚀 Quick Start Guide

### 1️⃣ Prerequisites Setup

#### MongoDB Connection
- [ ] Create MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)
- [ ] Create a cluster
- [ ] Get connection string
- [ ] Update `MONGODB_URI` in `.env`

#### Groq API Setup
- [ ] Go to https://console.groq.com/keys
- [ ] Create account (Google/GitHub login)
- [ ] Generate API key
- [ ] Update `GROQ_API_KEY` in `.env`

#### Gmail Configuration (for OTP emails)
- [ ] Enable 2-factor authentication on Gmail
- [ ] Create App Password: https://myaccount.google.com/apppasswords
- [ ] Update `EMAIL_USER` and `EMAIL_PASS` in `.env`

### 2️⃣ Installation

```bash
# Root directory
npm run install:all

# Or manually:
cd server && npm install
cd ../client && npm install
cd ..
```

### 3️⃣ Environment Setup

Create/Update `.env` in `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster0.mongodb.net/aicoldemail?appName=Cluster0
JWT_SECRET=your_very_secure_random_secret_key_change_this
GROQ_API_KEY=gsk_xxxxx
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=xxxx_xxxx_xxxx_xxxx (16-char app password)
FRONTEND_URL=http://localhost:5173
```

Create `.env` in `client/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4️⃣ Running Development Server

```bash
# From root directory
npm run dev

# This starts:
# - Backend on http://localhost:5000
# - Frontend on http://localhost:5173
```

### 5️⃣ Testing the App

#### Test User Registration & Email Verification:
1. Go to http://localhost:5173/signup
2. Register with email
3. Check email for OTP
4. Verify with OTP
5. Login with credentials

#### Test Email Generation:
1. Go to Dashboard (after login)
2. Enter prompt: "Generate cold email for SDE role at Google"
3. Click Generate
4. View generated email

#### View History:
1. All generated emails appear in history
2. Click to expand and view all variants

---

## 📋 Feature Checklist

### Authentication
- [x] User Registration with validation
- [x] Email OTP Verification
- [x] Login with JWT
- [x] Protected Routes
- [x] Logout functionality

### AI Email Generation
- [x] Cold email subject line generation
- [x] Professional email body generation
- [x] LinkedIn DM variant
- [x] Follow-up email generation
- [x] Email history storage

### Security
- [x] Password hashing (bcrypt)
- [x] JWT Token validation
- [x] Input validation & sanitization
- [x] CORS configuration
- [x] Error message handling
- [x] Environment variable validation

### Code Quality
- [x] Error handling in all endpoints
- [x] Proper HTTP status codes
- [x] Consistent error response format
- [x] Input type validation
- [x] Database query validation

---

## 🔍 API Testing with Postman

### 1. Register User
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### 2. Verify OTP
```
POST http://localhost:5000/api/auth/verify-otp
Content-Type: application/json

{
  "userId": "user_id_from_register",
  "otp": "123456"
}
```

### 3. Login
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### 4. Generate Email (Protected)
```
POST http://localhost:5000/api/ai/generate-email
Content-Type: application/json
Authorization: Bearer <token_from_login>

{
  "prompt": "Write a cold email to a startup founder about AI services"
}
```

### 5. Get History (Protected)
```
GET http://localhost:5000/api/ai/history
Authorization: Bearer <token_from_login>
```

---

## 🐛 Troubleshooting

### Issue: "MongoDB Connection Error"
**Solution:**
- Check `MONGODB_URI` is correct
- Check IP whitelist in MongoDB Atlas (allow 0.0.0.0 for development)
- Verify username/password in connection string

### Issue: "Groq API 404 Error"
**Solution:**
- Verify `GROQ_API_KEY` is correct
- Check API key hasn't expired
- Ensure you're using correct model name

### Issue: "Email not sending for OTP"
**Solution:**
- Verify `EMAIL_USER` and `EMAIL_PASS` are correct
- Use 16-character App Password, not regular password
- Check Gmail security settings
- Verify Less Secure Apps is enabled (if not using App Password)

### Issue: "Port 5000 already in use"
**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### Issue: "Frontend can't connect to Backend"
**Solution:**
- Verify `VITE_API_URL` in client/.env
- Check backend is running on port 5000
- Check CORS in server.js includes frontend URL

---

## 📦 Production Deployment

### Before Deploying:
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Enable HTTPS/SSL certificates
- [ ] Enable database backups
- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Set up monitoring (New Relic, DataDog)
- [ ] Rate limiting enabled
- [ ] Helmet security headers added

### Deployment Options:

#### Backend (Express):
- **Heroku:** `git push heroku main`
- **Railway:** Connect GitHub, auto-deploy
- **Render:** Connect GitHub, auto-deploy
- **AWS EC2:** Traditional server setup
- **DigitalOcean:** App Platform or Droplet

#### Frontend (React):
- **Vercel:** Connect GitHub, auto-deploy
- **Netlify:** Connect GitHub, auto-deploy
- **AWS S3 + CloudFront:** Static deployment
- **GitHub Pages:** Free hosting

#### Database:
- **MongoDB Atlas:** Cloud database (recommended)
- **AWS RDS:** Relational database
- **Self-hosted:** Docker container

---

## 📊 Performance Optimization Tips

1. **Add Caching**
   ```bash
   npm install redis
   ```

2. **Add Compression**
   ```bash
   npm install compression
   ```

3. **Database Indexing**
   - Index on `email` for faster user lookups
   - Index on `userId` for faster history queries

4. **API Response Optimization**
   - Implement pagination for email history
   - Add result limiting for large datasets

5. **Frontend Optimization**
   - Lazy load components
   - Implement code splitting
   - Use React.memo for expensive components

---

## 📞 Support & Resources

- **Groq API Docs:** https://console.groq.com/docs
- **MongoDB Docs:** https://docs.mongodb.com
- **Express.js Docs:** https://expressjs.com
- **React Docs:** https://react.dev

---

**✨ Your AI Cold Email Generator is production-ready!**

*Last Updated: February 24, 2026*
