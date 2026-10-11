import { useMemo, useState } from 'react';
import './App.css';

const sampleJobDescription = `We are looking for a frontend-focused developer with strong JavaScript, React, TypeScript, and HTML/CSS skills. The ideal candidate should build dashboards, ship production-ready features, and work with REST APIs and Node.js. Experience with Git, SQL, Docker, and testing is a plus.`;

const ringLength = 2 * Math.PI * 52;

function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState(sampleJobDescription);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const scoreOffset = useMemo(() => {
    if (!result) return ringLength;
    return ringLength * (1 - result.score / 100);
  }, [result]);

  const handleFile = (file) => {
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setResumeFile(null);
      setResult(null);
      setError('Please upload a PDF resume only.');
      return;
    }

    setResumeFile(file);
    setResult(null);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!resumeFile) {
      setError('Upload a resume PDF before analyzing.');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Add a job description to compare the resume against.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jd', jobDescription.trim());

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to analyze resume and job description.');
      }

      setResult(payload.analysis);
    } catch (loadError) {
      setError(loadError.message || 'Something went wrong while analyzing your PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">0<span className="brand-arrow">→</span>Shipped</div>
        <nav className="nav">
          <a href="#how">How it works</a>
          <a href="#analyze" className="nav-cta">Analyze resume</a>
        </nav>
      </header>

      <main className="page-content">
        <section className="hero-section" id="analyze">
          <div className="hero-copy">
            <p className="eyebrow">Resume matching · AI ready</p>
            <h1>Compare a resume PDF with a job description in seconds.</h1>
            <p className="subtitle">
              Upload a PDF, paste the job description, and see the match score, matched skills,
              and missing gaps — ready to extend with AI scoring later.
            </p>
          </div>

          <form className="analysis-panel" onSubmit={handleSubmit}>
            <label
              className={`dropzone ${isDragging ? 'drag-active' : ''}`}
              htmlFor="resume-upload"
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  document.getElementById('resume-upload')?.click();
                }
              }}
              onDragEnter={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                handleFile(event.dataTransfer.files?.[0]);
              }}
            >
              <input
                id="resume-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => {
                  handleFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
              <div className="drop-icon">⇩</div>
              <strong>{resumeFile ? resumeFile.name : 'Drop your resume here'}</strong>
              <span>or browse files · PDF only</span>
            </label>

            <label className="field-block">
              <span>Job description</span>
              <textarea
                value={jobDescription}
                onChange={(event) => {
                  setJobDescription(event.target.value);
                  setResult(null);
                }}
                rows={8}
                placeholder="Paste the job description here..."
              />
            </label>

            {error ? <p className="error-banner">{error}</p> : null}

            <button type="submit" className="primary-button" disabled={isLoading}>
              {isLoading ? 'Analyzing…' : 'Analyze match'}
            </button>
          </form>
        </section>

        <section className="results-panel" id="results" hidden={!result}>
          {result ? (
            <>
              <div className="results-header">
                <div>
                  <p className="eyebrow dark">Score overview</p>
                  <h2>Resume fit for the role</h2>
                  <p className="results-method">
                    Basic tracked-skill comparison · AI scoring is not enabled
                  </p>
                </div>
              </div>

              <div className="results-grid">
                <article className="score-card card">
                  <div className="ring-wrap">
                    <svg viewBox="0 0 120 120" className="ring" aria-hidden="true">
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#7c3aed" />
                          <stop offset="100%" stopColor="#22d3ee" />
                        </linearGradient>
                      </defs>
                      <circle className="ring-bg" cx="60" cy="60" r="52" />
                      <circle
                        className="ring-fg"
                        cx="60"
                        cy="60"
                        r="52"
                        style={{ strokeDashoffset: scoreOffset }}
                      />
                    </svg>
                    <div className="score-value">
                      <span>{result.score}</span>
                      <small>/100</small>
                    </div>
                  </div>
                  <p className="score-caption">{result.summary}</p>
                </article>

                <article className="card">
                  <h3>
                    <span className="dot success-dot"></span>
                    Matched skills
                    <span className="count">{result.matchedSkills.length}</span>
                  </h3>
                  <ul className="chip-list">
                    {result.matchedSkills.map((skill) => (
                      <li key={skill}>{skill}</li>
                    ))}
                  </ul>
                </article>

                <article className="card">
                  <h3>
                    <span className="dot warning-dot"></span>
                    Missing skills
                    <span className="count">{result.missingSkills.length}</span>
                  </h3>
                  <ul className="chip-list missing-list">
                    {result.missingSkills.map((skill) => (
                      <li key={skill}>{skill}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </>
          ) : null}
        </section>

        <section className="how-it-works" id="how">
          <h2>How it works</h2>
          <div className="steps">
            <div className="step-card">
              <span>1</span>
              <h3>Upload PDF</h3>
              <p>Drop your resume file in the upload zone.</p>
            </div>
            <div className="step-card">
              <span>2</span>
              <h3>Add J.D.</h3>
              <p>Paste the job description the resume needs to match.</p>
            </div>
            <div className="step-card">
              <span>3</span>
              <h3>Review score</h3>
              <p>See the score, matched skills, and missing skill gaps.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
