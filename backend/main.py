from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
from .database import engine, Base
from .routers import auth, hosted_zones, records

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Route53 Clone API",
    description="Mock backend API for AWS Route53 Clone",
    version="1.0.0"
)

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https://.*\.vercel\.app|http://localhost:3000",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(hosted_zones.router)
app.include_router(records.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Route53 Clone API"}
