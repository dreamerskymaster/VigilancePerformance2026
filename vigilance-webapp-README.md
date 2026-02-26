# Vigilance Decrement Study - Web Application

**Northeastern University | IE 6500: Human Performance**  
**Project: Vigilance Decrement in Visual Inspection**

---

## Table of Contents

1. [Overview](#overview)
2. [Study Design](#study-design)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Setup Instructions](#setup-instructions)
6. [Database Setup (Supabase)](#database-setup-supabase)
7. [Running Locally](#running-locally)
8. [Deployment (Vercel)](#deployment-vercel)
9. [User Flow](#user-flow)
10. [Component Documentation](#component-documentation)
11. [API Documentation](#api-documentation)
12. [Data Collection](#data-collection)
13. [Troubleshooting](#troubleshooting)
14. [Research Ethics & Privacy](#research-ethics--privacy)
15. [Contributing](#contributing)

---

## Overview

This web application conducts a research study investigating **vigilance decrement** in visual inspection tasks. Participants inspect metal surface images to identify defects. The study compares two conditions:

- **AI-Assisted:** Participants receive AI predictions highlighting potential defects
- **Manual (Unassisted):** Participants inspect images without any AI assistance

The goal is to understand how attention, accuracy, and performance change over time during sustained inspection tasks, and whether AI assistance helps or hinders performance.

### Key Research Questions

1. Does vigilance (detection accuracy) decrease over time during sustained inspection?
2. Does AI assistance reduce vigilance decrement?
3. How does AI assistance affect response time and decision-making?

---

## Study Design

### Experimental Design

| Factor | Type | Levels |
|--------|------|--------|
| Condition | Between-subjects | AI-Assisted, Unassisted |
| Time Block | Within-subjects | Block 1, Block 2, Block 3 |

**Design:** 2 × 3 Mixed Factorial

### Study Parameters

| Parameter | Value |
|-----------|-------|
| Total Images | 90 |
| Images per Block | 30 |
| Time Blocks | 3 (~7 min each) |
| Total Duration | ~25 minutes |
| Defect Prevalence | 50% |
| Defect Images | 45 (7-8 per defect type) |
| Non-Defect Images | 45 |
| Target Sample Size | 50 participants (25 per condition) |

### Defect Types (from NEU Surface Defect Database)

| Code | Name | Description |
|------|------|-------------|
| Cr | Crazing | Fine network of surface cracks |
| In | Inclusion | Foreign material embedded in surface |
| Pa | Patches | Irregular discolored areas |
| PS | Pitted Surface | Small holes or depressions |
| RS | Rolled-in Scale | Oxide scale pressed into surface |
| Sc | Scratches | Linear surface marks |

### AI System Calibration

| Metric | Value |
|--------|-------|
| Overall Accuracy | 85% |
| True Positive Rate (Sensitivity) | 88% |
| True Negative Rate (Specificity) | 82% |
| Confidence Range (Correct) | 70-94% |
| Confidence Range (Incorrect) | 40-69% |

### Dependent Variables

1. **Detection Accuracy:** Hit rate, false alarm rate
2. **Signal Detection Metrics:** d' (sensitivity), c (criterion/bias)
3. **Response Time:** Milliseconds from image display to response
4. **Subjective Workload:** NASA-TLX (6 subscales, 0-100)
5. **Sleepiness:** Karolinska Sleepiness Scale (1-9, pre/post)
6. **AI Trust:** 5-item scale (AI condition only)

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework (App Router) |
| TypeScript | Type-safe JavaScript |
| Tailwind CSS | Utility-first styling |
| Supabase | PostgreSQL database + Auth |
| Vercel | Deployment & hosting |
| Vercel Analytics | Usage analytics |
| Vercel Speed Insights | Performance monitoring |

### Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "@supabase/supabase-js": "^2.x",
    "@vercel/analytics": "^1.x",
    "@vercel/speed-insights": "^1.x",
    "uuid": "^9.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "@types/node": "^20.x",
    "@types/react": "^18.x"
  }
}
```

---

## Project Structure

```
vigilance-webapp/
│
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout (Analytics, fonts)
│   ├── globals.css              # Global styles + Tailwind
│   ├── page.tsx                 # Landing page
│   │
│   ├── consent/
│   │   └── page.tsx             # Informed consent form
│   │
│   ├── demographics/
│   │   └── page.tsx             # Participant demographics
│   │
│   ├── training/
│   │   └── page.tsx             # Defect examples + practice
│   │
│   ├── task/
│   │   └── page.tsx             # Main inspection task (90 images)
│   │
│   ├── questionnaire/
│   │   └── page.tsx             # NASA-TLX + AI Trust
│   │
│   ├── debrief/
│   │   └── page.tsx             # Thank you + data submission
│   │
│   ├── admin/
│   │   └── page.tsx             # Admin dashboard (password protected)
│   │
│   └── api/
│       └── submit/
│           └── route.ts         # POST endpoint for data submission
│
├── components/                   # Reusable React components
│   ├── index.ts                 # Barrel export
│   ├── ImageDisplay.tsx         # Image viewer with AI overlay
│   ├── AIOverlay.tsx            # AI prediction visualization
│   ├── AIModeIndicator.tsx      # AI/Manual mode badge
│   ├── ResponseButtons.tsx      # Defect/No Defect buttons
│   ├── ProgressBar.tsx          # Trial progress indicator
│   ├── Timer.tsx                # Elapsed time display
│   └── LikertScale.tsx          # Rating scales (NASA-TLX, KSS)
│
├── lib/                          # Utilities and configuration
│   ├── constants.ts             # Study config, storage keys, scales
│   ├── utils.ts                 # Helper functions (SDT, timing)
│   ├── imageData.ts             # Image metadata & AI predictions
│   ├── supabase.ts              # Database client
│   └── logger.ts                # Logging utility
│
├── types/
│   └── index.ts                 # TypeScript interfaces
│
├── public/
│   └── images/                  # Study images (90 JPEGs)
│       ├── Cr_001.jpg ... Cr_008.jpg
│       ├── In_001.jpg ... In_008.jpg
│       ├── Pa_001.jpg ... Pa_008.jpg
│       ├── PS_001.jpg ... PS_007.jpg
│       ├── RS_001.jpg ... RS_007.jpg
│       ├── Sc_001.jpg ... Sc_007.jpg
│       └── none_001.jpg ... none_045.jpg
│
├── supabase/
│   └── schema.sql               # Database table definitions
│
├── scripts/
│   ├── crop_images.py           # Remove labels from images
│   └── verify.sh                # Pre-deployment verification
│
├── .env.example                 # Environment variable template
├── .gitignore                   # Git ignore rules
├── package.json                 # NPM dependencies
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
├── next.config.js               # Next.js configuration
└── README.md                    # This file
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier works)
- Vercel account (free tier works)
- Git installed

### 1. Clone or Download

```bash
# If from GitHub
git clone https://github.com/your-username/vigilance-webapp.git
cd vigilance-webapp

# Or extract from zip
unzip vigilance-webapp.zip
cd vigilance-webapp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# Supabase (get from Supabase Dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Admin page password
ADMIN_PASSWORD=your-secure-password
```

### 4. Prepare Images

If using placeholder images, crop the labels:

```bash
python3 scripts/crop_images.py
```

Verify 90 images exist:

```bash
ls public/images/*.jpg | wc -l
# Should output: 90
```

---

## Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for provisioning (~2 minutes)

### 2. Run Schema SQL

1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `supabase/schema.sql`
3. Paste and click "Run"

### 3. Get API Keys

1. Go to Settings > API
2. Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy "anon/public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Database Schema

```sql
CREATE TABLE participants (
  id BIGSERIAL PRIMARY KEY,
  participant_id TEXT UNIQUE NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('AI_ASSISTED', 'UNASSISTED')),
  demographics JSONB,
  pre_kss INTEGER,
  post_kss INTEGER,
  nasa_tlx JSONB,
  ai_trust JSONB,
  trials JSONB,
  consent_timestamp TIMESTAMPTZ,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Running Locally

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Type Checking

```bash
npx tsc --noEmit
```

### Production Build

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

---

## Deployment (Vercel)

### Option A: GitHub Integration (Recommended)

1. Push code to GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repo
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_PASSWORD`
6. Click "Deploy"

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add ADMIN_PASSWORD

# Deploy to production
vercel --prod
```

### Post-Deployment

1. Test all routes on production URL
2. Enable Analytics in Vercel Dashboard
3. Enable Speed Insights in Vercel Dashboard
4. Share study URL with participants

---

## User Flow

```
┌─────────────┐
│   Landing   │  "Begin Study" button
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Consent   │  Scroll to read, checkbox, agree
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Demographics │  Age, gender, education, vision, experience
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Training   │  Intro → Defect Examples (6) → Practice (10)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Pre-KSS    │  Sleepiness rating (1-9)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Task     │  90 images across 3 blocks
│             │  Block 1 (1-30) → Break → Block 2 (31-60) → Break → Block 3 (61-90)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Post-KSS   │  Sleepiness rating (1-9)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Questionnaire│  NASA-TLX (6 subscales) + AI Trust (5 items, AI condition only)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Debrief   │  Study explanation, performance summary, submit data
└─────────────┘
```

---

## Component Documentation

### ImageDisplay

Displays study images with optional AI overlay.

```typescript
interface ImageDisplayProps {
  image: ImageData;           // Image metadata
  aiPrediction?: AIPrediction; // AI prediction data
  showAI: boolean;            // Whether to show AI overlay
  onLoad?: () => void;        // Callback when image loads
}
```

### ResponseButtons

Defect/No Defect response buttons with keyboard shortcuts.

```typescript
interface ResponseButtonsProps {
  onResponse: (isDefect: boolean) => void;
  disabled?: boolean;
}
```

**Keyboard Shortcuts:**
- `D` or `←` = Defect
- `N` or `→` = No Defect

### AIOverlay

Visualizes AI predictions with scanning animation and bounding box.

```typescript
interface AIOverlayProps {
  prediction: AIPrediction;
  imageSize?: number;
  originalSize?: number;
}
```

Features:
- Scanning animation on load
- Pulsing bounding box (defect predictions only)
- Confidence badge (High/Medium/Low)
- "Look here" indicator
- Reminder text

### Timer

Displays elapsed time during task.

```typescript
interface TimerProps {
  startTime: number | null;  // Date.now() epoch milliseconds
  isRunning?: boolean;
  className?: string;
}
```

### LikertScale

Generic rating scale component used for NASA-TLX and KSS.

```typescript
interface LikertScaleProps {
  min: number;
  max: number;
  value: number | null;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
}
```

---

## API Documentation

### POST /api/submit

Submit participant study data.

**Request Body:**

```typescript
{
  participantId: string;
  condition: 'AI_ASSISTED' | 'UNASSISTED';
  demographics: {
    age: number;
    gender: string;
    education: string;
    visionCorrection: string;
    colorVisionNormal: boolean;
    inspectionExperience: string;
    aiExperience: string;
  };
  trials: Trial[];
  preKSS: number;
  postKSS: number;
  nasaTLX: {
    mentalDemand: number;
    physicalDemand: number;
    temporalDemand: number;
    performance: number;
    effort: number;
    frustration: number;
  };
  aiTrust?: {
    reliability: number;
    trust: number;
    reliance: number;
    confidence: number;
    helpfulness: number;
  };
  consentTimestamp: string;
}
```

**Response:**

```typescript
{
  success: boolean;
  participantId: string;
  storage: 'supabase' | 'local';
  message: string;
}
```

---

## Data Collection

### Trial Data Structure

Each of the 90 trials records:

```typescript
interface Trial {
  trialNumber: number;        // 1-90
  imageId: string;            // e.g., "Cr_001"
  defectType: DefectType;     // Cr, In, Pa, PS, RS, Sc, none
  participantResponse: boolean; // true = defect, false = no defect
  responseType: ResponseType;  // HIT, MISS, FA, CR
  responseTime: number;        // milliseconds
  timestamp: string;           // ISO timestamp
  timeBlock: 1 | 2 | 3;       // Which block
  aiPrediction?: AIPrediction; // AI data (AI condition only)
}
```

### Signal Detection Theory Metrics

Calculated per time block and overall:

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| Hit Rate | Hits / (Hits + Misses) | Proportion of defects correctly identified |
| FA Rate | FA / (FA + CR) | Proportion of clean incorrectly called defect |
| d' | z(HR) - z(FAR) | Sensitivity (ability to discriminate) |
| c | -0.5 × (z(HR) + z(FAR)) | Criterion (response bias) |

### Data Export

From the admin page (`/admin`):
1. View all participants
2. Export as CSV
3. View individual trial data

---

## Troubleshooting

### CSS Not Loading / Broken Styling

1. Verify `globals.css` has Tailwind directives at top:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

2. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

### Images Not Displaying

1. Check images exist:
   ```bash
   ls public/images/ | wc -l
   ```

2. Verify naming convention: `Cr_001.jpg`, `none_001.jpg`

3. Check browser console for 404 errors

### Supabase Connection Failed

1. Verify environment variables are set
2. Check Supabase project is active
3. Verify Row Level Security policies allow inserts

### Build Errors

1. Run TypeScript check:
   ```bash
   npx tsc --noEmit
   ```

2. Check for missing imports or type errors

3. Verify all dependencies installed:
   ```bash
   rm -rf node_modules
   npm install
   ```

### Timer Showing Wrong Time

Ensure `startTime` uses `Date.now()` (epoch milliseconds), not `performance.now()`.

---

## Research Ethics & Privacy

### Northeastern University Compliance

This study follows Northeastern University's policies for classroom research:

- **Policy 504:** Classroom Research Involving Human Subjects
- No IRB submission required for educational purposes
- Minimal risk, adult participants only

### Data Privacy Measures

| Measure | Implementation |
|---------|----------------|
| No PII collected | No names, emails, student IDs |
| Anonymous IDs | Random UUID assigned to each participant |
| Secure storage | Supabase with Row Level Security |
| Encrypted transit | HTTPS only |
| No IP logging | Disabled in Supabase |
| Limited retention | Data deleted after course ends |

### Informed Consent

Participants must:
1. Read full information sheet (scroll-gated)
2. Confirm they are 18+ years old
3. Check consent checkbox
4. Click "I Agree" to proceed

### Data Access

Only the following have data access:
- Research team members
- Course instructor

---

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Add JSDoc comments to functions

### Git Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes
3. Test locally: `npm run build`
4. Commit: `git commit -m "Add my feature"`
5. Push: `git push origin feature/my-feature`
6. Create pull request

### Adding New Defect Types

1. Add to `DEFECT_TYPES` in `lib/constants.ts`
2. Add to `DefectType` union in `types/index.ts`
3. Update `generateImageData()` in `lib/imageData.ts`
4. Add images to `public/images/`

---

## License

This project is for educational purposes as part of IE 6500 Human Performance at Northeastern University.

---

## Contact

For questions about this study, contact the research team through the course instructor.

**Course:** IE 6500 Human Performance  
**Institution:** Northeastern University  
**Project:** Vigilance Decrement in Visual Inspection

---

*Last updated: February 2026*
