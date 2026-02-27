// Claude RTL Fix - Hebrew Support v1.1
// Fixes: Hebrew text aligned left + mixed Hebrew/English chaos

const HEBREW_RE = /[\u05D0-\u05EA\uFB1D-\uFB4F]/;

function hebrewRatio(text) {
  const letters = text.replace(/[^a-zA-Z\u05D0-\u05EA\uFB1D-\uFB4F]/g, '');
  if (!letters.length) return 0;
  const heb = (letters.match(/[\u05D0-\u05EA\uFB1D-\uFB4F]/g) || []).length;
  return heb / letters.length;
}

function applyRTL(el) {
  el.style.setProperty('direction', 'rtl', 'important');
  el.style.setProperty('text-align', 'right', 'important');
  el.style.setProperty('unicode-bidi', 'plaintext', 'important');
}

function applyLTR(el) {
  el.style.setProperty('direction', 'ltr', 'important');
  el.style.setProperty('text-align', 'left', 'important');
  el.style.setProperty('unicode-bidi', 'normal', 'important');
}

function fixNode(el) {
  if (el.closest('pre, code, [class*="code"]')) return;
  const text = el.innerText || el.textContent || '';
  if (hebrewRatio(text) > 0.25) {
    applyRTL(el);
  }
}

function fixCodeBlocks() {
  document.querySelectorAll('pre, code, [class*="code-block"], [class*="codeBlock"]').forEach(applyLTR);
}

function fixAll() {
  document.querySelectorAll('p, li, h1, h2, h3, h4, h5, td, th').forEach(fixNode);

  document.querySelectorAll([
    '[data-testid="user-message"]',
    '[class*="prose"]',
    '.whitespace-pre-wrap',
    '[class*="font-claude-message"]',
    '[class*="human-turn"]',
    '[class*="assistant-turn"]',
  ].join(',')).forEach(fixNode);

  fixCodeBlocks();
}

function watchInputs() {
  document.querySelectorAll('div[contenteditable="true"], textarea, [role="textbox"]').forEach(input => {
    if (input._rtlWatched) return;
    input._rtlWatched = true;
    input.addEventListener('input', () => {
      const text = input.innerText || input.value || '';
      if (hebrewRatio(text) > 0.25) {
        applyRTL(input);
      } else {
        applyLTR(input);
      }
    });
  });
}

let debounce;
function schedule() {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    fixAll();
    watchInputs();
  }, 120);
}

new MutationObserver(schedule).observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
});

let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(schedule, 600);
  }
}).observe(document, { subtree: true, childList: true });

setTimeout(schedule, 600);
