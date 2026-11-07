# Sweety – Blood Glucose Tracker 🩺

A clean, responsive web application designed for diabetes patients to record up to 4 daily blood glucose readings, track their health progress, and view daily, month-to-date, and monthly clinical reports.

Built with **Node.js + Express**, **PostgreSQL**, and **React (Vite + Tailwind CSS)**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start Guide](#quick-start-guide)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Start PostgreSQL Database](#2-start-postgresql-database)
  - [3. Environment Configuration](#3-environment-configuration)
  - [4. Install Dependencies](#4-install-dependencies)
  - [5. Database Schema & Seed Data](#5-database-schema--seed-data)
  - [6. Run the App](#6-run-the-app)
- [Running Automated Tests](#running-automated-tests)
- [Demo Credentials](#demo-credentials)
- [API Documentation](#api-documentation)
- [Validation Rules](#validation-rules)
- [Project Structure](#project-structure)
- [Developer Notes & Assumptions](#developer-notes--assumptions)

---

## Features

### 1. Authentication & Security
- Secure registration and login using **bcrypt** password hashing (10 salt rounds).
- **JWT (JSON Web Token)** authentication stored securely.
- Strict multi-tenant isolation: users can only view, edit, or delete their own readings.

### 2. Blood Glucose Tracking
- Record up to **4 readings per day** across standard diabetes monitoring slots:
  - `Morning (fasting)`
  - `After breakfast`
  - `After lunch`
  - `After dinner`
- Full CRUD: Add, View, Edit, and Delete readings.
- Real-time client and server validation with exact user-friendly error banners.

### 3. Clinical Reports & Analytics
- **Daily Report**: Focuses on the selected date, calculating highest, lowest, average reading (rounded to 1 decimal place), and reading count. Lists each reading with its specific time slot.
- **Month-to-Date Report**: Calculates stats from the 1st of the month up to the selected date (e.g. `1 Oct – 15 Oct 2026`).
- **Monthly Report**: Calculates stats for the entire previous calendar month (e.g. `1 Sep – 30 Sep 2026`).
- Friendly, warm **Empty State** when no data is recorded for a period.

### 4. Included Bonuses
- 📈 **Interactive Trends Chart**: Responsive line chart powered by Recharts with normal target zones (70 – 140 mg/dl).
- 🐳 **Dockerized Database**: Ready-to-go `docker-compose.yml` for PostgreSQL.
- 🧪 **Comprehensive Automated Testing**:
  - Backend integration tests with Jest & Supertest (20/20 tests passing).
  - Frontend component & validation tests with Vitest & React Testing Library (5/5 tests passing).
- ⚡ **Pagination**: `GET /api/readings?page=1&limit=20` with total count, page, and limit metadata.
- 🌱 **Automated Seed Script**: Generates a demo patient with realistic fasting and post-meal records over 45 days.

---

## Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL (`pg` connection pool), bcryptjs, jsonwebtoken, cors, morgan.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React (accessible medical iconography), Recharts.
- **Testing**: Jest, Supertest, Vitest, React Testing Library, JSDOM.
- **Containerization**: Docker & Docker Compose (PostgreSQL 16 Alpine).

---

## Prerequisites

- **Node.js**: v18 or later
- **npm**: v9 or later
- **Docker & Docker Compose** (or a local PostgreSQL instance running on port 5432)

---

## Quick Start Guide

### 1. Clone Repository

```bash
git clone https://github.com/your-username/sweety-blood-glucose-tracker.git
cd sweety-blood-glucose-tracker
```

### 2. Start PostgreSQL Database

Use Docker to spin up PostgreSQL instantly:

```bash
docker compose up -d postgres
```

> **Note**: If you already have PostgreSQL installed locally, create a database named `sweety_db` and adjust the credentials in `server/.env`.

### 3. Environment Configuration

Copy the example environment files:

```bash
# In the root directory:
cp .env.example .env

# And inside the server directory:
cp server/.env.example server/.env
```

Default configuration in `server/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgrespassword@localhost:5432/sweety_db
JWT_SECRET=super-secret-sweety-jwt-key-replace-in-production
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

### 4. Install Dependencies

You can install all root, backend, and frontend dependencies with one command:

```bash
npm run install:all
```

Or install separately:
```bash
cd server && npm install
cd ../client && npm install
```

### 5. Database Schema & Seed Data

Initialize tables and seed demo readings:

```bash
npm run init-db
npm run seed
```

This will automatically create the `users` and `readings` tables and seed a realistic 45-day history for the demo patient.

### 6. Run the App

Start both the backend API and frontend dev server concurrently:

```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Demo Credentials

You can sign in immediately using the one-click demo button on the login screen or enter:

- **Email**: `demo@sweety.app`
- **Password**: `password123`

You can also sign up with any new account to verify fresh empty states and multi-tenant isolation.

---

## Running Automated Tests

Run the full end-to-end test suite:

```bash
npm test
```

### Backend Tests (Jest + Supertest)
```bash
npm run test:server
```
Runs 20 automated tests validating:
- Registration, password hashing, and duplicate email prevention.
- JWT login and 401 unauthorized checks.
- Exact validation error responses.
- Database unique constraints and 4-reading limit.
- Multi-tenant data segregation.
- Daily, Month-to-date, and Monthly report aggregations.
- Pagination params.

### Frontend Tests (Vitest + React Testing Library)
```bash
npm run test:client
```
Runs 5 component tests verifying:
- Modal rendering and input controls.
- Value required error: `"Please enter a glucose value."`.
- Whole number between 40 and 600 error: `"Value must be between 40 and 600 mg/dl."`.
- Future date error: `"Date cannot be in the future."`.
- Successful form submission with valid payload.

---

## Validation Rules

| Rule | Trigger Condition | Exact Error Message |
|---|---|---|
| **Value is required** | Input left empty | `"Please enter a glucose value."` |
| **Value in range** | Non-integer, `< 40`, or `> 600` | `"Value must be between 40 and 600 mg/dl."` |
| **Slot uniqueness** | Duplicate slot on same date | `"You already have an After lunch reading for this date."` |
| **Daily limit** | Attempting 5th reading on a date | `"You can add only 4 readings per day."` |
| **No future dates** | Date is after current local date | `"Date cannot be in the future."` |

---

## API Documentation

### Auth
- `POST /api/auth/register` - Create account `{ name, email, password }`
- `POST /api/auth/login` - Authenticate `{ email, password }`
- `GET /api/auth/me` - Get profile (Bearer token)

### Readings (Protected)
- `GET /api/readings` - List user readings (supports `?page=1&limit=20`, `?date=YYYY-MM-DD`, `?startDate=...&endDate=...`)
- `POST /api/readings` - Add new reading `{ date, slot, value }`
- `GET /api/readings/:id` - Fetch single reading
- `PUT /api/readings/:id` - Update reading `{ date, slot, value }`
- `DELETE /api/readings/:id` - Delete reading

### Reports (Protected)
- `GET /api/reports?date=YYYY-MM-DD` - Get Daily, Month-to-date, and Monthly reports together
- `GET /api/reports/daily?date=YYYY-MM-DD` - Get daily report with slot list
- `GET /api/reports/month-to-date?date=YYYY-MM-DD` - Get month-to-date report
- `GET /api/reports/monthly?date=YYYY-MM-DD` - Get previous calendar month report

---

## Project Structure

```text
sweety-blood-glucose-tracker/
├── docker-compose.yml          # PostgreSQL container definition
├── package.json                # Root scripts (concurrently, tests, seed)
├── .env.example                # Sample environment configuration
├── server/
│   ├── src/
│   │   ├── config/db.js        # PostgreSQL pool configuration
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── readingsController.js
│   │   │   └── reportsController.js
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT verification middleware
│   │   ├── models/
│   │   │   └── schema.sql      # PostgreSQL DDL with constraints
│   │   ├── routes/             # Express route definitions
│   │   ├── scripts/
│   │   │   ├── initDb.js       # Table initialization runner
│   │   │   └── seed.js         # Realistic demo seed generator
│   │   ├── utils/
│   │   │   └── dateHelpers.js  # Date range & timezone helpers
│   │   ├── app.js              # Express app setup (for testing)
│   │   └── index.js            # Server entrypoint
│   └── tests/
│       └── api.test.js         # 20 Supertest integration tests
└── client/
    ├── src/
    │   ├── api/client.js       # Typed fetch wrapper & endpoints
    │   ├── components/         # Navbar, StatsCard, ReadingModal, LineChartCard, EmptyState
    │   ├── context/AuthContext # Auth state provider & persistent session
    │   ├── pages/              # DashboardPage, ReportsPage, LoginPage, RegisterPage
    │   ├── test/               # RTL unit tests for ReadingModal
    │   └── utils/formatters.js # Date, slot & glucose status formatters
    ├── vite.config.js
    └── tailwind.config.js
```

---

## Developer Notes & Assumptions

A few candid notes on the decisions made while building Sweety:

1. **Date Storage & Timezones**:
   - In diabetes care, a reading belongs to a patient's local calendar day (e.g., "my fasting reading on Nov 7"), not a floating UTC instant that might shift to the previous evening if stored with timezone offsets.
   - For that reason, `reading_date` is stored as a SQL `DATE` type (`YYYY-MM-DD`) and returned explicitly via `TO_CHAR(reading_date, 'YYYY-MM-DD')`. This completely avoids common off-by-one errors when serializing between Node and the browser.

2. **Database Constraints vs Application Validation**:
   - I added a composite unique constraint `UNIQUE (user_id, reading_date, slot)` at the PostgreSQL level. This guarantees data integrity even if two concurrent requests hit the server at the exact same millisecond.
   - However, the application layer checks the conditions first so that we return friendly messages matching the assignment guidelines (e.g. `"You already have an After lunch reading for this date."` and `"You can add only 4 readings per day."`).

3. **Defining the 3 Report Windows**:
   - **Daily**: The selected reference date.
   - **Month-to-Date**: Day 1 of the selected month up to and including the selected date.
   - **Monthly**: Defined as the complete previous calendar month relative to the selected reference date. For example, if a user inspects October 15, the monthly report evaluates September 1 to September 30.

4. **UI Design for Diabetic Patients**:
   - Many people tracking blood sugar prefer large, legible numbers and immediate visual feedback. I included clinical status pills (`Normal` in emerald, `Elevated` in orange, `High` in rose, `Low` in amber) based on standard clinical thresholds (<70, 70–140, 141–180, >180 mg/dl).
   - I also added an interactive Recharts line chart so trends across the month are instantly clear without squinting through raw tables.

5. **What I would tackle with more time**:
   - **CSV / PDF Export**: Patients regularly need to export their 30-day log to show their endocrinologist. An export button generating a clean PDF report would be high on my list.
   - **Insulin & Carb Logging**: While glucose is the primary number, attaching rapid-acting insulin units or a brief meal note (e.g. "oatmeal + berries") gives doctors much better context for unexpected spikes.
   - **PWA / Offline Support**: Adding a Service Worker and IndexedDB queue so patients can log readings even when they are offline on a flight or in low-signal areas, syncing once reconnected.
   - **Redis Report Caching**: Caching monthly report aggregates for long date spans, using a cache tag invalidated whenever a reading is added, modified, or deleted for that user.
