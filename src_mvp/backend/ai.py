import httpx
import json
import os
import logging
from typing import List, Dict, Set, Optional

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = """Eres un experto en enseñanza de español como lengua extranjera. Genera tarjetas de estudio (flashcards) del texto proporcionado para estudiantes.

Reglas:
- Minimo 5 tarjetas
- Máximo 15 tarjetas por texto
- Solo palabras/frases de nivel indicado
- Front: palabra/frase + contexto mínimo (máximo 80 caracteres)
- Back: traduccion en ingles y explicación en español simple (máximo 100 caracteres)
- Context: frase del texto original (máximo 500 caracteres)
- Enfócate en vocabulario útil y expresiones comunes
- Evita nombres propios, tecnicismos muy específicos
- Cada tarjeta debe ser muy distinta de las otras

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

async def generate_cards(content: str, level: str, existing_fronts: Set[str], model_name: Optional[str] = None) -> List[Dict[str, str]]:
    """Generate flashcards using OpenRouter AI"""
    
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        logger.error("OPENROUTER_API_KEY environment variable not set")
        raise ValueError("AI service not configured. Please set OPENROUTER_API_KEY environment variable.")
    
    # Get model name from parameter or environment variable
    if model_name is None:
        model_name = os.getenv("AI_MODEL_NAME", "anthropic/claude-3-haiku")
    
    logger.info(f"🤖 AI Generation - Using model: {model_name}")
    
    # Truncate content if too long to avoid timeouts
    if len(content) > 2000:
        content = content[:2000] + "..."
        logger.info(f"Content truncated to 2000 characters to avoid timeout")
    
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
        "model": model_name,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 3000
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
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
                
                logger.info(f"🤖 AI Generation - Generated {len(filtered_cards)} unique cards from {len(cards)} total using {model_name}")
                return filtered_cards[:15]  # Limit to 15 cards
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse AI response as JSON: {e}")
                logger.error(f"Response content: {content_text}")
                raise ValueError("AI returned invalid JSON response")
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 408:
                logger.error(f"OpenRouter timeout (408) for model: {model_name} - {e.response.text}")
                raise ValueError("OpenRouter service timeout - try again or use a different model")
            else:
                logger.error(f"OpenRouter API error: {e.response.status_code} - {e.response.text}")
                raise ValueError(f"AI service error: {e.response.status_code}")
        except httpx.TimeoutException:
            logger.error(f"AI request timeout after 10 seconds for model: {model_name}")
            raise ValueError("AI service timeout after 10 seconds")
        except Exception as e:
            logger.error(f"Unexpected error calling AI service: {e}")
            raise ValueError(f"AI service error: {str(e)}")