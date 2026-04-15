import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import os
import secrets
from typing import List, Dict

from models import SessionLocal, User, Book, Conversation, Message, engine
from auth import get_password_hash, verify_password, create_access_token, decode_access_token

os.makedirs("uploads/images", exist_ok=True)
os.makedirs("uploads/audio", exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Connection Manager for WebSockets
class ConnectionManager:
    def __init__(self):
        # user_id -> WebSocket
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        
    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)
            
    def get_online_users(self):
        return list(self.active_connections.keys())

manager = ConnectionManager()

# --- Auth Routes ---
from pydantic import BaseModel

class LoginData(BaseModel):
    username: str
    password: str

@app.post("/api/register")
def register(data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if user:
        raise HTTPException(status_code=400, detail="Username registered")
    
    hashed_pw = get_password_hash(data.password)
    new_user = User(username=data.username, password_hash=hashed_pw, pfp_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={data.username}")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created", "user_id": new_user.id}

@app.post("/api/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id, "username": user.username, "pfp_url": user.pfp_url}

# --- Bookshelf Routes ---
@app.get("/api/books")
def get_books(db: Session = Depends(get_db)):
    books = db.query(Book).all()
    return [{"id": b.id, "title": b.title, "cover": b.cover_url, "pdf": b.pdf_url, "isSecret": b.is_secret, "language": b.language} for b in books]

@app.get("/api/books/{book_id}")
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return {
        "id": book.id,
        "title": book.title,
        "cover": book.cover_url,
        "fullStory": book.full_story,
        "language": book.language,
        "isSecret": book.is_secret
    }

# --- Chat/User Routes ---
def get_current_user(token: str, db: Session):
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = int(payload.get("sub"))
    return db.query(User).filter(User.id == user_id).first()

@app.get("/api/users")
def get_users(db: Session = Depends(get_db), authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    token = authorization.split(" ")[1]
    current_user = get_current_user(token, db)
    if not current_user:
        raise HTTPException(status_code=401)
    # Get all other users
    users = db.query(User).filter(User.id != current_user.id).all()
    online_users = manager.get_online_users()
    
    return [{"id": u.id, "username": u.username, "pfp_url": u.pfp_url, "is_online": u.id in online_users} for u in users]

@app.get("/api/messages/{other_user_id}")
def get_messages(other_user_id: int, db: Session = Depends(get_db), authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    token = authorization.split(" ")[1]
    current_user = get_current_user(token, db)
    if not current_user:
        raise HTTPException(status_code=401)
        
    convo = db.query(Conversation).filter(
        ((Conversation.user1_id == current_user.id) & (Conversation.user2_id == other_user_id)) |
        ((Conversation.user1_id == other_user_id) & (Conversation.user2_id == current_user.id))
    ).first()
    
    if not convo:
        return []
        
    messages = db.query(Message).filter(Message.conversation_id == convo.id).order_by(Message.timestamp.asc()).all()
    return [{"id": m.id, "sender_id": m.sender_id, "text": m.text, "image_url": m.image_url, "audio_url": m.audio_url, "timestamp": m.timestamp.isoformat()} for m in messages]

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), file_type: str = Form(...)): # 'image' or 'audio'
    ext = file.filename.split(".")[-1]
    new_filename = f"{secrets.token_hex(8)}.{ext}"
    if file_type == "image":
        path = f"uploads/images/{new_filename}"
    else:
        path = f"uploads/audio/{new_filename}"
        
    with open(path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    return {"url": f"/{path}"}

@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    await manager.connect(websocket, user.id)
    
    # Broadcast online status
    for uid in manager.active_connections:
        await manager.send_personal_message({"type": "status", "user_id": user.id, "status": "online"}, uid)
        
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action", "send")
            recipient_id = data.get("recipient_id")
            
            if action == "send":
                text = data.get("text")
                image_url = data.get("image_url")
                audio_url = data.get("audio_url")
                
                convo = db.query(Conversation).filter(
                    ((Conversation.user1_id == user.id) & (Conversation.user2_id == recipient_id)) |
                    ((Conversation.user1_id == recipient_id) & (Conversation.user2_id == user.id))
                ).first()
                
                if not convo:
                    convo = Conversation(user1_id=user.id, user2_id=recipient_id)
                    db.add(convo)
                    db.commit()
                    db.refresh(convo)
                    
                new_msg = Message(
                    conversation_id=convo.id,
                    sender_id=user.id,
                    text=text,
                    image_url=image_url,
                    audio_url=audio_url
                )
                db.add(new_msg)
                db.commit()
                db.refresh(new_msg)
                
                msg_payload = {
                    "type": "chat",
                    "message": {
                        "id": new_msg.id,
                        "sender_id": user.id,
                        "recipient_id": recipient_id,
                        "text": text,
                        "image_url": image_url,
                        "audio_url": audio_url,
                        "timestamp": new_msg.timestamp.isoformat()
                    }
                }
                
                await manager.send_personal_message(msg_payload, user.id)
                if recipient_id in manager.active_connections:
                    await manager.send_personal_message(msg_payload, recipient_id)
                    
            elif action == "edit":
                msg_id = data.get("message_id")
                new_text = data.get("text")
                msg = db.query(Message).filter(Message.id == msg_id, Message.sender_id == user.id).first()
                if msg:
                    msg.text = new_text
                    db.commit()
                    
                    edit_payload = {
                        "type": "chat_edit",
                        "message_id": msg.id,
                        "text": new_text,
                        "sender_id": user.id,
                        "recipient_id": recipient_id
                    }
                    await manager.send_personal_message(edit_payload, user.id)
                    if recipient_id in manager.active_connections:
                        await manager.send_personal_message(edit_payload, recipient_id)
                        
            elif action == "delete":
                msg_id = data.get("message_id")
                msg = db.query(Message).filter(Message.id == msg_id, Message.sender_id == user.id).first()
                if msg:
                    deleted_id = msg.id
                    db.delete(msg)
                    db.commit()
                    
                    del_payload = {
                        "type": "chat_delete",
                        "message_id": deleted_id,
                        "sender_id": user.id,
                        "recipient_id": recipient_id
                    }
                    await manager.send_personal_message(del_payload, user.id)
                    if recipient_id in manager.active_connections:
                        await manager.send_personal_message(del_payload, recipient_id)
            
    except WebSocketDisconnect:
        manager.disconnect(user.id)
        # Broadcast offline status
        for uid in manager.active_connections:
            await manager.send_personal_message({"type": "status", "user_id": user.id, "status": "offline"}, uid)
