/*
  SUMINO - AI Health Memory Chart Engine
  Generates interactive SVG line charts for biomarker trends over time.
*/

export function renderTrendChart(containerId, biomarkerName, reports) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear previous contents
  container.innerHTML = "";

  // 1. Extract and sort reports by date
  const sortedReports = [...reports].sort((a, b) => new Date(a.date) - new Date(b.date));

  // 2. Extract data points for target biomarker
  const dataPoints = [];
  sortedReports.forEach(report => {
    const marker = report.biomarkers.find(b => b.name === biomarkerName);
    if (marker) {
      dataPoints.push({
        date: report.date,
        formattedDate: formatDateLabel(report.date),
        value: Number(marker.value),
        unit: marker.unit,
        status: marker.status,
        normalRange: marker.normalRange,
        reportId: report.id
      });
    }
  });

  if (dataPoints.length === 0) {
    container.innerHTML = `
      <div style="height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-light); font-size: 0.95rem;">
        No trend data available for ${biomarkerName}.
      </div>
    `;
    return;
  }

  // Define normal range numbers if possible (e.g. "100 - 200" or "> 40" or "0 - 99")
  let normalMin = null;
  let normalMax = null;
  const rangeStr = dataPoints[0].normalRange;
  if (rangeStr) {
    if (rangeStr.includes("-")) {
      const parts = rangeStr.split("-").map(p => parseFloat(p.trim()));
      normalMin = parts[0];
      normalMax = parts[1];
    } else if (rangeStr.startsWith(">")) {
      normalMin = parseFloat(rangeStr.replace(">", "").trim());
    } else if (rangeStr.startsWith("<")) {
      normalMax = parseFloat(rangeStr.replace("<", "").trim());
    }
  }

  // 3. Set up chart dimensions
  const width = container.clientWidth || 600;
  const height = container.clientHeight || 300;
  const paddingLeft = 55;
  const paddingRight = 30;
  const paddingTop = 40;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // 4. Calculate scales
  const values = dataPoints.map(p => p.value);
  if (normalMin !== null) values.push(normalMin);
  if (normalMax !== null) values.push(normalMax);

  const maxVal = Math.max(...values) * 1.1;
  const minVal = Math.min(...values) * 0.9;
  const valRange = maxVal - minVal || 10;

  // Coordinates mapping functions
  const getX = (index) => {
    if (dataPoints.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (dataPoints.length - 1)) * chartWidth;
  };

  const getY = (val) => {
    return paddingTop + chartHeight - ((val - minVal) / valRange) * chartHeight;
  };

  // 5. Generate SVG markup
  let svgContent = `
    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <defs>
        <!-- Gradient fill for the area under line -->
        <linearGradient id="area-grad-${biomarkerName.replace(/[^a-zA-Z0-9]/g, '')}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.00"/>
        </linearGradient>
        
        <!-- Drop shadow for the main line -->
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="var(--primary)" flood-opacity="0.15"/>
        </filter>
      </defs>
  `;

  // Draw Normal Range Shaded Zone if both limits are present
  if (normalMin !== null && normalMax !== null) {
    const normYMin = getY(normalMin);
    const normYMax = getY(normalMax);
    // normYMax is smaller coordinate (higher on screen) than normYMin
    svgContent += `
      <!-- Reference Range Zone -->
      <rect x="${paddingLeft}" y="${normYMax}" width="${chartWidth}" height="${normYMin - normYMax}" 
            fill="var(--success-bg)" fill-opacity="0.5" />
      <line x1="${paddingLeft}" y1="${normYMax}" x2="${width - paddingRight}" y2="${normYMax}" 
            stroke="var(--success)" stroke-width="1" stroke-dasharray="4 4" stroke-opacity="0.4" />
      <line x1="${paddingLeft}" y1="${normYMin}" x2="${width - paddingRight}" y2="${normYMin}" 
            stroke="var(--success)" stroke-width="1" stroke-dasharray="4 4" stroke-opacity="0.4" />
    `;
  } else if (normalMin !== null) {
    const normYMin = getY(normalMin);
    svgContent += `
      <rect x="${paddingLeft}" y="${paddingTop}" width="${chartWidth}" height="${normYMin - paddingTop}" 
            fill="var(--success-bg)" fill-opacity="0.5" />
      <line x1="${paddingLeft}" y1="${normYMin}" x2="${width - paddingRight}" y2="${normYMin}" 
            stroke="var(--success)" stroke-width="1" stroke-dasharray="4 4" stroke-opacity="0.4" />
    `;
  } else if (normalMax !== null) {
    const normYMax = getY(normalMax);
    svgContent += `
      <rect x="${paddingLeft}" y="${normYMax}" width="${chartWidth}" height="${paddingTop + chartHeight - normYMax}" 
            fill="var(--success-bg)" fill-opacity="0.5" />
      <line x1="${paddingLeft}" y1="${normYMax}" x2="${width - paddingRight}" y2="${normYMax}" 
            stroke="var(--success)" stroke-width="1" stroke-dasharray="4 4" stroke-opacity="0.4" />
    `;
  }

  // Draw Horizontal Gridlines (3 lines)
  const numGridLines = 4;
  for (let i = 0; i < numGridLines; i++) {
    const val = minVal + (i / (numGridLines - 1)) * valRange;
    const y = getY(val);
    svgContent += `
      <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" 
            stroke="var(--border-color)" stroke-width="1" stroke-opacity="0.5" />
      <text x="${paddingLeft - 10}" y="${y + 4}" fill="var(--text-light)" font-size="11" font-weight="500" text-anchor="end">
        ${Math.round(val)}
      </text>
    `;
  }

  // Draw X Axis dates
  dataPoints.forEach((point, index) => {
    const x = getX(index);
    svgContent += `
      <line x1="${x}" y1="${paddingTop + chartHeight}" x2="${x}" y2="${paddingTop + chartHeight + 6}" 
            stroke="var(--border-color)" stroke-width="1.5" />
      <text x="${x}" y="${paddingTop + chartHeight + 22}" fill="var(--text-muted)" font-size="11" font-weight="600" text-anchor="middle">
        ${point.formattedDate}
      </text>
    `;
  });

  // Draw Trend Line and Area (if multiple points)
  if (dataPoints.length > 1) {
    let linePath = `M ${getX(0)} ${getY(dataPoints[0].value)}`;
    let areaPath = `M ${getX(0)} ${paddingTop + chartHeight} L ${getX(0)} ${getY(dataPoints[0].value)}`;

    for (let i = 1; i < dataPoints.length; i++) {
      linePath += ` L ${getX(i)} ${getY(dataPoints[i].value)}`;
      areaPath += ` L ${getX(i)} ${getY(dataPoints[i].value)}`;
    }
    areaPath += ` L ${getX(dataPoints.length - 1)} ${paddingTop + chartHeight} Z`;

    svgContent += `
      <!-- Shaded Area Under Line -->
      <path d="${areaPath}" fill="url(#area-grad-${biomarkerName.replace(/[^a-zA-Z0-9]/g, '')})" />
      
      <!-- Trend Line -->
      <path d="${linePath}" fill="none" stroke="var(--primary)" stroke-width="3" 
            stroke-linecap="round" stroke-linejoin="round" filter="url(#shadow)" />
    `;
  }

  // Draw Interactive Circles for data points
  dataPoints.forEach((point, index) => {
    const x = getX(index);
    const y = getY(point.value);
    const strokeColor = point.status === "normal" ? "var(--success)" : point.status === "borderline" ? "var(--warning)" : "var(--danger)";

    svgContent += `
      <g class="chart-point-group" style="cursor: pointer;" data-report-id="${point.reportId}">
        <!-- Outer hover ring -->
        <circle cx="${x}" cy="${y}" r="9" fill="var(--primary-light)" fill-opacity="0" 
                class="hover-ring" transition="fill-opacity var(--transition-fast)" />
        <!-- White base border -->
        <circle cx="${x}" cy="${y}" r="6.5" fill="white" stroke="${strokeColor}" stroke-width="3" />
        <!-- Core center dot -->
        <circle cx="${x}" cy="${y}" r="2" fill="${strokeColor}" />
      </g>
    `;
  });

  // End SVG
  svgContent += `</svg>`;

  // Render SVG to container
  container.innerHTML = svgContent;

  // Render Overlay Tooltip inside Container
  const tooltip = document.createElement("div");
  tooltip.className = "chart-tooltip";
  tooltip.style.position = "absolute";
  tooltip.style.backgroundColor = "var(--text-main)";
  tooltip.style.color = "white";
  tooltip.style.padding = "10px 14px";
  tooltip.style.borderRadius = "var(--radius-md)";
  tooltip.style.boxShadow = "var(--shadow-lg)";
  tooltip.style.pointerEvents = "none";
  tooltip.style.fontSize = "0.85rem";
  tooltip.style.opacity = "0";
  tooltip.style.transition = "opacity 0.15s ease, transform 0.15s ease";
  tooltip.style.zIndex = "10";
  tooltip.style.width = "max-content";
  container.appendChild(tooltip);

  // Add Hover Behaviors
  const points = container.querySelectorAll(".chart-point-group");
  points.forEach((group, index) => {
    const point = dataPoints[index];
    const hoverRing = group.querySelector(".hover-ring");
    
    group.addEventListener("mouseenter", (e) => {
      if (hoverRing) hoverRing.setAttribute("fill-opacity", "1");
      
      const x = getX(index);
      const y = getY(point.value);
      
      // Update Tooltip details
      const statusBadge = `<span class="badge badge-${point.status}" style="font-size: 0.75rem; padding: 2px 8px; margin-left: 6px;">${point.status}</span>`;
      tooltip.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 2px;">${point.formattedDate}</div>
        <div style="font-size: 1.1rem; font-family: var(--font-heading); font-weight: 700; color: var(--primary-light);">
          ${point.value} <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-light);">${point.unit}</span>
          ${statusBadge}
        </div>
        <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 4px;">Ref range: ${point.normalRange}</div>
      `;
      
      // Positioning tooltip above the circle
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y - 12}px`;
      tooltip.style.transform = "translate(-50%, -100%)";
      tooltip.style.opacity = "1";
    });
    
    group.addEventListener("mouseleave", () => {
      if (hoverRing) hoverRing.setAttribute("fill-opacity", "0");
      tooltip.style.opacity = "0";
    });

    group.addEventListener("click", () => {
      // Trigger navigation to report details
      window.navigateToReportDetails(point.reportId);
    });
  });
}

// Formatting helpers
function formatDateLabel(dateStr) {
  const date = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
