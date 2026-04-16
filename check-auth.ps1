# Diagnostic script for AmarBhaiya.in authentication issues (Windows PowerShell)
# Run: .\check-auth.ps1

Write-Host "🔍 AmarBhaiya.in Authentication Diagnostic" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: .env.local exists
Write-Host "1️⃣  Checking .env.local..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✓ .env.local exists" -ForegroundColor Green
} else {
    Write-Host "✗ .env.local NOT FOUND" -ForegroundColor Red
    Write-Host "  Create it with: copy .env.example .env.local" -ForegroundColor Gray
}
Write-Host ""

# Check 2: Environment variables
Write-Host "2️⃣  Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    
    if ($envContent -match "NEXT_PUBLIC_APPWRITE_ENDPOINT=(.+)") {
        $endpoint = $matches[1].Trim()
        Write-Host "✓ NEXT_PUBLIC_APPWRITE_ENDPOINT = $endpoint" -ForegroundColor Green
    } else {
        Write-Host "✗ NEXT_PUBLIC_APPWRITE_ENDPOINT not set" -ForegroundColor Red
    }
    
    if ($envContent -match "NEXT_PUBLIC_APPWRITE_PROJECT_ID=(.+)") {
        $projectId = $matches[1].Trim()
        Write-Host "✓ NEXT_PUBLIC_APPWRITE_PROJECT_ID = $projectId" -ForegroundColor Green
    } else {
        Write-Host "✗ NEXT_PUBLIC_APPWRITE_PROJECT_ID not set" -ForegroundColor Red
    }
    
    if ($envContent -match "APPWRITE_API_KEY=(.+)") {
        Write-Host "✓ APPWRITE_API_KEY is set" -ForegroundColor Green
    } else {
        Write-Host "✗ APPWRITE_API_KEY not set" -ForegroundColor Red
    }
}
Write-Host ""

# Check 3: Appwrite connectivity
Write-Host "3️⃣  Checking Appwrite connectivity..." -ForegroundColor Yellow
if ($envContent -match "NEXT_PUBLIC_APPWRITE_ENDPOINT=(.+)") {
    $endpoint = $matches[1].Trim()
    try {
        $response = Invoke-WebRequest -Uri "$endpoint/health" -Method GET -ErrorAction Stop
        Write-Host "✓ Appwrite is reachable ($endpoint)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Appwrite returned error: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "  Check if Appwrite is running: docker compose ps" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠ Skipping (ENDPOINT not set)" -ForegroundColor Yellow
}
Write-Host ""

# Check 4: Node version
Write-Host "4️⃣  Checking Node.js version..." -ForegroundColor Yellow
try {
    $nodeVersion = & node --version
    Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found" -ForegroundColor Red
}
Write-Host ""

# Check 5: npm dependencies
Write-Host "5️⃣  Checking npm dependencies..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    if (Test-Path "node_modules") {
        Write-Host "✓ node_modules exists" -ForegroundColor Green
        
        # Check specific packages
        $packageJson = Get-Content "package.json" -Raw
        if ($packageJson -match '"node-appwrite"') {
            Write-Host "✓ node-appwrite is in dependencies" -ForegroundColor Green
        } else {
            Write-Host "✗ node-appwrite not found" -ForegroundColor Red
        }
        
        if ($packageJson -match '"next"') {
            Write-Host "✓ next is in dependencies" -ForegroundColor Green
        } else {
            Write-Host "✗ next not found" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ node_modules not found" -ForegroundColor Red
        Write-Host "  Run: npm install" -ForegroundColor Gray
    }
}
Write-Host ""

# Check 6: Port availability
Write-Host "6️⃣  Checking if port 3000 is available..." -ForegroundColor Yellow
$port = (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue)
if ($null -eq $port) {
    Write-Host "✓ Port 3000 is available" -ForegroundColor Green
} else {
    Write-Host "⚠ Port 3000 is in use" -ForegroundColor Yellow
    Write-Host "  Process: $($port.OwningProcess)" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "✅ Diagnostic complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify all ✓ checks above" -ForegroundColor White
Write-Host "2. Fix any ✗ issues" -ForegroundColor White
Write-Host "3. Run: npm run dev" -ForegroundColor White
Write-Host "4. Visit: http://localhost:3000/login" -ForegroundColor White
Write-Host ""
Write-Host "📖 For more details, read: AUTH_SETUP_GUIDE.md" -ForegroundColor Gray
