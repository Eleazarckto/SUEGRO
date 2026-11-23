# TELAS

Gestión local del taller con apariencia ZuperaCRM clara y oscura. Abre index.html en Edge. Conserva el mismo navegador y forma de apertura para acceder a tus datos.

Incluye pedidos, historial de clientes, tarifas/envíos, producción/comisiones, caja diaria y notas. Descarga respaldos periódicos desde el botón superior; impórtalos desde Clientes.

Documentación: docs/DOCUMENTACION.md y docs/Documentación - TELAS.docx. Historial técnico: BITACORA.md. Copia del código recibido: respaldo_original/.

Pruebas: node --test pruebas/dominio.test.cjs; python pruebas/navegador.py (requiere Playwright Python y Microsoft Edge). No se necesitan dependencias para usar la aplicación.

Los datos se guardan únicamente en el navegador. No existe servidor ni sincronización entre equipos.
