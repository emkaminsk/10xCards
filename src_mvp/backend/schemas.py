from pydantic import BaseModel
from typing import List, Optional, Literal

# Auth schemas
class LoginRequest(BaseModel):
    password: str

class LoginResponse(BaseModel):
    success: bool

# Import schemas
class ImportUrlRequest(BaseModel):
    url: str

class ImportUrlResponse(BaseModel):
    session_id: str
    content: str
    word_count: int

# AI Generation schemas
class GenerateCardsRequest(BaseModel):
    session_id: str
    content: str
    level: Literal["A2", "B1", "B2"] = "B1"

class CardData(BaseModel):
    front: str
    back: str
    context: str

class GenerateCardsResponse(BaseModel):
    cards: List[CardData]

# Proposals schemas
class ProposalData(BaseModel):
    id: str
    front: str
    back: str
    context: str

class ProposalsResponse(BaseModel):
    proposals: List[ProposalData]

class AcceptCardsRequest(BaseModel):
    proposal_ids: List[str]

class AcceptCardsResponse(BaseModel):
    accepted_count: int

# Review schemas
class ReviewCardData(BaseModel):
    id: str
    front: str
    context: str

class NextCardResponse(BaseModel):
    card: Optional[ReviewCardData]
    has_more: bool

class GradeCardRequest(BaseModel):
    card_id: str
    grade: Literal["easy", "hard"]

class GradeCardResponse(BaseModel):
    success: bool