"""WebSocket chat handler — streaming AI responses with RAG context."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from websocket.manager import ws_manager
from services.llm_service import llm_service
from memory.session_memory import session_memory
import json
import logging
import uuid
import asyncio

logger = logging.getLogger("nexus.ws.chat")

router = APIRouter()


async def fetch_rag_context(query: str, enabled: bool = True) -> list:
    """Retrieve relevant code context from the RAG pipeline."""
    if not enabled:
        return []
    try:
        from rag.retriever import code_retriever
        results = await code_retriever.search(query, top_k=5)
        if results:
            logger.info(f"RAG retrieved {len(results)} chunks for: {query[:50]}...")
        return results
    except Exception as e:
        logger.warning(f"RAG retrieval failed: {e}")
        return []


@router.websocket("/ws/chat/{session_id}")
async def chat_websocket(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for streaming AI chat responses with RAG."""
    await ws_manager.connect(websocket, f"chat:{session_id}")
    logger.info(f"Chat WebSocket connected: session={session_id}")

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "chat_message":
                user_content = message.get("content", "")
                rag_enabled = message.get("ragEnabled", True)
                model_override = message.get("model")
                if not user_content.strip():
                    continue

                # Store user message
                user_msg = {
                    "id": f"msg-{uuid.uuid4().hex[:12]}",
                    "role": "user",
                    "content": user_content,
                }
                await session_memory.append_message(session_id, user_msg)

                # Send acknowledgment
                await ws_manager.send_json(websocket, {
                    "type": "message_ack",
                    "data": user_msg,
                })

                # Fetch RAG context if enabled
                rag_context = []
                if rag_enabled:
                    # Strip @codebase tag for the search query
                    search_query = user_content.replace("@codebase", "").strip()
                    rag_context = await fetch_rag_context(search_query)

                    # Notify frontend about retrieved context
                    if rag_context:
                        await ws_manager.send_json(websocket, {
                            "type": "rag_context",
                            "data": {
                                "count": len(rag_context),
                                "sources": [
                                    {
                                        "file": ctx.get("metadata", {}).get("file_path", ""),
                                        "startLine": ctx.get("metadata", {}).get("start_line", 0),
                                        "endLine": ctx.get("metadata", {}).get("end_line", 0),
                                        "symbols": ctx.get("metadata", {}).get("symbols", []),
                                        "score": ctx.get("score", 0),
                                    }
                                    for ctx in rag_context[:5]
                                ],
                            },
                        })

                # Build conversation history
                history = await session_memory.get_messages(session_id, limit=20)
                messages = [{"role": m["role"], "content": m["content"]} for m in history]

                # Start streaming response
                assistant_id = f"msg-{uuid.uuid4().hex[:12]}"
                await ws_manager.send_json(websocket, {
                    "type": "stream_start",
                    "data": {
                        "id": assistant_id,
                        "role": "assistant",
                        "ragUsed": len(rag_context) > 0,
                    },
                })

                # Stream tokens from LLM (with RAG context)
                full_response = ""
                try:
                    async for token in llm_service.stream_generate(
                        messages,
                        rag_context=rag_context if rag_context else None,
                        model=model_override,
                    ):
                        full_response += token
                        await ws_manager.send_json(websocket, {
                            "type": "stream_token",
                            "data": {"id": assistant_id, "token": token},
                        })
                        # Small delay to prevent overwhelming the client
                        await asyncio.sleep(0.01)
                except Exception as e:
                    logger.error(f"Streaming error: {e}")
                    full_response += f"\n\n⚠️ Error: {str(e)}"

                # Send stream end
                await ws_manager.send_json(websocket, {
                    "type": "stream_end",
                    "data": {"id": assistant_id, "content": full_response},
                })

                # Store assistant message
                await session_memory.append_message(session_id, {
                    "id": assistant_id,
                    "role": "assistant",
                    "content": full_response,
                })

            elif message.get("type") == "rag_search":
                # Direct RAG search request
                query = message.get("query", "")
                if query.strip():
                    results = await fetch_rag_context(query)
                    await ws_manager.send_json(websocket, {
                        "type": "rag_results",
                        "data": {
                            "query": query,
                            "results": [
                                {
                                    "content": r["content"][:200],
                                    "file": r.get("metadata", {}).get("file_path", ""),
                                    "score": r.get("score", 0),
                                    "symbols": r.get("metadata", {}).get("symbols", []),
                                }
                                for r in results
                            ],
                        },
                    })

            elif message.get("type") == "ping":
                await ws_manager.send_json(websocket, {"type": "pong"})

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, f"chat:{session_id}")
        logger.info(f"Chat WebSocket disconnected: session={session_id}")
    except Exception as e:
        logger.error(f"Chat WebSocket error: {e}")
        ws_manager.disconnect(websocket, f"chat:{session_id}")
