# DraftProse (Local Development)

## 1. Start the Database
Run the following command to start a local PostgreSQL container:
```bash
docker-compose up -d
```

## 2. Configure Environment
Create a `.env` file based on `.env.example` (if available) or use:
```env
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/draftprose"
BETTER_AUTH_SECRET="your-secret"
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-key"
```

## 3. Setup Database Schema
Apply the Prisma schema to your local database:
```bash
npx prisma db push
```

## 4. Run the App
Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).
Login with **"Enter Demo Mode"** to auto-seed and explore.
