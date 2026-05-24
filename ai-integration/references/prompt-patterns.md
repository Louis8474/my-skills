# AI Integration Reference: Prompt Engineering Patterns

## System Prompt Design
The system prompt defines the AI's role, constraints, and output format. It runs on every message and is the highest-leverage place to improve output quality.

```python
SYSTEM_PROMPT = """You are a helpful assistant for [App Name].

Your role:
- Answer questions about [domain] using the information provided
- Be concise and specific — avoid padding responses
- If you don't know the answer, say "I don't have that information"
- Never make up facts

Constraints:
- Do not answer questions outside of [domain]
- Do not share other users' data
- Respond in the same language as the user's message
"""
```

## Output Format Control
Force structured output by specifying the format in the system prompt:

```python
# For JSON output (classification, extraction)
CLASSIFY_PROMPT = """Classify the support ticket into one of these categories:
["billing", "technical", "feature_request", "abuse"]

Respond with ONLY valid JSON:
{"category": "billing", "confidence": 0.95, "reason": "User mentions invoice"}"""

# Then parse safely:
import json
try:
    result = json.loads(response.content[0].text)
except json.JSONDecodeError:
    result = {"category": "unknown", "confidence": 0.0}
```

## Few-Shot Examples
When the task has a specific output style, include 2-3 examples in the prompt:

```python
FEW_SHOT_PROMPT = """Convert user messages to SQL queries for our products table.
Columns: id, name, price, category, created_at

Example 1:
User: show me all products under $50
SQL: SELECT * FROM products WHERE price < 50 ORDER BY price ASC

Example 2:
User: how many electronics products do we have?
SQL: SELECT COUNT(*) FROM products WHERE category = 'electronics'

Now convert this message:
User: {user_message}
SQL:"""
```

## Token Estimation (Avoid Surprises)
Rule of thumb: 1 token ≈ 4 characters (English). For pricing estimates:
- 1,000 words ≈ 750 tokens
- A typical page of text ≈ 500 tokens
- GPT-4o: ~$15/M input tokens, $60/M output tokens
- Claude Haiku: ~$1/M input, $5/M output

**For RAG systems**: Keep retrieved context under 4,000 tokens to avoid model confusion from too much information.

## Caching AI Responses (Redis)
When users ask near-identical questions, cache the response:

```python
import hashlib, json
from redis.asyncio import Redis

async def cached_ai_query(prompt: str, system: str, redis: Redis) -> str:
    cache_key = "ai:" + hashlib.md5(f"{system}|{prompt}".encode()).hexdigest()
    cached = await redis.get(cache_key)
    if cached:
        return cached.decode()

    response = client.messages.create(
        model=settings.AI_MODEL,
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": prompt}]
    )
    result = response.content[0].text

    # Cache for 1 hour - AI FAQ answers don't change that fast
    await redis.setex(cache_key, 3600, result)
    return result
```

## Content Moderation Before Sending to LLM
Always check user input before passing it to an expensive LLM call:
```python
# OpenAI moderation API (free)
import openai

async def is_safe(text: str) -> bool:
    result = await openai_client.moderations.create(input=text)
    return not result.results[0].flagged

# In the route:
if not await is_safe(body.message):
    raise HTTPException(400, "Message violates content policy")
```

## Streaming with React Query
```tsx
// Hook for streaming AI responses
function useStreamingChat() {
  const [response, setResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const send = useCallback(async (message: string) => {
    setIsStreaming(true);
    setResponse("");

    const res = await fetch("/api/v1/chat/stream", {
      method: "POST",
      body: JSON.stringify({ message }),
      headers: { "Content-Type": "application/json" }
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n\n");
      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          setResponse(prev => prev + line.slice(6));
        }
      }
    }
    setIsStreaming(false);
  }, []);

  return { response, isStreaming, send };
}
```
