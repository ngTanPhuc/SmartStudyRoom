from fastapi import FastAPI

from .routes import router

app = FastAPI(
    title="Vietnamese Smart Home Intent Classification API",
    description="API nhận diện ý định điều khiển thiết bị thông minh bằng tiếng Việt",
    version="1.0.0",
)

app.include_router(router)
