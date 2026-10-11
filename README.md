# 0 to Shipped — Resume Parser

A full-stack resume matching app that compares a PDF resume against a job description and scores the fit.

## Project structure

- `frontend/` — React + Vite application
- `backend/` — Express API with MongoDB integration

## Features

- Upload a resume as a PDF
- Paste a job description
- Extract text from the PDF and compare tracked skills found in the job description
- Score the percentage of tracked JD skills found in the resume and show matched vs missing skills
- Store comparison records in MongoDB when configured

Matching is a basic, non-AI skill comparison. If no tracked skills are detected in the JD, the app prompts the user to add supported technical skills rather than scoring against an unrelated default list. AI scoring is not enabled yet.

## Quick start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Update the MongoDB connection string in `backend/.env` if you want to persist comparison records.

## Environment

The backend loads environment variables from `backend/.env`:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/zero-to-shipped
```

The frontend is configured with a Vite dev proxy to talk to the backend on port 5000.

## Notes

This is the non-AI version of the product. The AI enhancement can be added later on top of the same API and scoring flow.
