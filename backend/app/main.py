import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db, SessionLocal
from app.poller import reconcile_pending_orders
from app.config import settings

from app.api import (
    simulate,
    webhook,
    admin,
    dashboard,
    audit,
    escalations
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

# Background poller loop task
async def poller_background_task():
    logger.info(f"Starting reconciliation poller background loop (interval: {settings.POLLER_INTERVAL_SECONDS}s)...")
    while True:
        try:
            await asyncio.sleep(settings.POLLER_INTERVAL_SECONDS)
            db = SessionLocal()
            try:
                # Reconcile orders pending > RECONCILIATION_CUTOFF_SECONDS
                reconcile_pending_orders(db, cutoff_seconds=settings.RECONCILIATION_CUTOFF_SECONDS)
            finally:
                db.close()
        except asyncio.CancelledError:
            logger.info("Poller background task stopped.")
            break
        except Exception as e:
            logger.error(f"Error in poller background task: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    poller_task = asyncio.create_task(poller_background_task())
    yield
    # Shutdown
    poller_task.cancel()
    try:
        await poller_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Deterministic Gate & LLM-Powered Payment Reconciliation Engine",
    lifespan=lifespan
)

# Enable CORS for frontend Vite dev server & production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(simulate.router)
app.include_router(webhook.router)
app.include_router(admin.router)
app.include_router(dashboard.router)
app.include_router(audit.router)
app.include_router(escalations.router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }
