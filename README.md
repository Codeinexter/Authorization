# Auth Service Setup Guide

This project is now prepared to be used as a shared authentication service for other projects and clients.

If you are completely new to this, think of it this way:

- This project is the central login system.
- Other apps will ask this project to log users in.
- After login, this project gives them a token.
- Other apps use that token to know which user is currently logged in.

This is the basic idea of an auth service.

## Current deployment model

This project can run in two ways:

1. **Local development:** run the service on your computer with `npm run dev`.
2. **Render production service:** deploy the backend as a Render Web Service with `npm run build` and `npm start`.

The Render URL becomes the public address that other applications use. For example:

```text
https://your-auth-service.onrender.com/api/auth
```

The service also has a health check:

```text
https://your-auth-service.onrender.com/health
```

Expected response:

```json
{
  "status": "ok"
}
```

---

## What this project does

This project handles:

- signup
- login
- logout
- email verification
- password reset
- checking whether a user is currently authenticated

It uses:

- Node.js
- Express
- MongoDB
- JWT (JSON Web Tokens)
- bcrypt for password hashing

---

## What you need before starting

You need:

1. Node.js installed on your computer.
2. MongoDB database access.
3. A Mailtrap account for email verification and password reset emails.
4. A code editor like VS Code.
5. Access to this project folder.

---

## Step 1: Open the project

Open the project folder in VS Code.

Your main project folder is:

```text
c:\Users\rosha\Desktop\Sigma\Projects\Authorization
```

Inside it, you will see folders like:

- backend/
- frontend/
- auth-service-client.js
- .env.example
- Authorization_Project_Overview.md

---

## Step 2: Configure local environment variables

There is a file called `.env.example`.

Copy it and create a new file named `.env`.

In VS Code:

- Open `.env.example`
- Copy all the text
- Create a new file named `.env`
- Paste the content there

Then update it with your real values.

Example:

```env
MONGO_URI=mongodb+srv://your-user:your-password@cluster.mongodb.net/your-db
PORT=5000
JWT_SECRET=replace_with_a_strong_secret
NODE_ENV=development

MAILTRAP_TOKEN=your_mailtrap_token
MAILTRAP_ENDPOINT=https://send.api.mailtrap.io/
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
AUTH_SERVICE_URL=http://localhost:5000/api/auth
```

Use `NODE_ENV=development` for local work. Do not copy production secrets into a public repository.

### What each value means

- `MONGO_URI` = your database connection string
- `PORT` = the port this service runs on
- `JWT_SECRET` = the secret key used to sign the login tokens
- `NODE_ENV` = environment mode, usually development or production
- `MAILTRAP_TOKEN` = email sending token from Mailtrap
- `MAILTRAP_ENDPOINT` = Mailtrap API URL
- `CLIENT_URL` = your frontend app URL
- `ALLOWED_ORIGINS` = list of frontend apps allowed to talk to this API
- `AUTH_SERVICE_URL` = the URL other apps will use to access this service

> Important: keep `JWT_SECRET` secret. Never share it publicly.

---

## Step 3: Install dependencies

Open a terminal in the project root and run:

```bash
npm install
```

This installs the backend dependencies.

If the project previously failed with a `Cannot find module` error, repair the local installation with:

```bash
npm ci
```

Use `npm ci` only after `package-lock.json` is present. It recreates `node_modules` from the lockfile.

If the frontend app is also used, you may also run:

```bash
npm install --prefix frontend
```

---

## Step 4: Start the auth service

From the project root, run:

```bash
npm run dev
```

This starts the backend server.

You should see output similar to:

```text
Server is listening to port 5000!
```

If it starts successfully, your auth service is running.

The project scripts are cross-platform:

- `npm run dev` starts local development with automatic restart.
- `npm start` starts the production server.
- You do not need to type `NODE_ENV=development` or `NODE_ENV=production` before the commands. Render supplies `NODE_ENV=production` through its environment settings.

To test the local service, open:

```text
http://localhost:5000/health
```

You should receive:

```json
{
  "status": "ok"
}
```

### If you are using Render

Render runs this project as a Web Service.

1. Push the project to a GitHub repository.
2. In Render, choose **New > Web Service**.
3. Connect the GitHub repository.
4. Set the root directory to the repository root.
5. Set **Build Command** to:

```bash
npm run build
```

6. Set **Start Command** to:

```bash
npm start
```

7. Choose a Node runtime and deploy.
8. Add the environment variables listed below in Render's **Environment** section.
9. After deployment, open this URL to confirm the service is running:

```text
https://YOUR-SERVICE-NAME.onrender.com/health
```

The response should be:

```json
{
  "status": "ok"
}
```

Render provides the `PORT` variable automatically. The server uses it, so do not hard-code a production port.

### Required Render environment variables

Add these in Render. Do not commit your real values to GitHub.

```env
MONGO_URI=your-production-mongodb-connection-string
JWT_SECRET=your-long-random-production-secret
NODE_ENV=production
MAILTRAP_TOKEN=your-mailtrap-token
MAILTRAP_ENDPOINT=https://send.api.mailtrap.io/
CLIENT_URL=https://your-frontend-domain.example
ALLOWED_ORIGINS=https://your-frontend-domain.example
AUTH_SERVICE_URL=https://YOUR-SERVICE-NAME.onrender.com/api/auth
```

Do not add `PORT` manually unless you have a specific reason. Render supplies the correct `PORT`, and the server reads it automatically.

### Render deployment checklist

Before deploying, confirm:

1. Your code is pushed to GitHub.
2. Your MongoDB cluster allows connections from Render.
3. Your Render environment contains `MONGO_URI`, `JWT_SECRET`, Mailtrap values, and `NODE_ENV`.
4. `ALLOWED_ORIGINS` contains the exact origin of every browser frontend, including `https://` and without a trailing slash.
5. Your Render service is using `npm run build` as the build command.
6. Your Render service is using `npm start` as the start command.
7. `/health` returns `{"status":"ok"}` after deployment.

### Important: rotate exposed secrets

If real database, JWT, or Mailtrap credentials were ever committed to Git or shared publicly, change them before production deployment. Put the replacement values only in Render's Environment settings and in your local untracked `.env` file.

If you have multiple client frontends, separate their URLs with commas:

```env
ALLOWED_ORIGINS=https://app-one.example,https://app-two.example
```

After changing an environment variable, redeploy the service in Render.

### Deploying a separate frontend

If the frontend in this repository is also deployed on Render, create a second Render Static Site:

- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `frontend/dist`

Set the frontend's API URL to your Render auth service URL. For the current frontend, update its production API configuration if the frontend and backend are deployed separately.

If you only need the backend as an auth service, deploy the Web Service and do not deploy the `frontend` folder.

---

## Step 5: Understand the API endpoints

These are the main endpoints your other apps will use.

### 1. Signup

```http
POST http://localhost:5000/api/auth/signup
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "mypassword123",
  "name": "John Doe"
}
```

This creates a new user and sends a verification email.

---

### 2. Login

```http
POST http://localhost:5000/api/auth/login
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "mypassword123"
}
```

Response:

```json
{
  "success": true,
  "token": "JWT_TOKEN_HERE",
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "user@example.com",
    "isVerified": true
  }
}
```

This is the most important endpoint for other apps.

---

### 3. Check authentication

```http
GET http://localhost:5000/api/auth/check-auth
``` 

Add this header:

```http
Authorization: Bearer JWT_TOKEN_HERE
```

This tells the auth service:

- "Please verify this token"
- "Who is the user behind this token?"

If valid, it returns the user information.

---

### 4. Logout

```http
POST http://localhost:5000/api/auth/logout
```

This clears the token cookie for browser-based clients.

---

### 5. Forgot password

```http
POST http://localhost:5000/api/auth/forgot-password
```

Request body:

```json
{
  "email": "user@example.com"
}
```

This sends a password reset email.

---

### 6. Reset password

```http
POST http://localhost:5000/api/auth/reset-password/TOKEN_HERE
```

Request body:

```json
{
  "password": "newpassword123"
}
```

---

## Step 6: How other clients use this service

A client means another project or app that wants to use this auth system.

Example client types:

- another React app
- another Node.js backend
- a mobile app backend
- a desktop app

The client does not need to store user passwords itself.

It only needs to:

1. Call the auth service login endpoint
2. Receive the JWT token
3. Store that token in local storage, session storage, or a secure cookie
4. Send the token on every protected request

---

## Step 7: Login flow for another app

Here is the workflow:

1. User enters email and password in Client App A
2. Client App A sends a request to this auth service
3. Auth service checks the user in MongoDB
4. Auth service validates the password
5. Auth service returns a JWT token
6. Client App A stores the token
7. Client App A uses that token to access protected resources

This means the user is authenticated centrally.

---

## Step 8: Use the token in another project

After login, the returned token should be sent in the Authorization header.

Example:

```http
Authorization: Bearer <jwt-token>
```

This is how protected endpoints are accessed.

Example JavaScript request:

```js
const token = localStorage.getItem("authToken");

const response = await fetch("http://localhost:5000/api/auth/check-auth", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data);
```

---

## Step 9: Use the ready-made client helper

A helper file is already included:

```text
auth-service-client.js
```

This file makes it easier for other apps to use this auth service.

Example usage:

```js
import AuthServiceClient from "./auth-service-client.js";

const auth = new AuthServiceClient({
  baseUrl: "http://localhost:5000/api/auth",
});

const result = await auth.login("user@example.com", "mypassword123");
console.log(result.token);
console.log(result.user);
```

This helper can:

- log in
- sign up
- log out
- validate the token
- send password reset requests

---

## Step 10: Add CORS for new client apps

Your backend includes a CORS configuration. You may need to allow other frontend domains.

Open this file:

```text
backend/index.js
```

Look for this part:

```js
const allowedOrigins = [
    ...(process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    "http://localhost:5173",
    "http://localhost:3000",
];
```

If you have another frontend app, add its URL in your `.env` file:

```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://myclient.com
```

This tells the server: "These websites are allowed to talk to my API."

For a backend-to-backend client, CORS is usually not involved. CORS applies mainly when JavaScript running in a browser calls this service.

---

## Step 11: Use it in production

Before using this in a real production system, do these things:

### A. Use a real secret key

Never use a weak or easy-to-guess secret.

Example:

```env
JWT_SECRET=averystrongrandomsecret1234567890
```

### B. Use real domains

Instead of localhost, use real domain names like:

```text
https://auth.mycompany.com
https://app1.mycompany.com
```

### C. Use HTTPS only

Your auth server should always use HTTPS in production.

### D. Protect your database

Use a strong MongoDB connection string and restrict access.

### E. Use environment variables

Never hardcode secrets into the code.

---

## Step 12: What to do after this

Once your service is running and another app can log in, the next steps are:

### Option 1: Use it for internal apps only

If your client apps are trusted and all under your control, the setup is simple:

- auth service runs centrally
- apps call it to login
- apps pass JWT token to API requests

This is the easiest path.

### Option 2: Scale it into a full auth system

If you later want more advanced structure, do this next:

- add refresh tokens
- add user roles (admin, user, editor)
- add OAuth/OIDC support
- add app registration for each client
- add scopes and permissions
- add token expiration and refresh flows

This is the next-level version of this project.

---

## Step 13: Good next project structure

A common pattern is:

```text
Auth Service Project
    ├── backend/
    ├── frontend/
    ├── auth-service-client.js
    ├── .env
    └── README.md
```

Then each other app does this:

```text
Client App A -> calls Auth Service -> gets JWT -> uses JWT -> protected endpoints
Client App B -> calls Auth Service -> gets JWT -> uses JWT -> protected endpoints
```

---

## Step 14: Simple example workflow

Here is the full flow:

1. User signs up at Client App A
2. Client App A calls this auth service signup API
3. Auth service creates user and sends verification email
4. User verifies email
5. User logs in
6. Auth service returns JWT token
7. Client App A stores token
8. Client App A calls protected endpoints using the token
9. Auth service validates the token
10. Client App A gets user information

That is the complete pattern.

---

## Step 15: What to remember

If you remember only a few things, remember these:

- This project is the identity provider
- Other apps should call it, not create their own login system
- Use the JWT token for protected requests
- Protect the JWT secret
- Keep the CORS allowlist updated
- Use HTTPS in production
- Never expose passwords or hashes to other clients

---

## Step 16: Quick commands summary

From the project root:

```bash
npm install
npm run dev
```

For a clean reinstall after dependency problems:

```bash
npm ci
```

For a production-like local start:

```bash
npm start
```

If you want to stop the server:

```bash
Ctrl + C
```

## Troubleshooting

### `NODE_ENV is not recognized` or the command fails on Windows

Use:

```bash
npm run dev
```

Do not run `NODE_ENV=development nodemon backend/index.js` directly in the Windows terminal. The project scripts already handle startup without that Unix-only syntax.

### `Cannot find module` inside `node_modules`

Run:

```bash
npm ci
npm run dev
```

This recreates the dependency folder from `package-lock.json`.

### Render deploys but the service is unhealthy

Check these items:

- the start command is exactly `npm start`
- the service reads Render's `PORT`
- `/health` returns HTTP 200
- `MONGO_URI` is valid
- MongoDB accepts connections from Render
- Render logs do not show a missing environment variable

### Browser receives a CORS error

Set the frontend's exact origin in Render:

```env
ALLOWED_ORIGINS=https://your-frontend.example
```

Then redeploy. Do not include a path such as `/login`, and do not add a trailing slash.

### Password reset email contains the wrong URL

Set `CLIENT_URL` to the frontend URL that contains the reset-password page, then redeploy:

```env
CLIENT_URL=https://your-frontend.example
```

---

## Final explanation in simple words

This project can become a central login service for many apps.

Instead of every app making its own user system, every app can ask this project:

- "Does this user exist?"
- "Is this password correct?"
- "What user is this token for?"

And this project answers.

That is the full idea of using auth as a service.

---

## Recommended next action

If you want to continue, the next best step is:

1. Start the project locally
2. Test signup and login using Postman or a browser
3. Try using the token in a different simple client app
4. Add your real domain names and production config
5. Later upgrade to OAuth/OIDC for a cleaner enterprise setup

---

If you want, I can also create a second README for a "Client App Integration Example" that shows exactly how another project should call this service step by step.
