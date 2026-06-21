from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models
from .database import engine, get_db
import os
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

def upgrade_db_columns():
    from sqlalchemy import text
    with engine.begin() as conn:
        # Check and add 'plan' to organizations
        try:
            conn.execute(text("ALTER TABLE organizations ADD COLUMN plan VARCHAR DEFAULT 'SANDBOX_INIT';"))
        except Exception:
            pass
        # Check and add 'storage_used' to organizations
        try:
            conn.execute(text("ALTER TABLE organizations ADD COLUMN storage_used FLOAT DEFAULT 0.0;"))
        except Exception:
            pass
        # Check and add 'file_size' to uploads
        try:
            conn.execute(text("ALTER TABLE uploads ADD COLUMN file_size FLOAT DEFAULT 0.0;"))
        except Exception:
            pass
        # Check and add 'upload_id' to transactions
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN upload_id INTEGER REFERENCES uploads(id);"))
        except Exception:
            pass
        # Check and add 'is_saved' to reports
        try:
            conn.execute(text("ALTER TABLE reports ADD COLUMN is_saved BOOLEAN DEFAULT 0;"))
        except Exception:
            pass
        
        # Check and add 'prompt_tokens' to reports
        try:
            conn.execute(text("ALTER TABLE reports ADD COLUMN prompt_tokens INTEGER DEFAULT 0;"))
        except Exception:
            pass
            
        # Check and add 'completion_tokens' to reports
        try:
            conn.execute(text("ALTER TABLE reports ADD COLUMN completion_tokens INTEGER DEFAULT 0;"))
        except Exception:
            pass
            
        # Check and add 'total_tokens' to reports
        try:
            conn.execute(text("ALTER TABLE reports ADD COLUMN total_tokens INTEGER DEFAULT 0;"))
        except Exception:
            pass
        
        # Create indexes for organization_id if they don't exist
        for table, index_name in [
            ("transactions", "idx_transactions_org"),
            ("customers", "idx_customers_org"),
            ("products", "idx_products_org"),
            ("metrics", "idx_metrics_org"),
            ("insights", "idx_insights_org"),
            ("reports", "idx_reports_org"),
            ("uploads", "idx_uploads_org"),
            ("organization_members", "idx_org_members_org")
        ]:
            try:
                conn.execute(text(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table} (organization_id);"))
            except Exception:
                pass

        # Check and add agent and api key settings to users table
        for col, col_type, default_val in [
            ("agent_name", "VARCHAR", "'ARIA'"),
            ("agent_persona", "VARCHAR", "'ops_analyst'"),
            ("agent_tone", "VARCHAR", "'professional'"),
            ("agent_instructions", "VARCHAR", "''"),
            ("custom_api_key", "VARCHAR", "''"),
            ("custom_base_url", "VARCHAR", "''"),
            ("custom_model_name", "VARCHAR", "''")
        ]:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type} DEFAULT {default_val};"))
            except Exception:
                pass

def seed_default_user():
    from .database import SessionLocal
    from .routers.auth import pwd_context
    db = SessionLocal()
    try:
        default_email = "operon_default@example.com"
        exists = db.query(models.User).filter(models.User.email == default_email).first()
        if not exists:
            # Create user
            hashed = pwd_context.hash("defaultpassword123")
            new_user = models.User(email=default_email, hashed_password=hashed, full_name="Default Demo User")
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            # Create organization
            new_org = models.Organization(name="Default Demo User's Org")
            db.add(new_org)
            db.commit()
            db.refresh(new_org)
            
            # Add member
            member = models.OrganizationMember(user_id=new_user.id, organization_id=new_org.id, role="owner")
            db.add(member)
            db.commit()
            
            # Seed default app setting
            stage_exists = db.query(models.AppSetting).filter(models.AppSetting.key == "app_stage").first()
            if not stage_exists:
                default_stage = os.getenv("APP_STAGE", "sandbox")
                db_stage = models.AppSetting(key="app_stage", value=default_stage)
                db.add(db_stage)
                db.commit()
                
            print("Successfully seeded default demo user and app settings.")
    except Exception as e:
        print(f"Error seeding default user or settings: {e}")
    finally:
        db.close()

upgrade_db_columns()
models.Base.metadata.create_all(bind=engine)
seed_default_user()

app = FastAPI(title="Operon Operations API")
 
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.middleware("http")
async def log_api_latency(request: Request, call_next):
    path = request.url.path
    is_telemetry = (
        path.startswith("/admin") 
        or path.startswith("/api/admin") 
        or "/docs" in path 
        or "/openapi.json" in path 
        or path == "/"
        or path.endswith(".ico")
    )
    if is_telemetry:
        return await call_next(request)
        
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000.0
    
    try:
        db = next(get_db())
        log = models.ServerSpeedLog(
            path=path,
            method=request.method,
            duration_ms=round(duration_ms, 2),
            status_code=response.status_code
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Error logging server speed metric: {e}")
        
    return response
 
@app.get("/")
def read_root():
    return {"message": "Welcome to Operon Operations API"}
 
from .routers import uploads, auth, organizations, reports, analytics, ai_agent, admin
 
app.include_router(auth.router)
app.include_router(uploads.router)
app.include_router(organizations.router)
app.include_router(reports.router)
app.include_router(analytics.router)
app.include_router(ai_agent.router)
app.include_router(admin.router)
