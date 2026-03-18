# ChurchOS — Setup Guide
How to go from these files to a live website in about 20 minutes.

---

## What you have
- index.html        → the entire ChurchOS frontend (all 9 workspaces)
- api/ai/workspace-chat.js  → connects to Claude AI
- api/securegive/   → your existing SecureGive API files
- api/rock/         → your existing Rock RMS API files
- vercel.json       → tells Vercel how to route everything

---

## Step 1 — Create a GitHub repository (5 min)

GitHub is where your code lives. Vercel reads from GitHub to publish your site.

1. Go to github.com and sign in (or create a free account)
2. Click the green "New" button (top left)
3. Name it: churchos
4. Leave everything else as default, click "Create repository"
5. You'll see a page with setup instructions — keep this tab open

---

## Step 2 — Upload your files to GitHub (5 min)

The easiest way without any coding:

1. On your new GitHub repo page, click "uploading an existing file" (small link near the bottom)
2. Drag ALL your files and folders into the upload area:
   - index.html
   - vercel.json
   - The entire "api" folder (drag the whole folder)
3. Scroll down, click "Commit changes"

Your folder structure should look like this on GitHub:
```
churchos/
  index.html
  vercel.json
  api/
    ai/
      workspace-chat.js     ← rename from api-ai-workspace-chat.js
    securegive/
      summary.js
      transaction.js
      donors.js
      webhook.js
    rock/
      dashboard.js
      guests.js
      volunteers.js
    google/
      gmail.js
      calendar.js
```

⚠️  IMPORTANT: The file named "api-ai-workspace-chat.js" needs to go inside
a folder called "ai" inside the "api" folder, named "workspace-chat.js".
So the path is: api/ai/workspace-chat.js

---

## Step 3 — Connect GitHub to Vercel (5 min)

1. Go to vercel.com, log in
2. Click "Add New Project"
3. Click "Import Git Repository"
4. Find your "churchos" repo and click "Import"
5. Vercel will detect the project — don't change any settings
6. Click "Deploy"

Your site will build and you'll get a URL like: churchos.vercel.app 🎉

---

## Step 4 — Add your API keys to Vercel (5 min)

This is how Vercel securely stores your passwords/keys so they never appear in your code.

1. In Vercel, go to your churchos project
2. Click "Settings" (top menu)
3. Click "Environment Variables" (left sidebar)
4. Add each of these one at a time:

| Name                        | Value                          |
|-----------------------------|--------------------------------|
| ANTHROPIC_API_KEY           | sk-ant-... (get from console.anthropic.com) |
| SECUREGIVE_API_KEY          | Your SecureGive API key        |
| ROCK_API_URL                | https://YOURCHURCH.rockrms.com/api |
| ROCK_API_KEY                | Your Rock RMS API key          |
| GOOGLE_SERVICE_ACCOUNT_EMAIL| your-service-account@...       |
| GOOGLE_PRIVATE_KEY          | -----BEGIN PRIVATE KEY-----... |
| GOOGLE_CALENDAR_ID          | your-calendar-id               |
| GOOGLE_SENDER_EMAIL         | no-reply@yourchurch.com        |

5. After adding all keys, go to "Deployments" and click "Redeploy" 
   so Vercel picks up the new keys.

---

## Step 5 — Get your Anthropic API key (2 min)

1. Go to console.anthropic.com
2. Sign up / log in
3. Click "API Keys" in the left sidebar
4. Click "Create Key"
5. Copy the key (starts with sk-ant-...)
6. Add it to Vercel as ANTHROPIC_API_KEY (see Step 4)

---

## Testing it works

Once deployed, open your Vercel URL and:
1. Click "Finance" in the sidebar
2. Wait a few seconds — you should see real SecureGive data load in the right panel
3. Type "Board giving summary" in the chat and press Enter
4. You should see the loading card animate, then Claude respond with real data

If Finance loads but AI chat doesn't work → ANTHROPIC_API_KEY is missing or wrong
If Finance shows "—" for all numbers → SECUREGIVE_API_KEY is missing or wrong

---

## Making updates later

Whenever you want to update the site:
1. Go to your GitHub repo
2. Click on index.html
3. Click the pencil icon (Edit)
4. Make your change
5. Click "Commit changes"
6. Vercel automatically redeploys within about 30 seconds

That's it — no terminal, no build process, no complexity.
