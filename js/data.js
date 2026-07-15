/*
  SUMINO - AI Health Memory Data Layer
  Handles LocalStorage state management, initial high-fidelity demo data,
  and PDF mock parsing algorithms.
*/

const DEMO_REPORTS = [
  {
    id: "rep-2024",
    fileName: "BloodReport_2024.pdf",
    date: "2024-06-15",
    labName: "Metro Diagnostics Laboratory",
    biomarkers: [
      { name: "Vitamin D, 25-OH", value: 14, unit: "ng/mL", normalRange: "30 - 100", status: "low" },
      { name: "HbA1c", value: 5.9, unit: "%", normalRange: "4.0 - 5.6", status: "high" },
      { name: "LDL Cholesterol", value: 118, unit: "mg/dL", normalRange: "0 - 99", status: "high" },
      { name: "HDL Cholesterol", value: 46, unit: "mg/dL", normalRange: "> 40", status: "normal" },
      { name: "TSH (Thyroid)", value: 3.2, unit: "uIU/mL", normalRange: "0.45 - 4.50", status: "normal" }
    ],
    aiExplanation: "Your June 2024 report shows significant Vitamin D deficiency (14 ng/mL) and borderline elevated HbA1c (5.9%) suggesting early glucose intolerance (pre-diabetes). LDL Cholesterol is also elevated at 118 mg/dL. We advise starting daily Vitamin D3 supplementation, adopting a low-glycemic index diet, and scheduling cardiovascular tracking."
  },
  {
    id: "rep-2025",
    fileName: "BloodReport_2025.pdf",
    date: "2025-06-15",
    labName: "Apex Medical Labs",
    biomarkers: [
      { name: "Vitamin D, 25-OH", value: 31, unit: "ng/mL", normalRange: "30 - 100", status: "normal" },
      { name: "HbA1c", value: 5.6, unit: "%", normalRange: "4.0 - 5.6", status: "normal" },
      { name: "LDL Cholesterol", value: 141, unit: "mg/dL", normalRange: "0 - 99", status: "high" },
      { name: "HDL Cholesterol", value: 49, unit: "mg/dL", normalRange: "> 40", status: "normal" },
      { name: "TSH (Thyroid)", value: 2.4, unit: "uIU/mL", normalRange: "0.45 - 4.50", status: "normal" }
    ],
    aiExplanation: "Your June 2025 report demonstrates excellent progress: Vitamin D has successfully normalized to 31 ng/mL, and your HbA1c has normalized to 5.6%. However, your LDL Cholesterol has elevated further to 141 mg/dL. We recommend continuing your maintenance Vitamin D3 regimen, continuing glucose management, and consulting a physician regarding lipid control."
  }
];

const INITIAL_STATE = {
  version: 2, // Version marker for migrations
  currentUser: { email: "demo@sumino.ai", name: "Jane Doe" },
  reports: DEMO_REPORTS,
  chatHistory: [
    { sender: "ai", text: "Hello Jane! I am your SUMINO Health Assistant. I have analyzed your 2 uploaded health reports spanning from 2024 to 2025. You can ask me to compare reports, explain trends, or compile questions for your next doctor's visit.", timestamp: new Date().toISOString() }
  ]
};

// State Helper Functions
export function getAppState() {
  const saved = localStorage.getItem("sumino_app_state");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Auto-migrate if version is older or missing
      if (!parsed.version || parsed.version < 2) {
        console.warn("Outdated SUMINO app state detected, migrating to version 2.");
        localStorage.setItem("sumino_app_state", JSON.stringify(INITIAL_STATE));
        return JSON.parse(JSON.stringify(INITIAL_STATE));
      }
      return parsed;
    } catch (e) {
      console.error("Error parsing SUMINO app state, resetting to initial state", e);
    }
  }
  // Store initial state if none exists
  localStorage.setItem("sumino_app_state", JSON.stringify(INITIAL_STATE));
  return JSON.parse(JSON.stringify(INITIAL_STATE));
}

export function saveAppState(state) {
  localStorage.setItem("sumino_app_state", JSON.stringify(state));
}

export function resetAppStateToDemo() {
  localStorage.setItem("sumino_app_state", JSON.stringify(INITIAL_STATE));
  return JSON.parse(JSON.stringify(INITIAL_STATE));
}

export function clearUserSession() {
  const state = getAppState();
  state.currentUser = null;
  state.chatHistory = [];
  saveAppState(state);
  return state;
}

// Mock AI parser that extracts data from any uploaded file based on the file name/metadata
export function parseUploadedFileMock(fileName, fileSizeBytes) {
  // Generate date based on current local time or randomize slightly
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  
  // Decide lab name based on file size or name
  let labName = "Quest Diagnostics";
  if (fileName.toLowerCase().includes("apex")) labName = "Apex Medical Labs";
  else if (fileName.toLowerCase().includes("hospital")) labName = "General Hospital Lab";
  
  // Seed random factors based on file size or name length to keep it deterministic-ish for the same file
  const seed = (fileSizeBytes % 100) + fileName.length;
  
  // Generate random biomarkers with some logical values
  const randVal = (min, max, dec = 0) => {
    const factor = Math.pow(10, dec);
    const rawVal = min + ((seed * 7 + today.getTime() * 3) % (max - min * 1));
    const val = Math.min(max, Math.max(min, rawVal));
    return Math.round(val * factor) / factor;
  };
  
  // Generate biomarkers
  const biomarkers = [
    {
      name: "Vitamin D, 25-OH",
      value: randVal(10, 40),
      unit: "ng/mL",
      normalRange: "30 - 100"
    },
    {
      name: "HbA1c",
      value: randVal(4.5, 6.5, 1),
      unit: "%",
      normalRange: "4.0 - 5.6"
    },
    {
      name: "LDL Cholesterol",
      value: randVal(80, 160),
      unit: "mg/dL",
      normalRange: "0 - 99"
    },
    {
      name: "HDL Cholesterol",
      value: randVal(35, 70),
      unit: "mg/dL",
      normalRange: "> 40"
    },
    {
      name: "TSH (Thyroid)",
      value: randVal(0.3, 5.2, 2),
      unit: "uIU/mL",
      normalRange: "0.45 - 4.50"
    }
  ];
  
  // Map statuses
  biomarkers.forEach(b => {
    if (b.name === "LDL Cholesterol") {
      b.status = b.value > 99 ? "high" : "normal";
    } else if (b.name === "HDL Cholesterol") {
      b.status = b.value < 40 ? "abnormal" : "normal";
    } else if (b.name === "HbA1c") {
      b.status = b.value > 5.6 ? "high" : "normal";
    } else if (b.name === "Vitamin D, 25-OH") {
      b.status = b.value < 30 ? "low" : "normal";
    } else if (b.name === "TSH (Thyroid)") {
      b.status = b.value < 0.45 ? "low" : b.value > 4.50 ? "high" : "normal";
    }
  });
  
  // Generate customized AI Explanation
  const abnormalMarkers = biomarkers.filter(b => b.status !== "normal").map(b => b.name);
  let explanation = "";
  
  if (abnormalMarkers.length === 0) {
    explanation = `Your report from ${dateStr} at ${labName} looks fantastic! All parameters including HbA1c, thyroid function, Vitamin D, and lipid panel are within standard normal intervals. Maintain your healthy habits.`;
  } else {
    explanation = `Your report from ${dateStr} at ${labName} highlights some areas for review. Specifically, we noted out-of-range metrics in: ${abnormalMarkers.join(", ")}. `;
    
    if (abnormalMarkers.includes("LDL Cholesterol")) {
      explanation += "Your LDL Cholesterol is elevated, which can impact long-term cardiovascular health. Consider reducing saturated fat intake and engaging in aerobic exercise. ";
    }
    if (abnormalMarkers.includes("HbA1c")) {
      explanation += "Your HbA1c is above the optimal range, suggesting early indicators of glucose intolerance. We recommend limiting refined sugars and tracking carb intake. ";
    }
    if (abnormalMarkers.includes("Vitamin D, 25-OH")) {
      explanation += "Your Vitamin D is below the recommended threshold of 30 ng/mL. Consider safe sunshine exposure or regular D3 supplementation. ";
    }
    explanation += "Please consult your healthcare provider to discuss these values in detail and determine an appropriate course of action.";
  }
  
  return {
    id: "rep-" + today.getTime(),
    fileName,
    date: dateStr,
    labName,
    biomarkers,
    aiExplanation: explanation
  };
}
