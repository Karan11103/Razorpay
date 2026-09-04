import os
from pathlib import Path
from dotenv import load_dotenv

# Search and load .env from current dir, parent dir, or project root
current_path = Path(__file__).resolve()
for loc in [
    Path.cwd() / ".env",
    current_path.parent.parent / ".env",
    current_path.parent.parent.parent / ".env",
]:
    if loc.is_file():
        load_dotenv(dotenv_path=loc)
        break

class Settings:
    PROJECT_NAME: str = "Ghost Payment Detector"
    VERSION: str = "1.0.0"
    
    # Razorpay API Credentials
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_mock_12345678")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "mock_secret_87654321")
    
    # Anthropic API Key
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ghost_payments.db")
    
    # Default Chaos Probabilities (0.0 to 1.0)
    DEFAULT_DROP_RATE: float = float(os.getenv("DEFAULT_DROP_RATE", "0.40"))
    DEFAULT_DELAY_RATE: float = float(os.getenv("DEFAULT_DELAY_RATE", "0.20"))
    DEFAULT_CORRUPT_RATE: float = float(os.getenv("DEFAULT_CORRUPT_RATE", "0.10"))
    
    # Minimum age of order in 'pending' status before reconciliation poller checks it (in seconds)
    # Spec specifies > 60 seconds for production, 10-15 seconds allows snappy live demoing.
    RECONCILIATION_CUTOFF_SECONDS: int = int(os.getenv("RECONCILIATION_CUTOFF_SECONDS", "10"))
    POLLER_INTERVAL_SECONDS: int = int(os.getenv("POLLER_INTERVAL_SECONDS", "30"))

settings = Settings()
