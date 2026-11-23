'use strict';
// Centavos enteros: ningún cálculo monetario depende de coma flotante.
const Dominio = (() => {
    const colecciones = ['pedidos', 'precios', 'envios', 'empleados', 'caja', 'notas'];
    function texto(valor, nombre, max = 500) {
        if (typeof valor !== 'string' || !valor.trim() || valor.length > max) throw Error(`Revisa ${nombre}: es obligatorio y admite hasta ${max} caracteres.`);
        return valor.trim();
    }
    function entero(valor, nombre, min = 1, max = 1000000) {
        const n = Number(valor);
        if (!Number.isSafeInteger(n) || n < min || n > max) throw Error(`Revisa ${nombre}: debe estar entre ${min} y ${max}.`);
        return n;
    }
    function centavos(valor) {
        const s = String(valor).trim().replace(',', '.');
        if (!/^\d{1,9}(\.\d{1,2})?$/.test(s)) throw Error('El importe debe ser positivo o cero, con un máximo de dos decimales.');
        const [unidad, fraccion = ''] = s.split('.');
        return Number(unidad) * 100 + Number(fraccion.padEnd(2, '0'));
    }
    function decimal(n) { return `${Math.floor(n / 100)}.${String(n % 100).padStart(2, '0')}`; }
    function moneda(n) { return `$${decimal(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`; }
    function fecha(valor) {
        if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number.isNaN(Date.parse(valor)) || new Date(valor).toISOString().slice(0, 10) !== valor) throw Error('Selecciona una fecha válida.');
        return valor;
    }
    function hoy() { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Caracas' }).format(new Date()); }
    function imagen(valor) {
        if (!valor) return '';
        if (typeof valor !== 'string' || valor.length > 2800000 || !/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(valor)) throw Error('El diseño debe ser PNG, JPEG, WebP o GIF de hasta 2 MB.');
        return valor;
    }
    function normalizar(tipo, origen) {
        if (!origen || typeof origen !== 'object' || Array.isArray(origen)) throw Error('Registro inválido.');
        const r = {}, t = (k, max) => r[k] = texto(origen[k], k, max);
        const f = k => r[k] = fecha(origen[k]);
        const m = k => r[k + 'Centavos'] = origen[k + 'Centavos'] === undefined ? centavos(origen[k]) : entero(origen[k + 'Centavos'], k, 0, 99999999999);
        if (tipo === 'pedidos') {
            ['cliente', 'prenda', 'color', 'talla', 'detalles', 'zonaEnvio', 'ubicacion'].forEach(k => t(k));
            r.cantidad = entero(origen.cantidad, 'cantidad');
            f('fechaIngreso'); f('fechaEntrega');
            if (r.fechaEntrega < r.fechaIngreso) throw Error('La entrega no puede ser anterior al ingreso.');
            r.imagen = imagen(origen.imagen);
            if (typeof origen.entregado !== 'boolean') throw Error('Estado del pedido inválido.');
            r.entregado = origen.entregado;
        } else if (tipo === 'precios') { t('prenda'); t('talla'); m('detal'); m('mayor'); }
        else if (tipo === 'envios') { t('zona'); m('costo'); }
        else if (tipo === 'empleados') { f('fecha'); t('empleado'); t('prenda'); r.cantidad = entero(origen.cantidad, 'cantidad'); m('comision'); if (!Number.isSafeInteger(r.cantidad * r.comisionCentavos)) throw Error('La comisión total es demasiado grande.'); }
        else if (tipo === 'caja') { f('fecha'); t('concepto'); m('monto'); if (!r.montoCentavos) throw Error('El ingreso debe ser mayor que cero.'); }
        else if (tipo === 'notas') { f('fecha'); t('titulo'); t('contenido', 20000); }
        else throw Error('Módulo desconocido.');
        if (origen.id !== undefined && tipo === 'pedidos') r.id = entero(origen.id, 'identificador', 1, Number.MAX_SAFE_INTEGER);
        if (origen.uid !== undefined) r.uid = texto(origen.uid, 'referencia', 100);
        return r;
    }
    function respaldo(data) {
        if (!data || typeof data !== 'object' || (data.version !== undefined && data.version !== 2)) throw Error('Versión de respaldo no compatible.');
        const resultado = {};
        for (const k of colecciones) {
            if (!Array.isArray(data[k]) || data[k].length > 50000) throw Error(`El respaldo no contiene una lista válida de ${k}.`);
            resultado[k] = data[k].map(r => normalizar(k, r));
        }
        return resultado;
    }
    function huella(r) { const { id, uid, ...contenido } = r; return JSON.stringify(contenido); }
    // Conserva multiplicidad de registros antiguos legítimamente iguales y evita repetirlos al restaurar.
    function fusionar(actuales, entrantes) {
        const salida = actuales.map(r => ({ ...r }));
        const disponibles = new Map();
        const antiguos = new Map();
        actuales.forEach(r => disponibles.set(huella(r), (disponibles.get(huella(r)) || 0) + 1));
        actuales.filter(r => !r.uid).forEach(r => antiguos.set(huella(r), (antiguos.get(huella(r)) || 0) + 1));
        const uids = new Set(actuales.map(r => r.uid).filter(Boolean));
        for (const r of entrantes) {
            const h = huella(r), n = disponibles.get(h) || 0;
            if (r.uid && uids.has(r.uid)) continue;
            const sinReferencia = antiguos.get(h) || 0;
            if ((!r.uid && n > 0) || (r.uid && sinReferencia > 0)) {
                disponibles.set(h, n - 1);
                if (sinReferencia) antiguos.set(h, sinReferencia - 1);
                continue;
            }
            const { id, ...nuevo } = r;
            salida.push(nuevo);
            if (r.uid) uids.add(r.uid);
        }
        return salida;
    }
    function buscar(valor) { return String(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
    return { colecciones, texto, entero, centavos, decimal, moneda, fecha, hoy, imagen, normalizar, respaldo, fusionar, buscar };
})();
if (typeof module !== 'undefined') module.exports = Dominio;
