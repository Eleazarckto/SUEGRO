from pathlib import Path
import re
p=Path('index.html'); s=Path('respaldo_original/index.html').read_text(encoding='utf-8')
s=s.replace('Sistema de Control con Base de Datos - Taller y Bordados','TELAS · Gestión de taller')
s=re.sub(r' style="[^"]*"','',s)
start=s.index('        <header'); end=s.index('            <!-- MINI PANEL')
s=s[:start]+'''        <aside class="lateral">
            <a class="marca" href="index.html"><span class="isotipo">T</span><span>TELAS<small>Gestión de taller</small></span></a>
            <span class="etiqueta-menu">ESPACIO DE TRABAJO</span>
            <nav class="tabs" aria-label="Módulos">
'''+''.join(f'''                <button class="tab-btn{' active' if i==0 else ''}" data-titulo="{title}" onclick="cambiarTab('{key}', this)"><span aria-hidden="true">{icon}</span>{title}</button>\n''' for i,(key,title,icon) in enumerate([('pedidos','Pedidos','▤'),('clientes','Clientes','♧'),('precios','Precios y envíos','◇'),('empleados','Producción','◫'),('caja','Caja diaria','▣'),('notas','Cuaderno','▧')]))+'''            </nav>
            <div class="pie-lateral"><span class="indicador"></span> Tu taller, organizado<small>Sistemas Ceccato, C.A.</small></div>
        </aside>
        <main id="contenido">
        <header class="barra-superior"><div><span class="ruta">Mi taller / Gestión</span><h1 id="titulo-pagina">Pedidos</h1></div><div class="herramientas"><span id="estado-db" class="badge-db">Abriendo almacenamiento…</span><button id="tema" onclick="alternarTema()">☾ Modo oscuro</button></div></header>
        <div class="contenido-interior">
        <div class="bienvenida"><div><span class="sobretitulo">TALLER Y BORDADOS</span><h2>Cada detalle cuenta.</h2><p>Organiza tus pedidos, tu producción y las cuentas de tu taller.</p></div><button class="btn-principal" id="exportar" onclick="exportarBaseDatos()">↓ Descargar respaldo</button></div>
        <div class="nota-local">Los datos se guardan en este navegador. Descarga un respaldo para conservar una copia fuera del equipo.</div>
        <div id="aviso" class="aviso" role="status" aria-live="polite" hidden></div>
        <header class="header-app">
'''+s[end:]
s=s.replace('<form id="form-agenda">','<div class="encabezado-seccion"><div><h2 id="titulo-formulario">Nuevo pedido</h2><p>De la primera puntada a la entrega.</p></div><span class="etiqueta">Registro de trabajo</span></div><form id="form-agenda">')
s=s.replace('<button type="submit" class="btn-principal span-3">Guardar Pedido en Base de Datos</button>','<div class="pie-formulario span-3"><span>Revisa los datos antes de guardar.</span><button type="button" id="cancelar-pedido" onclick="cancelarPedido()" hidden>Cancelar edición</button><button type="submit" id="guardar-pedido" class="btn-principal">Guardar pedido</button></div>')
s=s.replace('<h2>Lista de Pedidos Pendientes en Taller</h2>','''<div class="encabezado-seccion"><div><h2>Pedidos en taller <span id="conteo-pedidos" class="etiqueta"></span></h2><p id="resumen-entregas">Tus entregas, bajo control</p></div></div>
            <div class="filtros"><input id="buscar-pedidos" type="search" aria-label="Buscar pedidos" placeholder="Buscar cliente, prenda o detalle…" oninput="Vista.pedidos()"><select id="filtro-entrega" aria-label="Filtrar por entrega" onchange="Vista.pedidos()"><option value="todos">Todas las entregas</option><option value="hoy">Para hoy</option><option value="atrasados">Atrasados</option></select></div>''')
s=s.replace('🗂️ Historial Completo y Base de Datos por Cliente','Historial de clientes').replace('💾 Descargar Respaldo (BD)','Descargar respaldo').replace('📂 Cargar Respaldo','Importar respaldo')
s=s.replace('<th>Ubicación / Envío</th>','<th>Ubicación / Envío</th><th>Acciones</th>')
s=s.replace('<div class="resumen-caja">','''<div class="filtros"><label for="filtro-caja">Consultar fecha</label><input type="date" id="filtro-caja" onchange="Vista.caja()"><button onclick="document.getElementById('filtro-caja').value='';Vista.caja()">Ver todas</button></div><div class="resumen-caja">''')
s=s.replace('Total Ingresado en Caja:', '<span id="periodo-caja">Ingresos del día</span>')
s=s.replace('📖 Cuaderno de Notas Libres','Cuaderno del taller').replace('Guardar Nota en el Cuaderno','Guardar nota')
s=s.replace('    </div>\n\n    <!-- Visor','        <footer class="pie-app">TELAS · Sistemas Ceccato, C.A. · RIF J-50849699-0</footer></div></main>\n    </div>\n\n    <!-- Visor')
s=s.replace('<div id="visor-modal" class="modal" onclick="cerrarVisor()">','<dialog id="visor-modal" class="modal" aria-label="Diseño del pedido">').replace('<span class="cerrar-modal">&times;</span>','<button class="cerrar-modal" onclick="cerrarVisor()" aria-label="Cerrar imagen">×</button>')
s=s.replace('<img class="modal-contenido" id="imagen-ampliada">','<img class="modal-contenido" id="imagen-ampliada" alt="Diseño del pedido">')
s=s.replace('        <div id="texto-modal"></div>\n    </div>', '        <div id="texto-modal"></div>\n    </dialog>')
s=s.replace('<script src="app.js"></script>','<script src="js/dominio.js"></script>\n    <script src="js/base-datos.js"></script>\n    <script src="js/vista.js"></script>\n    <script src="app.js"></script>')
s=s.replace('accept="image/*"','accept="image/png,image/jpeg,image/webp,image/gif"')
s=s.replace('<body>','<body><a class="saltar" href="#contenido">Ir al contenido</a>')
p.write_text(s,encoding='utf-8')
