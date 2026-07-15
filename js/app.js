import { 
  getAppState, 
  saveAppState, 
  resetAppStateToDemo, 
  clearUserSession, 
  parseUploadedFileMock 
} from './data.js';

import { 
  generateAIChatResponse, 
  generateDoctorQuestions 
} from './ai-engine.js';

import { 
  renderTrendChart 
} from './charts.js';

// Global Application State
let appState = null;
let currentActiveView = "landing";
let selectedReportId = null;
let isSignUpMode = false;

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  appState = getAppState();
  initRouting();
  initAuth();
  initDashboard();
  initUpload();
  initTimeline();
  initReportDetails();
  initChat();
  initDoctorSummary();
  initSettings();
  
  // Render initial navigation visibility based on session
  updateNavigationUI();
  
  // Navigate to initial view
  if (appState.currentUser) {
    navigateTo("dashboard");
  } else {
    navigateTo("landing");
  }
});

// View Routing Switcher
function navigateTo(viewId) {
  // Hide all sections, show target
  document.querySelectorAll(".view-section").forEach(sec => {
    sec.classList.remove("active");
  });
  
  const targetSection = document.getElementById(`view-${viewId}`);
  if (targetSection) {
    targetSection.classList.add("active");
    currentActiveView = viewId;
  }
  
  // Highlight navigation link
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
    if (link.getAttribute("data-view") === viewId) {
      link.classList.add("active");
    }
  });
  // Handle View-Specific On-Load Triggers
  switch (viewId) {
    case "dashboard":
      refreshDashboard();
      break;
    case "upload":
      refreshUpload();
      break;
    case "timeline":
      refreshTimeline();
      break;
    case "chat":
      refreshChatWindow();
      break;
    case "summary":
      refreshDoctorSummary();
      break;
    case "settings":
      refreshSettings();
      break;
  }
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Share navigation globally for chart nodes click
window.navigateToReportDetails = function(reportId) {
  selectedReportId = reportId;
  navigateTo("report-details");
};

// Setup Header Navigation Links
function initRouting() {
  // Nav links click
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      const targetView = link.getAttribute("data-view");
      navigateTo(targetView);
    });
  });

  // Logo click
  document.getElementById("logo-btn").addEventListener("click", () => {
    if (appState.currentUser) {
      navigateTo("dashboard");
    } else {
      navigateTo("landing");
    }
  });

  // Landing Page Buttons
  document.getElementById("nav-login-btn").addEventListener("click", () => {
    showAuthForm(false); // Login
  });
  document.getElementById("nav-signup-btn").addEventListener("click", () => {
    showAuthForm(true); // Signup
  });

  document.getElementById("hero-get-started").addEventListener("click", () => {
    showAuthForm(true);
  });
  document.getElementById("cta-get-started").addEventListener("click", () => {
    showAuthForm(true);
  });

  document.getElementById("hero-explore-demo").addEventListener("click", () => {
    // Force reset demo state, login dummy, and go to dashboard
    appState = resetAppStateToDemo();
    updateNavigationUI();
    navigateTo("dashboard");
    showToast("Demo environment loaded successfully.");
  });

  // Main back to dashboard buttons
  document.getElementById("detail-back-to-dash-btn").addEventListener("click", () => {
    navigateTo("dashboard");
  });
}

// Update header visibility of navigation tabs
function updateNavigationUI() {
  const mainNav = document.getElementById("main-nav");
  const authButtons = document.getElementById("nav-auth-buttons");
  const userProfile = document.getElementById("nav-user-profile");
  const userDisplayName = document.getElementById("user-display-name");

  if (appState.currentUser) {
    mainNav.style.display = "flex";
    authButtons.style.display = "none";
    userProfile.style.display = "flex";
    userDisplayName.textContent = appState.currentUser.name;
  } else {
    mainNav.style.display = "none";
    authButtons.style.display = "flex";
    userProfile.style.display = "none";
  }
}

// Toast Notifications
function showToast(message) {
  const toast = document.getElementById("toast-notification");
  const toastMsg = document.getElementById("toast-message");
  if (!toast) return;

  toastMsg.textContent = message;
  toast.style.display = "flex";
  
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => {
      toast.style.display = "none";
      toast.style.opacity = "";
      toast.style.transform = "";
    }, 400);
  }, 3500);
}

// --- VIEW CONTROLLERS ---

// 1. AUTHENTICATION
function initAuth() {
  const switchLink = document.getElementById("auth-switch-link");
  const switchText = document.getElementById("auth-switch-text");
  const nameGroup = document.getElementById("auth-name-group");
  const submitBtn = document.getElementById("auth-submit-btn");
  const title = document.getElementById("auth-title");
  const subtitle = document.getElementById("auth-subtitle");
  const logoutBtn = document.getElementById("logout-btn");
  
  // Forgot password wrappers
  const authFormWrapper = document.getElementById("auth-form-wrapper");
  const forgotFormWrapper = document.getElementById("forgot-password-form-wrapper");
  const forgotSuccessWrapper = document.getElementById("forgot-success-wrapper");
  const forgotLink = document.getElementById("auth-forgot-link");
  const forgotBackLink = document.getElementById("forgot-back-to-login");
  const forgotSuccessBackBtn = document.getElementById("forgot-success-back-btn");
  const forgotSubmitBtn = document.getElementById("forgot-submit-btn");
  
  // Google SSO button
  const googleLoginBtn = document.getElementById("google-login-btn");

  // Toggle Login / Sign Up modes
  switchLink.addEventListener("click", () => {
    isSignUpMode = !isSignUpMode;
    if (isSignUpMode) {
      title.textContent = "Create Account";
      subtitle.textContent = "Join SUMINO to store medical timeline";
      nameGroup.style.display = "block";
      submitBtn.textContent = "Sign Up";
      switchText.textContent = "Already have an account?";
      switchLink.textContent = "Log In";
      forgotLink.style.display = "none"; // Hide forgot password on signup
    } else {
      title.textContent = "Welcome to SUMINO";
      subtitle.textContent = "Log in to view your health memory";
      nameGroup.style.display = "none";
      submitBtn.textContent = "Log In";
      switchText.textContent = "Don't have an account?";
      switchLink.textContent = "Sign Up";
      forgotLink.style.display = "inline";
    }
  });

  // Forgot Password Link Click
  forgotLink.addEventListener("click", () => {
    authFormWrapper.style.display = "none";
    forgotFormWrapper.style.display = "block";
    forgotSuccessWrapper.style.display = "none";
  });

  // Back to Login Link Click (Forgot Form)
  forgotBackLink.addEventListener("click", () => {
    authFormWrapper.style.display = "block";
    forgotFormWrapper.style.display = "none";
    forgotSuccessWrapper.style.display = "none";
  });

  // Back to Login Click (Success Screen)
  forgotSuccessBackBtn.addEventListener("click", () => {
    authFormWrapper.style.display = "block";
    forgotFormWrapper.style.display = "none";
    forgotSuccessWrapper.style.display = "none";
  });

  // Forgot Password Submit
  forgotSubmitBtn.addEventListener("click", () => {
    const email = document.getElementById("forgot-email").value.trim();
    if (!email) {
      showToast("Please enter a valid email address.");
      return;
    }
    
    // Render target email on success screen
    document.getElementById("reset-target-email").textContent = email;
    
    // Switch views
    forgotFormWrapper.style.display = "none";
    forgotSuccessWrapper.style.display = "block";
    
    showToast(`Password reset link sent to ${email}`);
    document.getElementById("forgot-email").value = "";
  });

  // Google Login SSO Simulation
  googleLoginBtn.addEventListener("click", () => {
    // Log in a simulated Google user
    appState.currentUser = { email: "sandeep@gmail.com", name: "Sandeep" };
    appState.reports = [];
    appState.chatHistory = [];
    
    saveAppState(appState);
    updateNavigationUI();
    navigateTo("dashboard");
    showToast("Signed in via Google successfully.");
  });

  // Standard Email/Password Submit Handler
  submitBtn.addEventListener("click", () => {
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const name = document.getElementById("auth-name").value.trim();

    if (!email || !password || (isSignUpMode && !name)) {
      showToast("Please fill in all required fields.");
      return;
    }

    if (isSignUpMode) {
      // Sign Up Mock
      appState.currentUser = { email, name };
      appState.reports = [];
      appState.chatHistory = [];
      showToast(`Account created! Welcome, ${name}.`);
    } else {
      // Login Mock
      appState.currentUser = { email, name: email.split('@')[0] };
      // Keep existing reports if any, otherwise empty
      showToast("Signed in successfully.");
    }
    
    saveAppState(appState);
    updateNavigationUI();
    navigateTo("dashboard");
  });

  // Logout Handler
  logoutBtn.addEventListener("click", () => {
    appState = clearUserSession();
    updateNavigationUI();
    navigateTo("landing");
    showToast("Signed out successfully.");
  });
}

function showAuthForm(signup = false) {
  isSignUpMode = signup;
  navigateTo("auth");
  const switchLink = document.getElementById("auth-switch-link");
  const switchText = document.getElementById("auth-switch-text");
  const nameGroup = document.getElementById("auth-name-group");
  const submitBtn = document.getElementById("auth-submit-btn");
  const title = document.getElementById("auth-title");
  const subtitle = document.getElementById("auth-subtitle");
  
  // Reset Form Wrappers
  document.getElementById("auth-form-wrapper").style.display = "block";
  document.getElementById("forgot-password-form-wrapper").style.display = "none";
  document.getElementById("forgot-success-wrapper").style.display = "none";

  const forgotLink = document.getElementById("auth-forgot-link");

  if (signup) {
    title.textContent = "Create Account";
    subtitle.textContent = "Join SUMINO to store medical timeline";
    nameGroup.style.display = "block";
    submitBtn.textContent = "Sign Up";
    switchText.textContent = "Already have an account?";
    switchLink.textContent = "Log In";
    forgotLink.style.display = "none";
  } else {
    title.textContent = "Welcome to SUMINO";
    subtitle.textContent = "Log in to view your health memory";
    nameGroup.style.display = "none";
    submitBtn.textContent = "Log In";
    switchText.textContent = "Don't have an account?";
    switchLink.textContent = "Sign Up";
    forgotLink.style.display = "inline";
  }
}

// 2. DASHBOARD
function initDashboard() {
  // Bind shortcuts
  document.querySelectorAll("#dash-upload-shortcut").forEach(btn => {
    btn.addEventListener("click", () => navigateTo("upload"));
  });
  
  document.getElementById("dash-view-all-reports-btn").addEventListener("click", () => navigateTo("timeline"));
  document.getElementById("dash-view-charts-btn").addEventListener("click", () => navigateTo("timeline"));
  document.getElementById("dash-view-summary-btn").addEventListener("click", () => navigateTo("summary"));

  // Quick Chat Form Submit
  const quickChatForm = document.getElementById("dash-quick-chat-form");
  const quickChatTextbox = document.getElementById("dash-quick-chat-textbox");
  
  quickChatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const prompt = quickChatTextbox.value.trim();
    if (!prompt) return;
    
    // Clear textbox
    quickChatTextbox.value = "";
    
    // Navigate to Chat
    navigateTo("chat");
    
    // Inject and send prompt
    sendChatMessage(prompt);
  });
}

function refreshDashboard() {
  const reports = appState.reports || [];
  const reportsContainer = document.getElementById("dashboard-reports-container");
  const insightsContainer = document.getElementById("dashboard-insights-container");
  const userName = document.getElementById("dash-user-name");
  const welcomeCount = document.getElementById("dash-welcome-count");

  // Welcome user greeting
  userName.textContent = appState.currentUser ? appState.currentUser.name.split(' ')[0] : "Jane";
  welcomeCount.textContent = reports.length === 1 ? "1 medical panel" : `${reports.length} medical panels`;

  // Render SVG Trend Preview Chart (LDL Cholesterol)
  renderTrendChart("dash-timeline-svg-preview", "LDL Cholesterol", reports);

  // Check if reports are empty
  if (reports.length === 0) {
    reportsContainer.innerHTML = `
      <div style="text-align: center; padding: 32px; color: var(--text-light);">
        <p style="margin-bottom: 16px;">No medical reports uploaded yet.</p>
        <button class="btn btn-secondary" onclick="document.getElementById('nav-upload').click()">Upload First Report</button>
      </div>
    `;
    insightsContainer.innerHTML = `
      <div class="insight-item" style="border-left-color: var(--text-light); background-color: var(--bg-secondary); margin-bottom: 0;">
        <div class="insight-icon" style="color: var(--text-light);">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </div>
        <div class="insight-text">
          <p>Once you upload blood tests, AI will display medical summary advice and timeline warnings here.</p>
        </div>
      </div>
    `;
    return;
  }

  // Sort reports (newest first)
  const sortedReports = [...reports].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Render recent reports (up to 4)
  reportsContainer.innerHTML = "";
  sortedReports.slice(0, 4).forEach(report => {
    const reportItem = document.createElement("div");
    reportItem.className = "report-item";
    reportItem.addEventListener("click", () => {
      window.navigateToReportDetails(report.id);
    });

    const abnCount = report.biomarkers.filter(b => b.status !== "normal").length;
    const abnBadge = abnCount > 0 
      ? `<span class="badge badge-abnormal" style="font-size: 0.75rem">${abnCount} out of range</span>` 
      : `<span class="badge badge-normal" style="font-size: 0.75rem">all optimal</span>`;

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date(report.date);
    const dateFormatted = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

    reportItem.innerHTML = `
      <div class="report-info">
        <div class="report-icon-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div class="report-meta">
          <h4>${report.fileName}</h4>
          <p>${report.labName} • ${dateFormatted}</p>
        </div>
      </div>
      <div>
        ${abnBadge}
      </div>
    `;
    reportsContainer.appendChild(reportItem);
  });

  // Render AI Insights
  insightsContainer.innerHTML = "";
  
  const latestReport = sortedReports[0];
  const abnormalMarkers = latestReport.biomarkers.filter(b => b.status !== "normal");

  // 1. Core overall warning/status
  if (abnormalMarkers.length > 0) {
    const insight1 = document.createElement("div");
    insight1.className = "insight-item";
    
    // Pick the most severe
    const highMarkers = abnormalMarkers.filter(b => b.status === "high");
    const warningText = highMarkers.length > 0 
      ? `Elevated metabolic panels detected: <strong>${highMarkers.map(m=>m.name).join(", ")}</strong> exceed clinical limits. Dietary modifications are advised.`
      : `Borderline biomarkers observed: <strong>${abnormalMarkers.map(m=>m.name).join(", ")}</strong> require lifestyle tracking.`;

    insight1.innerHTML = `
      <div class="insight-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <div class="insight-text">
        <p>${warningText}</p>
        <span class="source">Source: AI analysis of ${latestReport.fileName}</span>
      </div>
    `;
    insightsContainer.appendChild(insight1);
  }

  // 2. Cholesterol progression insight
  const cholHistory = [];
  sortedReports.forEach(r => {
    const tc = r.biomarkers.find(b => b.name.toLowerCase().includes("total cholesterol"));
    if (tc) cholHistory.push({ date: r.date, val: tc.value });
  });

  if (cholHistory.length > 1) {
    const sortedHistory = [...cholHistory].sort((a,b)=> new Date(a.date) - new Date(b.date));
    const firstTC = sortedHistory[0].val;
    const lastTC = sortedHistory[sortedHistory.length - 1].val;
    const diff = lastTC - firstTC;

    if (diff > 0) {
      const insight2 = document.createElement("div");
      insight2.className = "insight-item";
      insight2.style.borderLeftColor = "var(--danger)";
      insight2.innerHTML = `
        <div class="insight-icon" style="color: var(--danger)">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </div>
        <div class="insight-text">
          <p>Your Total Cholesterol rose by <strong>+${diff} mg/dL</strong> over the last year. Focus on reducing lipid intake to slow this progression.</p>
          <span class="source">Source: 12-Month Multi-panel comparison</span>
        </div>
      `;
      insightsContainer.appendChild(insight2);
    }
  }

  // 3. Vitamin D positive improvement insight
  const vitdHistory = [];
  sortedReports.forEach(r => {
    const vd = r.biomarkers.find(b => b.name.toLowerCase().includes("vitamin d"));
    if (vd) vitdHistory.push({ date: r.date, val: vd.value, status: vd.status });
  });

  if (vitdHistory.length > 1) {
    const sortedVD = [...vitdHistory].sort((a,b)=> new Date(a.date) - new Date(b.date));
    const firstVD = sortedVD[0];
    const lastVD = sortedVD[sortedVD.length - 1];

    if (firstVD.status === "low" && lastVD.status === "normal") {
      const insight3 = document.createElement("div");
      insight3.className = "insight-item";
      insight3.style.borderLeftColor = "var(--success)";
      insight3.innerHTML = `
        <div class="insight-icon" style="color: var(--success)">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div class="insight-text">
          <p>Deficiency Resolved: Vitamin D climbed from <strong>${firstVD.val} ng/mL</strong> to <strong>${lastVD.val} ng/mL</strong>, successfully crossing into optimal ranges.</p>
          <span class="source">Source: Lab timeline tracker</span>
        </div>
      `;
      insightsContainer.appendChild(insight3);
    }
  }
}

// 3. UPLOAD REPORT
function initUpload() {
  const dragZone = document.getElementById("drag-drop-zone");
  const fileInput = document.getElementById("report-file-input");

  // Drag over effects
  dragZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dragZone.classList.add("dragover");
  });

  dragZone.addEventListener("dragleave", () => {
    dragZone.classList.remove("dragover");
  });

  dragZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dragZone.classList.remove("dragover");
    
    if (e.dataTransfer.files.length > 0) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleSelectedFile(e.target.files[0]);
    }
  });

  // Success panel action buttons listeners
  document.getElementById("success-view-dash-btn").addEventListener("click", () => {
    navigateTo("dashboard");
  });
  
  document.getElementById("success-view-details-btn").addEventListener("click", () => {
    if (selectedReportId) {
      window.navigateToReportDetails(selectedReportId);
    } else {
      navigateTo("dashboard");
    }
  });
}

function refreshUpload() {
  // Reset Upload Panel States
  document.getElementById("drag-drop-zone").style.display = "block";
  document.getElementById("upload-progress-card").style.display = "none";
  document.getElementById("upload-success-panel").style.display = "none";
  document.getElementById("upload-error-banner").style.display = "none";
  document.getElementById("report-file-input").value = "";

  // Render Upload History sidebar list
  const reports = appState.reports || [];
  const historyContainer = document.getElementById("upload-history-list-container");

  if (reports.length === 0) {
    historyContainer.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--text-light); font-size: 0.85rem;">No files uploaded in sandbox yet.</div>`;
    return;
  }

  // Sort reports (newest first)
  const sorted = [...reports].sort((a,b) => new Date(b.date) - new Date(a.date));

  historyContainer.innerHTML = "";
  sorted.forEach(report => {
    const item = document.createElement("div");
    item.className = "report-item";
    item.addEventListener("click", () => {
      window.navigateToReportDetails(report.id);
    });

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date(report.date);
    const dateFormatted = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    const abnCount = report.biomarkers.filter(b => b.status !== "normal").length;

    item.innerHTML = `
      <div class="report-info">
        <div class="report-icon-box" style="background-color: var(--success-bg); color: var(--success);">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="report-meta">
          <h4>${report.fileName}</h4>
          <p>${dateFormatted} • ${report.labName}</p>
        </div>
      </div>
      <span style="font-size: 0.75rem; color: var(--success-text); background-color: var(--success-bg); font-weight: 700; padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid var(--success-border);">Parsed</span>
    `;
    historyContainer.appendChild(item);
  });
}

function handleSelectedFile(file) {
  const errorBanner = document.getElementById("upload-error-banner");
  const errorText = document.getElementById("upload-error-text");
  const dragZone = document.getElementById("drag-drop-zone");
  const progressCard = document.getElementById("upload-progress-card");

  // Validate File Extension/Type
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    errorText.textContent = "The selected file is not a valid PDF document. Please verify that the file ends in .pdf and try again.";
    errorBanner.style.display = "flex";
    progressCard.style.display = "none";
    dragZone.style.display = "block";
    showToast("Invalid file format. Upload rejected.");
    return;
  }

  // File is valid, clean up errors and hide dragzone
  errorBanner.style.display = "none";
  dragZone.style.display = "none";

  const progressFilename = document.getElementById("progress-filename");
  const progressBar = document.getElementById("upload-progress-bar");
  const progressPercent = document.getElementById("progress-percent");
  const progressStatusText = document.getElementById("progress-status-text");

  // Reset progress and display
  progressBar.style.width = "0%";
  progressPercent.textContent = "0%";
  progressFilename.textContent = file.name;
  progressStatusText.textContent = "Uploading PDF file...";
  progressCard.style.display = "block";

  // Simulate file reading/AI parsing steps
  const steps = [
    { threshold: 20, text: "Reading PDF document lines..." },
    { threshold: 45, text: "AI identifying laboratory template..." },
    { threshold: 65, text: "Extracting blood panel biomarkers..." },
    { threshold: 85, text: "Running anomaly scoring algorithms..." },
    { threshold: 100, text: "Saving to health memory sandbox..." }
  ];

  let currentPercent = 0;
  const interval = setInterval(() => {
    currentPercent += 5;
    if (currentPercent > 100) {
      clearInterval(interval);
      completeMockParsing(file);
    } else {
      progressBar.style.width = `${currentPercent}%`;
      progressPercent.textContent = `${currentPercent}%`;
      
      const currentStep = steps.find(s => currentPercent <= s.threshold);
      if (currentStep) {
        progressStatusText.textContent = currentStep.text;
      }
    }
  }, 100);
}

function completeMockParsing(file) {
  // Parse file and generate biomarkers
  const newReport = parseUploadedFileMock(file.name, file.size);
  
  // Add to state
  appState.reports.push(newReport);
  selectedReportId = newReport.id;
  
  // Add an automated AI welcome message in chat reflecting the new upload
  const abnCount = newReport.biomarkers.filter(b => b.status !== "normal").length;
  const notificationMsg = {
    sender: "ai",
    text: `I've successfully parsed your new report <strong>${newReport.fileName}</strong> from <strong>${newReport.labName}</strong> (${newReport.date}). I extracted ${newReport.biomarkers.length} biomarkers. I flagged ${abnCount} out-of-range metrics. Ask me what changed!`,
    timestamp: new Date().toISOString()
  };
  appState.chatHistory.push(notificationMsg);

  saveAppState(appState);
  
  // Clean up UI progress, show success card
  document.getElementById("upload-progress-card").style.display = "none";
  document.getElementById("success-biomarker-count").textContent = `${newReport.biomarkers.length} indicators`;
  document.getElementById("success-filename-display").textContent = newReport.fileName;
  document.getElementById("upload-success-panel").style.display = "block";
  
  showToast(`Report '${file.name}' extracted successfully!`);
}

// 4. TIMELINE
function initTimeline() {
  const selector = document.getElementById("timeline-metric-selector");
  selector.addEventListener("change", () => {
    refreshTimeline();
  });
}

function refreshTimeline() {
  const reports = appState.reports || [];
  const container = document.getElementById("timeline-nodes-container");
  const metricSelector = document.getElementById("timeline-metric-selector");
  const targetMetric = metricSelector.value;

  // Render SVG Trend graph
  renderTrendChart("svg-trend-chart-container", targetMetric, reports);

  // Render nodes list
  container.innerHTML = "";
  if (reports.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-light)">Upload reports to view chronological timeline nodes.</div>`;
    return;
  }

  // Sort reports (newest first for display, oldest first to calculate trends)
  const sortedReports = [...reports].sort((a, b) => new Date(b.date) - new Date(a.date));
  const chronologicalReports = [...reports].sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedReports.forEach(report => {
    const node = document.createElement("div");
    node.className = "timeline-node";
    
    // Find preceding report for trend calculation
    const chronoIndex = chronologicalReports.findIndex(r => r.id === report.id);
    const precedingReport = chronoIndex > 0 ? chronologicalReports[chronoIndex - 1] : null;

    const abnCount = report.biomarkers.filter(b => b.status !== "normal").length;
    const badgeHtml = abnCount > 0 
      ? `<span class="badge badge-abnormal">${abnCount} out-of-range</span>` 
      : `<span class="badge badge-normal">Optimal</span>`;

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date(report.date);
    const dateFormatted = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

    // Collect tags to show initially
    let tagsHtml = "";
    report.biomarkers.slice(0, 4).forEach(b => {
      const dotColor = b.status === "normal" ? "var(--success)" : b.status === "borderline" ? "var(--warning)" : "var(--danger)";
      tagsHtml += `
        <span class="timeline-node-bio-tag">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background-color:${dotColor}"></span>
          ${b.name}: <strong>${b.value}</strong>
        </span>
      `;
    });

    // Generate full table rows for expandable details
    let expandedRowsHtml = "";
    report.biomarkers.forEach(b => {
      let trendHtml = `<span style="color:var(--text-light)">—</span>`; // Default baseline
      
      if (precedingReport) {
        const prevB = precedingReport.biomarkers.find(x => x.name === b.name);
        if (prevB) {
          const delta = b.value - prevB.value;
          if (delta > 0) {
            // Is increase good or bad?
            const isGood = b.name.toLowerCase().includes("vitamin") || b.name.toLowerCase().includes("hemoglobin");
            const color = isGood ? "var(--success)" : "var(--danger)";
            trendHtml = `<span style="color:${color}; font-weight:600;">▲ +${delta.toFixed(1)}</span>`;
          } else if (delta < 0) {
            const isGood = b.name.toLowerCase().includes("vitamin") || b.name.toLowerCase().includes("hemoglobin");
            const color = isGood ? "var(--danger)" : "var(--success)";
            trendHtml = `<span style="color:${color}; font-weight:600;">▼ ${Math.abs(delta).toFixed(1)}</span>`;
          } else {
            trendHtml = `<span style="color:var(--text-muted)">■ 0.0</span>`;
          }
        }
      }

      const statusBadge = `<span class="badge badge-${b.status}" style="font-size:0.75rem; padding: 2px 6px;">${b.status}</span>`;

      expandedRowsHtml += `
        <tr>
          <td><strong>${b.name}</strong></td>
          <td>${b.value} ${b.unit}</td>
          <td>${trendHtml}</td>
          <td>${b.normalRange}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    });

    const nodeCard = document.createElement("div");
    nodeCard.className = "timeline-node-card";
    nodeCard.setAttribute("data-expanded", "false");
    
    nodeCard.innerHTML = `
      <div class="timeline-node-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
        <div class="timeline-node-title" style="display: flex; align-items: center; gap: 12px;">
          <h4 style="margin: 0;">${report.fileName}</h4>
          ${badgeHtml}
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="timeline-node-date">${dateFormatted}</div>
          <svg class="chevron-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transition: transform var(--transition-fast);"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      
      <div class="timeline-node-biomarkers" style="margin-top: 12px; cursor: pointer;">
        ${tagsHtml}
        ${report.biomarkers.length > 4 ? `<span style="font-size:0.8rem; color:var(--text-light); margin-top:4px;">+${report.biomarkers.length - 4} more</span>` : ""}
      </div>

      <!-- Expandable details drawer -->
      <div class="timeline-node-details" style="display: none; margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 16px; animation: fadeIn var(--transition-fast);">
        <table class="biomarker-table" style="width:100%; margin-bottom:16px;">
          <thead>
            <tr>
              <th>Biomarker</th>
              <th>Value</th>
              <th>Trend (vs Prev)</th>
              <th>Reference Interval</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${expandedRowsHtml}
          </tbody>
        </table>
        <div style="display:flex; gap:12px; justify-content:flex-end;">
          <button class="btn btn-secondary" style="font-size: 0.85rem; padding: 6px 12px;" onclick="event.stopPropagation(); window.navigateToReportDetails('${report.id}')">
            View Clinical Document Analysis
          </button>
        </div>
      </div>
    `;

    // Click behavior
    const header = nodeCard.querySelector(".timeline-node-header");
    const biomarkersList = nodeCard.querySelector(".timeline-node-biomarkers");
    const details = nodeCard.querySelector(".timeline-node-details");
    const chevron = nodeCard.querySelector(".chevron-icon");

    const toggle = () => {
      const isExpanded = nodeCard.getAttribute("data-expanded") === "true";
      if (isExpanded) {
        details.style.display = "none";
        chevron.style.transform = "rotate(0deg)";
        nodeCard.setAttribute("data-expanded", "false");
      } else {
        details.style.display = "block";
        chevron.style.transform = "rotate(180deg)";
        nodeCard.setAttribute("data-expanded", "true");
      }
    };

    header.addEventListener("click", toggle);
    biomarkersList.addEventListener("click", toggle);

    node.innerHTML = `<div class="timeline-node-dot"></div>`;
    node.appendChild(nodeCard);
    container.appendChild(node);
  });
}

// 5. REPORT DETAILS (Simulated Dual-Pane PDF + Structured Extraction)
function initReportDetails() {
  const tabBiomarkers = document.getElementById("tab-btn-biomarkers");
  const tabExplanation = document.getElementById("tab-btn-explanation");
  const paneBiomarkers = document.getElementById("tab-pane-biomarkers");
  const paneExplanation = document.getElementById("tab-pane-explanation");

  // Tab listeners
  tabBiomarkers.addEventListener("click", () => {
    tabBiomarkers.classList.add("active");
    tabExplanation.classList.remove("active");
    paneBiomarkers.classList.add("active");
    paneExplanation.classList.remove("active");
  });

  tabExplanation.addEventListener("click", () => {
    tabExplanation.classList.add("active");
    tabBiomarkers.classList.remove("active");
    paneExplanation.classList.add("active");
    paneBiomarkers.classList.remove("active");
  });

  // Short-cuts triggers
  document.getElementById("detail-chat-shortcut-btn").addEventListener("click", () => {
    navigateTo("chat");
  });

  document.getElementById("detail-doc-summary-shortcut").addEventListener("click", () => {
    navigateTo("summary");
  });
}

function refreshReportDetails() {
  const reports = appState.reports || [];
  const report = reports.find(r => r.id === selectedReportId) || reports[0];
  
  if (!report) {
    navigateTo("dashboard");
    return;
  }

  // Set titles
  const title = document.getElementById("detail-report-title");
  const subtitle = document.getElementById("detail-report-subtitle");
  const filename = document.getElementById("pdf-viewer-filename");
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(report.date);
  const dateFormatted = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  title.textContent = report.fileName;
  subtitle.textContent = `Analyzed on ${dateFormatted} • Diagnostic Laboratory Report`;
  filename.textContent = report.fileName;

  // Render Simulated PDF Layout (Left side)
  renderSimulatedPDF(report);

  // Render Structured Biomarkers (Right Tab 1)
  const tbody = document.getElementById("detail-biomarkers-tbody");
  tbody.innerHTML = "";
  report.biomarkers.forEach(b => {
    const row = document.createElement("tr");
    if (b.status !== "normal") {
      row.className = "table-row-abnormal";
    }

    const badgeClass = `badge-${b.status}`;
    row.innerHTML = `
      <td><strong>${b.name}</strong></td>
      <td>${b.value} ${b.unit}</td>
      <td>${b.normalRange}</td>
      <td><span class="badge ${badgeClass}">${b.status}</span></td>
    `;
    tbody.appendChild(row);
  });

  // Render AI Explanation (Right Tab 2)
  const explanationDiv = document.getElementById("detail-explanation-card-content");
  explanationDiv.innerHTML = `<p>${report.aiExplanation.split('. ').join('. </p><p>')}</p>`;
}

function renderSimulatedPDF(report) {
  const container = document.getElementById("simulated-pdf-page-container");
  
  const d = new Date(report.date);
  const pdfDate = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

  let rowsHtml = "";
  report.biomarkers.forEach(b => {
    const isAbnormal = b.status !== "normal";
    const valClass = isAbnormal ? "pdf-abnormal-marker" : "";
    
    rowsHtml += `
      <tr>
        <td>${b.name}</td>
        <td class="${valClass}">${b.value}</td>
        <td>${b.unit}</td>
        <td>${b.normalRange}</td>
      </tr>
    `;
  });

  container.innerHTML = `
    <div class="pdf-lab-header">
      <div class="pdf-lab-logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-3px; margin-right:4px; color:#0f52ba;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
        ${report.labName}
      </div>
      <div class="pdf-lab-info">
        Diagnostic Reference Services Division<br>
        100 Laboratory Way, Clinical Park, NJ<br>
        Tel: (555) 019-9230 • Fax: (555) 019-9231
      </div>
    </div>

    <table class="pdf-patient-info-table">
      <tr>
        <td class="label">Patient Name:</td>
        <td>${appState.currentUser ? appState.currentUser.name : "Jane Doe"}</td>
        <td class="label">Accession ID:</td>
        <td>ACC-${report.id.substring(4, 12).toUpperCase()}</td>
      </tr>
      <tr>
        <td class="label">Date Collected:</td>
        <td>${pdfDate}</td>
        <td class="label">Physician:</td>
        <td>Dr. Sarah Lin, MD</td>
      </tr>
      <tr>
        <td class="label">Date Reported:</td>
        <td>${pdfDate}</td>
        <td class="label">MRN:</td>
        <td>MRN-902341-2</td>
      </tr>
    </table>

    <table class="pdf-table">
      <thead>
        <tr>
          <th>Test Description</th>
          <th>Reference Result</th>
          <th>Units</th>
          <th>Reference Interval</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div style="font-size:0.75rem; margin-top:20px; color:#555;">
      <strong>* CLASSIFICATION NOTES:</strong> Flags indicated by red highlighting / asterisk represent values measured outside standard reference ranges. This is a digital laboratory record validation replica.
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 0.7rem; color: #777;">
      <div>Page 1 of 1 • Laboratory Diagnostic Record verification report • Verified by CLI-92310</div>
      <div style="display: flex; gap: 1.5px; opacity: 0.7;">
        <span style="width: 1px; height: 14px; background-color: black; display: inline-block;"></span>
        <span style="width: 3px; height: 14px; background-color: black; display: inline-block;"></span>
        <span style="width: 1px; height: 14px; background-color: black; display: inline-block;"></span>
        <span style="width: 2px; height: 14px; background-color: black; display: inline-block;"></span>
        <span style="width: 1px; height: 14px; background-color: black; display: inline-block;"></span>
        <span style="width: 4px; height: 14px; background-color: black; display: inline-block;"></span>
        <span style="width: 2px; height: 14px; background-color: black; display: inline-block;"></span>
        <span style="width: 3px; height: 14px; background-color: black; display: inline-block;"></span>
      </div>
    </div>
  `;
}

// 6. AI CHAT
function initChat() {
  const form = document.getElementById("chat-input-form");
  const textbox = document.getElementById("chat-user-textbox");
  const sendBtn = document.getElementById("chat-send-btn");
  const clearBtn = document.getElementById("chat-new-conversation-btn");

  // Send message submit
  const triggerSend = () => {
    const text = textbox.value.trim();
    if (!text) return;
    textbox.value = "";
    sendChatMessage(text);
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    triggerSend();
  });
  sendBtn.addEventListener("click", triggerSend);

  // Suggested questions buttons clicks (Sidebar & Central Cards)
  document.querySelectorAll(".suggested-btn, .chat-prompt-card").forEach(btn => {
    btn.addEventListener("click", () => {
      const query = btn.getAttribute("data-query");
      sendChatMessage(query);
    });
  });

  // Clear Chat History (New Conversation)
  clearBtn.addEventListener("click", () => {
    appState.chatHistory = [];
    saveAppState(appState);
    refreshChatWindow();
    showToast("Conversation cleared. Context reset.");
  });
}

function refreshChatWindow() {
  const chatHistory = appState.chatHistory || [];
  const hero = document.getElementById("chat-welcome-hero");
  const wrapper = document.getElementById("chat-bubbles-wrapper");
  const container = document.getElementById("chat-messages-container");

  // If no chat, display welcome hero grid
  if (chatHistory.length === 0) {
    hero.style.display = "block";
    wrapper.style.display = "none";
    wrapper.innerHTML = "";
  } else {
    hero.style.display = "none";
    wrapper.style.display = "flex";
    wrapper.innerHTML = "";

    chatHistory.forEach(msg => {
      appendChatBubbleUI(msg.sender, msg.text, msg.citations);
    });
  }

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

function sendChatMessage(text) {
  // Hide hero, show bubbles wrapper
  const hero = document.getElementById("chat-welcome-hero");
  const wrapper = document.getElementById("chat-bubbles-wrapper");
  const container = document.getElementById("chat-messages-container");

  hero.style.display = "none";
  wrapper.style.display = "flex";

  // 1. Add user message
  const userMsg = {
    sender: "user",
    text,
    timestamp: new Date().toISOString()
  };
  appState.chatHistory.push(userMsg);
  saveAppState(appState);
  
  // Render User bubble
  appendChatBubbleUI("user", text);
  
  // Scroll down
  container.scrollTop = container.scrollHeight;

  // 2. Simulate AI thinking visual (dots)
  const typingBubble = appendChatBubbleUI("ai", `<span class="loading-dots">Thinking...</span>`);
  container.scrollTop = container.scrollHeight;

  // Simulate latency
  setTimeout(() => {
    // Remove typing indicator
    typingBubble.remove();
    
    // Generate AI response
    const aiAnswer = generateAIChatResponse(text, appState.reports);
    
    // Save to history
    const aiMsg = {
      sender: "ai",
      text: aiAnswer.text,
      citations: aiAnswer.citations,
      timestamp: new Date().toISOString()
    };
    appState.chatHistory.push(aiMsg);
    saveAppState(appState);
    
    // Render AI bubble
    appendChatBubbleUI("ai", aiAnswer.text, aiAnswer.citations);
    container.scrollTop = container.scrollHeight;
  }, 1000);
}

function appendChatBubbleUI(sender, text, citations = []) {
  const wrapper = document.getElementById("chat-bubbles-wrapper");
  const container = document.getElementById("chat-messages-container");
  
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble chat-bubble-${sender}`;
  bubble.innerHTML = text;

  // Add citations if present
  if (citations && citations.length > 0) {
    const citationsDiv = document.createElement("div");
    citationsDiv.style.marginTop = "8px";
    citationsDiv.style.borderTop = "1px solid rgba(0,0,0,0.05)";
    citationsDiv.style.paddingTop = "6px";
    
    citations.forEach(cit => {
      const citBadge = document.createElement("span");
      citBadge.className = "citation";
      citBadge.textContent = cit;
      citBadge.addEventListener("click", () => {
        // Find matching report and navigate
        const r = appState.reports.find(rep => rep.fileName === cit);
        if (r) window.navigateToReportDetails(r.id);
      });
      citationsDiv.appendChild(citBadge);
    });
    
    bubble.appendChild(citationsDiv);
  }

  wrapper.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

// 7. DOCTOR SUMMARY
function initDoctorSummary() {
  document.getElementById("print-summary-btn").addEventListener("click", () => {
    window.print();
  });
}

function refreshDoctorSummary() {
  const reports = appState.reports || [];
  const compiledDate = document.getElementById("doc-compiled-date");
  const patientName = document.getElementById("doc-patient-name");
  const reportsCount = document.getElementById("doc-report-count");

  // Meta headers
  const today = new Date();
  compiledDate.textContent = today.toISOString().split('T')[0];
  patientName.textContent = appState.currentUser ? appState.currentUser.name : "Jane Doe";
  reportsCount.textContent = `${reports.length} report${reports.length === 1 ? '' : 's'}`;

  // Section 0: Medical History
  const medHistoryDiv = document.getElementById("doc-medical-history-text");
  if (medHistoryDiv) {
    medHistoryDiv.textContent = appState.currentUser && appState.currentUser.medicalHistory 
      ? appState.currentUser.medicalHistory 
      : "No declared medical conditions. Early indicators of metabolic lipid elevations observed.";
  }

  // Section 1: Recent Reports List
  const recentList = document.getElementById("doc-summary-recent-list");
  recentList.innerHTML = "";
  
  if (reports.length === 0) {
    recentList.innerHTML = "<li>No reports uploaded.</li>";
    document.getElementById("doc-summary-anomalies-tbody").innerHTML = `<tr><td colspan="4" style="text-align:center">No reports uploaded</td></tr>`;
    document.getElementById("doc-summary-trends-list").innerHTML = "<li>No trend analysis available.</li>";
    document.getElementById("doc-summary-questions-container").innerHTML = "";
    return;
  }

  const sorted = [...reports].sort((a,b) => new Date(a.date) - new Date(b.date)); // Oldest to newest
  const latest = sorted[sorted.length - 1];

  sorted.forEach(r => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${r.fileName}</strong> (Collected: ${r.date} • ${r.labName}) — Extracted ${r.biomarkers.length} indicators.`;
    recentList.appendChild(li);
  });

  // Section 2: Abnormal Biomarkers in Latest Panel
  const anomaliesTbody = document.getElementById("doc-summary-anomalies-tbody");
  anomaliesTbody.innerHTML = "";
  const latestAnomalies = latest.biomarkers.filter(b => b.status !== "normal");
  
  if (latestAnomalies.length === 0) {
    anomaliesTbody.innerHTML = `
      <tr>
        <td colspan="4" style="color:var(--success-text); background-color:var(--success-bg); text-align:center; padding:12px">
          All latest measurements are within optimal standard limits.
        </td>
      </tr>
    `;
  } else {
    latestAnomalies.forEach(b => {
      const row = document.createElement("tr");
      row.className = "table-row-abnormal";
      row.innerHTML = `
        <td><strong>${b.name}</strong></td>
        <td>${b.value} ${b.unit}</td>
        <td>${b.normalRange}</td>
        <td><span class="badge badge-${b.status}">${b.status}</span></td>
      `;
      anomaliesTbody.appendChild(row);
    });
  }

  // Section 3: Trends & Clinical Insights
  const trendsList = document.getElementById("doc-summary-trends-list");
  trendsList.innerHTML = "";

  // Dynamic trend computation
  let trendCount = 0;
  
  // LDL Cholesterol trend check
  const ldlHistory = sorted.map(r => r.biomarkers.find(b => b.name === "LDL Cholesterol")).filter(Boolean);
  if (ldlHistory.length > 1) {
    trendCount++;
    const firstVal = ldlHistory[0].value;
    const lastVal = ldlHistory[ldlHistory.length - 1].value;
    const delta = lastVal - firstVal;
    const stateText = delta > 0 ? "elevated progression" : delta < 0 ? "reduction" : "stable status";
    const icon = delta > 0 ? "📈" : "📉";
    trendsList.innerHTML += `<li>${icon} <strong>LDL Cholesterol Trend</strong>: Showed ${stateText} from ${firstVal} mg/dL to ${lastVal} mg/dL (${delta > 0 ? '+' : ''}${delta.toFixed(1)} mg/dL difference).</li>`;
  }

  // HbA1c trend check
  const hba1cHistory = sorted.map(r => r.biomarkers.find(b => b.name === "HbA1c")).filter(Boolean);
  if (hba1cHistory.length > 1) {
    trendCount++;
    const firstVal = hba1cHistory[0].value;
    const lastVal = hba1cHistory[hba1cHistory.length - 1].value;
    const delta = lastVal - firstVal;
    const stateText = delta < 0 ? "favorable reduction" : delta > 0 ? "elevation" : "stable status";
    const icon = delta < 0 ? "📉" : "📈";
    trendsList.innerHTML += `<li>${icon} <strong>HbA1c Trend</strong>: Decreased from ${firstVal}% to ${lastVal}% (${delta.toFixed(2)}% difference), normalizing glucose metrics.</li>`;
  }

  // Vitamin D trend check
  const vitdHistory = sorted.map(r => r.biomarkers.find(b => b.name.includes("Vitamin D"))).filter(Boolean);
  if (vitdHistory.length > 1) {
    trendCount++;
    const first = vitdHistory[0].value;
    const last = vitdHistory[vitdHistory.length - 1].value;
    const icon = last > first ? "📈" : "📉";
    trendsList.innerHTML += `<li>${icon} <strong>Vitamin D Trend</strong>: Corrected from ${first} ng/mL to ${last} ng/mL (current range is optimal/normal).</li>`;
  }

  if (trendCount === 0) {
    trendsList.innerHTML = "<li>Insufficient historical data points to generate trend intervals. Please upload another laboratory panel.</li>";
  }

  // Section 4: Dynamic Physician Questions
  const questionsContainer = document.getElementById("doc-summary-questions-container");
  questionsContainer.innerHTML = "";
  
  const questions = generateDoctorQuestions(reports);
  questions.forEach(q => {
    const qItem = document.createElement("div");
    qItem.className = "doc-question-item";
    qItem.innerHTML = q;
    questionsContainer.appendChild(qItem);
  });
}

// 8. SETTINGS
function initSettings() {
  const profileForm = document.getElementById("settings-profile-form");
  const saveProfileBtn = document.getElementById("settings-save-profile-btn");
  const resetDemoBtn = document.getElementById("settings-reset-demo-btn");
  const clearAllBtn = document.getElementById("settings-clear-all-btn");

  saveProfileBtn.addEventListener("click", () => {
    const name = document.getElementById("settings-name").value.trim();
    const medHistory = document.getElementById("settings-med-history").value.trim();
    if (!name) {
      showToast("Profile name cannot be blank.");
      return;
    }
    
    appState.currentUser.name = name;
    appState.currentUser.medicalHistory = medHistory;
    saveAppState(appState);
    
    // Update navbar displays
    updateNavigationUI();
    showToast("Profile credentials updated successfully.");
  });

  resetDemoBtn.addEventListener("click", () => {
    appState = resetAppStateToDemo();
    updateNavigationUI();
    navigateTo("dashboard");
    showToast("Demo laboratory data restored.");
  });

  clearAllBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete your entire health memory history? This will delete all uploaded files and chats permanently.")) {
      // Clear reports, keep user logged in but remove demo data
      appState.reports = [];
      appState.chatHistory = [];
      saveAppState(appState);
      navigateTo("dashboard");
      showToast("Local health records database wiped.");
    }
  });
}

function refreshSettings() {
  if (appState.currentUser) {
    document.getElementById("settings-name").value = appState.currentUser.name;
    document.getElementById("settings-email").value = appState.currentUser.email;
    document.getElementById("settings-med-history").value = appState.currentUser.medicalHistory || "";
  }
}
