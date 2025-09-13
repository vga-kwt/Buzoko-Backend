# Buzoku Backend

NestJS-based backend service for Buzoku. Provides user management, OTP-based authentication, health checks, and SMS integration. Swagger API docs are available.

Last updated: 2025-09-09

## Tech Stack
- Node.js + TypeScript
- NestJS 11 (HTTP + Swagger)
- MongoDB (Mongoose)
- Redis (ioredis)
- JWT authentication
- BullMQ (queued jobs)
- Pino logger

## Prerequisites
- Node.js 18+ and npm
- MongoDB running locally or accessible via URI
- Redis running locally or accessible via URL

## Getting Started
1) Install dependencies
- npm install

2) Create an .env file in the project root
Example .env values (adapt to your environment):

PORT=3000
MONGO_URI=mongodb://localhost:27017
MONGO_DB=buzoku

# JWT
JWT_SECRET=change_me
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis (either REDIS_URL or host/port)
REDIS_URL=redis://127.0.0.1:6379
# REDIS_HOST=127.0.0.1
# REDIS_PORT=6379

# OTP settings
OTP_TTL=300
OTP_RATE_LIMIT=5
OTP_RATE_WINDOW=3600

# SMS Gateway (optional for SMS features)
SMS_BASE_URL=http://smsbox.com/SMSGateway/Services/Messaging.asmx/Http_SendSMS
SMS_STATUS_URL=http://smsbox.com/SMSGateway/Services/Messaging.asmx/Http_GetSmsStatus
SMS_USERNAME=your_username
SMS_PASSWORD=your_password
SMS_CUSTOMERID=your_customer_id
SMS_SENDER=Your Sender

3) Run in development mode
- npm run start:dev

4) Open the app
- Root: http://localhost:3000/
- API base path: http://localhost:3000/api
- Swagger docs: http://localhost:3000/api/docs

## Available Scripts
- npm run start:dev — start in watch mode (ts-node-dev)
- npm run start — start compiled build (dist)
- npm run build — compile TypeScript to dist/
- npm run test — run Jest tests
- npm run lint — run ESLint
- npm run format — run Prettier on src/**/*.ts

## API Overview
Global prefix: /api
Swagger: /api/docs

### Health
- GET /api/health — basic status check
- GET /api/health/send-sms?to=96550485511&message=Hello — test SMS send (requires SMS env vars)

### Auth (OTP-based)
- POST /api/auth/otp/issue — body: { phoneE164: "+15551234567" }
- POST /api/auth/otp/verify — body: { phoneE164: "+15551234567", code: "123456" } → returns accessToken, refreshToken
- POST /api/auth/refresh — body: { refreshToken }
- POST /api/auth/logout — body: { refreshToken }

Environment variables used: JWT_SECRET, JWT_EXPIRY, JWT_REFRESH_EXPIRY, OTP_TTL, OTP_RATE_LIMIT, OTP_RATE_WINDOW, REDIS_URL/REDIS_HOST/REDIS_PORT.

### Users
- POST /api/users — create user (idempotent by phone), issues OTP via AuthService
  - CreateUserDto fields: phoneE164 (E.164 format), email?, roles?, registrationType?, metadata?
- GET /api/users/:id — fetch public user by id
- GET /api/users?phone=+15551234567 — fetch by phone
- GET /api/users/me — current user (requires Bearer JWT, JwtAuthGuard)
- PATCH /api/users/:id — update user (requires Bearer JWT; in future, role-based guards)

### Notes
- The server sets a global prefix /api and exposes Swagger docs at /api/docs with BearerAuth.
- Root GET / responds with "Server is running" for quick verification.
- Mongo connection is configured via MONGO_URI and MONGO_DB.
- Redis connection can be provided via REDIS_URL or host/port.
- SMS gateway integration is optional; endpoints/logics handle absence of envs gracefully but will warn in logs.

## Troubleshooting
- Ensure MongoDB and Redis are reachable.
- Verify JWT_SECRET is set for auth flows.
- If Swagger doesn’t load, confirm the app runs and visit /api/docs.
- For SMS send failures, check SMS_* environment variables and network access to the gateway.


## Accessing from another machine on the same network

If you want to open the API from a different device connected to the same Wi‑Fi/LAN:

1) Start the server
- Development: npm run start:dev
- Production build: npm run build && npm run start
- By default the app listens on 0.0.0.0 (all interfaces). You can override with HOST and PORT env vars.

2) Find your computer’s local IP address
- macOS/Linux: run `ip addr` (Linux) or `ifconfig` (macOS), or check Network settings. Look for something like 192.168.x.x or 10.x.x.x.
- Windows: run `ipconfig` in Command Prompt and look for IPv4 Address.

3) Use that IP from the other device
- Example: http://192.168.1.23:3000/
- API base path: http://192.168.1.23:3000/api
- Swagger docs: http://192.168.1.23:3000/api/docs

Tip: On startup, the server prints your LAN URLs in the console (e.g., "You can access this server from another device on your LAN at:"). You can copy/paste from there.

4) Check firewall/port rules if it doesn’t load
- Ensure your OS firewall allows inbound connections on the chosen port (default 3000).
- If you’re behind VPN or on a segmented corporate network, peer‑to‑peer LAN access may be blocked.

5) Docker note (if applicable)
- If you run the app in Docker, publish the port: `docker run -p 3000:3000 ...`. Then access it via the host machine’s LAN IP.

CORS: In development, CORS is enabled globally in the app, so browsers can call the API from other origins. For production, tighten CORS to your allowed origins in src/main.ts.
