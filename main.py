from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship, Session
from pydantic import BaseModel, EmailStr, field_validator
import auth
from database import Base, engine, get_db
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from monitor import SmartDetector, MonitorState, monitoring_loop
import socket
from urllib.parse import urlparse

# ---------------- Models ----------------
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_locked = Column(Boolean, default=False)
    locked_until = Column(DateTime, nullable=True)
    reset_token = Column(String(100), nullable=True)

class LoginAttempt(Base):
    __tablename__ = "login_attempts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    attempt_time = Column(DateTime, default=datetime.utcnow)
    success = Column(Boolean)
    user = relationship("User")

Base.metadata.create_all(bind=engine)

# ---------------- FastAPI App ----------------
app = FastAPI()

# CORS - only one middleware, permissive for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global monitoring state
state = MonitorState()

# ---------------- Schemas ----------------
class RegisterSchema(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginSchema(BaseModel):
    username: str
    password: str

class ForgotPasswordSchema(BaseModel):
    email: EmailStr

class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str

class StartRequest(BaseModel):
    url: str

    @field_validator('url')
    @classmethod
    def validate_url(cls, v: str):
        v = v.strip()
        if not v.startswith(('http://', 'https://')):
            raise ValueError("URL must start with http:// or https://")
        return v

# ---------------- Routes ----------------
@app.post("/register")
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    return auth.register_user(db, User, data.username, data.email, data.password)

@app.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    return auth.login_user(db, User, LoginAttempt, data.username, data.password)

@app.post("/forgot-password")
async def forgot_password(data: ForgotPasswordSchema, db: Session = Depends(get_db)):
    return await auth.forgot_password(db, User, data.email)

@app.post("/reset-password")
def reset_password(data: ResetPasswordSchema, db: Session = Depends(get_db)):
    return auth.reset_password(db, User, data.token, data.new_password)

@app.get("/")
def read_root():
    return {"version": "2.0", "model": "EWMA-Anomaly-Detector"}

@app.post("/start")
async def start_monitoring(request: StartRequest, background_tasks: BackgroundTasks):
    if state.is_monitoring:
        raise HTTPException(status_code=400, detail="Already monitoring")

    # Extract domain for subdomain enumeration
    parsed = urlparse(request.url)
    domain = parsed.netloc
    scheme = parsed.scheme

    # Common subdomains
    common_subdomains = [
        'www', 'api', 'blog', 'shop', 'mail', 'ftp', 'admin', 'test', 'dev', 'staging',
        'beta', 'forum', 'news', 'app', 'secure', 'login', 'dashboard', 'webmail', 'portal', 'cms'
    ]

    sub_urls = [request.url]
    for sub in common_subdomains:
        sub_domain = f"{sub}.{domain}"
        try:
            socket.gethostbyname(sub_domain)
            sub_urls.append(f"{scheme}://{sub_domain}")
        except socket.gaierror:
            pass  # Subdomain does not resolve

    # Unique targets
    state.targets = list(set(sub_urls))
    state.is_monitoring = True
    state.target_url = request.url  # Main target
    state.detectors = {t: SmartDetector(alpha=0.15, threshold=2.0) for t in state.targets}
    state.histories = {}
    state.timestamps = {}
    state.baseline_avgs = {}
    state.current_statuses = {t: "Idle" for t in state.targets}
    state.http_status_codes = {t: 0 for t in state.targets}

    background_tasks.add_task(monitoring_loop, state)
    return {"message": "Monitoring Started with AI Detector", "targets": state.targets}

@app.post("/stop")
async def stop_monitoring():
    state.is_monitoring = False
    for t in state.targets:
        state.current_statuses[t] = "Stopped"
    return {"message": "Stopped"}

@app.get("/status")
async def get_status():
    return {
        "is_monitoring": state.is_monitoring,
        "targets": state.targets,
        "current_latencies": {t: state.histories.get(t, [0])[-1] if t in state.histories else 0 for t in state.targets},
        "baseline_avgs": state.baseline_avgs,
        "status_messages": state.current_statuses,
        "histories": state.histories,
        "timestamps": state.timestamps
    }