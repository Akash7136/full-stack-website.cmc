/* ===== 0 to Shipped — resume parser (mock, 100% client-side) ===== */

// Point PDF.js at its worker script (same CDN, same version as the script tag).
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

// The skills the parser tracks — this list IS the rubric, so editing it
// changes the score. Add or remove entries freely; keep the regex simple.
const SKILLS = [
  { name: "JavaScript",  re: /\bjavascript\b|\bjs\b/i },
  { name: "TypeScript",  re: /\btypescript\b/i },
  { name: "React",       re: /\breact\b/i },
  { name: "Vue",         re: /\bvue\b/i },
  { name: "Angular",     re: /\bangular/i },
  { name: "Node.js",     re: /\bnode\.?js\b/i },
  { name: "Python",      re: /\bpython\b/i },
  { name: "Java",        re: /\bjava\b(?!script)/i },
  { name: "C++",         re: /\bc\+\+/i },
  { name: "C#",          re: /\bc#/i },
  { name: "Go",          re: /\bgolang\b|\bgo\b(?=[\s,;/])/i },
  { name: "SQL",         re: /\bsql\b/i },
  { name: "PostgreSQL",  re: /postgres/i },
  { name: "MySQL",       re: /mysql/i },
  { name: "MongoDB",     re: /mongo/i },
  { name: "GraphQL",     re: /graphql/i },
  { name: "REST APIs",   re: /\brest\b|\brestful\b|\bapi\b/i },
  { name: "HTML/CSS",    re: /\bhtml\b|\bcss\b/i },
  { name: "Git",         re: /\bgit\b/i },
  { name: "Docker",      re: /docker/i },
  { name: "Kubernetes",  re: /kubernetes|\bk8s\b/i },
  { name: "AWS",         re: /\baws\b|amazon web services/i },
  { name: "Azure",       re: /azure/i },
  { name: "CI/CD",       re: /ci\/cd|continuous integration/i },
  { name: "Testing",     re: /\bjest\b|\bmocha\b|\bcypress\b|\bunit tests?\b/i },
  { name: "Agile/Scrum", re: /\bagile\b|\bscrum\b/i },
];

// Extra "resume hygiene" signals that make up the other 30% of the score.
const SIGNALS = [
  { label: "email or phone",  re: /[\w.+-]+@[\w-]+\.[\w.]+|(\+?\d[\d\s().-]{8,}\d)/ },
  { label: "GitHub/LinkedIn", re: /github\.com|linkedin\.com|\bgithub\b|\blinkedin\b/i },
  { label: "portfolio link",  re: /https?:\/\/|\w+\.(dev|io|me|com)\b/i },
  { label: "action verbs",    re: /\b(built|designed|led|shipped|launched|improved|created|developed|implemented|automated)\b/i },
];

const SAMPLE_TEXT = `
Aarav Sharma — aarav.sharma@example.com — +91 98765 43210 — github.com/aarav-dev

SUMMARY
Frontend-focused developer who built and shipped three web products end to end.

EXPERIENCE
BrightApps, Pune — Junior Developer (2023–present)
- Built dashboards in React with reusable component libraries, improving page speed by 35%.
- Designed REST APIs in Node.js backed by PostgreSQL and deployed them with Docker on AWS.
- Wrote unit tests in Jest and set up CI/CD with GitHub Actions.

Freelance (2022–2023)
- Developed marketing sites with HTML, CSS and JavaScript for five small businesses.
- Integrated payment REST APIs and improved checkout conversion by 12%.

SKILLS
JavaScript, React, Node.js, HTML, CSS, SQL, PostgreSQL, Git, Docker, AWS, Jest, Agile

EDUCATION
B.E. Computer Science, Pune University, 2023
`;

/* ---------- DOM handles ---------- */

const dropzone    = document.getElementById("dropzone");
const fileInput   = document.getElementById("fileInput");
const dzStatus    = document.getElementById("dzStatus");
const sampleBtn   = document.getElementById("sampleBtn");
const results     = document.getElementById("results");
const fileNameEl  = document.getElementById("fileName");
const scoreNum    = document.getElementById("scoreNum");
const scoreCaption= document.getElementById("scoreCaption");
const ringFg      = document.getElementById("ringFg");
const presentList = document.getElementById("skillsPresent");
const missingList = document.getElementById("skillsMissing");
const presentCount= document.getElementById("presentCount");
const missingCount= document.getElementById("missingCount");
const resetBtn    = document.getElementById("resetBtn");

const RING_LENGTH = 2 * Math.PI * 52; // matches r="52" in the SVG

/* ---------- upload wiring ---------- */

dropzone.addEventListener("click", () => fileInput.click());

dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

["dragenter", "dragover"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  })
);

["dragleave", "drop"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
  })
);

dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

sampleBtn.addEventListener("click", () => {
  setStatus("Analyzing sample resume…");
  render(analyze(SAMPLE_TEXT), "sample-resume.pdf");
});

resetBtn.addEventListener("click", () => {
  results.hidden = true;
  fileInput.value = "";
  setStatus("");
  dropzone.scrollIntoView({ behavior: "smooth" });
});

function setStatus(msg, isError = false) {
  dzStatus.textContent = msg;
  dzStatus.classList.toggle("error", isError);
}

/* ---------- the pipeline: file → text → score ---------- */

async function handleFile(file) {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    setStatus("That's not a PDF — please upload a .pdf file.", true);
    return;
  }

  if (typeof pdfjsLib === "undefined") {
    setStatus("Couldn't load the PDF library — check your internet connection.", true);
    return;
  }

  setStatus("Reading your resume…");

  try {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    // Walk every page and glue the text items together into one string.
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      for (const item of content.items) {
        text += item.str + (item.hasEOL ? "\n" : " ");
      }
    }

    if (!text.trim()) {
      setStatus("No readable text found — this PDF may be a scan or image.", true);
      return;
    }

    render(analyze(text), file.name);
  } catch (err) {
    console.error(err);
    setStatus("Something went wrong while reading that PDF. Try another file.", true);
  }
}

/* ---------- scoring ---------- */

function analyze(text) {
  const present = SKILLS.filter((s) => s.re.test(text));
  const missing = SKILLS.filter((s) => !s.re.test(text));

  // 70%: how much of the tracked skill list the resume covers.
  const coverage = present.length / SKILLS.length;

  // 30%: resume signals — split evenly across the checks.
  const passed = SIGNALS.filter((s) => s.re.test(text)).length;

  const score = Math.round(coverage * 70 + (passed / SIGNALS.length) * 30);
  return { present, missing, score, coverage, passed };
}

/* ---------- rendering ---------- */

function render(result, name) {
  setStatus("");
  fileNameEl.textContent = name;
  results.hidden = false;

  // Animate the ring and count the number up.
  ringFg.style.strokeDashoffset = RING_LENGTH * (1 - result.score / 100);
  animateNumber(scoreNum, result.score);

  scoreCaption.textContent =
    `Matches ${result.present.length} of ${SKILLS.length} tracked skills · ` +
    `${result.passed}/${SIGNALS.length} resume signals (${result.missing.length} gaps found)`;

  presentCount.textContent = `· ${result.present.length}`;
  missingCount.textContent = `· ${result.missing.length}`;

  presentList.replaceChildren(
    ...result.present.map((s) => chip(s.name, "chips"))
  );
  missingList.replaceChildren(
    ...result.missing.map((s) => chip(s.name, "chips"))
  );

  results.scrollIntoView({ behavior: "smooth" });
}

function chip(text) {
  const li = document.createElement("li");
  li.textContent = text;
  return li;
}

function animateNumber(el, target) {
  const start = performance.now();
  const duration = 800;
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * t);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
