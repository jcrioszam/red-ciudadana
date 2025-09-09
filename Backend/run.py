import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        limit_max_requests=1000,
        limit_concurrency=1000,
        timeout_keep_alive=30,
        timeout_graceful_shutdown=30
    ) 