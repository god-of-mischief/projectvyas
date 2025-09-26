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
  const withTopic =
    typeof topicIndex === "number" ? `${base}?topic=${topicIndex}` : base;
  if (window.location.hash !== withTopic) {
    window.location.hash = withTopic;
  }
}

function showPage(pageId, topicIndex) {
  // Hide all pages
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  // Show selected page
  const target = document.getElementById(pageId);
  if(target){
    target.classList.add("active");
  }

  //update active nav link state - fixed
  document.querySelectorAll(".navbar .nav-link").forEach((link)=>{
    link.classList.remove("active");
    link.removeAttribute("aria-cuurent");

    //Check if this corresponds to the current page
    const href = link.getAttribute("href");
    if(href ===`#&{pageId}`){
      link.classList.add("active");
      link.setAttribute("aria-current","page");
    }
  });

  // If target has data-src and is empty, lazy-load its content
  const src = target.getAttribute("data-src");
  const contentContainer = target?.querySelector(".dynamic-content");
  if (src && contentContainer && contentContainer.childElementCount === 0) {
    contentContainer.innerHTML =
      '<div class="text-muted small py-3">Loading…</div>';
    fetch(src)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((html) => {
        contentContainer.innerHTML = html;
        //Initialize Monaco editors after content is loaded
        setTimeout(()=>{
          initializeMonacoEditors();
          //Initialise aimations for theloaded content
          initializeAnimations();
        },200);
        // Bring the new content into view and highlight sidebar
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        const sidebar = document.getElementById(`${pageId}-topics`);
        if (sidebar) {
          const firstItem = sidebar.querySelector(".list-group-item");
          if (firstItem) {
            firstItem.focus();
          }
        }
        // Initialize topic selection after content is present
        initializeSectionTopic(pageId, topicIndex);
      })
      .catch((error) => {
        console.error("Content load failed:", error);
        const isFileProtocol = window.location.protocol === "file:";
        const hint = isFileProtocol
          ? "Tip: You are opening this file directly. Please run a local web server (e.g., VS Code Live Server, `python -m http.server`, or `npx serve`) and open http://localhost instead of file://."
          : "Please check that the pages/ directory exists and the path is correct.";
        contentContainer.innerHTML = `<div class="alert alert-danger">Failed to load content. ${hint}</div>`;
      });
  } else {
    // Content already available, ensure correct topic is shown
    initializeSectionTopic(pageId, topicIndex);
    //initialize Monaco editors for current page
    setTimeout(()=>{
      initializeMonacoEditors();
      initializeAnimations();
    },100);
  }

  // Update active nav link state
  // document.querySelectorAll(".navbar .nav-link").forEach((link) => {
  //   if (link.getAttribute("data-page") === pageId) {
  //     link.classList.add("active");
  //     link.setAttribute("aria-current", "page");
  //   } else {
  //     link.classList.remove("active");
  //     link.removeAttribute("aria-current");
  //   }
  // });

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
  return Array.from(section.querySelectorAll(".language-topic"));
}

function setActiveLanguageTopic(langSectionId, newIndex) {
  const topics = getLanguageTopicContainers(langSectionId);
  if (newIndex < 0 || newIndex >= topics.length) return;

  topics.forEach((t) => t.classList.remove("active"));
  topics[newIndex].classList.add("active");

  // Update sidebar list-group active state if present
  const sidebar = document.getElementById(`${langSectionId}-topics`);
  if (sidebar) {
    const buttons = Array.from(sidebar.querySelectorAll(".list-group-item"));
    buttons.forEach((b) => b.classList.remove("active"));
    if (buttons[newIndex]) buttons[newIndex].classList.add("active");
  }
}

function showLanguageTopic(langSectionId, index) {
  setActiveLanguageTopic(langSectionId, index);
  try {
    localStorage.setItem(`sectionTopic:${langSectionId}`, String(index));
  } catch {}
  updateHash(langSectionId, index);
}

function nextLanguageTopic(langSectionId) {
  const topics = getLanguageTopicContainers(langSectionId);
  const activeIndex = topics.findIndex((t) => t.classList.contains("active"));
  const nextIndex = Math.min(activeIndex + 1, topics.length - 1);
  setActiveLanguageTopic(langSectionId, nextIndex);
  try {
    localStorage.setItem(`sectionTopic:${langSectionId}`, String(nextIndex));
  } catch {}
  updateHash(langSectionId, nextIndex);
}

function prevLanguageTopic(langSectionId) {
  const topics = getLanguageTopicContainers(langSectionId);
  const activeIndex = topics.findIndex((t) => t.classList.contains("active"));
  const prevIndex = Math.max(activeIndex - 1, 0);
  setActiveLanguageTopic(langSectionId, prevIndex);
  try {
    localStorage.setItem(`sectionTopic:${langSectionId}`, String(prevIndex));
  } catch {}
  updateHash(langSectionId, prevIndex);
}

//Initialize section topic
function initializeSectionTopic(pageId, explicitIndex) {
  const topics = getLanguageTopicContainers(pageId);
  if (topics.length === 0) return;
  let index = typeof explicitIndex === "number" ? explicitIndex : undefined;
  if (typeof index !== "number" || isNaN(index)) {
    try {
      const stored = localStorage.getItem(`sectionTopic:${pageId}`);
      if (stored !== null) index = Number(stored);
    } catch {}
  }
  if (typeof index !== "number" || isNaN(index)) index = 0;
  index = Math.max(0, Math.min(index, topics.length - 1));
  setActiveLanguageTopic(pageId, index);
}

// Mobile: toggle topics sidebar visibility
function toggleTopics(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const sidebar = section.querySelector(".topics-sidebar-collapsible");
  if (!sidebar) return;
  sidebar.classList.toggle("show");
}

// Theme toggle
function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  const icon = document.getElementById("theme-icon");
  if(icon){
    icon.className = newTheme === "light" ? "bi bi-moon-fill" : "bi bi-sun-fill";
  }
  
  //Updated Monaco editor themes
  updateMonacoTheme(newTheme);
}

function updateMonacoTheme(theme) {
  if(typeof monaco!=='undefined'){
    const monacoTheme = theme === "dark" ? "vs-dark" : "vs";
    try{
      monaco.editor.setTheme(monacoTheme);
    } catch(e){
      console.log("Monavo theme update failed:",e);
    }
  }
}

// Animated counter for stats
function animateCounter(element, target) {
  if(!element) return;

  let current = 0;
  const increment = target / 100;
  const suffix=element.textContent.includes("+")?"+" : element.textContent.includes("%")?"%":"";

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent =
      Math.floor(current) +suffix;
  }, 20);
}

// If URL hash maps to a section, open it on load
window.addEventListener("DOMContentLoaded", () => {
  const { pageId, topicIndex } = parsePageHash();
  if (pageId) {
    const target = document.getElementById(pageId);
    if (target) {
      showPage(pageId, topicIndex);
    }
  }
});

// Trigger counter animation when visible
function initializeAnimations(){
  const observerOptions = {
    threshold: 0.5,
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const statNumbers = entry.target.querySelectorAll(".stat-number");
        statNumbers.forEach((num) => {
          const text = num.textContent;
          const value = parseInt(text.replace(/\D/g, ""));
          if (value && !num.dataset.animated) {
            num.dataset.animated="true";
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

  //card hover animations
  const cards =document.querySelectorAll('.card-custom, .feature-card, .stat-card, .testimonial-card, .learning-path-card, .tech-item');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function(){
      this.style.transform='translateY(-5px)';
    });
    card.addEventListener('mouseleave',function(){
      this.style.transform='translateY(0)';
    });
  });

  //Typing animation for hero section
  startTypingAnimation();
}

//typing animation function
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

//Smooth scroll for table of contents
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll(".toc-item").forEach((item)=>{
    item.addEventListener("click", function(){
      document.querySelectorAll(".toc-item").forEach((i)=>i.classList.remove("active"));
      this.classList.add("active");
    });
  });
});

// Add intersection observer for right sidebar
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

// Monaco Editor Implementation
let editors = {};
let monacoLoaded = false;

//Language Configurations
const SUPPORTED_LANGUAGES = {
  javascript: {
    name: "JavaScript",
    monaco: "javascript",
    judge0: 63,
    defaultCode: `//JavaScript Example
console.log("Hello from JavaScript!");

//Variables and Data Types
let name = "Javascript Developer";
const age = 25;
let skills = ["HTML", "CSS", "JavaScript"];

console.log("Name:", name);
console.log("Age:", age);
console.log("Skills:", skills.join(", "));

//Functions
function greet(person) {
  return \`Hello, \${person}!\`;
}

console.log(greet(name));`
  },
  python: {
    name: "Python",
    monaco: "python",
    judge0: 71,
    defaultCode: '# Python Example\nprint("Hello from Python!")',
  }
};

function initializeMonacoEditors() {
  //Don't initialize if alredy loaded
  if(monacoLoaded){
    setupEditors();
    return;
  }

  // Check if Monaco is available
  if (typeof monaco !== 'undefined') {
    setupEditors();
    monacoLoaded = true;
    return;
  }

  // Load Monaco if not already loaded
  if (typeof require === 'undefined') {
    loadRequireJS();
  }
  else{
    loadMonaco();
  }
}

function loadRequireJS(){
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
  if(typeof require === 'undefined'){
    console.log('RequireJS not available');
    showEditorError();
    return;
  }
  require.config({
    paths: {
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs",
    },
  });

  require(["vs/editor/editor.main"], function () {
    setupEditors();
    monacoLoaded = true;
  }, function(err){
    console.error('Failed to load Monaco Editor:', err);
    showEditorError();
  });
}

function showEditorError() {
  document.querySelectorAll('[id^="editor"]').forEach(editorContainer => {
    if (editorContainer) {
      editorContainer.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: #f8f9fa;
        color: #6c757d;
        text-align: center;
        padding: 2rem;
        border: 1px solid #dee2e6;
        border-radius: 0.5rem;
      ">
        <div>
          <i class "bi bi-exclamation-triangle" style="font-size: 2rem;margin-bottom: 1rem;"></i>
          <p>Code editor failed to load.<br>please refresh the page to try again</p>
        </div>
      `;
    }
  });
}

function setupEditors(){
  //Find all editor containers and create editors
  document.querySelectorAll('[id^="editor"]').forEach(editorContainer=>{
    if(editorContainer && !editors[editorContainer,id] && editorContainer.innerHTML.trim()===''){
      try{
        const defaultLanguage = getDefaultLanguageForPage();
        const defaultCode = SUPPORTED_LANGUAGES[defaultLanguage].defaultCode;

        const savedTheme = localStorage.getItem("theme") || "light";
        const monacoTheme = savedTheme === "dark" ? "vs-dark" : "vs";
  
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

        //store the current languages for this editor
        editorContainer.dataset.language = defaultLanguage;

        //update dropdown if it exits
        const dropdown=document.getElementById(`${editorContainer.id}-language`);
        if(dropdown){
          dropdown.value=defaultLanguage;
        }

        // Ensure proper sizing
        setTimeout(() => {
          if (editors[editorContainer.id]) {
            editors[editorContainer.id].layout();
          }
        }, 100);
      } catch (error) {
        console.error('Error creating editor:', error);
        showEditorError();
      }
    }
  });
}

function getDefaultLanguageForPage() {
  const currentPage = document.querySelector('.page.active');

  if(currentPage){
    if (currentPage.id === 'lang-js') return 'javascript';
    if (currentPage.id === 'lang-python') return 'python';
    if (currentPage.id === 'lang-java') return 'java';
    if (currentPage.id === 'lang-typescript') return 'typescript';
  }

  return 'javascript'; // Default to JavaScript
}  

//Function to change editor language
function changeEditorLanguage(editorId, language) {
  if (!editors[editorId] || !SUPPORTED_LANGUAGES[language]) return;

  const editor = editors[editorId];
  const langConfig = SUPPORTED_LANGUAGES[language];

  //Update Monaco language
  monaco.editor.setModelLanguage(editor.getModel(), langConfig.monaco);

  //Set default code for the new language
  editor.setValue(langConfig.defaultCode);

  //Store the current language
  const editorContainer = document.getElementById(editorId);
  if (editorContainer) {
    editorContainer.dataset.language = language;
  }

  //Update dropdown selection
  const dropdown = document.getElementById(`${editorId}-language`);
  if (dropdown) {
    dropdown.value = language;
  }
}

//Enhanced run code function with language detection
async function runCode(editorId, inputId, outputId) {
  if (!editors[editorId]) {
    document.getElementById(outputId).innerText = "Editor not initialized. Please refresh the page.";
    return;
  }

  const editorContainer = document.getElementById(editorId);
  const language = editorContainer?.dataset?.language || 'javascript';

  //Use appropriate execution function based on language
  if (language === 'javascript' || language === 'typescript') {
    return runJavaScript(editorId, inputId, outputId);
  } else {
    return runCompiledCode(editorId, inputId, outputId, language);
  }
}

//JavaScript-specific execution (runs in browser)
async function runJavaScript(editorId, inputId, outputId) {
  if (!editors[editorId]) {
    document.getElementById(outputId).innerText = "Editor not initialized. Please refresh the page.";
    return;
  }

  const code = editors[editorId].getValue();
  const input = document.getElementById(inputId)?.value || "";
  const outputElement = document.getElementById(outputId);

  outputElement.innerText = "Running JavaScript...";
  outputElement.className = "output running";

  try {
    // Capture console.log output
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    let output = "";

    // Override console methods to capture output
    console.log = (...args) => {
      output += args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ') + '\n';
      originalLog(...args); // Still log to browser console
    };

    console.error = (...args) => {
      output += 'ERROR: ' + args.map(arg => String(arg)).join(' ') + '\n';
      originalError(...args);
    };

    console.warn = (...args) => {
      output += 'WARNING: ' + args.map(arg => String(arg)).join(' ') + '\n';
      originalWarn(...args);
    };

    // If there's input, make it available as a variable
    if (input.trim()) {
      window.userInput = input.trim();
      output += `Input available as 'userInput': "${input.trim()}"\n\n`;
    }

    // Execute the JavaScript code
    const result = eval(code);

    // If the code returns something, show it
    if (result !== undefined) {
      output += '\nReturned: ' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
    }

    // Restore original console methods
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;

    //Show output
    if (output.trim()) {
      outputElement.innerText = output;
      outputElement.className = "output success";
    } else {
      outputElement.innerText = "Code executed successfully with no output.";
      outputElement.className = "output success";
    }
  } catch (error) {
    // Restore original console methods
    console.log = console.log.bind(console);
    console.error = console.error.bind(console);
    console.warn = console.warn.bind(console);

    outputElement.innerText = `Error: ${error.message}\n\nStack trace:\n${error.stack}`;
    outputElement.className = "output error";
  }
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

// Load saved theme
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.setAttribute("data-theme", savedTheme);
  const icon = document.getElementById("theme-icon");
  if (icon) {
    icon.className =
      savedTheme === "light" ? "bi bi-moon-fill" : "bi bi-sun-fill";
  }

  //Initialize animations
  setTimeout(initializeAnimations, 500);

  //Initialize Monaco editors
  setTimeout(initializeMonacoEditors, 1000);
});

//IF url hash maps to a section, oprn it on load
window.addEventListener("DOMContentLoaded", ()=>{
  const {pageId, topicIndex} = parsePageHash();
  if(pageId){
    const target = document.getElementById(pageId);
    if(target){
      showPage(pageId, topicIndex);
    }
  }
});

window.addEventListener("hashchange", () => {
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