# EngageX AI — AI-Powered Marketing CRM Platform

<div align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-8E75B2?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-Frontend-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  <img src="https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render&logoColor=white" />
</div>

<br/>

> **EngageX AI** is a full-stack, production-ready AI-powered CRM and Marketing OS. It gives marketing teams complete visibility into customer behavior, AI-driven campaign recommendations, journey automation, email/WhatsApp template building, and real-time delivery simulation — all in one platform.

**🌐 Live Demo:** [ai-crm-platform-steel.vercel.app](https://ai-crm-platform-steel.vercel.app)  
**🔗 Backend API:** [ai-crm-backend-upx9.onrender.com](https://ai-crm-backend-upx9.onrender.com)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Architecture](#project-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Full Application Flow](#full-application-flow)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment Guide](#deployment-guide)

---

## 🧠 Overview

EngageX AI is a **Marketing Operating System** designed for modern e-commerce and SaaS teams. It replaces multiple disconnected tools — CRM, campaign manager, email builder, and analytics dashboard — with a single AI-powered workspace.

The platform uses **Google Gemini AI** to:
- Predict customer churn and lifetime value
- Generate personalized campaign messages
- Auto-build audience segments from natural language
- Recommend next-best-actions for each customer
- Simulate multi-channel delivery pipelines

---

## ✨ Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Real-time KPIs, revenue trends, campaign analytics |
| **Customer Intelligence** | 360° customer profiles with AI churn scores and LTV predictions |
| **Purchase History** | Full order intelligence — product performance, revenue trends, repeat buyers |
| **Segments & Audiences** | Rule-based and AI-powered audience segmentation |
| **Campaign Studio** | Multi-channel campaign builder with AI-generated message copy |
| **Journey Builder** | Visual drag-and-drop customer journey automation |
| **AI Command Center** | Natural language → instant campaign. Type a goal, AI executes it |
| **Template Editor** | Drag-and-drop email/WhatsApp template builder with 13 content blocks |
| **Retention Intelligence** | At-risk customer identification and win-back strategy generator |
| **Value Intelligence** | LTV segmentation — VIP, high-value, at-risk revenue analysis |
| **Channel Simulator** | Simulates sent → delivered → opened → clicked → converted pipeline |

---

## 🏗️ Project Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                                  │
│                   React + TypeScript + Vite                          │
│              Hosted on: Vercel (ai-crm-platform-steel.vercel.app)   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │  HTTPS REST API calls
                              │  (Axios / Fetch)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FLASK BACKEND (Python)                          │
│              Hosted on: Render (ai-crm-backend-upx9.onrender.com)   │
│                                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  REST API   │  │  AI Service  │  │  Prediction  │               │
│  │  Routes     │  │  (Gemini)    │  │  Engine      │               │
│  │  /api/*     │  │  /ai/*       │  │  (sklearn)   │               │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘               │
│         │                │                  │                         │
│  ┌──────▼────────────────▼──────────────────▼───────┐               │
│  │              SQLAlchemy ORM                       │               │
│  └──────────────────────┬────────────────────────────┘               │
└─────────────────────────┼───────────────────────────────────────────┘
                          │  TCP Connection
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                                 │
│              Hosted on: Render Managed DB                            │
│   Tables: customers, orders, order_items, campaigns, segments,       │
│           journeys, delivery_events, ai_insights, templates, ...     │
└─────────────────────────────────────────────────────────────────────┘

                          ┌─────────────────────────────┐
                          │    Channel Service           │
                          │  (Delivery Simulator)        │
                          │  Render: ai-crm-channel-     │
                          │  service-ibn7.onrender.com   │
                          │                              │
                          │  Simulates:                  │
                          │  sent → delivered →          │
                          │  opened → clicked →          │
                          │  converted                   │
                          └─────────────────────────────┘
```

### Data Flow Diagram

```
User Action (e.g., "Launch Campaign")
          │
          ▼
  Frontend Component
  (CampaignStudio.tsx)
          │
          │ POST /api/campaigns/{id}/send
          ▼
  Flask Route Handler
  (routes/__init__.py)
          │
          ├──► SQLAlchemy → Create Message records in DB
          │
          └──► HTTP POST → Channel Service /send
                              │
                              ▼
                    Channel Simulator
                    (async thread)
                              │
                    Simulate Delivery Timeline:
                    0.1s  → "sent"
                    0.3s  → "delivered"
                    0.6s  → "opened"  (40-80% prob)
                    1.0s  → "clicked" (15-30% prob)
                    2.0s  → "converted" (10% prob)
                              │
                              │ POST /api/webhooks/status
                              ▼
                    Flask Webhook Handler
                    Updates DeliveryEvent in DB
                              │
                              ▼
                    Frontend polls /api/delivery-status
                    Updates real-time campaign metrics
```

### AI Intelligence Flow

```
Customer Data in DB
       │
       ▼
Prediction Engine (scikit-learn)
  ├─ Churn Score (0.0 → 1.0)
  ├─ LTV Prediction ($)
  └─ Segment Classification
       │
       ▼
AI Service (Google Gemini 2.5 Flash)
  ├─ /ai/dashboard-insights  → KPI summaries & alerts
  ├─ /ai/workspace-insights  → Strategic recommendations
  ├─ /ai/customer/{id}       → Personal next-best-action
  ├─ /ai/journey/generate    → Auto-generate journey nodes
  ├─ /ai/segment/suggest     → Audience building from text
  ├─ /ai/campaign/message    → Personalized message copy
  └─ /ai/command-center      → NL → Campaign (end-to-end)
       │
       ▼
Stored as AIInsight records in DB
Served to frontend on demand
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client |
| **Recharts** | Data visualization |
| **Lucide React** | Icon library |
| **Vanilla CSS** | Custom styling |

### Backend
| Technology | Purpose |
|------------|---------|
| **Flask 3.0** | Web framework |
| **Flask-SQLAlchemy** | ORM & DB management |
| **Flask-JWT-Extended** | Authentication |
| **Flask-CORS** | Cross-origin requests |
| **Flask-Migrate** | Database migrations |
| **Gunicorn** | WSGI production server |
| **Google Gemini AI** | LLM for AI features |
| **scikit-learn** | ML predictions (churn, LTV) |
| **NumPy** | Numerical computing |
| **psycopg2** | PostgreSQL adapter |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting (CDN + SSL) |
| **Render (Web Service)** | Backend API hosting |
| **Render (PostgreSQL)** | Managed database |
| **Render (Web Service)** | Channel simulator service |

---

## 📁 Project Structure

```
ai_crm/
├── frontend/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── components/          # All page components
│   │   │   ├── Dashboard.tsx           # Main KPI dashboard
│   │   │   ├── CustomerIntelligence.tsx # Customer 360° view
│   │   │   ├── PurchaseHistory.tsx     # Order analytics
│   │   │   ├── CampaignStudio.tsx      # Campaign builder
│   │   │   ├── JourneyBuilder.tsx      # Visual journey editor
│   │   │   ├── AICommandCenter.tsx     # NL → Campaign
│   │   │   ├── Templates.tsx           # Template library
│   │   │   ├── TemplateEditor.tsx      # Drag-drop email builder
│   │   │   ├── AudiencesHub.tsx        # Segment management
│   │   │   ├── ABTesting.tsx           # A/B test framework
│   │   │   ├── RetentionIntelligence.tsx # Churn prevention
│   │   │   ├── ValueIntelligence.tsx   # LTV analysis
│   │   │   └── ...
│   │   ├── config.ts            # API base URL config
│   │   ├── App.tsx              # Router & layout
│   │   └── main.tsx             # Entry point
│   ├── vercel.json              # SPA routing config for Vercel
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                     # Flask Python backend
│   ├── app/
│   │   ├── __init__.py          # App factory (create_app)
│   │   ├── config.py            # Config (DB URI, keys)
│   │   ├── models/              # SQLAlchemy ORM models
│   │   │   └── (Customer, Order, Campaign, Segment,
│   │   │       Journey, Template, AIInsight, etc.)
│   │   ├── routes/
│   │   │   ├── __init__.py      # Main API routes (2300+ lines)
│   │   │   └── command_center.py # AI Command Center routes
│   │   └── services/
│   │       ├── ai_service.py    # Gemini AI integration
│   │       └── prediction_service.py # ML churn/LTV engine
│   ├── db/
│   │   └── seed.py              # Database seeder (150 customers)
│   ├── wsgi.py                  # Gunicorn entry point
│   └── requirements.txt
│
├── channel-service/             # Delivery simulator microservice
│   ├── app.py                   # Flask app simulating delivery
│   └── requirements.txt
│
└── README.md
```

---

## 🔄 Full Application Flow

### 1. User Onboarding & Authentication
```
User visits site → Mock login (email + password)
→ JWT token issued → Stored in memory
→ All API calls include Authorization header
```

### 2. Dashboard Load
```
Dashboard.tsx mounts
→ GET /api/ai/dashboard-insights  (AI KPIs)
→ GET /api/ai/workspace-insights  (Strategic alerts)
→ GET /api/analytics              (Revenue, engagement data)
→ Renders: Total customers, revenue, campaigns, journey stats
```

### 3. Customer Intelligence Flow
```
Customer list loads
→ GET /api/customers?page=1&filter=all
→ ML Prediction Engine scores each customer:
    - Churn Score (0.0 = loyal, 1.0 = about to leave)
    - LTV Prediction ($)
    - AI Recommendation (campaign type)
→ Click customer → GET /api/customers/{id}
→ Gemini AI generates personalized next-best-action
→ One-click: "Execute" → Creates 1-to-1 campaign
    → POST /api/customers/{id}/action
    → Channel Service simulates delivery
    → Real-time status polling: Pending → Sent → Delivered → Opened
```

### 4. Campaign Studio Flow
```
Create Campaign → Select audience segment
→ AI generates message copy (Gemini)
→ Choose channel (Email / WhatsApp / SMS)
→ Set schedule
→ Launch Campaign
    → POST /api/campaigns/{id}/send
    → For each customer in segment:
        - Create Message record in DB
        - POST to Channel Service: { message_id, channel, recipient }
    → Channel Service simulates async delivery timeline
    → Webhook callbacks update delivery_events table
    → Campaign metrics update in real-time
```

### 5. Journey Builder Flow
```
Open Journey Builder
→ AI auto-generates journey from prompt (Gemini)
→ Visual node editor (drag & drop):
    Nodes: Trigger → Wait → Send Email → Branch → Exit
→ Save as Draft or Launch as Active
→ GET /api/journeys → Lists all active journeys
→ Journey Analytics: per-node conversion rates
```

### 6. AI Command Center Flow
```
User types: "Re-engage customers who haven't bought in 60 days"
→ POST /api/command-center/process
→ Gemini interprets intent:
    - SQL filter: "last_purchase_date < NOW() - INTERVAL '60 days'"
    - Segment name: "Inactive 60-Day Customers"
    - Campaign message: personalized win-back copy
    - Channel: Email
    - Expected revenue: $X
→ Creates: Segment + Campaign + Journey (all at once)
→ User reviews → POST /api/command-center/launch
→ Executes immediately across all matched customers
```

### 7. Template Editor Flow
```
Templates library → Create / Select template
→ Template Editor loads with 13 block types:
    Text, Image, Button, Header, Footer,
    Coupon, Divider, Spacer, Product Grid,
    Recommendations, Social Links, Video, Countdown Timer
→ Drag & Drop blocks onto canvas
→ Click block → Edit content / styling in right panel
→ AI Rewriter: "Make it professional" → Gemini rewrites text
→ AI Image Generator: Pollinations.ai generates images from prompt
→ Preview in Desktop / Tablet / Mobile
→ Save → POST /api/templates/{id}
```

---

## 📡 API Reference

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List all customers (paginated + filtered) |
| GET | `/api/customers/{id}` | Full customer profile with AI recommendation |
| POST | `/api/customers/{id}/action` | Execute 1-to-1 campaign action |
| GET | `/api/customers/{id}/delivery-status` | Real-time delivery tracking |

### Orders / Purchase History
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Order list with KPIs (total, revenue, AOV, RPR) |
| GET | `/api/purchase-insights` | Product & category performance |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns |
| POST | `/api/campaigns` | Create campaign |
| POST | `/api/campaigns/{id}/send` | Launch campaign to all audience |
| GET | `/api/campaigns/{id}/metrics` | Delivery metrics (open, click rates) |

### AI Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/dashboard-insights` | AI KPI analysis |
| GET | `/api/ai/workspace-insights` | Strategic recommendations |
| POST | `/api/ai/journey/generate` | Generate journey from prompt |
| POST | `/api/ai/segment/suggest` | Suggest segment from natural language |
| POST | `/api/ai/campaign/message` | Generate campaign message copy |
| POST | `/api/templates/ai-rewrite` | AI rewrite a template block |
| POST | `/api/templates/ai-generate` | Generate full template from prompt |

### Segments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/segments` | List all segments |
| POST | `/api/segments` | Create segment with filters |
| GET | `/api/segments/{id}/customers` | Customers matching segment |

### AI Command Center
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/command-center/process` | NL → Segment + Campaign plan |
| POST | `/api/command-center/launch` | Execute the generated strategy |

### Journeys & Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/journeys` | List journeys |
| POST | `/api/journeys` | Create journey |
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create template |
| PUT | `/api/templates/{id}` | Update template |
| DELETE | `/api/templates/{id}` | Delete template |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/status` | Receive delivery status from channel service |

---

## 🔐 Environment Variables

### Backend (Render Web Service)
```env
DATABASE_URI=postgresql://user:password@host/dbname
GEMINI_API_KEY=your_google_gemini_api_key
CHANNEL_SERVICE_URL=https://your-channel-service.onrender.com
SECRET_KEY=your_flask_secret_key
JWT_SECRET_KEY=your_jwt_secret_key
```

### Frontend (Vercel)
```env
VITE_API_URL=https://your-backend.onrender.com/api
```

### Channel Service (Render Web Service)
```env
BACKEND_URL=https://your-backend.onrender.com
```

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL (or SQLite for local dev)

### 1. Clone the repository
```bash
git clone https://github.com/somya-agarwal2/AI_CRM_Platform.git
cd AI_CRM_Platform
```

### 2. Setup Backend
```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Add your GEMINI_API_KEY to .env

# Seed database
python db/seed.py

# Start backend (runs on port 5000)
python app.py
```

### 3. Setup Channel Service (optional)
```bash
cd channel-service
pip install -r requirements.txt
python app.py    # runs on port 5001
```

### 4. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "VITE_API_URL=http://localhost:5000/api" > .env.local

# Start dev server (runs on port 5173)
npm run dev
```

### 5. Open the app
Visit: `http://localhost:5173`

---

## 🚀 Deployment Guide

### Frontend → Vercel

1. Push code to GitHub
2. Import repository in [vercel.com](https://vercel.com)
3. Set **Root Directory**: `frontend`
4. Set **Build Command**: `npm run build`
5. Set **Output Directory**: `dist`
6. Add environment variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com/api`
7. Deploy

> **Important:** The `frontend/vercel.json` ensures React Router works on direct URL access.

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn wsgi:app`
4. Add environment variables:
   - `DATABASE_URI` = your PostgreSQL connection string
   - `GEMINI_API_KEY` = your Google AI Studio key
   - `CHANNEL_SERVICE_URL` = your channel service URL

### PostgreSQL → Render

1. Create a new **PostgreSQL** database on Render
2. Copy the **Internal Database URL**
3. Paste it as `DATABASE_URI` in your backend web service

### Channel Service → Render

1. Create another **Web Service** on Render
2. **Root Directory**: `channel-service`
3. **Start Command**: `gunicorn app:app`
4. Add environment variable:
   - `BACKEND_URL` = your backend URL

### Seed Production Database
After all services are deployed, seed the production database:
```bash
# Set DATABASE_URI to your Render PostgreSQL URL
$env:DATABASE_URI="postgresql://..."
cd backend
python db/seed.py
```

---

## 🔑 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Flask over Django** | Lightweight, flexible routing for an API-first backend |
| **SQLAlchemy ORM** | Database-agnostic (SQLite locally, PostgreSQL in production) |
| **Gemini 2.5 Flash** | Fast, cost-effective LLM for real-time AI responses |
| **Channel Microservice** | Decoupled delivery simulation — replaceable with real Twilio/SendGrid |
| **scikit-learn on-server** | Real ML predictions without external ML APIs |
| **Vite + React** | Fast HMR, optimized builds, TypeScript out of the box |
| **Vercel + Render** | Zero-config deployment, free tiers for portfolio/demo use |

---

## 📸 Screenshots

| Dashboard | Customer Intelligence |
|-----------|----------------------|
| Real-time KPIs, revenue charts | AI churn scores, 360° profiles |

| Campaign Studio | Journey Builder |
|----------------|----------------|
| Multi-channel campaign creation | Visual drag-and-drop automation |

| AI Command Center | Template Editor |
|-------------------|----------------|
| Natural language → full campaign | 13-block drag-and-drop email builder |

---

## 👩‍💻 Author

**Somya Agarwal**  
B.Tech Student, ABES Engineering College  
[GitHub](https://github.com/somya-agarwal2)

