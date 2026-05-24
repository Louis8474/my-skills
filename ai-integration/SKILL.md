---
name: ai-integration
description: "Integrates AI language model capabilities into applications — OpenAI (GPT-4o), Anthropic (Claude), and Google Gemini APIs, including streaming responses, function calling/tool use, retrieval-augmented generation (RAG) with vector search, and prompt management. Use when adding any AI features: chatbots, document Q&A, content generation, classification, summarization, or agents. Trigger when user mentions \"OpenAI\", \"Claude\", \"Anthropic\", \"GPT\", \"AI chat\", \"chatbot\", \"RAG\", \"embeddings\", \"vector search\", \"LLM\", \"AI-powered\", or \"generate content\"."
---

# AI Integration Engineering

## Purpose
Integrating LLMs is easy to start and hard to do correctly at scale. Common failure modes: no streaming (users stare at a spinner), API costs spiral from poorly scoped prompts, no content filtering on outputs, no fallback when the API is down, and RAG implementations that retrieve irrelevant context. This skill implements production-grade LLM integrations.

## Provider Selection

| Use Case | Best Choice |
|---|---|
| General chat, complex reasoning, coding | Claude 3.5 Sonnet (Anthropic) |
| Fast, cheap, high-volume classification/extraction | GPT-4o-mini or Claude Haiku |
| Multimodal (image understanding) | GPT-4o or Claude 3.5 Sonnet |
| Open-source / on-premise required | Llama 3 via Ollama or AWS Bedrock |
| Text embeddings for RAG | OpenAI `text-embedding-3-small` or `text-embedding-3-large` |

## SOP: LLM Integration

### Step 1 - Setup
```bash
uv pip install anthropic openai  # install both; switch per use-case
```

```python
# config.py
class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    AI_MODEL: str = "claude-3-5-sonnet-20241022"   # pin the model version
    AI_MAX_TOKENS: int = 4096
    AI_TEMPERATURE: float = 0.7
```

**Always pin model versions.** `claude-3-sonnet-latest` can change behavior silently.

### Step 2 - Streaming Response (FastAPI + SSE)
Users should see text appear word-by-word. A non-streaming AI endpoint that makes users wait 8 seconds is unusable.

```python
# api/v1/ai.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import anthropic

router = APIRouter()
client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

@router.post("/chat/stream")
async def stream_chat(body: ChatRequest, current_user: User = Depends(get_current_user)):
    async def generate():
        with client.messages.stream(
            model=settings.AI_MODEL,
            max_tokens=settings.AI_MAX_TOKENS,
            system="You are a helpful assistant for Supernova, a project management tool.",
            messages=[{"role": "user", "content": body.message}],
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {text}\n\n"  # SSE format
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
```

**Frontend (consuming SSE stream):**
```tsx
async function streamChat(message: string, onChunk: (text: string) => void) {
  const response = await fetch("/api/v1/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split("\n\n").filter(l => l.startsWith("data: "));
    for (const line of lines) {
      const text = line.replace("data: ", "");
      if (text !== "[DONE]") onChunk(text);
    }
  }
}
```

### Step 3 - Function Calling / Tool Use
Use tool use when the LLM needs to take actions: search the DB, call an API, update a record.

```python
tools = [
    {
        "name": "get_order_status",
        "description": "Returns the current status of an order by order ID",
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "The order UUID"}
            },
            "required": ["order_id"]
        }
    }
]

response = client.messages.create(
    model=settings.AI_MODEL,
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "What's the status of order abc-123?"}]
)

# Check if Claude wants to use a tool
if response.stop_reason == "tool_use":
    tool_call = next(b for b in response.content if b.type == "tool_use")
    if tool_call.name == "get_order_status":
        result = await order_service.get_status(UUID(tool_call.input["order_id"]), db)
        # Feed result back to Claude for a natural language response
        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": [{"type": "tool_result", "tool_use_id": tool_call.id, "content": str(result)}]})
        final_response = client.messages.create(model=settings.AI_MODEL, max_tokens=1024, tools=tools, messages=messages)
```

### Step 4 - RAG (Retrieval-Augmented Generation)
RAG lets the LLM answer questions about your specific documents or data.

```bash
uv pip install pgvector openai  # pgvector for PostgreSQL
```

**DB setup:**
```python
# Run once: CREATE EXTENSION IF NOT EXISTS vector;
# SQLAlchemy model:
from pgvector.sqlalchemy import Vector

class Document(Base):
    __tablename__ = "documents"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(Vector(1536))  # 1536 for text-embedding-3-small
```

**Index for fast similarity search:**
```sql
CREATE INDEX idx_documents_embedding ON documents
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**Embedding + retrieval service:**
```python
from openai import AsyncOpenAI

embed_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def embed_document(content: str) -> list[float]:
    response = await embed_client.embeddings.create(
        input=content,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

async def retrieve_relevant_chunks(query: str, db: AsyncSession, limit: int = 5) -> list[str]:
    query_embedding = await embed_document(query)
    # Cosine similarity search via pgvector
    result = await db.execute(
        text("""
            SELECT content FROM documents
            ORDER BY embedding <=> :embedding
            LIMIT :limit
        """),
        {"embedding": str(query_embedding), "limit": limit}
    )
    return [row[0] for row in result.fetchall()]

async def rag_query(question: str, db: AsyncSession) -> str:
    context_chunks = await retrieve_relevant_chunks(question, db)
    context = "\n\n".join(context_chunks)

    response = client.messages.create(
        model=settings.AI_MODEL,
        max_tokens=2048,
        system=f"""Answer questions based on the provided context only.
If the answer is not in the context, say "I don't have that information."

Context:
{context}""",
        messages=[{"role": "user", "content": question}]
    )
    return response.content[0].text
```

### Step 5 - Cost Control
- Set `max_tokens` appropriately for your use case — never leave it at the model maximum
- Cache responses for identical prompts using Redis (especially for document summarization)
- Log token usage per request: `response.usage.input_tokens + response.usage.output_tokens`
- Set spend limits in the provider dashboard; configure an alert at 80% of budget
