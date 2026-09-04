# Ghost Payment Detector — Complete System & Architecture Guide

> **Note for ChatGPT / LLM Prompt:**  
> *"You are an expert full-stack engineer and payment systems architect. Below is the complete design specification, system architecture, UI walkthrough, and codebase reference for the **Ghost Payment Detector** built for the **Razorpay AI Buildathon**. Please read this document and act as my tutor/mentor. I will ask you questions about how it works, how to present it to judges, and how each component operates."*

---

## 1. Executive Summary & Problem Statement

### What is a "Ghost Payment"?
In modern digital commerce (UPI, Credit Cards, Netbanking), payments are distributed across three distinct layers:
1. **The Merchant Frontend** (Customer browser / mobile app)
2. **The Payment Gateway** (Razorpay's banking infrastructure)
3. **The Merchant Backend** (Order and inventory database)

When a customer completes payment:
- The customer's bank debits the money, and Razorpay sets the transaction status to **`captured`** (Gateway Truth: **SUCCESS**).
- Razorpay sends an asynchronous HTTP webhook (`payment.captured`) to the merchant server.
- The merchant server marks the order as `paid` and delivers the goods or subscription.

### The Failure Mode:
If network congestion occurs, a load balancer times out, an ISP drops TCP packets, a server crashes at 2:00 AM, or the webhook signature is malformed:
* **Gateway Status:** `captured` (Customer was charged money).
* **Merchant DB Status:** `pending` (Merchant never fulfilled the order).
* **Result:** A **Ghost Payment**. The customer panics, files support tickets, posts on social media, or initiates an expensive chargeback. The merchant loses revenue and customer trust.

### What This Application Does:
The **Ghost Payment Detector** is an autonomous dual-channel reconciliation engine that:
1. Continuously cross-references stale merchant orders (`pending`) against Razorpay Gateway ground truth.
2. Passes candidate payments through a pure **5-Stage Deterministic Gate Function** (zero AI hallucinations; pure mathematical verification).
3. Safely auto-reconciles merchant orders in sub-30 seconds with **$O(1)$ idempotent guarantees** (no double-fulfillment or replay vulnerabilities).
4. Strictly confines generative AI (Anthropic Claude 3.5 Sonnet) to downstream root-cause incident summaries and customer communication drafts. **The AI is physically forbidden from updating databases or making financial decisions.**
5. Includes a **Chaos Simulation Lab** allowing judges and engineers to test network failures (drop webhook, delay webhook, corrupt signature) in real time.

---

## 2. High-Level System Architecture

```
[ Customer Checkout ]
        │
        ▼
[ Razorpay Gateway API ] ──(status: captured)──┐
        │                                      │
        ▼                                      │
[ Chaos Webhook Relay ]                        │
  (Drop / Delay / Corrupt)                     │
        │                                      │
  (Dropped silently)                           │
        │                                      ▼
[ Merchant Database ] ◄────────────── [ Reconciliation Poller ]
  (Order stuck in 'pending')            (Queries DB & Razorpay API)
                                               │
                                               ▼
                                  [ 5-Stage Deterministic Gate ]
                                  ├── 1. Idempotency Check
                                  ├── 2. Gateway Status == 'captured'
                                  ├── 3. Signature & Integrity Check
                                  ├── 4. Amount & Currency Match
                                  └── 5. Terminal State Guard
                                               │
                    ┌──────────────────────────┴──────────────────────────┐
                    ▼                                                     ▼
           [ Gate: PASSED ]                                      [ Gate: BLOCKED ]
                    │                                                     │
       [ Auto-Correct Order to 'paid' ]                     [ Move to Escalation Queue ]
       [ Write to Append-Only Audit ]                       [ Flag for Human Review ]
                    │                                                     │
                    └──────────────────────────┬──────────────────────────┘
                                               │
                                               ▼
                                 [ LLM Explainer (Claude) ]
                                 (Read-Only: Incident Summary +
                                  Customer Apology Draft)
```

---

## 3. The 5-Stage Deterministic Gate (Financial Invariant)

To guarantee 100% financial correctness, all state transitions are governed by `reconciliation_gate()` in `backend/app/gate.py`:

| Stage | Verification Rule | Failure Action |
| :--- | :--- | :--- |
| **Stage 1: Idempotency Guard** | Verifies if `order_id` already exists in the `corrections` table ($O(1)$ lookup). | Silently exits (prevents duplicate credit or replay attacks). |
| **Stage 2: Gateway Status Check** | Strictly verifies that Razorpay Gateway reports `status == "captured"`. | Blocked (if status is `failed`, `authorized`, or `created`). |
| **Stage 3: Cryptographic Integrity** | Validates HMAC-SHA256 signature / API authenticity token. | Blocked & Flagged as Security Incident. |
| **Stage 4: Amount & Currency Match** | Confirms `gateway_amount == order_amount` (to the exact paisa) and currency matches (`INR`). | Blocked & Escalated (prevents price tampering). |
| **Stage 5: Terminal State Guard** | Ensures the merchant order is not already in a terminal state (`refunded`, `disputed`, `void`). | Blocked (protects accounting integrity). |

### Why AI is NEVER Used at the Gate:
* LLMs are probabilistic; financial ledgers require absolute determinism.
* Prompt injections embedded in transaction metadata or customer names could bypass checks.
* The LLM operates purely on structured read-only logs *after* the Gate has rendered its decision.

---

## 4. UI Walkthrough & Component Guide

The frontend is styled in the dark, atmospheric **Razorpay Buildathon aesthetic** (`razorpay.com/buildathon/`): deep night palette (`#07090E`), cream typography (`#FBF7EE`), minimal borders, and zero clutter.

### 1. Navigation Bar (`Navbar.jsx`)
* **Brand:** Displays `Razorpay /ghost-detector`.
* **Poller Pulse:** An active emerald indicator showing `POLLER ACTIVE (30s)`.
* **Tabs:** Switch seamlessly between:
  * **Overview:** High-level dashboard with KPIs and live stream.
  * **Audit Trail:** Searchable compliance ledger.
  * **Escalations:** Queue of blocked transactions requiring human oversight.
  * **Sandbox:** Chaos injection sliders and checkout simulation.
  * **Architecture:** Complexity proofs and the AI boundary statement.
* **"Simulate 2am Drop":** Instant button to inject a ghost payment scenario.

### 2. Monumental Hero Section (`HeroBanner.jsx`)
* **Headline:** Large typography reading **"Reconcile it."**
* **Technical Summary:** Explains how the dual-channel engine detects stranded funds.
* **Slash Tags:**
  * `/ 5-Rule Deterministic Gate`
  * `/ O(1) Idempotency Constraint`
  * `/ Isolated Read-Only LLM`
  * `/ Append-Only Audit Trail`
* **Action Buttons:**
  * `Simulate Ghost Payment Scenario`: Generates an order, captures it on the gateway, drops the webhook, and triggers the poller.
  * `Run Reconciliation Poller`: Manually triggers the poller immediately.

### 3. Executive Metric Cards (`StatCards.jsx`)
* **Recovered Revenue:** Total Indian Rupees (₹) of ghost payments successfully saved.
* **Gate Decisions:** Ratio of auto-corrected vs. escalated orders (e.g., `17 / 1`).
* **Detection Latency:** Average time taken from webhook failure to database auto-correction (bounded $< 30$ seconds).
* **Pending In Database:** Count of merchant orders currently in `pending` state.

### 4. Chaos Injection Lab (`ChaosPanel.jsx`)
Gives developers and judges live controls to test resilience:
* **Drop Webhook Rate (0% - 100%):** Simulates lost HTTP packets.
* **Delay Webhook (0s - 30s):** Introduces network latency to test race conditions.
* **Corrupt Signature Rate (0% - 100%):** Tampers with headers to test cryptographic tripwires.
* **Checkout Generator:** Form to input custom amounts (₹) and simulate instant checkout scenarios.

### 5. Real-Time Reconciliation Feed (`LiveFeed.jsx`)
* Streams the latest system activity with 3.5s live polling.
* Shows distinct status badges:
  * `AUTO-CORRECTED` (Emerald)
  * `BLOCKED & ESCALATED` (Amber)
* Clicking an item expands to show:
  * **LLM Incident Diagnosis:** Technical explanation of the failure.
  * **Customer Communication Draft:** Contextual email drafted for the customer.
  * **One-Click Copy:** Copies customer drafts to the clipboard.

### 6. Compliance Audit Vault (`AuditTable.jsx`)
* A financial ledger of all system, human, and LLM actions.
* Searchable by Order ID, Action Type, or Actor (`system`, `human`, `llm`).
* **"Export CSV" Button:** Downloads an immutable audit log formatted for compliance officers and auditors.

### 7. Escalation Queue (`EscalationQueue.jsx`)
* Displays orders where auto-correction was blocked by the Gate (e.g., signature corruption or amount mismatch).
* Displays the LLM's explanation of why it was blocked.
* **Manual Resolution Action:** Operations personnel can click **"Resolve"** to mark the item as manually verified, which appends an immutable entry to the audit log.

### 8. Architecture & Complexity View (`ArchitectureView.jsx`)
Presents formal mathematical Big-O bounds:
* **Gate Decision:** $\mathcal{O}(1)$ time.
* **Idempotency Verification:** $\mathcal{O}(1)$ average time via unique index.
* **Poller Database Seek:** $\mathcal{O}(1)$ seek / $\mathcal{O}(\log N)$ via compound index on `(status, created_at)`.
* **Poller Memory Footprint:** $\mathcal{O}(1)$ RAM via cursor batching (limit 100 per cycle).
* **Audit Trail Insert:** $\mathcal{O}(1)$ append-only insert.

---

## 5. Technology Stack

* **Backend:** Python 3.9+, FastAPI, SQLite (Write-Ahead Logging mode enabled for concurrent reads/writes), SQLAlchemy, Pydantic v2, Pytest.
* **AI Model:** Anthropic Claude 3.5 Sonnet (with automatic offline fallback template engine if API keys are absent).
* **Payment Gateway SDK:** Razorpay Python SDK with high-fidelity offline mock simulator for local demos.
* **Frontend:** React 18, Vite 5, TailwindCSS 3, Lucide Icons.

---

## 6. REST API Endpoints Summary

| Method | Path | Function |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status. |
| `GET` | `/dashboard/stats` | Returns real-time financial and operational KPIs. |
| `POST` | `/simulate/checkout` | Simulates customer checkout and registers order at Gateway. |
| `POST` | `/webhook/razorpay` | Receives incoming Razorpay webhooks (routes through Chaos Relay). |
| `POST` | `/admin/reconcile-now` | Manually triggers the 5-Stage Gate across pending orders. |
| `GET` | `/admin/chaos-config` | Fetches current drop, delay, and corrupt probabilities. |
| `POST` | `/admin/chaos-config` | Sets new chaos rates in memory. |
| `GET` | `/events/recent` | Returns recent reconciliation timeline events. |
| `GET` | `/audit-log` | Paginated, searchable audit records. |
| `GET` | `/audit-log/export` | Downloads the audit log as a CSV spreadsheet. |
| `GET` | `/escalations` | Lists all transactions requiring human review. |
| `POST` | `/escalations/{id}/resolve` | Resolves an open escalation record. |

---

## 7. How to Run Locally

```bash
# 1. Clone repository
git clone https://github.com/Karan11103/Razorpay.git
cd Razorpay

# 2. Start both backend and frontend with one command
./start.sh
```
* **Frontend UI:** `http://localhost:5173`
* **Backend API Docs (Swagger):** `http://localhost:8000/docs`

---

## 8. Common Interview / Hackathon Questions & Answers

**Q: What happens if a delayed webhook arrives 2 minutes AFTER the poller already auto-corrected the order?**  
*A: Idempotency prevents duplicate operations. When the delayed webhook arrives, Rule 1 of the Deterministic Gate checks the `corrections` table where `order_id` is unique. It detects that the order has already been reconciled and safely discards the event in $\mathcal{O}(1)$ time.*

**Q: Why not have the LLM decide which orders to mark as paid?**  
*A: Generative AI models are stochastic. Allowing an LLM to update balances or change order states introduces non-zero risk of hallucinations, false approvals, and prompt injection attacks. Our architecture uses a strict boundary: the 5-Stage Gate makes the financial decision; the LLM merely explains the decision to humans.*

**Q: Does this project require paid API keys to demo?**  
*A: No. It is architected with dual-mode clients. If real Razorpay or Anthropic keys are placed in `.env`, it communicates with the live APIs. If placeholder keys are detected, it seamlessly falls back to high-fidelity local simulators without network latency or errors.*
