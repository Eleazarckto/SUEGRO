'use strict';
const Vista = (() => {
 function nodo(tipo, texto, clase) { const n = document.createElement(tipo); if (texto !== undefined) n.textContent = texto; if (clase) n.className = clase; return n; }
 function boton(texto, accion, clase = 'btn-editar') { const b = nodo('button', texto, clase); b.type = 'button'; b.onclick = accion; return b; }
 function vacio(cuerpo, columnas, texto) { const fila = nodo('tr'); const celda = nodo('td', texto, 'vacio'); celda.colSpan = columnas; fila.append(celda); cuerpo.append(fila); }
 function fila(cuerpo, valores) { const tr = nodo('tr'); valores.forEach((v, i) => { const td = nodo('td'); td.dataset.etiqueta = cuerpo.closest('table').querySelectorAll('th')[i]?.textContent || ''; if (v instanceof Node) td.append(v); else td.textContent = v; tr.append(td); }); cuerpo.append(tr); }
 function acciones(tipo, i) { const caja = nodo('div', undefined, 'acciones'); caja.append(boton('Editar', () => editarLista(tipo, i)), boton('Eliminar', () => eliminarLista(tipo, i), 'btn-eliminar')); return caja; }
 function diseno(p) { const caja = nodo('div', undefined, 'diseno'); if (p.imagen) { const b = boton('', () => abrirVisor(p.id), 'boton-imagen'); const img = nodo('img'); img.src = p.imagen; img.alt = `Ver diseño de ${p.cliente}`; img.className = 'miniatura-logo'; b.append(img); caja.append(b); } const t = nodo('div'); t.append(nodo('strong', p.prenda), nodo('small', p.detalles)); caja.append(t); return caja; }
 function fechas(p) { const n = nodo('div'); n.append(nodo('small', `Ingreso · ${p.fechaIngreso}`), nodo('small', `Entrega · ${p.fechaEntrega}`)); if (!p.entregado && p.fechaEntrega <= Dominio.hoy()) n.append(nodo('span', p.fechaEntrega === Dominio.hoy() ? 'Entrega hoy' : 'Atrasado', 'estado-pendiente')); return n; }
 function pedidoAcciones(p, historial) { const n = nodo('div', undefined, 'acciones'); n.append(boton('Editar', () => editarPedido(p.id)), boton(p.entregado ? 'Reabrir' : 'Entregar', () => marcarEntregado(p.id), 'btn-completar')); if (!historial) n.append(boton('Eliminar', () => eliminarRegistro(p.id), 'btn-eliminar')); return n; }
 function pedidos(historial = false) {
  const cuerpo = $(historial ? 'tabla-bd-clientes' : 'lista-agenda'); cuerpo.replaceChildren();
  const busqueda = Dominio.buscar($(historial ? 'buscador-cliente' : 'buscar-pedidos').value);
  const estado = $(historial ? 'filtro-estado-db' : 'filtro-entrega').value;
  const lista = datos.pedidos.filter(p => {
   const coincide = Dominio.buscar(`${p.cliente} ${p.prenda} ${p.detalles} ${p.ubicacion}`).includes(busqueda);
   if (!coincide) return false;
   if (historial) return estado === 'TODOS' || (estado === 'ENTREGADO' ? p.entregado : !p.entregado);
   return !p.entregado && (estado === 'todos' || (estado === 'hoy' ? p.fechaEntrega === Dominio.hoy() : p.fechaEntrega < Dominio.hoy()));
  }).sort((a,b) => historial ? b.id - a.id : a.fechaEntrega.localeCompare(b.fechaEntrega));
  lista.forEach(p => {
   const direccion = nodo('div'); direccion.append(nodo('strong', p.zonaEnvio), nodo('small', p.ubicacion));
   if (historial) fila(cuerpo, [p.cliente, nodo('span', p.entregado ? 'Entregado' : 'En taller', p.entregado ? 'estado-entregado' : 'estado-pendiente'), fechas(p), diseno(p), `${p.color} · ${p.talla}`, p.cantidad, direccion, pedidoAcciones(p, true)]);
   else fila(cuerpo, [fechas(p), p.cliente, diseno(p), `${p.color} · ${p.talla}`, p.cantidad, direccion, pedidoAcciones(p, false)]);
  });
  if (!lista.length) vacio(cuerpo, historial ? 8 : 7, busqueda ? 'No hay pedidos que coincidan con tu búsqueda.' : 'No hay pedidos para este filtro.');
  if (!historial) $('conteo-pedidos').textContent = `${lista.length} pedidos`;
 }
 function catalogos() {
  const p = $('tabla-precios'), e = $('tabla-envios'), zona = $('zonaEnvio'), seleccion = zona.value;
  p.replaceChildren(); e.replaceChildren(); zona.replaceChildren(new Option('Selecciona una zona…', ''));
  datos.precios.forEach((r,i) => fila(p, [r.prenda, r.talla, Dominio.moneda(r.detalCentavos), Dominio.moneda(r.mayorCentavos), acciones('precios',i)]));
  datos.envios.forEach((r,i) => { fila(e, [r.zona, Dominio.moneda(r.costoCentavos), acciones('envios',i)]); const valor = `${r.zona} ($${Dominio.decimal(r.costoCentavos)})`; zona.add(new Option(`${r.zona} · ${Dominio.moneda(r.costoCentavos)}`, valor)); });
  if (seleccion && !Array.from(zona.options).some(o => o.value === seleccion)) zona.add(new Option(seleccion, seleccion)); zona.value = seleccion;
  if (!datos.precios.length) vacio(p,5,'Agrega las tarifas reales de tu taller.');
  if (!datos.envios.length) vacio(e,3,'Agrega una zona de entrega.');
 }
 function empleados() {
  const c = $('tabla-empleados'); c.replaceChildren();
  datos.empleados.forEach((r,i) => fila(c,[r.fecha,r.empleado,r.prenda,r.cantidad,Dominio.moneda(r.comisionCentavos),Dominio.moneda(r.comisionCentavos*r.cantidad),acciones('empleados',i)]));
  if (!datos.empleados.length) vacio(c,7,'Aún no has registrado producción.');
 }
 function caja() {
  const c = $('tabla-caja'), fecha = $('filtro-caja').value; c.replaceChildren(); let suma = 0, cantidad = 0;
  datos.caja.forEach((r,i) => { if (fecha && r.fecha !== fecha) return; cantidad++; suma += r.montoCentavos; fila(c,[r.fecha,r.concepto,Dominio.moneda(r.montoCentavos),acciones('caja',i)]); });
  $('total-caja-txt').textContent = Number.isSafeInteger(suma) ? Dominio.moneda(suma) : 'Total fuera del rango admitido';
  $('periodo-caja').textContent = fecha ? `Ingresos del ${fecha}` : 'Ingresos de todas las fechas';
  if (!cantidad) vacio(c,4,'No hay ingresos en el período seleccionado.');
 }
 function notas() {
  const c = $('cuadricula-notas'); c.replaceChildren();
  datos.notas.forEach((r,i) => { const n = nodo('article',undefined,'tarjeta-nota'); n.append(nodo('small',r.fecha),nodo('h3',r.titulo),nodo('p',r.contenido),acciones('notas',i)); c.append(n); });
  if (!datos.notas.length) c.append(nodo('p','Tu cuaderno está vacío. Guarda aquí los detalles que necesitas recordar.','vacio'));
 }
 function estadisticas() {
  $('stat-hoy').textContent = datos.pedidos.filter(p => p.fechaIngreso === Dominio.hoy()).length;
  $('stat-entregados').textContent = datos.pedidos.filter(p => p.entregado).length;
  $('stat-pendientes').textContent = datos.pedidos.filter(p => !p.entregado).length;
  $('stat-prendas-hoy').textContent = datos.empleados.filter(p => p.fecha === Dominio.hoy()).reduce((n,p) => n+p.cantidad,0);
  const atrasados = datos.pedidos.filter(p => !p.entregado && p.fechaEntrega < Dominio.hoy()).length;
  $('resumen-entregas').textContent = atrasados ? `${atrasados} pedidos con entrega vencida` : 'Tus entregas, bajo control';
  const sugerencias = $('sugerencias-clientes'); sugerencias.replaceChildren(); [...new Set(datos.pedidos.map(p => p.cliente))].sort().forEach(c => sugerencias.append(new Option(c,c)));
 }
 return { pedidos, catalogos, empleados, caja, notas, estadisticas };
})();
function renderizarBaseDatosClientes() { Vista.pedidos(true); }
function renderizarTodo() { Vista.catalogos(); Vista.empleados(); Vista.caja(); Vista.notas(); Vista.pedidos(); Vista.pedidos(true); Vista.estadisticas(); }
