# Deployment Guide

This guide covers deploying KisanSetu to production environments.

## 🚀 Quick Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account
- Supabase account
- Google Gemini API key

### Step 1: Fork and Clone
```bash
git clone https://github.com/your-username/SIH-2025-Grandfinale.git
cd SIH-2025-Grandfinale
```

### Step 2: Set Up Database
1. Create a new Supabase project
2. Go to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run" to create all tables
5. Go to Database → Replication
6. Enable real-time for all tables:
   - `farmer_listings`
   - `bids`
   - `fpo_sales_offers`
   - `processor_purchases`

### Step 3: Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_GEMINI_API_KEY=your-gemini-api-key
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   ```
3. Deploy!

### Step 4: Test Deployment
1. Open your deployed URL
2. Test login with demo credentials
3. Test real-time features with multiple browser tabs
4. Verify all API integrations work

## 🔧 Environment Configuration

### Required Environment Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |
| `VITE_GEMINI_API_KEY` | Google Gemini AI API key | Google AI Studio |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | Google Cloud Console |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_ENABLE_BLOCKCHAIN` | Enable blockchain features | `false` |
| `VITE_DEBUG_MODE` | Enable debug logging | `false` |

## 🏗️ Alternative Deployment Options

### Deploy to Netlify

1. **Connect Repository**
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Environment Variables**
   - Go to Site settings → Environment variables
   - Add all required variables

4. **Deploy**
   - Click "Deploy site"

### Deploy to AWS Amplify

1. **Connect Repository**
   - Go to AWS Amplify console
   - Click "New app" → "Host web app"
   - Connect your GitHub repository

2. **Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
   ```

3. **Environment Variables**
   - Add all required variables in Amplify console

### Self-Hosted Deployment

1. **Server Requirements**
   - Node.js 18+
   - nginx (recommended)
   - SSL certificate

2. **Build Application**
   ```bash
   npm install
   npm run build
   ```

3. **Serve Static Files**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           root /path/to/dist;
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## 🔐 Production Security

### Before Going Live

1. **Remove Demo Credentials**
   - Replace hardcoded users in `services/authService.ts`
   - Implement proper authentication system
   - Use Supabase Auth or similar service

2. **Environment Security**
   - Never commit `.env` files
   - Use different API keys for production
   - Enable API key restrictions where possible

3. **Database Security**
   - Review and test all RLS policies
   - Enable audit logging
   - Set up monitoring and alerts

### Security Headers

Add these headers to your deployment:

```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## 📊 Monitoring and Analytics

### Performance Monitoring

1. **Vercel Analytics**
   - Enable in Vercel dashboard
   - Monitor Core Web Vitals
   - Track user interactions

2. **Supabase Monitoring**
   - Monitor database performance
   - Track API usage
   - Set up alerts for errors

3. **Custom Analytics**
   ```typescript
   // Add to your app
   import { analytics } from './services/analytics'
   
   // Track user actions
   analytics.track('crop_advisory_generated', {
     crop: 'groundnut',
     district: 'khordha'
   })
   ```

### Error Tracking

1. **Sentry Integration**
   ```bash
   npm install @sentry/react
   ```

   ```typescript
   import * as Sentry from "@sentry/react"
   
   Sentry.init({
     dsn: "your-sentry-dsn",
     environment: "production"
   })
   ```

2. **Custom Error Logging**
   ```typescript
   // Log errors to your preferred service
   const logError = (error: Error, context: any) => {
     console.error('Application Error:', error, context)
     // Send to logging service
   }
   ```

## 🚀 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to Vercel
      uses: vercel/action@v1
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### Automated Testing

```yaml
- name: Run E2E tests
  run: |
    npm run test:e2e
    
- name: Run security audit
  run: |
    npm audit --audit-level high
    
- name: Check for vulnerabilities
  run: |
    npx snyk test
```

## 🔄 Database Migrations

### Schema Updates

1. **Development**
   ```sql
   -- Add new columns
   ALTER TABLE farmer_listings 
   ADD COLUMN new_field TEXT;
   ```

2. **Production**
   - Test migrations on staging first
   - Use Supabase migration tools
   - Always backup before migrations

### Data Seeding

```sql
-- Insert sample data for testing
INSERT INTO farmer_listings (farmer_id, crop_name, quantity)
VALUES ('farmer_1', 'Groundnut', 100);
```

## 📱 Mobile App Deployment

### Progressive Web App (PWA)

1. **Add PWA Manifest**
   ```json
   {
     "name": "KisanSetu",
     "short_name": "KisanSetu",
     "start_url": "/",
     "display": "standalone",
     "theme_color": "#10b981",
     "background_color": "#ffffff"
   }
   ```

2. **Service Worker**
   ```javascript
   // Enable offline functionality
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.register('/sw.js')
   }
   ```

### React Native (Future)

For mobile app development:

```bash
npx react-native init KisanSetuMobile
cd KisanSetuMobile
npm install @supabase/supabase-js
```

## 🌍 Multi-Region Deployment

### Global CDN

1. **Vercel Edge Network**
   - Automatic global distribution
   - Edge caching for static assets
   - Regional compute for dynamic content

2. **Custom CDN Setup**
   ```javascript
   // Configure CDN headers
   export default function handler(req, res) {
     res.setHeader('Cache-Control', 's-maxage=86400')
     // Your API logic
   }
   ```

### Database Replication

```sql
-- Set up read replicas for better performance
-- This depends on your database provider
```

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Backup procedures in place

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Real-time features working
- [ ] API endpoints responding
- [ ] Database connections stable
- [ ] Monitoring alerts configured
- [ ] Error tracking active

### Production Readiness

- [ ] Demo credentials removed
- [ ] Proper authentication implemented
- [ ] Security headers configured
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Analytics tracking active

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Environment Variables Not Working**
   - Check variable names (must start with `VITE_`)
   - Verify values in deployment platform
   - Redeploy after adding variables

3. **Database Connection Issues**
   - Verify Supabase URL and key
   - Check RLS policies
   - Test connection in Supabase dashboard

4. **Real-time Not Working**
   - Enable replication in Supabase
   - Check WebSocket connections
   - Verify authentication

### Getting Help

- Check GitHub Issues
- Review deployment logs
- Contact support team
- Community Discord/Slack

---

🎉 **Congratulations!** Your KisanSetu application is now deployed and ready to empower farmers across Odisha! 🌾