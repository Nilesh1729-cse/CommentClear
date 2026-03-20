/* ============================================================
   CommentClear — app.js
   Comment removal engine + UI logic
   ============================================================ */

// ============================================================
// LANGUAGE DEFINITIONS
// ============================================================
const LANGUAGES = {
  javascript: {
    name: 'JavaScript / TypeScript',
    line: ['//', '///'],
    block: [{ start: '/*', end: '*/' }],
    blockDoc: [{ start: '/**', end: '*/' }],
    strings: ['"', "'", '`'],
  },
  python: {
    name: 'Python',
    line: ['#'],
    block: [
      { start: "'''", end: "'''" },
      { start: '"""', end: '"""' },
    ],
    strings: ['"', "'"],
  },
  c: {
    name: 'C / C++',
    line: ['//', '///'],
    block: [{ start: '/*', end: '*/' }],
    strings: ['"', "'"],
  },
  java: {
    name: 'Java',
    line: ['//'],
    block: [{ start: '/*', end: '*/' }],
    strings: ['"', "'"],
  },
  csharp: {
    name: 'C#',
    line: ['//', '///'],
    block: [{ start: '/*', end: '*/' }],
    strings: ['"', "'"],
  },
  css: {
    name: 'CSS / SCSS',
    line: [],
    block: [{ start: '/*', end: '*/' }],
    strings: ['"', "'"],
  },
  html: {
    name: 'HTML',
    line: [],
    block: [{ start: '<!--', end: '-->' }],
    strings: ['"', "'"],
  },
  ruby: {
    name: 'Ruby',
    line: ['#'],
    block: [{ start: '=begin', end: '=end' }],
    strings: ['"', "'"],
  },
  php: {
    name: 'PHP',
    line: ['//', '#'],
    block: [{ start: '/*', end: '*/' }],
    strings: ['"', "'"],
  },
  go: {
    name: 'Go',
    line: ['//'],
    block: [{ start: '/*', end: '*/' }],
    strings: ['"', "'", '`'],
  },
  swift: {
    name: 'Swift',
    line: ['//', '///'],
    block: [{ start: '/*', end: '*/' }],
    strings: ['"', "'"],
  },
  rust: {
    name: 'Rust',
    line: ['//', '///', '//!'],
    block: [{ start: '/*', end: '*/' }],
    strings: ['"', "'"],
  },
  bash: {
    name: 'Bash / Shell',
    line: ['#'],
    block: [],
    strings: ['"', "'"],
  },
};

// ============================================================
// AUTO DETECT LANGUAGE  (scoring-based, robust)
// ============================================================
function detectLanguage(code) {
  const c = code.trim();

  // Each rule: [langKey, points, regex]
  // Multiple rules per language — whichever language accumulates
  // the highest score wins. Strong unique signals score higher (10),
  // weaker shared signals score lower (2-4).
  const rules = [
    // ── HTML ────────────────────────────────────────────────────
    ['html', 15, /<!DOCTYPE\s+html/i],
    ['html', 12, /<html[\s>]/i],
    ['html', 8, /<\/?(div|span|p|a|h[1-6]|ul|li|table|head|body|script|style|meta|link)\b/i],
    ['html', 5, /<!--[\s\S]*?-->/],
    ['html', 3, /\bclass="[^"]*"/],

    // ── PHP ─────────────────────────────────────────────────────
    ['php', 20, /^\s*<\?php/m],
    ['php', 15, /<\?=/],
    ['php', 8, /\$[a-zA-Z_]\w*\s*=/],
    ['php', 5, /\becho\s+['"$]/],
    ['php', 5, /\barray\s*\(/],
    ['php', 4, /\bnamespace\s+\w+;/],

    // ── Python ──────────────────────────────────────────────────
    ['python', 12, /^\s*def\s+\w+\s*\(.*\)\s*:/m],
    ['python', 12, /^\s*class\s+\w+.*:/m],
    ['python', 10, /^\s*from\s+\w[\w.]*\s+import\s+/m],
    ['python', 8, /^\s*import\s+\w[\w.]*\s*$/m],
    ['python', 8, /^\s*if\s+__name__\s*==\s*['"]__main__['"]/m],
    ['python', 6, /:\s*\n\s+(if|for|while|return|pass|break)/m],
    ['python', 5, /\bprint\s*\(/],
    ['python', 5, /\bself\b/],
    ['python', 4, /^\s*@\w+/m],  // decorators
    ['python', 3, /#.*$/m],       // hash comments

    // ── Bash / Shell ─────────────────────────────────────────────
    ['bash', 15, /^#!\s*\/bin\/(ba)?sh\b/m],
    ['bash', 15, /^#!\s*\/usr\/bin\/env\s+(ba)?sh/m],
    ['bash', 10, /^\s*(echo|export|source|alias)\s+/m],
    ['bash', 8, /\$\{?\w+\}?/],
    ['bash', 7, /\bif\s+\[[\s\S]*?\]\s*;?\s*then/m],
    ['bash', 7, /\bfor\s+\w+\s+in\s+/m],
    ['bash', 5, /\|\s*(grep|awk|sed|cut|sort|xargs)\b/],
    ['bash', 4, /^\s*fi\s*$/m],
    ['bash', 4, /^\s*done\s*$/m],

    // ── Rust ─────────────────────────────────────────────────────
    ['rust', 15, /\bfn\s+main\s*\(\s*\)/],
    ['rust', 12, /\bfn\s+\w+\s*(<[^>]*>)?\s*\([^)]*\)\s*(->\s*[\w<>&]+)?\s*\{/],
    ['rust', 10, /\blet\s+mut\s+\w+/],
    ['rust', 8, /\bimpl\s+\w+/],
    ['rust', 8, /\buse\s+std::/],
    ['rust', 8, /\bpub\s+(fn|struct|enum|mod|trait)\b/],
    ['rust', 6, /::\s*new\s*\(/],
    ['rust', 5, /\bprintln!\s*\(/],
    ['rust', 5, /\bmatch\s+\w+\s*\{/],
    ['rust', 4, /->\s*Result</],

    // ── Go ───────────────────────────────────────────────────────
    ['go', 15, /^package\s+main\s*$/m],
    ['go', 12, /^package\s+\w+\s*$/m],
    ['go', 10, /\bfunc\s+\w+\s*\([^)]*\)\s*[\w(*\[]/],
    ['go', 8, /\bfmt\.(Println|Printf|Sprintf)\s*\(/],
    ['go', 8, /\b\w+\s*:=\s*/],
    ['go', 6, /\bimport\s+\(/],
    ['go', 5, /\bgoroutine\b|\bgo\s+func\b/],
    ['go', 4, /\bchan\b/],

    // ── Java ─────────────────────────────────────────────────────
    ['java', 15, /\bimport\s+java\.\w+/],
    ['java', 12, /\bpublic\s+(static\s+)?void\s+main\s*\(\s*String/],
    ['java', 10, /\bpublic\s+class\s+\w+/],
    ['java', 8, /@(Override|Autowired|Component|Service|Repository|Controller)\b/],
    ['java', 8, /\bSystem\.out\.print/],
    ['java', 6, /\bnew\s+[A-Z]\w+\s*\(/],
    ['java', 5, /\bprivate|protected|public\b.*\bfinal\b/],
    ['java', 4, /\bthrows\s+\w+Exception/],

    // ── C# ───────────────────────────────────────────────────────
    ['csharp', 15, /\busing\s+System(\.\w+)*;/],
    ['csharp', 12, /\bnamespace\s+\w+(\.\w+)*\s*\{/],
    ['csharp', 10, /\bConsole\.(Write|WriteLine)\s*\(/],
    ['csharp', 8, /\[Serializable\]|\[HttpGet\]|\[Route\(|^\s*\[.*\]\s*$/m],
    ['csharp', 8, /\bpublic\s+(class|interface|enum|struct|record)\s+\w+/],
    ['csharp', 6, /\bvar\s+\w+\s*=\s*new\b/],
    ['csharp', 5, /\basync\s+Task[<(]/],
    ['csharp', 4, /=>\s*\{|=>\s*\w+\s*[;,)]/],

    // ── Swift ────────────────────────────────────────────────────
    ['swift', 15, /\bimport\s+(UIKit|SwiftUI|Foundation|Combine|AppKit)\b/],
    ['swift', 12, /\bfunc\s+\w+\s*\([^)]*\)\s*(->\s*[\w?!\[<]+)?\s*\{/],
    ['swift', 10, /\bvar\s+\w+\s*:\s*[A-Z]\w*/],
    ['swift', 10, /\blet\s+\w+\s*:\s*[A-Z]\w*/],
    ['swift', 8, /\bstruct\s+\w+\s*:\s*\w+/],
    ['swift', 8, /\b(guard|defer)\s+/],
    ['swift', 6, /\boptional\b|\?\./],
    ['swift', 5, /\bprint\s*\("[^"]*"\)/],

    // ── C / C++ ──────────────────────────────────────────────────
    ['c', 15, /#include\s*<\w+\.h>/],
    ['c', 12, /#include\s*["<](iostream|vector|string|algorithm|memory)[">]/],
    ['c', 10, /\bint\s+main\s*\(\s*(void|int\s+argc)?\s*\)/],
    ['c', 8, /\bstd::\w+/],
    ['c', 8, /\bcout\s*<<|cin\s*>>/],
    ['c', 6, /\b(malloc|calloc|free|printf|scanf)\s*\(/],
    ['c', 5, /\b(int|float|double|char|void)\s+\w+\s*[=;(,]/],
    ['c', 4, /->\w+/],            // pointer member access
    ['c', 4, /\*\w+\s*=/],        // pointer dereference

    // ── CSS / SCSS ───────────────────────────────────────────────
    ['css', 15, /@(media|keyframes|import|charset|mixin|include|extend)\b/],
    ['css', 12, /[.#][\w-]+\s*\{[^}]*\}/s],
    ['css', 10, /\b(margin|padding|display|color|font-size|background|border|flex|grid)\s*:/],
    ['css', 8, /:\s*(hover|focus|active|nth-child|before|after)\b/],
    ['css', 6, /px|em|rem|vh|vw|%\s*;/],
    ['css', 4, /\/\*[\s\S]*?\*\//],

    // ── Ruby ─────────────────────────────────────────────────────
    ['ruby', 12, /^\s*def\s+\w+(\s*\([^)]*\))?\s*$/m],
    ['ruby', 10, /^\s*class\s+\w+(\s*<\s*\w+)?\s*$/m],
    ['ruby', 10, /^\s*end\s*$/m],
    ['ruby', 8, /\brequire\s+['"]\w/],
    ['ruby', 7, /\battr_(accessor|reader|writer)\b/],
    ['ruby', 6, /\bdo\s*\|.*\|/],
    ['ruby', 5, /\.each\s+do\b|\.map\s*\{/],
    ['ruby', 4, /\bputs\s+/],

    // ── JavaScript / TypeScript ──────────────────────────────────
    ['javascript', 10, /\b(const|let)\s+\w+\s*=\s*(async\s+)?\(/],
    ['javascript', 8, /\bconst\s+\w+\s*=\s*require\s*\(/],
    ['javascript', 8, /\bimport\s+.*\s+from\s+['"]/],
    ['javascript', 8, /\bexport\s+(default|const|function|class)\b/],
    ['javascript', 8, /\b(async\s+function|\basync\s*\()/],
    ['javascript', 7, /\bconsole\.(log|warn|error)\s*\(/],
    ['javascript', 6, /\b(document|window|navigator)\.\w+/],
    ['javascript', 6, /=>\s*\{|=>\s*\w/],
    ['javascript', 5, /\bPromise\.(resolve|reject|all)\b/],
    ['javascript', 4, /\bJSON\.(parse|stringify)\s*\(/],
    ['javascript', 3, /\bvar\s+\w+\s*=/],
    // TypeScript specifics
    ['javascript', 8, /:\s*(string|number|boolean|any|void|never)\b/],
    ['javascript', 8, /\binterface\s+\w+\s*\{/],
    ['javascript', 6, /<[A-Z]\w*>/],
  ];

  // Accumulate scores
  const scores = {};
  for (const [lang, pts, re] of rules) {
    if (re.test(c)) {
      scores[lang] = (scores[lang] || 0) + pts;
    }
  }

  // Pick highest scorer
  let best = 'javascript';
  let bestScore = 0;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; best = lang; }
  }

  return best;
}

// ============================================================
// COMMENT REMOVAL ENGINE
// ============================================================
function removeComments(code, langKey) {
  const lang = LANGUAGES[langKey];
  if (!lang) return { result: code, removed: 0, linesDelta: 0, charsDelta: 0 };

  const original = code;
  let result = '';
  let i = 0;
  const len = code.length;
  let removedCount = 0;
  let removedChars = 0;

  // Track if we are inside a string literal
  function isStringStart() {
    for (const q of (lang.strings || [])) {
      if (code.startsWith(q, i)) return q;
    }
    return null;
  }

  // Skip over string content
  function skipString(quote) {
    result += quote;
    i += quote.length;
    while (i < len) {
      if (code[i] === '\\') { result += code[i] + code[i + 1]; i += 2; continue; }
      if (code.startsWith(quote, i)) { result += quote; i += quote.length; return; }
      result += code[i++];
    }
  }

  while (i < len) {
    // Check string literals first (skip comment detection inside strings)
    const q = isStringStart();
    if (q) { skipString(q); continue; }

    // Check block comments
    let inBlock = false;
    for (const b of (lang.block || [])) {
      if (code.startsWith(b.start, i)) {
        const end = code.indexOf(b.end, i + b.start.length);
        const commentText = end === -1
          ? code.slice(i)
          : code.slice(i, end + b.end.length);
        removedChars += commentText.length;
        removedCount++;
        i = end === -1 ? len : end + b.end.length;
        inBlock = true;
        break;
      }
    }
    if (inBlock) continue;

    // Check line comments
    let inLine = false;
    for (const lc of (lang.line || [])) {
      if (code.startsWith(lc, i)) {
        const nlIdx = code.indexOf('\n', i);
        const commentText = nlIdx === -1 ? code.slice(i) : code.slice(i, nlIdx);
        removedChars += commentText.length;
        // Trim trailing whitespace from the current line in result
        result = result.trimEnd();
        removedCount++;
        i = nlIdx === -1 ? len : nlIdx;
        inLine = true;
        break;
      }
    }
    if (inLine) continue;

    result += code[i++];
  }

  return {
    result,
    removed: removedCount,
    linesDelta: (original.match(/\n/g) || []).length - (result.match(/\n/g) || []).length,
    charsDelta: removedChars,
  };
}

// ============================================================
// POST PROCESS
// ============================================================
function postProcess(text, keepBlank, trimWS) {
  let lines = text.split('\n');
  if (!keepBlank) {
    // collapse multiple blank lines into one
    const out = [];
    let prevBlank = false;
    for (const l of lines) {
      const blank = l.trim() === '';
      if (blank && prevBlank) continue;
      out.push(l);
      prevBlank = blank;
    }
    lines = out;
  }
  if (trimWS) {
    lines = lines.map(l => l.trimEnd());
  }
  // Remove leading/trailing blank lines
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  return lines.join('\n');
}

// ============================================================
// LINE / CHAR COUNTER
// ============================================================
function countInfo(text) {
  const lines = text.split('\n').length;
  const chars = text.length;
  return `Ln ${lines}  Ch ${chars}`;
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ============================================================
// UI BINDINGS
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const inputEl = document.getElementById('inputCode');
  const outputEl = document.getElementById('outputCode');
  const langSel = document.getElementById('languageSelect');
  const cleanBtn = document.getElementById('cleanBtn');
  const pasteBtn = document.getElementById('pasteBtn');
  const clearBtn = document.getElementById('clearInputBtn');
  const copyBtn = document.getElementById('copyBtn');
  const dlBtn = document.getElementById('downloadBtn');
  const keepBlank = document.getElementById('keepBlankLines');
  const trimWS = document.getElementById('trimWhitespace');
  const inputLines = document.getElementById('inputLines');
  const outLines = document.getElementById('outputLines');
  const detectedEl = document.getElementById('detectedLang');
  const statsBar = document.getElementById('statsBar');

  // Update line counts
  function updateInputCount() {
    inputLines.textContent = countInfo(inputEl.value);
  }
  function updateOutputCount() {
    outLines.textContent = countInfo(outputEl.value);
  }
  inputEl.addEventListener('input', updateInputCount);

  // DOES IT LOOK LIKE CODE?
  function looksLikeCode(text) {
    const t = text.trim();
    const codeSignals = [
      /[{};]/,
      /\/\/|\/\*|#\s|<!--/,
      /\b(function|def|class|import|export|return|const|let|var|fn|func|if|for|while)\b/,
      /[=!<>]=?[^=]/,
      /#include|#define|package\s+\w/,
      /\w+\s*\(.*\)\s*[{:]/,
      /->\s*\w|::\w/,
      /^\s*@\w+/m,
      /\$\{?\w|\bself\b|\bthis\b/,
    ];
    const hits = codeSignals.filter(re => re.test(t)).length;
    const codeChars = (t.match(/[{}();=<>!\/\\#@$%^&*\[\]|~]/g) || []).length;
    const ratio = codeChars / Math.max(t.length, 1);
    return hits >= 1 || ratio > 0.03;
  }

  // WARNING BANNER — injected before toolbar
  const warningBanner = document.createElement('div');
  warningBanner.id = 'notCodeWarning';
  warningBanner.innerHTML = `
    <span class="warn-icon">⚠️</span>
    <span class="warn-msg">This doesn't look like code. This tool removes <strong>code comments</strong> — paste source code (JavaScript, Python, Java, etc.) for best results.</span>
    <button class="warn-close" title="Dismiss">✕</button>
  `;
  warningBanner.style.display = 'none';
  const toolContainer = document.getElementById('tool').querySelector('.container');
  toolContainer.insertBefore(warningBanner, toolContainer.querySelector('.toolbar'));
  warningBanner.querySelector('.warn-close').addEventListener('click', () => {
    warningBanner.style.display = 'none';
  });

  // CLEAN
  function doClean() {
    const raw = inputEl.value;
    if (!raw.trim()) { showToast('Paste some code first!'); return; }

    if (!looksLikeCode(raw)) {
      warningBanner.style.display = 'flex';
    } else {
      warningBanner.style.display = 'none';
    }

    let langKey = langSel.value;
    let detected = false;
    if (langKey === 'auto') {
      langKey = detectLanguage(raw);
      detected = true;
    }

    const { result, removed, linesDelta, charsDelta } = removeComments(raw, langKey);
    const clean = postProcess(result, keepBlank.checked, trimWS.checked);
    outputEl.value = clean;
    updateOutputCount();

    if (detected) {
      detectedEl.textContent = '⚡ ' + LANGUAGES[langKey].name;
      detectedEl.style.display = 'inline-block';
    } else {
      detectedEl.style.display = 'none';
    }

    document.getElementById('statRemoved').textContent = removed;
    document.getElementById('statLines').textContent = Math.max(0, linesDelta);
    document.getElementById('statChars').textContent = charsDelta;
    statsBar.style.display = removed > 0 ? 'flex' : 'none';

    showToast(removed > 0 ? `✓ Removed ${removed} comment${removed !== 1 ? 's' : ''}` : '✓ No comments found');
  }

  cleanBtn.addEventListener('click', doClean);

  // PASTE
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      inputEl.value = text;
      updateInputCount();
      showToast('Pasted from clipboard');
    } catch {
      showToast('Clipboard access denied');
    }
  });

  // CLEAR INPUT
  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
    updateInputCount();
    updateOutputCount();
    detectedEl.style.display = 'none';
    statsBar.style.display = 'none';
  });

  // COPY OUTPUT
  copyBtn.addEventListener('click', async () => {
    if (!outputEl.value) { showToast('Nothing to copy'); return; }
    try {
      await navigator.clipboard.writeText(outputEl.value);
      showToast('Copied to clipboard ✓');
    } catch {
      outputEl.select();
      document.execCommand('copy');
      showToast('Copied ✓');
    }
  });

  // DOWNLOAD
  dlBtn.addEventListener('click', () => {
    if (!outputEl.value) { showToast('Nothing to download'); return; }
    const blob = new Blob([outputEl.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clean-code.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded ✓');
  });

  // Lang select — hide detected label
  langSel.addEventListener('change', () => {
    if (langSel.value !== 'auto') detectedEl.style.display = 'none';
  });

  // Tab key in textarea
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = inputEl.selectionStart, end = inputEl.selectionEnd;
      inputEl.value = inputEl.value.slice(0, s) + '  ' + inputEl.value.slice(end);
      inputEl.selectionStart = inputEl.selectionEnd = s + 2;
    }
  });

  updateInputCount();
  updateOutputCount();
});

// ============================================================
// QUIZ
// ============================================================
const QUIZ = [
  {
    q: 'What is the primary purpose of code comments?',
    options: [
      'To explain the *why* behind code decisions',
      'To make files larger',
      'To prevent the code from running',
      'To replace variable names',
    ],
    correct: 0,
    feedback: 'Comments should explain reasoning and intent — not repeat what the code already says clearly.',
  },
  {
    q: 'Which type of comment is considered "redundant"?',
    options: [
      '// Reconnect after mobile network drops',
      '// increment counter by 1\ncounter++;',
      '// Debounce to avoid duplicate API calls',
      '// Legacy Safari workaround (see issue #42)',
    ],
    correct: 1,
    feedback: 'A comment that just repeats what the code does adds noise without adding value.',
  },
  {
    q: 'What is the biggest risk of leaving outdated comments in your codebase?',
    options: [
      'The code runs slower',
      'Other developers get confused or misled',
      'The file size doubles',
      'The linter throws errors',
    ],
    correct: 1,
    feedback: 'Outdated comments can actively mislead developers — worse than no comment at all.',
  },
  {
    q: 'Where should commented-out dead code ideally live?',
    options: [
      'At the top of every file',
      'In a separate comments.txt file',
      'In version control history, not in source files',
      'In a TODO block comment',
    ],
    correct: 2,
    feedback: 'Version control (like Git) is the right place for historical code — not lingering in comments.',
  },
  {
    q: 'When is removing comments from code most beneficial?',
    options: [
      'When preparing code for a logic review or refactoring',
      'Before pushing to version control',
      'Every time you save the file',
      'Only for languages like Python',
    ],
    correct: 0,
    feedback: 'Stripping comments gives you a clean, distraction-free view of the logic — ideal for reviewing or refactoring.',
  },
];

(function initQuiz() {
  let current = 0;
  let score = 0;

  const card = document.getElementById('quizCard');
  const result = document.getElementById('quizResult');
  const numEl = document.getElementById('quizNum');
  const qEl = document.getElementById('quizQuestion');
  const optsEl = document.getElementById('quizOptions');
  const fbEl = document.getElementById('quizFeedback');
  const nextBtn = document.getElementById('quizNext');
  const progress = document.getElementById('quizProgressBar');
  const scoreEl = document.getElementById('resultScore');
  const msgEl = document.getElementById('resultMsg');
  const retakeBtn = document.getElementById('retakeBtn');

  function renderQuestion() {
    const q = QUIZ[current];
    numEl.textContent = `Question ${current + 1} / ${QUIZ.length}`;
    qEl.textContent = q.q;
    progress.style.width = `${((current + 1) / QUIZ.length) * 100}%`;
    fbEl.textContent = '';
    nextBtn.style.display = 'none';

    optsEl.innerHTML = '';
    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.addEventListener('click', () => selectAnswer(idx));
      optsEl.appendChild(btn);
    });
  }

  function selectAnswer(idx) {
    const q = QUIZ[current];
    const buttons = optsEl.querySelectorAll('.quiz-option');
    buttons.forEach(b => b.disabled = true);
    buttons[q.correct].classList.add('correct');
    if (idx !== q.correct) {
      buttons[idx].classList.add('wrong');
    } else {
      score++;
    }
    fbEl.textContent = q.feedback;
    nextBtn.style.display = 'inline-block';
    nextBtn.textContent = current < QUIZ.length - 1 ? 'Next →' : 'See Results →';
  }

  nextBtn.addEventListener('click', () => {
    current++;
    if (current < QUIZ.length) {
      renderQuestion();
    } else {
      showResult();
    }
  });

  function showResult() {
    card.style.display = 'none';
    result.style.display = 'block';
    scoreEl.textContent = `${score}/${QUIZ.length}`;
    const pct = score / QUIZ.length;
    msgEl.textContent = pct === 1
      ? '🎉 Perfect score! You\'re a clean code champion.'
      : pct >= 0.6
        ? '👍 Nice work! A bit more practice and you\'ll be a pro.'
        : '📚 Keep learning — clean code habits take time to build!';
  }

  retakeBtn.addEventListener('click', () => {
    current = 0;
    score = 0;
    result.style.display = 'none';
    card.style.display = 'block';
    renderQuestion();
  });

  renderQuestion();
})();