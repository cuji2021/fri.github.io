
// App logic externalized
const STORAGE_KEY = 'fri_produccion_data';
const fields = [
  {id:'Fecha_corte_informacion_reportada', label:'Fecha_corte_informacion_reportada', type:'date', required:true},
  {id:'Mineral', label:'Mineral', type:'select', required:true, options:['','Carbón','Hierro','Cobre','Oro','Plata']},
  {id:'Titulo_minero', label:'Titulo_minero', type:'text', required:true},
  {id:'Municipio_de_extraccion', label:'Municipio_de_extraccion', type:'text', required:true},
  {id:'Codigo_Municipio_extraccion', label:'Codigo_Municipio_extraccion', type:'text', required:true, pattern:'\\d{5}', maxlength:5},
  {id:'Tipo_carbon', label:'Tipo_carbon', type:'select', required:true, options:['','Térmico','Metalúrgico','Subbituminoso','Antracita']},
  {id:'Tipo_explotacion', label:'Tipo_explotacion', type:'select', required:true, options:['','Subterránea','A cielo abierto','Mixta']},
  {id:'Mecanismo_arranque', label:'Mecanismo_arranque', type:'select', required:true, options:['','Mecánico','Manual','Explosivo','Otro']},
  {id:'Personal_mina', label:'Personal_mina', type:'number', required:true, min:0},
  {id:'Rendimiento_hombre', label:'Rendimiento_hombre', type:'number', required:true, step:'0.01', min:0},
  {id:'Cantidad_produccion', label:'Cantidad_produccion', type:'number', required:true, step:'0.01', min:0},
  {id:'Unidad_medida_produccion', label:'Unidad_medida_produccion', type:'select', required:true, options:['','Toneladas','m³','Kg','Lb']},
  {id:'Horas_Operativas', label:'Horas_Operativas', type:'number', required:true, min:0},
  {id:'Calidad_mineral', label:'Calidad_mineral', type:'select', required:true, options:['','Alta','Media','Baja']}
];

document.addEventListener('DOMContentLoaded', ()=>{
  buildForm();
  buildEditForm();
  bindEvents();
  renderSummary();
  renderTable();
  // show login modal simulation removed for simplicity; set demo user
  document.getElementById('menuUser').textContent = 'titular (Titular)';
});

function buildForm(){
  const container = document.getElementById('formFields');
  container.innerHTML = '';
  fields.forEach(f=>{
    const div = document.createElement('div');
    div.className = 'mb-2';
    const label = document.createElement('label');
    label.className='form-label';
    label.textContent = f.label;
    div.appendChild(label);
    let input;
    if(f.type === 'select'){
      input = document.createElement('select');
      input.className='form-select';
      input.id = f.id;
      if(f.required) input.required = true;
      f.options.forEach(opt=>{
        const o = document.createElement('option'); o.textContent = opt; o.value = opt; input.appendChild(o);
      });
    } else {
      input = document.createElement('input');
      input.className='form-control';
      input.id = f.id;
      input.type = f.type || 'text';
      if(f.required) input.required = true;
      if(f.maxlength) input.maxLength = f.maxlength;
      if(f.pattern) input.pattern = f.pattern;
      if(f.min !== undefined) input.min = f.min;
      if(f.step) input.step = f.step;
    }
    const feedback = document.createElement('div'); feedback.className='invalid-feedback'; feedback.textContent = 'Campo inválido o requerido.';
    div.appendChild(input); div.appendChild(feedback);
    container.appendChild(div);
  });
}

function buildEditForm(){
  const container = document.getElementById('formEditFields');
  container.innerHTML = '';
  fields.forEach(f=>{
    const div = document.createElement('div');
    div.className = 'mb-2';
    const label = document.createElement('label');
    label.className='form-label';
    label.textContent = f.label;
    div.appendChild(label);
    let input;
    if(f.type === 'select'){
      input = document.createElement('select');
      input.className='form-select';
      input.id = 'e_'+f.id;
      if(f.required) input.required = true;
      f.options.forEach(opt=>{
        const o = document.createElement('option'); o.textContent = opt; o.value = opt; input.appendChild(o);
      });
    } else {
      input = document.createElement('input');
      input.className='form-control';
      input.id = 'e_'+f.id;
      input.type = f.type || 'text';
      if(f.required) input.required = true;
      if(f.maxlength) input.maxLength = f.maxlength;
      if(f.pattern) input.pattern = f.pattern;
      if(f.min !== undefined) input.min = f.min;
      if(f.step) input.step = f.step;
    }
    const feedback = document.createElement('div'); feedback.className='invalid-feedback'; feedback.textContent = 'Campo inválido o requerido.';
    div.appendChild(input); div.appendChild(feedback);
    container.appendChild(div);
  });
}

function bindEvents(){
  document.getElementById('formProduccion').addEventListener('submit', e=>{ e.preventDefault(); saveForm(); });
  document.getElementById('btnClear').addEventListener('click', ()=> document.getElementById('formProduccion').reset());
  document.getElementById('btnExportAll').addEventListener('click', exportAllXLSX);
  document.getElementById('btnSendANM').addEventListener('click', ()=>{
    const arr = loadData();
    if(arr.length===0) return alert('No hay registros para enviar.');
    if(confirm('Simular envío de '+arr.length+' registro(s) a ANM?')) alert('Simulación completada: registros marcados como enviados (local).');
  });
  document.getElementById('btnCancelEdit').addEventListener('click', ()=>{ toggleEdit(false); });
  document.getElementById('btnUpdate').addEventListener('click', e=>{ e.preventDefault(); updateRecord(); });
  document.querySelector('#tblProducciones tbody').addEventListener('click', e=>{
    const tr = e.target.closest('tr'); if(!tr) return; const id = tr.dataset.id;
    if(e.target.matches('.btn-edit')) editRecord(id);
    if(e.target.matches('.btn-delete')) deleteRecord(id);
  });
  // responsive: collapse sidebar on very small screens when link clicked
  document.querySelectorAll('#mainMenu a').forEach(a=> a.addEventListener('click', ()=>{ document.querySelector('.sidebar').classList.toggle('d-none'); }));
}

function loadData(){ try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; }catch(e){ return []; } }
function saveData(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); renderSummary(); renderTable(); }

function validateField(el){
  if(!el) return true;
  const val = el.value;
  if(el.hasAttribute('required') && (val === null || val === undefined || String(val).trim() === '')){ el.classList.add('is-invalid'); return false; }
  if(el.getAttribute('type') === 'number'){
    const num = parseFloat(val);
    if(isNaN(num) || (el.hasAttribute('min') && num < parseFloat(el.getAttribute('min')))){ el.classList.add('is-invalid'); return false; }
  }
  if(el.getAttribute('pattern')){
    const re = new RegExp('^'+el.getAttribute('pattern')+'$');
    if(!re.test(val)){ el.classList.add('is-invalid'); return false; }
  }
  el.classList.remove('is-invalid'); return true;
}

function clearValidation(form){ form.querySelectorAll('.is-invalid').forEach(n=> n.classList.remove('is-invalid')); }

function saveForm(){
  const form = document.getElementById('formProduccion');
  clearValidation(form);
  const data = { id: Date.now().toString() };
  fields.forEach(f=>{ const el = document.getElementById(f.id); data[f.id] = el ? el.value : ''; });
  // validate
  let ok = true;
  fields.forEach(f=>{ const el = document.getElementById(f.id); if(!validateField(el)) ok = false; });
  if(!ok){ alert('Corrija los campos en rojo.'); return; }
  if(parseFloat(data.Cantidad_produccion) <= 0){ alert('La cantidad producida debe ser mayor a cero.'); return; }
  const arr = loadData(); arr.push(data); saveData(arr); form.reset(); alert('Registro guardado localmente.'); 
}

function renderSummary(){ const arr = loadData(); document.getElementById('cntProducciones').textContent = arr.length; const sum = arr.reduce((s,r)=> s + (parseFloat(r.Cantidad_produccion)||0), 0); document.getElementById('sumProducido').textContent = sum.toFixed(2); }

function renderTable(){ const tbody = document.querySelector('#tblProducciones tbody'); tbody.innerHTML = ''; const arr = loadData();
  arr.forEach((r, idx)=>{ const tr = document.createElement('tr'); tr.dataset.id = r.id; tr.innerHTML = `<td>${idx+1}</td><td>${r.Fecha_corte_informacion_reportada}</td><td>${r.Mineral}</td><td>${r.Titulo_minero}</td><td>${r.Municipio_de_extraccion}</td><td>${r.Codigo_Municipio_extraccion}</td><td>${r.Cantidad_produccion}</td><td>${r.Unidad_medida_produccion}</td><td>${r.Horas_Operativas}</td><td><div class="btn-group btn-group-sm" role="group"><button class="btn btn-outline-primary btn-edit">Editar</button><button class="btn btn-outline-danger btn-delete">Eliminar</button></div></td>`; tbody.appendChild(tr); });
}

function editRecord(id){ const arr = loadData(); const rec = arr.find(r=> r.id === id); if(!rec) return alert('Registro no encontrado'); document.getElementById('formEdit').style.display = ''; document.getElementById('editId').value = rec.id; fields.forEach(f=>{ const el = document.getElementById('e_'+f.id); if(el) el.value = rec[f.id] || ''; }); window.scrollTo({top:0,behavior:'smooth'}); }
function toggleEdit(show){ document.getElementById('formEdit').style.display = show ? '' : 'none'; }

function updateRecord(){ const id = document.getElementById('editId').value; const arr = loadData(); const idx = arr.findIndex(r=> r.id === id); if(idx === -1) return alert('Registro no encontrado'); let ok = true; fields.forEach(f=>{ const el = document.getElementById('e_'+f.id); if(el){ if(!validateField(el)) ok = false; arr[idx][f.id] = el.value; } }); if(!ok){ alert('Corrija los campos en rojo.'); return; } saveData(arr); toggleEdit(false); alert('Registro actualizado.'); }

function deleteRecord(id){ if(!confirm('Eliminar registro?')) return; const arr = loadData().filter(r=> r.id !== id); saveData(arr); }

function exportAllXLSX(){ const arr = loadData(); if(arr.length===0) return alert('No hay registros para exportar.'); const headers = fields.map(f=> f.id); const ws_data = [headers]; arr.forEach(r=>{ const row = headers.map(h=> r[h] !== undefined ? r[h] : ''); ws_data.push(row); }); const wb = XLSX.utils.book_new(); const ws = XLSX.utils.aoa_to_sheet(ws_data); XLSX.utils.book_append_sheet(wb, ws, 'FRI_Produccion'); XLSX.writeFile(wb, 'FRI_Produccion_demo.xlsx'); }
