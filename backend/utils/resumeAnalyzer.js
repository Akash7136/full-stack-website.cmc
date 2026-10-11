const SKILLS = [
  { name: 'JavaScript', re: /\bjavascript\b|\bjs\b/i },
  { name: 'TypeScript', re: /\btypescript\b/i },
  { name: 'React', re: /\breact\b/i },
  { name: 'Vue', re: /\bvue\b/i },
  { name: 'Angular', re: /\bangular\b/i },
  { name: 'Node.js', re: /\bnode\.?js\b/i },
  { name: 'Python', re: /\bpython\b/i },
  { name: 'Java', re: /\bjava\b(?!script)/i },
  { name: 'C++', re: /\bc\+\+/i },
  { name: 'C#', re: /\bc#\b/i },
  { name: 'Go', re: /\bgolang\b|\bgo\b(?=[\s,;/])/i },
  { name: 'SQL', re: /\bsql\b/i },
  { name: 'PostgreSQL', re: /postgres/i },
  { name: 'MySQL', re: /mysql/i },
  { name: 'MongoDB', re: /mongo/i },
  { name: 'GraphQL', re: /graphql/i },
  { name: 'REST APIs', re: /\brest\b|\brestful\b|\bapi\b/i },
  { name: 'HTML/CSS', re: /\bhtml\b|\bcss\b/i },
  { name: 'Git', re: /\bgit\b/i },
  { name: 'Docker', re: /docker/i },
  { name: 'Kubernetes', re: /kubernetes|\bk8s\b/i },
  { name: 'AWS', re: /\baws\b|amazon web services/i },
  { name: 'Azure', re: /azure/i },
  { name: 'CI/CD', re: /ci\/cd|continuous integration/i },
  { name: 'Testing', re: /\bjest\b|\bmocha\b|\bcypress\b|\bunit tests?\b/i },
  { name: 'Agile/Scrum', re: /\bagile\b|\bscrum\b/i },
];

function normalizeText(value = '') {
  return value.toLowerCase();
}

function analyzeResumeAndJD(resumeText, jdText) {
  const resumeTextNormalized = normalizeText(resumeText);
  const jobDescriptionNormalized = normalizeText(jdText || '');
  const matchedSkills = [];
  const missingSkills = [];

  for (const skill of SKILLS) {
    if (!skill.re.test(jobDescriptionNormalized)) continue;

    if (skill.re.test(resumeTextNormalized)) {
      matchedSkills.push(skill.name);
    } else {
      missingSkills.push(skill.name);
    }
  }

  const totalSkills = matchedSkills.length + missingSkills.length;
  const score = totalSkills
    ? Math.round((matchedSkills.length / totalSkills) * 100)
    : 0;

  const summary = totalSkills
    ? `${matchedSkills.length} of ${totalSkills} tracked JD skills matched.`
    : 'No supported skills were detected in the job description. Try adding technical skills from the tracked list.';

  return {
    score,
    matchedSkills,
    missingSkills,
    summary,
    totalSkills,
  };
}

module.exports = {
  analyzeResumeAndJD,
  SKILLS,
};
