# TELAS — Documentación del sistema

Última actualización: 2026-11-23 — Codex, por solicitud de Eleazar Ceccato.
Versión de esta revisión: 2.0.0 local. Sin despliegue remoto.

## 1. Ficha
Empresa desarrolladora y propietaria del sistema: Sistemas Ceccato, C.A., RIF J-50849699-0.
Responsable: Eleazar Ceccato. Implementación de esta revisión: Codex. Autor del código original no identificado en los tres archivos recibidos.
Cliente, razón social, RIF, contactos y dueños del taller: no constan en los archivos disponibles; no se inventaron.
Carpeta: C:/Users/eleaz/Downloads/TELAS. Primera revisión documentada: 2026-11-19.

## 2. Finalidad
Aplicación local para organizar pedidos de confección y bordado, consultar el historial por cliente, mantener tarifas y zonas de entrega, registrar producción con comisiones, controlar ingresos y guardar notas.
Los datos pertenecen al perfil y origen del navegador. No existe sincronización entre computadoras, cuentas de acceso ni servidor. Cambiar de navegador, puerto o forma de apertura puede mostrar otra base local; no significa que se borró la anterior. Se conserva el nombre original de la base.

## 3. Funciones
- Pedidos: crear y editar, adjuntar diseño, entregar, reabrir desde Clientes y eliminar con confirmación. Búsqueda por cliente, prenda, detalle y dirección; filtros de hoy y atrasados.
- Clientes: historial completo con filtros de texto y estado, edición y reapertura. El cliente se identifica por nombre, como en el sistema original; no se añadió una ficha con identidad fiscal inventada.
- Precios y envíos: alta, edición en formulario y eliminación confirmada. La instalación vacía no inventa tarifas; incorpora únicamente retiro en taller sin costo.
- Producción: fecha, empleado, prenda, cantidad y comisión; cálculo exacto en centavos.
- Caja: ingresos por fecha, total diario por defecto, consulta de otras fechas y todas las fechas. No incluye gastos, cuentas bancarias ni contabilidad fiscal.
- Cuaderno: notas con título, fecha y texto multilínea; edición en formulario.
- Apariencia: estilos Zupera claro y oscuro, fuente Urbanist local, adaptación móvil, foco de teclado, etiquetas y visor de imagen accesible.

## 4. Reglas y validaciones
Orden del dueño 2026-11-19: usar estilos de ZuperaCRM. Referencias consultadas: lib/presentacion/tema/paleta_zupera.dart y tema_zupera.dart; Urbanist en assets/fuentes. No se copiaron clientes, claves ni conexiones del CRM.
Importes nuevos almacenados como centavos enteros. Entradas hasta dos decimales, no negativas; ingreso de caja mayor que cero. Cantidades de prendas enteras de 1 a 1000000; no se venden metros ni se modifica inventario. Fecha de entrega igual o posterior al ingreso. Fechas válidas de calendario, día actual en America/Caracas.
Imágenes PNG/JPEG/WebP/GIF hasta 2 MB; no se aceptan SVG, URLs remotas ni protocolos ejecutables. Texto mostrado mediante textContent. Formularios conservan valores si falla el guardado. La interfaz refleja éxito solo al completar la transacción.

## 5. Arquitectura
HTML/CSS/JavaScript sin dependencias de ejecución ni recursos de internet.
- index.html: estructura y formularios.
- style.css: variables visuales basadas en la paleta Zupera y diseño adaptable.
- app.js: eventos, edición, navegación, importación/exportación y coordinación.
- js/dominio.js: validación, dinero, normalización y fusión de respaldos.
- js/base-datos.js: IndexedDB, transacciones, detección de conflictos entre pestañas.
- js/vista.js: presentación segura con nodos DOM.
- pruebas/: pruebas de dominio, navegador Edge y capturas de datos ficticios.
- respaldo_original/: tres archivos originales para consulta y reversión del código, NO respaldo de la información del usuario.

## 6. Medición
Conteo de líneas no vacías de los seis archivos de aplicación: se registra en BITACORA.md. Fuentes, pruebas y copia original excluidas. CSS formateado para lectura, sin compilador.

## 7. Base de datos y respaldos
IndexedDB TallerConfeccionDB, versión 1. Almacenes pedidos (id autoincremental interno, índice cliente) y configuracion (clave, valor). Configuración conserva precios, envios, empleados, caja y notas. No hay credenciales ni MySQL.
Los importes antiguos se normalizan al leer sin sobrescribir automáticamente la base. Si un dato antiguo es inválido, se avisa y se bloquean ediciones: el respaldo descargable conserva datos originales para reparación explícita; no se borran ni corrigen importes en silencio.
Descargar respaldo crea JSON con versión 2 y fecha. Clientes > Importar respaldo admite el JSON completo original o v2, hasta 50 MB. Valida todo antes de escribir y fusiona en una sola transacción. No elimina registros actuales ni sustituye ediciones actuales por versiones antiguas. Identidades uid previenen duplicación; formato antiguo se compara por contenido y multiplicidad. Una copia antigua sin uid no permite reconocer como idénticos registros que cambiaron de contenido: pueden agregarse como distintos. No es una herramienta para retroceder estados.
El archivo descargado no está cifrado; debe guardarse en una ubicación privada. No hay respaldo automático externo. IndexedDB depende del almacenamiento del navegador y no sustituye un servidor ni un respaldo fuera del equipo.

## 8. Ejecución y despliegue
Abrir index.html en Edge mantiene el uso directo original. También se probó por HTTP local aislado: python -m http.server 8765 --bind 127.0.0.1 (desde TELAS), http://127.0.0.1:8765. Mantener siempre el mismo origen para acceder a los mismos datos. Antes de cambiar origen, exportar y luego importar.
No se ha publicado en ningún servidor. No hay despliegue/desplegar.sh propio; una publicación futura debe usar el procedimiento oficial con --prueba primero. Nunca --borrar.
Reversión de código: los originales están en respaldo_original/. Antes de volver al código antiguo, exportar los datos actuales: el original no entiende importes nuevos en centavos. No apuntar la versión antigua a información nueva sin conversión explícita.

## 9. Accesos y seguridad
No hay cuentas, tokens, secretos ni servicios externos. Las reglas de API, roles, CORS, firmas móviles y migraciones SQL no aplican a esta aplicación local. No se afirma que tenga seguridad multiusuario, cifrado propio de IndexedDB, auditoría de operaciones o sincronización. Requieren una futura arquitectura de servidor y permisos; no se simularon controles de acceso únicamente visuales.

## 10. Pruebas y capturas
node --test pruebas/dominio.test.cjs: seis pruebas aprobadas (dinero exacto, fechas/cantidades, imagen segura, respaldo antiguo, fusión y búsqueda).
python pruebas/navegador.py: Edge real sin interfaz y perfil temporal; alta, edición, recarga/persistencia, entrega/reapertura, filtros, caja 0.10 + 0.20 = 0.30, tarifas, envíos, comisión 3 × 0.10 = 0.30, texto XSS, descarga/importación repetida, rechazo de respaldo parcial, importación antigua, reversión total ante fallo simulado, rechazo de escritura obsoleta entre pestañas, seis módulos a 390 px, temas claro/oscuro y apertura file://. Sin errores JavaScript. No usa perfil ni datos reales del dueño.
Capturas: pruebas/escritorio.png, pruebas/oscuro.png y pruebas/movil.png; datos ficticios. Sintaxis: node --check app.js y cada archivo js/*.js.

## 11. Historial
2026-11-19: análisis de tres archivos originales, rediseño Zupera, separación de capas, validación, dinero exacto, guardado transaccional, respaldos seguros y ampliación de funciones. Pruebas locales aprobadas.

## 12. Pendientes y límites
La carpeta central C:/Users/eleaz/Documentacion_Sistemas_Ceccato no está autorizada para escritura en esta sesión. Este documento y su Word se entregan localmente; queda pendiente incorporar la documentación y el índice centrales cuando el entorno habilite esa carpeta. No se intentó evadir la restricción.
No se hicieron pruebas con los datos reales del navegador del dueño. No se dispone de un backend, usuarios, copias remotas ni contabilidad fiscal; no se declara el sistema apto como ERP multiusuario.

## 13. Referencias
CLAUDE.md, BITACORA.md y respaldo_original/ dentro de TELAS. Herramienta pruebas/modernizar_html.py reproduce la transformación HTML desde la copia original; no se necesita para ejecutar la app.

## Revisi?n visual adicional ? 2026-11-19
Iconos SVG uniformes, formulario agrupado en trabajo/entrega, mejor jerarqu?a y controles. Nuevo estilos/detalles.css. Vista.fila agrega etiquetas a las celdas: en tel?fono las tablas pasan a tarjetas y los seis m?dulos quedan visibles en dos filas. Conserva los dos temas Zupera y Urbanist. Pruebas de navegador completas aprobadas y capturas de escritorio/m?vil inspeccionadas. Herramientas de transformaci?n HTML son auxiliares de esta sesi?n; no deben ejecutarse sobre futuras ediciones manuales.

Conteo actualizado de aplicaci?n (sin l?neas vac?as, excluye pruebas y fuentes): index.html: 316, style.css: 858, app.js: 153, js/base-datos.js: 98, js/dominio.js: 91, js/vista.js: 67, estilos/detalles.css: 104.

## Repositorio — 2026-11-23
Destino autorizado: https://github.com/Eleazarckto/SUEGRO.git. Publicación del código y documentación, sin despliegue web. Seis pruebas de dominio aprobadas en esta sesión. Estado verificable de publicación en BITACORA.md.
