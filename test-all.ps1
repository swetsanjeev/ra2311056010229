# Test Script for Campus Hiring Evaluation
# Sets up environment and runs all services

$token = "YOUR_AUTH_TOKEN_HERE"
$topN = 10

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Campus Hiring Evaluation - Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Vehicle Maintenance Scheduler
Write-Host "[1/2] Testing Vehicle Maintenance Scheduler..." -ForegroundColor Yellow
Write-Host "-----------------------------------------------" -ForegroundColor Yellow
cd vehicle_maintenance_scheduler
$env:AUTH_TOKEN = $token
npm run dev
$schedulerExit = $LASTEXITCODE

Write-Host ""
Write-Host ""

# Test 2: Priority Inbox
Write-Host "[2/2] Testing Priority Inbox..." -ForegroundColor Yellow
Write-Host "-----------------------------------------------" -ForegroundColor Yellow
cd ../notification_app_be
$env:AUTH_TOKEN = $token
$env:TOP_N = $topN
npm run priority-inbox
$inboxExit = $LASTEXITCODE

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Results" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($schedulerExit -eq 0) {
    Write-Host "[PASS] Vehicle Maintenance Scheduler: SUCCESS" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Vehicle Maintenance Scheduler: FAILED (Exit Code: $schedulerExit)" -ForegroundColor Red
}

if ($inboxExit -eq 0) {
    Write-Host "[PASS] Priority Inbox: SUCCESS" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Priority Inbox: FAILED (Exit Code: $inboxExit)" -ForegroundColor Red
}

Write-Host ""
