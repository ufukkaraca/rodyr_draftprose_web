# DraftProse (Web)

DraftProse is an AI-powered writing studio designed to help writers focus, organize, and create. It features a distraction-free-first interface, a powerful block-based editor, and integrated AI tools to function as a creative partner.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/)
- **Editor**: [Tiptap](https://tiptap.dev/)
- **AI Integration**: [Google Gemini Pro](https://deepmind.google/technologies/gemini/)

## Prerequisites

- **Node.js**: v20 or higher
- **Package Manager**: npm (or pnpm/yarn)
- **Database**: PostgreSQL (local or hosted)

## 1. Obtaining Credentials

Before running the app, you need to acquire the necessary API keys from Google.

### A. Google OAuth (for Login)

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (e.g., "DraftProse").
3.  Navigate to **APIs & Services** > **OAuth consent screen**.
    - select **External** (unless you are in a Google Workspace organization).
    - Fill in the App Name, User Support Email, and Developer Contact Info.
    - Click **Save and Continue**.
4.  Navigate to **Credentials**.
    - Click **Create Credentials** > **OAuth client ID**.
    - Application type: **Web application**.
    - Name: "DraftProse Web".
    - **Authorized JavaScript origins**: `http://localhost:3000` (and your production domain later, e.g., `https://draftprose.yourdomain.com`).
    - **Authorized redirect URIs**:
        - `http://localhost:3000/api/auth/callback/google`
        - `https://draftprose.yourdomain.com/api/auth/callback/google` (for production)
5.  Click **Create**. Copy the **Client ID** and **Client Secret**.

### B. Gemini API (for AI Features)

1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Click **Get API key** in the sidebar.
3.  Click **Create API key**.
4.  Copy the generated key string.

## 2. Local Development Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd rodyr_draftprose_web
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory:

    ```env
    # Database (Example for local Postgres)
    DATABASE_URL="postgresql://postgres:password@localhost:5432/draftprose"

    # NextAuth
    AUTH_SECRET="run-npx-auth-secret-to-generate-this"
    AUTH_GOOGLE_ID="your-google-client-id"
    AUTH_GOOGLE_SECRET="your-google-client-secret"

    # AI Service
    GOOGLE_API_KEY="your-gemini-api-key"
    ```

4.  **Database Setup**:
    ```bash
    npx prisma migrate dev --name init
    ```

5.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 3. Full Deployment Guide (Dokploy)

This guide assumes you have a VPS with [Dokploy](https://dokploy.com/) installed and a domain pointing to it. We will host both the database and the application on the same server.

### Step A: Deploy the Database (PostgreSQL)

1.  Open your Dokploy Dashboard.
2.  Go to your Project > **Database** tab.
3.  Click **Create Database** > Select **PostgreSQL**.
4.  **Configuration**:
    - **Name**: `draftprose-db`
    - **User**: `draftprose_user`
    - **Password**: Generate a strong password.
    - **Database Name**: `draftprose_production`
5.  Click **Create**.
6.  Once created, look for the **Internal Connection URL**. It will look something like:
    `postgresql://draftprose_user:PASSWORD@dokploy-postgres-draftprose-db:5432/draftprose_production`
    *Note: We will use this INTERNAL URL for the application so traffic stays within the Docker network.*

### Step B: Deploy the Application

1.  Go to your Project > **Application** tab.
2.  Click **Create Application** > **Git Provider** (connect your GitHub repo).
3.  Select the **Repository**, **Branch** (main), and **Build Type** (Docker or Nixpacks).
    *Recommendation: Use **Nixpacks** for automatic Next.js detection.*

4.  **Environment Variables**:
    Go to the **Environment** tab of your new application and add the following:

    | Key | Value |
    | :--- | :--- |
    | `DATABASE_URL` | The **Internal Connection URL** from Step A. |
    | `AUTH_SECRET` | A new random string (run `openssl rand -base64 32` locally to generate). |
    | `AUTH_GOOGLE_ID` | Your Google Client ID. |
    | `AUTH_GOOGLE_SECRET` | Your Google Client Secret. |
    | `GOOGLE_API_KEY` | Your Gemini API Key. |
    | `AUTH_TRUST_HOST` | `true` (Required for NextAuth behind proxy). |
    | `AUTH_URL` | `https://your-domain.com` (The public URL of your app). |

5.  **Build Settings**:
    - **Build Command**: `next build`
    - **Start Command**: `next start`
    - **Install Command**: `npm install`

6.  **Network**:
    - Set the **Container Port** to `3000`.

7.  **Domain**:
    - Go to the **Domains** tab.
    - Add your domain (e.g., `draftprose.yourdomain.com`).
    - Enable **HTTPS** (Let's Encrypt).

### Step C: Database Migration in Production

Since the app is running in a container, you need to run the migrations against the production database.

1.  **Option 1: Build Command (Easiest)**
    Change your **Build Command** in Dokploy to:
    ```bash
    npx prisma migrate deploy && next build
    ```
    This ensures the database schema is updated every time you deploy a new version.

2.  **Option 2: Shell Access**
    - In Dokploy, go to the **Terminal** tab of your running application.
    - Run: `npx prisma migrate deploy`

### Step D: Finalize Google OAuth

1.  Go back to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Edit your DraftProse credentials.
3.  Add your production URL to **Authorized JavaScript origins**:
    - `https://draftprose.yourdomain.com`
4.  Add your production callback to **Authorized redirect URIs**:
    - `https://draftprose.yourdomain.com/api/auth/callback/google`
5.  Save changes.

**Deploy!** Click "Deploy" in Dokploy. Your app should now be live with a self-hosted database and full AI capabilities.
