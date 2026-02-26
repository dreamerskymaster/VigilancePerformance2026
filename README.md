# Vigilance Decrement Study - Web Application

**Northeastern University | IE 6500: Human Performance**

## Overview

This web application conducts a research study on vigilance decrement in visual inspection tasks. Participants inspect metal surface images and identify defects, with some participants receiving AI assistance.

## Study Design

- **Duration:** ~25 minutes
- **Images:** 90 total (45 defective, 45 clean)
- **Blocks:** 3 time blocks (30 images each)
- **Conditions:** AI-Assisted vs. Manual Inspection

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **Analytics:** Vercel Analytics & Speed Insights

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Setup Supabase

Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor.

### 4. Run development server
```bash
npm run dev
```

## Project Structure
```
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Landing page
│   ├── consent/           # Informed consent
│   ├── demographics/      # Participant info
│   ├── training/          # Defect examples & practice
│   ├── task/              # Main inspection task
│   ├── questionnaire/     # NASA-TLX & AI Trust
│   ├── debrief/           # Thank you & submission
│   ├── admin/             # Admin dashboard
│   └── api/               # API routes
├── components/            # Reusable React components
├── lib/                   # Utilities & configurations
├── public/images/         # Study images (90 total)
├── scripts/               # Utility scripts
└── supabase/              # Database schema
```

## Routes
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/consent` | Informed consent form |
| `/demographics` | Participant demographics |
| `/training` | Training & practice |
| `/task` | Main inspection task |
| `/questionnaire` | Workload & trust assessment |
| `/debrief` | Study completion |
| `/admin` | Admin dashboard (password protected) |

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/submit` | POST | Submit participant data |

## Deployment
Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

## Data Privacy

- No personal identifiers collected (no names, emails)
- Random participant IDs generated
- Data stored securely in Supabase
- Compliant with Northeastern research policies

## Contact
For questions about this study, contact the research team through the course instructor.
