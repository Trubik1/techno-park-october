import os
import sys
import traceback

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

try:
    from main import app
    from mangum import Mangum
    handler = Mangum(app)
except Exception as e:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    app = FastAPI()

    @app.get("/{path:path}")
    async def error_handler(path: str):
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "traceback": traceback.format_exc()}
        )

    from mangum import Mangum
    handler = Mangum(app)
