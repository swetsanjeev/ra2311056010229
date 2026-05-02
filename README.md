# Campus Hiring Evaluation

This repository contains solutions for the Affordmed Campus Backend Hiring Evaluation.

## Repository Structure

```
├── logging_middleware/              # Pre-test: Reusable logging package
│   ├── logger.ts                    # Core Log() function + convenience wrappers
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── vehicle_maintence_scheduler/     # Backend Q1: Optimal maintenance scheduling
│   ├── scheduler.ts                 # 0/1 Knapsack DP solution
│   ├── package.json
│   └── README.md
│
├── notification_system_design.md    # Backend Q2: All 6 stages (design + analysis)
│
├── notification_app_be/             # Backend Q2 Stage 6: Priority inbox code
│   ├── priority_inbox.ts            # Min-heap based top-N implementation
│   └── package.json
│
└── notification_app_fe/             # Frontend placeholder
```

## Setup

Each subfolder has its own `package.json`. Install dependencies per folder:

```bash
cd logging_middleware && npm install
cd vehicle_maintence_scheduler && npm install
cd notification_app_be && npm install
```

## Running

```bash
# Set the authentication token
$env:AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzczg3MjhAc3JtaXN0LmVkdS5pbiIsImV4cCI6MTc3NzcwMDIwMCwiaWF0IjoxNzc3Njk5MzAwLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiY2RhYWIwM2ItYzkzNS00YjA4LTlhMjAtNWFmNGY3M2JiNDZiIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoic3dldCBzYW5qZWV2Iiwic3ViIjoiNzAwZTAzZDgtYjhjYy00NjFiLWE4NGYtZjhkMDkxMmUyNWUyIn0sImVtYWlsIjoic3M4NzI4QHNybWlzdC5lZHUuaW4iLCJuYW1lIjoic3dldCBzYW5qZWV2Iiwicm9sbE5vIjoicmEyMzExMDU2MDEwMjI5IiwiYWNjZXNzQ29kZSI6IlFrYnB4SCIsImNsaWVudElEIjoiNzAwZTAzZDgtYjhjYy00NjFiLWE4NGYtZjhkMDkxMmUyNWUyIiwiY2xpZW50U2VjcmV0IjoiZldxR25WUnVHRVdHQUtaYSJ9.TAz8hn2Q9f2EEhVa-RVFGMcC4dTJodrBHG3HO1ogd_8"

# Vehicle Maintenance Scheduler
cd vehicle_maintence_scheduler
ts-node scheduler.ts

# Priority Inbox (Stage 6)
cd notification_app_be
$env:TOP_N = "10"
ts-node priority_inbox.ts
```
