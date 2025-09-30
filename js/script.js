// ============================================
// USER AUTHENTICATION
// ============================================
let currentUser = null;

// Check for stored user on page load
document.addEventListener('DOMContentLoaded', function() {
  const storedUser = sessionStorage.getItem('currentUser');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    updateUIForLoggedInUser();
  }
  
  // Setup form handlers
  setupAuthForms();
  
  // Initialize search
  initializeSearch();
  
  // Load theme
  loadTheme();
  
  // Initialize animations
  setTimeout(initializeAnimations, 500);
  
  // Initialize Monaco editors after a delay
  setTimeout(initializeMonacoEditors, 1000);
  
  // Handle initial page load
  const { pageId, topicIndex } = parsePageHash();
  if (pageId) {
    showPage(pageId, topicIndex);
  }
});

function setupAuthForms() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      
      // Simple validation (in production, verify against backend)
      if (email && password) {
        currentUser = {
          name: email.split('@')[0],
          email: email
        };
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUIForLoggedInUser();
        showPage('home');
        showToast('Welcome back!', 'success');
      }
    });
  }
  
  // Signup form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('signupName').value;
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
      }
      
      currentUser = { name, email };
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
      updateUIForLoggedInUser();
      showPage('home');
      showToast('Account created successfully!', 'success');
    });
  }
}

function updateUIForLoggedInUser() {
  const userProfile = document.getElementById('userprofile');
  const authButtons = document.getElementById('authButtons');
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');
  
  if (currentUser) {
    if (userProfile) userProfile.style.display = 'flex';
    if (authButtons) authButtons.style.display = 'none';
    if (userName) userName.textContent = currentUser.name;
    if (userAvatar) {
      const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
      userAvatar.textContent = initials;
    }
  }
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('currentUser');
  const userProfile = document.getElementById('userprofile');
  const authButtons = document.getElementById('authButtons');
  
  if (userProfile) userProfile.style.display = 'none';
  if (authButtons) authButtons.style.display = 'block';
  
  showPage('home');
  showToast('Logged out successfully', 'info');
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    z-index: 10000;
  `;
  document.body.appendChild(container);
  return container;
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
function initializeSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  const searchableContent = [
    { title: 'HTML Basics', page: 'lang-html', type: 'language' },
    { title: 'CSS Styling', page: 'lang-css', type: 'language' },
    { title: 'JavaScript Programming', page: 'lang-js', type: 'language' },
    { title: 'Python', page: 'lang-python', type: 'language' },
    { title: 'Java', page: 'lang-java', type: 'language' },
    { title: 'Full Stack Development', page: 'path-fullstack', type: 'path' },
    { title: 'Frontend Development', page: 'path-frontend', type: 'path' },
    { title: 'Backend Development', page: 'path-backend', type: 'path' },
  ];
  
  searchInput.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase().trim();
    if (query.length < 2) return;
    
    const results = searchableContent.filter(item =>
      item.title.toLowerCase().includes(query)
    );
    
    displaySearchResults(results);
  });
}

function displaySearchResults(results) {
  // Implementation for search results display
  console.log('Search results:', results);
}

// ============================================
// PAGE NAVIGATION
// ============================================
function parsePageHash() {
  const raw = window.location.hash.replace("#", "");
  if (!raw) return { pageId: "", topicIndex: undefined };
  const [pageId, query] = raw.split("?");
  let topicIndex;
  if (query) {
    const params = new URLSearchParams(query);
    const t = params.get("topic");
    if (t !== null) topicIndex = Number(t);
  }
  return { pageId, topicIndex };
}

function updateHash(pageId, topicIndex) {
  const base = `#${pageId}`;
  const withTopic = typeof topicIndex === "number" ? `${base}?topic=${topicIndex}` : base;
  if (window.location.hash !== withTopic) {
    window.location.hash = withTopic;
  }
}

function showPage(pageId, topicIndex) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  
  const target = document.getElementById(pageId);
  if (target) {
    target.classList.add("active");
  }
  
  // Update active nav link
  document.querySelectorAll(".navbar .nav-link").forEach(link => {
    link.classList.remove("active");
    link.removeAttribute("aria-current");
    
    const href = link.getAttribute("href");
    if (href === `#${pageId}`) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });
  
  // Load dynamic content if needed
  const src = target?.getAttribute("data-src");
  const contentContainer = target?.querySelector(".dynamic-content");
  if (src && contentContainer && contentContainer.childElementCount === 0) {
    contentContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2">Loading content...</p></div>';
    
    fetch(src)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then(html => {
        contentContainer.innerHTML = html;
        setTimeout(() => {
          initializeMonacoEditors();
          initializeAnimations();
          initializeSectionTopic(pageId, topicIndex);
        }, 200);
      })
      .catch(error => {
        console.error("Content load failed:", error);
        contentContainer.innerHTML = `<div class="alert alert-danger">Failed to load content. Please check your connection and try again.</div>`;
      });
  } else {
    initializeSectionTopic(pageId, topicIndex);
    setTimeout(() => {
      initializeMonacoEditors();
      initializeAnimations();
    }, 100);
  }
  
  updateHash(pageId, topicIndex);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateToPath(sectionId) { showPage(sectionId); }
function navigateToLanguage(sectionId) { showPage(sectionId); }
function navigateToTech(sectionId) { showPage(sectionId); }

// ============================================
// TOPIC NAVIGATION
// ============================================
function getLanguageTopicContainers(langSectionId) {
  const section = document.getElementById(langSectionId);
  return section ? Array.from(section.querySelectorAll(".language-topic")) : [];
}

function setActiveLanguageTopic(langSectionId, newIndex) {
  const topics = getLanguageTopicContainers(langSectionId);
  if (newIndex < 0 || newIndex >= topics.length) return;
  
  topics.forEach(t => t.classList.remove("active"));
  topics[newIndex].classList.add("active");
  
  const sidebar = document.getElementById(`${langSectionId}-topics`);
  if (sidebar) {
    const buttons = Array.from(sidebar.querySelectorAll(".list-group-item"));
    buttons.forEach(b => b.classList.remove("active"));
    if (buttons[newIndex]) buttons[newIndex].classList.add("active");
  }
}

function showLanguageTopic(langSectionId, index) {
  setActiveLanguageTopic(langSectionId, index);
  try {
    sessionStorage.setItem(`sectionTopic:${langSectionId}`, String(index));
  } catch {}
  updateHash(langSectionId, index);
}

function nextLanguageTopic(langSectionId) {
  const topics = getLanguageTopicContainers(langSectionId);
  const activeIndex = topics.findIndex(t => t.classList.contains("active"));
  const nextIndex = Math.min(activeIndex + 1, topics.length - 1);
  showLanguageTopic(langSectionId, nextIndex);
}

function prevLanguageTopic(langSectionId) {
  const topics = getLanguageTopicContainers(langSectionId);
  const activeIndex = topics.findIndex(t => t.classList.contains("active"));
  const prevIndex = Math.max(activeIndex - 1, 0);
  showLanguageTopic(langSectionId, prevIndex);
}

function initializeSectionTopic(pageId, explicitIndex) {
  const topics = getLanguageTopicContainers(pageId);
  if (topics.length === 0) return;
  
  let index = typeof explicitIndex === "number" ? explicitIndex : undefined;
  if (typeof index !== "number" || isNaN(index)) {
    try {
      const stored = sessionStorage.getItem(`sectionTopic:${pageId}`);
      if (stored !== null) index = Number(stored);
    } catch {}
  }
  if (typeof index !== "number" || isNaN(index)) index = 0;
  index = Math.max(0, Math.min(index, topics.length - 1));
  setActiveLanguageTopic(pageId, index);
}

function toggleTopics(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const sidebar = section.querySelector(".topics-sidebar-collapsible");
  if (sidebar) sidebar.classList.toggle("show");
}

// ============================================
// THEME MANAGEMENT
// ============================================
function loadTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.setAttribute("data-theme", savedTheme);
  const icon = document.getElementById("theme-icon");
  if (icon) {
    icon.className = savedTheme === "light" ? "bi bi-moon-fill" : "bi bi-sun-fill";
  }
  updateMonacoTheme(savedTheme);
}

function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  
  const icon = document.getElementById("theme-icon");
  if (icon) {
    icon.className = newTheme === "light" ? "bi bi-moon-fill" : "bi bi-sun-fill";
  }
  
  updateMonacoTheme(newTheme);
}

function updateMonacoTheme(theme) {
  if (typeof monaco !== 'undefined') {
    const monacoTheme = theme === "dark" ? "vs-dark" : "vs";
    try {
      monaco.editor.setTheme(monacoTheme);
    } catch (e) {
      console.log("Monaco theme update failed:", e);
    }
  }
}

// ============================================
// ANIMATIONS
// ============================================
function animateCounter(element, target) {
  if (!element) return;
  let current = 0;
  const increment = target / 100;
  const suffix = element.textContent.includes("+") ? "+" : element.textContent.includes("%") ? "%" : "";
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current) + suffix;
  }, 20);
}

function initializeAnimations() {
  const observerOptions = { threshold: 0.5 };
  
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const statNumbers = entry.target.querySelectorAll(".stat-number");
        statNumbers.forEach(num => {
          const text = num.textContent;
          const value = parseInt(text.replace(/\D/g, ""));
          if (value && !num.dataset.animated) {
            num.dataset.animated = "true";
            animateCounter(num, value);
          }
        });
        counterObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  const statsSection = document.querySelector(".stats-section");
  if (statsSection) {
    counterObserver.observe(statsSection);
  }
}

// ============================================
// MONACO EDITOR IMPLEMENTATION
// ============================================
let editors = {};
let monacoLoaded = false;

const SUPPORTED_LANGUAGES = {
  javascript: {
    name: "JavaScript",
    monaco: "javascript",
    judge0: 63,
    defaultCode: `// JavaScript Example
console.log("Hello from JavaScript!");

// Variables and Data Types
let name = "JavaScript Developer";
const age = 25;
let skills = ["HTML", "CSS", "JavaScript"];

console.log("Name:", name);
console.log("Age:", age);
console.log("Skills:", skills.join(", "));

// Functions
function greet(person) {
  return \`Hello, \${person}!\`;
}

console.log(greet(name));`
  },
  python: {
    name: "Python",
    monaco: "python",
    judge0: 71,
    defaultCode: `# Python Example
print("Hello from Python!")

# Variables
name = "Python Developer"
age = 25
skills = ["Django", "Flask", "FastAPI"]

print(f"Name: {name}")
print(f"Age: {age}")
print(f"Skills: {', '.join(skills)}")`
  }
};

function initializeMonacoEditors() {
  console.log("Initializing Monaco editors...");
  
  if (monacoLoaded) {
    setupEditors();
    return;
  }
  
  if (typeof monaco !== 'undefined') {
    console.log("Monaco already loaded");
    setupEditors();
    monacoLoaded = true;
    return;
  }
  
  if (typeof require === 'undefined') {
    loadRequireJS();
  } else {
    loadMonaco();
  }
}

function loadRequireJS() {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js';
  script.onload = loadMonaco;
  script.onerror = () => {
    console.error('Failed to load RequireJS');
    showEditorError();
  };
  document.head.appendChild(script);
}

function loadMonaco() {
  if (typeof require === 'undefined') {
    console.error('RequireJS not available');
    showEditorError();
    return;
  }
  
  require.config({
    paths: {
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs"
    }
  });
  
  require(["vs/editor/editor.main"], function() {
    console.log("Monaco loaded successfully");
    setupEditors();
    monacoLoaded = true;
  }, function(err) {
    console.error('Failed to load Monaco Editor:', err);
    showEditorError();
  });
}

function showEditorError() {
  document.querySelectorAll('[id^="editor"]').forEach(editorContainer => {
    if (editorContainer && editorContainer.innerHTML.trim() === '') {
      editorContainer.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          background: #f8f9fa;
          color: #6c757d;
          text-align: center;
          padding: 2rem;
          border: 1px solid #dee2e6;
          border-radius: 0.5rem;
        ">
          <div>
            <i class="bi bi-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <p>Code editor failed to load.<br>Please refresh the page to try again.</p>
          </div>
        </div>`;
    }
  });
}

function setupEditors() {
  console.log("Setting up editors...");
  
  document.querySelectorAll('[id^="editor"]').forEach(editorContainer => {
    if (editorContainer && !editors[editorContainer.id] && editorContainer.innerHTML.trim() === '') {
      try {
        const defaultLanguage = getDefaultLanguageForPage();
        const defaultCode = SUPPORTED_LANGUAGES[defaultLanguage].defaultCode;
        const savedTheme = localStorage.getItem("theme") || "light";
        const monacoTheme = savedTheme === "dark" ? "vs-dark" : "vs";
        
        console.log(`Creating editor ${editorContainer.id} with language ${defaultLanguage}`);
        
        editors[editorContainer.id] = monaco.editor.create(editorContainer, {
          value: defaultCode,
          language: SUPPORTED_LANGUAGES[defaultLanguage].monaco,
          theme: monacoTheme,
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: false,
          scrollbar: {
            vertical: "visible",
            horizontal: "visible"
          }
        });
        
        editorContainer.dataset.language = defaultLanguage;
        
        const dropdown = document.getElementById(`${editorContainer.id}-language`);
        if (dropdown) {
          dropdown.value = defaultLanguage;
        }
        
        setTimeout(() => {
          if (editors[editorContainer.id]) {
            editors[editorContainer.id].layout();
          }
        }, 100);
        
        console.log(`Editor ${editorContainer.id} created successfully`);
      } catch (error) {
        console.error(`Error creating editor ${editorContainer.id}:`, error);
        showEditorError();
      }
    }
  });
}

function getDefaultLanguageForPage() {
  const currentPage = document.querySelector('.page.active');
  if (currentPage) {
    if (currentPage.id === 'lang-js') return 'javascript';
    if (currentPage.id === 'lang-python') return 'python';
  }
  return 'javascript';
}

function changeEditorLanguage(editorId, language) {
  if (!editors[editorId] || !SUPPORTED_LANGUAGES[language]) return;
  
  const editor = editors[editorId];
  const langConfig = SUPPORTED_LANGUAGES[language];
  
  monaco.editor.setModelLanguage(editor.getModel(), langConfig.monaco);
  editor.setValue(langConfig.defaultCode);
  
  const editorContainer = document.getElementById(editorId);
  if (editorContainer) {
    editorContainer.dataset.language = language;
  }
  
  const dropdown = document.getElementById(`${editorId}-language`);
  if (dropdown) {
    dropdown.value = language;
  }
}

async function runCode(editorId, inputId, outputId) {
  console.log(`Running code for editor: ${editorId}`);
  
  if (!editors[editorId]) {
    const outputElement = document.getElementById(outputId);
    if (outputElement) {
      outputElement.innerText = "Editor not initialized. Attempting to initialize...";
      outputElement.className = "output warning";
    }
    
    // Try to initialize editors
    initializeMonacoEditors();
    
    // Wait a bit and try again
    setTimeout(() => {
      if (editors[editorId]) {
        runCode(editorId, inputId, outputId);
      } else {
        if (outputElement) {
          outputElement.innerText = "Editor initialization failed. Please refresh the page.";
          outputElement.className = "output error";
        }
      }
    }, 2000);
    return;
  }
  
  const editorContainer = document.getElementById(editorId);
  const language = editorContainer?.dataset?.language || 'javascript';
  
  if (language === 'javascript') {
    return runJavaScript(editorId, inputId, outputId);
  } else {
    return runCompiledCode(editorId, inputId, outputId, language);
  }
}

async function runJavaScript(editorId, inputId, outputId) {
  const code = editors[editorId].getValue();
  const input = document.getElementById(inputId)?.value || "";
  const outputElement = document.getElementById(outputId);
  
  outputElement.innerText = "Running JavaScript...";
  outputElement.className = "output running";
  
  try {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    let output = "";
    
    console.log = (...args) => {
      output += args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ') + '\n';
      originalLog(...args);
    };
    
    console.error = (...args) => {
      output += 'ERROR: ' + args.map(arg => String(arg)).join(' ') + '\n';
      originalError(...args);
    };
    
    console.warn = (...args) => {
      output += 'WARNING: ' + args.map(arg => String(arg)).join(' ') + '\n';
      originalWarn(...args);
    };
    
    if (input.trim()) {
      window.userInput = input.trim();
      output += `Input available as 'userInput': "${input.trim()}"\n\n`;
    }
    
    const result = eval(code);
    
    if (result !== undefined) {
      output += '\nReturned: ' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
    }
    
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    
    if (output.trim()) {
      outputElement.innerText = output;
      outputElement.className = "output success";
    } else {
      outputElement.innerText = "Code executed successfully with no output.";
      outputElement.className = "output success";
    }
  } catch (error) {
    console.log = console.log.bind(console);
    console.error = console.error.bind(console);
    console.warn = console.warn.bind(console);
    
    outputElement.innerText = `Error: ${error.message}\n\nStack trace:\n${error.stack}`;
    outputElement.className = "output error";
  }
}

// ============================================
// WINDOW EVENT HANDLERS
// ============================================
window.addEventListener("hashchange", () => {
  const { pageId, topicIndex } = parsePageHash();
  if (pageId) {
    showPage(pageId, topicIndex);
  }
});

// ============================================
// EXPOSE GLOBAL FUNCTIONS
// ============================================
window.showLanguageTopic = showLanguageTopic;
window.nextLanguageTopic = nextLanguageTopic;
window.prevLanguageTopic = prevLanguageTopic;
window.runCode = runCode;
window.runJavaScript = runJavaScript;
window.changeEditorLanguage = changeEditorLanguage;
window.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;
window.toggleTopics = toggleTopics;
window.toggleTheme = toggleTheme;
window.showPage = showPage;
window.navigateToPath = navigateToPath;
window.navigateToLanguage = navigateToLanguage;
window.navigateToTech = navigateToTech;
window.logout = logout;

//*******typing animation function
function startTypingAnimation(){
  const typingElement = document.querySelector('.typing-animation .code-text');
  if(!typingElement) return;

  const originalText = 'console.log(greet("Developer"));';
  let currentText='';
  let currentIndex = 0;

  function typeText(){
    if(currentIndex<originalText.length){
      currentText += originalText.charAt(currentindex);
      typingElement.innerHTML = `
        <span class="function-name">console</span>.<span class="method">log</span>(<span class="function-name">greet</span>(<span class="string">"Developer"</span>));
        `.substring(0,currentText.length + 50);
      currentIndex++;
      setTimeout(typeText, 100);
    } else {
      //Reset animation after completion
      setTimeout(()=>{
        currentText='';
        currentIndex=0;
        typeText();
      },3000);
    }
  }

  typeText();
}

//************Smooth scroll for table of contents
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll(".toc-item").forEach((item)=>{
    item.addEventListener("click", function(){
      document.querySelectorAll(".toc-item").forEach((i)=>i.classList.remove("active"));
      this.classList.add("active");
    });
  });
});

//************ */ Add intersection observer for right sidebar
if ("IntersectionObserver" in window) {
  const sections = document.querySelectorAll("h2, h3");
  const tocItems = document.querySelectorAll(".toc-item");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          tocItems.forEach((item) => {
            item.classList.remove("active");
            if (item.textContent === entry.target.textContent) {
              item.classList.add("active");
            }
          });
        }
      });
    },
    {
      rootMargin: "-80px 0px -70% 0px",
    }
  );

  sections.forEach((section) => {
    if (section.id) {
      observer.observe(section);
    }
  });
}


//Compiled languages execution via Judge0 API
async function runCompiledCode(editorId, inputId, outputId, language) {
  const code = editors[editorId].getValue();
  const input = document.getElementById(inputId)?.value || "";
  const outputElement = document.getElementById(outputId);

  if (!SUPPORTED_LANGUAGES[language]) {
    outputElement.innerText = "Unsupported language: " + language;
    outputElement.className = "output error";
    return;
  }

  const languageId = SUPPORTED_LANGUAGES[language].judge0;

  outputElement.innerText = `Running ${SUPPORTED_LANGUAGES[language].name}...`;
  outputElement.className = "output running";

  try {
    // Note: You'll need to replace this with your actual API key
    const response = await fetch(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true&fields=*",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          "X-RapidAPI-Key": "8b20b67343msh951b1112167ac58p16abc2jsn3fcd98571348", // Replace with your actual API key
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId, // Java (OpenJDK 13.0.1)
          stdin: input,
          cpu_time_limit: 5,
          memory_limit: 256000
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    let output = "";
    if (result.stdout) {
      output = result.stdout;
      outputElement.className = "output success";
    } else if (result.stderr) {
      output = "Runtime Error:\n" + result.stderr;
      outputElement.className = "output error";
    } else if (result.compile_output) {
      output = "Compilation Error:\n" + result.compile_output;
      outputElement.className = "output error";
    } else {
      output = "No output generated.";
      outputElement.className = "output warning";
    }
    
    outputElement.innerText = output;
    
  } catch (err) {
    console.error("Run code error:", err);
    outputElement.innerText = `Failed to run code: ${err.message}\n\nNote: You need to add your Judge0 API key to use the code execution feature.`;
    outputElement.className = "output error";
  }
}