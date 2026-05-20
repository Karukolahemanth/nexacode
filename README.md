# ⚡ NexusCode — AI-Powered IDE

> A private, self-hosted AI coding platform with real-time code generation, semantic search, and autonomous coding agents.

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://vercel.com)
[![Backend](https://img.shields.io/badge/Backend-HuggingFace%20Spaces-yellow?logo=huggingface)](https://huggingface.co/spaces)
[![Database](https://img.shields.io/badge/Database-Supabase-green?logo=supabase)](https://supabase.com)
[![Model](https://img.shields.io/badge/Model-Qwen3--35B-blue)](https://huggingface.co/Qwen)

---

## 🏗️ Architecture

```
┌─────────────────────┐     ┌──────────────────────────┐
│  Frontend (Next.js) │────▶│  Backend (FastAPI)        │
│  Vercel             │     │  Hugging Face Spaces      │
└─────────────────────┘     └──────────┬───────────────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 ▼                      ▼                       ▼
        ┌───────────────┐    ┌──────────────────┐   ┌─────────────────┐
        │   Supabase    │    │   vLLM / Together │   │   Qdrant        │
        │  PostgreSQL   │    │   AI / Groq       │   │  Vector DB      │
        └───────────────┘    └──────────────────┘   └─────────────────┘
```

## 🚀 Features

- **Monaco Editor** — VS Code-grade editing experience
- **AI Chat** — Streaming responses from Qwen3-35B
- **RAG Search** — Semantic code search across your codebase
- **Autonomous Agents** — LangGraph-powered coding agents
- **Real Auth** — JWT + Supabase PostgreSQL
- **Multi-Workspace** — Manage multiple projects

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Monaco Editor, Zustand |
| Backend | FastAPI, SQLAlchemy, asyncpg |
| Database | Supabase (PostgreSQL) |
| AI/LLM | vLLM / Together AI / Groq (OpenAI-compatible) |
| Auth | JWT (python-jose + bcrypt) |
| Deployment | Vercel (frontend) + HuggingFace Spaces (backend) |

## ⚙️ Environment Variables

### Backend (HuggingFace Space Secrets)
| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL URL |
| `VLLM_URL` | LLM endpoint (Together AI / RunPod / Groq) |
| `VLLM_MODEL` | Model name e.g. `Qwen/Qwen3-35B-A3B` |
| `VLLM_API_KEY` | LLM API key |
| `JWT_SECRET` | Random 64-char secret for token signing |
| `CORS_ORIGINS` | Comma-separated allowed origins |

### Frontend (Vercel Environment Variables)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | HuggingFace Space URL |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL (same host, `wss://`) |
| `BACKEND_URL` | Same as above (server-side) |

## 📦 Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your values
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
cp .env.local.example .env.local   # fill in your values
npm run dev
```

## 🌐 Deployment

- **Backend** → [Hugging Face Spaces (Docker SDK)](https://huggingface.co/spaces)
- **Frontend** → [Vercel](https://vercel.com) (import `frontend/` folder)

---

Made with ❤️ — NexusCode
