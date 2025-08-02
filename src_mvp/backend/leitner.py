from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import date, timedelta
import logging
from typing import Optional

from models import Card, Box, Review

logger = logging.getLogger(__name__)

def get_next_card(db: Session) -> Optional[Card]:
    """Get next card for review using Leitner system"""
    
    # Get cards due for review today
    today = date.today()
    
    card = db.query(Card).join(Box).filter(
        Box.next_review <= today
    ).first()
    
    return card

def grade_card(db: Session, card_id: str, grade: str) -> bool:
    """Grade a card and update its box position"""
    
    try:
        # Get card and its box
        card = db.query(Card).filter(Card.id == card_id).first()
        if not card:
            logger.error(f"Card not found: {card_id}")
            return False
        
        box = db.query(Box).filter(Box.card_id == card_id).first()
        if not box:
            logger.error(f"Box not found for card: {card_id}")
            return False
        
        # Record the review
        review = Review(card_id=card_id, grade=grade)
        db.add(review)
        
        # Update box based on grade
        if grade == "easy":
            # Move to next box (max 3)
            new_box = min(box.box_index + 1, 3)
            # Schedule next review based on box
            if new_box == 1:
                next_review = date.today() + timedelta(days=1)
            elif new_box == 2:
                next_review = date.today() + timedelta(days=3)
            else:  # box 3
                next_review = date.today() + timedelta(days=7)
        else:  # grade == "hard"
            # Move back to box 1
            new_box = 1
            next_review = date.today() + timedelta(days=1)
        
        box.box_index = new_box
        box.next_review = next_review
        
        db.commit()
        
        logger.info(f"Card {card_id} graded {grade}, moved to box {new_box}, next review: {next_review}")
        return True
        
    except Exception as e:
        logger.error(f"Error grading card {card_id}: {e}")
        db.rollback()
        return False