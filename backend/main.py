from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import APP_TITLE, CORS_OPTIONS
from routes import router

app = FastAPI(title=APP_TITLE)
app.add_middleware(CORSMiddleware, **CORS_OPTIONS)
app.include_router(router)
