'use strict';
const BaseDatos = (() => {
    let db;
    const inicial = {
        precios: [],
        envios: [{ zona: 'Retiro en Taller', costoCentavos: 0 }],
        empleados: [], caja: [], notas: []
    };
    function abrir() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('TallerConfeccionDB', 1);
            req.onupgradeneeded = () => {
                const base = req.result;
                const pedidos = base.createObjectStore('pedidos', { keyPath: 'id', autoIncrement: true });
                pedidos.createIndex('cliente', 'cliente', { unique: false });
                base.createObjectStore('configuracion', { keyPath: 'clave' });
            };
            req.onerror = () => reject(Error('No se pudo abrir el almacenamiento. Revisa los permisos del navegador.'));
            req.onblocked = () => reject(Error('Cierra las otras ventanas de TELAS y recarga.'));
            req.onsuccess = () => {
                db = req.result;
                db.onversionchange = () => { db.close(); location.reload(); };
                resolve();
            };
        });
    }
    function transaccion(modo, operacion) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['pedidos', 'configuracion'], modo);
            let resultado;
            tx.oncomplete = () => resolve(typeof resultado === 'function' ? resultado() : resultado);
            tx.onabort = tx.onerror = () => reject(Error(tx.conflicto ? 'Otra pestaña modificó estos datos. Recarga la página antes de volver a editarlos.' : 'No se guardó el cambio. Revisa el espacio disponible y vuelve a intentarlo.'));
            try { resultado = operacion(tx.objectStore('pedidos'), tx.objectStore('configuracion')); }
            catch (error) { tx.abort(); reject(error); }
        });
    }
    function leer() {
        return transaccion('readonly', (p, c) => {
            const pedidos = p.getAll(), config = c.getAll();
            return () => {
                const datos = { pedidos: pedidos.result };
                const mapa = new Map(config.result.map(r => [r.clave, r.valor]));
                for (const k of Dominio.colecciones.slice(1)) datos[k] = mapa.has(k) ? mapa.get(k) : inicial[k];
                return datos;
            };
        });
    }
    function comparar(actual, esperado, tipo) {
        return JSON.stringify(actual === undefined ? actual : Dominio.normalizar(tipo, actual)) === JSON.stringify(esperado);
    }
    function guardarPedido(registro, anterior) {
        return transaccion('readwrite', p => {
            if (!registro.id) { p.add(registro); return; }
            const req = p.get(registro.id);
            req.onsuccess = () => {
                if (!comparar(req.result, anterior, 'pedidos')) { p.transaction.conflicto = true; p.transaction.abort(); return; }
                p.put(registro);
            };
        });
    }
    function borrarPedido(id, anterior) {
        return transaccion('readwrite', p => {
            const req = p.get(id);
            req.onsuccess = () => { if (!comparar(req.result, anterior, 'pedidos')) { p.transaction.conflicto = true; p.transaction.abort(); } else p.delete(id); };
        });
    }
    function guardarLista(clave, lista, anteriores) {
        return transaccion('readwrite', (_, c) => {
            const req = c.get(clave);
            req.onsuccess = () => {
                const actual = (req.result?.valor || inicial[clave]).map(r => Dominio.normalizar(clave, r));
                if (JSON.stringify(actual) !== JSON.stringify(anteriores)) { c.transaction.conflicto = true; c.transaction.abort(); return; }
                c.put({ clave, valor: lista });
            };
        });
    }
    function importar(datos) {
        return transaccion('readwrite', (p, c) => {
            const pedidos = p.getAll(), config = c.getAll();
            let leidos = 0;
            const combinar = () => {
                if (++leidos !== 2) return;
                try {
                    const mapa = new Map(config.result.map(r => [r.clave, r.valor]));
                    const actuales = pedidos.result.map(r => Dominio.normalizar('pedidos', r));
                    Dominio.fusionar(actuales, datos.pedidos).filter(r => !r.id).forEach(r => p.add(r));
                    for (const k of Dominio.colecciones.slice(1)) {
                        const anteriores = (mapa.get(k) || []).map(r => Dominio.normalizar(k, r));
                        c.put({ clave: k, valor: Dominio.fusionar(anteriores, datos[k]) });
                    }
                } catch (error) { console.error('Restauración cancelada:', error.message); p.transaction.abort(); }
            };
            pedidos.onsuccess = combinar;
            config.onsuccess = combinar;
        });
    }
    return { abrir, leer, guardarPedido, borrarPedido, guardarLista, importar };
})();
