from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.session import create_tables
from routes import admin_router, parent_router, public_router

# Create database tables
create_tables()
print("✅ Database tables created successfully!")

# Create FastAPI app
app = FastAPI(
    title="School Payment Management System",
    description="API for managing school fees, students, and payments",
    version="1.0.0"
)

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
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )