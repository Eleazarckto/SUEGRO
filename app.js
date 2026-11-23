'use strict';
let datos = {}, ocupado = false, pedidoEditado = null, imagenActual = '', ediciones = {};
const $ = id => document.getElementById(id);
const esquemas = {
 precios: { form: 'form-precios', campos: { prenda: 'p-prenda', talla: 'p-talla', detal: 'p-detal', mayor: 'p-mayor' } },
 envios: { form: 'form-envios', campos: { zona: 'e-zona', costo: 'e-costo' } },
 empleados: { form: 'form-empleado-prod', campos: { fecha: 'emp-fecha', empleado: 'emp-nombre', prenda: 'emp-prenda', cantidad: 'emp-cantidad', comision: 'emp-comision' } },
 caja: { form: 'form-caja', campos: { fecha: 'caja-fecha', concepto: 'caja-concepto', monto: 'caja-monto' } },
 notas: { form: 'form-nota', campos: { fecha: 'nota-fecha', titulo: 'nota-titulo', contenido: 'nota-contenido' } }
};
function avisar(mensaje, error = false) {
 $('aviso').textContent = mensaje; $('aviso').className = error ? 'aviso error' : 'aviso'; $('aviso').hidden = false;
 $('aviso').setAttribute('role', error ? 'alert' : 'status');
}
function bloquear(valor) {
 ocupado = valor;
 document.querySelectorAll('button, input, select, textarea').forEach(el => el.disabled = valor);
 $('estado-db').textContent = valor ? 'Guardando…' : 'Guardado local';
}
async function cargar() { datos = Dominio.respaldo(await BaseDatos.leer()); renderizarTodo(); }
async function ejecutar(accion, mensaje = 'Cambios guardados en este navegador.') {
 if (ocupado) return;
 bloquear(true);
 try { const resultado = await accion(); await cargar(); if (resultado !== false) avisar(mensaje); }
 catch (error) { avisar(error.message, true); }
 finally { bloquear(false); }
}
function cambiarTab(tab, boton) {
 document.querySelectorAll('.seccion').forEach(s => s.classList.toggle('activa', s.id === `sec-${tab}`));
 document.querySelectorAll('.tab-btn').forEach(b => { b.classList.toggle('active', b === boton); b.setAttribute('aria-current', b === boton ? 'page' : 'false'); });
 $('titulo-pagina').textContent = boton.dataset.titulo || boton.textContent;
}
function cancelarPedido() {
 $('form-agenda').reset(); pedidoEditado = null; imagenActual = ''; $('fechaIngreso').value = Dominio.hoy();
 $('guardar-pedido').textContent = 'Guardar pedido'; $('cancelar-pedido').hidden = true; $('titulo-formulario').textContent = 'Nuevo pedido';
}
function editarPedido(id) {
 const p = datos.pedidos.find(r => r.id === id); if (!p) return;
 cambiarTab('pedidos', document.querySelector('[data-titulo="Pedidos"]'));
 for (const k of ['cliente', 'prenda', 'color', 'talla', 'cantidad', 'detalles', 'fechaIngreso', 'fechaEntrega', 'zonaEnvio', 'ubicacion']) {
  if ($(k).tagName === 'SELECT' && !Array.from($(k).options).some(o => o.value === String(p[k]))) $(k).add(new Option(p[k], p[k]));
  $(k).value = p[k];
 }
 pedidoEditado = p; imagenActual = p.imagen; $('imagen').value = '';
 $('guardar-pedido').textContent = 'Guardar cambios'; $('cancelar-pedido').hidden = false; $('titulo-formulario').textContent = 'Editar pedido';
 $('cliente').focus(); window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function leerImagen(archivo) {
 if (!archivo) return imagenActual;
 if (archivo.size > 2 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(archivo.type)) throw Error('Selecciona una imagen PNG, JPEG, WebP o GIF de hasta 2 MB.');
 return new Promise((resolve, reject) => {
  const lector = new FileReader(); lector.onerror = () => reject(Error('No se pudo leer la imagen. Selecciónala otra vez.'));
  lector.onload = () => resolve(lector.result); lector.readAsDataURL(archivo);
 });
}
$('form-agenda').addEventListener('submit', e => {
 e.preventDefault(); ejecutar(async () => {
  const p = {};
  ['cliente', 'prenda', 'color', 'talla', 'cantidad', 'detalles', 'fechaIngreso', 'fechaEntrega', 'zonaEnvio', 'ubicacion'].forEach(k => p[k] = $(k).value);
  p.imagen = await leerImagen($('imagen').files[0]); p.entregado = pedidoEditado?.entregado || false;
  p.uid = pedidoEditado?.uid || crypto.randomUUID(); if (pedidoEditado) p.id = pedidoEditado.id;
  await BaseDatos.guardarPedido(Dominio.normalizar('pedidos', p), pedidoEditado); cancelarPedido();
 });
});
function marcarEntregado(id) {
 const p = datos.pedidos.find(r => r.id === id);
 if (!p || !confirm(`¿${p.entregado ? 'Volver a poner en taller' : 'Marcar como entregado'} el pedido de ${p.cliente}?`)) return;
 ejecutar(() => BaseDatos.guardarPedido({ ...p, entregado: !p.entregado }, p));
}
function eliminarRegistro(id) {
 const p = datos.pedidos.find(r => r.id === id);
 if (confirm('¿Eliminar este pedido de forma permanente? Descarga un respaldo si necesitas conservarlo.')) ejecutar(() => BaseDatos.borrarPedido(id, p));
}
for (const [tipo, esquema] of Object.entries(esquemas)) {
 $(esquema.form).addEventListener('submit', e => {
  e.preventDefault(); ejecutar(async () => {
   const r = {}; for (const [k, id] of Object.entries(esquema.campos)) r[k] = $(id).value;
   const indice = ediciones[tipo]; r.uid = indice !== undefined ? datos[tipo][indice].uid || crypto.randomUUID() : crypto.randomUUID();
   const validado = Dominio.normalizar(tipo, r), lista = [...datos[tipo]];
   if (indice === undefined) lista.push(validado); else lista[indice] = validado;
   await BaseDatos.guardarLista(tipo, lista, datos[tipo]); cancelarEdicion(tipo);
  });
 });
}
function editarLista(tipo, indice) {
 const r = datos[tipo][indice], esquema = esquemas[tipo]; ediciones[tipo] = indice;
 for (const [k, id] of Object.entries(esquema.campos)) $(id).value = r[k + 'Centavos'] !== undefined ? Dominio.decimal(r[k + 'Centavos']) : r[k];
 $(esquema.form).querySelector('[type=submit]').textContent = 'Guardar cambios'; $(`cancelar-${tipo}`).hidden = false;
 $(Object.values(esquema.campos)[0]).focus();
}
function cancelarEdicion(tipo) {
 const esquema = esquemas[tipo]; delete ediciones[tipo]; $(esquema.form).reset();
 $(esquema.form).querySelector('[type=submit]').textContent = 'Guardar'; $(`cancelar-${tipo}`).hidden = true;
 if (esquema.campos.fecha) $(esquema.campos.fecha).value = Dominio.hoy();
}
function eliminarLista(tipo, indice) {
 if (!confirm('¿Eliminar este registro de forma permanente?')) return;
 ejecutar(async () => { await BaseDatos.guardarLista(tipo, datos[tipo].filter((_, i) => i !== indice), datos[tipo]); cancelarEdicion(tipo); });
}
async function exportarBaseDatos() {
 if (ocupado) return;
 try {
  const copia = await BaseDatos.leer();
  const blob = new Blob([JSON.stringify({ version: 2, fechaRespaldo: new Date().toISOString(), ...copia }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `TELAS_respaldo_${Dominio.hoy()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); avisar('Respaldo preparado. Comprueba que aparezca en tus descargas.');
 } catch { avisar('No se pudo preparar el respaldo. Vuelve a intentarlo.', true); }
}
function importarBaseDatos(event) {
 const archivo = event.target.files[0]; if (!archivo) return;
 ejecutar(async () => {
  if (archivo.size > 50 * 1024 * 1024) throw Error('El respaldo supera el límite de 50 MB.');
  let contenido; try { contenido = JSON.parse(await archivo.text()); } catch { throw Error('El archivo no contiene un respaldo JSON válido.'); }
  const copia = Dominio.respaldo(contenido);
  if (!confirm('Se agregarán los registros nuevos. Se conservarán los actuales y no se reemplazarán los que ya tengan la misma referencia. ¿Importar respaldo?')) return false;
  await BaseDatos.importar(copia);
 }, 'Respaldo importado. Los registros existentes se conservaron.'); event.target.value = '';
}
function abrirVisor(id) {
 const p = datos.pedidos.find(r => r.id === id); if (!p?.imagen) return;
 $('imagen-ampliada').src = p.imagen; $('imagen-ampliada').alt = `Diseño de ${p.cliente}`;
 $('texto-modal').textContent = `${p.cliente} · ${p.prenda} · ${p.detalles}`; $('visor-modal').showModal();
}
function cerrarVisor() { $('visor-modal').close(); }
function alternarTema() {
 const oscuro = document.documentElement.dataset.tema !== 'oscuro'; document.documentElement.dataset.tema = oscuro ? 'oscuro' : 'claro';
 $('tema').textContent = oscuro ? '☀ Modo claro' : '☾ Modo oscuro';
 try { localStorage.setItem('telas-tema', oscuro ? 'oscuro' : 'claro'); } catch { avisar('El tema se aplicó solo a esta sesión.'); }
}
function prepararInterfaz() {
 document.querySelectorAll('.grupo-input').forEach(g => { const i = g.querySelector('input,select'); if (i) g.querySelector('label').htmlFor = i.id; });
 document.querySelectorAll('.form-mini input,.form-mini select,#form-nota input,#form-nota textarea').forEach(el => {
  const label = document.createElement('label'); label.htmlFor = el.id; label.textContent = el.type === 'date' ? 'Fecha' : el.placeholder || 'Prenda';
  const envoltorio = document.createElement('div'); envoltorio.className = 'campo-mini'; el.before(envoltorio); envoltorio.append(label, el);
 });
 document.querySelectorAll('input[type=number]').forEach(el => { el.min = ['cantidad', 'emp-cantidad'].includes(el.id) ? '1' : '0'; });
 document.querySelectorAll('table').forEach(tabla => {
  if (!tabla.parentElement.classList.contains('table-container')) { const caja = document.createElement('div'); caja.className = 'table-container'; tabla.before(caja); caja.append(tabla); }
  tabla.querySelectorAll('th').forEach(th => th.scope = 'col');
 });
 for (const [tipo, esquema] of Object.entries(esquemas)) {
  const b = document.createElement('button'); b.type = 'button'; b.id = `cancelar-${tipo}`; b.hidden = true; b.textContent = 'Cancelar edición'; b.onclick = () => cancelarEdicion(tipo); $(esquema.form).append(b);
 }
 ['fechaIngreso', 'emp-fecha', 'caja-fecha', 'nota-fecha'].forEach(id => $(id).value = Dominio.hoy());
 $('filtro-caja').value = Dominio.hoy();
}
async function iniciar() {
 prepararInterfaz(); bloquear(true); $('estado-db').textContent = 'Abriendo almacenamiento…';
 try { if (localStorage.getItem('telas-tema') === 'oscuro') alternarTema(); } catch { avisar('Las preferencias visuales no están disponibles.'); }
 try { await BaseDatos.abrir(); await cargar(); bloquear(false); }
 catch (error) { $('estado-db').textContent = 'Almacenamiento no disponible'; avisar(`${error.message} No borres los datos del navegador.`, true); ocupado = false; $('exportar').disabled = false; }
}
iniciar();
