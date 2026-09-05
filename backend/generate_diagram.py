import os
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(BASE_DIR, "..", "docs")
os.makedirs(DOCS_DIR, exist_ok=True)
OUT_PATH = os.path.join(DOCS_DIR, "architecture.png")
WIDTH, HEIGHT = 1920, 1080
img = Image.new("RGBA", (WIDTH, HEIGHT), "#080D1A")
draw = ImageDraw.Draw(img)

# Fonts
try:
    font_title = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 36)
    font_subtitle = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 16)
    font_col_hdr = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 18)
    font_box_title = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 16)
    font_box_desc = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 13)
    font_code = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 12)
    font_badge = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 14)
except Exception:
    font_title = ImageFont.load_default()
    font_subtitle = font_col_hdr = font_box_title = font_box_desc = font_code = font_badge = font_title

# Subtle grid lines
for x in range(0, WIDTH, 60):
    draw.line([(x, 0), (x, HEIGHT)], fill="#0D1527", width=1)
for y in range(0, HEIGHT, 60):
    draw.line([(0, y), (WIDTH, y)], fill="#0D1527", width=1)

# Top Title Banner
title_text = "'Ghost Payment Detector' - Enterprise System"
sub_text = "Autonomous Dual-Channel Reconciliation • Deterministic Gate Boundary • Isolated LLM Explainer"
draw.text((WIDTH // 2, 45), title_text, fill="#FFFFFF", font=font_title, anchor="mm")
draw.text((WIDTH // 2, 80), sub_text, fill="#94A3B8", font=font_subtitle, anchor="mm")

# Helper for rounded rectangles with title & text
def draw_card(box, title, lines=[], bg="#10182B", border="#1E2C4A", title_color="#F8FAFC", badge=None, badge_color="#3B82F6"):
    x0, y0, x1, y1 = box
    draw.rounded_rectangle(box, radius=8, fill=bg, outline=border, width=2)
    
    # Header area
    curr_y = y0 + 14
    draw.text((x0 + 16, curr_y), title, fill=title_color, font=font_box_title)
    
    if badge:
        bw = len(badge) * 8 + 14
        bx0 = x1 - bw - 14
        draw.rounded_rectangle([bx0, curr_y - 2, bx0 + bw, curr_y + 18], radius=4, fill=badge_color)
        draw.text((bx0 + bw//2, curr_y + 8), badge, fill="#FFFFFF", font=font_code, anchor="mm")
        
    curr_y += 28
    draw.line([(x0 + 12, curr_y), (x1 - 12, curr_y)], fill=border, width=1)
    curr_y += 12
    
    for l in lines:
        if l.startswith("•") or l.startswith("-"):
            draw.text((x0 + 16, curr_y), l, fill="#CBD5E1", font=font_box_desc)
        elif l.startswith("  "):
            draw.text((x0 + 24, curr_y), l, fill="#94A3B8", font=font_code)
        else:
            draw.text((x0 + 16, curr_y), l, fill="#94A3B8", font=font_box_desc)
        curr_y += 20

# Column Coordinates
col_y = 125
col_w = 310
gap = 35
left_margin = 75

c1_x = left_margin
c2_x = c1_x + col_w + gap
c3_x = c2_x + col_w + gap + 20
c4_x = c3_x + col_w + gap + 30
c5_x = c4_x + col_w + gap

# Column Headers
headers = [
    (c1_x, "INPUT & SIMULATION"),
    (c2_x, "DISCREPANCY ENGINE"),
    (c3_x, "DECISION GATEWAY"),
    (c4_x, "AI MESSAGE GENERATION"),
    (c5_x, "ACTION EXECUTION"),
]

for x, h in headers:
    draw.text((x + col_w//2, col_y), h, fill="#64748B", font=font_col_hdr, anchor="mm")
    draw.line([(x + 20, col_y + 16), (x + col_w - 20, col_y + 16)], fill="#1E293B", width=2)

box_top = col_y + 30

# ----------------- COLUMN 1: INPUT -----------------
draw_card([c1_x, box_top, c1_x + col_w, box_top + 130], 
          "Checkout Simulator", 
          ["• Client initiates purchase", "• POST /simulate/checkout", "• Order state: 'pending'"], 
          badge="INPUT", badge_color="#2563EB")

draw_card([c1_x, box_top + 150, c1_x + col_w, box_top + 280], 
          "Razorpay Gateway", 
          ["• Dual-Mode Gateway Client", "• Captures ground truth (₹)", "• Live SDK or Mock Simulator"], 
          badge="TRUTH", badge_color="#0D9488")

draw_card([c1_x, box_top + 300, c1_x + col_w, box_top + 430], 
          "Ingestion & Normalizer", 
          ["• RawEvent Pydantic schema", "• HMAC-SHA256 signature read", "• Currency & amount validation"], 
          badge="SCHEMA", badge_color="#475569")


# ----------------- COLUMN 2: DISCREPANCY ENGINE -----------------
draw_card([c2_x, box_top, c2_x + col_w, box_top + 200], 
          "Chaos Injection Relay", 
          ["• Drops webhooks silently (0-100%)", "• Injects artificial delay (0-30s)", "• Corrupts payload / signature", "• Reproduces 2:00 AM outage", "• Creates 'Ghost Payment' state"], 
          badge="CHAOS", badge_color="#D97706", bg="#151722", border="#3E2B15")

draw_card([c2_x, box_top + 230, c2_x + col_w, box_top + 430], 
          "Dual-Channel Poller", 
          ["• Background cron (every 30s)", "• Manual trigger: POST /reconcile", "• Queries stale pending orders", "• B-Tree index O(log N) scan", "• Cross-checks with Gateway API", "• Bounded batch processing (100)"], 
          badge="CRON 30s", badge_color="#0284C7")


# ----------------- COLUMN 3: DECISION GATEWAY -----------------
# Big prominent central box
gw_box = [c3_x, box_top, c3_x + col_w + 30, box_top + 430]
draw.rounded_rectangle(gw_box, radius=10, fill="#0F172A", outline="#3B82F6", width=3)
draw.text((c3_x + 18, box_top + 16), "Deterministic Policy Gate", fill="#FFFFFF", font=font_box_title)
draw.text((c3_x + 18, box_top + 38), "Financial Boundary & Final Authority", fill="#60A5FA", font=font_box_desc)
draw.line([(c3_x + 15, box_top + 60), (c3_x + col_w + 15, box_top + 60)], fill="#1E3A8A", width=2)

gate_rules = [
    ("Rule 1", "Idempotency Check O(1)", "corrections(order_id) unique PK"),
    ("Rule 2", "Gateway Status == 'captured'", "Discards failed / authorized"),
    ("Rule 3", "Cryptographic Signature", "HMAC verification / API token"),
    ("Rule 4", "Exact Amount & Currency", "Paisa-level match (gateway == DB)"),
    ("Rule 5", "Terminal State Guard", "Rejects refunded / disputed / void"),
]

gy = box_top + 75
for r_num, r_title, r_desc in gate_rules:
    draw.text((c3_x + 18, gy), f"• {r_num}: {r_title}", fill="#F1F5F9", font=font_box_desc)
    draw.text((c3_x + 30, gy + 17), r_desc, fill="#94A3B8", font=font_code)
    gy += 42

draw.line([(c3_x + 15, gy + 5), (c3_x + col_w + 15, gy + 5)], fill="#1E3A8A", width=1)

# Verdict tags
draw.rounded_rectangle([c3_x + 18, gy + 18, c3_x + 160, gy + 46], radius=6, fill="#065F46", outline="#10B981", width=2)
draw.text((c3_x + 89, gy + 32), "ALLOWED (5/5 PASS)", fill="#ECFDF5", font=font_code, anchor="mm")

draw.rounded_rectangle([c3_x + 175, gy + 18, c3_x + col_w + 12, gy + 46], radius=6, fill="#7F1D1D", outline="#EF4444", width=2)
draw.text((c3_x + 258, gy + 32), "BLOCKED (FLAGGED)", fill="#FEF2F2", font=font_code, anchor="mm")


# ----------------- COLUMN 4: AI MESSAGE GENERATION -----------------
draw_card([c4_x, box_top, c4_x + col_w, box_top + 165], 
          "Bounded Groq AI", 
          ["• Generates technical RCA summary", "• Drafts customer apology email", "• Strictly read-only context", "• ZERO database write access", "• CANNOT make financial decisions"], 
          badge="STRICT BOUNDS", badge_color="#8B5CF6", bg="#141126", border="#4C1D95")

draw_card([c4_x, box_top + 180, c4_x + col_w, box_top + 300], 
          "AI Output Validator", 
          ["• Pydantic schema verification", "• Bounded string length (<500ch)", "• Forbidden financial term filter", "• Customer tone validation"], 
          badge="GUARDRAILS", badge_color="#6366F1")

draw_card([c4_x, box_top + 315, c4_x + col_w, box_top + 430], 
          "ThreadPool / Fallbacks", 
          ["• Non-blocking asynchronous exec", "• Deterministic template fallback", "• Zero-latency response on timeouts", "• Safe offline operation"], 
          badge="RESILIENCE", badge_color="#334155")


# ----------------- COLUMN 5: ACTION EXECUTION -----------------
draw_card([c5_x, box_top, c5_x + col_w, box_top + 195], 
          "Action Execution Layer", 
          ["• UPDATE orders SET status='paid'", "• INSERT into corrections (O(1) PK)", "• Append to immutable audit_log", "• Order state converges in <30s", "• Real-time broadcast"], 
          badge="STATE MUTATION", badge_color="#059669", bg="#0C1B17", border="#065F46")

draw_card([c5_x, box_top + 215, c5_x + col_w, box_top + 430], 
          "Escalation & Exceptions", 
          ["• Status transitioned to 'escalated'", "• Prevents poller loop storm", "• Flagged for Operations review", "• Actions: Manual Pay, Refund, Reject", "• Human action logged to audit trail", "• AI Explainer is SKIPPED ENTIRELY"], 
          badge="HUMAN-IN-LOOP", badge_color="#B91C1C", bg="#1C1012", border="#7F1D1D")


# ----------------- BOTTOM ROW: STORAGE & USER INTERFACES -----------------
bot_y = box_top + 465
bot_h = 180

# Storage
draw_card([left_margin, bot_y, left_margin + 830, bot_y + bot_h], 
          "STORAGE & PERSISTENCE LAYER (SQLite with Write-Ahead Logging - WAL)", 
          [
              "• orders (id, amount, currency, status: pending | paid | escalated, created_at, updated_at)",
              "• corrections (id, order_id UNIQUE PK, gateway_payment_id, corrected_at, method: auto_gate)",
              "• audit_log (id, timestamp, actor: system | human | llm, action, order_id, event_metadata)",
              "• escalation_queue (id, order_id, reason, status: open | resolved, assigned_to, resolution_notes)",
              "• webhook_events (id, order_id, event_type, payload, signature, delivery_status: delivered | dropped | corrupted)"
          ], 
          badge="ACID WAL", badge_color="#0F766E", border="#134E4A")

# User Interfaces
draw_card([left_margin + 860, bot_y, WIDTH - left_margin, bot_y + bot_h], 
          "USER INTERFACES & OBSERVABILITY (React + Vite + FastAPI)", 
          [
              "• Executive KPI Cards: Real-time Recovered Revenue, Gate Verdicts, Detection Latency (<30s)",
              "• Chaos Injection Lab: Interactive sliders for Drop (0-100%), Latency Delay (0-30s), Corrupt Signature (0-100%)",
              "• Real-Time Activity Feed: Color-coded auto-corrected vs escalated events with raw JSON payload inspection",
              "• Compliance Audit Vault: Searchable, filterable by actor/status, with immutable 1-click CSV Export",
              "• Human Escalation Queue: Supervised one-click approval, refund trigger, and LLM diagnostic review"
          ], 
          badge="CONTROL CENTER", badge_color="#1D4ED8", border="#1E3A8A")


# ----------------- CONNECTING ARROWS & LABELS -----------------
# 1. Input -> Discrepancy
draw.line([(c1_x + col_w, box_top + 60), (c2_x, box_top + 60)], fill="#3B82F6", width=2)
draw.polygon([(c2_x, box_top + 60), (c2_x - 8, box_top + 55), (c2_x - 8, box_top + 65)], fill="#3B82F6")

# 2. Discrepancy -> Gateway
draw.line([(c2_x + col_w, box_top + 330), (c3_x, box_top + 330)], fill="#3B82F6", width=2)
draw.polygon([(c3_x, box_top + 330), (c3_x - 8, box_top + 325), (c3_x - 8, box_top + 335)], fill="#3B82F6")

# 3. Gateway -> AI (Green Allowed Branch)
arrow_allowed_y = box_top + 65
draw.line([(c3_x + col_w + 30, arrow_allowed_y), (c4_x, arrow_allowed_y)], fill="#10B981", width=3)
draw.polygon([(c4_x, arrow_allowed_y), (c4_x - 10, arrow_allowed_y - 6), (c4_x - 10, arrow_allowed_y + 6)], fill="#10B981")
draw.text((c3_x + col_w + 38, arrow_allowed_y - 18), "ALLOWED", fill="#10B981", font=font_code)

# 4. Gateway -> Action Execution (Green branch directly to Action Layer)
arrow_action_y = box_top + 105
draw.line([(c3_x + col_w + 30, arrow_action_y), (c4_x - 10, arrow_action_y), (c4_x - 10, box_top - 15), (c5_x + 30, box_top - 15), (c5_x + 30, box_top)], fill="#10B981", width=2)
draw.polygon([(c5_x + 30, box_top), (c5_x + 25, box_top - 8), (c5_x + 35, box_top - 8)], fill="#10B981")

# 5. Gateway -> Escalation (Red Blocked Branch)
arrow_blocked_y = box_top + 350
draw.line([(c3_x + col_w + 30, arrow_blocked_y), (c5_x, arrow_blocked_y)], fill="#EF4444", width=3)
draw.polygon([(c5_x, arrow_blocked_y), (c5_x - 10, arrow_blocked_y - 6), (c5_x - 10, arrow_blocked_y + 6)], fill="#EF4444")
draw.text((c3_x + col_w + 38, arrow_blocked_y - 18), "BLOCKED (AI SKIPPED)", fill="#EF4444", font=font_code)

# 6. Action Execution -> Storage
draw.line([(c5_x + 100, box_top + 430), (c5_x + 100, bot_y - 15), (left_margin + 500, bot_y - 15), (left_margin + 500, bot_y)], fill="#64748B", width=2)
draw.polygon([(left_margin + 500, bot_y), (left_margin + 495, bot_y - 8), (left_margin + 505, bot_y - 8)], fill="#64748B")

# Footer timestamp & metadata
draw.text((left_margin, HEIGHT - 35), "Ghost Payment Detector Architecture Blueprint • Razorpay AI Buildathon", fill="#475569", font=font_code)
draw.text((WIDTH - left_margin, HEIGHT - 35), "Security Invariant: Deterministic Gate Boundary • Zero LLM Financial Authority", fill="#475569", font=font_code, anchor="ra")

img.save(OUT_PATH, "PNG")
print(f"Successfully generated {OUT_PATH}")
