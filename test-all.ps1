# Test Script for Campus Hiring Evaluation
# Sets up environment and runs all services

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzczg3MjhAc3JtaXN0LmVkdS5pbiIsImV4cCI6MTc3NzcwMDIwMCwiaWF0IjoxNzc3Njk5MzAwLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiY2RhYWIwM2ItYzkzNS00YjA4LTlhMjAtNWFmNGY3M2JiNDZiIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoic3dldCBzYW5qZWV2Iiwic3ViIjoiNzAwZTAzZDgtYjhjYy00NjFiLWE4NGYtZjhkMDkxMmUyNWUyIn0sImVtYWlsIjoic3M4NzI4QHNybWlzdC5lZHUuaW4iLCJuYW1lIjoic3dldCBzYW5qZWV2Iiwicm9sbE5vIjoicmEyMzExMDU2MDEwMjI5IiwiYWNjZXNzQ29kZSI6IlFrYnB4SCIsImNsaWVudElEIjoiNzAwZTAzZDgtYjhjYy00NjFiLWE4NGYtZjhkMDkxMmUyNWUyIiwiY2xpZW50U2VjcmV0IjoiZldxR25WUnVHRVdHQUtaYSJ9.TAz8hn2Q9f2EEhVa-RVFGMcC4dTJodrBHG3HO1ogd_8"
$topN = 10

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Campus Hiring Evaluation - Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Vehicle Maintenance Scheduler
Write-Host "[1/2] Testing Vehicle Maintenance Scheduler..." -ForegroundColor Yellow
Write-Host "-----------------------------------------------" -ForegroundColor Yellow
cd vehicle_maintence_scheduler
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
