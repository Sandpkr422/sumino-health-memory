# SUMINO – Full-Stack Backend Integration Guide

This guide details how to configure your hosted **Supabase** backend to work with your deployed frontend on **Vercel**. 

---

## Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in (or sign up for a free account).
2. Click **New Project** and select your organization.
3. Choose a project name (e.g., `sumino-health-memory`), enter a secure database password, choose the region closest to you, and click **Create New Project**.
4. Wait 1-2 minutes for your database to provision.

---

## Step 2: Provision Database Tables
1. In your Supabase Dashboard, click on **SQL Editor** in the left sidebar navigation.
2. Click **New Query**.
3. Open the [schema.sql](file:///C:/Users/Abcom/.gemini/antigravity/scratch/sumino-health-memory/schema.sql) file in your project folder, copy its contents, and paste them into the SQL Editor.
4. Click **Run** at the bottom right. You should see `Success: Query returned 0 rows.`
5. *(Optional)* Turn on **Row Level Security (RLS)** in settings for the `reports`, `biomarkers`, and `conversations` tables to guarantee that users can only query their own medical files.
   * To add policies easily, click **Database** -> **Tables** -> **RLS Policies** -> **New Policy** -> Choose **"Enable read/write access for authenticated users only"** (`auth.uid() = user_id`).

---

## Step 3: Create Storage Bucket for PDFs
1. Click on **Storage** in the left sidebar.
2. Click **New Bucket**.
3. Name the bucket exactly **`medical-reports`**.
4. Keep it **Private** (do not toggle public access; this secures patient medical records).
5. Click **Save**.
6. Set RLS Policies for the bucket:
   * Click **Policies** on the left.
   * Under `medical-reports`, click **New Policy** -> Choose **"Insert access for authenticated users only"** and **"Read access for owners only"** (`auth.uid() = owner`).

---

## Step 4: Configure Google OAuth Login (Optional)
To enable Google Login:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and navigate to **API & Services** -> **OAuth consent screen**. Set user type to **External** and add your app info.
3. Click **Credentials** -> **Create Credentials** -> **OAuth client ID**.
4. Select **Web application** as application type.
5. Under **Authorized redirect URIs**, enter the Redirect URI provided by Supabase:
   * Find this in Supabase: **Authentication** -> **Providers** -> **Google** -> Copy **Redirect URI**.
6. Copy the generated **Client ID** and **Client Secret** from Google Cloud.
7. Back in Supabase (**Authentication** -> **Providers** -> **Google**):
   * Toggle **Enable Google Provider** to active.
   * Paste the **Client ID** and **Client Secret**.
   * Click **Save**.

---

## Step 5: Configure Environment Variables

### A. Local Development Environment:
In your project folder (`C:\Users\Abcom\.gemini\antigravity\scratch\sumino-health-memory`), create a file named **`.env`** and paste your API keys:
```text
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(You can copy these variables from Supabase under **Project Settings** -> **API**).*

### B. Production Environment (Vercel):
To connect your live website:
1. Go to your [Vercel Dashboard](https://vercel.com) and click on your `sumino-health-memory` project.
2. Click **Settings** -> **Environment Variables** in the navigation tabs.
3. Add these two key-value pairs:
   * **Key**: `VITE_SUPABASE_URL` | **Value**: `https://your-project-id.supabase.co`
   * **Key**: `VITE_SUPABASE_ANON_KEY` | **Value**: `your-anon-key`
4. Click **Save**.
5. Re-deploy your project on Vercel (or push a commit to GitHub) to build the production build with these keys!
