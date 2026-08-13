from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database.session import create_tables
from .routes import admin_router, parent_router, public_router

# Create database tables
create_tables()
print("✅ Database tables created successfully!")

# Create FastAPI app
app = FastAPI(
    title="School Payment Management System",
    description="API for managing school fees, students, and payments",
    version="1.0.0",
    swagger_ui_parameters={
        "persistAuthorization": True  # ADD THIS - Keeps token after page refresh
    }
)

origins = [
    "http://localhost:5173/",  # Default Vite React local address
    "http://localhost:3000/",  # Default Create-React-App local address
    ]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(public_router)
app.include_router(admin_router)
app.include_router(parent_router)

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "School Payment Management System API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
