# ⚡ Raya by Razorpay — Autonomous Multilingual AI Shopping Agent & Bazaar AI Merchant Growth Engine

> **Raya buys. Bazaar grows. Razorpay moves the money.**

**Raya by Razorpay** is a closed-loop agentic commerce system connecting buyers to live multi-store catalogs and merchant growth intelligence with native **5-Language Multilingual Support** across India's top linguistic regions:

1. **English (`en`)**
2. **हिन्दी — Hindi (`hi`)**
3. **मराठी — Marathi (`mr`)**
4. **தமிழ் — Tamil (`ta`)**
5. **বাংলা — Bengali (`bn`)**

---

## 🎯 The One-Line Architecture

> **Raya understands the buyer → Bazaar decides what to recommend and how to grow the basket → connected stores supply commerce → policy gates the transaction → Razorpay executes payment → CommerceEvents measure the outcome → Bazaar learns and drives the next growth action.**

---

## 🏗️ End-to-End System Architecture

Raya and Bazaar form a single unified agentic commerce stack where the boundary between conversational intelligence, multi-store discovery, financial guardrails, and merchant growth is closed into a continuous learning loop:

```text
Raya by Razorpay — Full Pipeline Architecture

                         ┌───────────────────────────┐
                         │        BUYER / USER       │
                         │                           │
                         │ "I need a gaming laptop   │
                         │  under ₹70k with ANC      │
                         │  headphones"              │
                         └─────────────┬─────────────┘
                                       │
                                       │ (1) Natural Language Intent
                                       ▼
    ╔═════════════════════════════════════════════════════════════════╗
    ║                     RAYA — BUYER AI AGENT                      ║
    ║                                                                 ║
    ║  • Intent Understanding & Constraint Extraction                 ║
    ║  • Conversational Memory & Preference Tracking                  ║
    ║  • Multi-Store Recommendation Synthesis                         ║
    ║  • Bounded Basket Construction                                  ║
    ║  • Explicit User Approval Orchestration                         ║
    ║  • Razorpay Checkout Gating                                     ║
    ╚═════════════════════════════════════════════════════════════════╝
                                       │
                                       │ (2) Query & Constraint Dispatch
                                       ▼
    ╔═════════════════════════════════════════════════════════════════╗
    ║                 BAZAAR — COMMERCE INTELLIGENCE                  ║
    ║                                                                 ║
    ║  • Multi-Catalog Index & Aggregation                            ║
    ║  • Semantic Match & Cross-Store Ranking                         ║
    ║  • Dynamic Cross-Sell Engine                                    ║
    ║  • Growth Experiment Evaluator                                  ║
    ║  • Revenue Attribution Engine                                   ║
    ║  • Purchase Control Policy Engine                               ║
    ║  • Immutable Decision Ledger                                    ║
    ║  • CommerceEvent Telemetry Trail                                ║
    ╚═════════════════════════════════════════════════════════════════╝
                                       │
             ┌─────────────────────────┼─────────────────────────┐
             │                         │                         │
             ▼ (3) Store Query         ▼ (3) Store Query         ▼ (3) Store Query
    ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
    │   NexusStore    │       │   ThreadVault   │       │    PixelMart    │
    │  (Electronics)  │       │    (Fashion)    │       │  (Accessories)  │
    └────────┬────────┘       └────────┬────────┘       └────────┬────────┘
             │                         │                         │
             │                         │                         │
             └─────────────────────────┼─────────────────────────┘
                                       │
                                       │ (+ eBay Live Marketplace Feed)
                                       │
                                       │ (4) Normalized Product Stream
                                       ▼
    ╔═════════════════════════════════════════════════════════════════╗
    ║                    BOUNDED BASKET & POLICY                      ║
    ║                                                                 ║
    ║   Candidate items matched across stores:                        ║
    ║   • Primary: ASUS TUF Gaming Laptop — ₹64,990 (NexusStore)     ║
    ║   • Cross-sell: ANC Pro Headset — ₹4,499 (PixelMart)            ║
    ║                                                                 ║
    ║   ─── POLICY GATES EVALUATION ────────────────────────────────  ║
    ║   Gate 1: Total (₹69,489) <= Spend Cap (₹70,000)      --> PASS  ║
    ║   Gate 2: Qty per SKU <= 5                            --> PASS  ║
    ║   Gate 3: Live Price matches catalog                  --> PASS  ║
    ║   Gate 4: Currency == INR                             --> PASS  ║
    ║   Gate 5: Merchant Auth verified                      --> PASS  ║
    ║   Gate 6: Approval Token TTL valid (< 15 min)         --> PASS  ║
    ║                                                                 ║
    ║   Policy Result: APPROVED                                       ║
    ║   Decision Ledger Entry: #DEC-0492 Logged                       ║
    ╚═════════════════════════════════════════════════════════════════╝
                                       │
                                       │ (5) Presentation to Buyer
                                       ▼
                         ┌───────────────────────────┐
                         │    BUYER APPROVAL MODAL   │
                         │                           │
                         │ "Total: ₹69,489            │
                         │  Items: Laptop + Headset  │
                         │  [Confirm & Pay with RZP]"│
                         └─────────────┬─────────────┘
                                       │
                                       │ (6) Explicit User Consent
                                       ▼
    ╔═════════════════════════════════════════════════════════════════╗
    ║                   RAZORPAY PAYMENT GATEWAY                      ║
    ║                                                                 ║
    ║   • Order Creation: order_Q8xK2mP9vL1z                          ║
    ║   • Amount: ₹69,489 INR                                         ║
    ║   • Payment Options: UPI / Card / NetBanking (Test Mode)       ║
    ║   • Signature Verification & Webhook Capture                    ║
    ║   • Status: PAYMENT_SUCCESS                                     ║
    ╚═════════════════════════════════════════════════════════════════╝
                                       │
                                       │ (7) Payment Confirmation
                                       ▼
    ╔═════════════════════════════════════════════════════════════════╗
    ║                    COMMERCE EVENTS PIPELINE                     ║
    ║                                                                 ║
    ║   Deterministic 7-Event Sequence Emitted:                       ║
    ║   1. INTENT_DISCOVERED      (session, query, timestamp)         ║
    ║   2. PRODUCTS_RECOMMENDED   (items, scores, strategy_id)        ║
    ║   3. BASKET_CONSTRUCTED     (primary_item, companion_item)      ║
    ║   4. POLICY_EVALUATED       (6 gates, spend_cap, result)        ║
    ║   5. USER_APPROVED          (user_id, token, amount)            ║
    ║   6. PAYMENT_SETTLED        (order_id, payment_id, rzp_sig)     ║
    ║   7. REVENUE_ATTRIBUTED     (baseline, incremental, merchant)   ║
    ╚═════════════════════════════════════════════════════════════════╝
                                       │
                                       │ (8) Telemetry Ingestion
                                       ▼
    ╔═════════════════════════════════════════════════════════════════╗
    ║              BAZAAR — CLOSED-LOOP GROWTH AGENT                  ║
    ║                                                                 ║
    ║   Merchant-Facing Intelligence:                                 ║
    ║   • Attribution Math:                                           ║
    ║     - Baseline Order (Laptop): ₹64,990                          ║
    ║     - Incremental GMV (Headset cross-sell): +₹4,499             ║
    ║     - AOV Lift: +6.9% on this order                             ║
    ║   • Strategy Performance Updated:                               ║
    ║     - Strategy: "laptop-audio-v1"                               ║
    ║     - Attach Rate: 14.2% -> 15.1%                               ║
    ║     - Total Incremental GMV: ₹1,53,344                          ║
    ║   • Autonomous Feedback:                                        ║
    ║     - Identifies next opportunity: "laptop-cooling-pad"         ║
    ║     - Proposes new growth rule to merchant                      ║
    ║     - Merchant activates rule -> feeds next Raya recommendation ║
    ╚═════════════════════════════════════════════════════════════════╝
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │   MERCHANT CONTROL ROOM   │
                         │                           │
                         │ • Live GMV Dashboard      │
                         │ • Incremental Attribution │
                         │ • Strategy Toggle Switch  │
                         │ • Copilot Q&A Assistant   │
                         │ • 6-Gate Safeguard Config │
                         └───────────────────────────┘
```

---

## 🔄 The 14-Step End-to-End Data Flow

1. **Express Intent**: Buyer prompts natural language shopping requests in any of the 5 supported languages (`en`, `hi`, `mr`, `ta`, `bn`).
2. **Intent Parsing**: Raya canonicalizes multilingual tokens, extracts price limits, brand preferences, and categories.
3. **Multi-Source Discovery**: Bazaar queries connected merchant store endpoints (NexusStore, ThreadVault, PixelMart) and the live eBay marketplace simultaneously.
4. **Catalog Normalization**: Raw schemas are normalized into unified commerce representations (title, price, INR equivalent, live availability, image).
5. **Deterministic Ranking**: Products are scored on Buyer Fit (40%), Item Quality/Ratings (25%), Fast Domestic Delivery (20%), and Price Competitiveness (15%).
6. **Merchant Growth Strategy Injection**: Active Bazaar growth rules evaluate whether high-probability companion items (e.g. laptop sleeve, audiophile DAC, ANC headphones) attach to the basket.
7. **Bounded Basket Assembly**: Raya constructs a structured cart adhering to requested user constraints and budget.
8. **Server-Side Policy Check (6 Gates)**: Total price, per-SKU quantity, live catalog price recheck, INR domestic currency, merchant authorization, and 15-minute TTL tokens are evaluated server-side.
9. **Explainable Presentation**: The recommendation is presented to the buyer with transparent "Why Recommended" badges and deterministic match scores.
10. **Explicit User Approval Gate**: No payment order is created without explicit user consent (`Confirm & Pay`).
11. **Razorpay Test Mode Execution**: Upon approval, an authorized Razorpay Order is created (`rzp_test_...`) and presented in the checkout dialog.
12. **Tamper-Proof Audit Logging**: Every stage emits an immutable record to the **Decision Ledger** and appends to the **CommerceEvent** telemetry stream.
13. **Conservative Revenue Attribution**: Incremental GMV is calculated strictly on accepted & settled companion cross-sell items, proving net business expansion.
14. **Growth Loop Learning**: Telemetry updates Merchant Control Room charts, empowering the Growth Agent to suggest or activate the next catalog growth strategy.

---

## 🌐 Complete 5-Language Multilingual Coverage

Raya and Bazaar feature complete, zero-leakage multilingual coverage across all components with strict key parity and persistent locale state.

| Code | Language | Native Script | Target Demographics |
| :--- | :--- | :--- | :--- |
| `en` | English | English | Global & Pan-India Tech Shoppers |
| `hi` | Hindi | हिन्दी | North & Central India |
| `mr` | Marathi | मराठी | Western India (Maharashtra) |
| `ta` | Tamil | தமிழ் | Southern India & Global Tamil diaspora |
| `bn` | Bengali | বাংলা | Eastern India (West Bengal) & Bangladesh |

### Multilingual Coverage Matrix
When a language is selected, the **entire application** dynamically adapts with zero language mixing:

* **Buyer AI Chat (`/`)**:
  * Agent conversational tone & recommendations natively generated by Google Gemini in the target language.
  * Search keywords automatically canonicalized from regional vocabulary (e.g., `लैपटॉप` ➔ `laptop`, `ஹெட்ஃபோன்` ➔ `headphone`) to query multi-store bridge catalogs.
  * Voice Search Speech Recognition (`webkitSpeechRecognition` / `SpeechRecognition`) tuned to selected locale (`hi-IN`, `mr-IN`, `ta-IN`, `bn-IN`, `en-IN`).
  * Dedicated chat session sidebar with localized session counts, cart badges, and tab titles.
* **Interactive Product Cards**:
  * Match reason labels, compatibility explanations, confidence scores, and action buttons.
* **Cart Drawer & Governance**:
  * Item counts, summary subtotals, companion cross-sell suggestions, and 6-gate safety checklist.
* **Razorpay Payment Integration**:
  * Payment authorization buttons, synthetic test-mode settlement notices, and localized status notifications.
* **Order Confirmation Receipt**:
  * Shipping destination, fulfillment partner store pill, payment verification badge, and order ID tracking.
* **Bazaar Merchant Growth Control Room (`/merchant`)**:
  * Verified Business Impact cards (Total GMV, AI-Attributed GMV, Incremental GMV, Conversion Rate, AOV).
  * 10-Step Closed-Loop Commerce Story Pipeline visualization (`1. INTENT` ➔ `10. LEARN`).
  * Before vs After Bazaar AI comparison matrix.
  * 6 Server-Side Financial Guardrails and Interactive Failure Demos.
  * Live Orders Telemetry and Decision Ledger audit trail.
* **Merchant Copilot (`/api/merchant/copilot`)**:
  * Floating Copilot assistant answers queries regarding live sales, attach rates, and growth opportunities completely in the merchant's chosen language.

### Brand Name & Enum Immutability Rules
To prevent business logic corruption or confusing translations:
* **Protected Brands (Original Latin Form)**: `Raya`, `Bazaar AI`, `Razorpay`, `NexusStore`, `ThreadVault`, `PixelMart`, `eBay`.
* **Protected Enums (Canonical Tokens)**: `DISCOVERED`, `RECOMMENDED`, `ADDED`, `POLICY_CHECKED`, `APPROVED`, `PAYMENT_CREATED`, `PAID`, `ATTRIBUTED`, `BLOCKED`, `INVALIDATED`.
* **Product Titles, Strategy IDs & Order IDs**: Maintained in exact numeric/identifier form.

---

## 🏪 Connected Commerce Sources

Bazaar integrates multiple specialized commerce feeds into a unified schema:

* **⚡ NexusStore (`nexusstore`)**: Electronics, computing hardware, laptops, smart wearables, and power accessories.
* **🧵 ThreadVault (`threadvault`)**: Minimalist luxury fashion, cashmere outerwear, tailored streetwear, and artisan audiophile DACs.
* **🎮 PixelMart (`pixelmart`)**: Cyberpunk gaming gear, mechanical keypads, creator accessories, and RGB workspace hardware.
* **🛍️ eBay Live (`ebay`)**: Certified refurbished flagship electronics and global marketplace listings.

---

## 🛡️ The 6 Server-Side Financial Guardrails

Every monetary action is bounded, explainable, and fail-safe:

1. **Gate 01: Maximum Spend Cap**: Hard server-side ceiling (e.g. ₹10,000 baseline, configurable up to ₹2,50,000 for enterprise computing). Orders exceeding this cap are blocked before Razorpay order creation.
2. **Gate 02: SKU Quantity Limits**: Enforces a strict limit (e.g. max 5 units/SKU) to prevent bot inventory hoarding.
3. **Gate 03: Live Price Validation**: Database recheck prevents checkout if merchant catalog price changes between recommendation and payment.
4. **Gate 04: Currency Verification**: Strict domestic INR enforcement rejects foreign currency mismatches.
5. **Gate 05: Merchant Authorization**: Fulfillment is restricted to verified, active merchant accounts.
6. **Gate 06: Approval Expiry TTL**: User approval tokens expire after 15 minutes, preventing stale replays.

---

## 🧪 Automated Verification Test Suites

Two automated test suites are included to verify code correctness, localization key parity, and safety policies:

### 1. Multilingual Verification Test Suite
```bash
node tests/multilingual-verification.test.js
```
*Verifies 100% key parity across all 5 dictionaries (337 keys), `LocaleProvider`, API endpoints, and brand/enum preservation.*

### 2. Track 01 Commerce Verification Test Suite
```bash
node tests/track01-verification.test.js
```
*Verifies active strategy injection, conservative attribution, UI tool sanitization, and failure demo triggers.*

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the **Raya Buyer UI**, or [http://localhost:3000/merchant](http://localhost:3000/merchant) for the **Bazaar AI Merchant Control Room**.

### 3. Production Build
```bash
npm run build
npm start
```
