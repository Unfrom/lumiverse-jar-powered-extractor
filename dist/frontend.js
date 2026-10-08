var q="jar_ripper_base_url";function l(){try{return localStorage.getItem(q)||"http://localhost:4577"}catch{return"http://localhost:4577"}}function G(n){try{localStorage.setItem(q,n)}catch{}}function V(n){let b=!1,I="search",s=null,k="",h=!1,K=!1,O=!1,S=n.ui.registerDrawerTab({id:"jar-character-ripper",title:"JAR Janitor Character Ripper",shortName:"JAR",description:"Search, extract, and import JanitorAI character cards & lorebooks",keywords:["janitor","jar","ripper","search","character","scrape","lorebook","import"],headerTitle:"JAR Ripper",iconSvg:`
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
        <path d="M12 12l4 4m0-4l-4 4"></path>
      </svg>
    `}),r=S.root;r.innerHTML=`
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
          \u2699\uFE0F Settings
        </button>
      </div>

      <!-- Settings Collapsible -->
      <div id="jar-settings-panel" style="display: none; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px;">
        <label style="font-size: 11px; display: block; margin-bottom: 4px;">JAR Server URL:</label>
        <div style="display: flex; gap: 6px;">
          <input id="jar-url-input" class="jar-input" style="padding: 4px 8px; font-size: 12px;" value="${l()}" />
          <button id="jar-url-save" class="jar-btn" style="padding: 4px 10px; font-size: 12px;">Save</button>
        </div>
      </div>

      <!-- Nav Tabs -->
      <div class="jar-nav">
        <button id="jar-tab-search" class="jar-nav-btn active">\u{1F50D} Search Janitor</button>
        <button id="jar-tab-url" class="jar-nav-btn">\u{1F517} Direct URL</button>
        <button id="jar-tab-history" class="jar-nav-btn">\u{1F4C2} JAR Captures</button>
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
        <div class="jar-search-bar">
          <input id="jar-url-scrape-input" class="jar-input" placeholder="Paste JanitorAI character URL or UUID..." />
          <button id="jar-inspect-btn" class="jar-btn">Inspect</button>
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
            \u26A1 Extract Prompt & Lorebook
          </button>
          <button id="jar-import-btn" class="jar-btn jar-btn-success" style="flex: 1;">
            \u{1F4E5} Import to Lumiverse
          </button>
        </div>
      </div>
    </div>
  `;let H=r.querySelector("#jar-status-dot"),w=r.querySelector("#jar-status-text"),v=r.querySelector("#jar-log"),M=r.querySelector("#jar-sec-search"),R=r.querySelector("#jar-sec-url"),$=r.querySelector("#jar-sec-history"),y=r.querySelector("#jar-search-results"),L=r.querySelector("#jar-search-input"),u=r.querySelector("#jar-search-btn"),A=r.querySelector("#jar-url-scrape-input"),B=r.querySelector("#jar-inspect-btn"),z=r.querySelector("#jar-preview-area"),_=r.querySelector("#jar-prev-img"),J=r.querySelector("#jar-prev-name"),E=r.querySelector("#jar-prev-badge"),U=r.querySelector("#jar-prev-creator"),N=r.querySelector("#jar-prev-tags"),P=r.querySelector("#jar-prev-summary"),c=r.querySelector("#jar-rip-btn"),i=r.querySelector("#jar-import-btn"),g=r.querySelector("#jar-history-list");function d(e){v.style.display="block";let a=document.createElement("div");a.textContent=`[${new Date().toLocaleTimeString()}] ${e}`,v.appendChild(a),v.scrollTop=v.scrollHeight}function x(){n.sendToBackend({type:"jar_get_status",baseUrl:l()})}function m(e){I=e,["search","url","history"].forEach(a=>{let t=r.querySelector(`#jar-tab-${a}`);t&&t.classList.toggle("active",a===e)}),M.style.display=e==="search"?"flex":"none",R.style.display=e==="url"?"flex":"none",$.style.display=e==="history"?"flex":"none",e==="history"&&n.sendToBackend({type:"jar_list_captures",baseUrl:l()})}r.querySelector("#jar-tab-search")?.addEventListener("click",()=>m("search")),r.querySelector("#jar-tab-url")?.addEventListener("click",()=>m("url")),r.querySelector("#jar-tab-history")?.addEventListener("click",()=>m("history")),r.querySelector("#jar-refresh-history")?.addEventListener("click",()=>{n.sendToBackend({type:"jar_list_captures",baseUrl:l()})}),r.querySelector("#jar-settings-btn")?.addEventListener("click",()=>{let e=r.querySelector("#jar-settings-panel");e.style.display=e.style.display==="none"?"block":"none"}),r.querySelector("#jar-url-save")?.addEventListener("click",()=>{let e=r.querySelector("#jar-url-input").value.trim();e&&(G(e),x(),r.querySelector("#jar-settings-panel").style.display="none")});function T(){let e=L.value.trim();e&&(k=e,h=!0,u.disabled=!0,u.textContent="Searching...",y.innerHTML='<div style="color:var(--lumiverse-text-dim);font-size:12px;padding:8px;">Searching JanitorAI via JAR browser session...</div>',d(`Searching for "${e}"...`),n.sendToBackend({type:"jar_search",query:e,baseUrl:l()}))}u.addEventListener("click",T),L.addEventListener("keydown",e=>{e.key==="Enter"&&T()});function D(e){h=!1,u.disabled=!1,u.textContent="Search",y.innerHTML="";let a=Array.isArray(e?.data)?e.data:Array.isArray(e)?e:[];if(a.length===0){y.innerHTML='<div style="color:var(--lumiverse-text-dim);font-size:12px;padding:8px;">No characters found. Try different keywords.</div>';return}a.forEach(t=>{let o=document.createElement("div");o.className="jar-char-card";let p=t.avatar?t.avatar.startsWith("http")?t.avatar:`https://ella.janitorai.com/bot-avatars/${t.avatar}?width=300`:"",Q=Array.isArray(t.tags)?t.tags.map(f=>typeof f=="string"?f:f.name||f.slug).join(", "):"";o.innerHTML=`
        <img src="${p}" alt="${t.name||"Character"}" loading="lazy" />
        <div class="jar-char-card-body">
          <div class="jar-char-name" title="${t.name||""}">${t.name||"Unnamed"}</div>
          <div class="jar-char-creator">by ${t.creator_name||t.creator||"unknown"}</div>
          <div class="jar-char-desc">${t.description||""}</div>
          <div class="jar-char-actions">
            <button class="jar-btn jar-btn-secondary inspect-btn">Inspect</button>
            <button class="jar-btn jar-btn-success rip-btn">Rip & Import</button>
          </div>
        </div>
      `,o.querySelector(".inspect-btn")?.addEventListener("click",()=>{C(t.id||t.character_id)}),o.querySelector(".rip-btn")?.addEventListener("click",()=>{W(t.id||t.character_id)}),y.appendChild(o)})}function C(e){d(`Inspecting character ${e}...`),n.sendToBackend({type:"jar_inspect",url:e,baseUrl:l()})}function W(e){d(`Starting auto-rip and import for ${e}...`),n.sendToBackend({type:"jar_inspect",url:e,baseUrl:l()}),window.__jar_auto_import=!0}B.addEventListener("click",()=>{let e=A.value.trim();e&&C(e)});function j(e){s=e,z.style.display="flex";let a=e.character||e,t=a.name||e.characterName||"Character";J.textContent=t;let o=e.cardPublic===!0||a.definitionSource==="catalog";E.textContent=o?"Public Card":"Private Card (Capture Required)",E.className=`jar-badge ${o?"public":"private"}`,U.textContent=a.creator||e.meta&&e.meta.creator_name?`by ${a.creator||e.meta.creator_name}`:"",N.textContent=Array.isArray(a.tags)?a.tags.join(" \u2022 "):"";let p=e.avatarBase64||a.avatarBase64||e.meta&&e.meta.avatar;p?_.src=p.startsWith("http")||p.startsWith("data:")?p:`https://ella.janitorai.com/bot-avatars/${p}?width=300`:_.src="",P.textContent=a.description||e.context&&e.context.description||"No description provided.",o?(c.style.display="none",i.textContent="\u{1F4E5} Import to Lumiverse"):(c.style.display="inline-flex",c.textContent=e.payload?"\u{1F504} Re-Capture Prompt":"\u26A1 Extract Prompt & Lorebook",i.textContent=e.payload?"\u{1F4E5} Import Extracted Card":"\u{1F4E5} Import Public Info")}c.addEventListener("click",()=>{!s||!s.id||(d("Triggering prompt capture via JAR browser session..."),c.disabled=!0,c.textContent="Extracting in browser...",n.sendToBackend({type:"jar_capture",id:s.id,force:!0,baseUrl:l()}))}),i.addEventListener("click",()=>{if(!s)return;let e=s.character||s;d(`Importing "${e.name}" into Lumiverse library...`),i.disabled=!0,i.textContent="Importing...",n.sendToBackend({type:"import_to_lumiverse",character:e,avatarBase64:s.avatarBase64||e.avatarBase64,worldInfo:s.worldInfo||s.privateLorebookReconstruction?.worldInfo,publicLorebooks:s.publicLorebooks,sourceUrl:s.url})});function F(e){if(g.innerHTML="",!e||e.length===0){g.innerHTML='<div style="color:var(--lumiverse-text-dim);font-size:12px;padding:8px;">No captures saved on JAR yet.</div>';return}e.forEach(a=>{let t=document.createElement("div");t.className="jar-char-card";let o=a.characterName||a.character?.name||"Saved Capture",p=`${l()}/api/captures/${a.id}/avatar`;t.innerHTML=`
        <img src="${p}" alt="${o}" onerror="this.style.display='none'" />
        <div class="jar-char-card-body">
          <div class="jar-char-name">${o}</div>
          <div class="jar-char-creator">${new Date(a.ts||Date.now()).toLocaleDateString()}</div>
          <div class="jar-char-actions">
            <button class="jar-btn jar-btn-secondary load-btn">Load</button>
            <button class="jar-btn jar-btn-success import-btn">Import</button>
          </div>
        </div>
      `,t.querySelector(".load-btn")?.addEventListener("click",()=>{n.sendToBackend({type:"jar_get_capture",id:a.id,baseUrl:l()})}),t.querySelector(".import-btn")?.addEventListener("click",()=>{n.sendToBackend({type:"jar_get_capture",id:a.id,baseUrl:l()}),window.__jar_auto_import=!0}),g.appendChild(t)})}let Y=n.onBackendMessage(e=>{if(!(!e||!e.type))switch(e.type){case"jar_status_result":{b=!!e.online,H.className=`jar-status-dot ${b?"online":""}`,b?w.textContent=`JAR v${e.version||"0.4.0"} Online ${e.loggedIn?"(Logged In)":""}`:w.textContent="JAR Offline (Run npm start in JAR)";break}case"jar_search_result":{D(e.data),d(`Search completed for "${k}"`);break}case"jar_inspect_result":{d(`Inspected "${e.data?.characterName||"Character"}" successfully.`),j(e.data),window.__jar_auto_import&&(window.__jar_auto_import=!1,e.data?.cardPublic?i.click():c.click());break}case"jar_capture_result":{c.disabled=!1,c.textContent="Capture Completed",d("Extracted character & lorebook successfully!"),e.data&&(j(e.data),i.click());break}case"jar_list_captures_result":{F(e.captures);break}case"jar_get_capture_result":{e.capture&&(j(e.capture),window.__jar_auto_import&&(window.__jar_auto_import=!1,i.click()));break}case"import_result":{i.disabled=!1,i.textContent="Imported \u2713",d(`Successfully imported "${e.characterName}" into Lumiverse! Character ID: ${e.characterId}`);break}default:{e.type.endsWith("_error")&&(d(`Error: ${e.error}`),h=!1,u.disabled=!1,u.textContent="Search",c.disabled=!1,c.textContent="\u26A1 Extract Prompt & Lorebook",i.disabled=!1,i.textContent="\u{1F4E5} Import to Lumiverse");break}}});return x(),setInterval(x,15e3),()=>{Y(),S.destroy()}}export{V as setup};
