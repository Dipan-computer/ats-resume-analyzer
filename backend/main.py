from io import BytesIO

import pdfplumber
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
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
            return {"error": "No file selected", "filename": "", "text": ""}

        if not file.filename.lower().endswith(".pdf"):
            return {
                "error": "Only PDF files are supported right now",
                "filename": file.filename,
                "text": "",
                "is_resume": False,
            }

        file_bytes = await file.read()

        extracted_text = ""
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"

        extracted_text = extracted_text.strip()

        if not extracted_text:
            return {
                "error": "Text could not be extracted from this PDF",
                "filename": file.filename,
                "text": "",
                "is_resume": False,
            }

        is_resume = check_if_resume(extracted_text, file.filename)

        if not is_resume:
            return {
                "error": "This PDF does not look like a resume/CV. Please upload a resume or CV PDF.",
                "filename": file.filename,
                "text": extracted_text[:1000],
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


def check_if_resume(text, filename=""):
    lower_text = text.lower()
    lower_name = filename.lower()

    filename_bonus_words = ["resume", "cv", "curriculum vitae", "biodata"]
    resume_keywords = [
        "education",
        "skills",
        "technical skills",
        "projects",
        "experience",
        "work experience",
        "internship",
        "certification",
        "summary",
        "objective",
        "profile",
        "email",
        "phone",
        "github",
        "linkedin",
    ]

    score = 0

    for word in filename_bonus_words:
        if word in lower_name:
            score += 2

    for word in resume_keywords:
        if word in lower_text:
            score += 1

    if "@" in text:
        score += 1

    if "linkedin" in lower_text or "github" in lower_text:
        score += 1

    if len(text.split()) > 80:
        score += 1

    return score >= 5