# POWER.HORSE HackMoney 2026 - Cleanup & Rebuild Script
# Run this in PowerShell from your project directory

Write-Host "🧹 POWER.HORSE - Cleanup & Rebuild" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

# Step 1: Verify we're in the right directory
Write-Host "📍 Checking project structure..." -ForegroundColor Yellow
if (!(Test-Path "package.json")) {
    Write-Host "❌ ERROR: package.json not found!" -ForegroundColor Red
    Write-Host "   Make sure you're running this from the project root directory." -ForegroundColor Red
    exit 1
}

if (!(Test-Path "hardhat.config.js")) {
    Write-Host "❌ ERROR: hardhat.config.js not found!" -ForegroundColor Red
    Write-Host "   Make sure you downloaded and placed the new hardhat.config.js file." -ForegroundColor Red
    exit 1
}

if (!(Test-Path "contracts")) {
    Write-Host "❌ ERROR: contracts/ folder not found!" -ForegroundColor Red
    Write-Host "   Create a 'contracts' folder and move your .sol files into it." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project structure looks good!" -ForegroundColor Green
Write-Host ""

# Step 2: Check contracts folder
Write-Host "📁 Checking contracts folder..." -ForegroundColor Yellow
$solFiles = Get-ChildItem -Path "contracts" -Filter "*.sol"
if ($solFiles.Count -eq 0) {
    Write-Host "❌ ERROR: No .sol files found in contracts/ folder!" -ForegroundColor Red
    Write-Host "   Move your Solidity files into the contracts/ folder." -ForegroundColor Red
    exit 1
}

Write-Host "   Found $($solFiles.Count) contract(s):" -ForegroundColor Green
foreach ($file in $solFiles) {
    Write-Host "   - $($file.Name)" -ForegroundColor Green
}
Write-Host ""

# Step 3: Check for stray .sol files in root
$rootSolFiles = Get-ChildItem -Path "." -Filter "*.sol" -File
if ($rootSolFiles.Count -gt 0) {
    Write-Host "⚠️  WARNING: Found .sol files in root directory!" -ForegroundColor Yellow
    foreach ($file in $rootSolFiles) {
        Write-Host "   - $($file.Name)" -ForegroundColor Yellow
    }
    Write-Host "   These should be in the contracts/ folder." -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "   Delete these files? (y/n)"
    if ($response -eq "y") {
        foreach ($file in $rootSolFiles) {
            Remove-Item $file.FullName
            Write-Host "   Deleted: $($file.Name)" -ForegroundColor Green
        }
    }
    Write-Host ""
}

# Step 4: Clean cache and build files
Write-Host "🧹 Cleaning cache and build files..." -ForegroundColor Yellow
$filesToDelete = @("cache", "artifacts", "node_modules", "package-lock.json")
foreach ($item in $filesToDelete) {
    if (Test-Path $item) {
        Write-Host "   Removing $item..." -ForegroundColor Gray
        Remove-Item -Recurse -Force $item -ErrorAction SilentlyContinue
        Write-Host "   ✅ Removed $item" -ForegroundColor Green
    }
}
Write-Host ""

# Step 5: Clear npm cache
Write-Host "🗑️  Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force 2>$null
Write-Host "✅ npm cache cleared" -ForegroundColor Green
Write-Host ""

# Step 6: Reinstall dependencies
Write-Host "📦 Reinstalling dependencies..." -ForegroundColor Yellow
Write-Host "   This may take a minute..." -ForegroundColor Gray
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 7: Try compiling
Write-Host "🔨 Testing compilation..." -ForegroundColor Yellow
npx hardhat compile
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Compilation failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above and:" -ForegroundColor Yellow
    Write-Host "1. Verify all .sol files are in contracts/ folder" -ForegroundColor Yellow
    Write-Host "2. Check hardhat.config.js has: sources: './contracts'" -ForegroundColor Yellow
    Write-Host "3. Make sure .env has your RPC URL and private key" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Compilation successful!" -ForegroundColor Green
Write-Host ""

# Step 8: Ready to deploy
Write-Host "=" * 60
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Your project is ready to deploy!" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  BEFORE DEPLOYING, verify your .env file has:" -ForegroundColor Yellow
Write-Host "   - SEPOLIA_RPC_URL (from Infura/Alchemy)" -ForegroundColor Yellow
Write-Host "   - DEPLOYER_PRIVATE_KEY (your deployment wallet)" -ForegroundColor Yellow
Write-Host "   - ETHERSCAN_API_KEY (optional, for verification)" -ForegroundColor Yellow
Write-Host ""
Write-Host "To deploy, run:" -ForegroundColor Cyan
Write-Host "   npm run deploy" -ForegroundColor White
Write-Host ""
