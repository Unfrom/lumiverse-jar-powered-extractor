/**
 * Lumiverse Spindle Frontend Module
 * JAR Character Ripper with JanitorAI Search & Extraction
 */

export interface SpindleFrontendContext {
  ui: any;
  sendToBackend: (payload: any) => void;
  onBackendMessage: (handler: (payload: any) => void) => () => void;
  deferReady?: () => void;
  ready?: () => void;
}

const STORAGE_KEY_BASE_URL = 'jar_ripper_base_url';
function getJarUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_BASE_URL) || 'http://localhost:4577';
  } catch (_) {
    return 'http://localhost:4577';
  }
}
function setJarUrl(url: string) {
  try {
    localStorage.setItem(STORAGE_KEY_BASE_URL, url);
  } catch (_) {}
}

export function setup(ctx: SpindleFrontendContext) {
  let isConnected = false;
  let activeTab: 'search' | 'url' | 'history' = 'search';
  let activeCaptureRecord: any = null;
  let currentSearchQuery = '';
  let isSearching = false;
  let isExtracting = false;
  let isImporting = false;

  // 1. Register Drawer Tab in Lumiverse
  const tab = ctx.ui.registerDrawerTab({
    id: 'jar-character-ripper',
    title: 'JAR Janitor Character Ripper',
    shortName: 'JAR',
    description: 'Search, extract, and import JanitorAI character cards & lorebooks',
    keywords: ['janitor', 'jar', 'ripper', 'search', 'character', 'scrape', 'lorebook', 'import'],
    headerTitle: 'JAR Ripper',
    iconSvg: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
        <path d="M12 12l4 4m0-4l-4 4"></path>
      </svg>
    `,
  });

  // 2. Build Container Styles & DOM
  const container = tab.root;
  container.innerHTML = `
    <style>
      .jar-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 12px;
        box-sizing: border-box;
        font-family: inherit;
        color: var(--lumiverse-text, #e2e8f0);
        overflow-y: auto;
        gap: 12px;
      }
      .jar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--lumiverse-border, rgba(255, 255, 255, 0.1));
      }
      .jar-status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }
      .jar-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #ef4444;
      }
      .jar-status-dot.online {
        background-color: #10b981;
        box-shadow: 0 0 8px #10b98188;
      }
      .jar-nav {
        display: flex;
        gap: 4px;
        background: var(--lumiverse-fill-subtle, rgba(255, 255, 255, 0.05));
        padding: 4px;
        border-radius: 6px;
      }
      .jar-nav-btn {
        flex: 1;
        padding: 6px 10px;
        font-size: 12px;
        border: none;
        background: transparent;
        color: var(--lumiverse-text-dim, #94a3b8);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .jar-nav-btn.active {
        background: var(--lumiverse-card, rgba(255, 255, 255, 0.15));
        color: var(--lumiverse-text, #ffffff);
        font-weight: 600;
      }
      .jar-search-bar {
        display: flex;
        gap: 6px;
      }
      .jar-input {
        flex: 1;
        padding: 8px 12px;
        background: var(--lumiverse-fill-subtle, rgba(0, 0, 0, 0.2));
        border: 1px solid var(--lumiverse-border, rgba(255, 255, 255, 0.15));
        border-radius: 6px;
        color: inherit;
        font-size: 13px;
        outline: none;
      }
      .jar-input:focus {
        border-color: var(--lumiverse-accent, #6366f1);
      }
      .jar-btn {
        padding: 8px 14px;
        font-size: 13px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        background: var(--lumiverse-accent, #6366f1);
        color: #ffffff;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: opacity 0.15s ease;
      }
      .jar-btn:hover {
        opacity: 0.9;
      }
      .jar-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .jar-btn-secondary {
        background: var(--lumiverse-fill-subtle, rgba(255, 255, 255, 0.1));
        color: var(--lumiverse-text, #ffffff);
      }
      .jar-btn-success {
        background: #10b981;
      }
      .jar-card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 10px;
        margin-top: 4px;
      }
      .jar-char-card {
        background: var(--lumiverse-fill-subtle, rgba(255, 255, 255, 0.05));
        border: 1px solid var(--lumiverse-border, rgba(255, 255, 255, 0.1));
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: transform 0.15s ease, border-color 0.15s ease;
      }
      .jar-char-card:hover {
        transform: translateY(-2px);
        border-color: var(--lumiverse-accent, #6366f1);
      }
      .jar-char-card img {
        width: 100%;
        height: 180px;
        object-fit: cover;
        background: #1e1e2e;
      }
      .jar-char-card-body {
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
      }
      .jar-char-name {
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .jar-char-creator {
        font-size: 11px;
        color: var(--lumiverse-text-dim, #94a3b8);
      }
      .jar-char-desc {
        font-size: 11px;
        color: var(--lumiverse-text-dim, #cbd5e1);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.3;
        margin-top: 2px;
      }
      .jar-char-actions {
        display: flex;
        gap: 4px;
        margin-top: auto;
        padding-top: 6px;
      }
      .jar-char-actions button {
        flex: 1;
        padding: 5px;
        font-size: 11px;
      }
      .jar-preview-box {
        background: var(--lumiverse-fill-subtle, rgba(255, 255, 255, 0.05));
        border: 1px solid var(--lumiverse-border, rgba(255, 255, 255, 0.15));
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .jar-preview-header {
        display: flex;
        gap: 12px;
      }
      .jar-preview-avatar {
        width: 72px;
        height: 72px;
        border-radius: 6px;
        object-fit: cover;
        background: #1e1e2e;
      }
      .jar-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        background: rgba(99, 102, 241, 0.2);
        color: #818cf8;
      }
      .jar-badge.public {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
      }
      .jar-badge.private {
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
      }
      .jar-log-area {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--lumiverse-border, rgba(255, 255, 255, 0.1));
        border-radius: 6px;
        padding: 8px;
        font-family: monospace;
        font-size: 11px;
        max-height: 80px;
        overflow-y: auto;
        color: #94a3b8;
      }
    </style>

    <div class="jar-wrapper">
      <!-- Status & Header -->
      <div class="jar-header">
        <div class="jar-status">
          <div id="jar-status-dot" class="jar-status-dot"></div>
          <span id="jar-status-text">Connecting to JAR...</span>
        </div>
        <button id="jar-settings-btn" class="jar-btn jar-btn-secondary" style="padding: 4px 8px; font-size: 11px;">
          ⚙️ Settings
        </button>
      </div>

      <!-- Settings Collapsible -->
      <div id="jar-settings-panel" style="display: none; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px;">
        <label style="font-size: 11px; display: block; margin-bottom: 4px;">JAR Server URL:</label>
        <div style="display: flex; gap: 6px;">
          <input id="jar-url-input" class="jar-input" style="padding: 4px 8px; font-size: 12px;" value="${getJarUrl()}" />
          <button id="jar-url-save" class="jar-btn" style="padding: 4px 10px; font-size: 12px;">Save</button>
        </div>
      </div>

      <!-- Nav Tabs -->
      <div class="jar-nav">
        <button id="jar-tab-search" class="jar-nav-btn active">🔍 Search Janitor</button>
        <button id="jar-tab-url" class="jar-nav-btn">🔗 Direct URL</button>
        <button id="jar-tab-history" class="jar-nav-btn">📂 JAR Captures</button>
      </div>

      <!-- Search Section -->
      <div id="jar-sec-search" style="display: flex; flex-direction: column; gap: 8px;">
        <div class="jar-search-bar">
          <input id="jar-search-input" class="jar-input" placeholder="Search JanitorAI characters (e.g. maid, vampire)..." />
          <button id="jar-search-btn" class="jar-btn">Search</button>
        </div>
        <div id="jar-search-results" class="jar-card-grid"></div>
      </div>

      <!-- Direct URL Section -->
      <div id="jar-sec-url" style="display: none; flex-direction: column; gap: 8px;">
        <div style="font-size: 11px; color: var(--lumiverse-text-dim);">
          Paste any JanitorAI character URL or UUID. Public cards can be scraped directly without JAR!
        </div>
        <div class="jar-search-bar">
          <input id="jar-url-scrape-input" class="jar-input" placeholder="https://janitorai.com/characters/... or UUID" />
          <button id="jar-direct-scrape-btn" class="jar-btn jar-btn-success">⚡ Direct Scrape</button>
          <button id="jar-inspect-btn" class="jar-btn jar-btn-secondary">Inspect with JAR</button>
        </div>
      </div>

      <!-- History Section -->
      <div id="jar-sec-history" style="display: none; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; color: var(--lumiverse-text-dim);">Saved extractions on local JAR:</span>
          <button id="jar-refresh-history" class="jar-btn jar-btn-secondary" style="padding: 3px 8px; font-size: 11px;">Refresh</button>
        </div>
        <div id="jar-history-list" class="jar-card-grid"></div>
      </div>

      <!-- Progress / Activity Log -->
      <div id="jar-log" class="jar-log-area" style="display: none;"></div>

      <!-- Active Extracted Character Preview -->
      <div id="jar-preview-area" class="jar-preview-box" style="display: none;">
        <div class="jar-preview-header">
          <img id="jar-prev-img" class="jar-preview-avatar" src="" alt="Avatar" />
          <div style="display: flex; flex-direction: column; gap: 4px; overflow: hidden;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span id="jar-prev-name" style="font-weight: 600; font-size: 14px;"></span>
              <span id="jar-prev-badge" class="jar-badge"></span>
            </div>
            <div id="jar-prev-creator" style="font-size: 11px; color: var(--lumiverse-text-dim);"></div>
            <div id="jar-prev-tags" style="font-size: 11px; color: #818cf8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></div>
          </div>
        </div>

        <div id="jar-prev-summary" style="font-size: 12px; line-height: 1.4; color: #cbd5e1; max-height: 120px; overflow-y: auto;"></div>

        <div style="display: flex; gap: 6px;">
          <button id="jar-rip-btn" class="jar-btn" style="flex: 1;">
            ⚡ Extract Prompt & Lorebook
          </button>
          <button id="jar-import-btn" class="jar-btn jar-btn-success" style="flex: 1;">
            📥 Import to Lumiverse
          </button>
        </div>
      </div>
    </div>
  `;

  // Element handles
  const dotEl = container.querySelector('#jar-status-dot') as HTMLElement;
  const statusTextEl = container.querySelector('#jar-status-text') as HTMLElement;
  const logEl = container.querySelector('#jar-log') as HTMLElement;
  const searchSec = container.querySelector('#jar-sec-search') as HTMLElement;
  const urlSec = container.querySelector('#jar-sec-url') as HTMLElement;
  const historySec = container.querySelector('#jar-sec-history') as HTMLElement;
  const searchResultsEl = container.querySelector('#jar-search-results') as HTMLElement;
  const searchInput = container.querySelector('#jar-search-input') as HTMLInputElement;
  const searchBtn = container.querySelector('#jar-search-btn') as HTMLButtonElement;
  const urlInput = container.querySelector('#jar-url-scrape-input') as HTMLInputElement;
  const directScrapeBtn = container.querySelector('#jar-direct-scrape-btn') as HTMLButtonElement;
  const inspectBtn = container.querySelector('#jar-inspect-btn') as HTMLButtonElement;
  const previewBox = container.querySelector('#jar-preview-area') as HTMLElement;
  const prevImg = container.querySelector('#jar-prev-img') as HTMLImageElement;
  const prevName = container.querySelector('#jar-prev-name') as HTMLElement;
  const prevBadge = container.querySelector('#jar-prev-badge') as HTMLElement;
  const prevCreator = container.querySelector('#jar-prev-creator') as HTMLElement;
  const prevTags = container.querySelector('#jar-prev-tags') as HTMLElement;
  const prevSummary = container.querySelector('#jar-prev-summary') as HTMLElement;
  const ripBtn = container.querySelector('#jar-rip-btn') as HTMLButtonElement;
  const importBtn = container.querySelector('#jar-import-btn') as HTMLButtonElement;
  const historyListEl = container.querySelector('#jar-history-list') as HTMLElement;

  function log(msg: string) {
    logEl.style.display = 'block';
    const line = document.createElement('div');
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function checkStatus() {
    ctx.sendToBackend({
      type: 'jar_get_status',
      baseUrl: getJarUrl(),
    });
  }

  // Switch tabs
  function switchTab(t: 'search' | 'url' | 'history') {
    activeTab = t;
    ['search', 'url', 'history'].forEach((name) => {
      const btn = container.querySelector(`#jar-tab-${name}`) as HTMLElement;
      if (btn) btn.classList.toggle('active', name === t);
    });
    searchSec.style.display = t === 'search' ? 'flex' : 'none';
    urlSec.style.display = t === 'url' ? 'flex' : 'none';
    historySec.style.display = t === 'history' ? 'flex' : 'none';

    if (t === 'history') {
      ctx.sendToBackend({ type: 'jar_list_captures', baseUrl: getJarUrl() });
    }
  }

  container.querySelector('#jar-tab-search')?.addEventListener('click', () => switchTab('search'));
  container.querySelector('#jar-tab-url')?.addEventListener('click', () => switchTab('url'));
  container.querySelector('#jar-tab-history')?.addEventListener('click', () => switchTab('history'));
  container.querySelector('#jar-refresh-history')?.addEventListener('click', () => {
    ctx.sendToBackend({ type: 'jar_list_captures', baseUrl: getJarUrl() });
  });

  // Settings toggle
  container.querySelector('#jar-settings-btn')?.addEventListener('click', () => {
    const p = container.querySelector('#jar-settings-panel') as HTMLElement;
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
  });
  container.querySelector('#jar-url-save')?.addEventListener('click', () => {
    const u = (container.querySelector('#jar-url-input') as HTMLInputElement).value.trim();
    if (u) {
      setJarUrl(u);
      checkStatus();
      (container.querySelector('#jar-settings-panel') as HTMLElement).style.display = 'none';
    }
  });

  // Perform search
  function doSearch() {
    const q = searchInput.value.trim();
    if (!q) return;
    currentSearchQuery = q;
    isSearching = true;
    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';
    searchResultsEl.innerHTML = '<div style="color:var(--lumiverse-text-dim);font-size:12px;padding:8px;">Searching JanitorAI via JAR browser session...</div>';
    log(`Searching for "${q}"...`);

    ctx.sendToBackend({
      type: 'jar_search',
      query: q,
      baseUrl: getJarUrl(),
    });
  }

  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  // Render search results
  function renderSearchResults(data: any) {
    isSearching = false;
    searchBtn.disabled = false;
    searchBtn.textContent = 'Search';
    searchResultsEl.innerHTML = '';

    const list: any[] = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    if (list.length === 0) {
      searchResultsEl.innerHTML = '<div style="color:var(--lumiverse-text-dim);font-size:12px;padding:8px;">No characters found. Try different keywords.</div>';
      return;
    }

    list.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'jar-char-card';

      const avatarSrc = item.avatar
        ? (item.avatar.startsWith('http') ? item.avatar : `https://ella.janitorai.com/bot-avatars/${item.avatar}?width=300`)
        : '';

      const tags = Array.isArray(item.tags)
        ? item.tags.map((t: any) => (typeof t === 'string' ? t : t.name || t.slug)).join(', ')
        : '';

      card.innerHTML = `
        <img src="${avatarSrc}" alt="${item.name || 'Character'}" loading="lazy" />
        <div class="jar-char-card-body">
          <div class="jar-char-name" title="${item.name || ''}">${item.name || 'Unnamed'}</div>
          <div class="jar-char-creator">by ${item.creator_name || item.creator || 'unknown'}</div>
          <div class="jar-char-desc">${item.description || ''}</div>
          <div class="jar-char-actions">
            <button class="jar-btn jar-btn-secondary inspect-btn">Inspect</button>
            <button class="jar-btn jar-btn-success rip-btn">Rip & Import</button>
          </div>
        </div>
      `;

      card.querySelector('.inspect-btn')?.addEventListener('click', () => {
        inspectCharacter(item.id || item.character_id);
      });

      card.querySelector('.rip-btn')?.addEventListener('click', () => {
        quickRipAndImport(item.id || item.character_id);
      });

      searchResultsEl.appendChild(card);
    });
  }

  function inspectCharacter(idOrUrl: string) {
    log(`Inspecting character ${idOrUrl}...`);
    ctx.sendToBackend({
      type: 'jar_inspect',
      url: idOrUrl,
      baseUrl: getJarUrl(),
    });
  }

  function quickRipAndImport(idOrUrl: string) {
    log(`Starting auto-rip and import for ${idOrUrl}...`);
    ctx.sendToBackend({
      type: 'jar_inspect',
      url: idOrUrl,
      baseUrl: getJarUrl(),
    });
    // Record that we should auto-extract & import once inspect completes
    (window as any).__jar_auto_import = true;
  }

  inspectBtn.addEventListener('click', () => {
    const val = urlInput.value.trim();
    if (val) inspectCharacter(val);
  });

  directScrapeBtn?.addEventListener('click', () => {
    const val = urlInput.value.trim();
    if (!val) return;
    log(`Starting direct scrape for ${val}...`);
    directScrapeBtn.disabled = true;
    directScrapeBtn.textContent = 'Scraping...';
    ctx.sendToBackend({
      type: 'direct_janitor_scrape',
      url: val,
    });
  });

  // Display Preview
  function showPreview(rec: any) {
    activeCaptureRecord = rec;
    previewBox.style.display = 'flex';

    const char = rec.character || rec;
    const name = char.name || rec.characterName || 'Character';
    prevName.textContent = name;

    const isPublic = rec.cardPublic === true || char.definitionSource === 'catalog';
    prevBadge.textContent = isPublic ? 'Public Card' : 'Private Card (Capture Required)';
    prevBadge.className = `jar-badge ${isPublic ? 'public' : 'private'}`;

    prevCreator.textContent = char.creator || (rec.meta && rec.meta.creator_name) ? `by ${char.creator || rec.meta.creator_name}` : '';
    prevTags.textContent = Array.isArray(char.tags) ? char.tags.join(' • ') : '';

    const avatar = rec.avatarBase64 || char.avatarBase64 || (rec.meta && rec.meta.avatar);
    if (avatar) {
      prevImg.src = avatar.startsWith('http') || avatar.startsWith('data:') ? avatar : `https://ella.janitorai.com/bot-avatars/${avatar}?width=300`;
    } else {
      prevImg.src = '';
    }

    prevSummary.textContent = char.description || (rec.context && rec.context.description) || 'No description provided.';

    // Adjust button text
    if (isPublic) {
      ripBtn.style.display = 'none';
      importBtn.textContent = '📥 Import to Lumiverse';
    } else {
      ripBtn.style.display = 'inline-flex';
      ripBtn.textContent = rec.payload ? '🔄 Re-Capture Prompt' : '⚡ Extract Prompt & Lorebook';
      importBtn.textContent = rec.payload ? '📥 Import Extracted Card' : '📥 Import Public Info';
    }
  }

  // Trigger Capture via Playwright in JAR
  ripBtn.addEventListener('click', () => {
    if (!activeCaptureRecord || !activeCaptureRecord.id) return;
    log('Triggering prompt capture via JAR browser session...');
    ripBtn.disabled = true;
    ripBtn.textContent = 'Extracting in browser...';

    ctx.sendToBackend({
      type: 'jar_capture',
      id: activeCaptureRecord.id,
      force: true,
      baseUrl: getJarUrl(),
    });
  });

  // Import to Lumiverse
  importBtn.addEventListener('click', () => {
    if (!activeCaptureRecord) return;
    const char = activeCaptureRecord.character || activeCaptureRecord;
    log(`Importing "${char.name}" into Lumiverse library...`);
    importBtn.disabled = true;
    importBtn.textContent = 'Importing...';

    ctx.sendToBackend({
      type: 'import_to_lumiverse',
      character: char,
      avatarBase64: activeCaptureRecord.avatarBase64 || char.avatarBase64,
      worldInfo: activeCaptureRecord.worldInfo || activeCaptureRecord.privateLorebookReconstruction?.worldInfo,
      publicLorebooks: activeCaptureRecord.publicLorebooks,
      sourceUrl: activeCaptureRecord.url,
    });
  });

  // Render recent captures from JAR
  function renderHistory(captures: any[]) {
    historyListEl.innerHTML = '';
    if (!captures || captures.length === 0) {
      historyListEl.innerHTML = '<div style="color:var(--lumiverse-text-dim);font-size:12px;padding:8px;">No captures saved on JAR yet.</div>';
      return;
    }

    captures.forEach((c) => {
      const card = document.createElement('div');
      card.className = 'jar-char-card';
      const name = c.characterName || c.character?.name || 'Saved Capture';
      const avatarSrc = `${getJarUrl()}/api/captures/${c.id}/avatar`;

      card.innerHTML = `
        <img src="${avatarSrc}" alt="${name}" onerror="this.style.display='none'" />
        <div class="jar-char-card-body">
          <div class="jar-char-name">${name}</div>
          <div class="jar-char-creator">${new Date(c.ts || Date.now()).toLocaleDateString()}</div>
          <div class="jar-char-actions">
            <button class="jar-btn jar-btn-secondary load-btn">Load</button>
            <button class="jar-btn jar-btn-success import-btn">Import</button>
          </div>
        </div>
      `;

      card.querySelector('.load-btn')?.addEventListener('click', () => {
        ctx.sendToBackend({ type: 'jar_get_capture', id: c.id, baseUrl: getJarUrl() });
      });

      card.querySelector('.import-btn')?.addEventListener('click', () => {
        ctx.sendToBackend({ type: 'jar_get_capture', id: c.id, baseUrl: getJarUrl() });
        (window as any).__jar_auto_import = true;
      });

      historyListEl.appendChild(card);
    });
  }

  // 3. Listen to messages from Backend
  const unsubBackend = ctx.onBackendMessage((payload: any) => {
    if (!payload || !payload.type) return;

    switch (payload.type) {
      case 'jar_status_result': {
        isConnected = !!payload.online;
        if (isConnected) {
          dotEl.className = 'jar-status-dot online';
          statusTextEl.textContent = `JAR v${payload.version || '0.4.0'} Online ${payload.loggedIn ? '(Logged In)' : ''}`;
        } else {
          fetch(`${getJarUrl()}/api/status`, { mode: 'cors' })
            .then((r) => r.json())
            .then((s) => {
              if (s) {
                isConnected = true;
                dotEl.className = 'jar-status-dot online';
                statusTextEl.textContent = 'JAR Online (Local PC Connected)';
              }
            })
            .catch(() => {
              dotEl.className = 'jar-status-dot';
              statusTextEl.textContent = 'Standalone Mode (JAR Offline)';
            });
        }
        break;
      }

      case 'direct_janitor_scrape_result': {
        if (directScrapeBtn) {
          directScrapeBtn.disabled = false;
          directScrapeBtn.textContent = '⚡ Direct Scrape';
        }
        log(`Direct scraped "${payload.data?.characterName || 'Character'}" (Public: ${payload.data?.cardPublic})`);
        showPreview(payload.data);
        break;
      }

      case 'jar_search_result': {
        renderSearchResults(payload.data);
        log(`Search completed for "${currentSearchQuery}"`);
        break;
      }

      case 'jar_inspect_result': {
        log(`Inspected "${payload.data?.characterName || 'Character'}" successfully.`);
        showPreview(payload.data);

        if ((window as any).__jar_auto_import) {
          (window as any).__jar_auto_import = false;
          // If already public, import directly; otherwise trigger capture
          if (payload.data?.cardPublic) {
            importBtn.click();
          } else {
            ripBtn.click();
          }
        }
        break;
      }

      case 'jar_capture_result': {
        ripBtn.disabled = false;
        ripBtn.textContent = 'Capture Completed';
        log(`Extracted character & lorebook successfully!`);
        if (payload.data) {
          showPreview(payload.data);
          importBtn.click();
        }
        break;
      }

      case 'jar_list_captures_result': {
        renderHistory(payload.captures);
        break;
      }

      case 'jar_get_capture_result': {
        if (payload.capture) {
          showPreview(payload.capture);
          if ((window as any).__jar_auto_import) {
            (window as any).__jar_auto_import = false;
            importBtn.click();
          }
        }
        break;
      }

      case 'import_result': {
        importBtn.disabled = false;
        importBtn.textContent = 'Imported ✓';
        log(`Successfully imported "${payload.characterName}" into Lumiverse! Character ID: ${payload.characterId}`);
        break;
      }

      default: {
        if (payload.type.endsWith('_error')) {
          log(`Error: ${payload.error}`);
          isSearching = false;
          searchBtn.disabled = false;
          searchBtn.textContent = 'Search';
          ripBtn.disabled = false;
          ripBtn.textContent = '⚡ Extract Prompt & Lorebook';
          importBtn.disabled = false;
          importBtn.textContent = '📥 Import to Lumiverse';
        }
        break;
      }
    }
  });

  // Initial connection check
  checkStatus();
  setInterval(checkStatus, 15000);

  return () => {
    unsubBackend();
    tab.destroy();
  };
}
