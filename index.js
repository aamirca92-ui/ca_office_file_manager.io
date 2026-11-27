const WORKS = ['MCA', 'Income Tax', 'GST'];
const KEY = 'ca_folder_manager_v1';
let data = { clients: [] };
const ui = { mode: 'client', a: null, b: null, closed: {}, uploadYear: null };

function load() {
    try { const r = localStorage.getItem(KEY); if (r) data = JSON.parse(r); } catch (e) { }
    if (!data.clients || !data.clients.length) {
        data = {
            clients: [{
                id: uid(), name: 'Sharma Enterprises', services: ['MCA', 'Income Tax', 'GST'],
                years: { 'MCA': { '2024-25': [] }, 'Income Tax': { '2024-25': [] }, 'GST': { '2024-25': [] } }
            }]
        };
    }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { } }
function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function jq(s) { return esc(JSON.stringify(s)); }
function getClient(id) { return data.clients.find(c => c.id === id); }
function filtered() {
    const q = document.getElementById('searchInput').value.trim().toLowerCase();
    return data.clients.filter(c => c.name.toLowerCase().includes(q)).sort((x, y) => x.name.localeCompare(y.name));
}
function current(w) {
    const client = getClient(ui.mode === 'client' ? ui.a : ui.b);
    const work = ui.mode === 'client' ? ui.b : ui.a;
    return { client, work: w || work };
}

function setMode(m) {
    ui.mode = m; ui.a = null; ui.b = null;
    document.getElementById('btnClientMode').classList.toggle('active', m === 'client');
    document.getElementById('btnWorkMode').classList.toggle('active', m === 'work');
    document.getElementById('btnFYMode').classList.toggle('active', m === 'fy');
    document.getElementById('searchInput').placeholder = 'Search client…';
    renderAll();
}
function selectA(v) {
    ui.a = v; ui.b = null;
    if (ui.mode === 'client') { const c = getClient(v); if (c && c.services.length === 1) ui.b = c.services[0]; }
    renderAll();
}
function selectB(v) { ui.b = v; renderAll(); }

function delTwice(btn, fn) {
    if (btn.dataset.armed) { fn(); return; }
    btn.dataset.armed = '1'; const t = btn.textContent; btn.textContent = 'Sure?';
    setTimeout(() => { delete btn.dataset.armed; btn.textContent = t; }, 3000);
}

function renderPane1() {
    const el = document.getElementById('pane1List');
    if (ui.mode === 'client') {
        document.getElementById('pane1Title').textContent = 'Clients List';
        const list = filtered();
        el.innerHTML = list.length ? list.map(c => `
      <div class="item ${ui.a === c.id ? 'sel' : ''}" onclick="selectA(${jq(c.id)})">
        <span>${esc(c.name)}<br><small>${c.services.map(esc).join(', ') || 'No services'}</small></span>
        <button class="btn-del" onclick="event.stopPropagation();delTwice(this,()=>deleteClient(${jq(c.id)}))">🗑</button>
      </div>`).join('') : '<div class="empty-state">कोई क्लाइंट नहीं मिला। “+ Add New Client” दबाएँ।</div>';
    } else if (ui.mode === 'fy') {
        document.getElementById('pane1Title').textContent = 'Financial Years';
        const ys = allYears();
        el.innerHTML = ys.length ? ys.map(y => {
            const n = data.clients.filter(c => c.services.some(w => c.years[w] && c.years[w][y])).length;
            return `<div class="item ${ui.a === y ? 'sel' : ''}" onclick="selectA(${jq(y)})"><span>📁 FY ${esc(y)}</span><small>${n} clients</small></div>`;
        }).join('') : '<div class="empty-state">कोई Financial Year नहीं है। पहले Client-Wise व्यू में year जोड़ें।</div>';
    } else {
        document.getElementById('pane1Title').textContent = 'Work Categories';
        el.innerHTML = WORKS.map(w => {
            const n = data.clients.filter(c => c.services.includes(w)).length;
            return `<div class="item ${ui.a === w ? 'sel' : ''}" onclick="selectA(${jq(w)})"><span>${esc(w)}</span><small>${n} clients</small></div>`;
        }).join('');
    }
}
function renderPane2() {
    const el = document.getElementById('pane2List');
    const t = document.getElementById('pane2Title');
    if (!ui.a) { t.textContent = ui.mode === 'client' ? 'Work Categories' : 'Clients'; el.innerHTML = '<div class="empty-state">बाएं तरफ से कोई विकल्प चुनें</div>'; return; }
    if (ui.mode === 'fy') {
        t.textContent = 'Clients';
        const list = filtered().filter(c => c.services.some(w => c.years[w] && c.years[w][ui.a]));
        el.innerHTML = list.length ? list.map(c => `<div class="item ${ui.b === c.id ? 'sel' : ''}" onclick="selectB(${jq(c.id)})"><span>${esc(c.name)}<br><small>${c.services.map(esc).join(', ')}</small></span></div>`).join('') : '<div class="empty-state">इस FY में कोई क्लाइंट नहीं है।</div>';
        return;
    }
    if (ui.mode === 'client') {
        t.textContent = 'Work Categories';
        const c = getClient(ui.a);
        el.innerHTML = c && c.services.length ? c.services.map(w =>
            `<div class="item ${ui.b === w ? 'sel' : ''}" onclick="selectB(${jq(w)})"><span>${esc(w)}</span><small>${Object.keys((c.years[w] || {})).length} years</small></div>`).join('')
            : '<div class="empty-state">इस क्लाइंट में कोई सर्विस नहीं है।</div>';
    } else {
        t.textContent = 'Clients';
        const list = filtered().filter(c => c.services.includes(ui.a));
        el.innerHTML = list.length ? list.map(c =>
            `<div class="item ${ui.b === c.id ? 'sel' : ''}" onclick="selectB(${jq(c.id)})"><span>${esc(c.name)}</span></div>`).join('')
            : '<div class="empty-state">इस काम का कोई क्लाइंट नहीं है।</div>';
    }
}
function renderPane3() {
    const el = document.getElementById('pane3Content');
    const { client, work } = current();
    const addBtn = document.getElementById('addYearBtn');
    document.getElementById('yearErr').textContent = '';
    if (ui.mode === 'fy') { renderFY(el, client); return; }
    if (!client || !work || !client.services.includes(work)) {
        addBtn.style.display = 'none';
        document.getElementById('pane3Title').textContent = 'Year-Wise Folders';
        el.innerHTML = '<div class="empty-state"><h3>📂 फोल्डर देखने के लिए क्लाइंट और काम चुनें</h3><p>ऊपर के बटन से Client-Wise या Work-Wise व्यू बदल सकते हैं।</p></div>';
        return;
    }
    addBtn.style.display = 'flex';
    document.getElementById('pane3Title').textContent = client.name + ' › ' + work;
    const years = (client.years[work] = client.years[work] || {});
    const keys = Object.keys(years).sort().reverse();
    el.innerHTML = keys.length ? keys.map(y => {
        const files = years[y], k = client.id + work + y, open = !ui.closed[k];
        return `<div class="folder">
      <div class="fhead" onclick="toggle(${jq(k)})"><span>${open ? '📂' : '📁'} FY ${esc(y)} <small>(${files.length} files)</small></span>
        <span class="acts">
          <button class="btn-ghost" onclick="event.stopPropagation();pickFiles(${jq(y)})">+ Add Files</button>
          <button class="btn-del" onclick="event.stopPropagation();delTwice(this,()=>deleteYear(${jq(y)}))">🗑</button>
        </span></div>
      ${open ? (files.length ? files.map((f, i) => `<div class="file"><span style="cursor:pointer" title="Open file" onclick="openFile(${jq(y)},${i})">📄 ${esc(f.name)}<small>${fmtSize(f.size)} · ${esc(f.date)}</small></span>
        <button class="btn-del" onclick="deleteFile(${jq(y)},${i})">✕</button></div>`).join('') : '<div class="nofile">इस फोल्डर में अभी कोई फाइल नहीं है।</div>') : ''}
    </div>`;
    }).join('') : '<div class="empty-state">कोई फोल्डर नहीं है। ऊपर Financial Year जोड़ें।</div>';
}
function renderAll() { renderPane1(); renderPane2(); renderPane3(); }

function allYears() {
    const s = new Set();
    data.clients.forEach(c => Object.values(c.years).forEach(o => Object.keys(o).forEach(y => s.add(y))));
    return [...s].sort().reverse();
}
function renderFY(el, client) {
    document.getElementById('addYearBtn').style.display = 'none';
    const y = ui.a, t = document.getElementById('pane3Title');
    if (!y || !client) {
        t.textContent = 'FY Folder';
        el.innerHTML = '<div class="empty-state"><h3>📂 पहले FY और फिर क्लाइंट चुनें</h3><p>उस FY के MCA, Income Tax और GST फोल्डर एक साथ दिखेंगे।</p></div>';
        return;
    }
    t.textContent = 'FY ' + y + ' › ' + client.name;
    el.innerHTML = client.services.length ? client.services.map(w => {
        const files = (client.years[w] || {})[y] || [];
        const k = client.id + w + y, open = !ui.closed[k];
        return `<div class="folder"><div class="fhead" onclick="toggle(${jq(k)})"><span>${open ? '📂' : '📁'} ${esc(w)} <small>(${files.length} files)</small></span>
      <span class="acts"><button class="btn-ghost" onclick="event.stopPropagation();pickFiles(${jq(y)},${jq(w)})">+ Add Files</button></span></div>
      ${open ? (files.length ? files.map((f, i) => `<div class="file"><span style="cursor:pointer" title="Open file" onclick="openFile(${jq(y)},${i},${jq(w)})">📄 ${esc(f.name)}<small>${fmtSize(f.size)} · ${esc(f.date)}</small></span><button class="btn-del" onclick="deleteFile(${jq(y)},${i},${jq(w)})">✕</button></div>`).join('') : '<div class="nofile">इस फोल्डर में अभी कोई फाइल नहीं है।</div>') : ''}</div>`;
    }).join('') : '<div class="empty-state">इस क्लाइंट में कोई सर्विस नहीं है।</div>';
}
function toggle(k) { ui.closed[k] = !ui.closed[k]; renderPane3(); }
function fmtSize(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }

function addNewYear() {
    const { client, work } = current(); if (!client || !work) return;
    const inp = document.getElementById('yearInput'), err = document.getElementById('yearErr');
    let v = inp.value.trim();
    if (!v) { const now = new Date(), y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; v = y + '-' + String(y + 1).slice(2); }
    const m = v.match(/^(\d{4})-(\d{2})$/);
    if (!m || (+m[1] + 1) % 100 !== +m[2]) { err.textContent = 'Format सही नहीं है। उदा. 2025-26'; return; }
    if (client.years[work][v]) { err.textContent = v + ' का फोल्डर पहले से है।'; return; }
    client.years[work][v] = []; inp.value = ''; save(); renderAll();
    fsDo(async () => { await dirAt([client.name, work, v], true); });
}
function deleteYear(y) {
    const { client, work } = current(); delete client.years[work][y]; save(); renderAll();
    fsDo(async () => { const d = await dirAt([client.name, work]); await d.removeEntry(y, { recursive: true }); });
}
function pickFiles(y, w) { ui.uploadYear = y; ui.uploadWork = w; const p = document.getElementById('filePicker'); p.value = ''; p.click(); }
function onFilesChosen(inp) {
    const { client, work } = current(ui.uploadWork); if (!client || !work || !ui.uploadYear) return;
    const date = new Date().toLocaleDateString('en-IN');
    const y = ui.uploadYear, files = [...inp.files], arr = (client.years[work][y] = client.years[work][y] || []);
    files.forEach(f => { const i = arr.findIndex(x => x.name === f.name); if (i >= 0) arr.splice(i, 1); arr.push({ name: f.name, size: f.size, date }); });
    save(); renderPane3();
    fsDo(async () => {
        const d = await dirAt([client.name, work, y], true);
        for (const f of files) { const h = await d.getFileHandle(f.name, { create: true }); const w = await h.createWritable(); await w.write(f); await w.close(); }
    });
}
function deleteFile(y, i, w) {
    const { client, work } = current(w); const n = client.years[work][y][i].name;
    client.years[work][y].splice(i, 1); save(); renderPane3();
    fsDo(async () => { const d = await dirAt([client.name, work, y]); await d.removeEntry(n); });
}
function deleteClient(id) {
    const dc = getClient(id);
    fsDo(async () => { await dirRoot.removeEntry(dc.name, { recursive: true }); });
    data.clients = data.clients.filter(c => c.id !== id);
    if (ui.mode === 'client' && ui.a === id) { ui.a = null; ui.b = null; }
    if (ui.mode === 'work' && ui.b === id) ui.b = null;
    save(); renderAll();
}

function openModal() {
    document.getElementById('newClientName').value = '';
    document.getElementById('clientErr').textContent = '';
    document.getElementById('clientModal').classList.add('show');
    setTimeout(() => document.getElementById('newClientName').focus(), 0);
}
function closeModal() { document.getElementById('clientModal').classList.remove('show'); }
function saveNewClient() {
    const name = document.getElementById('newClientName').value.trim().replace(/[\\/:*?"<>|]/g, '-');
    const err = document.getElementById('clientErr');
    if (!name) { err.textContent = 'क्लाइंट का नाम लिखें।'; return; }
    if (data.clients.some(c => c.name.toLowerCase() === name.toLowerCase())) { err.textContent = 'यह क्लाइंट पहले से मौजूद है।'; return; }
    const services = [...document.querySelectorAll('#clientModal input[type=checkbox]:checked')].map(c => c.value);
    if (!services.length) { err.textContent = 'कम से कम एक सर्विस चुनें।'; return; }
    const c = { id: uid(), name, services, years: {} };
    services.forEach(s => c.years[s] = {});
    fsDo(async () => { for (const s of services) await dirAt([name, s], true); });
    data.clients.push(c); save(); closeModal();
    setMode('client'); selectA(c.id);
}
document.getElementById('clientModal').addEventListener('click', e => { if (e.target.id === 'clientModal') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ---------- Real folder storage (File System Access API) ---------- */
let dirRoot = null;
function idb() { return new Promise((res, rej) => { const r = indexedDB.open('ca_fm', 1); r.onupgradeneeded = () => r.result.createObjectStore('h'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function idbGet() { try { const d = await idb(); return await new Promise(r => { const q = d.transaction('h').objectStore('h').get('root'); q.onsuccess = () => r(q.result); q.onerror = () => r(null); }); } catch (e) { return null; } }
async function idbSet(h) { try { const d = await idb(); d.transaction('h', 'readwrite').objectStore('h').put(h, 'root'); } catch (e) { } }
function setStatus(t, bad) { const s = document.getElementById('fsStatus'); s.textContent = t; s.style.color = bad ? 'var(--danger)' : 'var(--mute)'; }
async function dirAt(path, create) { let d = dirRoot; for (const p of path) d = await d.getDirectoryHandle(p, { create: !!create }); return d; }
async function fsDo(fn) { if (!dirRoot) return; try { await fn(); setStatus('Saved in folder: ' + dirRoot.name); } catch (e) { setStatus('Folder error: ' + e.message, true); } }
async function scan() {
    const clients = [];
    for await (const [n, h] of dirRoot.entries()) {
        if (h.kind !== 'directory') continue;
        const c = { id: n, name: n, services: [], years: {} };
        for await (const [w, wh] of h.entries()) {
            if (wh.kind !== 'directory' || !WORKS.includes(w)) continue;
            c.services.push(w); c.years[w] = {};
            for await (const [y, yh] of wh.entries()) {
                if (yh.kind !== 'directory') continue;
                const files = [];
                for await (const [fn, fh] of yh.entries()) {
                    if (fh.kind !== 'file') continue;
                    const f = await fh.getFile();
                    files.push({ name: fn, size: f.size, date: new Date(f.lastModified).toLocaleDateString('en-IN') });
                }
                c.years[w][y] = files;
            }
        }
        clients.push(c);
    }
    data = { clients }; ui.a = null; ui.b = null; save(); renderAll();
}
function afterConnect() { const b = document.getElementById('folderBtn'); b.textContent = '📂 Change Folder'; b.onclick = connectFolder; setStatus('Connected: ' + dirRoot.name); }
async function connectFolder() {
    if (!window.showDirectoryPicker) { setStatus('This browser cannot access folders. Use Chrome or Edge on a computer.', true); return; }
    try { dirRoot = await showDirectoryPicker({ mode: 'readwrite' }); } catch (e) { return; }
    await idbSet(dirRoot); await scan(); afterConnect();
}
async function restoreFolder() {
    const h = await idbGet();
    if (!h) { setStatus('No folder selected: data is kept in this browser only.'); return; }
    try { if (await h.queryPermission({ mode: 'readwrite' }) === 'granted') { dirRoot = h; await scan(); afterConnect(); return; } } catch (e) { }
    const b = document.getElementById('folderBtn'); b.textContent = '🔄 Reconnect “' + h.name + '”';
    b.onclick = async () => { try { if (await h.requestPermission({ mode: 'readwrite' }) === 'granted') { dirRoot = h; await scan(); afterConnect(); } } catch (e) { setStatus('Permission denied.', true); } };
}
async function openFile(y, i, w) {
    const { client, work } = current(w); const n = client.years[work][y][i].name;
    if (!dirRoot) { setStatus('Select a storage folder to open files.', true); return; }
    try { const d = await dirAt([client.name, work, y]); const f = await (await d.getFileHandle(n)).getFile(); window.open(URL.createObjectURL(f), '_blank'); }
    catch (e) { setStatus('Cannot open file: ' + e.message, true); }
}

/* ---------- Nested folders: folders inside folders, any depth (these versions replace the earlier ones above) ---------- */
const FYPAT = /^\d{4}-\d{2}$/;
function safeName(n) { return n.trim().replace(/[\\/:*?"<>|]/g, '-'); }
function defaultFY() { const n = new Date(), y = n.getMonth() >= 3 ? n.getFullYear() : n.getFullYear() - 1; return y + '-' + String(y + 1).slice(2); }
function allYears() {
    const s = new Set();
    data.clients.forEach(c => Object.values(c.years).forEach(o => Object.keys(o).forEach(y => { if (FYPAT.test(y)) s.add(y); })));
    return [...s].sort().reverse();
}
function itemsAt(client, w, y, p, create) {
    const yrs = client.years[w] || (create ? (client.years[w] = {}) : null);
    let arr = (yrs && yrs[y]) || (create ? (yrs[y] = []) : null);
    if (!arr) return [];
    for (const n of (p ? p.split('/') : [])) { const f = arr.find(x => x.dir && x.name === n); if (!f) return null; arr = f.items; }
    return arr;
}
function countFiles(a) { return a.reduce((s, x) => s + (x.dir ? countFiles(x.items) : 1), 0); }
function fsPath(client, w, y, p) { return [client.name, w, y].concat(p ? p.split('/') : []); }

function treeHTML(items, y, w, p, k, depth) {
    const pad = 32 + depth * 18;
    return items.map((f, i) => {
        if (f.dir) {
            const fp = p ? p + '/' + f.name : f.name, kk = k + '/' + f.name, open = !ui.closed[kk];
            return `<div class="file subhead" style="padding-left:${pad}px" onclick="toggle(${jq(kk)})"><span>${open ? '📂' : '📁'} ${esc(f.name)} <small>(${countFiles(f.items)} files)</small></span>
        <span class="acts"><button class="btn-ghost" onclick="event.stopPropagation();pickFiles(${jq(y)},${jq(w)},${jq(fp)})">+ Files</button>
        <button class="btn-ghost" onclick="event.stopPropagation();openFolderModal(${jq(y)},${jq(w)},${jq(fp)})">+ Folder</button>
        <button class="btn-del" onclick="event.stopPropagation();delTwice(this,()=>deleteItem(${jq(y)},${i},${jq(w)},${jq(p)}))">🗑</button></span></div>
        ${open ? (f.items.length ? treeHTML(f.items, y, w, fp, kk, depth + 1) : `<div class="nofile" style="padding-left:${pad + 18}px">खाली फोल्डर</div>`) : ''}`;
        }
        return `<div class="file" style="padding-left:${pad}px"><span style="cursor:pointer" title="Open file" onclick="openFile(${jq(y)},${i},${jq(w)},${jq(p)})">📄 ${esc(f.name)}<small>${fmtSize(f.size)} · ${esc(f.date)}</small></span><button class="btn-del" onclick="deleteItem(${jq(y)},${i},${jq(w)},${jq(p)})">✕</button></div>`;
    }).join('');
}
function folderBlock(client, w, y, showWork) {
    const items = itemsAt(client, w, y, '', false), k = client.id + w + y, open = !ui.closed[k];
    const label = showWork ? w : (FYPAT.test(y) ? 'FY ' + y : y);
    const del = showWork ? '' : `<button class="btn-del" onclick="event.stopPropagation();delTwice(this,()=>deleteYear(${jq(y)}))">🗑</button>`;
    return `<div class="folder"><div class="fhead" onclick="toggle(${jq(k)})"><span>${open ? '📂' : '📁'} ${esc(label)} <small>(${countFiles(items)} files)</small></span>
    <span class="acts"><button class="btn-ghost" onclick="event.stopPropagation();pickFiles(${jq(y)},${jq(w)},'')">+ Add Files</button>
    <button class="btn-ghost" onclick="event.stopPropagation();openFolderModal(${jq(y)},${jq(w)},'')">+ Add Folder</button>${del}</span></div>
    ${open ? (items.length ? treeHTML(items, y, w, '', k, 0) : '<div class="nofile">इस फोल्डर में अभी कुछ नहीं है।</div>') : ''}</div>`;
}
function renderPane3() {
    const el = document.getElementById('pane3Content');
    const { client, work } = current();
    const addBtn = document.getElementById('addYearBtn');
    document.getElementById('yearErr').textContent = '';
    if (ui.mode === 'fy') { renderFY(el, client); return; }
    if (!client || !work || !client.services.includes(work)) {
        addBtn.style.display = 'none';
        document.getElementById('pane3Title').textContent = 'Year-Wise Folders';
        el.innerHTML = '<div class="empty-state"><h3>📂 फोल्डर देखने के लिए क्लाइंट और काम चुनें</h3><p>ऊपर के बटन से व्यू बदल सकते हैं।</p></div>';
        return;
    }
    addBtn.style.display = 'flex';
    document.getElementById('pane3Title').textContent = client.name + ' › ' + work;
    const keys = Object.keys(client.years[work] || {}).sort().reverse();
    el.innerHTML = keys.length ? keys.map(y => folderBlock(client, work, y, false)).join('') : '<div class="empty-state">कोई फोल्डर नहीं है। ऊपर FY या Folder जोड़ें।</div>';
}
function renderFY(el, client) {
    document.getElementById('addYearBtn').style.display = 'none';
    const y = ui.a, t = document.getElementById('pane3Title');
    if (!y || !client) {
        t.textContent = 'FY Folder';
        el.innerHTML = '<div class="empty-state"><h3>📂 पहले FY और फिर क्लाइंट चुनें</h3></div>';
        return;
    }
    t.textContent = 'FY ' + y + ' › ' + client.name;
    el.innerHTML = client.services.length ? client.services.map(w => folderBlock(client, w, y, true)).join('') : '<div class="empty-state">इस क्लाइंट में कोई सर्विस नहीं है।</div>';
}

function addNewYear() {
    const { client, work } = current(); if (!client || !work) return;
    const inp = document.getElementById('yearInput'), err = document.getElementById('yearErr');
    let v = inp.value.trim() || defaultFY();
    if (FYPAT.test(v)) { if ((+v.slice(0, 4) + 1) % 100 !== +v.slice(5)) { err.textContent = 'Financial year सही नहीं है। उदा. 2025-26'; return; } }
    else v = safeName(v);
    const yrs = (client.years[work] = client.years[work] || {});
    if (yrs[v]) { err.textContent = v + ' का फोल्डर पहले से है।'; return; }
    yrs[v] = []; inp.value = ''; save(); renderAll();
    fsDo(async () => { await dirAt([client.name, work, v], true); });
}
function pickFiles(y, w, p) { ui.uploadYear = y; ui.uploadWork = w; ui.uploadPath = p || ''; const el = document.getElementById('filePicker'); el.value = ''; el.click(); }
function onFilesChosen(inp) {
    const { client, work } = current(ui.uploadWork), y = ui.uploadYear, p = ui.uploadPath || '';
    if (!client || !work || !y) return;
    const arr = itemsAt(client, work, y, p, true); if (!arr) return;
    const date = new Date().toLocaleDateString('en-IN'), files = [...inp.files];
    files.forEach(f => { const i = arr.findIndex(x => !x.dir && x.name === f.name); if (i >= 0) arr.splice(i, 1); arr.push({ name: f.name, size: f.size, date }); });
    save(); renderPane3();
    fsDo(async () => {
        const d = await dirAt(fsPath(client, work, y, p), true);
        for (const f of files) { const h = await d.getFileHandle(f.name, { create: true }); const w = await h.createWritable(); await w.write(f); await w.close(); }
    });
}
function deleteItem(y, i, w, p) {
    const { client, work } = current(w); const arr = itemsAt(client, work, y, p); const it = arr && arr[i]; if (!it) return;
    arr.splice(i, 1); save(); renderPane3();
    fsDo(async () => { const d = await dirAt(fsPath(client, work, y, p)); await d.removeEntry(it.name, { recursive: true }); });
}
async function openFile(y, i, w, p) {
    const { client, work } = current(w); const arr = itemsAt(client, work, y, p); const it = arr && arr[i];
    if (!it) return;
    if (!dirRoot) { setStatus('Select a storage folder to open files.', true); return; }
    try { const d = await dirAt(fsPath(client, work, y, p)); const f = await (await d.getFileHandle(it.name)).getFile(); window.open(URL.createObjectURL(f), '_blank'); }
    catch (e) { setStatus('Cannot open file: ' + e.message, true); }
}
function openFolderModal(y, w, p) {
    ui.fCtx = { y, w, p };
    document.getElementById('newFolderName').value = '';
    document.getElementById('folderErr').textContent = '';
    document.getElementById('folderModal').classList.add('show');
    setTimeout(() => document.getElementById('newFolderName').focus(), 0);
}
function closeFolderModal() { document.getElementById('folderModal').classList.remove('show'); }
function saveSubFolder() {
    const { y, w, p } = ui.fCtx || {}; const { client, work } = current(w);
    const err = document.getElementById('folderErr'), name = safeName(document.getElementById('newFolderName').value);
    if (!client || !work || !y) return;
    if (!name) { err.textContent = 'फोल्डर का नाम लिखें।'; return; }
    const arr = itemsAt(client, work, y, p, true); if (!arr) return;
    if (arr.some(x => x.name.toLowerCase() === name.toLowerCase())) { err.textContent = 'इस नाम का फोल्डर या फाइल पहले से है।'; return; }
    arr.push({ name, dir: true, items: [] }); save(); closeFolderModal(); renderPane3();
    fsDo(async () => { await dirAt(fsPath(client, work, y, p).concat([name]), true); });
}
document.getElementById('folderModal').addEventListener('click', e => { if (e.target.id === 'folderModal') closeFolderModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeFolderModal(); });
async function readDir(dh) {
    const out = [];
    for await (const [n, h] of dh.entries()) {
        if (h.kind === 'directory') out.push({ name: n, dir: true, items: await readDir(h) });
        else { const f = await h.getFile(); out.push({ name: n, size: f.size, date: new Date(f.lastModified).toLocaleDateString('en-IN') }); }
    }
    return out.sort((a, b) => (b.dir ? 1 : 0) - (a.dir ? 1 : 0) || a.name.localeCompare(b.name));
}
async function scan() {
    const clients = [];
    for await (const [n, h] of dirRoot.entries()) {
        if (h.kind !== 'directory') continue;
        const c = { id: n, name: n, services: [], years: {} };
        for await (const [w, wh] of h.entries()) {
            if (wh.kind !== 'directory' || !WORKS.includes(w)) continue;
            c.services.push(w); c.years[w] = {};
            for await (const [y, yh] of wh.entries()) { if (yh.kind === 'directory') c.years[w][y] = await readDir(yh); }
        }
        clients.push(c);
    }
    data = { clients }; ui.a = null; ui.b = null; save(); renderAll();
}

load(); renderAll(); restoreFolder();