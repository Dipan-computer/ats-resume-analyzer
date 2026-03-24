 const handleAnalyze = async () => {
  if (!file) {
    alert("Please upload a file first");
    return;
  }

  try {
    setLoading(true);

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

    console.log("RESPONSE:", data);

    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    setResumeText(data.text);

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    alert(err.message);
  } finally {
    setLoading(false);
  }
};
