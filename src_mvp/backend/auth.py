from fastapi import HTTPException, Request
import secrets
import time
from typing import Dict

# Simple in-memory session store for PoC
sessions: Dict[str, float] = {}
SESSION_TIMEOUT = 24 * 60 * 60  # 24 hours

def create_session() -> str:
    """Create a new session token"""
    token = secrets.token_urlsafe(32)
    sessions[token] = time.time()
    return token

def verify_session(request: Request) -> str:
    """Verify session from cookie"""
    session_token = request.cookies.get("session")
    
    if not session_token:
        raise HTTPException(status_code=401, detail="No session found")
    
    if session_token not in sessions:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check if session expired
    if time.time() - sessions[session_token] > SESSION_TIMEOUT:
        del sessions[session_token]
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Update session timestamp
    sessions[session_token] = time.time()
    
    return session_token