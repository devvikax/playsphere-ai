# PlaySphere AI — Developer Setup & Run Guide

Follow these steps to set up and run PlaySphere AI locally on your machine.

---

## 📋 Prerequisites
Ensure you have the following installed:
* **Node.js**: v20 or later
* **npm**: v10 or later
* **Firebase Project**: An active Firebase project with Firestore and Authentication enabled.
* **Hosted LLM API Key**: An active API key from an OpenAI-compatible provider (e.g. Groq, Ollama).

---

## ⚙️ 1. Environment Configurations

Create a single `.env` file in the **root** directory (`playsphere-ai/.env`). Add the following configurations (replacing placeholders with your active credentials):

```env
# Next.js Public Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Maps API Keys
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Administrative E-mails (Comma-separated)
ADMIN_EMAILS=testadmin@gmail.com,testadmin2@gmail.com
NEXT_PUBLIC_ADMIN_EMAILS=testadmin@gmail.com,testadmin2@gmail.com

# AI Configuration (Hosted LLM via Groq/Ollama)
LLM_API_KEY=your_groq_api_key
LLM_API_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.1-8b-instant

# Django Internal Secret (Backend)
DJANGO_SECRET_KEY=your-django-secret-key-here
DEBUG=true

# Firebase Admin SDK Configuration (Backend Internal)
# Path to your downloaded Firebase Service Account key JSON file
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FIREBASE_PROJECT_ID=your_project_id

# Networking Connections
PYTHON_BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

*(Note: Environment variables prefixed with `NEXT_PUBLIC_` are automatically bundled into the Next.js client browser build, while other secrets are kept strictly server-side for the Next.js server proxies and the Python backend).*

---

## 📦 2. Dependencies Installation

To run both frontend and backend services locally, install dependencies in both environments:

**Frontend Client:**
Run npm install at the root directory:
```bash
npm install
```

**Python Backend:**
Navigate to the `backend/` directory and install python requirements:
```bash
cd backend
pip install -r requirements.txt
```

---

## 🌱 3. Database Seeding

To seed your Firestore database with default Lucknow venue documents:
1. Make sure your Firebase credentials are correct in the root `.env` file and `serviceAccountKey.json` is configured.
2. You can seed the database in two ways:
   - **Through the UI**: Sign in with an admin email, navigate to the Admin Dashboard (e.g. `/admin`), and click **"Seed Infrastructure & Landmarks"** under the *Database Initialization & Seeding* panel.
   - **Through the CLI**: Run the test suite command which automatically handles database seeding as part of Phase 1 verification:
     ```bash
     cd backend
     python manage.py run_test_suite
     ```

---

## 🏃 4. Running the Development Servers

Open two terminal windows in the project root:

**Terminal 1: Python Backend**
```bash
cd backend
# 1. Run django migrations
python manage.py migrate

# 2. Run the FastAPI development server
python -m uvicorn main:app --port 8000 --reload
```

**Terminal 2: Next.js Frontend Client**
```bash
npm run dev
```

Next.js will serve the application on [http://localhost:3000](http://localhost:3000) and proxy any API calls made to `/api/ai/*` or `/api/admin/*` directly to the Python backend on port `8000`.

---

## 🧪 5. Validation and Production Builds

Before proposing modifications or staging deployment, verify code compile and style checks:

```bash
# 1. Run ESLint checks on frontend
npm run lint

# 2. Run TypeScript compiler checks
npx tsc --noEmit --project frontend/tsconfig.json

# 3. Compile Next.js production build
npm run build

# 4. Run Python Backend test verification suite
cd backend
python manage.py run_test_suite
```
