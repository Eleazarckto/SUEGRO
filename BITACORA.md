# Bitácora TELAS

## 2026-11-23 — Publicación comprobada

Publicado el commit 81a06f60dfd204b2e9ef6172c3e3acf250343e22 en main de https://github.com/Eleazarckto/SUEGRO.git: 28 archivos, incluidos código, originales, fuentes, pruebas y documentación Word. git ls-remote confirmó exactamente el mismo SHA remoto. git push -u origin main terminó correctamente; no se usó force. El intento inicial de commit carecía de autor: se resolvió con user.name y user.email limitados al comando, usando la identidad conocida de Eleazar. La verificación de red requirió ejecución autorizada fuera del entorno restringido.

Resuelto el bloqueo de publicación del 2026-11-19 para el nuevo destino. Seis pruebas de dominio aprobadas. ZIP duplicado de entregas/ excluido según .gitignore. Sin cambios funcionales ni despliegue. Documentación local actualizada y Word regenerado con python pruebas/generar_documentacion.py; sigue pendiente la incorporación a documentación central ya registrada anteriormente. Esta entrada se publica en un segundo commit documental.

## 2026-11-23 — Preparación de publicación en SUEGRO

Destino indicado por Eleazar: https://github.com/Eleazarckto/SUEGRO.git, sustituye el destino solicitado el 2026-11-19. git ls-remote confirmó remoto sin referencias. origin configurado con permiso elevado porque .git/config estaba bloqueado; safe.directory limitado al comando por propietario distinto, sin modificar configuración global.

Se revisaron archivos y patrones de credenciales sin encontrar secretos. node --test pruebas/dominio.test.cjs: seis pruebas aprobadas. Se conserva .gitignore: entregas/ contiene un ZIP duplicado generado; código, fuentes, originales, documentación, capturas ficticias y pruebas se publican. No se modificó comportamiento ni se desplegó en producción. Siguiente paso: git add, git commit, git push -u origin main y comparar git rev-parse HEAD con git ls-remote origin refs/heads/main.

## 2026-11-19 — Publicación GitHub solicitada, bloqueada por el entorno

Destino autorizado: https://github.com/Eleazarckto/proyecto-de-luis-p.git. Se ejecutó git init -b main y se creó .git, pero no se pudo configurar origin: el entorno denegó escritura de .git/config. Git también advirtió propietario diferente; la comprobación puntual safe.directory no resolvió el permiso de escritura. No se alteró la configuración global.

La consulta git ls-remote al destino falló con conexión a github.com:443; no se confirmó el contenido remoto. No existe commit ni push confirmado. El buscador de plugins encontró GitHub disponible pero sin instalar/conectar; ya se había sugerido recientemente, por lo que no se repitió la solicitud de instalación. Hace falta habilitar una sesión con Git escribible y conexión autenticada al destino, o conectar GitHub con capacidad de publicación. No se intentó evadir las restricciones.

Se preparó entregas/proyecto-de-luis-p.zip con código, fuentes, documentación, pruebas, capturas ficticias y originales; excluye metadatos .git, dependencias, temporales y el propio directorio entregas. Añadido .gitignore para secretos habituales y archivos generados. El ZIP es una preparación local, NO una publicación. Siguiente paso: comprobar ramas del remoto, conservar lo existente, crear commit, publicar sin force y comprobar el SHA remoto.


## 2026-11-19 ? Segunda revisi?n visual verificada

Cambios: index.html con seis iconos SVG y dos grupos visuales del pedido; estilos/detalles.css con controles, indicadores y tablas refinados; js/vista.js, funci?n Vista.fila, agrega data-etiqueta a celdas para tarjetas m?viles. A 390 px los seis m?dulos est?n visibles en navegaci?n de dos filas; los registros muestran etiquetas y acciones sin desplazar tablas. Paleta Zupera y modos claro/oscuro conservados. Se prefiri? dise?o plano sin desenfoques ni dependencias externas.

Validaci?n: python pruebas/navegador.py aprobado, incluidos seis m?dulos m?viles sin desbordamiento y recorridos de pedidos, dinero y respaldos; sin errores JavaScript. Capturas escritorio.png y movil.png inspeccionadas visualmente. No se cambiaron reglas de negocio ni datos reales. Documentaci?n local actualizada y Word regenerado con pruebas/generar_documentacion.py. Pendiente externo: ?ndice y documentaci?n centrales, fuera del permiso de escritura de esta sesi?n. No se despleg?.


## 2026-11-19 — Segunda revisión visual en curso

Solicitud: seguir mejorando estilos. index.html incorpora iconos SVG coherentes y agrupación visual del pedido; estilos/detalles.css refina jerarquía, controles y navegación móvil con seis módulos visibles. js/vista.js añade etiquetas de columna a cada celda para presentar tarjetas en teléfono. Se conserva paleta Zupera clara/oscura. Pendiente verificar recorridos y capturas.


## 2026-11-19 — Implementación local
Reemplazados app.js y style.css y reorganizado index.html. Nuevos js/dominio.js (normalizar, centavos, respaldo, fusionar), js/base-datos.js (transacciones confirmadas e importación atómica) y js/vista.js (nodos con textContent, sin interpolación HTML). Referencia visual real: paleta Zupera clara/oscura y Urbanist local. Se conservó TallerConfeccionDB v1. Importes antiguos se convierten al leer; nuevos guardados en centavos. Nueva base vacía no inventa tarifas comerciales; solo retiro gratis.

Edición de pedidos y registros en formularios, reapertura de entregados, búsqueda sin tildes, vencidos/hoy, caja por fecha, estados vacíos, validación de fechas/cantidades/importes/imágenes, botones deshabilitados durante escritura y errores visibles. Comprobación de versión de registros dentro de transacciones evita sobrescribir cambios desde otras pestañas. Respaldos v2 y formato anterior completos admitidos; fusión conserva actuales. Sintaxis node --check aprobada en cuatro JS. Pendiente pruebas funcionales reales y revisión visual; no se afirma terminado.

## 2026-11-19 — Diagnóstico e inicio de mejoras
Proyecto original: index.html, style.css y app.js; seis módulos (pedidos, clientes, tarifas, producción, caja, notas). Sin instrucciones ni bitácora locales previas. Leídas instrucciones globales y referencia visual de ZuperaCRM. Copia del código original en respaldo_original/.

Hallazgos: interpolación de texto sin escape (XSS persistente); escrituras sin esperar confirmación; importación parcial que duplica pedidos y sobreescribe listas; dinero calculado con flotantes; falta de validación, edición de pedidos, filtros y estados vacíos; indicador BD activa antes de abrirla. IndexedDB local, sin servidor, usuarios ni sincronización.

Decisión: mantener tecnología y nombre de base para conservar información; separar dominio/persistencia/interfaz, dinero en centavos, importación validada y atómica por fusión sin eliminar registros, errores visibles, búsqueda y diseño Zupera claro/oscuro. No introducir infraestructura remota sin necesidad ni inventar datos de cliente. Copia de fuentes Urbanist desde referencia.

Pruebas pendientes: lógica, compatibilidad, navegador, móvil y restauración repetida. Documentación central fuera del directorio autorizado de escritura del entorno; preparar documentación local y registrar limitación. No se despliega.