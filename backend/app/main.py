from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, orders, planning, loading, delivery

app = FastAPI(
    title="Nexora Distribution API",
    description="Full-stack logistics management platform",
    version="1.0.0"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins during local dev / hackathon evaluation
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(planning.router, prefix="/api/v1/planning", tags=["Planning"])
app.include_router(loading.router, prefix="/api/v1/loading", tags=["Loading"])
app.include_router(delivery.router, prefix="/api/v1/delivery", tags=["Delivery"])

@app.get("/")
def read_root():
    return {"message": "Nexora Distribution API is running"}
