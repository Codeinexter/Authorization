# Authorization Project Overview

## Executive Summary
This is a full-stack authentication application built with Node.js, Express, MongoDB, and React (Vite). The project implements user registration, email verification, login/logout, password reset, and a protected dashboard. It is designed to teach authentication flows, JWT cookie handling, secure password storage, and email-based account verification.

## Technology Stack
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT stored in `httpOnly` cookie, bcrypt password hashing, email verification code, reset tokens
- Mail service: Mailtrap API via `mailtrap` package
- Frontend: React, Vite, Zustand, React Router, Axios, Tailwind CSS
- Environment: `.env` for secrets and service endpoints

## Project Architecture
### Backend
- `backend/index.js` starts the Express server and connects to MongoDB.
- `backend/db/connectDB.js` manages the database connection using `mongoose.connect(process.env.MONGO_URI)`.
- `backend/routes/auth.route.js` defines auth routes under `/api/auth`.
- `backend/controllers/auth.controller.js` implements the auth business logic.
- `backend/models/user.model.js` defines the `User` schema.
- `backend/middleware/verifyToken.js` protects routes by validating JWT from cookies.
- `backend/utils/generateTokenandSetCookie.js` creates JWTs and stores them in secure cookies.
- `backend/mailtrap` contains email templates and Mailtrap integration.

### Frontend
- `frontend/src/main.jsx` wraps the app with `BrowserRouter`.
- `frontend/src/App.jsx` handles routes and protects authenticated pages.
- `frontend/src/store/authStore.js` is the central auth state store using Zustand.
- Pages implement user flows: login, signup, verify email, forgot password, reset password, dashboard.
- Components include reusable UI elements and password strength feedback.

## Backend Details
### `backend/index.js`
- Loads environment variables with `dotenv.config()`.
- Configures CORS to allow `http://localhost:5173` and send credentials.
- Uses `express.json()` and `cookieParser()`.
- Mounts auth routes at `/api/auth`.
- In production, serves static files from `frontend/dist` and returns `index.html` for SPA routes.
- Starts listening on `process.env.PORT || 5000` and calls `connectDB()`.

### `backend/db/connectDB.js`
- Connects to MongoDB using `process.env.MONGO_URI`.
- Logs the host on success.
- Exits the process on failure.

### `backend/routes/auth.route.js`
Routes:
- `GET /check-auth` - validated by `verifyToken`
- `POST /signup`
- `POST /login`
- `POST /logout`
- `POST /verify-email`
- `POST /forgot-password`
- `POST /reset-password/:token`

### `backend/middleware/verifyToken.js`
- Extracts JWT from `req.cookies.token`.
- If missing, returns 401 Unauthorized.
- Verifies token using `process.env.JWT_SECRET`.
- Attaches `req.userId` when valid.
- On verification failure, logs the issue and returns a server error.

### `backend/utils/generateTokenandSetCookie.js`
- Signs JWT with `{ userId }` and 7-day expiration.
- Stores token in an `httpOnly` cookie named `token`.
- Sets `secure: true` only in production.
- Uses `sameSite: strict` for CSRF protection.

### `backend/models/user.model.js`
User schema fields:
- `email`, `password`, `name`
- `lastLogin`, `isVerified`
- `resetPasswordToken`, `resetPasswordExpiresAt`
- `verificationToken`, `verificationTokenExpiresAt`
- `timestamps: true`

### `backend/controllers/auth.controller.js`
#### Signup
- Validates `email`, `password`, `name`.
- Prevents duplicate accounts.
- Hashes password with bcrypt.
- Generates 6-digit verification token.
- Stores expiry: 24 hours.
- Calls `generateTokenAndSetCookie(res, user._id)`.
- Sends verification email.
- Returns user data with password removed.

#### Verify Email
- Accepts a `code`.
- Searches user by `verificationToken` and expiry.
- Marks `isVerified` true, clears verification fields.
- Sends a welcome email.
- Returns the verified user record.

#### Login
- Finds user by email.
- Compares password with bcrypt.
- Issues JWT cookie on success.
- Updates `lastLogin`.
- Returns the user record.

#### Logout
- Clears the `token` cookie.
- Returns success.

#### Forgot Password
- Finds user by email.
- Creates a reset token using `crypto.randomBytes(20).toString('hex')`.
- Sets expiry to 1 hour.
- Saves token fields and emails a reset link built from `process.env.CLIENT_URL`.
- Returns success if request is sent.

#### Reset Password
- Validates the reset token and expiry.
- Hashes the new password using bcrypt.
- Clears reset token fields.
- Sends a success notification email.
- Returns success.

#### Check Auth
- Reads `req.userId` from verified JWT.
- Finds the user in MongoDB.
- Returns user data.

### Email Integration
- `backend/mailtrap/mailtrap.config.js` configures Mailtrap client using `MAILTRAP_TOKEN` and `MAILTRAP_ENDPOINT`.
- `backend/mailtrap/emails.js` exports functions for:
  - verification email
  - welcome email
  - password reset request
  - password reset success
- Static HTML templates are stored in `backend/mailtrap/emailTemplates.js`.

## Frontend Details
### `frontend/package.json`
- React 19
- Vite 7
- Zustand for state management
- `axios` for API calls with `withCredentials = true`
- Tailwind CSS via `@tailwindcss/vite`

### `frontend/src/store/authStore.js`
- `API_URL` uses `import.meta.env.MODE === 'development'`.
- Exposes state: `user`, `isAuthenticated`, `error`, `isLoading`, `isCheckingAuth`, `message`.
- Actions:
  - `signup`
  - `login`
  - `logout`
  - `verifyEmail`
  - `checkAuth`
  - `forgotPassword`
  - `resetPassword`
- Handles API requests and updates store state.
- Sets `error` from `response.data.message`.
- Uses `axios.post` and `axios.get` for auth endpoints.

### `frontend/src/App.jsx`
- Calls `checkAuth()` on first mount.
- Displays `LoadingSpinner` while checking auth.
- Uses React Router routes:
  - `/` -> `DashboardPage` protected
  - `/signup`
  - `/login`
  - `/verify-email`
  - `/forgot-password`
  - `/reset-password/:token`
- `ProtectedRoute` ensures only authenticated and verified users reach `/`.
- `RedirectAuthenticatedUser` sends logged-in verified users to `/` when they visit auth pages.

### Frontend Flows
#### Sign Up
- User completes name/email/password.
- Frontend calls `/api/auth/signup`.
- Backend creates user and sends verification code.
- Frontend navigates to `/verify-email`.
- User enters 6-digit code.
- On verify success, frontend redirects to `/`.

#### Login
- User enters email/password.
- Frontend calls `/api/auth/login`.
- Backend validates credentials and sets JWT cookie.
- App state updates and user enters dashboard.

#### Email Verification
- `EmailVerificationPage` accepts 6 separate inputs.
- On full entry, code is submitted automatically.
- The UI supports paste and auto-advance behavior.
- If verified, user is routed to `/`.

#### Forgot Password
- User enters email.
- Frontend calls `/api/auth/forgot-password`.
- Backend sends reset link to `CLIENT_URL/reset-password/<token>`.
- UI confirms the request was sent.

#### Reset Password
- User arrives on `/reset-password/:token`.
- They enter a new password and confirmation.
- Frontend calls `/api/auth/reset-password/${token}`.
- On success, user is redirected to login.

#### Dashboard
- Protected route displays user profile data.
- Shows `createdAt` and `lastLogin` using `formatDate()`.
- Logout clears auth state and token cookie.

### UI Components
- `Input.jsx`: reusable styled input with icon.
- `PasswordStrengthMeter.jsx`: live password strength feedback.
- `LoadingSpinner.jsx`: app loading indicator.
- `FloatingShape.jsx` provides background decoration.

## Auth Service Usage for Other Projects
This project can be used as a shared authentication service by other applications. The backend exposes a REST API under `/api/auth`, and external apps can authenticate by calling that service and keeping the returned JWT for subsequent requests.

### Service endpoints
- `POST /api/auth/signup` – create a new user
- `POST /api/auth/login` – log in and receive a JWT
- `POST /api/auth/logout` – clear the cookie
- `POST /api/auth/verify-email` – verify account with a 6-digit code
- `POST /api/auth/forgot-password` – send reset email
- `POST /api/auth/reset-password/:token` – set a new password
- `GET /api/auth/check-auth` – validate a token and return the current user

### JWT usage
The service supports both cookie auth for the included frontend and Bearer token auth for external apps.

Example request with Bearer token:

```http
GET http://localhost:5000/api/auth/check-auth
Authorization: Bearer <jwt-token>
```

Example login response:

```json
{
  "success": true,
  "token": "<jwt-token>",
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "isVerified": true
  }
}
```

### Reusable client helper
The repo includes a reusable client at `auth-service-client.js` that other projects can import and use without custom request logic.

```js
import AuthServiceClient from "./auth-service-client.js";

const auth = new AuthServiceClient({
  baseUrl: "http://localhost:5000/api/auth",
});

const result = await auth.login("john@example.com", "password123");
console.log(result.token);
console.log(result.user);
```

### CORS and security notes
- `ALLOWED_ORIGINS` can be set to allow multiple external frontends.
- The service now accepts Bearer tokens in addition to cookie-based auth.
- The backend strips password fields before returning user data to clients.
- For production, use dedicated environment variables and a proper OAuth/OIDC strategy when multiple unrelated apps need centralized identity management.

## Environment and Run Commands
### Environment variables in `.env`
- `MONGO_URI` – MongoDB connection string
- `JWT_SECRET` – secret key for signing JWT tokens
- `NODE_ENV` – development or production
- `MAILTRAP_TOKEN` – Mailtrap authentication token
- `MAILTRAP_ENDPOINT` – Mailtrap API endpoint
- `CLIENT_URL` – frontend origin (`http://localhost:5173`)
- `ALLOWED_ORIGINS` – comma-separated list of accepted frontend origins
- `AUTH_SERVICE_URL` – public URL for consuming apps

### Scripts
- `npm run dev` – runs backend with `nodemon` in development.
- `npm start` – runs backend in production mode.
- `npm run build` – installs dependencies and builds frontend.
- `frontend/package.json` runs Vite for frontend dev and build.

## Deployment Behavior
- In production, Express serves the compiled frontend from `frontend/dist`.
- A catch-all route returns `index.html` so React Router can handle client-side paths.
- Axios uses relative `/api/auth` paths in production and localhost API URL in development.

## Key Interview Discussion Points
### What’s working well
- Clear separation between backend and frontend.
- JWT stored in a secure `httpOnly` cookie.
- Email verification adds a second layer of account validation.
- Password reset flow uses time-limited token.
- Protected routes enforce authentication and verification.
- Zustand centralizes auth state for the app.

### Potential weaknesses / improvements
- `verifyToken` returns 500 on invalid token; should return 401.
- Verification code expiry is set to 24 hours, but the email says 15 minutes.
- Password reset token uses hex string only; could benefit from hashing before storing.
- No rate limiting for signup, login, forgot password, or verification requests.
- No input validation layer beyond simple required checks.
- `checkAuth` returns user data even if the JWT is valid but the account is not verified.
- `forgotPassword` reveals whether a user exists via response; a generic response would be safer.

### Design questions to expect
1. Explain the difference between access tokens in cookies and localStorage.
2. Why is `httpOnly` cookie used here? What attack surface does it reduce?
3. How does the email verification process protect from fake signups?
4. Why hash passwords with bcrypt instead of storing them in plain text?
5. What is the purpose of `sameSite: strict` for the auth cookie?
6. How would you add refresh tokens or multi-factor authentication?
7. How should the app behave if a JWT expires while the user is active?
8. What data should not be exposed in API responses?

### Recommended improvements for production
- Add request validation middleware (`express-validator` or `Joi`).
- Add rate limiting and account lockout.
- Store email verification and reset tokens as hashed values.
- Implement stronger CSRF protections if the app expands beyond same-site flows.
- Send email verification as a link instead of numeric code for easier UX.
- Add centralized error handling middleware.
- Log authentication events securely for auditing.
- Add tests for auth flows and APIs.

## Summary of Authentication Flow
1. User signs up with name, email, and password.
2. Backend hashes the password, stores user, issues JWT cookie, sends verification email.
3. User verifies email using the 6-digit code.
4. User logs in with email and password; backend issues JWT cookie.
5. Protected dashboard routes require a valid JWT and verified account.
6. Forgot password sends a reset link; reset password replaces the password and clears reset token.

## How to Use This Project for Interview Preparation
- Walk through each route and explain the request/response contract.
- Describe the state lifecycle in the frontend store.
- Identify security responsibilities for cookies, tokens, and user input.
- Discuss what happens when a token expires or a reset link is reused.
- Mention architectural patterns, such as API-first auth logic and SPA route guarding.

---

This document is written from a senior interviewer perspective: it emphasizes architecture, correctness, vulnerabilities, and actionable improvements for a candidate to discuss during a technical interview.
