# IT Helpdesk Simulator - Deployment Guide

## Architecture Overview

- 🌐 **Frontend**: Next.js app deployed to **Vercel**
- 🚀 **Backend**: Express.js API deployed to **Railway**
- 🗄️ **Database**: PostgreSQL hosted on **Supabase**
- ⚡ **Redis**: Sessions/caching on **Upstash**
- 🤖 **AI**: OpenAI API integration

## Step-by-Step Deployment

### 1. Set up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project (choose a region close to your users)
3. Wait for the project to initialize (~2 minutes)
4. Go to Settings → Database and copy your connection string
5. It will look like: `postgresql://postgres:[password]@[host]:5432/postgres`

### 2. Set up Upstash Redis

1. Go to [upstash.com](https://upstash.com) and create an account
2. Create a new Redis database (choose same region as Supabase if possible)
3. Copy the Redis URL from the connection details
4. It will look like: `redis://default:[password]@[host]:6379`

### 3. Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account and add billing information
3. Generate an API key in the API Keys section
4. Copy the key (starts with `sk-...`)

### 4. Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `it-helpdesk-simulator` repository
4. Railway will detect the `railway.json` and deploy automatically

**Environment Variables for Railway:**
```bash
DATABASE_URL=your_supabase_connection_string
REDIS_URL=your_upstash_redis_url
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_random_jwt_secret_here
NEXTAUTH_SECRET=your_random_nextauth_secret_here
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-app-name.vercel.app
```

5. Copy your Railway app URL (e.g., `https://your-app.railway.app`)

### 5. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project" and import your `it-helpdesk-simulator` repo
3. Set the **Root Directory** to `apps/web`
4. Configure environment variables:

**Environment Variables for Vercel:**
```bash
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
NEXTAUTH_SECRET=same_as_railway_nextauth_secret
NEXTAUTH_URL=https://your-vercel-app.vercel.app
```

5. Deploy the project

### 6. Update CORS Settings

After both deployments:

1. Update the Railway environment variables:
   - Set `FRONTEND_URL` to your actual Vercel URL
2. Redeploy Railway if needed

### 7. Initialize Database

1. In Railway, go to your deployment logs
2. The Prisma migrations should run automatically on startup
3. If needed, you can run the seed command manually in Railway's terminal:
   ```bash
   cd apps/api && npx tsx prisma/seed.ts
   ```

## Testing Your Deployment

1. Visit your Vercel URL
2. Try to register a new account
3. Check that the backend API is responding at `your-railway-url/health`
4. Test the real-time chat functionality

## Monitoring and Logs

- **Frontend Logs**: Vercel dashboard → Functions tab
- **Backend Logs**: Railway dashboard → Deployments tab
- **Database**: Supabase dashboard → Logs tab
- **Redis**: Upstash dashboard → Metrics tab

## Cost Estimates (Free Tiers)

- **Vercel**: Free (100GB bandwidth/month)
- **Railway**: $5/month after 500 hours (generous free tier)
- **Supabase**: Free (2 databases, 500MB storage)
- **Upstash**: Free (10,000 requests/day)
- **OpenAI**: Pay-per-use (~$1-5/month for moderate usage)

**Total**: ~$5-10/month for a fully featured production app

## Troubleshooting

### Common Issues:

1. **Build fails on Railway**: Check that all dependencies are in the correct package.json files
2. **Database connection fails**: Verify the DATABASE_URL format and that IP restrictions are disabled in Supabase
3. **CORS errors**: Ensure FRONTEND_URL is set correctly on Railway
4. **Socket.IO not working**: Make sure Railway deployment is using HTTP (not serverless)

### Support Resources:

- Railway: [docs.railway.app](https://docs.railway.app)
- Vercel: [vercel.com/docs](https://vercel.com/docs)  
- Supabase: [supabase.com/docs](https://supabase.com/docs)

## Next Steps After Deployment

1. Set up custom domain (optional)
2. Configure email service for user verification
3. Set up monitoring and analytics
4. Implement CI/CD pipeline for automatic deployments
5. Add SSL certificates (automatic on Vercel/Railway)