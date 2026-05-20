---
title: NexusIDE Backend
emoji: 🚀
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 8000
pinned: false
---

# NexusIDE Backend

This is the FastAPI backend for NexusIDE, deployed on Hugging Face Spaces.

## Hugging Face Space Configuration
- **SDK**: Docker
- **Port**: 8000

## Environment Variables to set in HF Space Settings:
1. `DATABASE_URL` = `postgresql+asyncpg://postgres:YX0IuT1DMkA04Z48@db.fvvknbzkjdohmeobuehe.supabase.co:5432/postgres`
2. `VLLM_URL` = (Your vLLM / Together AI / LLM endpoint URL)
3. `VLLM_MODEL` = (Model name, e.g. `Qwen/Qwen3-35B-A3B`)
4. `VLLM_API_KEY` = (Your LLM API Key)
5. `LLM_PROVIDER` = `vllm` (or `ollama` if using tunnel)
6. `JWT_SECRET` = (A random 64-char string)
7. `CORS_ORIGINS` = `https://your-frontend.vercel.app,http://localhost:3000`
