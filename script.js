document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============================================================
  // THEME TOGGLE
  // ============================================================
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const root = document.documentElement;

  function applyTheme(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      if (btnThemeToggle) {
        btnThemeToggle.textContent = '☀️';
        btnThemeToggle.setAttribute('aria-label', 'Switch to dark theme');
      }
    } else {
      root.removeAttribute('data-theme');
      if (btnThemeToggle) {
        btnThemeToggle.textContent = '🌙';
        btnThemeToggle.setAttribute('aria-label', 'Switch to light theme');
      }
    }
  }

  let currentTheme = 'dark';
  try {
    currentTheme = localStorage.getItem('it_dashboard_theme') || 'dark';
  } catch (err) { /* ignore */ }
  applyTheme(currentTheme);

  btnThemeToggle?.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    try { localStorage.setItem('it_dashboard_theme', currentTheme); } catch (err) { /* ignore */ }
  });

  // ============================================================
  // PROJECT INFO PANEL TOGGLE (About / What's New / Limitations)
  // ============================================================
  const btnProjectInfo = document.getElementById('btn-project-info');
  const projectInfoPanel = document.getElementById('project-info-panel');
  btnProjectInfo?.addEventListener('click', () => {
    if (!projectInfoPanel) return;
    const isHidden = projectInfoPanel.classList.toggle('hidden');
    btnProjectInfo.setAttribute('aria-expanded', String(!isHidden));
  });

  // ============================================================
  // FAKE STATUS STRIP
  // ============================================================
  const statusLatencyEl = document.getElementById('status-latency');
  function refreshLatency() {
    if (!statusLatencyEl) return;
    const ms = 10 + Math.floor(Math.random() * 18);
    statusLatencyEl.textContent = `Latency: ${ms}ms`;
  }
  refreshLatency();
  setInterval(refreshLatency, 4000);

  // ============================================================
  // GENERIC ARIA TAB WIRING
  // ============================================================
  function activateTab(row, tabId) {
    const buttons = Array.from(row.querySelectorAll('.tab-btn'));
    buttons.forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.tabIndex = isActive ? 0 : -1;
      const panel = document.getElementById(btn.dataset.tab);
      if (panel) {
        panel.classList.toggle('active', isActive);
        if (isActive) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', '');
      }
    });
  }

  function switchToTab(tabId) {
    const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (!btn) return;
    const row = btn.closest('.tab-row');
    if (row) activateTab(row, tabId);
  }

  document.querySelectorAll('.tab-row').forEach(row => {
    row.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => activateTab(row, btn.dataset.tab));
    });
  });

  // ============================================================
  // STATS BAR (persisted counters + quiz average)
  // ============================================================
  function readStats() {
    try {
      const raw = localStorage.getItem('it_dashboard_stats');
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        diagnostics: Number(parsed.diagnostics) || 0,
        triaged: Number(parsed.triaged) || 0,
        provisioned: Number(parsed.provisioned) || 0,
        alerts: Number(parsed.alerts) || 0,
      };
    } catch (err) {
      return { diagnostics: 0, triaged: 0, provisioned: 0, alerts: 0 };
    }
  }

  function writeStats(stats) {
    try { localStorage.setItem('it_dashboard_stats', JSON.stringify(stats)); } catch (err) { /* ignore */ }
  }

  function bumpStat(key) {
    const stats = readStats();
    stats[key] = (stats[key] || 0) + 1;
    writeStats(stats);
    renderStats();
  }

  function renderStats() {
    const stats = readStats();
    const map = {
      'stat-diagnostics': stats.diagnostics,
      'stat-triaged': stats.triaged,
      'stat-provisioned': stats.provisioned,
      'stat-alerts': stats.alerts,
    };
    Object.entries(map).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
    renderQuizStat();
  }

  function readQuizScores() {
    try {
      const raw = localStorage.getItem('it_dashboard_quiz_scores');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function saveQuizScore(percent) {
    const scores = readQuizScores();
    scores.unshift(percent);
    if (scores.length > 10) scores.pop();
    try { localStorage.setItem('it_dashboard_quiz_scores', JSON.stringify(scores)); } catch (err) { /* ignore */ }
    renderQuizStat();
  }

  function renderQuizStat() {
    const el = document.getElementById('stat-quiz-score');
    if (!el) return;
    const scores = readQuizScores();
    if (scores.length === 0) {
      el.textContent = '—';
      return;
    }
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    el.textContent = `${avg}%`;
  }

  renderStats();

  // ============================================================
  // ACTIVITY LOG (rich entries & click navigation)
  // ============================================================
  function readLogs() {
    try {
      const raw = localStorage.getItem('it_dashboard_logs_v2');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function logActivity(type, label, payload) {
    const logs = readLogs();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    logs.unshift({ timestamp, type, label, payload: payload || null });
    if (logs.length > 6) logs.pop();
    try { localStorage.setItem('it_dashboard_logs_v2', JSON.stringify(logs)); } catch (err) { /* ignore */ }
    renderActivityLog();
  }

  function renderActivityLog() {
    const listEl = document.getElementById('activity-list');
    if (!listEl) return;
    listEl.replaceChildren();

    const logs = readLogs();
    if (logs.length === 0) {
      const emptyLi = document.createElement('li');
      const span = document.createElement('span');
      span.className = 'activity-empty';
      span.textContent = 'No recent operations recorded.';
      emptyLi.appendChild(span);
      listEl.appendChild(emptyLi);
      return;
    }

    logs.forEach(entry => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'activity-item';
      btn.textContent = `[${entry.timestamp}] ${entry.label}`;
      btn.dataset.type = entry.type;
      if (entry.payload) btn.dataset.payload = JSON.stringify(entry.payload);
      li.appendChild(btn);
      listEl.appendChild(li);
    });
  }

  const sectionForLogType = {
    diagnostic: 'section-network',
    subnet: 'section-network',
    raid: 'section-network',
    triage: 'section-triage',
    provision: 'section-identity',
    firewall: 'section-security',
    quiz: 'section-quiz',
  };

  const tabForLogType = {
    diagnostic: 'tab-ping',
    subnet: 'tab-subnet',
    raid: 'tab-raid',
    quiz: 'tab-quiz',
  };

  document.getElementById('activity-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.activity-item');
    if (!btn) return;

    const type = btn.dataset.type;
    let payload = null;
    try {
      payload = btn.dataset.payload ? JSON.parse(btn.dataset.payload) : null;
    } catch (err) { /* ignore */ }

    if (tabForLogType[type]) switchToTab(tabForLogType[type]);

    if (payload) {
      if (type === 'diagnostic') {
        if (payload.target && document.getElementById('net_target')) document.getElementById('net_target').value = payload.target;
        if (payload.cmd && document.getElementById('net_cmd')) document.getElementById('net_cmd').value = payload.cmd;
        document.getElementById('net_target')?.focus();
      } else if (type === 'subnet') {
        if (payload.ip && document.getElementById('subnet_ip')) document.getElementById('subnet_ip').value = payload.ip;
        if (payload.cidr && document.getElementById('subnet_cidr')) document.getElementById('subnet_cidr').value = payload.cidr;
        document.getElementById('subnet_ip')?.focus();
      } else if (type === 'raid') {
        if (payload.size && document.getElementById('raid_drive_size')) document.getElementById('raid_drive_size').value = payload.size;
        if (payload.count && document.getElementById('raid_drive_count')) document.getElementById('raid_drive_count').value = payload.count;
        if (payload.level && document.getElementById('raid_level')) document.getElementById('raid_level').value = payload.level;
        document.getElementById('raid_drive_size')?.focus();
      } else if (type === 'triage') {
        if (payload.text && document.getElementById('t_input')) document.getElementById('t_input').value = payload.text;
        document.getElementById('t_input')?.focus();
      } else if (type === 'provision') {
        if (payload.name && document.getElementById('u_name')) document.getElementById('u_name').value = payload.name;
        if (payload.platform && document.getElementById('prov_platform')) document.getElementById('prov_platform').value = payload.platform;
        document.getElementById('u_name')?.focus();
      }
    } else if (type === 'firewall') {
      document.getElementById('btn-logs')?.focus();
    }

    const targetSection = sectionForLogType[type];
    if (targetSection) {
      document.getElementById(targetSection)?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center'
      });
    }
  });

  document.getElementById('btn-clear-log')?.addEventListener('click', () => {
    localStorage.removeItem('it_dashboard_logs_v2');
    renderActivityLog();
  });

  // ============================================================
  // SHARED HELPERS
  // ============================================================
  function flashCard(cardId) {
    const card = document.getElementById(cardId);
    if (!card || prefersReducedMotion) return;
    card.classList.remove('card--flash');
    void card.offsetWidth;
    card.classList.add('card--flash');
  }

  function stampUpdated(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    el.textContent = `Last run: ${time}`;
    el.classList.remove('hidden');
  }

  function hideHint(elementId) {
    document.getElementById(elementId)?.classList.add('hidden');
  }

  function withLoadingDelay(button, action, delayMs = 500) {
    if (!button || button.disabled) return;
    button.disabled = true;

    const label = button.querySelector('.btn-label');
    const originalText = label ? label.textContent : button.textContent;

    const spinner = document.createElement('span');
    spinner.className = 'btn-spinner';
    spinner.setAttribute('aria-hidden', 'true');

    if (label) {
      label.textContent = 'Running…';
      button.insertBefore(spinner, label);
    } else {
      button.textContent = 'Running…';
    }

    const runDelay = prefersReducedMotion ? 0 : delayMs;

    setTimeout(() => {
      action();
      button.disabled = false;
      spinner.remove();
      if (label) label.textContent = originalText;
      else button.textContent = originalText;
    }, runDelay);
  }

  function onEnter(inputEl, handler) {
    inputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handler();
      }
    });
  }

  const activeTypingTimers = new Map();

  function typeOutput(elementId, tagText, bodyText, statusElementId, speed = 15) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (activeTypingTimers.has(elementId)) {
      clearInterval(activeTypingTimers.get(elementId));
      activeTypingTimers.delete(elementId);
    }

    el.style.display = 'block';
    el.replaceChildren();

    const tag = document.createElement('span');
    tag.className = 'output-tag';
    tag.textContent = tagText;
    el.appendChild(tag);

    const textNode = document.createTextNode('');
    el.appendChild(textNode);

    const statusEl = statusElementId ? document.getElementById(statusElementId) : null;

    if (prefersReducedMotion) {
      textNode.nodeValue = bodyText;
      if (statusEl) statusEl.textContent = `${tagText}. ${bodyText}`;
      return;
    }

    let i = 0;
    const timer = setInterval(() => {
      if (i < bodyText.length) {
        textNode.nodeValue += bodyText.charAt(i);
        i++;
      } else {
        clearInterval(timer);
        activeTypingTimers.delete(elementId);
        if (statusEl) statusEl.textContent = `${tagText}. ${bodyText}`;
      }
    }, speed);

    activeTypingTimers.set(elementId, timer);
  }

  function setInstantOutput(elementId, tagText, bodyText) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.style.display = 'block';
    el.replaceChildren();
    const tag = document.createElement('span');
    tag.className = 'output-tag';
    tag.textContent = tagText;
    el.append(tag, document.createTextNode(bodyText));
  }

  // ============================================================
  // NETWORK DIAGNOSTIC SIMULATOR
  // ============================================================
  const btnDiagnostics = document.getElementById('btn-diagnostics');
  const netTargetInput = document.getElementById('net_target');

  function runDiagnostic() {
    const targetInput = netTargetInput ? netTargetInput.value.trim() : '';
    const cmd = document.getElementById('net_cmd')?.value || 'ping';

    if (!targetInput) {
      alert('Please enter a target domain or IP address.');
      netTargetInput?.focus();
      return;
    }

    withLoadingDelay(btnDiagnostics, () => {
      let outputString = '';
      // Occasionally simulate a failed/timed-out request so this isn't
      // always a guaranteed happy-path result — closer to real practice.
      const simulateTimeout = Math.random() < 0.18;

      if (simulateTimeout) {
        outputString = cmd === "ping"
          ? `Pinging ${targetInput} with 32 bytes of data:\n` +
            `Request timed out.\n` +
            `Request timed out.\n` +
            `Request timed out.\n\n` +
            `Ping statistics for ${targetInput}:\n` +
            `    Packets: Sent = 3, Received = 0, Lost = 3 (100% loss)`
          : `Tracing route to ${targetInput} over a maximum of 30 hops:\n` +
            `  1    <1 ms    <1 ms    <1 ms  192.168.1.1 (local gateway)\n` +
            `  2     *        *        *     Request timed out.\n` +
            `  3     *        *        *     Request timed out.\n` +
            `Trace incomplete — destination unreachable.`;
      } else if (cmd === "ping") {
        outputString =
          `Pinging ${targetInput} with 32 bytes of data:\n` +
          `Reply from ${targetInput}: bytes=32 time=14ms TTL=54\n` +
          `Reply from ${targetInput}: bytes=32 time=12ms TTL=54\n` +
          `Reply from ${targetInput}: bytes=32 time=15ms TTL=54\n\n` +
          `Ping statistics for ${targetInput}:\n` +
          `    Packets: Sent = 3, Received = 3, Lost = 0 (0% loss),\n` +
          `Approximate round trip times in milli-seconds:\n` +
          `    Minimum = 12ms, Maximum = 15ms, Average = 13ms`;
      } else {
        outputString =
          `Tracing route to ${targetInput} over a maximum of 30 hops:\n` +
          `  1    <1 ms    <1 ms    <1 ms  192.168.1.1 (local gateway)\n` +
          `  2     4 ms     2 ms     3 ms  10.0.0.1 (ISP border node)\n` +
          `  3    12 ms    11 ms    14 ms  ${targetInput} (destination reached)`;
      }

      typeOutput('net_out', simulateTimeout ? 'SIMULATED OUTPUT — connection failure' : 'SIMULATED OUTPUT — not a real network request', outputString);
      stampUpdated('net_last_updated');
      flashCard('section-network');
      bumpStat('diagnostics');
      logActivity('diagnostic', `Executed ${cmd.toUpperCase()} diagnostic for target: ${targetInput}${simulateTimeout ? ' (timed out)' : ''}`, { target: targetInput, cmd });
    });
  }

  btnDiagnostics?.addEventListener('click', runDiagnostic);
  onEnter(netTargetInput, runDiagnostic);

  // ============================================================
  // SUBNET CALCULATOR (real IPv4 math)
  // ============================================================
  function ipToInt(ip) {
    const parts = ip.trim().split('.').map(Number);
    if (parts.length !== 4 || parts.some(p => !Number.isInteger(p) || p < 0 || p > 255)) return null;
    return ((parts[0] * 16777216) + (parts[1] * 65536) + (parts[2] * 256) + parts[3]) >>> 0;
  }

  function intToIp(int) {
    return [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join('.');
  }

  function cidrToMaskInt(cidr) {
    return cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
  }

  const btnCalcSubnet = document.getElementById('btn-calc-subnet');
  const subnetIpInput = document.getElementById('subnet_ip');

  function runSubnetCalc() {
    const ipStr = subnetIpInput ? subnetIpInput.value.trim() : '';
    const cidr = parseInt(document.getElementById('subnet_cidr')?.value || '24', 10);
    const ipInt = ipToInt(ipStr);

    if (ipInt === null) {
      alert('Please enter a valid IPv4 address (e.g., 192.168.1.50).');
      subnetIpInput?.focus();
      return;
    }

    withLoadingDelay(btnCalcSubnet, () => {
      const maskInt = cidrToMaskInt(cidr);
      const networkInt = (ipInt & maskInt) >>> 0;
      const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;
      const totalAddresses = Math.pow(2, 32 - cidr);
      const usableCount = cidr >= 31 ? 0 : totalAddresses - 2;
      const firstUsable = cidr >= 31 ? networkInt : networkInt + 1;
      const lastUsable = cidr >= 31 ? broadcastInt : broadcastInt - 1;

      const result =
        `Input: ${ipStr}/${cidr}\n` +
        `Subnet Mask: ${intToIp(maskInt)}\n` +
        `Network Address: ${intToIp(networkInt)}\n` +
        `Broadcast Address: ${intToIp(broadcastInt)}\n` +
        `Usable Host Range: ${intToIp(firstUsable)} - ${intToIp(lastUsable)}\n` +
        `Usable Host Count: ${usableCount.toLocaleString()}\n` +
        `Total Addresses in Block: ${totalAddresses.toLocaleString()}`;

      setInstantOutput('subnet_out', 'SUBNET CALCULATION', result);
      stampUpdated('subnet_last_updated');
      flashCard('section-network');
      logActivity('subnet', `Calculated subnet for ${ipStr}/${cidr}`, { ip: ipStr, cidr: String(cidr) });
    });
  }

  btnCalcSubnet?.addEventListener('click', runSubnetCalc);
  onEnter(subnetIpInput, runSubnetCalc);

  // ============================================================
  // RAID CALCULATOR (real capacity/tolerance math)
  // ============================================================
  const btnCalcRaid = document.getElementById('btn-calc-raid');

  function runRaidCalc() {
    const size = parseFloat(document.getElementById('raid_drive_size')?.value || '0');
    const count = parseInt(document.getElementById('raid_drive_count')?.value || '0', 10);
    const level = document.getElementById('raid_level')?.value || '0';

    if (!size || size <= 0 || !count || count < 2) {
      alert('Please enter a valid drive size and at least 2 drives.');
      return;
    }

    withLoadingDelay(btnCalcRaid, () => {
      let usable = 0;
      let tolerance = '';
      let error = '';

      if (level === '0') {
        usable = size * count;
        tolerance = 'None — any single drive failure causes total data loss.';
      } else if (level === '1') {
        if (count < 2) {
          error = 'RAID 1 requires at least 2 drives.';
        } else {
          usable = size;
          tolerance = 'Survives failure of any drive as long as one mirror remains. Extra drives beyond a mirrored pair add no usable capacity in basic RAID 1.';
        }
      } else if (level === '5') {
        if (count < 3) {
          error = 'RAID 5 requires at least 3 drives.';
        } else {
          usable = size * (count - 1);
          tolerance = 'Survives failure of exactly 1 drive.';
        }
      } else if (level === '10') {
        if (count < 4 || count % 2 !== 0) {
          error = 'RAID 10 requires an even number of drives, 4 or more.';
        } else {
          usable = size * (count / 2);
          tolerance = `Survives failure of up to 1 drive per mirrored pair (up to ${count / 2} total, as long as both drives in the same pair don't fail).`;
        }
      }

      let result;
      if (error) {
        result = `Configuration Error: ${error}`;
      } else {
        const rawCapacity = size * count;
        const levelLabel = level === '0' ? 'RAID 0' : level === '1' ? 'RAID 1' : level === '5' ? 'RAID 5' : 'RAID 10';
        result =
          `RAID Level: ${levelLabel}\n` +
          `Drives: ${count} x ${size} GB\n` +
          `Raw Capacity: ${rawCapacity.toLocaleString()} GB\n` +
          `Usable Capacity: ${usable.toLocaleString()} GB\n` +
          `Fault Tolerance: ${tolerance}`;
      }

      setInstantOutput('raid_out', error ? 'INVALID CONFIGURATION' : 'RAID CALCULATION', result);
      stampUpdated('raid_last_updated');
      flashCard('section-network');
      if (!error) {
        logActivity('raid', `Calculated RAID ${level} array (${count} x ${size}GB)`, { size: String(size), count: String(count), level });
      }
    });
  }

  btnCalcRaid?.addEventListener('click', runRaidCalc);

  // ============================================================
  // HTTP STATUS CODE LOOKUP (searchable)
  // ============================================================
  const httpCodes = [
    { code: '200', category: '2xx Success', meaning: 'OK', tip: 'Request succeeded — no action needed.' },
    { code: '201', category: '2xx Success', meaning: 'Created', tip: 'A new resource was successfully created (common after a POST).' },
    { code: '204', category: '2xx Success', meaning: 'No Content', tip: 'Request succeeded but there is nothing to return in the body.' },
    { code: '301', category: '3xx Redirection', meaning: 'Moved Permanently', tip: 'Resource has a new permanent URL — update bookmarks/links.' },
    { code: '302', category: '3xx Redirection', meaning: 'Found (Temporary Redirect)', tip: 'Resource temporarily lives at a different URL.' },
    { code: '304', category: '3xx Redirection', meaning: 'Not Modified', tip: 'Cached version is still valid — no need to re-download.' },
    { code: '400', category: '4xx Client Error', meaning: 'Bad Request', tip: 'The request was malformed — check syntax, headers, or payload.' },
    { code: '401', category: '4xx Client Error', meaning: 'Unauthorized', tip: 'Authentication is missing or invalid — check credentials/token.' },
    { code: '403', category: '4xx Client Error', meaning: 'Forbidden', tip: 'Authenticated, but not permitted — check permissions/ACLs.' },
    { code: '404', category: '4xx Client Error', meaning: 'Not Found', tip: 'Resource doesn\u2019t exist at this URL — check for typos or a moved/removed page.' },
    { code: '405', category: '4xx Client Error', meaning: 'Method Not Allowed', tip: 'The HTTP method (GET/POST/etc.) isn\u2019t supported for this endpoint.' },
    { code: '408', category: '4xx Client Error', meaning: 'Request Timeout', tip: 'The client took too long to send the request — check client-side network conditions.' },
    { code: '409', category: '4xx Client Error', meaning: 'Conflict', tip: 'Request conflicts with the current state of the resource (e.g. edit conflict).' },
    { code: '429', category: '4xx Client Error', meaning: 'Too Many Requests', tip: 'Rate limit hit — back off and retry after a delay.' },
    { code: '500', category: '5xx Server Error', meaning: 'Internal Server Error', tip: 'Generic server-side failure — check server logs for the real cause.' },
    { code: '502', category: '5xx Server Error', meaning: 'Bad Gateway', tip: 'An upstream/proxy server got an invalid response — check the backend service.' },
    { code: '503', category: '5xx Server Error', meaning: 'Service Unavailable', tip: 'Server is overloaded or down for maintenance — usually temporary.' },
    { code: '504', category: '5xx Server Error', meaning: 'Gateway Timeout', tip: 'An upstream/proxy server didn\u2019t respond in time — check backend latency.' },
  ];

  const httpSearchInput = document.getElementById('http_search');
  const httpListEl = document.getElementById('http_list');
  const httpResultCountEl = document.getElementById('http_result_count');

  function renderHttpList(filter = '') {
    if (!httpListEl) return;
    const q = filter.toLowerCase().trim();
    const results = httpCodes.filter(c =>
      !q || c.code.includes(q) || c.meaning.toLowerCase().includes(q) || c.tip.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );

    if (httpResultCountEl) httpResultCountEl.textContent = `${results.length} of ${httpCodes.length} codes`;
    httpListEl.replaceChildren();

    if (results.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'output-hint';
      empty.textContent = 'No matching codes.';
      httpListEl.appendChild(empty);
      return;
    }

    results.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cli-command-item';

      const nameLine = document.createElement('div');
      const nameSpan = document.createElement('span');
      nameSpan.className = 'cli-command-name';
      nameSpan.textContent = `${item.code} ${item.meaning}`;
      const catSpan = document.createElement('span');
      catSpan.className = 'cli-command-os';
      catSpan.textContent = item.category;
      nameLine.append(nameSpan, catSpan);

      const descDiv = document.createElement('div');
      descDiv.className = 'cli-command-desc';
      descDiv.textContent = item.tip;

      div.append(nameLine, descDiv);
      httpListEl.appendChild(div);
    });
  }

  httpSearchInput?.addEventListener('input', (e) => renderHttpList(e.target.value));
  renderHttpList();

  // ============================================================
  // PASSWORD STRENGTH & ENTROPY ANALYZER
  // ============================================================
  // Intentionally does not log, save, or export anything typed here —
  // no logActivity call, no localStorage write. Analysis happens purely
  // in memory and disappears when the field changes.
  const pwInput = document.getElementById('pw_input');
  const pwOut = document.getElementById('pw_out');

  function formatCrackTime(seconds) {
    if (seconds < 1) return 'instantly';
    const units = [
      ['centuries', 100 * 365.25 * 24 * 3600],
      ['years', 365.25 * 24 * 3600],
      ['days', 24 * 3600],
      ['hours', 3600],
      ['minutes', 60],
      ['seconds', 1],
    ];
    for (const [label, unitSeconds] of units) {
      if (seconds >= unitSeconds) {
        const value = seconds / unitSeconds;
        const rounded = value >= 100 ? Math.round(value).toLocaleString() : value.toFixed(1);
        return `${rounded} ${label}`;
      }
    }
    return 'instantly';
  }

  function analyzePassword(pw) {
    if (!pw) {
      if (pwOut) pwOut.style.display = 'none';
      return;
    }

    let charsetSize = 0;
    if (/[a-z]/.test(pw)) charsetSize += 26;
    if (/[A-Z]/.test(pw)) charsetSize += 26;
    if (/[0-9]/.test(pw)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) charsetSize += 32;
    if (charsetSize === 0) charsetSize = 1;

    const entropyBits = pw.length * Math.log2(charsetSize);

    // Assumes a fast offline attack (~10 billion guesses/sec) and an
    // average-case crack at half the keyspace — a common rough estimate,
    // not a precise security guarantee.
    const guessesPerSecond = 1e10;
    const crackSeconds = Math.pow(2, entropyBits) / (2 * guessesPerSecond);

    let label, colorVar;
    if (entropyBits < 28) { label = 'Very Weak'; colorVar = 'var(--red)'; }
    else if (entropyBits < 36) { label = 'Weak'; colorVar = '#f97316'; }
    else if (entropyBits < 60) { label = 'Fair'; colorVar = '#fbbf24'; }
    else if (entropyBits < 128) { label = 'Strong'; colorVar = 'var(--green)'; }
    else { label = 'Very Strong'; colorVar = 'var(--green)'; }

    const fillPct = Math.max(4, Math.min(100, Math.round((entropyBits / 128) * 100)));

    if (!pwOut) return;
    pwOut.style.display = 'block';
    pwOut.replaceChildren();

    const tag = document.createElement('span');
    tag.className = 'output-tag';
    tag.textContent = 'PASSWORD ANALYSIS — nothing saved or sent anywhere';
    pwOut.appendChild(tag);

    const meter = document.createElement('div');
    meter.className = 'pw-meter';
    const fill = document.createElement('div');
    fill.className = 'pw-meter-fill';
    fill.style.width = fillPct + '%';
    fill.style.backgroundColor = colorVar;
    meter.appendChild(fill);
    pwOut.appendChild(meter);

    const summary = document.createElement('div');
    summary.textContent =
      `Strength: ${label}\n` +
      `Length: ${pw.length} characters\n` +
      `Estimated entropy: ${entropyBits.toFixed(1)} bits\n` +
      `Rough offline crack time: ${formatCrackTime(crackSeconds)}\n\n` +
      `Length matters more than complexity for real-world security — NIST guidance favors longer passphrases over short, complex passwords.`;
    summary.style.whiteSpace = 'pre-wrap';
    pwOut.appendChild(summary);
  }

  pwInput?.addEventListener('input', (e) => analyzePassword(e.target.value));

  // ============================================================
  // PHISHING EMAIL HEADER ANALYZER (real regex-based parsing)
  // ============================================================
  const btnAnalyzeHeaders = document.getElementById('btn-analyze-headers');
  const btnLoadSampleHeaders = document.getElementById('btn-load-sample-headers');
  const phishInput = document.getElementById('phish_input');

  const sampleHeaders =
`Delivered-To: alex@example-corp.local
Received: by mail.example-corp.local with SMTP id abc123; Tue, 26 Aug 2025 09:14:02 -0700
Received: from mail-relay-04.suspicious-mailer.net (mail-relay-04.suspicious-mailer.net. [203.0.113.77])
        by mx.example-corp.local with ESMTPS id xyz789; Tue, 26 Aug 2025 09:13:58 -0700
Received: from [10.0.0.5] (unverified [198.51.100.22])
        by mail-relay-04.suspicious-mailer.net with ESMTP; Tue, 26 Aug 2025 09:13:41 -0700
Authentication-Results: mx.example-corp.local;
        spf=fail (sender IP is 198.51.100.22) smtp.mailfrom=security-alert.co;
        dkim=fail (signature did not verify) header.d=security-alert.co;
        dmarc=fail action=quarantine header.from=paypal.com
From: "PayPal Security" <alerts@security-alert.co>
Reply-To: recovery-support@security-alert.co
Return-Path: <bounce@security-alert.co>
Subject: Urgent: Your account will be suspended in 24 hours
To: alex@example-corp.local`;

  btnLoadSampleHeaders?.addEventListener('click', () => {
    if (phishInput) phishInput.value = sampleHeaders;
    phishInput?.focus();
  });

  function extractDomain(headerBlock, headerName) {
    const re = new RegExp(`^${headerName}:.*$`, 'im');
    const line = headerBlock.match(re);
    if (!line) return null;
    const emailMatch = line[0].match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return emailMatch ? emailMatch[1].toLowerCase() : null;
  }

  function extractAuthResult(headerBlock, mechanism) {
    const re = new RegExp(`${mechanism}=(\\w+)`, 'i');
    const match = headerBlock.match(re);
    return match ? match[1].toLowerCase() : null;
  }

  function runAnalyzeHeaders() {
    const raw = phishInput ? phishInput.value : '';
    if (!raw.trim()) {
      alert('Paste raw email headers first, or click "Load Sample Headers" to try it out.');
      phishInput?.focus();
      return;
    }

    withLoadingDelay(btnAnalyzeHeaders, () => {
      // Pull every IPv4 address out of Received: lines specifically,
      // since that's where the actual routing hops live.
      const receivedLines = raw.match(/^Received:.*(?:\n[ \t].*)*$/gim) || [];
      const ipRe = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
      const allIps = [];
      receivedLines.forEach(line => {
        const found = line.match(ipRe);
        if (found) allIps.push(...found);
      });
      const uniqueIps = [...new Set(allIps)];
      // The last Received: line is typically the earliest hop — closest
      // to the true origin, though headers can still be forged.
      const likelyOriginIp = uniqueIps.length ? uniqueIps[uniqueIps.length - 1] : null;

      const spf = extractAuthResult(raw, 'spf');
      const dkim = extractAuthResult(raw, 'dkim');
      const dmarc = extractAuthResult(raw, 'dmarc');

      const fromDomain = extractDomain(raw, 'From');
      const returnPathDomain = extractDomain(raw, 'Return-Path');
      const replyToDomain = extractDomain(raw, 'Reply-To');

      const domainMismatch = fromDomain && returnPathDomain && fromDomain !== returnPathDomain;
      const replyToMismatch = fromDomain && replyToDomain && fromDomain !== replyToDomain;

      const failures = [];
      if (spf === 'fail') failures.push('SPF failed');
      if (dkim === 'fail') failures.push('DKIM failed');
      if (dmarc === 'fail') failures.push('DMARC failed');
      if (domainMismatch) failures.push('From: and Return-Path: domains don\u2019t match');
      if (replyToMismatch) failures.push('Reply-To: domain differs from From: domain');

      const verdict = failures.length > 0
        ? `SUSPICIOUS \u2014 ${failures.length} warning sign${failures.length === 1 ? '' : 's'} found`
        : 'No red flags found in the headers checked';

      const lines = [];
      lines.push(`Verdict: ${verdict}`);
      lines.push('');
      lines.push(`SPF: ${spf ? spf.toUpperCase() : 'not found'}`);
      lines.push(`DKIM: ${dkim ? dkim.toUpperCase() : 'not found'}`);
      lines.push(`DMARC: ${dmarc ? dmarc.toUpperCase() : 'not found'}`);
      lines.push('');
      lines.push(`From: domain: ${fromDomain || 'not found'}`);
      lines.push(`Return-Path: domain: ${returnPathDomain || 'not found'}${domainMismatch ? '  \u26A0 mismatch' : ''}`);
      lines.push(`Reply-To: domain: ${replyToDomain || 'not found'}${replyToMismatch ? '  \u26A0 mismatch' : ''}`);
      lines.push('');
      lines.push(`Likely originating IP: ${likelyOriginIp || 'not found'}`);
      if (uniqueIps.length > 1) {
        lines.push(`All IPs seen in Received headers: ${uniqueIps.join(', ')}`);
      }

      const outEl = document.getElementById('phish_out');
      if (outEl) {
        outEl.style.display = 'block';
        outEl.replaceChildren();
        const tag = document.createElement('span');
        tag.className = 'output-tag';
        tag.textContent = failures.length > 0 ? 'ANALYSIS \u2014 warning signs detected' : 'ANALYSIS \u2014 real header parsing';
        const body = document.createElement('div');
        body.style.whiteSpace = 'pre-wrap';
        body.textContent = lines.join('\n');
        outEl.append(tag, body);
      }

      stampUpdated('phish_last_updated');
      flashCard('section-phishing');
      logActivity('phishing', `Analyzed email headers \u2014 ${verdict}`, null);
    });
  }

  btnAnalyzeHeaders?.addEventListener('click', runAnalyzeHeaders);

  // ============================================================
  // COMPTIA A+ FLASHCARDS
  // ============================================================
  const studyDataset = [
    { category: "Ports", front: "Port 22", back: "SSH (Secure Shell)", desc: "Encrypted remote terminal console connections" },
    { category: "Ports", front: "Port 23", back: "Telnet", desc: "Unencrypted text remote connections (insecure)" },
    { category: "Ports", front: "Port 25", back: "SMTP", desc: "Sending email between mail servers" },
    { category: "Ports", front: "Port 53", back: "DNS", desc: "Converts hostnames into numeric IP addresses" },
    { category: "Ports", front: "Port 80", back: "HTTP", desc: "Standard unencrypted web browser traffic" },
    { category: "Ports", front: "Port 110", back: "POP3", desc: "Retrieves email, downloads and removes from server" },
    { category: "Ports", front: "Port 143", back: "IMAP", desc: "Retrieves email, keeps it synced on the server" },
    { category: "Ports", front: "Port 443", back: "HTTPS", desc: "Encrypted secure web communication" },
    { category: "Ports", front: "Port 3306", back: "MySQL", desc: "Default port for MySQL database connections" },
    { category: "Ports", front: "Port 3389", back: "RDP", desc: "Microsoft Windows graphical remote desktop control" },
    { category: "Cabling", front: "RJ-45", back: "Ethernet Connector", desc: "8-pin connector used for Cat5e/Cat6 network cabling" },
    { category: "Cabling", front: "RJ-11", back: "Telephone Connector", desc: "4 or 6-pin connector used for phone/DSL lines" },
    { category: "Cabling", front: "Cat 6", back: "Twisted-Pair Cable", desc: "Supports up to 10 Gbps at short distances, common in modern LANs" },
    { category: "Cabling", front: "SC / LC", back: "Fiber Connectors", desc: "Common fiber-optic connector types — SC is push-pull, LC is a smaller form factor" },
    { category: "Cabling", front: "SATA", back: "Storage Cable", desc: "Connects hard drives and SSDs to the motherboard" },
    { category: "Cabling", front: "USB-C", back: "Universal Connector", desc: "Reversible connector supporting data, video, and power delivery" },
    { category: "RAID", front: "RAID 0", back: "Striping", desc: "Improves performance by splitting data across disks — no redundancy" },
    { category: "RAID", front: "RAID 1", back: "Mirroring", desc: "Duplicates data across two disks for redundancy — no performance gain" },
    { category: "RAID", front: "RAID 5", back: "Striping with Parity", desc: "Requires 3+ disks; can survive one disk failure" },
    { category: "RAID", front: "RAID 10", back: "Mirrored Stripes", desc: "Combines RAID 1 and 0 — high performance and redundancy, needs 4+ disks" },
    { category: "Troubleshooting", front: "Step 1", back: "Identify the Problem", desc: "Gather information, question the user, identify symptoms" },
    { category: "Troubleshooting", front: "Step 2", back: "Establish a Theory", desc: "Consider the most probable cause of the issue" },
    { category: "Troubleshooting", front: "Step 3", back: "Test the Theory", desc: "Confirm the theory or escalate/re-theorize if it's wrong" },
    { category: "Troubleshooting", front: "Step 4", back: "Establish a Plan of Action", desc: "Plan the fix and any needed downtime, then implement it" },
    { category: "Troubleshooting", front: "Step 5", back: "Verify Full Functionality", desc: "Confirm the fix works and implement preventive measures" },
    { category: "Troubleshooting", front: "Step 6", back: "Document Findings", desc: "Record the issue, cause, and resolution for future reference" },
    { category: "IPv4", front: "Class A", back: "1.0.0.0 – 126.255.255.255", desc: "Default subnet mask 255.0.0.0 — huge networks" },
    { category: "IPv4", front: "Class B", back: "128.0.0.0 – 191.255.255.255", desc: "Default subnet mask 255.255.0.0 — medium networks" },
    { category: "IPv4", front: "Class C", back: "192.0.0.0 – 223.255.255.255", desc: "Default subnet mask 255.255.255.0 — small networks" },
    { category: "IPv4", front: "APIPA", back: "169.254.0.0 – 169.254.255.255", desc: "Self-assigned when a DHCP server can't be reached" },
    { category: "OSI", front: "Layer 1", back: "Physical", desc: "Cabling, connectors, signals, and hardware transmission" },
    { category: "OSI", front: "Layer 2", back: "Data Link", desc: "MAC addresses, switches, frames" },
    { category: "OSI", front: "Layer 3", back: "Network", desc: "IP addresses, routers, packets" },
    { category: "OSI", front: "Layer 4", back: "Transport", desc: "TCP/UDP, segments, reliable delivery" },
    { category: "OSI", front: "Layer 7", back: "Application", desc: "The layer end-user software interacts with (HTTP, FTP, etc.)" },
  ];

  let activeCategory = 'all';
  let filteredCards = studyDataset;
  let currentCardIndex = 0;
  let isFlipped = false;

  const cardElement = document.getElementById('flashcard');
  const cardCategoryTag = document.getElementById('card-category-tag');
  const cardLabel = document.getElementById('card-label');
  const cardContent = document.getElementById('card-content');
  const cardProgress = document.getElementById('card-progress');
  const btnNextCard = document.getElementById('btn-next-card');
  const categorySelect = document.getElementById('flashcard-category');

  if (cardElement) cardElement.setAttribute('aria-live', 'polite');

  function applyCategoryFilter() {
    filteredCards = activeCategory === 'all' ? studyDataset : studyDataset.filter(c => c.category === activeCategory);
    currentCardIndex = 0;
    isFlipped = false;
    renderCard();
  }

  function renderCard() {
    const card = filteredCards[currentCardIndex];
    if (!card) return;

    cardContent.replaceChildren();
    if (cardCategoryTag) cardCategoryTag.textContent = card.category;
    if (cardProgress) cardProgress.textContent = `Card ${currentCardIndex + 1} of ${filteredCards.length}`;

    if (isFlipped) {
      cardElement.style.backgroundColor = "var(--blue)";
      cardLabel.textContent = "Answer";
      cardElement.setAttribute('aria-pressed', 'true');
      const mainText = document.createTextNode(card.back);
      const descSpan = document.createElement('span');
      descSpan.className = 'desc';
      descSpan.textContent = card.desc;
      cardContent.append(mainText, descSpan);
    } else {
      cardElement.style.backgroundColor = "var(--output-bg-inset)";
      cardLabel.textContent = "Prompt";
      cardElement.setAttribute('aria-pressed', 'false');
      cardContent.textContent = card.front;
    }
  }

  function flipCard() {
    isFlipped = !isFlipped;
    renderCard();
  }

  cardElement?.addEventListener('click', flipCard);
  cardElement?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flipCard();
    }
  });

  btnNextCard?.addEventListener('click', () => {
    isFlipped = false;
    currentCardIndex = Math.floor(Math.random() * filteredCards.length);
    renderCard();
  });

  categorySelect?.addEventListener('change', (e) => {
    activeCategory = e.target.value;
    applyCategoryFilter();
  });

  applyCategoryFilter();

  // ============================================================
  // OSI MODEL INTERACTIVE DIAGRAM
  // ============================================================
  const osiLayers = [
    { num: 7, name: 'Application', desc: 'The layer end-user software interacts with directly — web browsers, email clients. Protocols: HTTP, HTTPS, FTP, SMTP, DNS.' },
    { num: 6, name: 'Presentation', desc: 'Formats, encrypts, and compresses data so the Application layer can use it — handles things like SSL/TLS encryption and character encoding.' },
    { num: 5, name: 'Session', desc: 'Opens, manages, and closes the connection ("session") between two devices for as long as the exchange takes.' },
    { num: 4, name: 'Transport', desc: 'Breaks data into segments and ensures reliable delivery. TCP (reliable, ordered) and UDP (fast, no guarantee) both live here.' },
    { num: 3, name: 'Network', desc: 'Handles logical addressing and routing — this is where IP addresses and routers operate, deciding the best path across networks.' },
    { num: 2, name: 'Data Link', desc: 'Handles physical addressing within a local network using MAC addresses — this is where switches operate, forwarding frames.' },
    { num: 1, name: 'Physical', desc: 'The actual hardware: cables, connectors, radio signals, voltages. The literal 1s and 0s moving as electrical or light pulses.' },
  ];

  const osiDiagramEl = document.getElementById('osi-diagram');
  const osiDetailEl = document.getElementById('osi-detail');

  function renderOsiDiagram() {
    if (!osiDiagramEl) return;
    osiDiagramEl.replaceChildren();

    osiLayers.forEach(layer => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'osi-layer-btn';
      btn.id = `osi-btn-${layer.num}`;

      const numSpan = document.createElement('span');
      numSpan.className = 'osi-layer-num';
      numSpan.textContent = `L${layer.num}`;

      btn.append(numSpan, document.createTextNode(layer.name));
      btn.addEventListener('click', () => showOsiLayer(layer));
      osiDiagramEl.appendChild(btn);
    });
  }

  function showOsiLayer(layer) {
    document.querySelectorAll('.osi-layer-btn').forEach(b => {
      b.classList.toggle('active', b.id === `osi-btn-${layer.num}`);
    });

    if (!osiDetailEl) return;
    osiDetailEl.classList.remove('hidden');
    osiDetailEl.replaceChildren();
    const tag = document.createElement('span');
    tag.className = 'output-tag';
    tag.textContent = `LAYER ${layer.num} — ${layer.name.toUpperCase()}`;
    const body = document.createElement('div');
    body.textContent = layer.desc;
    osiDetailEl.append(tag, body);
  }

  renderOsiDiagram();

  // ============================================================
  // QUIZ ENGINE
  // ============================================================
  const quizBank = [
    { q: "Which port does HTTPS use by default?", options: ["Port 80", "Port 443", "Port 22", "Port 3389"], correct: 1, explanation: "HTTPS (encrypted web traffic) uses port 443 by default." },
    { q: "What is the primary weakness of RAID 0?", options: ["Slower read speeds", "No redundancy — any drive failure loses all data", "Requires 4+ drives", "Uses parity, wasting space"], correct: 1, explanation: "RAID 0 stripes data for performance with zero redundancy." },
    { q: "In the CompTIA troubleshooting methodology, what comes immediately after 'Test the Theory'?", options: ["Identify the Problem", "Document Findings", "Establish a Plan of Action", "Verify Full Functionality"], correct: 2, explanation: "Once the theory is confirmed, the next step is establishing a plan of action to resolve it." },
    { q: "Which OSI layer do switches primarily operate at?", options: ["Layer 1 (Physical)", "Layer 2 (Data Link)", "Layer 3 (Network)", "Layer 4 (Transport)"], correct: 1, explanation: "Switches forward frames based on MAC addresses at Layer 2." },
    { q: "What connector type is commonly used for wired Ethernet connections?", options: ["RJ-11", "SATA", "RJ-45", "SC"], correct: 2, explanation: "RJ-45 is the standard 8-pin connector for Ethernet cabling." },
    { q: "Which RAID level requires a minimum of 3 drives?", options: ["RAID 0", "RAID 1", "RAID 5", "RAID 10"], correct: 2, explanation: "RAID 5 needs at least 3 drives to stripe data with parity." },
    { q: "What port does DNS use?", options: ["Port 25", "Port 53", "Port 110", "Port 443"], correct: 1, explanation: "DNS resolution requests are handled on port 53." },
    { q: "Which IPv4 class range does 172.16.0.5 fall into?", options: ["Class A", "Class B", "Class C", "APIPA"], correct: 1, explanation: "Class B covers 128.0.0.0 – 191.255.255.255, which includes 172.16.0.5." },
    { q: "An address in the 169.254.x.x range usually means:", options: ["A static IP was manually set", "The device successfully reached a DHCP server", "The device could not reach a DHCP server (APIPA)", "The device is using IPv6"], correct: 2, explanation: "APIPA (169.254.0.0/16) is self-assigned when DHCP is unreachable." },
    { q: "What is the main advantage of RAID 10 over RAID 5?", options: ["Cheaper — needs fewer drives", "Better performance and can tolerate more drive failures in some cases", "No redundancy needed", "Works with only 2 drives"], correct: 1, explanation: "RAID 10 combines striping and mirroring for strong performance and fault tolerance, at the cost of needing more drives." },
    { q: "Which protocol retrieves email but keeps it synced on the server across devices?", options: ["POP3", "IMAP", "SMTP", "FTP"], correct: 1, explanation: "IMAP keeps mail on the server and syncs across multiple devices, unlike POP3 which typically downloads and removes it." },
    { q: "What is the first step in the CompTIA troubleshooting methodology?", options: ["Establish a theory of probable cause", "Document findings", "Identify the problem", "Test the theory"], correct: 2, explanation: "Troubleshooting always starts with identifying the problem through information gathering." },
    { q: "Which OSI layer is responsible for routing based on IP addresses?", options: ["Layer 2 (Data Link)", "Layer 3 (Network)", "Layer 4 (Transport)", "Layer 7 (Application)"], correct: 1, explanation: "Layer 3 (Network) handles logical addressing and routing." },
    { q: "Which cable type is best suited for long-distance, high-bandwidth backbone connections?", options: ["Cat 6 copper", "RJ-11", "Fiber optic (SC/LC)", "USB-C"], correct: 2, explanation: "Fiber optic cabling supports much longer distances and higher bandwidth than copper." },
    { q: "What port does RDP (Remote Desktop Protocol) use by default?", options: ["Port 22", "Port 443", "Port 3306", "Port 3389"], correct: 3, explanation: "RDP defaults to port 3389 for Windows remote desktop connections." },
    { q: "For a /28 subnet, how many usable host addresses are available?", options: ["6", "14", "30", "62"], correct: 1, explanation: "A /28 gives 2^4 = 16 total addresses, minus 2 (network + broadcast) = 14 usable hosts." },
    { q: "What does RAID 1 provide that RAID 0 does not?", options: ["Increased read/write speed", "Data redundancy through mirroring", "Larger total capacity", "Lower cost per GB"], correct: 1, explanation: "RAID 1 mirrors data across drives for redundancy, at the cost of usable capacity." },
    { q: "Which command-line tool is used on Windows to force a Group Policy refresh?", options: ["ipconfig /flushdns", "gpupdate /force", "sfc /scannow", "chkdsk /f"], correct: 1, explanation: "gpupdate /force immediately reapplies Group Policy settings." },
  ];

  // Accessible pattern: native <fieldset>/<legend>/radio inputs, all 5
  // questions visible at once, answered together and graded on submit.
  // This gets keyboard nav and screen-reader semantics for free, no
  // custom ARIA wiring needed on the options themselves.
  let currentQuiz = [];
  let userAnswers = {};

  const quizQuestionsEl = document.getElementById('quiz-questions');
  const quizResultsEl = document.getElementById('quiz-results');
  const btnSubmitQuiz = document.getElementById('btn-submit-quiz');
  const btnResetQuiz = document.getElementById('btn-reset-quiz');

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function initQuiz() {
    if (!quizQuestionsEl) return;

    currentQuiz = shuffleArray(quizBank).slice(0, 5);
    userAnswers = {};
    if (quizResultsEl) quizResultsEl.textContent = '';
    if (btnSubmitQuiz) {
      btnSubmitQuiz.disabled = false;
      btnSubmitQuiz.classList.remove('hidden');
    }

    quizQuestionsEl.replaceChildren();

    currentQuiz.forEach((q, idx) => {
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'quiz-card';

      const legend = document.createElement('legend');
      legend.textContent = `Question ${idx + 1}: ${q.q}`;
      fieldset.appendChild(legend);

      q.options.forEach((optionText, oIdx) => {
        const label = document.createElement('label');
        label.className = 'quiz-option';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `quiz-q-${idx}`;
        radio.value = String(oIdx);
        radio.addEventListener('change', () => { userAnswers[idx] = oIdx; });

        label.append(radio, document.createTextNode(` ${optionText}`));
        fieldset.appendChild(label);
      });

      const feedbackDiv = document.createElement('div');
      feedbackDiv.id = `quiz-feedback-${idx}`;
      feedbackDiv.className = 'quiz-feedback hidden';
      fieldset.appendChild(feedbackDiv);

      quizQuestionsEl.appendChild(fieldset);
    });
  }

  function gradeQuiz() {
    if (!currentQuiz.length) return;

    if (Object.keys(userAnswers).length < currentQuiz.length) {
      alert('Please answer all 5 questions before submitting.');
      return;
    }

    let correctCount = 0;
    currentQuiz.forEach((q, idx) => {
      const selected = userAnswers[idx];
      const isCorrect = selected === q.correct;
      if (isCorrect) correctCount++;

      const feedbackDiv = document.getElementById(`quiz-feedback-${idx}`);
      if (feedbackDiv) {
        feedbackDiv.classList.remove('hidden');
        feedbackDiv.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedbackDiv.textContent = `${isCorrect ? 'Correct.' : 'Incorrect.'} ${q.explanation}`;
      }

      // Lock in the answers so results can't be changed after grading
      quizQuestionsEl?.querySelectorAll(`input[name="quiz-q-${idx}"]`)
        .forEach(input => { input.disabled = true; });
    });

    const percent = Math.round((correctCount / currentQuiz.length) * 100);

    if (quizResultsEl) {
      quizResultsEl.textContent = `Score: ${percent}% (${correctCount} of ${currentQuiz.length} correct)`;
    }
    if (btnSubmitQuiz) {
      btnSubmitQuiz.disabled = true;
      btnSubmitQuiz.classList.add('hidden');
    }

    saveQuizScore(percent);
    flashCard('section-quiz');
    logActivity('quiz', `Completed A+ practice quiz: ${correctCount}/${currentQuiz.length} (${percent}%)`, null);
  }

  btnSubmitQuiz?.addEventListener('click', gradeQuiz);
  btnResetQuiz?.addEventListener('click', initQuiz);
  initQuiz();

  // ============================================================
  // TICKET TRIAGE + KANBAN BOARD
  // ============================================================
  const btnTriage = document.getElementById('btn-triage');
  const ticketInput = document.getElementById('t_input');

  const triageRules = [
    { keywords: ['down', 'outage', 'crashed', 'crash', 'unreachable'], queue: 'Critical Incident Response', level: 'CRITICAL', badgeClass: 'badge--critical' },
    { keywords: ['database', 'server'], queue: 'Database Admin Team', level: 'HIGH', badgeClass: 'badge--high' },
    { keywords: ['password', 'login', 'locked out', 'mfa'], queue: 'Identity & Access Management', level: 'MEDIUM', badgeClass: 'badge--medium' },
    { keywords: ['printer', 'toner', 'paper jam'], queue: 'Facilities / Hardware', level: 'LOW', badgeClass: 'badge--low' },
  ];

  function readTickets() {
    try {
      const raw = localStorage.getItem('it_dashboard_tickets');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function writeTickets(tickets) {
    try { localStorage.setItem('it_dashboard_tickets', JSON.stringify(tickets)); } catch (err) { /* ignore */ }
  }

  function addTicket(ticket) {
    let tickets = readTickets();
    tickets.unshift(ticket);
    if (tickets.length > 15) {
      const resolvedIdx = [...tickets].reverse().findIndex(t => t.status === 'resolved');
      if (resolvedIdx !== -1) {
        tickets.splice(tickets.length - 1 - resolvedIdx, 1);
      } else {
        tickets.pop();
      }
    }
    writeTickets(tickets);
    renderKanban();
  }

  function moveTicket(id) {
    const tickets = readTickets();
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return;
    if (ticket.status === 'new') ticket.status = 'progress';
    else if (ticket.status === 'progress') ticket.status = 'resolved';
    writeTickets(tickets);
    renderKanban();
  }

  function removeTicket(id) {
    const tickets = readTickets().filter(t => t.id !== id);
    writeTickets(tickets);
    renderKanban();
  }

  function setTicketPriority(id, newLevel) {
    const tickets = readTickets();
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return;
    const badgeClassMap = { CRITICAL: 'badge--critical', HIGH: 'badge--high', MEDIUM: 'badge--medium', LOW: 'badge--low' };
    ticket.level = newLevel;
    ticket.badgeClass = badgeClassMap[newLevel] || 'badge--low';
    writeTickets(tickets);
    renderKanban();
    logActivity('triage', `Manually reprioritized ticket to (${newLevel})`, { text: ticket.text });
  }

  function renderKanban() {
    const tickets = readTickets();
    const columns = {
      new: document.getElementById('queue-new'),
      progress: document.getElementById('queue-progress'),
      resolved: document.getElementById('queue-resolved'),
    };

    Object.values(columns).forEach(col => col && col.replaceChildren());

    ['new', 'progress', 'resolved'].forEach(status => {
      const col = columns[status];
      if (!col) return;
      const items = tickets.filter(t => t.status === status);

      if (items.length === 0) {
        const empty = document.createElement('span');
        empty.className = 'kanban-empty';
        empty.textContent = 'Empty';
        col.appendChild(empty);
        return;
      }

      items.forEach(ticket => {
        const card = document.createElement('div');
        card.className = 'ticket-card';

        const textSpan = document.createElement('span');
        textSpan.className = 'ticket-card-text';
        const preview = ticket.text.length > 70 ? ticket.text.slice(0, 70) + '…' : ticket.text;
        textSpan.textContent = preview;

        const actions = document.createElement('div');
        actions.className = 'ticket-card-actions';

        const badge = document.createElement('select');
        badge.className = `ticket-priority-select badge ${ticket.badgeClass}`;
        badge.setAttribute('aria-label', 'Change ticket priority');
        ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(level => {
          const opt = document.createElement('option');
          opt.value = level;
          opt.textContent = level;
          if (level === ticket.level) opt.selected = true;
          badge.appendChild(opt);
        });
        badge.addEventListener('change', (e) => setTicketPriority(ticket.id, e.target.value));
        actions.appendChild(badge);

        if (status === 'resolved') {
          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'ticket-remove-btn';
          const removeIcon = document.createElement('span');
          removeIcon.setAttribute('aria-hidden', 'true');
          removeIcon.textContent = '\u00D7 ';
          removeBtn.append(removeIcon, document.createTextNode('Remove'));
          removeBtn.setAttribute('aria-label', 'Remove this resolved ticket from the board');
          removeBtn.addEventListener('click', () => removeTicket(ticket.id));
          actions.appendChild(removeBtn);
        } else {
          const moveBtn = document.createElement('button');
          moveBtn.type = 'button';
          moveBtn.className = 'ticket-move-btn';
          moveBtn.textContent = status === 'new' ? 'Start Progress →' : 'Mark Resolved →';
          moveBtn.addEventListener('click', () => moveTicket(ticket.id));
          actions.appendChild(moveBtn);
        }

        card.append(textSpan, actions);
        col.appendChild(card);
      });
    });
  }
  renderKanban();

  function detectPersonName(text) {
    const match = text.match(/\b([A-Z][a-z]+)\s([A-Z][a-z]+)\b/);
    return match ? match[0] : null;
  }

  function runTriage() {
    const rawText = ticketInput ? ticketInput.value : '';
    const txt = rawText.toLowerCase().trim();

    if (!txt) {
      alert('Please describe the ticket first.');
      ticketInput?.focus();
      return;
    }

    withLoadingDelay(btnTriage, () => {
      let selectedRule = { queue: "General Helpdesk Queue", level: "LOW", badgeClass: "badge--low" };
      for (const rule of triageRules) {
        if (rule.keywords.some(k => txt.includes(k))) {
          selectedRule = rule;
          break;
        }
      }

      const bodyText = `Target Queue: ${selectedRule.queue}\nPriority Level: ${selectedRule.level}`;
      setInstantOutput('t_out', 'DEMO CLASSIFIER — keyword routing', bodyText);

      addTicket({
        id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        text: rawText.trim(),
        queue: selectedRule.queue,
        level: selectedRule.level,
        badgeClass: selectedRule.badgeClass,
        status: 'new',
      });

      flashCard('section-triage');
      bumpStat('triaged');
      logActivity('triage', `Routed ticket to [${selectedRule.queue}] with priority (${selectedRule.level})`, { text: rawText });

      const suggestionBox = document.getElementById('triage-suggestion');
      const suggestionText = document.getElementById('triage-suggestion-text');
      const detectedName = detectPersonName(rawText);

      if (detectedName && suggestionBox && suggestionText) {
        suggestionText.textContent = `Mentions "${detectedName}" — provision access for them?`;
        suggestionBox.dataset.name = detectedName;
        suggestionBox.classList.remove('hidden');
      } else {
        suggestionBox?.classList.add('hidden');
      }

      if (ticketInput) ticketInput.value = '';
    });
  }

  btnTriage?.addEventListener('click', runTriage);

  document.getElementById('btn-provision-suggested')?.addEventListener('click', () => {
    const suggestionBox = document.getElementById('triage-suggestion');
    const name = suggestionBox?.dataset.name;
    if (!name) return;

    const nameField = document.getElementById('u_name');
    if (nameField) nameField.value = name;
    suggestionBox.classList.add('hidden');
    document.getElementById('section-identity')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
    nameField?.focus();
  });

  // ============================================================
  // COMMON ISSUE DECISION TREE
  // ============================================================
  const decisionTree = {
    start: {
      question: "What's the issue?",
      options: [
        { label: 'No Internet Connection', next: 'net_1' },
        { label: "Can't Print", next: 'print_1' },
        { label: 'Computer Running Slow', next: 'slow_1' },
        { label: "Can't Log In", next: 'login_1' },
      ],
    },
    net_1: {
      question: 'Is the network cable plugged in firmly, or is Wi-Fi turned on?',
      options: [
        { label: 'No — it was unplugged / Wi-Fi was off', next: 'resolved_cable' },
        { label: 'Yes, it\u2019s connected', next: 'net_2' },
      ],
    },
    net_2: {
      question: 'Does the same problem happen on other devices on this network?',
      options: [
        { label: 'Yes, everyone is affected', next: 'resolved_isp' },
        { label: 'No, just this one device', next: 'net_3' },
      ],
    },
    net_3: {
      question: 'Has running ipconfig /release then ipconfig /renew been tried?',
      options: [
        { label: 'That fixed it', next: 'resolved_renew' },
        { label: 'Still no connection', next: 'resolved_escalate_net' },
      ],
    },
    resolved_cable: { resolution: 'Reconnect the cable or re-enable Wi-Fi, then retest the connection. Log the fix and close the ticket if resolved.' },
    resolved_isp: { resolution: 'This looks like an outage upstream of this device (router, switch, or ISP) rather than a single-machine issue. Escalate to whoever manages the network/ISP relationship.' },
    resolved_renew: { resolution: 'A DHCP release/renew resolved it \u2014 the device likely had a stale or conflicting IP lease. Document the fix for the ticket record.' },
    resolved_escalate_net: { resolution: 'Basic steps didn\u2019t resolve it. Escalate to Tier 2 with: device name, ipconfig /all output, and confirmation that other devices are unaffected.' },

    print_1: {
      question: 'Does the printer show as online in the OS printer list?',
      options: [
        { label: 'No, it shows offline or missing', next: 'print_2' },
        { label: 'Yes, it shows online', next: 'print_3' },
      ],
    },
    print_2: {
      question: 'Is the printer powered on and connected (USB/network)?',
      options: [
        { label: 'It wasn\u2019t \u2014 fixed now', next: 'resolved_printer_power' },
        { label: 'It is connected and powered on', next: 'resolved_escalate_print' },
      ],
    },
    print_3: {
      question: 'Is the print queue stuck with old jobs?',
      options: [
        { label: 'Yes \u2014 clearing the queue fixed it', next: 'resolved_print_queue' },
        { label: 'Queue is empty, still won\u2019t print', next: 'resolved_escalate_print' },
      ],
    },
    resolved_printer_power: { resolution: 'Power/connection was the issue. Reconnect, power cycle the printer, and reprint a test page.' },
    resolved_print_queue: { resolution: 'A stuck spooler job was blocking new prints. Clearing the queue (or restarting the Print Spooler service) resolved it.' },
    resolved_escalate_print: { resolution: 'Basic printer checks didn\u2019t resolve it. Escalate with: printer model, driver version, and whether other users can print to the same device.' },

    slow_1: {
      question: 'Did the slowness start recently, or has it always been slow?',
      options: [
        { label: 'Started recently', next: 'slow_2' },
        { label: 'Always been slow', next: 'resolved_hardware' },
      ],
    },
    slow_2: {
      question: 'Is Task Manager / Activity Monitor showing one process using very high CPU or memory?',
      options: [
        { label: 'Yes, one process is maxed out', next: 'resolved_process' },
        { label: 'No single process stands out', next: 'slow_3' },
      ],
    },
    slow_3: {
      question: 'Has a reboot and malware scan been run?',
      options: [
        { label: 'That resolved it', next: 'resolved_reboot' },
        { label: 'Still slow after both', next: 'resolved_escalate_slow' },
      ],
    },
    resolved_process: { resolution: 'A runaway process was consuming resources. End the task, check if it\u2019s set to run at startup, and monitor for recurrence.' },
    resolved_reboot: { resolution: 'A reboot plus malware scan cleared it \u2014 likely accumulated memory leaks or background processes. Document what scan was run.' },
    resolved_hardware: { resolution: 'Chronic, not sudden, slowness usually points to aging/underpowered hardware rather than a one-off fix. Recommend a hardware assessment (RAM, storage type, age of device).' },
    resolved_escalate_slow: { resolution: 'Standard steps didn\u2019t help. Escalate with: how long it\u2019s been slow, what changed recently (updates, new software), and current CPU/RAM specs.' },

    login_1: {
      question: 'Is the error "incorrect password" or something else (account locked, no network, etc.)?',
      options: [
        { label: 'Incorrect password message', next: 'login_2' },
        { label: 'Account locked out', next: 'resolved_unlock' },
        { label: 'A different error entirely', next: 'resolved_escalate_login' },
      ],
    },
    login_2: {
      question: 'Is Caps Lock on, or was the password possibly changed recently?',
      options: [
        { label: 'Caps Lock was on \u2014 fixed', next: 'resolved_capslock' },
        { label: 'Password may have expired/changed', next: 'resolved_reset' },
      ],
    },
    resolved_unlock: { resolution: 'Verify identity through your organization\u2019s standard callback/verification process, then unlock the account in AD/Entra ID and confirm the user can log in.' },
    resolved_capslock: { resolution: 'Caps Lock was the culprit \u2014 a very common false alarm. No further action needed.' },
    resolved_reset: { resolution: 'Verify identity, then trigger a password reset and set "change password at next logon" so the user picks a new one securely.' },
    resolved_escalate_login: { resolution: 'This doesn\u2019t match a standard login issue. Escalate with the exact error text/screenshot and whether it happens on other devices.' },
  };

  let dtCurrentNode = 'start';
  const dtBreadcrumbEl = document.getElementById('dt-breadcrumb');
  const dtNodeEl = document.getElementById('dt-node');
  const btnDtRestart = document.getElementById('btn-dt-restart');
  let dtTrail = [];

  function renderDecisionTree() {
    if (!dtNodeEl) return;
    const node = decisionTree[dtCurrentNode];
    if (!node) return;

    if (dtBreadcrumbEl) {
      dtBreadcrumbEl.textContent = dtTrail.length ? dtTrail.join(' \u2192 ') : '';
    }

    dtNodeEl.replaceChildren();

    if (node.resolution) {
      const box = document.createElement('div');
      box.className = 'dt-resolution';
      box.textContent = node.resolution;
      dtNodeEl.appendChild(box);
      btnDtRestart?.classList.remove('hidden');
      flashCard('section-decision-tree');
      logActivity('decision-tree', `Walked troubleshooting flow to resolution: ${dtTrail[0] || 'issue'}`, null);
      return;
    }

    const q = document.createElement('p');
    q.className = 'dt-question';
    q.textContent = node.question;
    dtNodeEl.appendChild(q);

    const optionsWrap = document.createElement('div');
    optionsWrap.className = 'dt-options';
    node.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dt-option-btn';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        dtTrail.push(opt.label);
        dtCurrentNode = opt.next;
        renderDecisionTree();
      });
      optionsWrap.appendChild(btn);
    });
    dtNodeEl.appendChild(optionsWrap);
    btnDtRestart?.classList.toggle('hidden', dtTrail.length === 0);
  }

  btnDtRestart?.addEventListener('click', () => {
    dtCurrentNode = 'start';
    dtTrail = [];
    renderDecisionTree();
  });

  renderDecisionTree();

  // ============================================================
  // MULTI-PLATFORM ACCOUNT PROVISIONER
  // ============================================================
  const btnProvision = document.getElementById('btn-provision');
  const btnCopyScript = document.getElementById('btn-copy-script');
  const nameInput = document.getElementById('u_name');
  let currentGeneratedScript = "";

  function readProvisionedList() {
    try {
      const raw = localStorage.getItem('it_dashboard_provisioned');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function saveProvisioned(identifier) {
    const list = readProvisionedList();
    list.unshift({ upn: identifier, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    if (list.length > 3) list.pop();
    try { localStorage.setItem('it_dashboard_provisioned', JSON.stringify(list)); } catch (err) { /* ignore */ }
    renderProvisionedList();
  }

  function renderProvisionedList() {
    const listEl = document.getElementById('provisioned-list');
    if (!listEl) return;
    listEl.replaceChildren();

    const list = readProvisionedList();
    if (list.length === 0) {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.className = 'empty';
      span.textContent = 'No accounts provisioned yet.';
      li.appendChild(span);
      listEl.appendChild(li);
      return;
    }

    list.forEach(item => {
      const li = document.createElement('li');
      const upnSpan = document.createElement('span');
      upnSpan.textContent = item.upn;
      const timeSpan = document.createElement('span');
      timeSpan.textContent = item.time;
      timeSpan.style.color = 'var(--text-muted)';
      li.append(upnSpan, timeSpan);
      listEl.appendChild(li);
    });
  }
  renderProvisionedList();

  function generateUnbiasedPassword(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    let result = '';
    for (let i = 0; i < length; i++) result += chars[randomValues[i] % chars.length];
    return result.toUpperCase();
  }

  function generateScript(platform, firstName, lastName, samAccount, upn, password) {
    if (platform === 'ad') {
      return `New-ADUser -Name "${firstName} ${lastName}" -GivenName "${firstName}" -SurName "${lastName}" -SamAccountName "${samAccount}" -UserPrincipalName "${upn}" -AccountPassword (ConvertTo-SecureString "${password}" -AsPlainText -Force) -Enabled $true -ChangePasswordAtLogon $true`;
    }
    if (platform === 'entra') {
      return `New-MgUser -DisplayName "${firstName} ${lastName}" -UserPrincipalName "${upn}" -MailNickname "${samAccount}" -AccountEnabled -PasswordProfile @{ Password = "${password}"; ForceChangePasswordNextSignIn = $true }`;
    }
    return `sudo useradd -m -c "${firstName} ${lastName}" ${samAccount}\necho "${samAccount}:${password}" | sudo chpasswd\nsudo passwd -e ${samAccount}   # force password change at next login`;
  }

  function runProvision() {
    const name = nameInput ? nameInput.value.trim() : '';
    const platform = document.getElementById('prov_platform')?.value || 'ad';

    if (!name) {
      alert('Please enter a name.');
      nameInput?.focus();
      return;
    }

    withLoadingDelay(btnProvision, () => {
      const parts = name.split(" ");
      const firstName = parts[0] || "User";
      const lastName = parts.slice(1).join(" ") || "Demo";
      const samAccount = (firstName[0] + lastName).toLowerCase().replace(/[^a-z0-9]/g, "");
      const password = generateUnbiasedPassword(8);
      const passFormatted = password.slice(0, 4) + '-' + password.slice(4);

      const domain = platform === 'entra' ? 'example-corp.onmicrosoft.com' : 'example-corp.local';
      const upn = `${samAccount}@${domain}`;

      let identifier, summary;
      if (platform === 'linux') {
        identifier = samAccount;
        summary = `Sample Linux username: ${samAccount}\nSample home directory: /home/${samAccount}\nSample temporary password: ${passFormatted}`;
      } else if (platform === 'entra') {
        identifier = upn;
        summary = `Sample UPN: ${upn}\nSample Mail Nickname: ${samAccount}\nSample temporary password: ${passFormatted}`;
      } else {
        identifier = upn;
        summary = `Sample UPN: ${upn}\nSample sAMAccountName: corp\\${samAccount}\nSample temporary password: ${passFormatted}`;
      }

      currentGeneratedScript = generateScript(platform, firstName, lastName, samAccount, upn, passFormatted);

      setInstantOutput('u_out', 'DEMO CREDENTIAL OUTPUT', summary);

      const psContainer = document.getElementById("ps-output-container");
      const psHeading = document.getElementById("ps-output-heading");
      const scriptLabel = platform === 'ad' ? 'Active Directory PowerShell Script (New-ADUser)'
        : platform === 'entra' ? 'Microsoft Entra ID PowerShell Script (New-MgUser)'
        : 'Linux Shell Commands';
      if (psHeading) psHeading.textContent = scriptLabel;

      if (psContainer) {
        psContainer.classList.remove('hidden');
        typeOutput('ps-script-output', platform.toUpperCase() + ' COMMAND', currentGeneratedScript);
      }

      hideHint('u_out_hint');
      stampUpdated('u_last_updated');
      flashCard('section-identity');
      bumpStat('provisioned');
      saveProvisioned(identifier);
      logActivity('provision', `Provisioned sample ${platform.toUpperCase()} account for user: ${samAccount}`, { name, platform });
    });
  }

  btnCopyScript?.addEventListener('click', () => {
    if (!currentGeneratedScript) return;
    navigator.clipboard.writeText(currentGeneratedScript)
      .then(() => {
        btnCopyScript.textContent = '✅ Copied!';
        setTimeout(() => { btnCopyScript.textContent = '📋 Copy Command'; }, 2000);
      })
      .catch((err) => {
        console.warn('Clipboard write failed:', err);
        btnCopyScript.textContent = '⚠️ Copy failed — select manually';
        setTimeout(() => { btnCopyScript.textContent = '📋 Copy Command'; }, 2500);
      });
  });

  btnProvision?.addEventListener('click', runProvision);
  onEnter(nameInput, runProvision);

  // ============================================================
  // BATCH USER CSV GENERATOR
  // ============================================================
  const btnGenerateCsv = document.getElementById('btn-generate-csv');
  const csvNamesInput = document.getElementById('csv_names');

  function csvEscape(value) {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function runGenerateCsv() {
    const raw = csvNamesInput ? csvNamesInput.value : '';
    const names = raw.split('\n').map(n => n.trim()).filter(Boolean);

    if (names.length === 0) {
      alert('Enter at least one name, one per line.');
      csvNamesInput?.focus();
      return;
    }
    if (names.length > 200) {
      alert('Please limit this demo to 200 names or fewer per batch.');
      return;
    }

    const platform = document.getElementById('csv_platform')?.value || 'ad';

    withLoadingDelay(btnGenerateCsv, () => {
      const usedAccounts = new Set();
      const rows = names.map(name => {
        const parts = name.split(/\s+/);
        const firstName = parts[0] || 'User';
        const lastName = parts.slice(1).join(' ') || 'Demo';
        let samAccount = (firstName[0] + lastName).toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';

        // Avoid duplicate usernames within the same batch
        let candidate = samAccount;
        let suffix = 1;
        while (usedAccounts.has(candidate)) {
          candidate = samAccount + suffix;
          suffix++;
        }
        samAccount = candidate;
        usedAccounts.add(samAccount);

        const password = generateUnbiasedPassword(8);
        const passFormatted = password.slice(0, 4) + '-' + password.slice(4);
        const upn = `${samAccount}@example-corp.local`;

        return { name, firstName, lastName, samAccount, upn, password: passFormatted };
      });

      let csvContent, filename;
      if (platform === 'm365') {
        csvContent = 'Display Name,User Name,First Name,Last Name,Password\n';
        csvContent += rows.map(r =>
          [csvEscape(r.name), csvEscape(r.upn), csvEscape(r.firstName), csvEscape(r.lastName), csvEscape(r.password)].join(',')
        ).join('\n');
        filename = `m365-bulk-users-${Date.now()}.csv`;
      } else {
        csvContent = 'DisplayName,SamAccountName,UserPrincipalName,Password\n';
        csvContent += rows.map(r =>
          [csvEscape(r.name), csvEscape(r.samAccount), csvEscape(r.upn), csvEscape(r.password)].join(',')
        ).join('\n');
        filename = `ad-bulk-users-${Date.now()}.csv`;
      }

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setInstantOutput('csv_out', 'CSV GENERATED & DOWNLOADED',
        `Generated ${rows.length} user${rows.length === 1 ? '' : 's'} in ${platform === 'm365' ? 'Microsoft 365' : 'Active Directory'} format.\nFile: ${filename}\n\nSample row: ${rows[0].name} \u2192 ${rows[0].samAccount}`);

      stampUpdated('csv_last_updated');
      flashCard('section-csv');
      logActivity('csv', `Generated a ${rows.length}-user ${platform.toUpperCase()} bulk-import CSV`, null);
    });
  }

  btnGenerateCsv?.addEventListener('click', runGenerateCsv);

  // ============================================================
  // FIREWALL ALERT SAMPLE
  // ============================================================
  const btnLogs = document.getElementById('btn-logs');
  btnLogs?.addEventListener('click', () => {
    withLoadingDelay(btnLogs, () => {
      const logData =
        `Alert ID: 9021\n` +
        `Timestamp: 19:22:14 UTC\n` +
        `Source IP: 203.0.113.12 (reserved range)\n` +
        `Event: SSH brute-force pattern (sample data)\n` +
        `Action: illustrative only — no real block applied`;

      hideHint('l_out_hint');
      typeOutput('l_out', 'STATIC SAMPLE — not a live audit', logData, 'l_out_status');
      stampUpdated('l_last_updated');
      flashCard('section-security');
      bumpStat('alerts');
      logActivity('firewall', 'Audited Firewall Security Log (Alert ID: 9021)', null);
    });
  });

  // ============================================================
  // CLI REFERENCE (searchable)
  // ============================================================
  const cliCommands = [
    { os: 'Windows', cmd: 'ipconfig /all', desc: 'Displays full network configuration for all adapters' },
    { os: 'Windows', cmd: 'ipconfig /flushdns', desc: 'Clears the local DNS resolver cache' },
    { os: 'Windows', cmd: 'sfc /scannow', desc: 'Scans and repairs protected system files' },
    { os: 'Windows', cmd: 'chkdsk /f', desc: 'Checks a disk for errors and fixes them' },
    { os: 'Windows', cmd: 'gpupdate /force', desc: 'Forces an immediate refresh of Group Policy settings' },
    { os: 'Windows', cmd: 'netstat -an', desc: 'Lists active network connections and listening ports' },
    { os: 'Windows', cmd: 'tracert', desc: 'Traces the network path packets take to a destination' },
    { os: 'Windows', cmd: 'nslookup', desc: 'Queries DNS to resolve a hostname or IP address' },
    { os: 'Windows', cmd: 'tasklist', desc: 'Lists currently running processes' },
    { os: 'Linux', cmd: 'chmod', desc: 'Changes file or directory permissions' },
    { os: 'Linux', cmd: 'chown', desc: 'Changes file or directory ownership' },
    { os: 'Linux', cmd: 'systemctl status', desc: 'Shows the status of a system service' },
    { os: 'Linux', cmd: 'journalctl -xe', desc: 'Views detailed system logs for recent errors' },
    { os: 'Linux', cmd: 'ps aux', desc: 'Lists all currently running processes' },
    { os: 'Linux', cmd: 'grep', desc: 'Searches text using pattern matching' },
    { os: 'Linux', cmd: 'sudo', desc: 'Executes a command with elevated (root) privileges' },
    { os: 'Linux', cmd: 'df -h', desc: 'Shows disk space usage in human-readable form' },
    { os: 'Linux', cmd: 'ping -c 4', desc: 'Sends 4 ICMP echo requests to test connectivity' },
  ];

  const cliSearchInput = document.getElementById('cli_search');
  const cliListEl = document.getElementById('cli_list');
  const cliResultCountEl = document.getElementById('cli_result_count');

  function renderCliList(filter = '') {
    if (!cliListEl) return;
    const q = filter.toLowerCase().trim();
    const results = cliCommands.filter(c => !q || c.cmd.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));

    if (cliResultCountEl) cliResultCountEl.textContent = `${results.length} of ${cliCommands.length} commands`;
    cliListEl.replaceChildren();

    if (results.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'output-hint';
      empty.textContent = 'No matching commands.';
      cliListEl.appendChild(empty);
      return;
    }

    results.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cli-command-item';

      const nameLine = document.createElement('div');
      const nameSpan = document.createElement('span');
      nameSpan.className = 'cli-command-name';
      nameSpan.textContent = item.cmd;
      const osSpan = document.createElement('span');
      osSpan.className = 'cli-command-os';
      osSpan.textContent = item.os;
      nameLine.append(nameSpan, osSpan);

      const descDiv = document.createElement('div');
      descDiv.className = 'cli-command-desc';
      descDiv.textContent = item.desc;

      div.append(nameLine, descDiv);
      cliListEl.appendChild(div);
    });
  }

  cliSearchInput?.addEventListener('input', (e) => renderCliList(e.target.value));
  renderCliList();

  // ============================================================
  // EXPORT DATA / LOAD DEMO DATA
  // ============================================================
  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      stats: readStats(),
      quizScores: readQuizScores(),
      activityLog: readLogs(),
      tickets: readTickets(),
      provisioned: readProvisionedList(),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `it-dashboard-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    logActivity('export', 'Exported dashboard data snapshot as JSON', null);
  });

  document.getElementById('btn-load-demo')?.addEventListener('click', () => {
    writeStats({ diagnostics: 7, triaged: 5, provisioned: 3, alerts: 2 });

    writeTickets([
      { id: 'demo-1', text: 'Marketing database server completely crashed', queue: 'Database Admin Team', level: 'HIGH', badgeClass: 'badge--high', status: 'new' },
      { id: 'demo-2', text: 'User locked out of account after failed MFA attempts', queue: 'Identity & Access Management', level: 'MEDIUM', badgeClass: 'badge--medium', status: 'progress' },
      { id: 'demo-3', text: '3rd floor printer out of toner', queue: 'Facilities / Hardware', level: 'LOW', badgeClass: 'badge--low', status: 'resolved' },
    ]);

    try {
      localStorage.setItem('it_dashboard_provisioned', JSON.stringify([
        { upn: 'jsmith@example-corp.local', time: '9:14 AM' },
        { upn: 'adoe@example-corp.local', time: '8:52 AM' },
      ]));
    } catch (err) { /* ignore */ }

    try {
      localStorage.setItem('it_dashboard_quiz_scores', JSON.stringify([80, 100, 60]));
    } catch (err) { /* ignore */ }

    try {
      localStorage.setItem('it_dashboard_logs_v2', JSON.stringify([
        { timestamp: '9:14:02 AM', type: 'provision', label: 'Provisioned sample AD account for user: jsmith', payload: { name: 'John Smith', platform: 'ad' } },
        { timestamp: '8:55:41 AM', type: 'triage', label: 'Routed ticket to [Database Admin Team] with priority (HIGH)', payload: { text: 'Marketing database server completely crashed' } },
        { timestamp: '8:40:10 AM', type: 'firewall', label: 'Audited Firewall Security Log (Alert ID: 9021)', payload: null },
      ]));
    } catch (err) { /* ignore */ }

    renderStats();
    renderKanban();
    renderProvisionedList();
    renderActivityLog();
    flashCard('section-activity');
  });

  // Initial render
  renderActivityLog();

});
