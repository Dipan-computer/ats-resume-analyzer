 const handleAnalyze = async () => {
  if (!resumeFile) {
    setError("Please upload a PDF resume first.");
    return;
  }

  setError(null);
  setResult(null);
  setResumeText("");
  setIsLoading(true);

  try {
    const formData = new FormData();
    formData.append("file", resumeFile);

    const response = await fetch("https://ats-resume-analyzer-1-t2kq.onrender.com/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log("UPLOAD RESPONSE:", data);

    if (!response.ok) {
      throw new Error(data?.error || "Upload failed");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    if (data.is_resume === false) {
      throw new Error("This PDF does not look like a resume or CV.");
    }

    setResumeText(data.text || "");
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    setError(err.message || "Failed to analyze resume.");
  } finally {
    setIsLoading(false);
  }
};
