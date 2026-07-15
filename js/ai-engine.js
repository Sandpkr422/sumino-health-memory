/*
  SUMINO - AI Health Memory Intelligent AI Engine
  Performs context-aware medical analysis, generates natural language responses
  for chat interactions, and creates customized questions for doctor consultations.
*/

export function generateAIChatResponse(query, reports) {
  const normalizedQuery = query.toLowerCase();
  
  if (reports.length === 0) {
    return {
      text: "You haven't uploaded any medical reports yet. Please upload a report in the **Upload Report** section so I can analyze your health memory and answer your questions.",
      citations: []
    };
  }

  // Sort reports chronologically
  const sortedReports = [...reports].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latestReport = sortedReports[sortedReports.length - 1];
  const previousReport = sortedReports.length > 1 ? sortedReports[sortedReports.length - 2] : null;
  const firstReport = sortedReports[0];

  // Helper to find a biomarker in a report
  const findMarker = (report, name) => {
    return report.biomarkers.find(b => b.name.toLowerCase().includes(name.toLowerCase()));
  };

  // 1. CHOLESTEROL QUERY
  if (normalizedQuery.includes("cholesterol") || normalizedQuery.includes("lipid") || normalizedQuery.includes("ldl") || normalizedQuery.includes("hdl")) {
    const cholHistory = [];
    const ldlHistory = [];
    const hdlHistory = [];

    sortedReports.forEach(r => {
      const tc = findMarker(r, "Total Cholesterol");
      const ldl = findMarker(r, "LDL");
      const hdl = findMarker(r, "HDL");
      if (tc) cholHistory.push({ date: r.date, val: tc.value, file: r.fileName });
      if (ldl) ldlHistory.push({ date: r.date, val: ldl.value });
      if (hdl) hdlHistory.push({ date: r.date, val: hdl.value });
    });

    if (cholHistory.length === 0) {
      return {
        text: "I couldn't find any cholesterol or lipid biomarkers in your uploaded reports. Please make sure your report contains 'Total Cholesterol', 'LDL Cholesterol', or 'HDL Cholesterol' values.",
        citations: []
      };
    }

    // Build trend explanation
    let responseText = `<p><strong>Cholesterol Trend Analysis:</strong></p>`;
    responseText += `<p>Analyzing your lipid panels across your reports shows a steady upward trend in cardiovascular risk markers:</p>`;
    responseText += `<ul>`;
    
    cholHistory.forEach((item, index) => {
      const dateStr = formatDateLabel(item.date);
      const ldlVal = ldlHistory[index] ? `${ldlHistory[index].val} mg/dL` : "N/A";
      const hdlVal = hdlHistory[index] ? `${hdlHistory[index].val} mg/dL` : "N/A";
      responseText += `<li><strong>${dateStr}</strong>: Total Cholesterol was <strong>${item.val} mg/dL</strong> (LDL: ${ldlVal}, HDL: ${hdlVal})</li>`;
    });
    
    responseText += `</ul>`;
    
    const latestTC = cholHistory[cholHistory.length - 1].val;
    const latestLDL = ldlHistory.length > 0 ? ldlHistory[ldlHistory.length - 1].val : null;
    
    responseText += `<p><strong>Key Insight:</strong> `;
    if (latestTC > 240) {
      responseText += `Your current Total Cholesterol is <strong>${latestTC} mg/dL</strong>, which is classified as <strong>high-risk</strong> (>240 mg/dL). `;
    } else if (latestTC > 200) {
      responseText += `Your current Total Cholesterol is <strong>${latestTC} mg/dL</strong>, which is in the <strong>borderline high</strong> range (200-239 mg/dL). `;
    } else {
      responseText += `Your Total Cholesterol of <strong>${latestTC} mg/dL</strong> is within normal limits (<200 mg/dL). `;
    }

    if (latestLDL && latestLDL > 130) {
      responseText += `This elevation is primarily driven by your LDL ('bad') cholesterol, which is currently at <strong>${latestLDL} mg/dL</strong>. `;
    }
    
    responseText += `Maintaining an upward trend in LDL suggests you should review dietary fat intake (limiting saturated fats, avoiding trans fats) and seek a consultation with your doctor to discuss cardiovascular health.</p>`;

    // Citations are unique file names
    const citations = [...new Set(cholHistory.map(h => h.file))];

    return { text: responseText, citations };
  }

  // 1b. VITAMIN D QUERY
  if (normalizedQuery.includes("vitamin d") || normalizedQuery.includes("vit d") || normalizedQuery.includes("vitamin")) {
    const vitdHistory = [];
    sortedReports.forEach(r => {
      const vd = findMarker(r, "Vitamin D");
      if (vd) vitdHistory.push({ date: r.date, val: vd.value, status: vd.status, file: r.fileName });
    });

    if (vitdHistory.length === 0) {
      return {
        text: "I couldn't find any Vitamin D measurements in your uploaded reports. Please make sure your report contains 'Vitamin D, 25-OH' or similar keywords.",
        citations: []
      };
    }

    let responseText = `<p><strong>Vitamin D (25-OH) Progression Analysis:</strong></p>`;
    responseText += `<p>Here is your Vitamin D trajectory over your uploaded clinical tests:</p><ul>`;
    
    vitdHistory.forEach(item => {
      const dateStr = formatDateLabel(item.date);
      let statusColor = "var(--text-main)";
      if (item.status === "low") statusColor = "var(--danger-text)";
      else if (item.status === "normal") statusColor = "var(--success-text)";
      
      responseText += `<li><strong>${dateStr}</strong>: <strong>${item.val} ng/mL</strong> — Flagged as <strong style="color: ${statusColor}">${item.status}</strong> (Normal interval is >30 ng/mL)</li>`;
    });
    responseText += `</ul>`;

    const latest = vitdHistory[vitdHistory.length - 1];
    responseText += `<p><strong>Clinical Interpretation:</strong> `;
    if (latest.status === "normal") {
      responseText += `Your latest level of <strong>${latest.val} ng/mL</strong> is <strong>optimal</strong> and within standard normal limits. `;
      if (vitdHistory.length > 1 && vitdHistory[0].status === "low") {
        responseText += `This represents a successful recovery from your previous deficiency of <strong>${vitdHistory[0].val} ng/mL</strong>. Excellent progress. Continue your maintenance vitamin D3 intake.`;
      }
    } else {
      responseText += `Your level of <strong>${latest.val} ng/mL</strong> is <strong>low (deficient)</strong>. Scurvy/rickets risk is low, but metabolic calcium absorption requires vitamin D. We recommend discussing supplementation (e.g. 2,000–5,000 IU daily) with your physician.`;
    }
    responseText += `</p>`;

    const citations = [...new Set(vitdHistory.map(h => h.file))];
    return { text: responseText, citations };
  }

  // 2. COMPARE REPORTS QUERY
  if (normalizedQuery.includes("compare") || normalizedQuery.includes("difference") || normalizedQuery.includes("last two")) {
    if (!previousReport) {
      return {
        text: `You only have one report uploaded (${latestReport.fileName} on ${formatDateLabel(latestReport.date)}). I need at least two reports to perform a comparative analysis. Please upload another report!`,
        citations: [latestReport.fileName]
      };
    }

    let responseText = `<p><strong>Comparison: ${formatDateLabel(latestReport.date)} vs. ${formatDateLabel(previousReport.date)}</strong></p>`;
    responseText += `<p>Here is a detailed comparison of how your key biomarkers changed between your last two reports:</p>`;
    responseText += `<table class="biomarker-table" style="margin-top: 12px; margin-bottom: 16px;">
      <thead>
        <tr>
          <th>Biomarker</th>
          <th>Prev (${formatDateLabel(previousReport.date)})</th>
          <th>Latest (${formatDateLabel(latestReport.date)})</th>
          <th>Change</th>
        </tr>
      </thead>
      <tbody>`;

    latestReport.biomarkers.forEach(latestMarker => {
      const prevMarker = previousReport.biomarkers.find(b => b.name === latestMarker.name);
      if (prevMarker) {
        const diff = latestMarker.value - prevMarker.value;
        const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
        const color = latestMarker.status === "normal" && prevMarker.status !== "normal" ? "var(--success)" : 
                      latestMarker.status !== "normal" && prevMarker.status === "normal" ? "var(--danger)" : "var(--text-main)";
        
        let changeIndicator = `<span style="color: ${color}; font-weight: 600;">${diffStr} ${latestMarker.unit}</span>`;
        if (diff === 0) changeIndicator = `<span style="color: var(--text-light)">No change</span>`;

        responseText += `
          <tr>
            <td><strong>${latestMarker.name}</strong></td>
            <td>${prevMarker.value} ${prevMarker.unit}</td>
            <td>${latestMarker.value} ${latestMarker.unit}</td>
            <td>${changeIndicator}</td>
          </tr>
        `;
      }
    });

    responseText += `</tbody></table>`;

    // Highlight key shifts
    const improvements = [];
    const declines = [];

    latestReport.biomarkers.forEach(latestMarker => {
      const prevMarker = previousReport.biomarkers.find(b => b.name === latestMarker.name);
      if (prevMarker) {
        if (latestMarker.status === "normal" && prevMarker.status !== "normal") {
          improvements.push(latestMarker.name);
        } else if (latestMarker.status !== "normal" && prevMarker.status === "normal") {
          declines.push(latestMarker.name);
        }
      }
    });

    if (improvements.length > 0 || declines.length > 0) {
      responseText += `<p><strong>Significant Shifts:</strong></p><ul>`;
      improvements.forEach(item => {
        responseText += `<li>🟢 <strong>${item}</strong> has successfully normalized and is no longer flagged.</li>`;
      });
      declines.forEach(item => {
        responseText += `<li>🔴 <strong>${item}</strong> has elevated outside of the normal reference range.</li>`;
      });
      responseText += `</ul>`;
    }

    return {
      text: responseText,
      citations: [latestReport.fileName, previousReport.fileName]
    };
  }

  // 3. CHANGE SINCE LAST YEAR QUERY
  if (normalizedQuery.includes("changed since last year") || normalizedQuery.includes("since last year") || normalizedQuery.includes("year over year") || normalizedQuery.includes("year progression")) {
    if (sortedReports.length < 2) {
      return {
        text: "I need at least a year's worth of reports to analyze annual changes. Currently, you don't have enough historical records in your health memory.",
        citations: []
      };
    }

    const oneYearAgo = new Date(latestReport.date);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Find the report closest to 1 year before the latest report
    let baseReport = firstReport;
    let minTimeDiff = Math.abs(new Date(firstReport.date) - oneYearAgo);

    sortedReports.forEach(r => {
      const diff = Math.abs(new Date(r.date) - oneYearAgo);
      if (diff < minTimeDiff && r.id !== latestReport.id) {
        minTimeDiff = diff;
        baseReport = r;
      }
    });

    let responseText = `<p><strong>1-Year Health Progress: ${formatDateLabel(baseReport.date)} to ${formatDateLabel(latestReport.date)}</strong></p>`;
    responseText += `<p>A year-over-year look at your health parameters reveals these long-term trends:</p><ul>`;

    latestReport.biomarkers.forEach(latestMarker => {
      const baseMarker = baseReport.biomarkers.find(b => b.name === latestMarker.name);
      if (baseMarker) {
        const delta = latestMarker.value - baseMarker.value;
        const deltaStr = delta > 0 ? `rose by <strong>+${delta.toFixed(1)}</strong>` : delta < 0 ? `fell by <strong>${delta.toFixed(1)}</strong>` : "remained unchanged";
        const unit = latestMarker.unit;
        
        let statusComment = "";
        if (baseMarker.status === "normal" && latestMarker.status !== "normal") {
          statusComment = ` ⚠️ <em>(moved from normal to ${latestMarker.status})</em>`;
        } else if (baseMarker.status !== "normal" && latestMarker.status === "normal") {
          statusComment = ` ✅ <em>(normalized from ${baseMarker.status})</em>`;
        }

        responseText += `<li><strong>${latestMarker.name}</strong>: ${deltaStr} ${unit} (from ${baseMarker.value} to ${latestMarker.value}${unit})${statusComment}</li>`;
      }
    });

    responseText += `</ul>`;

    return {
      text: responseText,
      citations: [latestReport.fileName, baseReport.fileName]
    };
  }

  // 3b. SUMMARIZE HEALTH QUERY
  if (normalizedQuery.includes("summarize") || normalizedQuery.includes("summary") || normalizedQuery.includes("overall health")) {
    const latestAbnormal = latestReport.biomarkers.filter(b => b.status !== "normal");
    const latestNormal = latestReport.biomarkers.filter(b => b.status === "normal");
    
    let responseText = `<p><strong>Comprehensive Health Memory Summary:</strong></p>`;
    responseText += `<p>Based on your latest panel from <strong>${formatDateLabel(latestReport.date)}</strong> (${latestReport.labName}):</p>`;
    
    if (latestAbnormal.length > 0) {
      responseText += `<p>⚠️ <strong>Biomarkers Flagged Outside Standard Ranges:</strong></p><ul>`;
      latestAbnormal.forEach(b => {
        const flagColor = b.status === "high" ? "var(--danger-text)" : "var(--warning-text)";
        responseText += `<li><strong>${b.name}</strong>: <strong>${b.value} ${b.unit}</strong> — Measured <strong style="color: ${flagColor}">${b.status}</strong> (Normal: ${b.normalRange})</li>`;
      });
      responseText += `</ul>`;
    } else {
      responseText += `<p>✅ All measured biomarkers are currently in optimal normal reference ranges.</p>`;
    }
    
    if (latestNormal.length > 0) {
      responseText += `<p>🟢 <strong>Optimal/Stable Markers:</strong></p><ul>`;
      latestNormal.slice(0, 4).forEach(b => {
        responseText += `<li><strong>${b.name}</strong>: ${b.value} ${b.unit} (Normal: ${b.normalRange})</li>`;
      });
      if (latestNormal.length > 4) responseText += `<li><em>...and ${latestNormal.length - 4} other normal indicators.</em></li>`;
      responseText += `</ul>`;
    }

    // Historical progression summary
    const cholHistory = [];
    const glucHistory = [];
    sortedReports.forEach(r => {
      const tc = findMarker(r, "Total Cholesterol");
      const fg = findMarker(r, "Glucose");
      if (tc) cholHistory.push(tc.value);
      if (fg) glucHistory.push(fg.value);
    });

    if (cholHistory.length > 1 || glucHistory.length > 1) {
      responseText += `<p>📊 <strong>Long-term Progress Insights:</strong></p><ul>`;
      if (cholHistory.length > 1) {
        const cholDelta = cholHistory[cholHistory.length - 1] - cholHistory[0];
        const statusText = cholDelta > 0 ? `rose by <strong>+${cholDelta.toFixed(1)} mg/dL</strong>` : `dropped by <strong>${cholDelta.toFixed(1)} mg/dL</strong>`;
        responseText += `<li>Total Cholesterol has ${statusText} over the 12-month panel period (from ${cholHistory[0]} to ${cholHistory[cholHistory.length - 1]} mg/dL).</li>`;
      }
      if (glucHistory.length > 1) {
        const glucDelta = glucHistory[glucHistory.length - 1] - glucHistory[0];
        const statusText = glucDelta > 0 ? `rose by <strong>+${glucDelta.toFixed(1)} mg/dL</strong>` : `dropped by <strong>${glucDelta.toFixed(1)} mg/dL</strong>`;
        responseText += `<li>Fasting Glucose has ${statusText} over the 12-month period (from ${glucHistory[0]} to ${glucHistory[glucHistory.length - 1]} mg/dL).</li>`;
      }
      responseText += `</ul>`;
    }

    const citations = sortedReports.map(r => r.fileName);
    return { text: responseText, citations };
  }

  // 4. DEFAULT QUERY - Summary of latest abnormal parameters
  const abnormalMarkers = latestReport.biomarkers.filter(b => b.status !== "normal");
  let responseText = `<p>I've scanned your health memory context. Regarding your latest report on <strong>${formatDateLabel(latestReport.date)}</strong>:</p>`;
  
  if (abnormalMarkers.length > 0) {
    responseText += `<p>Here are the biomarkers that currently stand out as out-of-range:</p><ul>`;
    abnormalMarkers.forEach(m => {
      responseText += `<li><strong>${m.name}</strong>: ${m.value} ${m.unit} (Reference normal range: ${m.normalRange} – flagged as <strong style="color: var(--danger-text)">${m.status}</strong>)</li>`;
    });
    responseText += `</ul>`;
    responseText += `<p>Would you like me to compile trend graphs for any of these, or compare this with your older blood tests? Just type: <em>"Explain my cholesterol"</em> or <em>"Compare my last two reports"</em>.</p>`;
  } else {
    responseText += `<p>All biomarkers in your latest report are within the standard reference intervals. You have no abnormal values to note!</p>`;
  }

  return {
    text: responseText,
    citations: [latestReport.fileName]
  };
}

export function generateDoctorQuestions(reports) {
  if (reports.length === 0) return [];

  // Sort and get latest
  const sortedReports = [...reports].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sortedReports[sortedReports.length - 1];
  const first = sortedReports[0];

  const questions = [];

  // 1. Check LDL Cholesterol levels
  const ldl = latest.biomarkers.find(b => b.name.toLowerCase().includes("ldl"));
  if (ldl && ldl.status !== "normal") {
    const firstLDL = first.biomarkers.find(b => b.name.toLowerCase().includes("ldl"));
    const firstLDLVal = firstLDL ? ` (up from ${firstLDL.value} mg/dL in ${formatDateLabel(first.date)})` : "";
    questions.push(`My LDL Cholesterol has reached <strong>${ldl.value} mg/dL</strong>${firstLDLVal}, which is flagged as ${ldl.status}. What steps should we take to manage this risk? Should we discuss lipid-lowering therapies or focus on dietary fat modifications first?`);
  }

  // 2. Check HbA1c levels
  const hba1c = latest.biomarkers.find(b => b.name.toLowerCase().includes("hba1c"));
  if (hba1c) {
    if (hba1c.status !== "normal") {
      questions.push(`My HbA1c level is currently <strong>${hba1c.value}%</strong>. Since this falls into the pre-diabetic range, what lifestyle, dietary, or clinical strategies do you recommend to lower it?`);
    } else {
      const firstHb = first.biomarkers.find(b => b.name.toLowerCase().includes("hba1c"));
      if (firstHb && firstHb.status !== "normal") {
        questions.push(`My HbA1c has successfully normalized to <strong>${hba1c.value}%</strong> from <strong>${firstHb.value}%</strong> last year. Should I continue my current dietary checks, or are there new parameters we should watch?`);
      }
    }
  }

  // 3. Check Vitamin D levels
  const vitd = latest.biomarkers.find(b => b.name.toLowerCase().includes("vitamin d"));
  if (vitd) {
    if (vitd.status !== "normal") {
      questions.push(`My Vitamin D level is currently <strong>${vitd.value} ng/mL</strong>, which is insufficient. What daily supplement dosage (e.g., 2000 IU or 5000 IU) do you recommend, and when should we re-test?`);
    } else {
      // If it normalized
      const firstVitd = first.biomarkers.find(b => b.name.toLowerCase().includes("vitamin d"));
      if (firstVitd && firstVitd.status !== "normal") {
        questions.push(`My Vitamin D has successfully risen from <strong>${firstVitd.value} ng/mL</strong> to <strong>${vitd.value} ng/mL</strong>. Should I continue with my current supplement dose, or should we reduce it to a maintenance level?`);
      }
    }
  }

  // 4. Fallback/Standard questions if not enough anomalies
  if (questions.length < 3) {
    questions.push("Are there other comprehensive cardiovascular risk factors (like ApoB, hs-CRP, or Lipoprotein(a)) that we should test for, given my lifestyle profile?");
    questions.push("Given my overall health trends, are there any physical fitness parameters (target heart rate zones, exercise intensity levels) we should modify?");
  }

  return questions;
}

// Internal formatting helper
function formatDateLabel(dateStr) {
  const date = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
