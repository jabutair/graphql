/* ===== Endpoints ===== */
const API_SIGNIN  = 'https://adam-jerusalem.nd.edu/api/auth/signin';
const API_GRAPHQL = 'https://adam-jerusalem.nd.edu/api/graphql-engine/v1/graphql';

/* ===== Helpers ===== */
const $ = (id) => document.getElementById(id);
function show(el){ el.classList.remove('hidden'); }
function hide(el){ el.classList.add('hidden'); }
function showError(msg){ $('error-msg').textContent = msg; }
function setAppVisible(on){
  if (on){ hide($('login-box')); show($('profile-box')); }
  else   { show($('login-box')); hide($('profile-box')); }
}

/* ===== Theme (🌙/☀️) ===== */
function setThemeIcon(){
  const btn = $('theme-btn');
  if (btn) btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
}
function initTheme(){
  const saved = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark', saved === 'dark');
  setThemeIcon();
}
function toggleTheme(){
  const toDark = !document.body.classList.contains('dark');
  document.body.classList.toggle('dark', toDark);
  localStorage.setItem('theme', toDark ? 'dark' : 'light');
  setThemeIcon();
}

/* ===== Auth ===== */
document.getElementById('login-form').addEventListener('submit', (e)=>{ e.preventDefault(); login(); });

async function login(){
  const user = $('username').value.trim();
  const pass = $('password').value;
  if (!user || !pass) return showError('Please enter your username/email and password');

  try{
    const auth = btoa(`${user}:${pass}`);
    const res = await axios.post(API_SIGNIN, null, { headers: { Authorization: `Basic ${auth}` }});
    const jwt = res?.data || '';
    if (!jwt || jwt.split('.').length !== 3) throw new Error('Invalid JWT');

    localStorage.setItem('jwt', jwt);
    localStorage.setItem('user', user);

    setAppVisible(true);
    await loadProfile();
  }catch(err){
    console.error(err);
    showError('Invalid username/email or password');
  }
}

function logout(){
  localStorage.clear();
  setAppVisible(false);
}

/* ===== GraphQL ===== */
const profileQuery = `{
  user { id firstName lastName auditRatio groups { id } xps { amount path } }
  transaction { type amount createdAt }
}`;
async function gql(query){
  const token = localStorage.getItem('jwt');
  const res = await axios.post(API_GRAPHQL, { query }, { headers:{ Authorization: 'Bearer ' + token }});
  return res.data;
}

/* ===== Info (text only) ===== */
function calculateTotalXP(xps){
  const modulePathRegex = /module(?!\/piscine)/i;
  const totalModuleXp = (xps||[])
    .filter(xp => modulePathRegex.test(xp.path || ''))
    .reduce((sum, xp) => sum + (xp.amount || 0), 0);
  return ((totalModuleXp + 70000) / 1000).toFixed(0); // KB
}
function setInfoFields(user, goXP, jsXP, highestSkill){
  const name = `${user.firstName||''} ${user.lastName||''}`.trim() || (localStorage.getItem('user')||'');
  $('welcome-msg').textContent = `Welcome, ${name} :)`;
  $('f-id').textContent     = user.id;
  $('f-name').textContent   = name;
  $('f-audit').textContent  = (user.auditRatio ?? 0).toFixed(3);
  $('f-go').textContent     = (goXP/1000).toFixed(2) + ' KB';
  $('f-js').textContent     = (jsXP/1000).toFixed(2) + ' KB';
  $('f-module').textContent = calculateTotalXP(user.xps) + ' KB';
  $('f-check').textContent  = highestSkill + '%';
  $('f-groups').textContent = (user.groups||[]).length;
}

/* ===== Charts ===== */
let CHARTS = { bar:null, pie:null, line:null };

function baseChartOptions(extra = {}){
  return Object.assign({
    responsive: true,
    maintainAspectRatio: false,   // canvas height controlled by CSS
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } }
  }, extra);
}

function createBarChart(xps){
  const xpData = (xps||[]).reduce((acc, xp) => {
    if (!xp || typeof xp.amount !== 'number') return acc;
    if (xp.path?.startsWith('/adam/module/piscine-js/')) acc['Piscine-Java'] = (acc['Piscine-Java'] || 0) + xp.amount;
    else if (xp.path?.startsWith('/adam/piscine-go/')) acc['Piscine-Go'] = (acc['Piscine-Go'] || 0) + xp.amount;
    else acc['Module'] = (acc['Module'] || 0) + xp.amount;
    return acc;
  }, {});
  const ctx = $('xpBarChart').getContext('2d');
  if (CHARTS.bar) CHARTS.bar.destroy();
  CHARTS.bar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(xpData),
      datasets: [{
        label: 'Total XP by Project',
        data: Object.values(xpData),
        backgroundColor: ['rgba(255,105,180,.5)','rgba(255,20,147,.5)','rgba(255,182,193,.5)'],
        borderColor: ['rgba(255,105,180,1)','rgba(255,20,147,1)','rgba(255,182,193,1)'],
        borderWidth: 1
      }]
    },
    options: baseChartOptions()
  });
}

function createPieChart(transactions){
  const skills = ['go','html','js','sql','unix','css','docker'];
  const data = (transactions||[])
    .filter(tx => (tx.type || '').startsWith('skill_'))
    .reduce((acc, tx) => { const k = tx.type.replace('skill_',''); if (skills.includes(k)) acc[k] = Math.max(acc[k]||0, tx.amount||0); return acc; }, {});
  const ctx = $('skillPieChart').getContext('2d');
  if (CHARTS.pie) CHARTS.pie.destroy();
  if (!Object.keys(data).length) return;
  CHARTS.pie = new Chart(ctx, {
    type: 'pie',
    data: { labels: Object.keys(data), datasets: [{ data: Object.values(data),
      backgroundColor: ['rgba(255,105,180,0.6)','rgba(255,182,193,0.6)','rgba(255,160,122,0.6)','rgba(221,160,221,0.6)','rgba(255,215,0,0.6)','rgba(17,138,178,0.6)','rgba(6,214,160,0.6)'],
      borderColor: '#fff', borderWidth: 2 }] },
    options: baseChartOptions({ scales: undefined })
  });
}

function createLineChart(transactions){
  const daily = {};
  (transactions||[]).sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt))
    .forEach(t => { const d = new Date(t.createdAt).toISOString().slice(0,10); daily[d] = (daily[d]||0) + (t.amount||0); });
  const dates = Object.keys(daily);
  const values = Object.values(daily);
  const ctx = $('newChart').getContext('2d');
  if (CHARTS.line) CHARTS.line.destroy();
  CHARTS.line = new Chart(ctx, {
    type: 'line',
    data: { labels: dates, datasets: [{ label:'XP over Time', data: values, borderColor:'rgba(255,105,180,1)', pointRadius:2, tension:.1, fill:false }] },
    options: baseChartOptions({ scales:{ x:{ type:'category' }, y:{ beginAtZero:true } } })
  });
}

/* ===== Export ===== */
$('export-btn').addEventListener('click', ()=>{
  [['xpBarChart','xp_progress.png'],['skillPieChart','skills_progress.png'],['newChart','xp_over_time.png']]
    .forEach(([id,name])=>{ const c=$(id); if(!c) return; const a=document.createElement('a'); a.href=c.toDataURL('image/png'); a.download=name; a.click(); });
});

/* ===== Resize helper ===== */
window.addEventListener('resize', () => {
  Object.values(CHARTS).forEach(c => c && c.resize());
});

/* ===== Load data ===== */
async function loadProfile(){
  try{
    const { data, errors } = await gql(profileQuery);
    if (errors) throw new Error(errors[0]?.message || 'GraphQL error');

    const user = data?.user?.[0];
    const tx   = data?.transaction || [];
    if (!user) throw new Error('User not found');

    const goXP = (user.xps||[]).filter(x=>x.path?.startsWith('/adam/piscine-go/')).reduce((a,x)=>a+(x.amount||0),0);
    const jsXP = (user.xps||[]).filter(x=>x.path?.startsWith('/adam/module/piscine-js/')).reduce((a,x)=>a+(x.amount||0),0);
    const highestSkill = tx.filter(t => (t.type||'').startsWith('skill_')).reduce((m,t)=>Math.max(m,t.amount||0),0);

    setInfoFields(user, goXP, jsXP, highestSkill);
    createBarChart(user.xps);
    createPieChart(tx);
    createLineChart(tx);
  }catch(err){
    console.error(err);
    showError('Error loading data. Please try again.');
    setAppVisible(false);
  }
}

/* ===== Init ===== */
(function init(){
  initTheme();
  $('theme-btn').addEventListener('click', toggleTheme);

  if (localStorage.getItem('jwt')) {
    setAppVisible(true);
    loadProfile().catch(()=>setAppVisible(false));
  } else {
    setAppVisible(false);
  }
})();
