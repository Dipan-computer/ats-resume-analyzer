 import React, { useState, useEffect, useRef, useMemo } from "react";

const MOCK_RESULT = {
  ats_score: 74,
  keyword_match_score: 68,
  format_score: 82,
  content_score: 71,
  summary:
    "Your resume is a solid match for this role with good keyword coverage in technical areas. However, some key skills from the job description are missing and should be added to improve ATS compatibility.",
  matched_keywords: ["React", "JavaScript", "REST API", "Node.js", "Git", "CSS"],
  missing_keywords: ["Docker", "AWS", "CI/CD", "Redux", "Testing"],
  strengths: [
    "Strong technical skills section with relevant technologies.",
    "Clear project section with practical tools used.",
    "Contact information is complete and professional.",
  ],
  improvements: [
    "Add missing keywords like Docker, AWS, and CI/CD to improve match score.",
    "Quantify more accomplishments with metrics.",
    "Consider adding a stronger professional summary.",
  ],
  warnings: [
    "Avoid using tables because some ATS tools may not parse them well.",
    "Keep formatting simple and clean.",
  ],
};

export default function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [scanStep, setScanStep] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const resultRef = useRef(null);
  const scanTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch(" https://ats-resume-analyzer-1-t2kq.onrender.com/")
      .then((res) => {
        if (!res.ok) throw new Error("Backend offline");
        return res.json();
      })
      .then(() => setBackendStatus("online"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  const analysis = useMemo(() => {
    if (!resumeText.trim()) return null;
    return analyzeResume(resumeText, jobDescription);
  }, [resumeText, jobDescription]);

  const mergedResult = useMemo(() => {
    if (!analysis) return null;

    return {
      ats_score: analysis.overall,
      keyword_match_score: analysis.keywordScore,
      format_score: analysis.sectionScore,
      content_score: analysis.readabilityScore,
      summary:
        analysis.overall >= 80
          ? "Your resume looks strong and ATS-friendly for this role."
          : analysis.overall >= 65
          ? "Your resume is decent, but a few improvements can make it stronger for ATS screening."
          : "Your resume needs improvement to perform better in ATS screening.",
      matched_keywords: analysis.matchedKeywords,
      missing_keywords: analysis.missingKeywords,
      strengths: analysis.strengths,
      improvements: analysis.suggestions,
      warnings: analysis.warnings,
    };
  }, [analysis]);

  const startScanSteps = () => {
    let step = 0;
    setScanStep(0);
    clearInterval(scanTimerRef.current);
    scanTimerRef.current = setInterval(() => {
      step++;
      setScanStep(step);
      if (step >= 5) clearInterval(scanTimerRef.current);
    }, 500);
  };

  const handleAnalyze = async () => {
    if (!resumeFile) {
      setError("Please upload a PDF resume first.");
      return;
    }

    setError(null);
    setResult(null);
    setResumeText("");
    setIsLoading(true);
    startScanSteps();

    try {
      if (backendStatus === "offline") {
        await new Promise((r) => setTimeout(r, 2500));
        setResult(MOCK_RESULT);
      } else {
        const formData = new FormData();
        formData.append("file", resumeFile);

        const response = await fetch("https://ats-resume-analyzer-1-t2kq.onrender.com//upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to upload resume.");
        }

        if (data.error) {
          throw new Error(data.error);
        }

        setResumeText(data.text || "");
      }
    } catch (err) {
      setError(err.message || "Failed to analyze resume. Please try again.");
    } finally {
      clearInterval(scanTimerRef.current);
      setIsLoading(false);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  useEffect(() => {
    if (resumeText && mergedResult) {
      setResult(mergedResult);
    }
  }, [resumeText, mergedResult]);

  const handleReset = () => {
    setResult(null);
    setError(null);
    setResumeFile(null);
    setJobDescription("");
    setResumeText("");
    setScanStep(0);
    setDragActive(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const canAnalyze = resumeFile && !isLoading;

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setResumeFile(file);
      setError(null);
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          font-family: Inter, Arial, sans-serif;
          background: #020617;
          color: #e2e8f0;
        }

        .fade-in {
          animation: fadeInUp 0.7s ease forwards;
        }

        .float-card {
          animation: floatCard 4s ease-in-out infinite;
        }

        .pulse-glow {
          animation: pulseGlow 2.2s ease-in-out infinite;
        }

        .slide-in {
          animation: slideIn 0.6s ease forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(22px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes floatCard {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 0 rgba(56, 189, 248, 0.0);
          }
          50% {
            box-shadow: 0 0 30px rgba(56, 189, 248, 0.15);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -300px 0;
          }
          100% {
            background-position: 300px 0;
          }
        }

        .shimmer {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.04) 0%,
            rgba(255,255,255,0.10) 50%,
            rgba(255,255,255,0.04) 100%
          );
          background-size: 600px 100%;
          animation: shimmer 1.5s infinite linear;
        }

        .grid-responsive {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 24px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .chips-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        @media (max-width: 1024px) {
          .grid-responsive {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={styles.app}>
        <div style={styles.bgOrbOne} />
        <div style={styles.bgOrbTwo} />
        <div style={styles.bgGrid} />

        <header style={styles.header} className="fade-in">
          <div style={styles.headerBox}>
            <div style={styles.navbar}>
              <div style={styles.logoWrap}>
                <div style={styles.logoBadge}>AI</div>
                <div>
                  <div style={styles.logoTitle}>ATS Resume Analyzer</div>
                  <div style={styles.logoSub}>React + FastAPI Project</div>
                </div>
              </div>

              <div
                style={{
                  ...styles.statusPill,
                  ...(backendStatus === "online"
                    ? styles.statusOnline
                    : backendStatus === "offline"
                    ? styles.statusOffline
                    : styles.statusChecking),
                }}
              >
                <span style={styles.statusDot} />
                {backendStatus === "online"
                  ? "Backend Online"
                  : backendStatus === "offline"
                  ? "Demo Mode"
                  : "Checking Backend"}
              </div>
            </div>

            <div style={styles.hero}>
              <div style={styles.heroText}>
                <div style={styles.badge}>AI-Powered Resume Analysis</div>
                <h1 style={styles.title}>
                  Beat the <span style={styles.highlight}>ATS Filter</span>
                </h1>
                <p style={styles.subtitle}>
                  Upload your resume and optionally paste the job description. Get ATS score,
                  matched keywords, missing keywords, strengths, and improvements in a sleek,
                  recruiter-friendly dashboard.
                </p>

                <div style={styles.heroStats}>
                  <StatPill label="PDF Upload" />
                  <StatPill label="Responsive UI" />
                  <StatPill label="ATS Insights" />
                  <StatPill label="Interview Ready" />
                </div>

                {backendStatus === "offline" && (
                  <div style={styles.demoNotice}>
                    Backend offline — running in <strong>demo mode</strong>
                  </div>
                )}
              </div>

              <div style={styles.heroCard} className="float-card pulse-glow">
                <div style={styles.heroCardTop}>
                  <span style={styles.heroCardDot} />
                  <span style={styles.heroCardDot} />
                  <span style={styles.heroCardDot} />
                </div>
                <div style={styles.heroCardScore}>82</div>
                <div style={styles.heroCardLabel}>Sample ATS Score</div>
                <div style={styles.heroCardBar}>
                  <div style={{ ...styles.heroCardFill, width: "82%" }} />
                </div>
                <div style={styles.heroCardMiniText}>Keyword Match • Format • Content</div>
              </div>
            </div>
          </div>
        </header>

        <main style={styles.main}>
          <div style={styles.workspace} className="grid-responsive">
            <div style={styles.card} className="fade-in">
              <h2 style={styles.cardTitle}>Upload & Analyze</h2>
              <p style={styles.cardSub}>Upload PDF resume and compare it with target role</p>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  ...styles.dropZone,
                  ...(dragActive ? styles.dropZoneActive : {}),
                }}
              >
                <div style={styles.dropIcon}>📄</div>
                <div style={styles.dropTitle}>Drag & drop your resume here</div>
                <div style={styles.dropSub}>or choose file manually</div>

                <button
                  type="button"
                  style={styles.browseBtn}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse PDF
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  style={{ display: "none" }}
                />
              </div>

              {resumeFile && (
                <div style={styles.fileChip}>
                  <span>✅</span>
                  <span style={{ wordBreak: "break-word" }}>{resumeFile.name}</span>
                </div>
              )}

              <div style={{ marginTop: 22 }}>
                <label style={styles.label}>Job Description</label>
                <textarea
                  style={styles.textarea}
                  placeholder="Paste the full job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={10}
                />
                <div style={styles.charCount}>{jobDescription.length} chars</div>
              </div>

              {error && <div style={styles.errorBanner}>{error}</div>}

              <button
                style={{
                  ...styles.analyzeBtn,
                  opacity: canAnalyze ? 1 : 0.6,
                  cursor: canAnalyze ? "pointer" : "not-allowed",
                }}
                onClick={handleAnalyze}
                disabled={!canAnalyze}
              >
                {isLoading ? "Analyzing..." : "Analyze Resume"}
              </button>

              {result && (
                <button style={styles.resetBtn} onClick={handleReset}>
                  Start Over
                </button>
              )}
            </div>

            <div style={styles.resultsCol} ref={resultRef}>
              {!isLoading && !result && (
                <div style={styles.emptyState} className="slide-in">
                  <div style={styles.emptyIcon}>✨</div>
                  <div style={styles.emptyTitle}>Results will appear here</div>
                  <div style={styles.emptySub}>
                    Upload your resume to start ATS analysis and get a modern score dashboard.
                  </div>
                </div>
              )}

              {isLoading && (
                <div style={styles.loaderCard} className="slide-in">
                  <h3 style={styles.cardTitle}>Scanning Resume...</h3>
                  <p style={styles.cardSub}>
                    Step {Math.min(scanStep, 5)} of 5 — uploading, extracting, analyzing
                  </p>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${Math.min(scanStep * 20, 100)}%`,
                      }}
                    />
                  </div>

                  <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
                    <div style={{ ...styles.skeletonLine, width: "100%" }} className="shimmer" />
                    <div style={{ ...styles.skeletonLine, width: "85%" }} className="shimmer" />
                    <div style={{ ...styles.skeletonLine, width: "65%" }} className="shimmer" />
                  </div>
                </div>
              )}

              {!isLoading && result && (
                <div style={styles.resultCard} className="slide-in">
                  <div style={styles.scoreRow}>
                    <div
                      style={{
                        ...styles.scoreCircle,
                        borderColor: getScoreColor(result.ats_score),
                        boxShadow: `0 0 40px ${getScoreGlow(result.ats_score)}`,
                      }}
                    >
                      <div style={styles.scoreNumber}>{result.ats_score}</div>
                      <div style={styles.scoreLabel}>ATS Score</div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={styles.resultTitle}>
                        {result.ats_score >= 80
                          ? "Strong Resume"
                          : result.ats_score >= 65
                          ? "Good Resume"
                          : "Needs Improvement"}
                      </h2>
                      <p style={styles.resultSummary}>{result.summary}</p>
                    </div>
                  </div>

                  <div className="metrics-grid" style={styles.metricGrid}>
                    <Metric label="Keyword Match" score={result.keyword_match_score} />
                    <Metric label="Format Score" score={result.format_score} />
                    <Metric label="Content Score" score={result.content_score} />
                  </div>

                  <Section title="Matched Keywords" items={result.matched_keywords} green chip />
                  <Section title="Missing Keywords" items={result.missing_keywords} red chip />
                  <Section title="Strengths" items={result.strengths} />
                  <Section title="Improvements" items={result.improvements} />
                  <Section title="Warnings" items={result.warnings} warning />

                  {resumeText && (
                    <>
                      <h3 style={styles.sectionTitle}>Extracted Resume Text</h3>
                      <div style={styles.previewBox}>{resumeText}</div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        <footer style={styles.footer}>
          ATS Resume Checker · Powered by FastAPI + React · Responsive UI
        </footer>
      </div>
    </>
  );
}

function StatPill({ label }) {
  return <div style={styles.statPill}>{label}</div>;
}

function Metric({ label, score }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricTop}>
        <span>{label}</span>
        <span style={{ color: getScoreColor(score), fontWeight: 700 }}>{score}%</span>
      </div>
      <div style={styles.metricBarBg}>
        <div
          style={{
            ...styles.metricBarFill,
            width: `${score}%`,
            background: getScoreColor(score),
          }}
        />
      </div>
    </div>
  );
}

function Section({ title, items = [], green = false, red = false, warning = false, chip = false }) {
  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <div className={chip ? "chips-grid" : ""} style={!chip ? styles.listWrap : undefined}>
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              ...(chip ? styles.chipItem : styles.listItem),
              borderColor: green
                ? "rgba(16,185,129,0.35)"
                : red
                ? "rgba(239,68,68,0.35)"
                : warning
                ? "rgba(245,158,11,0.35)"
                : "#1f2937",
              background: green
                ? "rgba(16,185,129,0.10)"
                : red
                ? "rgba(239,68,68,0.10)"
                : warning
                ? "rgba(245,158,11,0.10)"
                : "#0f172a",
              color: green ? "#a7f3d0" : red ? "#fecaca" : warning ? "#fde68a" : "#cbd5e1",
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function getScoreColor(score) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

function getScoreGlow(score) {
  if (score >= 80) return "rgba(16,185,129,0.16)";
  if (score >= 60) return "rgba(245,158,11,0.16)";
  return "rgba(239,68,68,0.16)";
}

function analyzeResume(text, jdText) {
  const lower = text.toLowerCase();

  const keywords = [
    "react",
    "javascript",
    "node",
    "express",
    "mongodb",
    "python",
    "html",
    "css",
    "api",
    "git",
    "sql",
    "github",
    "fastapi",
    "rest",
    "tailwind",
  ];

  const matchedKeywords = keywords.filter((k) => lower.includes(k));
  const missingKeywords = jdText.trim()
    ? extractJDKeywords(jdText).filter((k) => !lower.includes(k.toLowerCase()))
    : keywords.filter((k) => !lower.includes(k)).slice(0, 6);

  const keywordScore = Math.min(
    100,
    Math.round((matchedKeywords.length / keywords.length) * 100)
  );

  const sectionChecks = [
    /education/i.test(text),
    /skill/i.test(text),
    /project/i.test(text),
    /experience|work experience/i.test(text),
    /summary|objective|profile/i.test(text),
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text),
    /(\+91[\s-]?)?[6-9]\d{9}/.test(text),
  ];

  const sectionScore = Math.round(
    (sectionChecks.filter(Boolean).length / sectionChecks.length) * 100
  );

  const metricsMatches =
    text.match(/\d+%|\d+\+|\d+\s*(years|yrs|projects|users|clients|days|months)/gi) || [];
  const impactScore = Math.min(100, metricsMatches.length * 20);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  let readabilityScore = 55;
  if (wordCount >= 120 && wordCount <= 900) readabilityScore = 88;
  else if (wordCount >= 80) readabilityScore = 75;
  else if (wordCount >= 40) readabilityScore = 65;

  const strengths = [];
  const suggestions = [];
  const warnings = [];

  if (matchedKeywords.length >= 5) {
    strengths.push("Good technical keyword coverage for ATS scanning.");
  }
  if (/project/i.test(text)) {
    strengths.push("Project section is present, which improves resume strength.");
  }
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) {
    strengths.push("Professional contact information is included.");
  }

  if (missingKeywords.length > 0) {
    suggestions.push(
      `Add missing keywords like ${missingKeywords.slice(0, 5).join(", ")} where genuine.`
    );
  }
  if (impactScore < 50) {
    suggestions.push("Add measurable achievements using numbers, percentages, or counts.");
  }
  if (sectionScore < 75) {
    suggestions.push(
      "Include clearer sections like Summary, Skills, Projects, Experience, and Education."
    );
  }
  if (readabilityScore < 75) {
    suggestions.push("Use shorter bullet points and cleaner formatting for readability.");
  }

  if (/table/i.test(text)) {
    warnings.push("Avoid using complex tables because ATS may parse them badly.");
  }
  warnings.push("Keep formatting simple and avoid graphics-heavy resumes.");

  const overall = Math.round(
    keywordScore * 0.35 +
      sectionScore * 0.25 +
      readabilityScore * 0.2 +
      impactScore * 0.2
  );

  return {
    overall,
    keywordScore,
    sectionScore,
    readabilityScore,
    impactScore,
    matchedKeywords,
    missingKeywords: missingKeywords.slice(0, 8),
    strengths: strengths.length ? strengths : ["Resume has a usable structure for ATS review."],
    suggestions: suggestions.length
      ? suggestions
      : ["Your resume looks solid. Tailor it slightly for each job role."],
    warnings,
  };
}

function extractJDKeywords(text) {
  const words = Array.from(
    new Set(
      (text.toLowerCase().match(/[a-z][a-z+#.-]{2,}/g) || []).filter((w) => !STOP_WORDS.has(w))
    )
  );
  return words.slice(0, 10);
}

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "you", "your", "our", "their", "that", "this",
  "from", "are", "was", "will", "have", "has", "had", "but", "not", "job",
  "role", "team", "work", "all", "any", "who", "can", "may", "more", "years",
  "year", "using", "use", "into", "out", "able", "good", "strong", "such",
  "etc", "via", "per", "one", "two", "new", "need", "required", "preferred",
  "candidate", "candidates", "experience", "skills", "skill", "knowledge",
  "about", "across", "than", "then", "also", "should", "must", "build",
  "building", "develop", "developer", "development", "based", "well", "like",
]);

const styles = {
  app: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top, rgba(30,41,59,0.85), rgba(2,6,23,1) 55%), #020617",
    color: "#e2e8f0",
    fontFamily: "Inter, Arial, sans-serif",
  },
  bgOrbOne: {
    position: "absolute",
    top: "-120px",
    right: "-120px",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "rgba(56, 189, 248, 0.10)",
    filter: "blur(60px)",
    pointerEvents: "none",
  },
  bgOrbTwo: {
    position: "absolute",
    bottom: "-120px",
    left: "-120px",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "rgba(16, 185, 129, 0.10)",
    filter: "blur(60px)",
    pointerEvents: "none",
  },
  bgGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
    pointerEvents: "none",
  },
  header: {
    position: "relative",
    padding: "28px 16px 10px",
    zIndex: 1,
  },
  headerBox: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 30,
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #10b981, #38bdf8)",
    color: "#fff",
    fontWeight: 800,
    boxShadow: "0 14px 34px rgba(56,189,248,0.20)",
  },
  logoTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: 800,
  },
  logoSub: {
    color: "#94a3b8",
    fontSize: 12,
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    border: "1px solid transparent",
    backdropFilter: "blur(12px)",
  },
  statusOnline: {
    background: "rgba(16,185,129,0.10)",
    color: "#a7f3d0",
    borderColor: "rgba(16,185,129,0.25)",
  },
  statusOffline: {
    background: "rgba(245,158,11,0.10)",
    color: "#fde68a",
    borderColor: "rgba(245,158,11,0.25)",
  },
  statusChecking: {
    background: "rgba(59,130,246,0.10)",
    color: "#bfdbfe",
    borderColor: "rgba(59,130,246,0.25)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "currentColor",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 24,
    alignItems: "center",
  },
  heroText: {
    minWidth: 0,
  },
  badge: {
    display: "inline-block",
    background: "rgba(30,41,59,0.70)",
    color: "#93c5fd",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "14px",
    border: "1px solid rgba(59,130,246,0.18)",
    backdropFilter: "blur(10px)",
  },
  title: {
    fontSize: "clamp(34px, 5vw, 58px)",
    margin: "0 0 14px 0",
    color: "#fff",
    lineHeight: 1.02,
    letterSpacing: "-1px",
  },
  highlight: {
    background: "linear-gradient(90deg, #38bdf8, #10b981)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    maxWidth: "760px",
    lineHeight: 1.8,
    color: "#94a3b8",
    margin: 0,
    fontSize: 15,
  },
  heroStats: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 24,
  },
  statPill: {
    padding: "10px 14px",
    borderRadius: 999,
    background: "rgba(15,23,42,0.78)",
    border: "1px solid rgba(148,163,184,0.16)",
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: 700,
  },
  demoNotice: {
    marginTop: "18px",
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.35)",
    color: "#fcd34d",
    padding: "12px 14px",
    borderRadius: "14px",
    display: "inline-block",
  },
  heroCard: {
    background: "linear-gradient(180deg, rgba(15,23,42,0.95), rgba(2,6,23,0.90))",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: 28,
    padding: 24,
    backdropFilter: "blur(16px)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
    maxWidth: 380,
    justifySelf: "end",
    width: "100%",
  },
  heroCardTop: {
    display: "flex",
    gap: 8,
    marginBottom: 22,
  },
  heroCardDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.18)",
  },
  heroCardScore: {
    fontSize: 54,
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1,
  },
  heroCardLabel: {
    marginTop: 6,
    color: "#94a3b8",
    fontSize: 14,
  },
  heroCardBar: {
    marginTop: 18,
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    background: "#1e293b",
  },
  heroCardFill: {
    height: "100%",
    background: "linear-gradient(90deg, #10b981, #38bdf8)",
    borderRadius: 999,
  },
  heroCardMiniText: {
    marginTop: 14,
    color: "#64748b",
    fontSize: 12,
  },
  main: {
    position: "relative",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px 16px 40px",
    zIndex: 1,
  },
  workspace: {
    display: "grid",
    gap: "20px",
  },
  card: {
    background: "rgba(15,23,42,0.78)",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "24px",
    padding: "24px",
    backdropFilter: "blur(18px)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
  },
  resultsCol: {
    minHeight: "300px",
  },
  cardTitle: {
    margin: "0 0 8px 0",
    color: "#fff",
    fontSize: 24,
  },
  cardSub: {
    margin: "0 0 18px 0",
    color: "#94a3b8",
    lineHeight: 1.7,
  },
  dropZone: {
    borderRadius: 22,
    border: "1.5px dashed rgba(148,163,184,0.22)",
    background: "linear-gradient(180deg, rgba(2,6,23,0.65), rgba(15,23,42,0.65))",
    padding: "28px 18px",
    textAlign: "center",
    transition: "all 0.25s ease",
  },
  dropZoneActive: {
    borderColor: "rgba(56,189,248,0.50)",
    background: "linear-gradient(180deg, rgba(14,165,233,0.10), rgba(16,185,129,0.08))",
    transform: "translateY(-2px)",
  },
  dropIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  dropTitle: {
    color: "#fff",
    fontWeight: 800,
    fontSize: 18,
    marginBottom: 8,
  },
  dropSub: {
    color: "#94a3b8",
    marginBottom: 16,
    fontSize: 14,
  },
  browseBtn: {
    border: "none",
    padding: "12px 18px",
    borderRadius: 14,
    background: "linear-gradient(90deg, #0ea5e9, #10b981)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 14px 30px rgba(14,165,233,0.16)",
  },
  fileChip: {
    marginTop: "14px",
    padding: "12px 14px",
    background: "rgba(16,185,129,0.12)",
    border: "1px solid rgba(16,185,129,0.30)",
    color: "#99f6e4",
    borderRadius: "14px",
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#fff",
    fontWeight: "700",
  },
  textarea: {
    width: "100%",
    minHeight: "220px",
    borderRadius: "16px",
    border: "1px solid rgba(148,163,184,0.16)",
    background: "rgba(2,6,23,0.75)",
    color: "#cbd5e1",
    padding: "16px",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: 1.6,
    fontSize: 14,
  },
  charCount: {
    marginTop: "8px",
    color: "#64748b",
    fontSize: "12px",
    textAlign: "right",
  },
  errorBanner: {
    marginTop: "16px",
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.35)",
    color: "#fca5a5",
    padding: "12px 14px",
    borderRadius: "14px",
    lineHeight: 1.6,
  },
  analyzeBtn: {
    marginTop: "18px",
    width: "100%",
    padding: "15px 18px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(90deg, #10b981, #3b82f6)",
    color: "#fff",
    fontWeight: "800",
    fontSize: "15px",
    boxShadow: "0 16px 36px rgba(59,130,246,0.18)",
    transition: "all 0.25s ease",
  },
  resetBtn: {
    marginTop: "12px",
    width: "100%",
    padding: "13px 18px",
    borderRadius: "16px",
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(2,6,23,0.75)",
    color: "#e2e8f0",
    fontWeight: "700",
    cursor: "pointer",
  },
  emptyState: {
    background: "rgba(15,23,42,0.78)",
    border: "1px dashed rgba(148,163,184,0.22)",
    borderRadius: "24px",
    padding: "52px 26px",
    textAlign: "center",
    color: "#94a3b8",
    backdropFilter: "blur(18px)",
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: "24px",
    fontWeight: "800",
    marginBottom: "8px",
  },
  emptySub: {
    lineHeight: 1.7,
    maxWidth: 460,
    margin: "0 auto",
  },
  loaderCard: {
    background: "rgba(15,23,42,0.78)",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "24px",
    padding: "24px",
    backdropFilter: "blur(18px)",
  },
  progressBar: {
    marginTop: "14px",
    height: "10px",
    borderRadius: "999px",
    background: "#1f2937",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #10b981, #3b82f6)",
    transition: "width 0.35s ease",
  },
  skeletonLine: {
    height: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  resultCard: {
    background: "rgba(15,23,42,0.82)",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "24px",
    padding: "24px",
    backdropFilter: "blur(18px)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
  },
  scoreRow: {
    display: "flex",
    gap: "22px",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "26px",
  },
  scoreCircle: {
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    border: "10px solid #10b981",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(circle, rgba(255,255,255,0.04), rgba(2,6,23,0.78))",
    flexShrink: 0,
  },
  scoreNumber: {
    fontSize: "42px",
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    lineHeight: 1,
  },
  scoreLabel: {
    fontSize: "12px",
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 6,
  },
  resultTitle: {
    margin: "0 0 8px 0",
    color: "#fff",
    fontSize: 26,
  },
  resultSummary: {
    margin: 0,
    color: "#94a3b8",
    lineHeight: 1.8,
  },
  metricGrid: {
    marginBottom: "22px",
  },
  metricCard: {
    background: "rgba(2,6,23,0.85)",
    border: "1px solid rgba(148,163,184,0.10)",
    borderRadius: "16px",
    padding: "14px",
  },
  metricTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    fontSize: "14px",
    color: "#cbd5e1",
  },
  metricBarBg: {
    height: "8px",
    borderRadius: "999px",
    background: "#1f2937",
    overflow: "hidden",
  },
  metricBarFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.4s ease",
  },
  sectionTitle: {
    margin: "0 0 10px 0",
    color: "#fff",
    fontSize: 18,
  },
  listWrap: {
    display: "grid",
    gap: "10px",
  },
  listItem: {
    border: "1px solid #1f2937",
    borderRadius: "14px",
    padding: "13px 14px",
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  chipItem: {
    border: "1px solid #1f2937",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 13,
    lineHeight: 1.4,
  },
  previewBox: {
    marginTop: "10px",
    background: "rgba(2,6,23,0.85)",
    border: "1px solid rgba(148,163,184,0.10)",
    borderRadius: "16px",
    padding: "16px",
    color: "#cbd5e1",
    whiteSpace: "pre-wrap",
    maxHeight: "280px",
    overflow: "auto",
    lineHeight: 1.7,
    fontSize: 14,
  },
  footer: {
    position: "relative",
    textAlign: "center",
    color: "#64748b",
    padding: "26px 16px 38px",
    zIndex: 1,
  },
};