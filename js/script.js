function parsePageHash() {
  const raw = window.location.hash.replace('#', '');
  if (!raw) return { pageId: '', topicIndex: undefined };
  const [pageId, query] = raw.split('?');
  let topicIndex;
  if (query) {
    const params = new URLSearchParams(query);
    const t = params.get('topic');
    if (t !== null) topicIndex = Number(t);
  }
  return { pageId, topicIndex };
}

function updateHash(pageId, topicIndex) {
  const base = `#${pageId}`;
  const withTopic = typeof topicIndex === 'number' ? `${base}?topic=${topicIndex}` : base;
  if (window.location.hash !== withTopic) {
    window.location.hash = withTopic;
  }
}

function showPage(pageId, topicIndex) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // Show selected page
  const target = document.getElementById(pageId);
  target.classList.add('active');

  // If target has data-src and is empty, lazy-load its content
  const src = target.getAttribute('data-src');
  const contentContainer = target.querySelector('.dynamic-content');
  if (src && contentContainer && contentContainer.childElementCount === 0) {
    contentContainer.innerHTML = '<div class="text-muted small py-3">Loading…</div>';
    fetch(src)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then(html => {
        contentContainer.innerHTML = html;
        // Bring the new content into view and highlight sidebar
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const sidebar = document.getElementById(`${pageId}-topics`);
        if (sidebar) {
          const firstItem = sidebar.querySelector('.list-group-item');
          if (firstItem) {
            firstItem.focus();
          }
        }
        // Initialize topic selection after content is present
        initializeSectionTopic(pageId, topicIndex);
      })
      .catch((error) => {
        console.error('Content load failed:', error);
        const isFileProtocol = window.location.protocol === 'file:';
        const hint = isFileProtocol
          ? 'Tip: You are opening this file directly. Please run a local web server (e.g., VS Code Live Server, `python -m http.server`, or `npx serve`) and open http://localhost instead of file://.'
          : 'Please check that the pages/ directory exists and the path is correct.';
        contentContainer.innerHTML = `<div class="alert alert-danger">Failed to load content. ${hint}</div>`;
      });
  } else {
    // Content already available, ensure correct topic is shown
    initializeSectionTopic(pageId, topicIndex);
  }

  // Update active nav link state
  document.querySelectorAll('.navbar .nav-link').forEach(link => {
    if (link.getAttribute('data-page') === pageId) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });

  // Reflect current page in the URL (helpful to confirm you're on a detail page)
  updateHash(pageId, topicIndex);
}

// Navigate from cards
function navigateToPath(sectionId) {
  showPage(sectionId);
}

function navigateToLanguage(sectionId) {
  showPage(sectionId);
}

function navigateToTech(sectionId) {
  showPage(sectionId);
}

// Language topic navigation helpers
function getLanguageTopicContainers(langSectionId) {
  const section = document.getElementById(langSectionId);
  return Array.from(section.querySelectorAll('.language-topic'));
}

function setActiveLanguageTopic(langSectionId, newIndex) {
  const topics = getLanguageTopicContainers(langSectionId);
  if (newIndex < 0 || newIndex >= topics.length) return;

  topics.forEach(t => t.classList.remove('active'));
  topics[newIndex].classList.add('active');

  // Update sidebar list-group active state if present
  const sidebar = document.getElementById(`${langSectionId}-topics`);
  if (sidebar) {
    const buttons = Array.from(sidebar.querySelectorAll('.list-group-item'));
    buttons.forEach(b => b.classList.remove('active'));
    if (buttons[newIndex]) buttons[newIndex].classList.add('active');
  }
}

function showLanguageTopic(langSectionId, index) {
  setActiveLanguageTopic(langSectionId, index);
  try { localStorage.setItem(`sectionTopic:${langSectionId}`, String(index)); } catch {}
  updateHash(langSectionId, index);
}

function nextLanguageTopic(langSectionId) {
  const topics = getLanguageTopicContainers(langSectionId);
  const activeIndex = topics.findIndex(t => t.classList.contains('active'));
  const nextIndex = Math.min(activeIndex + 1, topics.length - 1);
  setActiveLanguageTopic(langSectionId, nextIndex);
  try { localStorage.setItem(`sectionTopic:${langSectionId}`, String(nextIndex)); } catch {}
  updateHash(langSectionId, nextIndex);
}

function prevLanguageTopic(langSectionId) {
  const topics = getLanguageTopicContainers(langSectionId);
  const activeIndex = topics.findIndex(t => t.classList.contains('active'));
  const prevIndex = Math.max(activeIndex - 1, 0);
  setActiveLanguageTopic(langSectionId, prevIndex);
  try { localStorage.setItem(`sectionTopic:${langSectionId}`, String(prevIndex)); } catch {}
  updateHash(langSectionId, prevIndex);
}

// If URL hash maps to a section, open it on load
window.addEventListener('DOMContentLoaded', () => {
  const { pageId, topicIndex } = parsePageHash();
  if (pageId) {
    const target = document.getElementById(pageId);
    if (target) {
      showPage(pageId, topicIndex);
    }
  }
});

window.addEventListener('hashchange', () => {
  const { pageId, topicIndex } = parsePageHash();
  if (pageId) {
    const target = document.getElementById(pageId);
    if (target) {
      showPage(pageId, topicIndex);
    }
  }
});

// Expose for inline onclick usage in loaded partials
window.showLanguageTopic = showLanguageTopic;
window.nextLanguageTopic = nextLanguageTopic;
window.prevLanguageTopic = prevLanguageTopic;

function initializeSectionTopic(pageId, explicitIndex) {
  const topics = getLanguageTopicContainers(pageId);
  if (topics.length === 0) return;
  let index = typeof explicitIndex === 'number' ? explicitIndex : undefined;
  if (typeof index !== 'number' || isNaN(index)) {
    try {
      const stored = localStorage.getItem(`sectionTopic:${pageId}`);
      if (stored !== null) index = Number(stored);
    } catch {}
  }
  if (typeof index !== 'number' || isNaN(index)) index = 0;
  index = Math.max(0, Math.min(index, topics.length - 1));
  setActiveLanguageTopic(pageId, index);
}

// Mobile: toggle topics sidebar visibility
function toggleTopics(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const sidebar = section.querySelector('.topics-sidebar-collapsible');
  if (!sidebar) return;
  sidebar.classList.toggle('show');
}

// Theme toggle
function applyTheme(theme) {
  const root = document.documentElement; // <html>
  if (theme === 'dark') {
    root.classList.add('theme-dark');
  } else {
    root.classList.remove('theme-dark');
  }
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('theme-dark');
  const next = isDark ? 'light' : 'dark';
  try { localStorage.setItem('theme', next); } catch {}
  applyTheme(next);
}

// Initialize theme on load
(() => {
  let theme = 'light';
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') theme = stored;
  } catch {}
  applyTheme(theme);
})();

// Expose toggles for inline handlers
window.toggleTopics = toggleTopics;
window.toggleTheme = toggleTheme;
 
let editors = {};

    // Load Monaco once
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }});
    require(["vs/editor/editor.main"], function () {
      // First editor
      editors['editor1'] = monaco.editor.create(document.getElementById('editor1'), {
        value: `class Main {
  public static void main(String[] args) {
    System.out.println("Hello from Editor 1");
  }
}`,
        language: "java",
        theme: "vs-dark"
      });

      // Second editor
      editors['editor2'] = monaco.editor.create(document.getElementById('editor2'), {
        value: `class Main {
  public static void main(String[] args) {
    System.out.println("Hello from Editor 2");
  }
}`,
        language: "java",
        theme: "vs-dark"
      });
    });

    async function runCode(editorId, inputId, outputId) {
      const code = editors[editorId].getValue();
      const input = document.getElementById(inputId).value;
      document.getElementById(outputId).innerText = "Running...";

      try {
        const response = await fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            "X-RapidAPI-Key": "YOUR_RAPIDAPI_KEY" // 👈 put your key
          },
          body: JSON.stringify({
            source_code: code,
            language_id: 62, // Java
            stdin: input
          })
        });

        const result = await response.json();
        document.getElementById(outputId).innerText =
          result.stdout || result.stderr || result.compile_output || "Error running code.";
      } catch (err) {
        document.getElementById(outputId).innerText = "Failed: " + err.message;
      }
    }