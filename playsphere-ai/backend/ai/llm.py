"""
LLM client — Python port of backend/ai/llm.ts
Calls any OpenAI-compatible chat completions endpoint (e.g., Groq).
"""
from __future__ import annotations
import asyncio
import os
import httpx
from dotenv import load_dotenv
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
_env_path = _backend_dir / ".env"
if not _env_path.exists():
    _env_path = _backend_dir.parent / ".env"
load_dotenv(dotenv_path=_env_path)


async def call_llm(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> str:
    """
    Async call to an OpenAI-compatible /chat/completions endpoint.
    Retries up to 3 times on 429 / 5xx errors.
    Raises on persistent failure.
    """
    api_url = os.getenv("LLM_API_URL")
    api_key = os.getenv("LLM_API_KEY")
    model = os.getenv("LLM_MODEL", "llama-3.1-8b-instant")

    if not api_url or not api_key:
        raise RuntimeError("LLM_API_URL or LLM_API_KEY is not configured in environment variables.")

    max_retries = 3
    timeout = httpx.Timeout(30.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        for attempt in range(1, max_retries + 1):
            try:
                response = await client.post(
                    f"{api_url}/chat/completions",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}",
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    },
                )

                if not response.is_success:
                    error_text = response.text[:200]
                    is_retryable = response.status_code == 429 or response.status_code >= 500
                    if is_retryable and attempt < max_retries:
                        delay = 2.0 if response.status_code == 429 else 1.0
                        await asyncio.sleep(delay)
                        continue
                    raise RuntimeError(
                        f"LLM API failed with status {response.status_code}: {error_text}"
                    )

                data = response.json()
                return data["choices"][0]["message"]["content"]

            except httpx.TimeoutException:
                if attempt >= max_retries:
                    raise RuntimeError("LLM request timed out after 30 seconds.")
                await asyncio.sleep(1.0)

    raise RuntimeError("LLM API failed after maximum retries")
