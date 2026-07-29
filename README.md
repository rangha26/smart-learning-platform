# Smart Learning Platform

A full-stack learning platform starter with a React/Vite frontend and a backend service containerized with Docker.

## Overview

This project includes:
- A modern frontend built with React, Vite, Tailwind CSS, and shadcn/ui-inspired components
- A reusable API client using Axios with request interceptors
- A basic dashboard layout with sidebar, header, and route-based pages
- Docker support for both frontend and backend services

## Project structure

```text
smart-learning-platform/
├── backend/
│   └── Dockerfile
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- Docker and Docker Compose

## Frontend setup

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the app at:
   ```text
   http://localhost:5173
   ```

### Frontend scripts

```bash
npm run dev
npm run build
npm run preview
```

## Backend setup

The backend service can be built and started with Docker Compose:

```bash
docker compose up --build
```

## Docker

### Run all services

```bash
docker compose up --build
```

### Stop services

```bash
docker compose down
```

## Notes

- The frontend uses Axios from [frontend/src/services/axios.js](frontend/src/services/axios.js) for API requests.
- The dashboard supports basic routes for Overview, Courses, and Students.
- Tailwind and a shadcn-style UI setup are already integrated in the frontend.
