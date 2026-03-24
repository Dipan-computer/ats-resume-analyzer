 const handleAnalyze = async () => {
  if (!file) {
    alert("Please select a file first");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file); // ⚠️ MUST be "file"

    const response = await fetch(
      "https://ats-resume-analyzer-1-t2kq.onrender.com/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    console.log("SERVER RESPONSE:", data);

    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    setResumeText(data.text);

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    setError(err.message || "Failed to upload resume");
  } finally {
    setLoading(false);
  }
};
