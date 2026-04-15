# Deployment Guide

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_PROJECT_SLUG` | Project identifier to load | `torre-encuentro`, `loteoamvt`, `amvt` |
| `VITE_API_URL` | API endpoint path (relative) | `/api/v1` |

### Build-Time Variables (Production Only)

| Variable | Description | Example |
|----------|-------------|---------|
| `BUILD_API_URL` | Full API URL for meta tag generation | `https://real-state-api-mu32.onrender.com/api/v1` |

## Local Development

```bash
# Start local API on port 8080
cd ../api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080

# In another terminal, start dev server
npm run dev
```

**Local behavior:**
- ✅ `npm run dev` → fetches from `http://localhost:8080/api/v1`
- ✅ `npm run build` → fetches from `http://localhost:8080/api/v1`

## Vercel Deployment

### Step 1: Configure Environment Variables

In your Vercel project settings, add:

```
VITE_PROJECT_SLUG=torre-encuentro
VITE_API_URL=/api/v1
BUILD_API_URL=https://real-state-api-mu32.onrender.com/api/v1
```

### Step 2: Deploy

```bash
git push origin main
```

**Production behavior:**
- ✅ Build fetches meta tags from production API
- ✅ Social sharing (WhatsApp, Facebook) shows correct project name and logo
- ✅ Page title shows project tagline instead of "real-state-template"

## Meta Tags Generated

The build process automatically generates:

- `<title>` - Project tagline or name
- `og:title` - Open Graph title for social sharing
- `og:description` - Project description (if available)
- `og:image` - Project logo URL (if available)
- `og:type` - Set to "website"
- `twitter:card` - Twitter card type
- `twitter:title` - Twitter title
- `twitter:description` - Twitter description (if available)
- `twitter:image` - Twitter image (if available)

## Troubleshooting

### Build fails to fetch project data

**Symptom:** Build shows `[project-meta] Could not fetch project data`

**Solutions:**
1. Ensure API is running on port 8080 for local builds
2. Verify `BUILD_API_URL` is set correctly in Vercel
3. Check API is publicly accessible from CI/CD environment

The build will continue with fallback values if fetch fails.

### Wrong project displayed

**Check:** Verify `VITE_PROJECT_SLUG` matches the desired project slug in your database.

### Meta tags not updating in social previews

**Note:** Social platforms cache previews. Use these tools to refresh:
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/
