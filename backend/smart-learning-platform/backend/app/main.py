from fastapi import FastAPI

app = FastAPI(
    title="Smart Learning Platform API",
    version="1.0.0",
    description="API for Smart Learning Platform",
)


@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Learning Platform API"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
