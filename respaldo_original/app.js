// ================= BASE DE DATOS INDEXEDDB (ALMACENAMIENTO PROFUNDO AUTOMÁTICO) =================
const DB_NAME = 'TallerConfeccionDB';
const DB_VERSION = 1;
let db;

let registros = [];
let listaPrecios = [];
let listaEnvios = [];
let listaEmpleados = [];
let listaCaja = [];
let listaNotas = [];

function iniciarBaseDeDatos() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            // Creamos las tablas (ObjectStores) indexadas
            if (!database.objectStoreNames.contains('pedidos')) {
                const store = database.createObjectStore('pedidos', { keyPath: 'id', autoIncrement: true });
                store.createIndex('cliente', 'cliente', { unique: false });
            }
            if (!database.objectStoreNames.contains('configuracion')) {
                database.createObjectStore('configuracion', { keyPath: 'clave' });
            }
        };

        request.onsuccess = (e) => {
            db = e.target.result;
            cargarTodoDesdeDB().then(resolve);
        };

        request.onerror = (e) => reject(e);
    });
}

// Guardar estado automático en IndexedDB
function guardarEnDB(clave, datos) {
    if (!db) return;
    const tx = db.transaction('configuracion', 'readwrite');
    tx.objectStore('configuracion').put({ clave: clave, valor: datos });
}

function guardarPedidoEnDB(pedido) {
    return new Promise((resolve) => {
        const tx = db.transaction('pedidos', 'readwrite');
        const store = tx.objectStore('pedidos');
        const req = store.put(pedido);
        req.onsuccess = () => {
            cargarTodoDesdeDB().then(resolve);
        };
    });
}

function eliminarPedidoDeDB(id) {
    return new Promise((resolve) => {
        const tx = db.transaction('pedidos', 'readwrite');
        tx.objectStore('pedidos').delete(id);
        tx.oncomplete = () => cargarTodoDesdeDB().then(resolve);
    });
}

function cargarTodoDesdeDB() {
    return new Promise((resolve) => {
        // 1. Cargar Pedidos
        const txPedidos = db.transaction('pedidos', 'readonly');
        const reqPedidos = txPedidos.objectStore('pedidos').getAll();
        reqPedidos.onsuccess = () => {
            registros = reqPedidos.result || [];
            
            // 2. Cargar Configuraciones y demás módulos
            const txConfig = db.transaction('configuracion', 'readonly');
            const reqConfig = txConfig.objectStore('configuracion').getAll();
            reqConfig.onsuccess = () => {
                const configs = {};
                (reqConfig.result || []).forEach(item => configs[item.clave] = item.valor);

                listaPrecios = configs.precios || [
                    { prenda: 'Franela', talla: 'S - M - L', detal: 10.00, mayor: 7.50 },
                    { prenda: 'Suéter', talla: 'S - M - L', detal: 22.00, mayor: 17.00 },
                    { prenda: 'Monos', talla: 'S - M - L', detal: 18.00, mayor: 14.00 }
                ];
                listaEnvios = configs.envios || [
                    { zona: 'Retiro en Taller', costo: 0.00 },
                    { zona: 'Delivery Zona Centro', costo: 2.00 },
                    { zona: 'Envío Nacional (MRW)', costo: 5.00 }
                ];
                listaEmpleados = configs.empleados || [];
                listaCaja = configs.caja || [];
                listaNotas = configs.notas || [];

                actualizarSugerenciasClientes();
                renderizarTodo();
                resolve();
            };
        };
    });
}

// ================= UTILIDADES Y NAVEGACIÓN =================
function obtenerFechaHoy() {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
}

function cambiarTab(tab, boton) {
    document.querySelectorAll('.seccion').forEach(sec => sec.classList.remove('activa'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`sec-${tab}`).classList.add('activa');
    boton.classList.add('active');
}

function actualizarSugerenciasClientes() {
    const datalist = document.getElementById('sugerencias-clientes');
    const clientesUnicos = [...new Set(registros.map(r => r.cliente.trim()))];
    datalist.innerHTML = clientesUnicos.map(c => `<option value="${c}">`).join('');
}

function actualizarEstadisticas() {
    const hoy = obtenerFechaHoy();
    document.getElementById('stat-hoy').innerText = registros.filter(p => p.fechaIngreso === hoy).length;
    document.getElementById('stat-entregados').innerText = registros.filter(p => p.entregado === true).length;
    document.getElementById('stat-pendientes').innerText = registros.filter(p => !p.entregado).length;
    document.getElementById('stat-prendas-hoy').innerText = listaEmpleados
        .filter(e => e.fecha === hoy)
        .reduce((total, item) => total + parseInt(item.cantidad || 0), 0);
}

// ================= 1. AGENDA DE PEDIDOS =================
function renderizarAgenda() {
    const listaAgenda = document.getElementById('lista-agenda');
    listaAgenda.innerHTML = '';
    
    const pendientes = registros.filter(r => !r.entregado)
        .sort((a, b) => new Date(a.fechaEntrega) - new Date(b.fechaEntrega));

    pendientes.forEach((item) => {
        const imagenHtml = item.imagen 
            ? `<img src="${item.imagen}" class="miniatura-logo" title="Clic para ampliar" onclick="abrirVisor(${item.id})">` 
            : `<span style="color: #999; font-size:11px;">Sin diseño</span>`;

        listaAgenda.innerHTML += `
            <tr>
                <td>
                    <div class="fechas-txt">Ingreso: <b>${item.fechaIngreso}</b></div>
                    <div class="fechas-txt" style="color: #d9534f;">Entrega: <b>${item.fechaEntrega}</b></div>
                </td>
                <td><b>${item.cliente}</b></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div>${imagenHtml}</div>
                        <div>
                            <b>${item.prenda}</b><br>
                            <small style="color: #555;"><i>${item.detalles}</i></small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge-color">${item.color}</span><br>
                    <small>Talla: <b>${item.talla}</b></small>
                </td>
                <td><b style="font-size: 16px; color: #0066cc;">${item.cantidad}</b></td>
                <td>
                    <span class="badge-color" style="background:#d1ecf1; color:#0c5460;">${item.zonaEnvio || 'N/A'}</span><br>
                    <small>${item.ubicacion}</small>
                </td>
                <td>
                    <button class="btn-completar" onclick="marcarEntregado(${item.id})">Entregar</button>
                    <button class="btn-eliminar" onclick="eliminarRegistro(${item.id})">X</button>
                </td>
            </tr>
        `;
    });
}

document.getElementById('form-agenda').addEventListener('submit', (e) => {
    e.preventDefault();
    const archivo = document.getElementById('imagen').files[0];
    if (archivo) {
        const lector = new FileReader();
        lector.readAsDataURL(archivo);
        lector.onload = () => procesarGuardadoPedido(lector.result);
    } else {
        procesarGuardadoPedido('');
    }
});

function procesarGuardadoPedido(imagenBase64) {
    const nuevoPedido = {
        cliente: document.getElementById('cliente').value.trim(),
        prenda: document.getElementById('prenda').value,
        color: document.getElementById('color').value,
        talla: document.getElementById('talla').value,
        cantidad: document.getElementById('cantidad').value,
        detalles: document.getElementById('detalles').value,
        imagen: imagenBase64,
        fechaIngreso: document.getElementById('fechaIngreso').value,
        fechaEntrega: document.getElementById('fechaEntrega').value,
        zonaEnvio: document.getElementById('zonaEnvio').value,
        ubicacion: document.getElementById('ubicacion').value,
        entregado: false
    };

    guardarPedidoEnDB(nuevoPedido).then(() => {
        document.getElementById('form-agenda').reset();
        document.getElementById('fechaIngreso').value = obtenerFechaHoy();
    });
}

function marcarEntregado(id) {
    const pedido = registros.find(r => r.id === id);
    if (pedido && confirm(`¿Marcar el pedido de "${pedido.cliente}" como ENTREGADO?`)) {
        pedido.entregado = true;
        guardarPedidoEnDB(pedido);
    }
}

function eliminarRegistro(id) {
    if (confirm("¿Eliminar permanentemente este registro de la base de datos?")) {
        eliminarPedidoDeDB(id);
    }
}

// ================= 2. BASE DE DATOS DE CLIENTES =================
function renderizarBaseDatosClientes() {
    const tbody = document.getElementById('tabla-bd-clientes');
    const textoFiltro = document.getElementById('buscador-cliente').value.toLowerCase();
    const estadoFiltro = document.getElementById('filtro-estado-db').value;

    tbody.innerHTML = '';

    const filtrados = registros.filter(item => {
        const coincideNombre = item.cliente.toLowerCase().includes(textoFiltro);
        const coincideEstado = estadoFiltro === 'TODOS' || 
            (estadoFiltro === 'ENTREGADO' && item.entregado) || 
            (estadoFiltro === 'PENDIENTE' && !item.entregado);
        return coincideNombre && coincideEstado;
    }).sort((a, b) => b.id - a.id); // Más recientes primero

    filtrados.forEach(item => {
        const badgeEstado = item.entregado 
            ? `<span class="estado-entregado">ENTREGADO</span>` 
            : `<span class="estado-pendiente">EN TALLER</span>`;
        
        const imagenHtml = item.imagen 
            ? `<img src="${item.imagen}" class="miniatura-logo" style="width:35px; height:35px;" onclick="abrirVisor(${item.id})">` 
            : '';

        tbody.innerHTML += `
            <tr>
                <td><b style="color: #0066cc; font-size: 15px;">${item.cliente}</b></td>
                <td>${badgeEstado}</td>
                <td>
                    <small>Ing: <b>${item.fechaIngreso}</b></small><br>
                    <small>Ent: <b>${item.fechaEntrega}</b></small>
                </td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        ${imagenHtml}
                        <div><b>${item.prenda}</b><br><small>${item.detalles}</small></div>
                    </div>
                </td>
                <td><span class="badge-color">${item.color}</span> - Talla <b>${item.talla}</b></td>
                <td><b>${item.cantidad}</b></td>
                <td><small><b>${item.zonaEnvio}</b><br>${item.ubicacion}</small></td>
            </tr>
        `;
    });
}

// Exportar e Importar Respaldo JSON de toda la Base de Datos
function exportarBaseDatos() {
    const backup = {
        fechaRespaldo: new Date().toISOString(),
        pedidos: registros,
        precios: listaPrecios,
        envios: listaEnvios,
        empleados: listaEmpleados,
        caja: listaCaja,
        notas: listaNotas
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Respaldo_Taller_${obtenerFechaHoy()}.json`;
    a.click();
}

function importarBaseDatos(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.pedidos) {
                for (const p of data.pedidos) {
                    delete p.id; // Evitar conflictos de ID
                    await guardarPedidoEnDB(p);
                }
            }
            if (data.precios) guardarEnDB('precios', data.precios);
            if (data.envios) guardarEnDB('envios', data.envios);
            if (data.empleados) guardarEnDB('empleados', data.empleados);
            if (data.caja) guardarEnDB('caja', data.caja);
            if (data.notas) guardarEnDB('notas', data.notas);

            await cargarTodoDesdeDB();
            alert('¡Base de datos restaurada con éxito!');
        } catch (err) {
            alert('El archivo seleccionado no es un respaldo válido.');
        }
    };
    lector.readAsText(archivo);
}

// ================= 3. PRECIOS Y ENVÍOS =================
function renderizarPrecios() {
    const tbody = document.getElementById('tabla-precios');
    tbody.innerHTML = '';
    listaPrecios.forEach((item, index) => {
        tbody.innerHTML += `
            <tr>
                <td><b>${item.prenda}</b></td>
                <td>${item.talla}</td>
                <td style="color: #0066cc; font-weight: bold;">$${parseFloat(item.detal).toFixed(2)}</td>
                <td style="color: #28a745; font-weight: bold;">$${parseFloat(item.mayor).toFixed(2)}</td>
                <td>
                    <button class="btn-editar" onclick="editarPrecio(${index})">Editar</button>
                    <button class="btn-eliminar" onclick="eliminarPrecio(${index})">X</button>
                </td>
            </tr>
        `;
    });
}

document.getElementById('form-precios').addEventListener('submit', (e) => {
    e.preventDefault();
    listaPrecios.push({
        prenda: document.getElementById('p-prenda').value,
        talla: document.getElementById('p-talla').value,
        detal: parseFloat(document.getElementById('p-detal').value),
        mayor: parseFloat(document.getElementById('p-mayor').value)
    });
    guardarEnDB('precios', listaPrecios);
    e.target.reset();
    renderizarPrecios();
});

function editarPrecio(index) {
    const item = listaPrecios[index];
    const nuevoDetal = prompt(`Nuevo precio Detal ($) para ${item.prenda}:`, item.detal);
    const nuevoMayor = prompt(`Nuevo precio Mayor ($) para ${item.prenda}:`, item.mayor);
    if (nuevoDetal !== null && nuevoMayor !== null) {
        listaPrecios[index].detal = parseFloat(nuevoDetal);
        listaPrecios[index].mayor = parseFloat(nuevoMayor);
        guardarEnDB('precios', listaPrecios);
        renderizarPrecios();
    }
}

function eliminarPrecio(index) {
    if (confirm('¿Eliminar tarifa?')) {
        listaPrecios.splice(index, 1);
        guardarEnDB('precios', listaPrecios);
        renderizarPrecios();
    }
}

function renderizarEnvios() {
    const tbody = document.getElementById('tabla-envios');
    const selectZona = document.getElementById('zonaEnvio');
    tbody.innerHTML = '';
    selectZona.innerHTML = '<option value="" disabled selected>Seleccione zona de envío...</option>';

    listaEnvios.forEach((item, index) => {
        tbody.innerHTML += `
            <tr>
                <td><b>${item.zona}</b></td>
                <td style="color: #0066cc; font-weight: bold;">$${parseFloat(item.costo).toFixed(2)}</td>
                <td>
                    <button class="btn-editar" onclick="editarEnvio(${index})">Editar</button>
                    <button class="btn-eliminar" onclick="eliminarEnvio(${index})">X</button>
                </td>
            </tr>
        `;
        selectZona.innerHTML += `<option value="${item.zona} ($${parseFloat(item.costo).toFixed(2)})">${item.zona} — $${parseFloat(item.costo).toFixed(2)}</option>`;
    });
}

document.getElementById('form-envios').addEventListener('submit', (e) => {
    e.preventDefault();
    listaEnvios.push({
        zona: document.getElementById('e-zona').value,
        costo: parseFloat(document.getElementById('e-costo').value)
    });
    guardarEnDB('envios', listaEnvios);
    e.target.reset();
    renderizarEnvios();
});

function editarEnvio(index) {
    const item = listaEnvios[index];
    const nuevoCosto = prompt(`Nuevo costo para "${item.zona}":`, item.costo);
    if (nuevoCosto !== null) {
        listaEnvios[index].costo = parseFloat(nuevoCosto);
        guardarEnDB('envios', listaEnvios);
        renderizarEnvios();
    }
}

function eliminarEnvio(index) {
    if (confirm('¿Eliminar zona?')) {
        listaEnvios.splice(index, 1);
        guardarEnDB('envios', listaEnvios);
        renderizarEnvios();
    }
}

// ================= 4. EMPLEADOS Y COMISIONES =================
function renderizarEmpleados() {
    const tbody = document.getElementById('tabla-empleados');
    tbody.innerHTML = '';
    listaEmpleados.forEach((item, index) => {
        const totalComision = item.cantidad * item.comision;
        tbody.innerHTML += `
            <tr>
                <td>${item.fecha || obtenerFechaHoy()}</td>
                <td><b>${item.empleado}</b></td>
                <td>${item.prenda}</td>
                <td><b style="color: #0066cc;">${item.cantidad}</b></td>
                <td>$${parseFloat(item.comision).toFixed(2)}</td>
                <td><b style="color: #28a745;">$${totalComision.toFixed(2)}</b></td>
                <td>
                    <button class="btn-editar" onclick="editarEmpleado(${index})">Editar</button>
                    <button class="btn-eliminar" onclick="eliminarEmpleado(${index})">X</button>
                </td>
            </tr>
        `;
    });
    actualizarEstadisticas();
}

document.getElementById('form-empleado-prod').addEventListener('submit', (e) => {
    e.preventDefault();
    listaEmpleados.push({
        fecha: document.getElementById('emp-fecha').value,
        empleado: document.getElementById('emp-nombre').value,
        prenda: document.getElementById('emp-prenda').value,
        cantidad: parseInt(document.getElementById('emp-cantidad').value),
        comision: parseFloat(document.getElementById('emp-comision').value)
    });
    guardarEnDB('empleados', listaEmpleados);
    e.target.reset();
    document.getElementById('emp-fecha').value = obtenerFechaHoy();
    renderizarEmpleados();
});

function editarEmpleado(index) {
    const item = listaEmpleados[index];
    const nuevaCant = prompt(`Editar cantidad hecha por ${item.empleado}:`, item.cantidad);
    const nuevaCom = prompt(`Editar comisión unitaria ($):`, item.comision);
    if (nuevaCant !== null && nuevaCom !== null) {
        listaEmpleados[index].cantidad = parseInt(nuevaCant);
        listaEmpleados[index].comision = parseFloat(nuevaCom);
        guardarEnDB('empleados', listaEmpleados);
        renderizarEmpleados();
    }
}

function eliminarEmpleado(index) {
    if (confirm('¿Eliminar registro?')) {
        listaEmpleados.splice(index, 1);
        guardarEnDB('empleados', listaEmpleados);
        renderizarEmpleados();
    }
}

// ================= 5. CAJA DIARIA =================
function renderizarCaja() {
    const tbody = document.getElementById('tabla-caja');
    const totalTxt = document.getElementById('total-caja-txt');
    tbody.innerHTML = '';
    let sumaTotal = 0;
    listaCaja.forEach((item, index) => {
        sumaTotal += parseFloat(item.monto);
        tbody.innerHTML += `
            <tr>
                <td><b>${item.fecha}</b></td>
                <td>${item.concepto}</td>
                <td style="color: #28a745; font-weight: bold;">$${parseFloat(item.monto).toFixed(2)}</td>
                <td>
                    <button class="btn-editar" onclick="editarCaja(${index})">Editar</button>
                    <button class="btn-eliminar" onclick="eliminarCaja(${index})">X</button>
                </td>
            </tr>
        `;
    });
    totalTxt.innerText = `$${sumaTotal.toFixed(2)}`;
}

document.getElementById('form-caja').addEventListener('submit', (e) => {
    e.preventDefault();
    listaCaja.push({
        fecha: document.getElementById('caja-fecha').value,
        concepto: document.getElementById('caja-concepto').value,
        monto: parseFloat(document.getElementById('caja-monto').value)
    });
    guardarEnDB('caja', listaCaja);
    e.target.reset();
    document.getElementById('caja-fecha').value = obtenerFechaHoy();
    renderizarCaja();
});

function editarCaja(index) {
    const item = listaCaja[index];
    const nuevoConcepto = prompt("Editar concepto:", item.concepto);
    const nuevoMonto = prompt("Editar monto ($):", item.monto);
    if (nuevoConcepto !== null && nuevoMonto !== null) {
        listaCaja[index].concepto = nuevoConcepto;
        listaCaja[index].monto = parseFloat(nuevoMonto);
        guardarEnDB('caja', listaCaja);
        renderizarCaja();
    }
}

function eliminarCaja(index) {
    if (confirm('¿Eliminar ingreso?')) {
        listaCaja.splice(index, 1);
        guardarEnDB('caja', listaCaja);
        renderizarCaja();
    }
}

// ================= 6. CUADERNO DE NOTAS =================
function renderizarNotas() {
    const cuadricula = document.getElementById('cuadricula-notas');
    cuadricula.innerHTML = '';
    listaNotas.forEach((nota, index) => {
        cuadricula.innerHTML += `
            <div class="tarjeta-nota">
                <span class="fecha-nota">📅 ${nota.fecha}</span>
                <h3>${nota.titulo}</h3>
                <p>${nota.contenido}</p>
                <div class="acciones-nota">
                    <button class="btn-editar" onclick="editarNota(${index})">Editar</button>
                    <button class="btn-eliminar" onclick="eliminarNota(${index})">Borrar</button>
                </div>
            </div>
        `;
    });
}

document.getElementById('form-nota').addEventListener('submit', (e) => {
    e.preventDefault();
    listaNotas.push({
        titulo: document.getElementById('nota-titulo').value,
        fecha: document.getElementById('nota-fecha').value,
        contenido: document.getElementById('nota-contenido').value
    });
    guardarEnDB('notas', listaNotas);
    e.target.reset();
    document.getElementById('nota-fecha').value = obtenerFechaHoy();
    renderizarNotas();
});

function editarNota(index) {
    const nota = listaNotas[index];
    const nuevoTitulo = prompt("Editar título:", nota.titulo);
    const nuevoContenido = prompt("Editar contenido:", nota.contenido);
    if (nuevoTitulo !== null && nuevoContenido !== null) {
        listaNotas[index].titulo = nuevoTitulo;
        listaNotas[index].contenido = nuevoContenido;
        guardarEnDB('notas', listaNotas);
        renderizarNotas();
    }
}

function eliminarNota(index) {
    if (confirm('¿Eliminar nota?')) {
        listaNotas.splice(index, 1);
        guardarEnDB('notas', listaNotas);
        renderizarNotas();
    }
}

// ================= VISOR DE IMAGEN Y ARRANQUE =================
function abrirVisor(id) {
    const item = registros.find(r => r.id === id);
    if (!item) return;
    document.getElementById('visor-modal').style.display = "block";
    document.getElementById('imagen-ampliada').src = item.imagen;
    document.getElementById('texto-modal').innerHTML = `<b>Cliente:</b> ${item.cliente} | <b>Prenda:</b> ${item.prenda} (${item.color}) <br> <b>Detalles:</b> ${item.detalles}`;
}

function cerrarVisor() {
    document.getElementById('visor-modal').style.display = "none";
}

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") cerrarVisor();
});

function renderizarTodo() {
    renderizarPrecios();
    renderizarEnvios();
    renderizarEmpleados();
    renderizarCaja();
    renderizarNotas();
    renderizarAgenda();
    renderizarBaseDatosClientes();
    actualizarEstadisticas();
}

// Inicializar fechas y arrancar Base de Datos
document.getElementById('fechaIngreso').value = obtenerFechaHoy();
document.getElementById('emp-fecha').value = obtenerFechaHoy();
document.getElementById('caja-fecha').value = obtenerFechaHoy();
document.getElementById('nota-fecha').value = obtenerFechaHoy();

iniciarBaseDeDatos();