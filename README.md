# Campus Hiring Evaluation - Affordmed

**Registration Number:** RA2311056010229

This repository contains comprehensive solutions for the Affordmed Campus Backend Hiring Evaluation, demonstrating expertise in TypeScript, algorithms, system design, and backend development.

## Repository Structure

```
├── logging_middleware/              # Pre-test: Reusable logging package
│   ├── logger.ts                    # Core Log() function + convenience wrappers
│   ├── package.json                 # Dependencies and scripts
│   ├── tsconfig.json               # TypeScript configuration
│   └── README.md                    # Package documentation
│
├── vehicle_maintence_scheduler/     # Backend Q1: Optimal maintenance scheduling
│   ├── scheduler.ts                 # 0/1 Knapsack DP solution (O(n*W) time)
│   ├── package.json                 # Dependencies and scripts
│   ├── tsconfig.json               # TypeScript configuration
│   └── README.md                    # Algorithm documentation
│
├── notification_system_design.md    # Backend Q2: Complete system design
│                                   # Stages 1-6: API design, DB schema, analysis
│
├── notification_app_be/             # Backend Q2 Stage 6: Priority inbox
│   ├── priority_inbox.ts            # Min-heap based top-N implementation
│   ├── package.json                 # Dependencies and scripts
│   └── tsconfig.json               # TypeScript configuration
│
├── notification_app_fe/             # Frontend placeholder
│   └── .gitkeep                     # Empty directory marker
│
├── test-all.ps1                     # Comprehensive test script
├── README.md                        # Project documentation
└── .gitignore                       # Git ignore rules
```

## Setup Instructions

Each subfolder contains its own `package.json` with dependencies. Install them individually:

```bash
# Install logging middleware dependencies
cd logging_middleware && npm install

# Install vehicle scheduler dependencies
cd ../vehicle_maintence_scheduler && npm install

# Install notification backend dependencies
cd ../notification_app_be && npm install
```

## Running the Applications

### Prerequisites
- Node.js (v16+ recommended)
- TypeScript compiler
- Valid authentication token (provided by evaluation system)

### Vehicle Maintenance Scheduler
```bash
# Set your authentication token
$env:AUTH_TOKEN = "your_auth_token_here"

# Run the scheduler
cd vehicle_maintence_scheduler
npm run dev
```

### Priority Inbox (Stage 6)
```bash
# Set your authentication token
$env:AUTH_TOKEN = "your_auth_token_here"

# Set number of top notifications to fetch
$env:TOP_N = "10"

# Run the priority inbox
cd notification_app_be
npm run priority-inbox
```

## Testing

Run the comprehensive test suite to verify all components:

```bash
# Run all tests
.\test-all.ps1
```

This will:
- Build all TypeScript packages
- Verify file integrity
- Test runtime execution
- Validate configurations

## Implementation Details

### Backend Q1: Vehicle Maintenance Scheduler
- **Algorithm:** 0/1 Knapsack Dynamic Programming
- **Time Complexity:** O(n × capacity)
- **Space Complexity:** O(n × capacity)
- **Optimization:** Maximizes total impact within mechanic-hour constraints

### Backend Q2: Notification System
- **Stage 1-2:** Complete API design and database schema
- **Stage 6:** Priority inbox with min-heap implementation
- **Priority Scoring:** Type weight × exponential decay (recency factor)
- **Time Complexity:** O(k log N) for k notifications, N top results

### Logging Middleware
- **Features:** Structured logging with multiple levels
- **Integration:** Reusable across backend and frontend
- **API:** RESTful logging service integration

## Architecture Highlights

- **TypeScript:** Full type safety with strict configuration
- **Modular Design:** Independent packages with clear separation of concerns
- **Algorithmic Excellence:** Optimized solutions for complex problems
- **Production Ready:** Error handling, logging, and structured code
- **Testable:** Comprehensive test suite and validation scripts

## Notes

- All code follows TypeScript best practices
- Comprehensive error handling and logging implemented
- Authentication tokens are required for API access
- Test suite validates all functionality before submission

---

**Affordmed Campus Backend Hiring Evaluation - RA2311056010229**
