#!/bin/bash
echo "=== Vigilance Webapp Verification ==="

echo ""
echo "1. Checking files..."
[ -f "app/page.tsx" ] && echo "✓ Landing page" || echo "✗ Missing landing page"
[ -f "app/consent/page.tsx" ] && echo "✓ Consent page" || echo "✗ Missing consent"
[ -f "app/demographics/page.tsx" ] && echo "✓ Demographics page" || echo "✗ Missing demographics"
[ -f "app/training/page.tsx" ] && echo "✓ Training page" || echo "✗ Missing training"
[ -f "app/task/page.tsx" ] && echo "✓ Task page" || echo "✗ Missing task"
[ -f "app/questionnaire/page.tsx" ] && echo "✓ Questionnaire page" || echo "✗ Missing questionnaire"
[ -f "app/debrief/page.tsx" ] && echo "✓ Debrief page" || echo "✗ Missing debrief"
[ -f "app/api/submit/route.ts" ] && echo "✓ Submit API" || echo "✗ Missing submit API"

echo ""
echo "2. Checking images..."
IMG_COUNT=$(ls -1 public/images/*.jpg 2>/dev/null | wc -l)
echo "Found $IMG_COUNT images (expected: 90)"

echo ""
echo "3. Checking dependencies..."
[ -f "package-lock.json" ] && echo "✓ package-lock.json exists" || echo "✗ Missing package-lock.json"

echo ""
echo "4. Running TypeScript check..."
npx tsc --noEmit && echo "✓ TypeScript OK" || echo "✗ TypeScript errors"

echo ""
echo "5. Running build..."
npm run build && echo "✓ Build OK" || echo "✗ Build failed"

echo ""
echo "=== Verification Complete ==="
