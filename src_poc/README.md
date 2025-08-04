# 10xCards PoC

Generador de tarjetas de estudio para artículos en español usando IA.

## Características

- **Import desde URL**: Extrae contenido de artículos web
- **Generación IA**: Crea tarjetas automáticamente con OpenRouter
- **Sistema Leitner**: Repaso espaciado con 3 niveles
- **Filtrado por nivel**: A2, B1, B2 para español
- **Deduplikación**: Evita tarjetas duplicadas

## Requisitos

- Docker y Docker Compose
- Cuenta en OpenRouter (https://openrouter.ai/)

## Instalación

1. **Clonar y configurar**:
```bash
git clone <repo>
cd 10xcards-poc
cp .env.example .env
```

2. **Configurar variables de entorno** en `.env`:
```
# AI Configuration
AI_MODEL_NAME=anthropic/claude-3-haiku
OPENROUTER_API_KEY=tu_clave_de_openrouter

# Authentication
DEV_PASSWORD=haslo123

# Database Configuration
DATABASE_URL=postgresql://user:pass@db:5432/cards

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
INTERNAL_API_URL=http://backend:8000
```

3. **Ejecutar**:
```bash
docker-compose up --build
```

4. **Acceder**:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Contraseña: `haslo123` (configurable en .env)

## Uso

1. **Login**: Usa la contraseña configurada en DEV_PASSWORD
2. **Importar**: Pega URL de artículo en español
3. **Generar**: Selecciona nivel (A2/B1/B2) y genera tarjetas
4. **Revisar**: Selecciona tarjetas a aceptar
5. **Repasar**: Practica con sistema Leitner

## Arquitectura

```
Frontend (Next.js) → Backend (FastAPI) → PostgreSQL
                  ↓
              OpenRouter AI
```

## Limitaciones del PoC

- Autenticación simple (solo contraseña)
- Sin persistencia de sesiones entre reinicios
- Límite de 15 tarjetas por generación
- Solo artículos públicos (sin paywall)
- Sin estadísticas avanzadas

## Desarrollo

```bash
# Solo backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Solo frontend  
cd frontend
npm install
npm run dev

# Base de datos
docker run -p 5432:5432 -e POSTGRES_DB=cards -e POSTGRES_USER=user -e POSTGRES_PASSWORD=pass postgres:15
```

## API Endpoints

- `POST /auth/login` - Autenticación
- `POST /import/url` - Importar desde URL
- `POST /ai/generate` - Generar tarjetas
- `GET /cards/proposals` - Ver propuestas
- `POST /cards/accept` - Aceptar tarjetas
- `GET /review/next` - Siguiente tarjeta
- `POST /review/grade` - Calificar tarjeta