/**
 * Vehicle Maintenance Scheduler Microservice
 *
 * Problem: Given a list of vehicles with Duration (hours) and Impact (score),
 * and a daily mechanic-hour budget per depot, find the optimal subset of vehicles
 * to service that maximises total operational impact without exceeding the budget.
 *
 * This is the 0/1 Knapsack problem solved with dynamic programming in O(n*W) time.
 */

import { configureLogger, Log } from "../logging_middleware/logger";

const BASE_URL = "http://20.207.122.201/evaluation-service";

interface Depot {
  ID: number;
  MechanicHours: number;
}

interface Vehicle {
  TaskID: string;
  Duration: number;
  Impact: number;
}

interface ScheduleResult {
  depotID: number;
  mechanicHoursBudget: number;
  selectedTasks: Vehicle[];
  totalImpact: number;
  totalDuration: number;
  unusedHours: number;
}

interface DepotsResponse {
  depots: Depot[];
}

interface VehiclesResponse {
  vehicles: Vehicle[];
}

/**
 * 0/1 Knapsack using bottom-up dynamic programming.
 * Time complexity: O(n * capacity)
 * Space complexity: O(n * capacity) — could be optimised to O(capacity) but
 * we keep the full table to reconstruct the selected items.
 *
 * @param vehicles  - list of vehicles with Duration and Impact
 * @param capacity  - total mechanic-hours available
 */
function knapsack(vehicles: Vehicle[], capacity: number): Vehicle[] {
  const n = vehicles.length;

  // dp[i][w] = max impact using first i vehicles with w hours available
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(capacity + 1).fill(0)
  );

  for (let i = 1; i <= n; i++) {
    const { Duration, Impact } = vehicles[i - 1];
    for (let w = 0; w <= capacity; w++) {
      // Option 1: skip vehicle i
      dp[i][w] = dp[i - 1][w];
      // Option 2: include vehicle i (if it fits)
      if (Duration <= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - Duration] + Impact);
      }
    }
  }

  // Backtrack to find which vehicles were selected
  const selected: Vehicle[] = [];
  let w = capacity;
  for (let i = n; i >= 1; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected.push(vehicles[i - 1]);
      w -= vehicles[i - 1].Duration;
    }
  }

  return selected;
}

async function fetchDepots(token: string): Promise<Depot[]> {
  await Log(
    "backend",
    "info",
    "service",
    "Fetching depots from evaluation service"
  );

  const response = await fetch(`${BASE_URL}/depots`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    await Log(
      "backend",
      "error",
      "service",
      `Failed to fetch depots - status: ${response.status}`
    );
    throw new Error(`Depots fetch failed: ${response.status}`);
  }

  const data = (await response.json()) as DepotsResponse;
  await Log(
    "backend",
    "info",
    "service",
    `Fetched ${data.depots.length} depots successfully`
  );
  return data.depots;
}

async function fetchVehicles(token: string): Promise<Vehicle[]> {
  await Log(
    "backend",
    "info",
    "service",
    "Fetching vehicles from evaluation service"
  );

  const response = await fetch(`${BASE_URL}/vehicles`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    await Log(
      "backend",
      "error",
      "service",
      `Failed to fetch vehicles - status: ${response.status}`
    );
    throw new Error(`Vehicles fetch failed: ${response.status}`);
  }

  const data = (await response.json()) as VehiclesResponse;
  await Log(
    "backend",
    "info",
    "service",
    `Fetched ${data.vehicles.length} vehicles successfully`
  );
  return data.vehicles;
}

/**
 * For each depot, run the knapsack algorithm with its mechanic-hour budget
 * against the full vehicle list.
 */
async function scheduleMaintenanceForDepot(
  depot: Depot,
  vehicles: Vehicle[]
): Promise<ScheduleResult> {
  await Log(
    "backend",
    "debug",
    "domain",
    `Running knapsack for depot ${depot.ID} - budget: ${depot.MechanicHours}h, vehicles: ${vehicles.length}`
  );

  const selected = knapsack(vehicles, depot.MechanicHours);

  const totalImpact = selected.reduce((sum, v) => sum + v.Impact, 0);
  const totalDuration = selected.reduce((sum, v) => sum + v.Duration, 0);
  const unusedHours = depot.MechanicHours - totalDuration;

  await Log(
    "backend",
    "info",
    "domain",
    `Depot ${depot.ID} schedule complete - selected ${selected.length} tasks, impact: ${totalImpact}, duration: ${totalDuration}h, unused: ${unusedHours}h`
  );

  return {
    depotID: depot.ID,
    mechanicHoursBudget: depot.MechanicHours,
    selectedTasks: selected,
    totalImpact,
    totalDuration,
    unusedHours,
  };
}

async function main() {
  // Read token from environment variable or argument
  const token = process.env.AUTH_TOKEN || process.argv[2];

  if (!token) {
    console.error(
      "Usage: AUTH_TOKEN=<token> ts-node scheduler.ts\n   or: ts-node scheduler.ts <token>"
    );
    process.exit(1);
  }

  configureLogger({ authToken: token });

  await Log(
    "backend",
    "info",
    "service",
    "Vehicle Maintenance Scheduler starting up"
  );

  try {
    const [depots, vehicles] = await Promise.all([
      fetchDepots(token),
      fetchVehicles(token),
    ]);

    await Log(
      "backend",
      "info",
      "service",
      `Processing ${depots.length} depots with ${vehicles.length} total vehicles`
    );

    const results: ScheduleResult[] = [];

    for (const depot of depots) {
      const result = await scheduleMaintenanceForDepot(depot, vehicles);
      results.push(result);
    }

    // Print results
    console.log("\n========== Vehicle Maintenance Schedule ==========\n");
    for (const r of results) {
      console.log(`Depot ${r.depotID}`);
      console.log(`  Budget:         ${r.mechanicHoursBudget} mechanic-hours`);
      console.log(`  Tasks Selected: ${r.selectedTasks.length}`);
      console.log(`  Total Impact:   ${r.totalImpact}`);
      console.log(`  Total Duration: ${r.totalDuration}h`);
      console.log(`  Unused Hours:   ${r.unusedHours}h`);
      console.log(`  Tasks:`);
      for (const task of r.selectedTasks) {
        console.log(
          `    - ${task.TaskID} | Duration: ${task.Duration}h | Impact: ${task.Impact}`
        );
      }
      console.log();
    }

    await Log(
      "backend",
      "info",
      "service",
      `Scheduling complete for all ${results.length} depots`
    );
  } catch (err) {
    await Log(
      "backend",
      "fatal",
      "service",
      `Scheduler crashed: ${err instanceof Error ? err.message : String(err)}`
    );
    process.exit(1);
  }
}

main();
