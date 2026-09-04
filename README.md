# ⚡ Raya by Razorpay

> **"Raya buys. Bazaar grows. Razorpay moves the money."**

**Raya by Razorpay** is an end-to-end agentic commerce system that unifies buyer-facing conversational intelligence, multi-store catalog discovery, server-side financial policy enforcement, Razorpay payment processing, and closed-loop merchant growth telemetry with native **5-Language Multilingual Support** across India's primary linguistic regions:

1. **English (`en`)**
2. **हिन्दी — Hindi (`hi`)**
3. **मराठी — Marathi (`mr`)**
4. **தமிழ் — Tamil (`ta`)**
5. **বাংলা — Bengali (`bn`)**

---

## 🏛️ System Component Separation

To maintain architectural clarity, each component of the system has a distinct role:

| Component | Layer | Verified Implementation in Repository |
| :--- | :--- | :--- |
| **RAYA** | Buyer-Facing Agent | `src/app/page.tsx`, `src/app/api/chat/route.ts`<br>Autonomous shopping agent powered by Google Gemini 1.5 Flash function calling, conversational memory, bounded basket assembly, and explicit checkout orchestration. |
| **BAZAAR** | Commerce Intelligence & Merchant Growth | `src/lib/merchant-store.ts`<br>Cross-catalog aggregation, dynamic growth strategy injection (`strat_companion_audio_v1`, `strat_knit_companion_v2`), conservative revenue attribution, policy validation, and immutable Decision Ledger. |
| **COMMERCE SOURCES** | Inventory & Product Feeds | `src/lib/gemini.ts`<br>Unified product feeds from 3 specialized stores (**NexusStore**, **ThreadVault**, **PixelMart**) plus live marketplace search on **eBay** with currency normalization (USD ➔ INR). |
| **RAZORPAY** | Payment & Settlement Infrastructure | `src/app/api/razorpay/create-order/route.ts`, `src/app/api/razorpay/verify/route.ts`, `src/lib/razorpay.ts`<br>Standard Razorpay Test Mode integration (`rzp_test_...`), HMAC-SHA256 signature verification, and standard checkout modal handling. |
| **MERCHANT CONTROL ROOM** | Merchant Intelligence & Telemetry | `src/app/merchant/page.tsx`, `src/components/merchant-floating-drawer.tsx`<br>Live GMV dashboard, 10-step commerce funnel, interactive spend cap adjuster, strategy rule toggles, failure simulation triggers, and multilingual Merchant Copilot. |
| **PERSISTENCE / STATE** | Data Storage | Server in-memory singleton (`src/lib/merchant-store.ts`) for real-time telemetry, orders, and decision logs; client `localStorage` (`raya_sessions_v2`, `raya_messages_v2`, `raya_bazaar_locale`) for session history. |
| **AI MODEL** | Generation & Tool Calling | Google Gemini 1.5 Flash via REST API with native tool declarations (`listProducts`, `viewCart`, `addToCart`, `checkoutOrder`, `listConnectedStores`) and deterministic heuristic fallback. |

---

## 📐 Pipeline Architecture

```text
Raya by Razorpay — Full Pipeline Architecture

                         ┌───────────────────────────┐
                         │        BUYER / USER       │
                         │                           │
                         │ "I need a gaming laptop   │
                         │  under ₹70,000 with       │
                         │  ANC headphones"          │
                         └─────────────┬─────────────┘
                                       │
                                       │ (1) Natural Language Intent (5 Languages)
                                       ▼
    ╔═════════════════════════════════════════════════════════════════╗
    ║                     RAYA — BUYER AI AGENT                      ║
    ║                                                                 ║
    ║  • Multilingual Intent Extraction (Gemini 1.5 Flash)           ║
    ║  • Constraint Parsing (Category, Budget Cap, Attributes)        ║
    ║  • Tool Invocation: listProducts(query, maxPrice, store)        ║
    ║  • Bounded Basket Construction                                  ║
    ║  • Explicit Approval Orchestration                              ║
    ║  • Direct Razorpay Checkout Gating                              ║
    ╚═════════════════════════════════════════════════════════════════╝
                                       │
                                       │ (2) Query & Constraint Dispatch
                                       ▼
    ╔═════════════════════════════════════════════════════════════════╗
    ║                 BAZAAR — COMMERCE INTELLIGENCE                  ║
    ║                                                                 ║
    ║  • Multi-Store Aggregator (NexusStore, ThreadVault, PixelMart) ║
    ║  • Live eBay Marketplace API Search                             ║
    ║  • Semantic Match & Deterministic Ranking Algorithm             ║
    ║  • Active Growth Strategy Injection (In-cart Companion Cross-sell)║
    ║  • 6-Gate Server-Side Purchase Control Policy                   ║
    ║  • Immutable Decision Ledger (#DEC-XXXX)                       ║
    ╚═════════════════════════════════════════════════════════════════╝
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼ (3) Store Query        ▼ (3) Store Query        ▼ (3) Store Query
     ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
     │   NexusStore    │      │   ThreadVault   │      │    PixelMart    │
     │  (Electronics)  │      │    (Fashion)    │      │  (Accessories)  │
     └────────┬────────┘      └────────┬────────┘      └────────┬────────┘
              │                        │                        │
              └────────────────────────┼────────────────────────┘
                                       │
                                       │ (+ eBay Live Marketplace Feed)
                                       │
                                       │ (4) Normalized Product Stream
                                       ▼
    ╔═════════════════════════════════════════════════════════════════╗
    ║                    BOUNDED BASKET & POLICY                      ║
    ║                                                                 ║
    ║   Candidate Items:                                              ║
    ║   • Primary: ASUS TUF Gaming Laptop — ₹64,990 (NexusStore)     ║
    ║   • Cross-sell: ANC Pro Studio Headset — ₹4,499 (PixelMart)     ║
    ║                                                                 ║
    ║   ─── SERVER-SIDE 6-GATE VALIDATION ──────────────────────────  ║
    ║   Gate 1: Total (₹69,489) <= Spend Cap (₹70,000)      --> PASS  ║
    ║   Gate 2: Qty per SKU (1) <= 5                        --> PASS  ║
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
    ║   • Order Creation: /api/razorpay/create-order                  ║
    ║   • Amount: ₹69,489 INR (6948900 paise)                         ║
    ║   • Payment Methods: UPI / Cards / NetBanking (Test Mode)       ║
    ║   • HMAC-SHA256 Signature Verification: /api/razorpay/verify   ║
    ║   • Status: PAYMENT_SUCCESS                                     ║
    ╚═════════════════════════════════════════════════════════════════╝
                                       │
                                       │ (7) Payment Confirmation
                                       ▼
    ╔═════════════════════════════════════════════════════════════════╗
    ║                    COMMERCE EVENTS PIPELINE                     ║
    ║                                                                 ║
    ║   Deterministic Telemetry Sequence:                             ║
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
    ║   • Conservative Attribution:                                   ║
    ║     - Baseline Order (Laptop): ₹64,990                          ║
    ║     - Incremental GMV (Headset cross-sell): +₹4,499             ║
    ║     - AOV Lift: +6.9% on this order                             ║
    ║   • Strategy Performance Updated:                               ║
    ║     - Strategy: "strat_companion_audio_v1"                      ║
    ║     - Attach Rate: 14.2% -> 15.1%                               ║
    ║   • Autonomous Feedback:                                        ║
    ║     - Recommends next rule to merchant                          ║
    ║     - Merchant toggles rule -> feeds next Raya recommendation   ║
    ╚═════════════════════════════════════════════════════════════════╝
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │   MERCHANT CONTROL ROOM   │
                         │                           │
                         │ • Live GMV Dashboard      │
                         │ • Incremental Attribution │
                         │ • Strategy Toggle Switch  │
                         │ • Multilingual Copilot    │
                         │ • 6-Gate Safeguard Config │
                         └───────────────────────────┘
```

---

## 📊 Mermaid Architecture Diagrams

### 1. End-to-End System Architecture

```mermaid
flowchart TD
    subgraph BuyerLayer["Buyer Experience (Raya)"]
        Buyer([Buyer / User])
        RayaChat["Raya Conversational Interface\n(5 Languages: en, hi, mr, ta, bn)"]
        VoiceSearch["Voice Search Recognition\n(Web Speech API)"]
        CartDrawer["Bounded Basket & Cart Drawer"]
    end

    subgraph IntelligenceLayer["Commerce Intelligence (Bazaar)"]
        Gemini["Google Gemini 1.5 Flash\n(Tool Calling & Intent Parsing)"]
        BazaarBridge["Multi-Store Bridge & Ranking"]
        GrowthEngine["Growth Strategy Engine\n(In-Cart Companion Injection)"]
        PolicyEngine["Server-Side Policy Engine\n(6 Financial Guardrails)"]
        DecisionLedger["Immutable Decision Ledger\n(Audit Trail)"]
    end

    subgraph CommerceSources["Commerce Sources & Marketplaces"]
        Nexus["NexusStore\n(Tech & Wearables)"]
        Thread["ThreadVault\n(Luxury Fashion & Audio)"]
        Pixel["PixelMart\n(Gaming & Creator Gear)"]
        EBay["eBay Marketplace\n(Live Browse API + Fallback)"]
    end

    subgraph PaymentLayer["Financial Settlement (Razorpay)"]
        RzpCreate["/api/razorpay/create-order\n(Paise Calculation & Order ID)"]
        RzpCheckout["Razorpay Checkout Modal\n(Test Mode UPI / Cards)"]
        RzpVerify["/api/razorpay/verify\n(HMAC-SHA256 Signature Check)"]
    end

    subgraph MerchantLayer["Merchant Control Room (/merchant)"]
        ControlRoom["Live Business Metrics & GMV"]
        SpendAdjuster["Interactive Spend Cap Adjuster"]
        StrategyToggle["Growth Strategy Rules & Toggles"]
        CopilotDrawer["Merchant Copilot Drawer\n(Multilingual Telemetry Q&A)"]
        FailureDemos["Interactive Failure Demos\n(Cap Breach & Price Spike)"]
    end

    Buyer -->|Query / Voice| RayaChat
    VoiceSearch -.-> RayaChat
    RayaChat <-->|Chat API| Gemini
    Gemini -->|listProducts Tool| BazaarBridge
    BazaarBridge --> Nexus & Thread & Pixel & EBay
    Nexus & Thread & Pixel & EBay --> BazaarBridge
    BazaarBridge --> GrowthEngine
    GrowthEngine --> CartDrawer
    CartDrawer --> PolicyEngine
    PolicyEngine -->|Logs Action| DecisionLedger
    PolicyEngine -->|Approved| Buyer
    Buyer -->|Explicit Approval| RzpCreate
    RzpCreate --> RzpCheckout
    RzpCheckout --> RzpVerify
    RzpVerify -->|Payment Success| ControlRoom
    ControlRoom --> SpendAdjuster & StrategyToggle & CopilotDrawer & FailureDemos
    StrategyToggle -->|Activates Rules| GrowthEngine
```

---

### 2. Transaction Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Buyer
    participant Raya as Raya Agent UI
    participant ChatAPI as /api/chat
    participant Gemini as Gemini 1.5 Flash
    participant Bridge as Multi-Store Bridge
    participant Policy as Policy Gatekeeper
    participant RZP as Razorpay API
    participant Store as Merchant Store State
    participant Merchant as Merchant Control Room

    Buyer->>Raya: "Find gaming laptop under ₹70k" (in Hindi/English/etc.)
    Raya->>ChatAPI: POST /api/chat { message, locale, history }
    ChatAPI->>Gemini: generateContent with listProducts tool
    Gemini-->>ChatAPI: toolCall: listProducts({ search, maxPrice: 70000 })
    ChatAPI->>Bridge: Query NexusStore, ThreadVault, PixelMart, eBay
    Bridge-->>ChatAPI: Normalized products stream
    ChatAPI->>Store: getActiveStrategyForCategory(message)
    Store-->>ChatAPI: Active companion item (ANC Headset)
    ChatAPI-->>Raya: Return ranked products + Bazaar companion pick
    Buyer->>Raya: Adds items to cart & clicks "Confirm & Pay"
    Raya->>Policy: Validate 6 Gates (Spend cap, Qty <= 5, INR, TTL)
    Policy-->>Raya: POLICY_APPROVED (Decision logged)
    Raya->>RZP: POST /api/razorpay/create-order { amount, currency: INR }
    RZP-->>Raya: { orderId: "order_...", amountPaise: 6948900 }
    Raya->>Buyer: Render Razorpay Checkout Modal
    Buyer->>RZP: Complete Test Payment
    RZP-->>Raya: { razorpay_payment_id, razorpay_signature }
    Raya->>RZP: POST /api/razorpay/verify (HMAC SHA-256)
    RZP-->>Raya: { verified: true }
    Raya->>Store: Record order & attribute incremental GMV
    Store-->>Merchant: Update live charts, AOV lift (+24.8%), attach rates
    Raya->>Buyer: Display localized Order Confirmation Receipt
```

---

### 3. Closed-Loop Merchant Growth Loop

```mermaid
stateDiagram-v2
    [*] --> BuyerIntent: Buyer Expresses Intent
    BuyerIntent --> MultiStoreDiscovery: Raya Queries Bridge
    MultiStoreDiscovery --> StrategyInjection: Bazaar Identifies Rule Match
    StrategyInjection --> BoundedBasket: Primary + Companion Item Added
    BoundedBasket --> PolicyEvaluation: 6 Financial Gates Checked
    PolicyEvaluation --> Blocked: Spend Cap / Price Mismatch Breached
    PolicyEvaluation --> UserApproval: Policy Validated
    Blocked --> [*]: Fail-Safe Rejection Logged
    UserApproval --> RazorpaySettlement: User Confirms & Pays
    RazorpaySettlement --> TelemetryEvent: CommerceEvent Emitted
    TelemetryEvent --> AttributionEngine: Baseline vs Incremental Split
    AttributionEngine --> MerchantDashboard: Metrics Updated (+24.8% AOV Lift)
    MerchantDashboard --> GrowthCopilot: Copilot Recommends Next Action
    GrowthCopilot --> StrategyActivation: Merchant Toggles New Opportunity
    StrategyActivation --> StrategyInjection: Loop Closes (Next Shopper Experience)
```

---

## 🔄 The 14-Step End-to-End Data Flow

1. **Express Intent**: The buyer expresses shopping intent via text or native browser voice recognition in any of the 5 supported languages (`en`, `hi`, `mr`, `ta`, `bn`).
2. **Intent Parsing & Canonicalization**: Raya parses budget constraints, product keywords, and canonicalizes vernacular terms (e.g., `लैपटॉप` ➔ `laptop`, `ஹெட்ஃபோன்` ➔ `headphone`).
3. **Multi-Source Discovery**: The system queries connected merchant endpoints (**NexusStore**, **ThreadVault**, **PixelMart**) and the live **eBay Browse API** concurrently.
4. **Catalog Normalization**: All responses are transformed into a uniform schema (title, description, price in INR, image URL, merchant name, stock).
5. **Deterministic Ranking**: Products are scored and ranked based on buyer query match, budget headroom, ratings, and merchant reliability.
6. **Growth Strategy Injection**: Active Bazaar growth rules evaluate whether high-probability companion items (e.g. laptop ➔ headphones, jacket ➔ powerbank) attach to the basket.
7. **Bounded Basket Assembly**: Raya constructs a structured cart adhering strictly to requested user limits.
8. **Server-Side Policy Check (6 Gates)**: Total amount, per-SKU quantity, live catalog price recheck, domestic INR currency, merchant authorization, and 15-minute TTL tokens are evaluated server-side.
9. **Explainable Presentation**: The recommendation is presented to the buyer with transparent "Why Recommended" badges and deterministic match scores.
10. **Explicit User Approval Gate**: No payment order is created without explicit user consent (`Confirm & Pay`).
11. **Razorpay Test Mode Order Creation**: An authorized Razorpay Order is created via `/api/razorpay/create-order` and presented in the standard checkout modal.
12. **Payment & Cryptographic Verification**: Payment details are verified via `/api/razorpay/verify` using HMAC-SHA256 signature checking.
13. **Conservative Revenue Attribution**: Incremental GMV is calculated strictly on accepted & settled companion cross-sell items, proving net business expansion.
14. **Growth Loop Learning**: Telemetry updates Merchant Control Room charts, empowering the Growth Agent to suggest or activate the next catalog growth strategy.

---

## 🌐 Complete 5-Language Multilingual Implementation

Raya and Bazaar feature complete, zero-leakage multilingual coverage across all components with strict key parity and persistent locale state.

| Code | Language | Native Script | Primary Demographics | Dictionary Keys | Key Parity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `en` | English | English | Pan-India & Global Tech Shoppers | 337 | 100% |
| `hi` | Hindi | हिन्दी | North & Central India | 337 | 100% |
| `mr` | Marathi | मराठी | Western India (Maharashtra) | 337 | 100% |
| `ta` | Tamil | தமிழ் | Southern India & Global Diaspora | 337 | 100% |
| `bn` | Bengali | বাংলা | Eastern India (West Bengal) & Bangladesh | 337 | 100% |

### Zero Raw Keys & Human Text Guarantee
- Every user-facing UI element, navigation item, modal, badge, button, drawer header, KPI label, and input placeholder is routed through `useLocale().t(key)`.
- The Merchant Copilot drawer displays 100% human text across all states (title, subtitle, live KPI strip, quick question pills, assistant responses, and input placeholder).
- Fallbacks in API routes dynamically adapt to the requested locale so that even during network errors, the user receives human-readable text in their chosen language.

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
* **🛍️ eBay Live (`ebay`)**: Certified refurbished flagship electronics and global marketplace listings via eBay Browse API with automatic USD-to-INR conversion ($1 = ₹87.0).

---

## 🛡️ The 6 Server-Side Financial Guardrails

Every monetary action is bounded, explainable, and fail-safe:

1. **Gate 01: Maximum Spend Cap**: Configurable server-side ceiling (default ₹10,000, adjustable in UI up to ₹2,50,000). Orders exceeding this cap are blocked before Razorpay order creation.
2. **Gate 02: SKU Quantity Limits**: Enforces a strict limit (max 5 units/SKU) to prevent bot inventory hoarding.
3. **Gate 03: Live Price Validation**: Database recheck prevents checkout if merchant catalog price changes between recommendation and payment.
4. **Gate 04: Currency Verification**: Strict domestic INR enforcement rejects foreign currency mismatches.
5. **Gate 05: Merchant Authorization**: Fulfillment is restricted to verified, active merchant accounts.
6. **Gate 06: Approval Expiry TTL**: User approval tokens expire after 15 minutes, preventing stale replays.

### Interactive Failure Demonstrations
In the **Merchant Control Room** (`/merchant`), merchants can trigger real-time failure demos to audit safeguards:
- **Simulate Spend Limit Breach**: Triggers `/api/merchant/demo/blocked-purchase`, illustrating how Raya refuses to create a Razorpay order when the basket exceeds the spend cap.
- **Simulate Price Spike**: Triggers `/api/merchant/demo/price-spike`, illustrating how Raya detects catalog price tampering and rejects checkout before authorization.

---

## 🔬 Repository Technical Truth & Audit

| Claim / Subsystem | Actual Implementation in Repository | Status |
| :--- | :--- | :--- |
| **Framework** | Next.js 14.2.8 / 14.2.35 (App Router), React 18.3.1, Tailwind CSS 3.4.10, TypeScript 5.5.4 | Verified |
| **Conversational AI** | Google Gemini 1.5 Flash (`gemini-1.5-flash`) with function calling tools in `src/app/api/chat/route.ts` and deterministic fallback | Verified |
| **Payment Integration** | Razorpay Test Mode via `https://api.razorpay.com/v1/orders` and HMAC-SHA256 signature verification in `src/app/api/razorpay/verify` | Verified |
| **Multilingual Engine** | 5 JSON dictionaries (`en`, `hi`, `mr`, `ta`, `bn`) with 337 keys each (100% parity), managed via React Context (`LocaleProvider`) and persisted in `localStorage` | Verified |
| **Merchant Growth System** | Server-side in-memory singleton (`src/lib/merchant-store.ts`) tracking live GMV, orders, active strategy injection, and Decision Ledger | Verified |
| **Connected Stores** | NexusStore, ThreadVault, PixelMart, eBay integrated in `src/lib/gemini.ts` with live eBay search and sample catalog fallbacks | Verified |
| **Database** | Currently uses server-side in-memory state and browser `localStorage`. No external SQL/NoSQL database is connected in this repository. | Honest Scope |

---

## ⚖️ Limitations / Current Scope

To maintain technical honesty and credibility:

### ✅ IMPLEMENTED
- Multilingual Buyer Chat with Google Gemini 1.5 Flash and speech-to-text recognition.
- Multi-catalog search across NexusStore, ThreadVault, PixelMart, and eBay with unified schema ranking.
- In-cart companion cross-sell strategy injection based on active merchant rules.
- 6-Gate server-side purchase control policy enforcement.
- Real Razorpay Test Mode order creation and HMAC-SHA256 cryptographic verification.
- Merchant Control Room with live metrics, attribution evidence, and spend cap slider.
- Merchant Copilot floating drawer with localized telemetry Q&A.
- Automated test suites for multilingual key parity and Track 01 commerce verification.

### ⚠️ SIMULATED / TEST MODE
- **Razorpay Payments**: Operates in Razorpay Test Mode (`rzp_test_...`). If test API credentials hit rate/auth limits, fallback test orders ensure uninterrupted judge demonstrations.
- **Merchant Webhooks**: Telemetry is recorded in the server in-memory store rather than triggering external logistics/warehouse dispatch webhooks.
- **Catalog Fallbacks**: When external bridge microservices or eBay OAuth credentials are absent, verified pre-warmed product catalogs ensure 100% demo reliability.

### 🔮 NOT YET IMPLEMENTED (Future Architecture)
- **Persistent Database**: Integration with PostgreSQL / Prisma / Supabase for distributed persistence across server restarts.
- **Merchant Authentication**: Multi-tenant OAuth 2.0 / RBAC for individual store owners.
- **Razorpay Model Context Protocol (MCP)**: Native integration with Razorpay's AI-ready MCP server for autonomous tool execution.
- **Live Inventory Webhooks**: Two-way stock synchronization with Shopify, WooCommerce, or Magento backends.

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

### 2. Configure Environment Variables (Optional)
Create a `.env.local` file in the root directory:
```env
# Optional: Google Gemini API Key for dynamic AI responses
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Razorpay Test Mode Credentials
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Optional: eBay Developer Credentials
EBAY_CLIENT_ID=your_ebay_client_id
EBAY_CLIENT_SECRET=your_ebay_client_secret
```
*(Note: If environment variables are omitted, the application runs seamlessly using built-in verified test mode defaults and deterministic fallbacks).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3005](http://localhost:3005) for the **Raya Buyer UI**, or [http://localhost:3005/merchant](http://localhost:3005/merchant) for the **Bazaar AI Merchant Control Room**.

### 4. Production Build & Start
```bash
npm run build
npm start
```
