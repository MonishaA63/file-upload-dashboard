from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import pandas as pd

app = FastAPI()

# Root test endpoint
@app.get("/")
def root():
    return {"status": "Backend running"}

# CORS (frontend access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"]

@app.post("/upload")
async def upload_files(files: list[UploadFile] = File(...)):
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Max 5 files allowed")

    previews = []

    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()

        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Invalid file format")

        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")

        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(contents)

        # Preview file structure
        if ext == ".csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        previews.append({
            "filename": file.filename,
            "columns": df.columns.tolist(),
            "rows": len(df)
        })

    return {
        "message": "Files uploaded successfully",
        "preview": previews
    }

