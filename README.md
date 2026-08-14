# AWS Route53 Clone

A highly detailed, functional clone of the AWS Route 53 web application. Built with Next.js 14, FastAPI, and SQLite.

## Features

- **Pixel-perfect AWS UI**: Authentic colors, typography, tables, buttons, and modals.
- **Authentication**: JWT-based session persistence using HTTP-only cookies.
- **Hosted Zones**: Full CRUD operations with instant search and pagination.
- **DNS Records**: Full CRUD operations for A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA, SOA.
- **Bulk Operations**: Bulk delete functionality for records.
- **Routing Policies**: UI support for Simple, Weighted, Latency, Failover, Geolocation.
- **Alias Support**: Toggle records as Aliases to internal AWS resources.
- **SQLite Persistence**: All data is durably stored in a local SQLite file via SQLAlchemy.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS Modules (No Tailwind) — Using strict AWS color tokens and patterns.
- **State Management**: Zustand
- **API Client**: Axios

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite3
- **ORM**: SQLAlchemy
- **Authentication**: JWT (PyJWT), bcrypt (for password hashing)

---

## Setup Instructions

### 1. Backend Setup

```bash
# From the root directory
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Seed the database with a demo account and sample data
python -m backend.seed

# Run the FastAPI server (runs on port 8000)
cd backend
uvicorn main:app --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Run the Next.js development server (runs on port 3000)
npm run dev
```

### 3. Demo Access

Once both servers are running, open your browser to [http://localhost:3000](http://localhost:3000).

- **Email**: `demo@example.com`
- **Password**: `password123`

---

## Architecture & Database Schema

The database uses SQLite with 3 main tables:

1. **Users**
   - Stores email, hashed password, and a mocked 12-digit AWS account ID.
2. **Hosted Zones**
   - Stores domain name, type (Public/Private), and comment.
   - *Note*: `record_count` is computed dynamically via SQL `COUNT` during retrieval to guarantee consistency.
3. **DNS Records**
   - Stores name, type, TTL, routing policy, and values.
   - Values (like IP addresses) and Alias target data are serialized to JSON in SQLite `TEXT` columns.

## API Overview (Swagger UI)

FastAPI automatically generates interactive API documentation. While the backend server is running, navigate to:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

You can explore all endpoints (Auth, Hosted Zones, Records) and their request/response schemas directly in the browser.

---

## Implementation Details

- **Security**: The JWT token is set as an `HttpOnly` cookie. The frontend does not store it in `localStorage`, preventing XSS extraction. The Next.js `middleware.ts` intercepts protected routes and ensures unauthenticated users are redirected to `/login`.
- **Modals & Forms**: The frontend relies extensively on React state and slide-in panels to match the modern AWS Console experience.
- **Mocked Sections**: Links like "Health Checks" and "Traffic Policies" resolve to custom "Coming Soon" placeholder pages designed to maintain the immersion.
