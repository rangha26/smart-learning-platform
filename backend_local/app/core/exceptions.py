import traceback

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.exceptions import ExceptionMiddleware, HTTPException as StarletteHTTPException

async def global_exception_handler(request: Request, exc: Exception):
    
    if isinstance(exc, (HTTPException, StarletteHTTPException)):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.detail if hasattr(exc, "detail") else str(exc),
                "data": None,
                "error_code": exc.status_code
            }
        )

    traceback.print_exc()  
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal Server Error. Please contact admin.",
            "data": None,
            "error_code": 500
        }
    )