# SUMINO – AI Health Memory

SUMINO is a modern, premium AI-powered healthcare web application designed to help users upload, organize, and understand their medical reports and blood test records over time.

Deployed Live at: [https://sumino-health-memory.vercel.app/](https://sumino-health-memory.vercel.app/)

## Key Features
- **Sleek Healthcare Aesthetic**: Clean, responsive layout with curved card elements, soft blue accents, and print-optimized worksheets.
- **Biomarker Timeline & Charts**: Visualizes historical biomarker trends (Vitamin D, LDL Cholesterol, HbA1c, TSH) using native SVG graphs and clinically coded trend arrows.
- **Contextual AI Chat Sandbox**: ChatGPT-style assistant to query, compare, and explain your medical reports using strictly sandboxed context.
- **Printable Doctor Preparation Summary**: Generates a consolidated 1-page overview summarizing medical history, out-of-range anomalies, and consultation questions to ask your physician.
- **Production Full-Stack Cloud Integration**: Wired to Supabase for secure Email OTP/Google Login authentication, PDF storage buckets, and PostgreSQL database synchronization.

## Technology Stack
- **Frontend**: HTML5, Vanilla CSS, Modular JavaScript (Vite compiler)
- **Backend / DB / Auth**: Supabase (PostgreSQL, Storage Buckets, Auth Go APIs)
- **Analytics**: Vercel Web Analytics
- **Deployment**: Vercel Serverless Hosting
