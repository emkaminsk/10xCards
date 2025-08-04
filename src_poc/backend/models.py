from sqlalchemy import Column, String, Text, Integer, DateTime, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from database import Base

class ImportSession(Base):
    __tablename__ = "import_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, server_default=func.now())

class Card(Base):
    __tablename__ = "cards"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    context = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    box = relationship("Box", back_populates="card", uselist=False)
    reviews = relationship("Review", back_populates="card")

class Box(Base):
    __tablename__ = "boxes"
    
    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id"), primary_key=True)
    box_index = Column(Integer, default=1)
    next_review = Column(Date, server_default=func.current_date())
    
    # Relationships
    card = relationship("Card", back_populates="box")

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id"))
    grade = Column(String(10))  # 'easy' or 'hard'
    reviewed_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    card = relationship("Card", back_populates="reviews")

class CardProposal(Base):
    __tablename__ = "card_proposals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("import_sessions.id"))
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    context = Column(Text)
    created_at = Column(DateTime, server_default=func.now())