const SUPPORT_EMAIL = 'preetirachha85@gmail.com';
const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.max(0, value));
const number = value => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.max(0, value));
const byId = id => document.getElementById(id);

const defaults = { sip: { monthly: 10000, rate: 12, years: 10 }, emi: { principal: 2500000, rate: 8.5, years: 20 } };

function bindRange(id, formatter, callback) {
  const input = byId(id);
  const output = byId(`${id}-value`);
  const update = () => { output.textContent = formatter(Number(input.value)); callback?.(); };
  input.addEventListener('input', update);
  update();
}

function drawSipChart(monthly, annualRate, years) {
  const canvas = byId('sip-chart');
  const context = canvas.getContext('2d');
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 500;
  const height = 145;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.scale(ratio, ratio);
  const values = [];
  const monthlyRate = annualRate / 100 / 12;
  for (let year = 1; year <= years; year += 1) {
    const months = year * 12;
    values.push(monthlyRate ? monthly * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate) : monthly * months);
  }
  const max = Math.max(...values, 1);
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(240,163,94,.45)');
  gradient.addColorStop(1, 'rgba(240,163,94,0)');
  context.beginPath();
  values.forEach((value, index) => {
    const x = values.length === 1 ? width : (index / (values.length - 1)) * width;
    const y = height - 10 - (value / max) * (height - 25);
    index === 0 ? context.moveTo(x, y) : context.lineTo(x, y);
  });
  context.lineTo(width, height); context.lineTo(0, height); context.closePath(); context.fillStyle = gradient; context.fill();
  context.beginPath();
  values.forEach((value, index) => { const x = values.length === 1 ? width : (index / (values.length - 1)) * width; const y = height - 10 - (value / max) * (height - 25); index === 0 ? context.moveTo(x, y) : context.lineTo(x, y); });
  context.strokeStyle = '#f0a35e'; context.lineWidth = 3; context.lineCap = 'round'; context.stroke();
}

function updateSip() {
  const monthly = Number(byId('sip-monthly').value); const annualRate = Number(byId('sip-rate').value); const years = Number(byId('sip-years').value);
  const monthlyRate = annualRate / 100 / 12; const months = years * 12;
  const futureValue = monthlyRate ? monthly * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate) : monthly * months;
  byId('sip-result').textContent = money(futureValue); byId('sip-invested').textContent = money(monthly * months); byId('sip-returns').textContent = money(futureValue - monthly * months); drawSipChart(monthly, annualRate, years);
}

function updateEmi() {
  const principal = Number(byId('emi-principal').value); const annualRate = Number(byId('emi-rate').value); const years = Number(byId('emi-years').value);
  const months = years * 12; const monthlyRate = annualRate / 100 / 12;
  const emi = monthlyRate ? principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1) : principal / months;
  const totalInterest = emi * months - principal;
  byId('emi-result').textContent = money(emi); byId('emi-principal-total').textContent = money(principal); byId('emi-interest').textContent = money(totalInterest);
  const principalBar = byId('emi-bar-chart').children[0]; const interestBar = byId('emi-bar-chart').children[1]; const total = principal + totalInterest;
  principalBar.style.height = `${Math.max(18, principal / total * 100)}%`; interestBar.style.height = `${Math.max(18, totalInterest / total * 100)}%`;
}

function updateGst() {
  const amount = Math.max(0, Number(byId('gst-amount').value) || 0); const rate = Number(byId('gst-rate').value); const mode = document.querySelector('[data-gst-mode].active').dataset.gstMode;
  const base = mode === 'exclusive' ? amount : amount / (1 + rate / 100); const tax = mode === 'exclusive' ? amount * rate / 100 : amount - base; const total = mode === 'exclusive' ? amount + tax : amount;
  byId('gst-mode-label').textContent = mode === 'exclusive' ? 'Final price' : 'Original price'; byId('gst-total').textContent = money(total); byId('gst-base').textContent = money(base); byId('gst-tax').textContent = money(tax);
}

function formatAge(birth, asOf) {
  if (birth > asOf) return null;
  let years = asOf.getFullYear() - birth.getFullYear(); let months = asOf.getMonth() - birth.getMonth(); let days = asOf.getDate() - birth.getDate();
  if (days < 0) { months -= 1; const previousMonthDays = new Date(asOf.getFullYear(), asOf.getMonth(), 0).getDate(); days += previousMonthDays; }
  if (months < 0) { years -= 1; months += 12; }
  const totalDays = Math.floor((asOf - birth) / 86400000);
  const birthday = new Date(asOf.getFullYear(), birth.getMonth(), birth.getDate()); if (birthday < asOf) birthday.setFullYear(asOf.getFullYear() + 1);
  const daysToBirthday = Math.ceil((birthday - asOf) / 86400000);
  return { label: `${years} years, ${months} months, ${days} days`, totalDays, daysToBirthday };
}

function updateAge() {
  const birth = new Date(`${byId('birth-date').value}T00:00:00`); const asOf = new Date(`${byId('as-of-date').value}T00:00:00`); const result = formatAge(birth, asOf);
  if (!result) { byId('age-result').textContent = 'Choose a valid date range'; byId('age-total-days').textContent = '—'; byId('age-next-birthday').textContent = '—'; return; }
  byId('age-result').textContent = result.label; byId('age-total-days').textContent = number(result.totalDays); byId('age-next-birthday').textContent = number(result.daysToBirthday);
}

function setInitialDates() {
  const today = new Date(); const iso = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const birth = new Date(today); birth.setFullYear(today.getFullYear() - 25); birth.setMonth(today.getMonth() - 2); birth.setDate(Math.max(1, today.getDate() - 12));
  byId('birth-date').value = iso(birth); byId('as-of-date').value = iso(today); updateAge();
}

function resetCalculator(type) {
  const values = defaults[type]; Object.entries(values).forEach(([key, value]) => { const input = byId(`${type}-${key}`); input.value = value; input.dispatchEvent(new Event('input')); });
}

bindRange('sip-monthly', value => money(value), updateSip);
bindRange('sip-rate', value => `${value}%`, updateSip);
bindRange('sip-years', value => `${value} years`, updateSip);
bindRange('emi-principal', value => money(value), updateEmi);
bindRange('emi-rate', value => `${value}%`, updateEmi);
bindRange('emi-years', value => `${value} years`, updateEmi);

document.querySelectorAll('.quick-chips button').forEach(button => button.addEventListener('click', () => { const input = byId(button.dataset.target); input.value = button.dataset.value; input.dispatchEvent(new Event('input')); }));
document.querySelectorAll('[data-reset]').forEach(button => button.addEventListener('click', () => resetCalculator(button.dataset.reset)));

document.querySelectorAll('[data-gst-mode]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-gst-mode]').forEach(item => item.classList.remove('active')); button.classList.add('active'); updateGst(); }));
byId('gst-amount').addEventListener('input', updateGst); byId('gst-rate').addEventListener('change', updateGst);
byId('birth-date').addEventListener('change', updateAge); byId('as-of-date').addEventListener('change', updateAge); setInitialDates(); updateGst();

const themeToggle = byId('theme-toggle');
const setTheme = dark => { document.body.classList.toggle('dark', dark); byId('theme-icon').textContent = dark ? '☾' : '☼'; themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode'); localStorage.setItem('smartcalc-theme', dark ? 'dark' : 'light'); };
setTheme(localStorage.getItem('smartcalc-theme') === 'dark'); themeToggle.addEventListener('click', () => setTheme(!document.body.classList.contains('dark')));

byId('menu-toggle').addEventListener('click', () => { const nav = byId('main-nav'); const open = nav.classList.toggle('open'); byId('menu-toggle').setAttribute('aria-expanded', open); });
document.querySelectorAll('#main-nav a').forEach(link => link.addEventListener('click', () => { byId('main-nav').classList.remove('open'); byId('menu-toggle').setAttribute('aria-expanded', 'false'); }));

byId('site-search').addEventListener('input', event => { const query = event.target.value.trim().toLowerCase(); document.querySelectorAll('.calc-tile,.read-grid a').forEach(item => { item.hidden = Boolean(query) && !item.textContent.toLowerCase().includes(query); }); });
byId('contact-form').addEventListener('submit', event => { event.preventDefault(); byId('form-status').textContent = `Thanks, your note is ready to be reviewed. Email ${SUPPORT_EMAIL} for direct support.`; event.target.reset(); });
window.addEventListener('resize', () => updateSip());
