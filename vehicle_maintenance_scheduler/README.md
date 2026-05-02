# Vehicle Maintenance Scheduler

Optimally schedules vehicle maintenance tasks per depot to maximise operational impact within mechanic-hour budget constraints.

## Algorithm

**0/1 Knapsack Dynamic Programming**

- Each vehicle is a knapsack item: `Duration` = weight, `Impact` = value
- Each depot has a `MechanicHours` capacity (knapsack size)
- We find the optimal subset of vehicles that maximises total impact without exceeding available hours

Time complexity: **O(n × W)** where n = number of vehicles, W = mechanic-hours budget  
Space complexity: **O(n × W)**

This is efficient enough to handle large real-world inputs (n = thousands, W = hundreds of hours).

## Running

```bash
npm install
AUTH_TOKEN=<your_bearer_token> npm run start
# or
ts-node scheduler.ts <your_bearer_token>
```

## Output

For each depot, the scheduler prints:
- Total budget
- Number of tasks selected
- Total operational impact score
- Total hours used
- Unused hours remaining
- List of selected TaskIDs

## Why 0/1 Knapsack?

Each vehicle task is either done or not (you can't do half a repair), making this a classic 0/1 knapsack problem. The DP approach guarantees an **optimal solution** unlike greedy heuristics (e.g. sorting by impact/duration ratio) which can miss the globally optimal combination.
