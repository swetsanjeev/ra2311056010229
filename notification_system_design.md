# Notification System Design

---

## Stage 1

### Overview

A campus notification platform that delivers real-time updates to students regarding **Placements**, **Events**, and **Results**.

---

### REST API Endpoints

#### 1. Get All Notifications for a Student

```
GET /api/v1/notifications
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters:**
| Parameter | Type    | Required | Description                              |
|-----------|---------|----------|------------------------------------------|
| type      | string  | No       | Filter by type: Placement, Event, Result |
| isRead    | boolean | No       | Filter by read/unread status             |
| page      | integer | No       | Page number (default: 1)                 |
| limit     | integer | No       | Items per page (default: 20, max: 100)   |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "type": "Placement",
      "message": "CSX Corporation is hiring! Apply by Friday.",
      "isRead": false,
      "createdAt": "2026-04-22T17:51:18Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8
  }
}
```

---

#### 2. Get a Single Notification

```
GET /api/v1/notifications/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
  "type": "Placement",
  "message": "CSX Corporation is hiring! Apply by Friday.",
  "isRead": false,
  "createdAt": "2026-04-22T17:51:18Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Notification not found"
}
```

---

#### 3. Mark a Notification as Read

```
PATCH /api/v1/notifications/:id/read
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
  "isRead": true,
  "updatedAt": "2026-04-22T18:00:00Z"
}
```

---

#### 4. Mark All Notifications as Read

```
PATCH /api/v1/notifications/read-all
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "updatedCount": 14,
  "message": "All notifications marked as read"
}
```

---

#### 5. Delete a Notification

```
DELETE /api/v1/notifications/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (204 No Content)**

---

#### 6. Send a Notification (Internal / Admin API)

```
POST /api/v1/notifications/send
```

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentIds": ["student-uuid-1", "student-uuid-2"],
  "type": "Placement",
  "message": "Google is hiring — apply now!"
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "job-uuid-abc",
  "message": "Notification dispatch queued successfully",
  "recipientCount": 2
}
```

---

#### 7. Broadcast to All Students (Notify All)

```
POST /api/v1/notifications/broadcast
```

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "Event",
  "message": "Tech-fest 2026 begins tomorrow at 9 AM!"
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "job-uuid-xyz",
  "message": "Broadcast queued for all 50,000 students",
  "recipientCount": 50000
}
```

---

### Real-Time Notification Mechanism

**Chosen approach: WebSockets (Socket.IO)**

Each student's browser maintains a persistent WebSocket connection after login. When a notification is created, the server emits an event directly to the student's socket room.

**Connection:**
```
ws://api.campus.edu/notifications/ws
```
```
Authorization: Bearer <token>   (sent during handshake)
```

**Server → Client Events:**

| Event              | Payload                                                   |
|--------------------|-----------------------------------------------------------|
| `notification:new` | `{ id, type, message, createdAt }`                        |
| `notification:read`| `{ id, isRead: true }`                                    |

**Client → Server Events:**

| Event              | Payload         |
|--------------------|-----------------|
| `notification:ack` | `{ id: "uuid" }` |

Each student joins a room identified by their `studentId` at connection time. Broadcast events fan out to all connected rooms.

---

## Stage 2

### Persistent Storage Choice: PostgreSQL

**Rationale:**

- Notifications have a well-defined, consistent schema — relational storage maps cleanly
- We need efficient querying by `studentId`, `type`, `isRead`, and `createdAt` — SQL indexes excel here
- ACID guarantees ensure no notification is lost or double-delivered during concurrent writes
- PostgreSQL supports JSONB for flexible metadata fields if notification types expand
- Mature ecosystem, strong support for read replicas and partitioning when scale demands it

---

### Database Schema

```sql
-- Students table (referenced by notifications)
CREATE TABLE students (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification types enum
CREATE TYPE notification_type AS ENUM ('Placement', 'Event', 'Result');

-- Core notifications table
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for the most common query: student's unread notifications, newest first
CREATE INDEX idx_notifications_student_unread
    ON notifications (student_id, is_read, created_at DESC);

-- Index for type-based filtering
CREATE INDEX idx_notifications_type
    ON notifications (type, created_at DESC);
```

---

### Problems as Data Volume Increases & Solutions

**Problem 1 — Table size & slow full scans**  
With 50,000 students each receiving hundreds of notifications, the table grows to tens of millions of rows. Full scans become expensive.

*Solution:* **Partition by `created_at` (range partitioning by month)**. Queries with date filters only touch the relevant partition. Old partitions can be archived or dropped cheaply.

```sql
-- Convert to partitioned table
CREATE TABLE notifications (
    ...
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE notifications_2026_04 PARTITION OF notifications
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
```

**Problem 2 — Write bottleneck during broadcast**  
Inserting 50,000 rows at once blocks the writer.

*Solution:* Use **bulk inserts** with `INSERT ... VALUES (batch)` and process asynchronously via a **message queue** (Redis / RabbitMQ). The API responds immediately with a `202 Accepted` and the worker drains the queue.

**Problem 3 — Read performance for the notification feed**  
Every page load queries unread notifications per student — this is the most frequent query.

*Solution:* **Read replicas** — route all read traffic to PostgreSQL replicas; writes go to the primary. Add **Redis caching** for the unread count (lightweight counter, invalidated on new insert or mark-read).

**Problem 4 — Index bloat on `is_read`**  
A boolean index is low-cardinality and bloats over time.

*Solution:* Use a **partial index** covering only unread notifications (the hot path):
```sql
CREATE INDEX idx_notifications_unread_partial
    ON notifications (student_id, created_at DESC)
    WHERE is_read = FALSE;
```

---

### SQL Queries Based on Stage 1 APIs

```sql
-- GET /api/v1/notifications (student's notifications, paginated)
SELECT id, type, message, is_read, created_at
FROM notifications
WHERE student_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- GET /api/v1/notifications?isRead=false
SELECT id, type, message, is_read, created_at
FROM notifications
WHERE student_id = $1
  AND is_read = FALSE
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- GET /api/v1/notifications/:id
SELECT id, type, message, is_read, created_at
FROM notifications
WHERE id = $1 AND student_id = $2;

-- PATCH /api/v1/notifications/:id/read
UPDATE notifications
SET is_read = TRUE, updated_at = NOW()
WHERE id = $1 AND student_id = $2
RETURNING id, is_read, updated_at;

-- PATCH /api/v1/notifications/read-all
UPDATE notifications
SET is_read = TRUE, updated_at = NOW()
WHERE student_id = $1 AND is_read = FALSE;

-- DELETE /api/v1/notifications/:id
DELETE FROM notifications
WHERE id = $1 AND student_id = $2;

-- GET unread count (for badge)
SELECT COUNT(*) FROM notifications
WHERE student_id = $1 AND is_read = FALSE;
```

---

## Stage 3

### Query Analysis

**Original query:**
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

**Is this query accurate?**

Mostly yes, but there are concerns:

1. `SELECT *` fetches all columns including `message` (potentially large TEXT). For a notification feed, you typically only need `id`, `type`, `message`, `created_at` — selecting all columns wastes bandwidth and memory.
2. With 5,000,000 rows and no index on `(student_id, is_read)`, this does a full table scan filtered by student — **extremely slow at scale**.
3. `ORDER BY createdAt DESC` without an index forces a filesort on the filtered result set.

**Why is it slow?**

Without a composite index on `(student_id, is_read, created_at)`, PostgreSQL scans all 5,000,000 rows and filters in memory. Even with an index on `student_id` alone, it must then filter `is_read = false` on all of that student's rows, then sort.

**What would we change?**

```sql
-- Optimised query
SELECT id, type, message, is_read, created_at
FROM notifications
WHERE student_id = 1042
  AND is_read = false
ORDER BY created_at DESC
LIMIT 20;  -- always paginate; never fetch unbounded results
```

Add this index:
```sql
CREATE INDEX idx_notifications_student_unread
    ON notifications (student_id, is_read, created_at DESC);
```

Or a partial index (more selective, smaller index size):
```sql
CREATE INDEX idx_notifications_unread_partial
    ON notifications (student_id, created_at DESC)
    WHERE is_read = false;
```

**Estimated computation cost improvement:**

| Scenario            | Without index | With composite index |
|---------------------|---------------|----------------------|
| Rows scanned        | ~5,000,000    | ~50–200 (index seek) |
| Operation           | Seq Scan      | Index Scan           |
| Sort                | Filesort      | Index order (free)   |
| Query time (est.)   | 2–5 seconds   | <5 ms                |

---

### Indexing All Columns — Is it a Good Idea?

**No. This advice is not safe.**

Adding indexes on every column has severe drawbacks:

- **Write amplification**: Every `INSERT`, `UPDATE`, or `DELETE` must update all indexes. With 50,000 students receiving mass notifications, write throughput collapses.
- **Storage overhead**: Each index can be as large as the table itself. 10 indexes on a 10 GB table = 100 GB index storage.
- **Planner confusion**: PostgreSQL's query planner has more indexes to evaluate; for complex queries it may choose suboptimal plans.
- **Index maintenance cost**: `VACUUM` and `AUTOVACUUM` take longer when there are many indexes to clean.

**The right approach** is to index selectively: only columns (or combinations) that appear in `WHERE`, `ORDER BY`, or `JOIN` clauses of frequent, performance-critical queries. Use `EXPLAIN ANALYZE` to guide decisions.

---

### Find All Students Who Got a Placement Notification in the Last 7 Days

```sql
SELECT DISTINCT student_id
FROM notifications
WHERE notification_type = 'Placement'
  AND created_at >= NOW() - INTERVAL '7 days';
```

*Supporting index:*
```sql
CREATE INDEX idx_notifications_type_created
    ON notifications (notification_type, created_at DESC);
```

This uses the `notification_type` enum column efficiently and the index makes the date range seek fast.

---

## Stage 4

### Problem

Notifications are fetched from the database on every page load for every student. With 50,000 students and frequent refreshes, the DB receives constant repeated identical reads, causing high latency and connection exhaustion.

---

### Solution: Multi-Layer Caching + Lazy Loading

**Strategy 1 — Redis Cache (Primary Fix)**

Cache each student's notification feed in Redis with a short TTL.

```
Key:   notifications:{student_id}:unread
Value: JSON array of up to 20 most recent unread notifications
TTL:   60 seconds
```

On cache hit → return immediately without touching the DB.  
On cache miss → query DB, populate cache, return result.

**Invalidation triggers:**
- New notification inserted for student → `DEL notifications:{student_id}:unread`
- Student marks notification as read → `DEL notifications:{student_id}:unread`

*Tradeoff:* Students may see stale data for up to 60 seconds. Acceptable for most notification types; for Placement time-sensitivity, WebSocket push ensures immediacy regardless.

---

**Strategy 2 — Pagination + Cursor-Based Fetching**

Never load all notifications at once. Use cursor-based pagination:

```
GET /api/v1/notifications?cursor=<last_seen_id>&limit=20
```

This eliminates `OFFSET` (which scans all preceding rows) and loads only what the user sees.

*Tradeoff:* Cannot jump to arbitrary pages (only next/previous), but this matches real notification UX (infinite scroll).

---

**Strategy 3 — WebSocket Push + Local State (Avoid Re-fetch)**

Rather than polling the server on every page load, the frontend maintains a local notification store (React state / Redux). New notifications arrive via WebSocket push and are prepended to the local list. The full list is only fetched once at login.

*Tradeoff:* If the user switches devices or clears state, a full re-fetch is needed. Manage with a `lastSyncedAt` timestamp.

---

**Strategy 4 — Unread Count as a Separate Cheap Query**

The notification badge (unread count) is the most frequently needed piece of data. Cache it as a simple integer in Redis:

```
Key:   notifications:{student_id}:unread_count
Value: "14"
TTL:   300 seconds (refreshed on push/mark-read)
```

The full notification list is only loaded when the student opens the notification panel.

*Tradeoff:* Slight eventual consistency, but avoids the expensive list query on every page render.

---

## Stage 5

### Shortcomings of the Original `notify_all` Implementation

```python
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)   # calls Email API
        save_to_db(student_id, message)   # DB insert
        push_to_app(student_id, message)  # real-time push
```

**Identified problems:**

1. **Synchronous sequential processing**: 50,000 students processed one-by-one in a single loop. At even 10ms per iteration, this takes 500 seconds (~8 minutes). The function blocks the entire process.

2. **No error isolation**: If `send_email` fails for student 200, the loop throws and students 201–50,000 never get notified. One failure kills the entire broadcast.

3. **Tight coupling of concerns**: Email sending, DB writes, and real-time push happen together in the same transaction. If the email API is slow, it blocks the DB write and delays push for all subsequent students.

4. **No retry mechanism**: A transient email API failure permanently loses that notification. There's no dead-letter queue or retry strategy.

5. **No atomicity guarantee**: If the process crashes after 25,000 emails but before their DB inserts, the state is inconsistent — students received emails but have no in-app notification.

---

### Redesigned Implementation

**Core principle:** Decouple DB persistence from external side effects. Persist first, then dispatch asynchronously via a message queue.

**Should saving to DB and sending email happen together?**

No. They should be separated. DB persistence is fast, reliable, and owned by us. Email delivery is slow, external, and fallible. Coupling them means email latency directly delays DB writes and vice versa.

The correct pattern: **write to DB first (source of truth), then enqueue an email job**. If email fails, we can retry from the queue without touching the DB again.

---

### Revised Pseudocode

```
function notify_all(student_ids: array, message: string, type: string):
    # Step 1: Bulk insert all notifications to DB atomically
    # This is our source of truth — if this succeeds, the notification exists
    notification_rows = student_ids.map(id => {
        student_id: id,
        message: message,
        type: type,
        is_read: false,
        created_at: now()
    })
    bulk_insert_to_db(notification_rows)   # single batched INSERT, transactional

    # Step 2: Enqueue email jobs in bulk (non-blocking)
    # Each job is independently retryable
    email_jobs = student_ids.map(id => { student_id: id, message: message })
    message_queue.enqueue_bulk("email_dispatch", email_jobs)

    # Step 3: Publish real-time push event to pub/sub
    # WebSocket server subscribes and fans out to connected clients
    pubsub.publish("broadcast_notification", {
        student_ids: student_ids,
        message: message,
        type: type
    })

    return { queued: len(student_ids), status: "dispatching" }


# Email worker (runs independently, many instances)
function email_worker():
    while true:
        job = message_queue.dequeue("email_dispatch")
        try:
            send_email(job.student_id, job.message)
            message_queue.ack(job)
        except EmailAPIError as e:
            if job.retry_count < 3:
                message_queue.nack(job, delay=exponential_backoff(job.retry_count))
            else:
                dead_letter_queue.enqueue(job)  # manual inspection
                log_error("email_dispatch", job.student_id, e)
```

**Key improvements:**

| Concern              | Before                        | After                                      |
|----------------------|-------------------------------|--------------------------------------------|
| DB persistence       | Per-student in loop           | Single bulk insert (atomic)                |
| Email delivery       | Blocking, inline              | Async queue with retry + dead-letter       |
| Real-time push       | Blocking, per-student         | Pub/sub broadcast (parallel fan-out)       |
| Failure isolation    | One failure kills broadcast   | Each job independent; failures retried     |
| Throughput           | Sequential, ~8 min for 50k   | Parallel workers, ~seconds for DB insert   |
| Observability        | Silent failure                | Queue metrics, dead-letter inspection      |

---

## Stage 6

### Priority Inbox — Top N Most Important Unread Notifications

**Approach:**

Priority is scored by a combination of **type weight** and **recency**, using a weighted composite score:

```
score = type_weight × recency_factor
```

Where:
- `type_weight`: Placement = 3, Result = 2, Event = 1
- `recency_factor`: exponential decay — `e^(-λ × hours_since_created)` with λ = 0.05

This means a Placement notification from 1 hour ago scores very high, but even a Placement from 72 hours ago will be outranked by a Result from 5 minutes ago after enough time passes.

**How to maintain top 10 efficiently with new notifications arriving:**

Use a **min-heap of size N** (priority queue). When a new notification arrives:
1. Compute its score
2. If heap size < N, push it
3. If its score > heap's minimum, pop the minimum and push the new notification
4. Otherwise, discard it from the heap (it's not in top N)

This gives O(log N) per new notification — extremely efficient regardless of total notification volume.

See `notification_app_be/priority_inbox.ts` for the full implementation.
