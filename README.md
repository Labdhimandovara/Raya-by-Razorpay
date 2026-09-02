# ⚡ Raya by Razorpay — Autonomous AI Shopping Agent

Raya is a next-generation conversational shopping agent built for **NexusStore**, powered by **Razorpay** and **Google Gemini 2.5 Flash** with autonomous tool calling.

---

## 🚀 Key Features

* **⚡ Google Gemini Autonomous Tool Calling**: Intercepts and executes function calls (`listProducts`, `viewCart`, `addToCart`, `checkoutOrder`, `getOrderHistory`) against your live store.
* **🛍️ Generative UI Catalog Cards**: Renders interactive product cards with prices in ₹, stock counts, and 1-click add-to-cart buttons directly inside message bubbles.
* **🛒 Slide-out Live Cart Drawer**: Real-time cart state with quantity modifiers and order subtotals.
* **💳 Razorpay Order Receipts**: Displays instant order confirmations with tracking status, delivery address, and payment safety authorization badges.
* **🛡️ Bounded Purchase Policies**: Pre-approved spend limits and merchant validation safeguards.

---

## 🛠️ Architecture

```
User in Raya UI (Next.js on Vercel)
        │
        ▼ POST /api/chat
Next.js Serverless Edge Handler
        │
        ├──► 1. Calls Google Gemini 2.5 Flash with Tools Schema
        │
        ├──► 2. Catches Gemini `functionCall` (e.g. listProducts, checkoutOrder)
        │
        ├──► 3. Executes request against NexusStore Bridge Gateway
        │
        └──► 4. Feeds tool result back to Gemini ➔ Returns natural text + Generative UI widgets
```

---

## ⚙️ Environment Variables

Create `.env.local` or configure in your **Vercel Dashboard** under **Project Settings → Environment Variables**:

| Variable | Example Value | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `AIzaSy...` | Your Google Gemini API Key |
| `NEXUS_STORE_BRIDGE_URL` | `https://bazaar-ai-lm2z.onrender.com/bazaar` | Your live NexusStore / Bazaar Bridge Gateway |
| `NEXT_PUBLIC_APP_NAME` | `Raya by Razorpay` | App title |
| `NEXT_PUBLIC_DEFAULT_BUDGET` | `15000` | Pre-approved limit in ₹ |

---

## 🚢 Quick Deploy to Vercel

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit for Raya by Razorpay"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/Raya-by-Razorpay.git
   git push -u origin main
   ```

2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Click **"Import Project"** and select **`Raya-by-Razorpay`**.
4. Add the `GEMINI_API_KEY` and `NEXUS_STORE_BRIDGE_URL` under Environment Variables.
5. Click **Deploy**! 🚀
