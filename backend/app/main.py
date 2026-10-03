from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, orders, planning, loading, delivery

app = FastAPI(
    title="Waypoint Delivery System API",
    version="1.0.0",
    description="Backend API services supporting Dispatcher, Loader, Driver, and Store Manager workflows."
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all role-based API routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(planning.router, prefix="/api/v1")
app.include_router(loading.router, prefix="/api/v1")
app.include_router(delivery.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "online", "message": "Waypoint API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
