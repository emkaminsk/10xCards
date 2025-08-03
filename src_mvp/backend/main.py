from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
import os
import logging
from typing import Optional

from database import get_db, engine, Base
from models import *
from schemas import *
from auth import verify_session, create_session
from parser import parse_url
from ai import generate_cards
from leitner import get_next_card, grade_card

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="10xCards PoC", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/login")
async def login(response: Response, request: Request):
    """Simple dev-only authentication"""
    try:
        dev_password = os.getenv("DEV_PASSWORD", "haslo123")
        logger.info(f"Login attempt from {request.client.host if request.client else 'unknown'}")
        
        # Handle both JSON and form data
        password = None
        content_type = request.headers.get("content-type", "")
        
        if "application/json" in content_type:
            data = await request.json()
            password = data.get("password")
            logger.info("Received JSON login request")
        else:
            # Form data
            form = await request.form()
            password = form.get("password")
            logger.info("Received form data login request")
        
        if not password:
            logger.warning("Login attempt with missing password")
            raise HTTPException(status_code=400, detail="Password is required")
            
        if password != dev_password:
            logger.warning("Login attempt with incorrect password")
            raise HTTPException(status_code=401, detail="Invalid password")
        
        session_token = create_session()
        response.set_cookie(
            key="session",
            value=session_token,
            httponly=True,
            secure=False,  # Dev only
            samesite="lax"
        )
        
        logger.info("Login successful")
        return {"success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/import/url")
async def import_url(
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_session)
):
    """Parse content from URL"""
    try:
        # Log raw request details for debugging
        logger.info(f"Import URL request from {request.client.host if request.client else 'unknown'}")
        logger.info(f"Request headers: {dict(request.headers)}")
        
        content_type = request.headers.get("content-type", "").lower()
        logger.info(f"Content-Type: {content_type}")
        
        # Parse request data based on content type
        request_data = {}
        try:
            if "application/json" in content_type:
                request_data = await request.json()
                logger.info(f"Parsed JSON data: {request_data}")
            else:
                # Handle form data (including application/x-www-form-urlencoded)
                form_data = await request.form()
                request_data = dict(form_data)
                logger.info(f"Parsed form data: {request_data}")
        except Exception as parse_error:
            logger.error(f"Failed to parse request body: {str(parse_error)}")
            raise HTTPException(status_code=422, detail=f"Invalid request format: {str(parse_error)}")
        
        # Validate required fields
        if "url" not in request_data:
            logger.error("Missing 'url' field in request")
            raise HTTPException(status_code=422, detail="Missing required field 'url'")
        
        url = request_data["url"]
        if not url or not isinstance(url, str):
            logger.error(f"Invalid URL value: {url}")
            raise HTTPException(status_code=422, detail="URL must be a non-empty string")
        
        # Validate URL format
        if not (url.startswith("http://") or url.startswith("https://")):
            logger.error(f"Invalid URL format: {url}")
            raise HTTPException(status_code=422, detail="URL must start with http:// or https://")
        
        logger.info(f"Processing URL: {url}")
        
        # Parse the URL content
        content = await parse_url(url)
        logger.info(f"Successfully parsed URL, content length: {len(content)} characters")
        
        # Create import session
        session = ImportSession()
        db.add(session)
        db.commit()
        db.refresh(session)
        logger.info(f"Created import session with ID: {session.id}")
        
        word_count = len(content.split())
        
        response = ImportUrlResponse(
            session_id=str(session.id),
            content=content[:1000] + "..." if len(content) > 1000 else content,
            word_count=word_count
        )
        
        logger.info(f"Successfully processed URL, returning response with {word_count} words")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing URL import: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/ai/generate")
async def generate_ai_cards(
    request: GenerateCardsRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_session)
):
    """Generate flashcards using AI"""
    try:
        # Get existing cards for deduplication
        existing_cards = db.query(Card).all()
        existing_fronts = {card.front.lower() for card in existing_cards}
        
        # Get existing proposals for this session
        existing_proposals = db.query(CardProposal).filter(
            CardProposal.session_id == request.session_id
        ).all()
        existing_proposal_fronts = {prop.front.lower() for prop in existing_proposals}
        
        # Generate cards
        generated_cards = await generate_cards(
            request.content, 
            request.level,
            existing_fronts | existing_proposal_fronts
        )
        
        # Save as proposals
        proposals = []
        for card_data in generated_cards:
            proposal = CardProposal(
                session_id=request.session_id,
                front=card_data["front"],
                back=card_data["back"],
                context=card_data["context"]
            )
            db.add(proposal)
            proposals.append(proposal)
        
        db.commit()
        
        return GenerateCardsResponse(
            cards=[
                CardData(
                    front=p.front,
                    back=p.back,
                    context=p.context
                ) for p in proposals
            ]
        )
        
    except Exception as e:
        logger.error(f"Error generating cards: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate cards: {str(e)}")

@app.get("/cards/proposals")
async def get_proposals(
    session_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_session)
):
    """Get card proposals for a session"""
    proposals = db.query(CardProposal).filter(
        CardProposal.session_id == session_id
    ).all()
    
    return ProposalsResponse(
        proposals=[
            ProposalData(
                id=str(p.id),
                front=p.front,
                back=p.back,
                context=p.context
            ) for p in proposals
        ]
    )

@app.post("/cards/accept")
async def accept_cards(
    request: AcceptCardsRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_session)
):
    """Accept selected proposals as cards"""
    try:
        accepted_count = 0
        
        for proposal_id in request.proposal_ids:
            proposal = db.query(CardProposal).filter(
                CardProposal.id == proposal_id
            ).first()
            
            if proposal:
                # Create card
                card = Card(
                    front=proposal.front,
                    back=proposal.back,
                    context=proposal.context
                )
                db.add(card)
                db.flush()  # Get card ID
                
                # Add to box 1
                box = Box(card_id=card.id, box_index=1)
                db.add(box)
                
                # Remove proposal
                db.delete(proposal)
                accepted_count += 1
        
        db.commit()
        
        return AcceptCardsResponse(accepted_count=accepted_count)
        
    except Exception as e:
        logger.error(f"Error accepting cards: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to accept cards: {str(e)}")

@app.get("/review/next")
async def get_next_review(
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_session)
):
    """Get next card for review"""
    card = get_next_card(db)
    
    if card:
        return NextCardResponse(
            card=ReviewCardData(
                id=str(card.id),
                front=card.front,
                context=card.context or ""
            ),
            has_more=True
        )
    else:
        return NextCardResponse(card=None, has_more=False)

@app.post("/review/grade")
async def grade_review(
    request: GradeCardRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_session)
):
    """Grade a card review"""
    try:
        success = grade_card(db, request.card_id, request.grade)
        return GradeCardResponse(success=success)
        
    except Exception as e:
        logger.error(f"Error grading card: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to grade card: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)