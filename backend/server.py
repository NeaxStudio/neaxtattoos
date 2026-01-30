from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import asyncio
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend configuration
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# JWT configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'neax-tattoos-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logger = logging.getLogger(__name__)

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Artist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    artist_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    bio: str
    specialty: str
    image_url: str
    instagram: Optional[str] = None
    years_experience: int

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    service_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    duration_minutes: int
    price_start: int
    icon: str

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    booking_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    artist_id: str
    service_id: str
    appointment_date: str
    appointment_time: str
    notes: Optional[str] = None
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    artist_id: str
    service_id: str
    appointment_date: str
    appointment_time: str
    notes: Optional[str] = None

class BookingWithDetails(BaseModel):
    booking_id: str
    user_name: str
    user_email: str
    artist_name: str
    service_name: str
    appointment_date: str
    appointment_time: str
    notes: Optional[str] = None
    status: str
    created_at: datetime

class EmailRequest(BaseModel):
    recipient_email: EmailStr
    subject: str
    html_content: str

# ============ HELPER FUNCTIONS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user = await db.users.find_one({"user_id": payload['user_id']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        phone=user_data.phone
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['password_hash'] = hash_password(user_data.password)
    
    await db.users.insert_one(doc)
    
    token = create_token(user.user_id, user.email)
    return {
        "message": "User registered successfully",
        "token": token,
        "user": user
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_doc)
    token = create_token(user.user_id, user.email)
    
    return {
        "message": "Login successful",
        "token": token,
        "user": user
    }

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============ ARTIST ROUTES ============

@api_router.get("/artists", response_model=List[Artist])
async def get_artists():
    artists = await db.artists.find({}, {"_id": 0}).to_list(100)
    seen = set()
    unique = []
    for artist in artists:
        name_key = (artist.get("name") or "").strip().lower()
        key = name_key or (artist.get("instagram") or "").strip().lower() or artist.get("artist_id")
        if key and key in seen:
            continue
        if key:
            seen.add(key)
        unique.append(artist)
    return unique

@api_router.post("/artists", response_model=Artist)
async def create_artist(artist: Artist):
    doc = artist.model_dump()
    await db.artists.insert_one(doc)
    return artist

# ============ SERVICE ROUTES ============

@api_router.get("/services", response_model=List[Service])
async def get_services():
    services = await db.services.find({}, {"_id": 0}).to_list(100)
    return services

@api_router.post("/services", response_model=Service)
async def create_service(service: Service):
    doc = service.model_dump()
    await db.services.insert_one(doc)
    return service

# ============ BOOKING ROUTES ============

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate, current_user: User = Depends(get_current_user)):
    # Validate artist exists
    artist = await db.artists.find_one({"artist_id": booking_data.artist_id}, {"_id": 0})
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    # Validate service exists
    service = await db.services.find_one({"service_id": booking_data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Create booking
    booking = Booking(
        user_id=current_user.user_id,
        artist_id=booking_data.artist_id,
        service_id=booking_data.service_id,
        appointment_date=booking_data.appointment_date,
        appointment_time=booking_data.appointment_time,
        notes=booking_data.notes
    )
    
    doc = booking.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.bookings.insert_one(doc)
    
    # Send confirmation email
    try:
        email_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background: #0F0F0F; color: #E5E5E5; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto; background: #1A1A1A; border: 1px solid rgba(255,255,255,0.1); padding: 40px;">
                <h1 style="color: #D4AF37; font-size: 32px; margin-bottom: 20px;">Booking Confirmed</h1>
                <p style="font-size: 16px; line-height: 1.6;">Hi {current_user.name},</p>
                <p style="font-size: 16px; line-height: 1.6;">Your appointment at <strong>Neax Tattoos</strong> has been confirmed!</p>
                
                <div style="background: #0F0F0F; padding: 20px; margin: 20px 0; border-left: 3px solid #D4AF37;">
                    <p style="margin: 5px 0;"><strong>Service:</strong> {service['name']}</p>
                    <p style="margin: 5px 0;"><strong>Artist:</strong> {artist['name']}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> {booking.appointment_date}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> {booking.appointment_time}</p>
                </div>
                
                <p style="font-size: 14px; line-height: 1.6; color: #A3A3A3;">Please arrive 10 minutes early. If you need to reschedule, contact us at least 24 hours in advance.</p>
                
                <p style="margin-top: 30px;">See you soon,<br><strong style="color: #D4AF37;">Neax Tattoos Team</strong></p>
            </div>
        </body>
        </html>
        """
        
        params = {
            "from": SENDER_EMAIL,
            "to": [current_user.email],
            "subject": "Your Neax Tattoos Appointment Confirmation",
            "html": email_html
        }
        
        await asyncio.to_thread(resend.Emails.send, params)
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {str(e)}")
    
    return booking

@api_router.get("/bookings/my", response_model=List[BookingWithDetails])
async def get_my_bookings(current_user: User = Depends(get_current_user)):
    bookings = await db.bookings.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(100)
    
    result = []
    for booking in bookings:
        artist = await db.artists.find_one({"artist_id": booking['artist_id']}, {"_id": 0})
        service = await db.services.find_one({"service_id": booking['service_id']}, {"_id": 0})
        
        if isinstance(booking['created_at'], str):
            booking['created_at'] = datetime.fromisoformat(booking['created_at'])
        
        result.append(BookingWithDetails(
            booking_id=booking['booking_id'],
            user_name=current_user.name,
            user_email=current_user.email,
            artist_name=artist['name'] if artist else 'Unknown',
            service_name=service['name'] if service else 'Unknown',
            appointment_date=booking['appointment_date'],
            appointment_time=booking['appointment_time'],
            notes=booking.get('notes'),
            status=booking['status'],
            created_at=booking['created_at']
        ))
    
    return result

@api_router.get("/bookings", response_model=List[BookingWithDetails])
async def get_all_bookings():
    bookings = await db.bookings.find({}, {"_id": 0}).to_list(1000)
    
    result = []
    for booking in bookings:
        user = await db.users.find_one({"user_id": booking['user_id']}, {"_id": 0})
        artist = await db.artists.find_one({"artist_id": booking['artist_id']}, {"_id": 0})
        service = await db.services.find_one({"service_id": booking['service_id']}, {"_id": 0})
        
        if isinstance(booking['created_at'], str):
            booking['created_at'] = datetime.fromisoformat(booking['created_at'])
        
        result.append(BookingWithDetails(
            booking_id=booking['booking_id'],
            user_name=user['name'] if user else 'Unknown',
            user_email=user['email'] if user else 'Unknown',
            artist_name=artist['name'] if artist else 'Unknown',
            service_name=service['name'] if service else 'Unknown',
            appointment_date=booking['appointment_date'],
            appointment_time=booking['appointment_time'],
            notes=booking.get('notes'),
            status=booking['status'],
            created_at=booking['created_at']
        ))
    
    return result

# ============ SEED DATA ROUTE ============

@api_router.post("/seed")
async def seed_data():
    # Check if data already exists
    existing_artists = await db.artists.count_documents({})
    if existing_artists > 0:
        return {"message": "Data already seeded"}
    
    # Clear existing data
    await db.artists.delete_many({})
    await db.services.delete_many({})
    
    # Seed artists
    artists = [
        Artist(
            name="Marcus Chen",
            bio="Specializing in blackwork and geometric designs with 12 years of experience. Every piece tells a story.",
            specialty="Blackwork & Geometric",
            image_url="https://images.unsplash.com/photo-1655960556432-b74f6ff0a54b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwxfHx0YXR0b28lMjBhcnRpc3QlMjB3b3JraW5nJTIwY2xvc2UlMjB1cCUyMGJsYWNrJTIwYW5kJTIwd2hpdGV8ZW58MHx8fHwxNzY5Nzc3OTk0fDA&ixlib=rb-4.1.0&q=85",
            instagram="@marcuschen.ink",
            years_experience=12
        ),
        Artist(
            name="Aria Rodriguez",
            bio="Fine line artist passionate about minimalist designs and delicate floral work. Precision is my art.",
            specialty="Fine Line & Floral",
            image_url="https://images.unsplash.com/photo-1767887874488-5f715c7db794?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwzfHxhcnRpc3RpYyUyMHRhdHRvbyUyMHBvcnRyYWl0JTIwcGhvdG9ncmFwaHl8ZW58MHx8fHwxNzY5Nzc4MDAwfDA&ixlib=rb-4.1.0&q=85",
            instagram="@aria.fineline",
            years_experience=8
        ),
        Artist(
            name="Jake Morrison",
            bio="Traditional American tattoo artist with a modern twist. Bold lines, vibrant colors, timeless designs.",
            specialty="Traditional American",
            image_url="https://images.unsplash.com/photo-1604449325317-4967c715538a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwyfHx0YXR0b28lMjBhcnRpc3QlMjB3b3JraW5nJTIwY2xvc2UlMjB1cCUyMGJsYWNrJTIwYW5kJTIwd2hpdGV8ZW58MHx8fHwxNzY5Nzc3OTk0fDA&ixlib=rb-4.1.0&q=85",
            instagram="@jakemorrison.trad",
            years_experience=15
        )
    ]
    
    for artist in artists:
        await db.artists.insert_one(artist.model_dump())
    
    # Seed services
    services = [
        Service(
            name="Custom Tattoo",
            description="Fully customized tattoo design tailored to your vision. Consultation included.",
            duration_minutes=180,
            price_start=200,
            icon="Palette"
        ),
        Service(
            name="Small Tattoo",
            description="Simple, small designs perfect for first-timers. Quick and affordable.",
            duration_minutes=60,
            price_start=80,
            icon="Sparkles"
        ),
        Service(
            name="Cover-Up",
            description="Expert cover-up work to transform old tattoos into something new.",
            duration_minutes=240,
            price_start=300,
            icon="RefreshCw"
        ),
        Service(
            name="Consultation",
            description="Free consultation to discuss your ideas and get a quote.",
            duration_minutes=30,
            price_start=0,
            icon="MessageCircle"
        )
    ]
    
    for service in services:
        await db.services.insert_one(service.model_dump())
    
    return {"message": "Data seeded successfully"}

# ============ ROOT ============

@api_router.get("/")
async def root():
    return {"message": "Neax Tattoos API"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()