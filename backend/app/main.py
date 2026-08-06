from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.media import MEDIA_ROOT
from app.routers import auth, connections, follows, posts, profiles

app = FastAPI(title="JAB API")

app.add_middleware(
    CORSMiddleware,
    # Regex (not a fixed list) so the dev server is also reachable from a phone
    # on the same LAN, e.g. http://192.168.1.19:5173.
    allow_origin_regex=r"http://(localhost|192\.168\.\d{1,3}\.\d{1,3}):5173",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory=MEDIA_ROOT), name="media")

app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(connections.router)
app.include_router(follows.router)
app.include_router(posts.router)


@app.get("/health")
def health():
    return {"status": "ok"}
