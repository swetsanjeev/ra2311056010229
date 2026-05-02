/**
 * Priority Inbox - Stage 6
 *
 * Fetches notifications and returns the top N most important unread ones.
 * Priority = type_weight × recency_factor (exponential decay)
 *
 * Type weights: Placement (3) > Result (2) > Event (1)
 * Recency: e^(-λ * hours_since_created), λ = 0.05
 *
 * Uses a min-heap of size N for efficient online updates as new notifications arrive.
 */

import { configureLogger, Log } from "../logging_middleware/logger";

const NOTIFICATIONS_API =
  "http://20.207.122.201/evaluation-service/notifications";

type NotificationType = "Placement" | "Result" | "Event";

interface Notification {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string;
}

interface ScoredNotification extends Notification {
  score: number;
}

interface NotificationsResponse {
  notifications: Notification[];
}

// Weight per notification type
const TYPE_WEIGHT: Record<NotificationType, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

const DECAY_LAMBDA = 0.05; // tune this to control how fast recency matters

/**
 * Compute the priority score for a notification.
 * Higher score = higher priority.
 */
function computeScore(notification: Notification): number {
  const weight = TYPE_WEIGHT[notification.Type] ?? 1;
  const createdAt = new Date(notification.Timestamp).getTime();
  const nowMs = Date.now();
  const hoursElapsed = (nowMs - createdAt) / (1000 * 60 * 60);
  const recencyFactor = Math.exp(-DECAY_LAMBDA * hoursElapsed);
  return weight * recencyFactor;
}

// ---- Min-Heap implementation ----
// We use a min-heap keyed by score so we can efficiently discard the
// lowest-priority item when the heap is full.

class MinHeap {
  private heap: ScoredNotification[] = [];

  private parent(i: number) {
    return Math.floor((i - 1) / 2);
  }
  private left(i: number) {
    return 2 * i + 1;
  }
  private right(i: number) {
    return 2 * i + 2;
  }

  private swap(i: number, j: number) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  private siftUp(i: number) {
    while (i > 0 && this.heap[this.parent(i)].score > this.heap[i].score) {
      this.swap(i, this.parent(i));
      i = this.parent(i);
    }
  }

  private siftDown(i: number) {
    const n = this.heap.length;
    let smallest = i;
    const l = this.left(i);
    const r = this.right(i);
    if (l < n && this.heap[l].score < this.heap[smallest].score) smallest = l;
    if (r < n && this.heap[r].score < this.heap[smallest].score) smallest = r;
    if (smallest !== i) {
      this.swap(i, smallest);
      this.siftDown(smallest);
    }
  }

  push(item: ScoredNotification) {
    this.heap.push(item);
    this.siftUp(this.heap.length - 1);
  }

  pop(): ScoredNotification | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return min;
  }

  peek(): ScoredNotification | undefined {
    return this.heap[0];
  }

  size(): number {
    return this.heap.length;
  }

  toArray(): ScoredNotification[] {
    return [...this.heap];
  }
}

/**
 * Find the top N priority notifications from a list using a min-heap.
 * O(k * log N) where k = total notifications, N = top N size.
 *
 * This also works online: call with each new notification to maintain top N
 * without re-sorting the entire list.
 */
function getTopN(
  notifications: Notification[],
  n: number
): ScoredNotification[] {
  const heap = new MinHeap();

  for (const notif of notifications) {
    const scored: ScoredNotification = { ...notif, score: computeScore(notif) };

    if (heap.size() < n) {
      heap.push(scored);
    } else if (heap.peek() && scored.score > heap.peek()!.score) {
      // New notification has higher priority than the current minimum in heap
      heap.pop();
      heap.push(scored);
    }
  }

  // Sort descending (highest priority first) for display
  return heap.toArray().sort((a, b) => b.score - a.score);
}

async function fetchNotifications(token: string): Promise<Notification[]> {
  await Log(
    "backend",
    "info",
    "service",
    "Fetching notifications for priority inbox"
  );

  const response = await fetch(NOTIFICATIONS_API, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    await Log(
      "backend",
      "error",
      "service",
      `Failed to fetch notifications - status: ${response.status}`
    );
    throw new Error(`Notifications fetch failed: ${response.status}`);
  }

  const data = (await response.json()) as NotificationsResponse;
  await Log(
    "backend",
    "info",
    "service",
    `Fetched ${data.notifications.length} notifications`
  );
  return data.notifications;
}

async function main() {
  const token = process.env.AUTH_TOKEN || process.argv[2];
  const topN = parseInt(process.env.TOP_N || process.argv[3] || "10", 10);

  if (!token) {
    console.error(
      "Usage: AUTH_TOKEN=<token> TOP_N=10 ts-node priority_inbox.ts"
    );
    process.exit(1);
  }

  configureLogger({ authToken: token });

  await Log(
    "backend",
    "info",
    "service",
    `Priority Inbox starting - fetching top ${topN} notifications`
  );

  try {
    const notifications = await fetchNotifications(token);

    await Log(
      "backend",
      "debug",
      "service",
      `Computing priority scores for ${notifications.length} notifications`
    );

    const topNotifications = getTopN(notifications, topN);

    await Log(
      "backend",
      "info",
      "service",
      `Priority Inbox complete - top ${topNotifications.length} selected from ${notifications.length} total`
    );

    console.log(`\n========== Priority Inbox — Top ${topN} ==========\n`);
    topNotifications.forEach((n, i) => {
      console.log(`#${i + 1}`);
      console.log(`  ID:        ${n.ID}`);
      console.log(`  Type:      ${n.Type}`);
      console.log(`  Message:   ${n.Message}`);
      console.log(`  Timestamp: ${n.Timestamp}`);
      console.log(`  Score:     ${n.score.toFixed(6)}`);
      console.log();
    });
  } catch (err) {
    await Log(
      "backend",
      "fatal",
      "service",
      `Priority Inbox crashed: ${err instanceof Error ? err.message : String(err)}`
    );
    process.exit(1);
  }
}

main();
