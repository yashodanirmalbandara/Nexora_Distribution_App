from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.models import User
import os
from jose import jwt

router = APIRouter(tags=["Authentication"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    token = jwt.encode({"sub": user.username, "role": user.role}, os.getenv("SECRET_KEY", "change-this-secret"), algorithm=os.getenv("ALGORITHM", "HS256"))
    return {"access_token": token, "token_type": "bearer", "role": user.role}
