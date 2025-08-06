import json
import os
import logging
from typing import List, Dict, Set, Optional
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from ../.env file
load_dotenv(dotenv_path='../.env')

logger = logging.getLogger(__name__)

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
    """Generate flashcards using GitHub OpenAI"""
    
    github_token = os.getenv("GITHUB_TOKEN")
    if not github_token:
        logger.error("GITHUB_TOKEN environment variable not set")
        raise ValueError("AI service not configured. Please set GITHUB_TOKEN environment variable.")
    
    # Get model name from parameter or environment variable
    if model_name is None:
        model_name = os.getenv("AI_MODEL_NAME", "openai/gpt-4.1")
    
    logger.info(f"🤖 AI Generation - Using model: {model_name}")
    
    # Truncate content if too long to avoid timeouts
    if len(content) > 2000:
        content = content[:2000] + "..."
        logger.info(f"Content truncated to 2000 characters to avoid timeout")
    
    user_prompt = f"""Genera flashcards del siguiente texto en español:

{content}

Nivel objetivo: {level}"""

    try:
        client = OpenAI(
            base_url="https://models.github.ai/inference",
            api_key=github_token
        )
        
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            top_p=1.0,
            model=model_name
        )
        
        content_text = response.choices[0].message.content
        
        if not content_text:
            logger.error("AI returned empty response")
            raise ValueError("AI returned empty response")
        
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
            
    except Exception as e:
        logger.error(f"Unexpected error calling GitHub OpenAI service: {e}")
        raise ValueError(f"AI service error: {str(e)}")