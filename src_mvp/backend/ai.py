import httpx
import json
import os
import logging
from typing import List, Dict, Set

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = """Eres un experto en enseñanza de español como lengua extranjera. Genera tarjetas de estudio (flashcards) del texto proporcionado para estudiantes de nivel A2-B2.

Reglas:
- Máximo 15 tarjetas por texto
- Solo palabras/frases de nivel A2-B2 (evita muy básicas o muy avanzadas)
- Front: palabra/frase + contexto mínimo (máximo 80 caracteres)
- Back: traducción/explicación en español simple
- Context: frase del texto original (máximo 500 caracteres)
- Enfócate en vocabulario útil y expresiones comunes
- Evita nombres propios, tecnicismos muy específicos

Formato JSON:
{
  "cards": [
    {
      "front": "palabra/frase (contexto breve)",
      "back": "significado o explicación",
      "context": "frase original del texto"
    }
  ]
}"""

async def generate_cards(content: str, level: str, existing_fronts: Set[str]) -> List[Dict[str, str]]:
    """Generate flashcards using OpenRouter AI"""
    
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        logger.error("OPENROUTER_API_KEY environment variable not set")
        raise ValueError("AI service not configured. Please set OPENROUTER_API_KEY environment variable.")
    
    # Truncate content if too long
    if len(content) > 3000:
        content = content[:3000] + "..."
    
    user_prompt = f"""Genera flashcards del siguiente texto en español:

{content}

Nivel objetivo: {level}"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "10xCards PoC"
    }
    
    payload = {
        "model": "anthropic/claude-3-haiku",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(OPENROUTER_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            content_text = result["choices"][0]["message"]["content"]
            
            # Parse JSON response
            try:
                # Extract JSON from response (might have extra text)
                json_start = content_text.find('{')
                json_end = content_text.rfind('}') + 1
                json_str = content_text[json_start:json_end]
                
                data = json.loads(json_str)
                cards = data.get("cards", [])
                
                # Filter out duplicates
                filtered_cards = []
                for card in cards:
                    front_lower = card["front"].lower()
                    if front_lower not in existing_fronts:
                        filtered_cards.append(card)
                        existing_fronts.add(front_lower)
                
                logger.info(f"Generated {len(filtered_cards)} unique cards from {len(cards)} total")
                return filtered_cards[:15]  # Limit to 15 cards
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse AI response as JSON: {e}")
                logger.error(f"Response content: {content_text}")
                raise ValueError("AI returned invalid JSON response")
                
        except httpx.HTTPStatusError as e:
            logger.error(f"OpenRouter API error: {e.response.status_code} - {e.response.text}")
            raise ValueError(f"AI service error: {e.response.status_code}")
        except httpx.TimeoutException:
            raise ValueError("AI service timeout")
        except Exception as e:
            logger.error(f"Unexpected error calling AI service: {e}")
            raise ValueError(f"AI service error: {str(e)}")