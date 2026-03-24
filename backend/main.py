 from io import BytesIO
import pdfplumber
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ats-checker-dipan.netlify.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Backend is running successfully"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    try:
        if not file.filename:
            return {
                "error": "No file selected",
                "filename": "",
                "text": "",
                "is_resume": False,
            }

        if not file.filename.lower().endswith(".pdf"):
            return {
                "error": "Only PDF files are supported right now",
                "filename": file.filename,
                "text": "",
                "is_resume": False,
            }

        file_bytes = await file.read()

        if not file_bytes:
            return {
                "error": "Uploaded file is empty",
                "filename": file.filename,
                "text": "",
                "is_resume": False,
            }

        extracted_text = ""
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"

        extracted_text = extracted_text.strip()

        if not extracted_text:
            return {
                "error": "Text could not be extracted from this PDF. Try another resume PDF.",
                "filename": file.filename,
                "text": "",
                "is_resume": False,
            }

        return {
            "filename": file.filename,
            "text": extracted_text,
            "is_resume": True,
        }

    except Exception as e:
        print("UPLOAD ERROR:", str(e))
        return {
            "error": f"Failed to process PDF: {str(e)}",
            "filename": file.filename if file.filename else "",
            "text": "",
            "is_resume": False,
        }
