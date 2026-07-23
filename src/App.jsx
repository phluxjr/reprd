import { useState, useEffect, useRef } from "react";

const THEMES = {
  gruvbox: { name:"gruvbox", bg:"#282828", sidebar:"#1d2021", card:"#3c3836", border:"#504945", text:"#ebdbb2", muted:"#a89984", accent:"#d79921", accentText:"#fabd2f", accentBg:"#3c3836", success:"#98971a", warning:"#d65d0e", danger:"#cc241d", pro:"#b16286" },
  catppuccin: { name:"catppuccin mocha", bg:"#1e1e2e", sidebar:"#181825", card:"#313244", border:"#45475a", text:"#cdd6f4", muted:"#6c7086", accent:"#89b4fa", accentText:"#89b4fa", accentBg:"#1e1e2e", success:"#a6e3a1", warning:"#fab387", danger:"#f38ba8", pro:"#cba6f7" },
  tokyonight: { name:"tokyo night", bg:"#1a1b26", sidebar:"#16161e", card:"#24283b", border:"#414868", text:"#c0caf5", muted:"#565f89", accent:"#7aa2f7", accentText:"#7aa2f7", accentBg:"#1e2030", success:"#9ece6a", warning:"#e0af68", danger:"#f7768e", pro:"#bb9af7" },
  nord: { name:"nord", bg:"#2e3440", sidebar:"#242933", card:"#3b4252", border:"#4c566a", text:"#eceff4", muted:"#7b88a1", accent:"#88c0d0", accentText:"#88c0d0", accentBg:"#3b4252", success:"#a3be8c", warning:"#ebcb8b", danger:"#bf616a", pro:"#b48ead" },
  dracula: { name:"dracula", bg:"#282a36", sidebar:"#21222c", card:"#343746", border:"#44475a", text:"#f8f8f2", muted:"#6272a4", accent:"#bd93f9", accentText:"#bd93f9", accentBg:"#44475a", success:"#50fa7b", warning:"#ffb86c", danger:"#ff5555", pro:"#ff79c6" },
  solarized: { name:"solarized dark", bg:"#002b36", sidebar:"#073642", card:"#073642", border:"#586e75", text:"#839496", muted:"#586e75", accent:"#268bd2", accentText:"#268bd2", accentBg:"#073642", success:"#859900", warning:"#b58900", danger:"#dc322f", pro:"#d33682" },
  onedark: { name:"one dark", bg:"#282c34", sidebar:"#21252b", card:"#2c313c", border:"#3e4452", text:"#abb2bf", muted:"#5c6370", accent:"#61afef", accentText:"#61afef", accentBg:"#2c313c", success:"#98c379", warning:"#e5c07b", danger:"#e06c75", pro:"#c678dd" },
  rosepine: { name:"rose pine", bg:"#191724", sidebar:"#1f1d2e", card:"#26233a", border:"#403d52", text:"#e0def4", muted:"#6e6a86", accent:"#31748f", accentText:"#9ccfd8", accentBg:"#26233a", success:"#31748f", warning:"#f6c177", danger:"#eb6f92", pro:"#c4a7e7" },
};

const REPAIRABILITY_EXAMPLES = {
  1:"a fire tv",2:"a modern iphone",3:"a modern android",4:"a nintendo switch",
  5:"a modern hp laptop",6:"an old dvr",7:"an old dvd player",8:"an og xbox",
  9:"a thinkpad",10:"a framework laptop",
};

const TIME_LABELS = [
  "1 min","5 min","15 min","30 min","1 hr","2 hr","4 hr","8 hr",
  "1 day","3 days","1 week","1 month","6 months","1 year","2 years",
];

const TIME_PRESETS = [
  "1 min",
  "5 min",
  "15 min",
  "30 min",
  "1 hr",
  "2 hr",
  "4 hr",
  "8 hr",
  "12 hr",
  "1 day",
  "2 days",
  "3 days",
  "1 week",
  "2 weeks",
  "30 days"
];

function formatTime(t) {
  if (t == null || t === "") return "30 min";
  if (typeof t === "string") return t;
  if (typeof t === "number") {
    return TIME_PRESETS[t] || TIME_LABELS[t - 1] || `${t} min`;
  }
  return String(t);
}

function formatCost(val) {
  const n = parseFloat(val);
  if (isNaN(n) || n === 0) return null;
  return `$${n.toFixed(2)}`;
}

function getItemStatus(item) {
  if (item.status) return item.status;
  return item.done ? "done" : "todo";
}

const DIFFICULTY_LABELS = {1:"trivial",2:"easy",3:"easy",4:"moderate",5:"moderate",6:"involved",7:"involved",8:"hard",9:"hard",10:"expert"};

function encodeQueryParam(str) {
  if (!str) return "";
  return encodeURIComponent(str).replace(/%20/g, "+");
}

async function openExternal(url) {
  if (!url) return;
  const formattedUrl = url.trim().replace(/ /g, "+");
  if (window.__TAURI__) {
    try {
      const opener = window.__TAURI__.opener;
      if (opener && typeof opener.openUrl === "function") {
        await opener.openUrl(formattedUrl);
        return;
      }
      if (opener && typeof opener.open === "function") {
        await opener.open(formattedUrl);
        return;
      }
      if (window.__TAURI__.shell && typeof window.__TAURI__.shell.open === "function") {
        await window.__TAURI__.shell.open(formattedUrl);
        return;
      }
      if (window.__TAURI__.core && typeof window.__TAURI__.core.invoke === "function") {
        await window.__TAURI__.core.invoke("plugin:opener|open_url", { path: formattedUrl });
        return;
      }
    } catch (e) {
      console.warn("tauri opener failed, falling back to window.open", e);
    }
  }
  window.open(formattedUrl, "_blank", "noopener,noreferrer");
}

function openTracking(tracking) {
  if (!tracking) return;
  const t = tracking.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) {
    openExternal(t);
  } else {
    openExternal(`https://parcelsapp.com/en/tracking/${encodeQueryParam(t)}`);
  }
}

function buildShareText(entry, maxLen) {
  const costText = entry.cost ? ` | cost: $${parseFloat(entry.cost).toFixed(2)}` : "";
  const ratings = `time: ${formatTime(entry.time)}${costText} | repairability: ${entry.repairability}/10 | difficulty: ${entry.difficulty}/10`;
  const header = `reprd: ${entry.title}\n${ratings}\n\n`;
  const remaining = maxLen - header.length - 3;
  const body = entry.content.replace(/[#*`]/g, "").replace(/\n+/g, " ").trim();
  const truncated = body.length > remaining ? body.slice(0, remaining) + "..." : body;
  return header + truncated;
}

function buildMarkdown(entry) {
  const costLine = entry.cost ? `**cost:** $${parseFloat(entry.cost).toFixed(2)}\n` : "";
  return `# ${entry.title}

**date:** ${new Date(entry.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
**time taken:** ${formatTime(entry.time)}
${costLine}**repairability:** ${entry.repairability}/10 (like ${REPAIRABILITY_EXAMPLES[entry.repairability]})
**difficulty:** ${entry.difficulty}/10 (${DIFFICULTY_LABELS[entry.difficulty]})

---

${entry.content}
`;
}

function ShareMenu({ entry, onClose }) {
  const text300 = buildShareText(entry, 300);
  const text500 = buildShareText(entry, 500);

  const socials = [
    { label:"bluesky", icon:"ti-brand-bluesky", action:() => openExternal(`https://bsky.app/intent/compose?text=${encodeQueryParam(text300)}`) },
    { label:"mastodon", icon:"ti-brand-mastodon", action:() => openExternal(`https://mastodon.social/share?text=${encodeQueryParam(text500)}`) },
    { label:"twitter / x", icon:"ti-brand-x", action:() => openExternal(`https://x.com/intent/post?text=${encodeQueryParam(text300)}`) },
    { label:"threads", icon:"ti-brand-threads", action:() => openExternal(`https://www.threads.net/intent/post?text=${encodeQueryParam(text500)}`) },
    { label:"reddit", icon:"ti-brand-reddit", action:() => openExternal(`https://reddit.com/submit?title=${encodeQueryParam(entry.title)}&text=${encodeQueryParam(text500)}`) },
    { label:"lemmy", icon:"ti-brand-lemmy", action:() => openExternal(`https://lemmy.ml/create_post?name=${encodeQueryParam(entry.title)}&body=${encodeQueryParam(text500)}`) },
    {
      label:"copy as markdown", icon:"ti-markdown",
      action:() => {
        navigator.clipboard.writeText(buildMarkdown(entry));
        onClose();
      }
    },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onClose}>
      <div style={{ background:"var(--r-sidebar)", border:"1px solid var(--r-border)", borderRadius:10, padding:"8px", minWidth:200, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:11, color:"var(--r-muted)", fontFamily:"monospace", padding:"4px 8px 8px" }}>// share entry</div>
        {socials.map(s => (
          <button key={s.label} className="r-btn" onClick={() => { s.action(); onClose(); }}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"8px 10px", marginBottom:2, textAlign:"left", border:"none" }}>
            <i className={`ti ${s.icon}`} style={{ fontSize:14, flexShrink:0 }} aria-hidden="true" />
            <span style={{ fontSize:12 }}>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const isTauri = () => !!window.__TAURI__;

async function storageRead(key) {
  if (isTauri()) {
    try {
      const { readTextFile, BaseDirectory } = window.__TAURI__.fs;
      const text = await readTextFile(`reprd/${key}.json`, { baseDir: BaseDirectory.AppData });
      return JSON.parse(text);
    } catch { return null; }
  } else {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
}

async function storageWrite(key, val) {
  if (isTauri()) {
    try {
      const { writeTextFile, mkdir, BaseDirectory } = window.__TAURI__.fs;
      await mkdir("reprd", { baseDir: BaseDirectory.AppData, recursive: true }).catch(() => {});
      await writeTextFile(`reprd/${key}.json`, JSON.stringify(val), { baseDir: BaseDirectory.AppData });
    } catch (e) { console.error("storage write failed", e); }
  } else {
    localStorage.setItem(key, JSON.stringify(val));
  }
}

function useStorage(key, fallback) {
  const [val, setVal] = useState(fallback);
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    storageRead(key).then(r => { if (r != null) setVal(r); }).catch(() => {});
  }, [key]);
  const save = next => {
    setVal(next);
    storageWrite(key, next);
  };
  return [val, save];
}

function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries({
    "--r-bg":theme.bg,"--r-sidebar":theme.sidebar,"--r-card":theme.card,
    "--r-border":theme.border,"--r-text":theme.text,"--r-muted":theme.muted,
    "--r-accent":theme.accent,"--r-accent-text":theme.accentText,
    "--r-accent-bg":theme.accentBg,"--r-success":theme.success,
    "--r-warning":theme.warning,"--r-danger":theme.danger,"--r-pro":theme.pro,
  }).forEach(([k,v]) => root.style.setProperty(k,v));
}

const css = `
  .r-input { background:var(--r-card); border:1px solid var(--r-border); border-radius:6px; color:var(--r-text); padding:7px 10px; font-size:13px; font-family:monospace; width:100%; box-sizing:border-box; outline:none; }
  .r-input:focus { border-color:var(--r-accent); }
  .r-btn { background:var(--r-card); border:1px solid var(--r-border); border-radius:6px; color:var(--r-muted); padding:6px 14px; font-size:12px; font-family:monospace; cursor:pointer; transition:border-color 0.15s,color 0.15s; }
  .r-btn:hover { border-color:var(--r-accent); color:var(--r-accent-text); }
  .r-btn.accent { border-color:var(--r-accent); color:var(--r-accent-text); background:var(--r-accent-bg); }
  .r-card { background:var(--r-card); border:1px solid var(--r-border); border-radius:8px; padding:14px 16px; margin-bottom:10px; }
  .r-textarea { background:var(--r-card); border:1px solid var(--r-border); border-radius:6px; color:var(--r-text); padding:8px 10px; font-size:13px; font-family:monospace; width:100%; box-sizing:border-box; outline:none; resize:vertical; }
  .r-textarea:focus { border-color:var(--r-accent); }
  a { color:var(--r-accent-text); text-decoration:none; }
  .titlebar-btn { background:none; border:none; color:var(--r-muted); width:28px; height:24px; border-radius:4px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.15s, color 0.15s; }
  .titlebar-btn:hover { background:var(--r-card); color:var(--r-accent-text); }
  .titlebar-btn.close-btn:hover { background:var(--r-danger); color:#fff; }
`;

function TitleBar({ show }) {
  if (!show) return null;

  const getTauriWindow = () => {
    if (!window.__TAURI__) return null;
    if (window.__TAURI__.window?.getCurrentWindow) {
      return window.__TAURI__.window.getCurrentWindow();
    }
    if (window.__TAURI__.window?.appWindow) {
      return window.__TAURI__.window.appWindow;
    }
    return null;
  };

  const minimize = () => {
    const appWin = getTauriWindow();
    if (appWin) appWin.minimize();
  };

  const maximize = () => {
    const appWin = getTauriWindow();
    if (appWin) appWin.toggleMaximize();
  };

  const close = () => {
    const appWin = getTauriWindow();
    if (appWin) appWin.close();
  };

  return (
    <div data-tauri-drag-region style={{ height:32, background:"var(--r-sidebar)", borderBottom:"1px solid var(--r-border)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 10px", userSelect:"none", WebkitUserSelect:"none", flexShrink:0 }}>
      <div data-tauri-drag-region style={{ display:"flex", alignItems:"center", gap:8, flex:1, height:"100%" }}>
        <i className="ti ti-wrench" style={{ fontSize:14, color:"var(--r-accent-text)" }} aria-hidden="true" data-tauri-drag-region />
        <span style={{ fontSize:12, fontWeight:600, fontFamily:"monospace", color:"var(--r-text)", letterSpacing:-0.5 }} data-tauri-drag-region>reprd</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:2, height:"100%" }}>
        <button className="titlebar-btn" onClick={minimize} title="minimize">
          <i className="ti ti-minus" style={{ fontSize:12 }} aria-hidden="true" />
        </button>
        <button className="titlebar-btn" onClick={maximize} title="maximize">
          <i className="ti ti-square" style={{ fontSize:11 }} aria-hidden="true" />
        </button>
        <button className="titlebar-btn close-btn" onClick={close} title="close">
          <i className="ti ti-x" style={{ fontSize:12 }} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function Tag({ children, color }) {
  const colors = {
    accent:{ border:"var(--r-accent)", color:"var(--r-accent-text)", bg:"var(--r-accent-bg)" },
    success:{ border:"var(--r-success)", color:"var(--r-success)", bg:"transparent" },
    warning:{ border:"var(--r-warning)", color:"var(--r-warning)", bg:"transparent" },
    danger:{ border:"var(--r-danger)", color:"var(--r-danger)", bg:"transparent" },
    pro:{ border:"var(--r-pro)", color:"var(--r-pro)", bg:"transparent" },
  };
  const c = colors[color] || colors.accent;
  return <span style={{ fontSize:11, fontFamily:"monospace", padding:"2px 7px", borderRadius:4, border:`1px solid ${c.border}`, color:c.color, background:c.bg, display:"inline-flex", alignItems:"center", gap:3 }}>{children}</span>;
}

function TimePicker({ value, onChange }) {
  const isCustom = typeof value === "string" && !TIME_PRESETS.includes(value);
  const presetIndex = typeof value === "number" ? value : TIME_PRESETS.indexOf(value);
  const sliderPos = presetIndex >= 0 ? presetIndex : 3;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "var(--r-muted)", fontFamily: "monospace" }}>time taken</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--r-accent-text)", fontFamily: "monospace", fontWeight: 600 }}>
            {formatTime(value)}
          </span>
          <button
            type="button"
            className={`r-btn ${isCustom ? "accent" : ""}`}
            onClick={() => {
              if (!isCustom) {
                onChange("45 min");
              } else {
                onChange(TIME_PRESETS[sliderPos >= 0 ? sliderPos : 3]);
              }
            }}
            style={{ fontSize: 10, padding: "2px 8px" }}
          >
            {isCustom ? "use slider" : "custom time"}
          </button>
        </div>
      </div>

      {!isCustom ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
          <span style={{ fontSize: 10, color: "var(--r-muted)", fontFamily: "monospace", flexShrink: 0 }}>1 min</span>
          <input
            type="range"
            min={0}
            max={TIME_PRESETS.length - 1}
            value={sliderPos >= 0 ? sliderPos : 3}
            onChange={(e) => {
              const idx = parseInt(e.target.value, 10);
              onChange(TIME_PRESETS[idx]);
            }}
            style={{ flex: 1, accentColor: "var(--r-accent)", cursor: "pointer" }}
          />
          <span style={{ fontSize: 10, color: "var(--r-muted)", fontFamily: "monospace", flexShrink: 0 }}>30 days</span>
        </div>
      ) : (
        <input
          className="r-input"
          placeholder="custom time (e.g. 45 min, 2.5 days, 3 weeks)"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          style={{ fontSize: 12 }}
        />
      )}
    </div>
  );
}

function StarRow({ value, onChange, label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
      <span style={{ fontSize:12, color:"var(--r-muted)", fontFamily:"monospace", minWidth:100 }}>{label}</span>
      <div style={{ display:"flex", gap:3 }}>
        {Array.from({length:10},(_,i)=>i+1).map(n => (
          <button key={n} onClick={()=>onChange(n)} style={{
            width:22, height:22, borderRadius:4,
            border:`1px solid ${n<=value?"var(--r-accent)":"var(--r-border)"}`,
            background:n<=value?"var(--r-accent-bg)":"transparent",
            color:n<=value?"var(--r-accent-text)":"var(--r-muted)",
            fontSize:11, fontFamily:"monospace", cursor:"pointer", padding:0,
          }}>{n}</button>
        ))}
      </div>
      {value>0 && <span style={{ fontSize:11, color:"var(--r-accent-text)", fontFamily:"monospace" }}>
        {label==="repairability" ? REPAIRABILITY_EXAMPLES[value] : DIFFICULTY_LABELS[value]}
      </span>}
    </div>
  );
}

function MarkdownRenderer({ content }) {
  const html = (content || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/\[(.+?)\]\((https?:\/\/.+?)\)/g,"<a href='$2' target='_blank' rel='noopener noreferrer' style='color:var(--r-accent-text);text-decoration:underline'>$1</a>")
    .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,"<em>$1</em>")
    .replace(/`(.+?)`/g,"<code style='background:var(--r-card);padding:1px 5px;border-radius:3px;font-family:monospace;font-size:12px;border:1px solid var(--r-border)'>$1</code>")
    .replace(/^### (.+)$/gm,"<h3 style='font-size:13px;font-weight:600;margin:10px 0 4px;color:var(--r-accent-text)'>$1</h3>")
    .replace(/^## (.+)$/gm,"<h2 style='font-size:14px;font-weight:600;margin:12px 0 5px;color:var(--r-accent-text)'>$1</h2>")
    .replace(/^# (.+)$/gm,"<h1 style='font-size:15px;font-weight:600;margin:14px 0 6px;color:var(--r-accent-text)'>$1</h1>")
    .replace(/^- (.+)$/gm,"<li style='margin:2px 0;color:var(--r-text)'>$1</li>")
    .replace(/\n\n/g,"<br><br>").replace(/\n/g,"<br>");

  const handleClick = (e) => {
    const anchor = e.target.closest("a");
    if (anchor && anchor.href) {
      e.preventDefault();
      openExternal(anchor.href);
    }
  };

  return <div onClick={handleClick} style={{ fontSize:13, lineHeight:1.75, color:"var(--r-text)", fontFamily:"monospace" }} dangerouslySetInnerHTML={{ __html:html }} />;
}

function DashboardView({ entries, queue, setQueue, parts, setParts, tools, setTab }) {
  const completedRepairs = entries.length;
  const queueStarted = queue.filter(q => getItemStatus(q) === "started");
  const queueTodo = queue.filter(q => getItemStatus(q) === "todo").length;
  const queueDone = queue.filter(q => getItemStatus(q) === "done").length;

  const activeParts = parts.filter(p => p.status === "ordered" || p.status === "shipped");
  const deliveredPartsCount = parts.filter(p => p.status === "delivered" || p.status === "installed").length;

  const partsCostTotal = parts.reduce((acc, p) => acc + (parseFloat(p.cost) || 0), 0);
  const journalCostTotal = entries.reduce((acc, e) => acc + (parseFloat(e.cost) || 0), 0);
  const queueCostTotal = queue.reduce((acc, q) => acc + (parseFloat(q.cost) || 0), 0);
  const toolsCostTotal = tools.reduce((acc, t) => acc + (parseFloat(t.cost) || 0), 0);
  const totalCostAll = partsCostTotal + journalCostTotal + toolsCostTotal + queueCostTotal;

  const avgRepairability = entries.length ? (entries.reduce((acc, e) => acc + (e.repairability || 0), 0) / entries.length).toFixed(1) : "0.0";
  const avgDifficulty = entries.length ? (entries.reduce((acc, e) => acc + (e.difficulty || 0), 0) / entries.length).toFixed(1) : "0.0";

  const markQueueDone = (id) => {
    setQueue(queue.map(q => q.id === id ? { ...q, status: "done", done: true } : q));
  };

  const cyclePart = (id) => {
    const nextMap = { ordered: "shipped", shipped: "delivered", delivered: "installed", installed: "ordered" };
    setParts(parts.map(p => p.id === id ? { ...p, status: nextMap[p.status] || "ordered" } : p));
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "var(--r-text)", marginBottom: 4 }}>
          workbench overview
        </div>
        <div style={{ fontSize: 12, color: "var(--r-muted)", fontFamily: "monospace" }}>
          stats, ongoing repairs & cost summary
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div className="r-card" style={{ marginBottom: 0, borderColor: "var(--r-border)" }}>
          <div style={{ fontSize: 11, color: "var(--r-muted)", fontFamily: "monospace", marginBottom: 6 }}>completed repairs</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--r-accent-text)", fontFamily: "monospace" }}>{completedRepairs}</div>
          <div style={{ fontSize: 11, color: "var(--r-muted)", fontFamily: "monospace", marginTop: 4 }}>
            avg repairability: {avgRepairability}/10
          </div>
        </div>

        <div className="r-card" style={{ marginBottom: 0, borderColor: queueStarted.length > 0 ? "var(--r-warning)" : "var(--r-border)" }}>
          <div style={{ fontSize: 11, color: "var(--r-muted)", fontFamily: "monospace", marginBottom: 6 }}>queue items</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--r-warning)", fontFamily: "monospace" }}>{queueStarted.length} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--r-muted)" }}>started</span></div>
          <div style={{ fontSize: 11, color: "var(--r-muted)", fontFamily: "monospace", marginTop: 4 }}>
            {queueTodo} queued / {queueDone} done
          </div>
        </div>

        <div className="r-card" style={{ marginBottom: 0, borderColor: activeParts.length > 0 ? "var(--r-pro)" : "var(--r-border)" }}>
          <div style={{ fontSize: 11, color: "var(--r-muted)", fontFamily: "monospace", marginBottom: 6 }}>parts on order</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--r-pro)", fontFamily: "monospace" }}>{activeParts.length}</div>
          <div style={{ fontSize: 11, color: "var(--r-muted)", fontFamily: "monospace", marginTop: 4 }}>
            {deliveredPartsCount} delivered / installed
          </div>
        </div>

        <div className="r-card" style={{ marginBottom: 0, borderColor: "var(--r-success)" }}>
          <div style={{ fontSize: 11, color: "var(--r-muted)", fontFamily: "monospace", marginBottom: 6 }}>total cost spent</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--r-success)", fontFamily: "monospace" }}>${totalCostAll.toFixed(2)}</div>
          <div style={{ fontSize: 11, color: "var(--r-muted)", fontFamily: "monospace", marginTop: 4 }}>
            parts, tools & repairs
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <button className="r-btn accent" onClick={() => setTab("journal")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" /> log repair
        </button>
        <button className="r-btn" onClick={() => setTab("queue")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-list-check" style={{ fontSize: 13 }} aria-hidden="true" /> add to queue
        </button>
        <button className="r-btn" onClick={() => setTab("parts")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-package" style={{ fontSize: 13 }} aria-hidden="true" /> track part
        </button>
        <button className="r-btn" onClick={() => setTab("toolbox")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-tools" style={{ fontSize: 13 }} aria-hidden="true" /> add tool
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div className="r-card" style={{ marginBottom: 0, borderColor: "var(--r-accent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--r-text)", fontFamily: "monospace" }}>
              // repairs in progress ({queueStarted.length})
            </div>
            <button className="r-btn" onClick={() => setTab("queue")} style={{ fontSize: 11, padding: "2px 8px" }}>view queue</button>
          </div>
          {queueStarted.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--r-muted)", padding: "16px 0", textAlign: "center" }}>
              no active repairs in progress. select an item from the queue to start.
            </div>
          ) : (
            queueStarted.map(item => (
              <div key={item.id} style={{ background: "var(--r-bg)", border: "1px solid var(--r-border)", borderRadius: 6, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--r-text)" }}>{item.device}</div>
                    <div style={{ fontSize: 11, color: "var(--r-muted)", marginTop: 2 }}>{item.issue}</div>
                    {item.cost > 0 && <div style={{ fontSize: 11, color: "var(--r-success)", marginTop: 4 }}>est cost: ${parseFloat(item.cost).toFixed(2)}</div>}
                  </div>
                  <button className="r-btn accent" onClick={() => markQueueDone(item.id)} style={{ fontSize: 11, padding: "3px 8px" }}>
                    finish
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="r-card" style={{ marginBottom: 0, borderColor: "var(--r-pro)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--r-text)", fontFamily: "monospace" }}>
              // incoming parts & shipments ({activeParts.length})
            </div>
            <button className="r-btn" onClick={() => setTab("parts")} style={{ fontSize: 11, padding: "2px 8px" }}>view parts</button>
          </div>
          {activeParts.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--r-muted)", padding: "16px 0", textAlign: "center" }}>
              no parts on order right now.
            </div>
          ) : (
            activeParts.map(part => (
              <div key={part.id} style={{ background: "var(--r-bg)", border: "1px solid var(--r-border)", borderRadius: 6, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--r-text)" }}>{part.name}</div>
                    <div style={{ fontSize: 11, color: "var(--r-muted)", marginTop: 2 }}>
                      {part.device ? `${part.device} • ` : ""}{part.vendor || "custom vendor"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Tag color={part.status === "shipped" ? "pro" : "warning"}>{part.status}</Tag>
                    {part.tracking && (
                      <button className="r-btn" onClick={() => openTracking(part.tracking)} style={{ fontSize: 10, padding: "2px 6px" }}>
                        <i className="ti ti-truck" style={{ fontSize: 10 }} aria-hidden="true" /> track
                      </button>
                    )}
                    <button className="r-btn" onClick={() => cyclePart(part.id)} style={{ fontSize: 10, padding: "2px 6px" }}>
                      next
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="r-card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--r-text)", fontFamily: "monospace", marginBottom: 12 }}>
          // cost breakdown
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          <div style={{ background: "var(--r-bg)", padding: "10px 12px", borderRadius: 6, border: "1px solid var(--r-border)" }}>
            <div style={{ fontSize: 10, color: "var(--r-muted)" }}>parts cost</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--r-success)", marginTop: 2 }}>${partsCostTotal.toFixed(2)}</div>
          </div>
          <div style={{ background: "var(--r-bg)", padding: "10px 12px", borderRadius: 6, border: "1px solid var(--r-border)" }}>
            <div style={{ fontSize: 10, color: "var(--r-muted)" }}>repair logs cost</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--r-accent-text)", marginTop: 2 }}>${journalCostTotal.toFixed(2)}</div>
          </div>
          <div style={{ background: "var(--r-bg)", padding: "10px 12px", borderRadius: 6, border: "1px solid var(--r-border)" }}>
            <div style={{ fontSize: 10, color: "var(--r-muted)" }}>tools cost</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--r-pro)", marginTop: 2 }}>${toolsCostTotal.toFixed(2)}</div>
          </div>
          <div style={{ background: "var(--r-bg)", padding: "10px 12px", borderRadius: 6, border: "1px solid var(--r-border)" }}>
            <div style={{ fontSize: 10, color: "var(--r-muted)" }}>queued repairs est.</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--r-warning)", marginTop: 2 }}>${queueCostTotal.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--r-text)", fontFamily: "monospace", marginBottom: 10 }}>
          // recent repair logs
        </div>
        {entries.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--r-muted)", fontFamily: "monospace" }}>no journal entries logged yet.</div>
        ) : (
          entries.slice(0, 3).map(e => (
            <div key={e.id} className="r-card" style={{ padding: "10px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--r-text)" }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: "var(--r-muted)", marginTop: 2 }}>
                    {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • time: {formatTime(e.time)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {e.cost > 0 && <Tag color="success">${parseFloat(e.cost).toFixed(2)}</Tag>}
                  <Tag color="accent">repair {e.repairability}/10</Tag>
                  <Tag color="warning">diff {e.difficulty}/10</Tag>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function JournalView({ entries, setEntries }) {
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [shareEntry, setShareEntry] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [time, setTime] = useState("30 min");
  const [cost, setCost] = useState("");
  const [repairability, setRepairability] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [preview, setPreview] = useState(false);

  const canSave = title.trim() && content.trim() && repairability>0 && difficulty>0;

  const save = () => {
    if (!canSave) return;
    setEntries([{ id:Date.now(), date:new Date().toISOString(), title, content, time, cost: parseFloat(cost)||0, repairability, difficulty }, ...entries]);
    setShowNew(false); setTitle(""); setContent(""); setTime("30 min"); setCost(""); setRepairability(0); setDifficulty(0); setPreview(false);
  };

  return (
    <div>
      {shareEntry && <ShareMenu entry={shareEntry} onClose={() => setShareEntry(null)} />}

      {!showNew ? (
        <button className="r-btn accent" onClick={() => setShowNew(true)} style={{ marginBottom:16, display:"flex", alignItems:"center", gap:6 }}>
          <i className="ti ti-plus" style={{ fontSize:13 }} aria-hidden="true" /> new entry
        </button>
      ) : (
        <div className="r-card" style={{ borderColor:"var(--r-accent)", marginBottom:16 }}>
          <input className="r-input" placeholder="device + repair (e.g. thinkpad edge thermal paste reapply)" value={title} onChange={e=>setTitle(e.target.value)} style={{ marginBottom:10, fontSize:14, fontWeight:600 }} />
          <div style={{ display:"flex", gap:6, marginBottom:8 }}>
            {["write","preview"].map(m => (
              <button key={m} className={`r-btn ${preview===(m==="preview")?"accent":""}`} onClick={()=>setPreview(m==="preview")} style={{ fontSize:11 }}>{m}</button>
            ))}
          </div>
          {preview
            ? <div style={{ minHeight:120, padding:"4px 0", marginBottom:12 }}><MarkdownRenderer content={content||"_nothing yet_"} /></div>
            : <textarea className="r-textarea" rows={6} placeholder="your thoughts (markdown supported)" value={content} onChange={e=>setContent(e.target.value)} style={{ marginBottom:12 }} />
          }
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input className="r-input" type="number" step="0.01" placeholder="cost ($ optional e.g. 14.99)" value={cost} onChange={e=>setCost(e.target.value)} style={{ flex: 1 }} />
          </div>
          <TimePicker value={time} onChange={setTime} />
          <StarRow value={repairability} onChange={setRepairability} label="repairability" />
          <StarRow value={difficulty} onChange={setDifficulty} label="difficulty" />
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <button className={`r-btn ${canSave?"accent":""}`} onClick={save}>save entry</button>
            <button className="r-btn" onClick={()=>setShowNew(false)}>cancel</button>
          </div>
        </div>
      )}

      {entries.length===0 && !showNew && (
        <div style={{ textAlign:"center", padding:"4rem 0", color:"var(--r-muted)", fontFamily:"monospace" }}>
          <i className="ti ti-book" style={{ fontSize:36, display:"block", marginBottom:12 }} aria-hidden="true" />
          <span style={{ fontSize:13 }}>no entries yet. fix something.</span>
        </div>
      )}

      {entries.map(e => (
        <div key={e.id} className="r-card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:14, fontFamily:"monospace", color:"var(--r-text)", marginBottom:4 }}>{e.title}</div>
              <div style={{ fontSize:11, color:"var(--r-muted)", fontFamily:"monospace", marginBottom:8 }}>
                {new Date(e.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <Tag color="accent"><i className="ti ti-clock" style={{ fontSize:10 }} aria-hidden="true" />{formatTime(e.time)}</Tag>
                {e.cost > 0 && <Tag color="success"><i className="ti ti-currency-dollar" style={{ fontSize:10 }} aria-hidden="true" />${parseFloat(e.cost).toFixed(2)}</Tag>}
                <Tag color="success">repair {e.repairability}/10</Tag>
                <Tag color="warning">difficulty {e.difficulty}/10</Tag>
              </div>
            </div>
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              <button className="r-btn" onClick={()=>setExpanded(expanded===e.id?null:e.id)} style={{ fontSize:11 }}>
                {expanded===e.id?"hide":"read"}
              </button>
              <button className="r-btn" onClick={()=>setShareEntry(e)} style={{ fontSize:11, display:"flex", alignItems:"center", gap:4 }}>
                <i className="ti ti-share" style={{ fontSize:11 }} aria-hidden="true" />share
              </button>
              <button className="r-btn" onClick={()=>setEntries(entries.filter(x=>x.id!==e.id))} style={{ fontSize:11, borderColor:"var(--r-danger)", color:"var(--r-danger)" }}>
                <i className="ti ti-trash" style={{ fontSize:11 }} aria-hidden="true" />
              </button>
            </div>
          </div>
          {expanded===e.id && (
            <div style={{ borderTop:`1px solid var(--r-border)`, marginTop:12, paddingTop:12 }}>
              <MarkdownRenderer content={e.content} />
              {e.repairability>0 && <p style={{ fontSize:11, color:"var(--r-muted)", marginTop:10, fontFamily:"monospace", fontStyle:"italic" }}>repairability like {REPAIRABILITY_EXAMPLES[e.repairability]}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function QueueView({ queue, setQueue }) {
  const [showNew, setShowNew] = useState(false);
  const [device, setDevice] = useState("");
  const [issue, setIssue] = useState("");
  const [type, setType] = useState("repair");
  const [guideUrl, setGuideUrl] = useState("");
  const [cost, setCost] = useState("");
  const [initialStatus, setInitialStatus] = useState("todo");

  const save = () => {
    if (!device.trim()||!issue.trim()) return;
    setQueue([...queue,{id:Date.now(),device,issue,type,guideUrl,cost:parseFloat(cost)||0,status:initialStatus,done:initialStatus==="done"}]);
    setShowNew(false); setDevice(""); setIssue(""); setType("repair"); setGuideUrl(""); setCost(""); setInitialStatus("todo");
  };

  const cycleStatus = (id) => {
    setQueue(queue.map(q => {
      if (q.id !== id) return q;
      const cur = getItemStatus(q);
      const nextMap = { todo: "started", started: "done", done: "todo" };
      const next = nextMap[cur] || "todo";
      return { ...q, status: next, done: next === "done" };
    }));
  };

  const startedItems = queue.filter(q => getItemStatus(q) === "started");
  const todoItems = queue.filter(q => getItemStatus(q) === "todo");
  const doneItems = queue.filter(q => getItemStatus(q) === "done");

  const QItem = ({item}) => {
    const st = getItemStatus(item);
    return (
      <div className="r-card" style={{ opacity:st==="done"?0.6:1, borderColor:st==="started"?"var(--r-warning)":"var(--r-border)" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
          <button onClick={()=>cycleStatus(item.id)} title="click to change status (todo -> started -> done)"
            style={{ width:22,height:22,borderRadius:4,border:`1px solid var(--r-border)`,background:st==="done"?"var(--r-accent-bg)":st==="started"?"var(--r-warning)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,color:st==="started"?"#fff":"var(--r-accent-text)" }}>
            {st==="done" && <i className="ti ti-check" style={{ fontSize:12 }} aria-hidden="true" />}
            {st==="started" && <i className="ti ti-player-play-filled" style={{ fontSize:10 }} aria-hidden="true" />}
            {st==="todo" && <i className="ti ti-minus" style={{ fontSize:10, color:"var(--r-muted)" }} aria-hidden="true" />}
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, fontSize:13, fontFamily:"monospace", color:"var(--r-text)", textDecoration:st==="done"?"line-through":"none" }}>{item.device}</div>
            <div style={{ fontSize:12, color:"var(--r-muted)", fontFamily:"monospace", marginTop:2 }}>{item.issue}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
              {item.guideUrl && (
                <button onClick={()=>openExternal(item.guideUrl)} style={{ fontSize:11, color:"var(--r-accent-text)", fontFamily:"monospace", display:"inline-flex", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", padding:0 }}>
                  <i className="ti ti-external-link" style={{ fontSize:10 }} aria-hidden="true" />guide
                </button>
              )}
              {item.cost > 0 && (
                <span style={{ fontSize: 11, color: "var(--r-success)", fontFamily: "monospace" }}>
                  est cost: ${parseFloat(item.cost).toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
            <div onClick={()=>cycleStatus(item.id)} style={{ cursor:"pointer" }} title="click to change status">
              {st==="started" && <Tag color="warning"><i className="ti ti-player-play" style={{ fontSize:10 }} aria-hidden="true" />started</Tag>}
              {st==="todo" && <Tag color="accent">queued</Tag>}
              {st==="done" && <Tag color="success"><i className="ti ti-check" style={{ fontSize:10 }} aria-hidden="true" />done</Tag>}
            </div>
            <Tag color={item.type==="repair"?"warning":"pro"}>{item.type}</Tag>
            <button className="r-btn" onClick={()=>setQueue(queue.filter(q=>q.id!==item.id))} style={{ fontSize:11, padding:"3px 7px" }}>
              <i className="ti ti-x" style={{ fontSize:11 }} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {!showNew ? (
        <button className="r-btn accent" onClick={()=>setShowNew(true)} style={{ marginBottom:16, display:"flex", alignItems:"center", gap:6 }}>
          <i className="ti ti-plus" style={{ fontSize:13 }} aria-hidden="true" /> add to queue
        </button>
      ) : (
        <div className="r-card" style={{ borderColor:"var(--r-accent)", marginBottom:16 }}>
          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            <input className="r-input" placeholder="device" value={device} onChange={e=>setDevice(e.target.value)} />
            <select className="r-input" value={type} onChange={e=>setType(e.target.value)} style={{ width:100 }}>
              <option value="repair">repair</option>
              <option value="mod">mod</option>
            </select>
          </div>
          <input className="r-input" placeholder="what's wrong / what are you doing?" value={issue} onChange={e=>setIssue(e.target.value)} style={{ marginBottom:8 }} />
          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            <input className="r-input" placeholder="ifixit guide url (optional)" value={guideUrl} onChange={e=>setGuideUrl(e.target.value)} style={{ flex:1 }} />
            <input className="r-input" type="number" step="0.01" placeholder="est cost ($ optional)" value={cost} onChange={e=>setCost(e.target.value)} style={{ width:160 }} />
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12 }}>
            <span style={{ fontSize:12, color:"var(--r-muted)" }}>initial status:</span>
            <select className="r-input" value={initialStatus} onChange={e=>setInitialStatus(e.target.value)} style={{ width:140 }}>
              <option value="todo">queued (todo)</option>
              <option value="started">started</option>
              <option value="done">done</option>
            </select>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="r-btn accent" onClick={save}>add to queue</button>
            <button className="r-btn" onClick={()=>setShowNew(false)}>cancel</button>
          </div>
        </div>
      )}

      {queue.length===0 && !showNew && (
        <div style={{ textAlign:"center", padding:"4rem 0", color:"var(--r-muted)", fontFamily:"monospace" }}>
          <i className="ti ti-list-check" style={{ fontSize:36, display:"block", marginBottom:12 }} aria-hidden="true" />
          <span style={{ fontSize:13 }}>nothing in the queue.</span>
        </div>
      )}

      {startedItems.length > 0 && <>
        <div style={{ fontSize:11, color:"var(--r-warning)", fontFamily:"monospace", margin:"0 0 8px", fontWeight:600 }}>// in progress (started)</div>
        {startedItems.map(q=><QItem key={q.id} item={q} />)}
      </>}

      {todoItems.length > 0 && <>
        <div style={{ fontSize:11, color:"var(--r-muted)", fontFamily:"monospace", margin:"16px 0 8px" }}>// queued (todo)</div>
        {todoItems.map(q=><QItem key={q.id} item={q} />)}
      </>}

      {doneItems.length > 0 && <>
        <div style={{ fontSize:11, color:"var(--r-muted)", fontFamily:"monospace", margin:"16px 0 8px" }}>// done</div>
        {doneItems.map(q=><QItem key={q.id} item={q} />)}
      </>}
    </div>
  );
}

function PartsView({ parts, setParts }) {
  const [showAdd, setShowAdd] = useState(false);
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [name, setName] = useState("");
  const [device, setDevice] = useState("");
  const [vendor, setVendor] = useState("");
  const [cost, setCost] = useState("");
  const [status, setStatus] = useState("ordered");
  const [tracking, setTracking] = useState("");
  const [notes, setNotes] = useState("");

  const addPart = () => {
    if (!name.trim()) return;
    const newPart = {
      id: Date.now(),
      name: name.trim(),
      device: device.trim(),
      vendor: vendor.trim(),
      cost: parseFloat(cost) || 0,
      status,
      tracking: tracking.trim(),
      notes: notes.trim(),
      date: new Date().toISOString()
    };
    setParts([newPart, ...parts]);
    setName(""); setDevice(""); setVendor(""); setCost(""); setStatus("ordered"); setTracking(""); setNotes(""); setShowAdd(false);
  };

  const cycleStatus = (id) => {
    const nextMap = { ordered: "shipped", shipped: "delivered", delivered: "installed", installed: "ordered" };
    setParts(parts.map(p => p.id === id ? { ...p, status: nextMap[p.status] || "ordered" } : p));
  };

  const filteredParts = parts.filter(p => {
    const matchesStatus = activeStatus === "all" || p.status === activeStatus;
    const matchesQuery = !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.device && p.device.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.vendor && p.vendor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.tracking && p.tracking.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

  const getStatusBadge = (st) => {
    if (st === "ordered") return <Tag color="warning">ordered</Tag>;
    if (st === "shipped") return <Tag color="pro"><i className="ti ti-truck" style={{ fontSize:10 }} aria-hidden="true" />shipped</Tag>;
    if (st === "delivered") return <Tag color="success"><i className="ti ti-package" style={{ fontSize:10 }} aria-hidden="true" />delivered</Tag>;
    return <Tag color="accent">installed</Tag>;
  };

  const totalPartsCost = parts.reduce((acc, p) => acc + (parseFloat(p.cost) || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <button className="r-btn accent" onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" /> track new part
        </button>
        <div style={{ fontSize: 12, color: "var(--r-success)", fontFamily: "monospace", marginLeft: 8 }}>
          total parts cost: ${totalPartsCost.toFixed(2)}
        </div>
        <input
          className="r-input"
          placeholder="search parts / tracking..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: 200, marginLeft: "auto" }}
        />
      </div>

      {showAdd && (
        <div className="r-card" style={{ borderColor: "var(--r-accent)", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: "var(--r-text)", marginBottom: 10 }}>// track new component or part</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input className="r-input" placeholder="part name (e.g. 100uf 25v capacitor set, switch battery)" value={name} onChange={e => setName(e.target.value)} style={{ flex: 2 }} />
            <input className="r-input" placeholder="device / project (e.g. thinkpad t480)" value={device} onChange={e => setDevice(e.target.value)} style={{ flex: 1 }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input className="r-input" placeholder="vendor / store (e.g. mouser, ifixit, ebay)" value={vendor} onChange={e => setVendor(e.target.value)} style={{ flex: 1 }} />
            <input className="r-input" type="number" step="0.01" placeholder="cost ($ e.g. 12.50)" value={cost} onChange={e => setCost(e.target.value)} style={{ width: 140 }} />
            <select className="r-input" value={status} onChange={e => setStatus(e.target.value)} style={{ width: 130 }}>
              <option value="ordered">ordered</option>
              <option value="shipped">shipped</option>
              <option value="delivered">delivered</option>
              <option value="installed">installed</option>
            </select>
          </div>
          <input className="r-input" placeholder="tracking number or tracking url (optional)" value={tracking} onChange={e => setTracking(e.target.value)} style={{ marginBottom: 8 }} />
          <input className="r-input" placeholder="notes (optional e.g. replaces blown cap)" value={notes} onChange={e => setNotes(e.target.value)} style={{ marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="r-btn accent" onClick={addPart}>save part</button>
            <button className="r-btn" onClick={() => setShowAdd(false)}>cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16, borderBottom: "1px solid var(--r-border)", paddingBottom: 10 }}>
        {["all", "ordered", "shipped", "delivered", "installed"].map(st => {
          const count = st === "all" ? parts.length : parts.filter(p => p.status === st).length;
          return (
            <button
              key={st}
              className={`r-btn ${activeStatus === st ? "accent" : ""}`}
              onClick={() => setActiveStatus(st)}
              style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}
            >
              {st} ({count})
            </button>
          );
        })}
      </div>

      {filteredParts.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--r-muted)", fontFamily: "monospace" }}>
          <i className="ti ti-package" style={{ fontSize: 36, display: "block", marginBottom: 12 }} aria-hidden="true" />
          <span style={{ fontSize: 13 }}>no parts tracked in this category yet.</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
        {filteredParts.map(p => (
          <div key={p.id} className="r-card" style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--r-text)", marginBottom: 2 }}>{p.name}</div>
                {p.device && <div style={{ fontSize: 11, color: "var(--r-muted)", marginBottom: 4 }}>for: {p.device}</div>}
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                  {p.vendor && <Tag color="pro">{p.vendor}</Tag>}
                  {p.cost > 0 && <Tag color="success">${parseFloat(p.cost).toFixed(2)}</Tag>}
                  <div onClick={() => cycleStatus(p.id)} style={{ cursor: "pointer" }} title="click to change status">
                    {getStatusBadge(p.status)}
                  </div>
                </div>
                {p.tracking && (
                  <div style={{ marginTop: 4 }}>
                    <button className="r-btn" onClick={() => openTracking(p.tracking)} style={{ fontSize: 11, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <i className="ti ti-external-link" style={{ fontSize: 11 }} aria-hidden="true" />
                      track: {p.tracking.slice(0, 18)}{p.tracking.length > 18 ? "..." : ""}
                    </button>
                  </div>
                )}
                {p.notes && <div style={{ fontSize: 11, color: "var(--r-muted)", marginTop: 6, fontStyle: "italic" }}>{p.notes}</div>}
              </div>
              <button className="r-btn" onClick={() => setParts(parts.filter(x => x.id !== p.id))} style={{ fontSize: 11, padding: "3px 7px" }}>
                <i className="ti ti-x" style={{ fontSize: 11 }} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TOOL_CATEGORIES = [
  { id: "all", label: "all tools" },
  { id: "drivers", label: "screwdrivers" },
  { id: "bits", label: "bits" },
  { id: "prying", label: "prying & opening" },
  { id: "soldering", label: "soldering & electronics" },
  { id: "supplies", label: "supplies & thermal" },
  { id: "misc", label: "misc / other" },
];

const TOOL_PRESETS = [
  {
    name: "ifixit moray driver kit",
    description: "33 precision bits + driver handle",
    tools: [
      { name: "moray bit driver handle", category: "drivers", status: "in_stock", notes: "4mm bit holder + sim ejector" },
      { name: "phillips #000, #0, #1, #2", category: "bits", status: "in_stock", notes: "precision bits" },
      { name: "flathead 1mm, 2.5mm, 4mm", category: "bits", status: "in_stock", notes: "precision bits" },
      { name: "torx t3, t4, t5", category: "bits", status: "in_stock", notes: "precision bits" },
      { name: "security torx tr6, tr8, tr10, tr15", category: "bits", status: "in_stock", notes: "security bits" },
      { name: "pentalobe p2 (iphone), p5 (macbook)", category: "bits", status: "in_stock", notes: "apple pentalobe" },
      { name: "tri-point y000, y0, y1", category: "bits", status: "in_stock", notes: "apple watch & iphone, also common in nintendo devices" },
      { name: "gamebit 3.8mm, 4.5mm", category: "bits", status: "in_stock", notes: "nintendo cartridges" },
      { name: "hex 1.5mm, 2.5mm, 3mm, 4mm", category: "bits", status: "in_stock", notes: "commonly found in infrastructure projects such as buildings or docks" },
      { name: "nut 2.5mm, 5mm", category: "bits", status: "in_stock", notes: "commonly found in household hardware and cars" },
      { name: "triangle 2mm, 3mm", category: "bits", status: "in_stock", notes: "tamper-resistant screws found in utility panels, public fixtures, and some appliances" },
      { name: "oval drive bit", category: "bits", status: "in_stock", notes: "specialty oval head driver bit for espresso machines & appliances" },
      { name: "iphone standoff", category: "bits", status: "in_stock", notes: "proprietary apple standoff screw found in some iphone models" },
    ]
  },
  {
    name: "ifixit pro tech toolkit essentials",
    description: "essential prying, opening & esd tools",
    tools: [
      { name: "opening picks (6x)", category: "prying", status: "in_stock", notes: "thin guitar pick style" },
      { name: "plastic spudger", category: "prying", status: "in_stock", notes: "esd safe" },
      { name: "halberd spudger", category: "prying", status: "in_stock", notes: "hook & blade spudger" },
      { name: "jimmy opening tool", category: "prying", status: "in_stock", notes: "flexible steel blade" },
      { name: "suction handle", category: "prying", status: "in_stock", notes: "screen removal" },
      { name: "reverse tweezers & esd tweezers", category: "misc", status: "in_stock", notes: "precision handling" },
      { name: "anti-static wrist strap", category: "misc", status: "in_stock", notes: "esd protection" },
    ]
  },
  {
    name: "soldering & wiring essentials",
    description: "iron, solder, flux & desoldering wick",
    tools: [
      { name: "ts101 / pinecil smart soldering iron", category: "soldering", status: "in_stock", notes: "usb-c pd / dc powered" },
      { name: "63/37 rosin core solder wire", category: "soldering", status: "in_stock", notes: "0.8mm leaded solder" },
      { name: "no-clean flux pen / paste", category: "soldering", status: "in_stock", notes: "for clean joints" },
      { name: "desoldering braid / wick 2.5mm", category: "soldering", status: "in_stock", notes: "solder removal" },
      { name: "brass wire tip cleaner & sponge", category: "soldering", status: "in_stock", notes: "tip maintenance" },
      { name: "kapton polyimide high-temp tape", category: "supplies", status: "in_stock", notes: "heat masking" },
    ]
  },
  {
    name: "thermal and cleaning supplies",
    description: "thermal paste, pads & isopropyl alcohol",
    tools: [
      { name: "arctic mx-6 thermal paste (4g)", category: "supplies", status: "in_stock", notes: "cpu/gpu repaste" },
      { name: "honeywell ptm7950 phase change pad", category: "supplies", status: "in_stock", notes: "laptop gpu/cpu pad" },
      { name: "99% isopropyl alcohol (ipa)", category: "supplies", status: "in_stock", notes: "pcb & thermal cleanup" },
      { name: "microfiber cloths & cotton swabs", category: "supplies", status: "in_stock", notes: "cleaning" },
    ]
  }
];

function ToolboxView({ tools, setTools }) {
  const [activeCat, setActiveCat] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("drivers");
  const [status, setStatus] = useState("in_stock");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  const addCustomTool = () => {
    if (!name.trim()) return;
    const newTool = {
      id: Date.now(),
      name: name.trim(),
      category,
      status,
      cost: parseFloat(cost) || 0,
      notes: notes.trim()
    };
    setTools([newTool, ...tools]);
    setName(""); setCost(""); setNotes(""); setShowAdd(false);
  };

  const loadPreset = (preset) => {
    const newItems = preset.tools.map((t, idx) => ({
      id: Date.now() + idx,
      ...t
    }));
    setTools([...newItems, ...tools]);
    setShowPresets(false);
  };

  const filteredTools = tools.filter(t => {
    const matchesCat = activeCat === "all" || t.category === activeCat;
    const matchesQuery = !searchQuery.trim() ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const getStatusBadge = (st) => {
    if (st === "in_stock") return <Tag color="success">in stock</Tag>;
    if (st === "low") return <Tag color="warning">low / refill</Tag>;
    return <Tag color="danger">missing</Tag>;
  };

  const cycleStatus = (id) => {
    const statusMap = { in_stock: "low", low: "missing", missing: "in_stock" };
    setTools(tools.map(t => t.id === id ? { ...t, status: statusMap[t.status] || "in_stock" } : t));
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <button className="r-btn accent" onClick={() => { setShowAdd(true); setShowPresets(false); }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" /> add tool
        </button>
        <button className="r-btn" onClick={() => { setShowPresets(true); setShowAdd(false); }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-box" style={{ fontSize: 13 }} aria-hidden="true" /> load preset kit
        </button>
        <input
          className="r-input"
          placeholder="search tools / bits..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: 180, marginLeft: "auto" }}
        />
      </div>

      {showPresets && (
        <div className="r-card" style={{ borderColor: "var(--r-accent)", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: "var(--r-text)", marginBottom: 10 }}>// select preset tool kit to load</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginBottom: 12 }}>
            {TOOL_PRESETS.map((p, i) => (
              <div key={i} style={{ background: "var(--r-bg)", border: "1px solid var(--r-border)", borderRadius: 6, padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--r-text)", marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--r-muted)", marginBottom: 8 }}>{p.description} ({p.tools.length} items)</div>
                </div>
                <button className="r-btn accent" onClick={() => loadPreset(p)} style={{ fontSize: 11, width: "100%" }}>
                  + add kit items
                </button>
              </div>
            ))}
          </div>
          <button className="r-btn" onClick={() => setShowPresets(false)} style={{ fontSize: 11 }}>close</button>
        </div>
      )}

      {showAdd && (
        <div className="r-card" style={{ borderColor: "var(--r-accent)", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: "var(--r-text)", marginBottom: 10 }}>// add custom tool / bit</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input className="r-input" placeholder="tool name (e.g. t5 torx bit, iopener)" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1 }} />
            <select className="r-input" value={category} onChange={e => setCategory(e.target.value)} style={{ width: 160 }}>
              <option value="drivers">screwdrivers</option>
              <option value="bits">bits</option>
              <option value="prying">prying & opening</option>
              <option value="soldering">soldering & electronics</option>
              <option value="supplies">supplies & thermal</option>
              <option value="misc">misc / other</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <select className="r-input" value={status} onChange={e => setStatus(e.target.value)} style={{ width: 130 }}>
              <option value="in_stock">in stock</option>
              <option value="low">low / refill</option>
              <option value="missing">missing</option>
            </select>
            <input className="r-input" type="number" step="0.01" placeholder="cost ($ optional)" value={cost} onChange={e => setCost(e.target.value)} style={{ width: 140 }} />
            <input className="r-input" placeholder="notes (optional e.g. 4mm, 4g tube)" value={notes} onChange={e => setNotes(e.target.value)} style={{ flex: 1 }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="r-btn accent" onClick={addCustomTool}>save tool</button>
            <button className="r-btn" onClick={() => setShowAdd(false)}>cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16, borderBottom: "1px solid var(--r-border)", paddingBottom: 10 }}>
        {TOOL_CATEGORIES.map(cat => {
          const count = cat.id === "all" ? tools.length : tools.filter(t => t.category === cat.id).length;
          return (
            <button
              key={cat.id}
              className={`r-btn ${activeCat === cat.id ? "accent" : ""}`}
              onClick={() => setActiveCat(cat.id)}
              style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--r-muted)", fontFamily: "monospace" }}>
          <i className="ti ti-tools" style={{ fontSize: 36, display: "block", marginBottom: 12 }} aria-hidden="true" />
          <span style={{ fontSize: 13 }}>no tools found in this category. add custom tools or load a preset kit!</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {filteredTools.map(t => (
          <div key={t.id} className="r-card" style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--r-text)", marginBottom: 4 }}>{t.name}</div>
                {t.notes && <div style={{ fontSize: 11, color: "var(--r-muted)", marginBottom: 8 }}>{t.notes}</div>}
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <Tag color="pro">{t.category}</Tag>
                  {t.cost > 0 && <Tag color="success">${parseFloat(t.cost).toFixed(2)}</Tag>}
                  <div onClick={() => cycleStatus(t.id)} style={{ cursor: "pointer" }} title="click to change status">
                    {getStatusBadge(t.status)}
                  </div>
                </div>
              </div>
              <button className="r-btn" onClick={() => setTools(tools.filter(x => x.id !== t.id))} style={{ fontSize: 11, padding: "3px 7px" }}>
                <i className="ti ti-x" style={{ fontSize: 11 }} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchView() {
  const [query, setQuery] = useState("");
  const [engine, setEngine] = useState("both");

  const search = () => {
    if (!query.trim()) return;
    const q = encodeQueryParam(query.trim());
    if (engine==="ifixit"||engine==="both") openExternal(`https://www.ifixit.com/Search?query=${q}`);
    if (engine==="ltt"||engine==="both") openExternal(`https://www.lttstore.com/search?q=${q}`);
  };

  return (
    <div>
      <p style={{ fontSize:12, color:"var(--r-muted)", fontFamily:"monospace", marginBottom:16 }}>// search ifixit guides + ltt store: opens in browser</p>
      <div style={{ display:"flex", gap:8, marginBottom:10 }}>
        <input className="r-input" placeholder="e.g. thinkpad fan replacement" value={query}
          onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} />
        <select className="r-input" value={engine} onChange={e=>setEngine(e.target.value)} style={{ width:100 }}>
          <option value="both">both</option>
          <option value="ifixit">ifixit</option>
          <option value="ltt">ltt store</option>
        </select>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        <button className="r-btn accent" onClick={search} style={{ display:"flex", alignItems:"center", gap:6 }}>
          <i className="ti ti-external-link" style={{ fontSize:12 }} aria-hidden="true" />search
        </button>
      </div>
      <div style={{ fontSize:11, color:"var(--r-muted)", fontFamily:"monospace", marginBottom:10 }}>// quick links</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {[
          ["ifixit store","https://www.ifixit.com/Store"],
          ["ifixit guides","https://www.ifixit.com/Guide"],
          ["ifixit: laptops","https://www.ifixit.com/Device/Laptop"],
          ["ifixit: game consoles","https://www.ifixit.com/Device/Game_Console"],
          ["ltt store: tools","https://www.lttstore.com/collections/tools"],
        ].map(([label,url]) => (
          <button key={url} onClick={()=>openExternal(url)} style={{ fontSize:13, color:"var(--r-accent-text)", fontFamily:"monospace", display:"inline-flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", padding:0, textAlign:"left" }}>
            <i className="ti ti-external-link" style={{ fontSize:11 }} aria-hidden="true" />{label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsView({ settings, setSettings }) {
  const [customBg, setCustomBg] = useState(settings.customTheme?.bg||"");
  const [customAccent, setCustomAccent] = useState(settings.customTheme?.accent||"");

  const applyCustom = () => {
    if (!customBg||!customAccent) return;
    const custom = {...THEMES.tokyonight, name:"custom", bg:customBg, sidebar:customBg, card:customBg+"cc", accent:customAccent, accentText:customAccent, border:customAccent+"44"};
    applyTheme(custom);
    setSettings({...settings, theme:"custom", customTheme:custom});
  };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, color:"var(--r-muted)", fontFamily:"monospace", marginBottom:12 }}>// color scheme</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8, marginBottom:16 }}>
          {Object.entries(THEMES).map(([key,t]) => (
            <button key={key} onClick={()=>{applyTheme(t);setSettings({...settings,theme:key});}}
              style={{ background:t.bg, border:`2px solid ${settings.theme===key?t.accent:t.border}`, borderRadius:8, padding:"10px 12px", cursor:"pointer", textAlign:"left" }}>
              <div style={{ display:"flex", gap:5, marginBottom:6 }}>
                {[t.accent,t.success,t.warning,t.danger,t.pro].map((c,i)=>(
                  <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:c }} />
                ))}
              </div>
              <div style={{ fontSize:11, color:t.text, fontFamily:"monospace" }}>{t.name}</div>
            </button>
          ))}
        </div>
        <div style={{ fontSize:11, color:"var(--r-muted)", fontFamily:"monospace", marginBottom:10 }}>// custom hex</div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <input type="color" value={customBg||"#1a1b26"} onChange={e=>setCustomBg(e.target.value)}
              style={{ width:32,height:32,border:`1px solid var(--r-border)`,borderRadius:6,cursor:"pointer",background:"none",padding:2 }} />
            <span style={{ fontSize:11, color:"var(--r-muted)", fontFamily:"monospace" }}>bg</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <input type="color" value={customAccent||"#7aa2f7"} onChange={e=>setCustomAccent(e.target.value)}
              style={{ width:32,height:32,border:`1px solid var(--r-border)`,borderRadius:6,cursor:"pointer",background:"none",padding:2 }} />
            <span style={{ fontSize:11, color:"var(--r-muted)", fontFamily:"monospace" }}>accent</span>
          </div>
          <button className="r-btn accent" onClick={applyCustom} style={{ fontSize:11 }}>apply</button>
        </div>
      </div>

      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, color:"var(--r-muted)", fontFamily:"monospace", marginBottom:12 }}>// search engine</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {["duckduckgo (recommended)","google","ifixit (default)"].map(eng => (
            <label key={eng} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontFamily:"monospace", fontSize:13, color:"var(--r-text)" }}>
              <div style={{ width:16,height:16,borderRadius:"50%",border:`1px solid ${settings.searchEngine===eng?"var(--r-accent)":"var(--r-border)"}`,background:settings.searchEngine===eng?"var(--r-accent-bg)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}
                onClick={()=>setSettings({...settings,searchEngine:eng})}>
                {settings.searchEngine===eng && <div style={{ width:8,height:8,borderRadius:"50%",background:"var(--r-accent-text)" }} />}
              </div>
              {eng}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, color:"var(--r-muted)", fontFamily:"monospace", marginBottom:12 }}>// titlebar</div>
        <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontFamily:"monospace", fontSize:13, color:"var(--r-text)" }}
          onClick={()=>setSettings({...settings, showTitlebar: settings.showTitlebar === false})}>
          <div style={{ width:16,height:16,borderRadius:4,border:`1px solid ${settings.showTitlebar !== false ? "var(--r-accent)" : "var(--r-border)"}`,background:settings.showTitlebar !== false ? "var(--r-accent-bg)" : "transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            {settings.showTitlebar !== false && <i className="ti ti-check" style={{ fontSize:11, color:"var(--r-accent-text)" }} aria-hidden="true" />}
          </div>
          enable custom html titlebar
        </label>
      </div>

      <div>
        <div style={{ fontSize:11, color:"var(--r-muted)", fontFamily:"monospace", marginBottom:8 }}>// data</div>
        <p style={{ fontSize:12, color:"var(--r-muted)", fontFamily:"monospace" }}>all data stored locally in appdata/reprd/</p>
      </div>
    </div>
  );
}

const NAV = [
  {id:"dashboard",label:"stats dashboard",icon:"ti-dashboard"},
  {id:"journal",label:"repair journal",icon:"ti-book"},
  {id:"queue",label:"repair queue",icon:"ti-list-check"},
  {id:"parts",label:"parts tracker",icon:"ti-package"},
  {id:"toolbox",label:"toolbox",icon:"ti-tools"},
  {id:"search",label:"search",icon:"ti-search"},
  {id:"settings",label:"settings",icon:"ti-settings"},
];

export default function Reprd() {
  const [entries, setEntries] = useStorage("reprd:journal",[]);
  const [queue, setQueue] = useStorage("reprd:queue",[]);
  const [tools, setTools] = useStorage("reprd:tools",[]);
  const [parts, setParts] = useStorage("reprd:parts",[]);
  const [settings, setSettings] = useStorage("reprd:settings",{theme:"tokyonight",searchEngine:"ifixit (default)",showTitlebar:true});
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(()=>{
    const t = settings.theme==="custom"?settings.customTheme:THEMES[settings.theme]||THEMES.tokyonight;
    if (t) applyTheme(t);
  },[settings.theme]);

  const pendingQueue = queue.filter(q=>getItemStatus(q)!=="done").length;
  const activePartsCount = parts.filter(p=>p.status==="ordered"||p.status==="shipped").length;
  const current = NAV.find(n=>n.id===tab);

  return (
    <>
      <style>{css}</style>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/dist/tabler-icons.min.css" />
      <div style={{ display:"flex", flexDirection:"column", width:"100%", height:"100%", background:"var(--r-bg)", color:"var(--r-text)", fontFamily:"monospace", overflow:"hidden" }}>
        <TitleBar show={settings.showTitlebar !== false} />
        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        <div style={{ width:sidebarOpen?200:52, flexShrink:0, background:"var(--r-sidebar)", borderRight:`1px solid var(--r-border)`, display:"flex", flexDirection:"column", transition:"width 0.18s ease", overflow:"hidden" }}>
          <div style={{ padding:"14px 12px", borderBottom:`1px solid var(--r-border)`, display:"flex", alignItems:"center", gap:10, minHeight:52, boxSizing:"border-box" }}>
            <button onClick={()=>setSidebarOpen(o=>!o)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--r-muted)",padding:0,display:"flex",alignItems:"center",flexShrink:0 }}>
              <i className={`ti ${sidebarOpen?"ti-layout-sidebar-left-collapse":"ti-layout-sidebar-left-expand"}`} style={{ fontSize:18, color:"var(--r-muted)" }} aria-hidden="true" />
            </button>
            {sidebarOpen && <span style={{ fontSize:15, fontWeight:700, fontFamily:"monospace", color:"var(--r-text)", letterSpacing:-0.5, whiteSpace:"nowrap" }}>reprd</span>}
          </div>

          <nav style={{ flex:1, padding:"10px 8px" }}>
            {NAV.map(n => (
              <button key={n.id} onClick={()=>setTab(n.id)} style={{
                width:"100%", display:"flex", alignItems:"center", gap:10,
                padding:"8px 10px", borderRadius:6, border:"none", cursor:"pointer", marginBottom:2,
                background:tab===n.id?"var(--r-accent-bg)":"transparent",
                color:tab===n.id?"var(--r-accent-text)":"var(--r-muted)",
                textAlign:"left", whiteSpace:"nowrap", overflow:"hidden",
              }}>
                <div style={{ position:"relative", flexShrink:0 }}>
                  <i className={`ti ${n.icon}`} style={{ fontSize:17 }} aria-hidden="true" />
                  {n.id==="queue"&&pendingQueue>0&&(
                    <span style={{ position:"absolute",top:-4,right:-6,background:"var(--r-warning)",color:"var(--r-bg)",fontSize:9,fontWeight:700,borderRadius:8,padding:"0px 4px",fontFamily:"monospace" }}>{pendingQueue}</span>
                  )}
                  {n.id==="parts"&&activePartsCount>0&&(
                    <span style={{ position:"absolute",top:-4,right:-6,background:"var(--r-pro)",color:"var(--r-bg)",fontSize:9,fontWeight:700,borderRadius:8,padding:"0px 4px",fontFamily:"monospace" }}>{activePartsCount}</span>
                  )}
                </div>
                {sidebarOpen && <span style={{ fontSize:12 }}>{n.label}</span>}
              </button>
            ))}
          </nav>

          {sidebarOpen && (
            <div style={{ padding:"10px 14px", borderTop:`1px solid var(--r-border)`, fontSize:10, color:"var(--r-muted)", fontFamily:"monospace" }}>
              repr.d
            </div>
          )}
        </div>

        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"14px 20px", borderBottom:`1px solid var(--r-border)`, display:"flex", alignItems:"center", gap:10, minHeight:52, boxSizing:"border-box" }}>
            <i className={`ti ${current?.icon}`} style={{ fontSize:16, color:"var(--r-muted)" }} aria-hidden="true" />
            <span style={{ fontSize:14, fontWeight:600, fontFamily:"monospace", color:"var(--r-text)" }}>{current?.label}</span>
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:"20px" }}>
            {tab==="dashboard" && <DashboardView entries={entries} queue={queue} setQueue={setQueue} parts={parts} setParts={setParts} tools={tools} setTab={setTab} />}
            {tab==="journal" && <JournalView entries={entries} setEntries={setEntries} />}
            {tab==="queue" && <QueueView queue={queue} setQueue={setQueue} />}
            {tab==="parts" && <PartsView parts={parts} setParts={setParts} />}
            {tab==="toolbox" && <ToolboxView tools={tools} setTools={setTools} />}
            {tab==="search" && <SearchView />}
            {tab==="settings" && <SettingsView settings={settings} setSettings={setSettings} />}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
