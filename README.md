# Vigilance Decrement Study Web Application

A Next.js 14 web application for conducting a vigilance decrement research study examining the effects of AI assistance on visual inspection performance over time.

## 🎯 Study Overview

This application implements a 2×3 mixed factorial design:
- **Between-subjects factor**: Condition (AI-Assisted vs. Unassisted)
- **Within-subjects factor**: Time Block (Block 1, Block 2, Block 3)

### Key Features
- Informed consent collection
- Demographic questionnaire
- Training phase with defect examples and practice trials
- 30-minute inspection task (180 images)
- Karolinska Sleepiness Scale (KSS) pre/post measurement
- NASA Task Load Index (NASA-TLX) workload assessment
- AI Trust questionnaire (for AI-Assisted condition)
- Admin dashboard for data monitoring

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 3.4
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## 📁 Project Structure

```
vigilance-webapp/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Landing page
│   ├── consent/             # Informed consent
│   ├── demographics/        # Participant info form
│   ├── training/            # Defect training & practice
│   ├── task/                # Main inspection task
│   ├── questionnaire/       # NASA-TLX & AI Trust
│   ├── debrief/             # Study completion & data submit
│   ├── admin/               # Admin dashboard
│   └── api/                 # API routes
│       ├── participants/    # Participant CRUD
│       └── trials/          # Trial data CRUD
├── components/              # React components
│   ├── ImageDisplay.tsx     # Image viewer with AI overlay
│   ├── ResponseButtons.tsx  # Defect/No Defect buttons
│   ├── ProgressBar.tsx      # Trial progress indicator
│   ├── Timer.tsx            # Session & block timers
│   └── LikertScale.tsx      # KSS, NASA-TLX, AI Trust scales
├── lib/                     # Utilities & configuration
│   ├── constants.ts         # Study configuration
│   ├── utils.ts             # Helper functions & SDT calculations
│   ├── supabase.ts          # Database client
│   └── imageData.ts         # Image & AI prediction generation
├── types/                   # TypeScript definitions
├── public/images/           # Static image assets
└── supabase-schema.sql      # Database schema
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)

### 1. Clone & Install

```bash
git clone <repository-url>
cd vigilance-webapp
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase-schema.sql`
3. Go to Settings > API and copy your project URL and anon key

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Add Images

Place your NEU surface defect images in `/public/images/`:
```
public/images/
├── Cr_001.jpg through Cr_015.jpg  # Crazing
├── In_001.jpg through In_015.jpg  # Inclusion
├── Pa_001.jpg through Pa_015.jpg  # Patches
├── PS_001.jpg through PS_015.jpg  # Pitted Surface
├── RS_001.jpg through RS_015.jpg  # Rolled-in Scale
├── Sc_001.jpg through Sc_015.jpg  # Scratches
└── none_001.jpg through none_090.jpg  # Non-defective
```

Images should be 200×200 pixels, grayscale JPEG format.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🌐 Deployment to Vercel

### Option A: Deploy from GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" and import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click "Deploy"

### Option B: Deploy with Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

Add environment variables in the Vercel dashboard after deployment.

## 📊 Data Collection

### Participant Data Structure
```typescript
{
  participantId: string;
  condition: 'AI_ASSISTED' | 'UNASSISTED';
  demographics: Demographics;
  preKSS: number;
  postKSS: number;
  nasaTLX: NasaTLXScores;
  aiTrust?: AITrustScores;  // AI-Assisted only
  trialResults: TrialResultsByBlock;
}
```

### Trial Data Structure
```typescript
{
  trialNumber: number;       // 1-180
  imageId: string;
  defectType: DefectType;
  participantResponse: boolean;
  responseType: 'HIT' | 'MISS' | 'FA' | 'CR';
  responseTime: number;      // milliseconds
  timeBlock: 1 | 2 | 3;
  aiPrediction?: AIPrediction;  // AI-Assisted only
}
```

### Accessing Data

1. **Admin Dashboard**: Go to `/admin` (password: `ie6500admin`)
2. **Direct Database**: Access Supabase Table Editor
3. **Export**: Use the "Export CSV" button in admin dashboard

## 🔧 Configuration

### Study Parameters (`lib/constants.ts`)

```typescript
STUDY_CONFIG = {
  totalImages: 180,
  imagesPerBlock: 60,
  defectPrevalence: 0.5,
  aiAccuracy: 0.85,
  aiTPR: 0.88,
  aiTNR: 0.82,
  trainingImages: 10,
}
```

### AI Calibration

The AI is calibrated to:
- **88% True Positive Rate** (correctly identifies 88% of defects)
- **82% True Negative Rate** (correctly identifies 82% of non-defects)
- **Overall ~85% accuracy** at 50% prevalence

## 📈 Analysis

### Signal Detection Theory Metrics

The app calculates per-block:
- **d' (d-prime)**: Sensitivity/discriminability
- **c (criterion)**: Response bias
- **Hit Rate**: P(response=defect | actual=defect)
- **False Alarm Rate**: P(response=defect | actual=non-defect)

### Expected Outputs

1. **Primary DVs**: d', hit rate, FA rate, RT by Condition × Block
2. **Secondary DVs**: KSS change, NASA-TLX subscales
3. **AI-Assisted only**: AI trust, AI reliance patterns

## 🔒 Security Notes

- Supabase Row Level Security (RLS) is enabled
- No personally identifiable information is collected
- Participant IDs are randomly generated UUIDs
- Admin password should be changed for production use

## 📝 Research Ethics

Ensure you have IRB approval before deploying for actual data collection. The consent form should be reviewed and approved by your institution's IRB.

## 🐛 Troubleshooting

### Images not loading
- Check image paths match the naming convention
- Verify images are in `/public/images/`
- Ensure JPEG format and correct dimensions

### Database connection errors
- Verify Supabase URL and key in `.env.local`
- Check Supabase project is active
- Ensure RLS policies are configured

### Build errors on Vercel
- Check all environment variables are set
- Verify Node.js version compatibility
- Check build logs for specific errors

## 📚 References

- NEU Surface Defect Database: [Northeastern University, China](http://faculty.neu.edu.cn/songkc/en/zhym/263265/list/index.htm)
- NASA-TLX: Hart & Staveland (1988)
- KSS: Åkerstedt & Gillberg (1990)
- Signal Detection Theory: Green & Swets (1966)

## 📄 License

This project is for educational and research purposes as part of IE 6500 Human Performance at Northeastern University.

---

**IE 6500 Human Performance | Spring 2026 | Northeastern University**
