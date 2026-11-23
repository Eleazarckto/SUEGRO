from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import json
from playwright.sync_api import sync_playwright
RAIZ=Path(__file__).resolve().parents[1]
class Servidor(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw): super().__init__(*a,directory=str(RAIZ),**kw)
 def log_message(self,*a): pass
servidor=ThreadingHTTPServer(('127.0.0.1',0),Servidor)
Thread(target=servidor.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{servidor.server_port}'
with sync_playwright() as p:
 navegador=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 contexto=navegador.new_context(viewport={'width':1440,'height':1100},accept_downloads=True)
 pagina=contexto.new_page(); errores=[]; pagina.on('pageerror',lambda e:errores.append(str(e)))
 pagina.on('dialog',lambda d:d.accept())
 pagina.goto(url); pagina.wait_for_function("document.getElementById('estado-db').textContent === 'Guardado local'")
 def modulo(nombre): pagina.locator(f'[data-titulo="{nombre}"]').click()
 def llenar(campos):
  for k,v in campos.items(): pagina.locator('#'+k).fill(v)
 def guardar(form):
  pagina.locator(f'#{form} [type=submit]').click(); pagina.wait_for_function("!ocupado")
 llenar({'cliente':'Taller López','color':'Azul','cantidad':'3','detalles':'Bordado de prueba','fechaIngreso':'2026-11-18','fechaEntrega':'2026-11-20','ubicacion':'Retiro en taller'})
 pagina.select_option('#prenda','Franela'); pagina.select_option('#talla','M'); pagina.locator('#zonaEnvio').select_option(index=1)
 guardar('form-agenda'); assert pagina.locator('#lista-agenda tr').count()==1
 pagina.reload(); pagina.wait_for_function("!ocupado && datos.pedidos?.length === 1")
 pagina.locator('#lista-agenda').get_by_role('button',name='Editar',exact=True).click(); pagina.fill('#cantidad','4'); guardar('form-agenda')
 assert pagina.evaluate('datos.pedidos[0].cantidad')==4
 pagina.fill('#buscar-pedidos','lopez'); assert pagina.locator('#lista-agenda').inner_text().find('Taller López')>=0
 pagina.fill('#buscar-pedidos','nadie'); assert 'No hay pedidos' in pagina.locator('#lista-agenda').inner_text(); pagina.fill('#buscar-pedidos','')
 pagina.locator('#lista-agenda').get_by_role('button',name='Entregar',exact=True).click(); pagina.wait_for_function('!ocupado'); assert pagina.evaluate('datos.pedidos[0].entregado')
 modulo('Clientes'); pagina.locator('#tabla-bd-clientes').get_by_role('button',name='Reabrir').click(); pagina.wait_for_function('!ocupado')
 modulo('Caja diaria')
 for monto in ['0.10','0.20']:
  llenar({'caja-concepto':'Ingreso de prueba','caja-monto':monto}); guardar('form-caja')
 assert pagina.locator('#total-caja-txt').inner_text()=='$0.30'
 modulo('Precios y envíos'); llenar({'p-prenda':'Franela','p-talla':'M','p-detal':'10.50','p-mayor':'8.00'}); guardar('form-precios')
 pagina.locator('#tabla-precios').get_by_role('button',name='Editar').click(); pagina.fill('#p-detal','11.25'); guardar('form-precios'); assert '$11.25' in pagina.locator('#tabla-precios').inner_text()
 llenar({'e-zona':'Centro','e-costo':'2.50'}); guardar('form-envios')
 modulo('Producción'); llenar({'emp-nombre':'Ana','emp-cantidad':'3','emp-comision':'0.10'}); pagina.select_option('#emp-prenda','Franela'); guardar('form-empleado-prod'); assert '$0.30' in pagina.locator('#tabla-empleados').inner_text()
 modulo('Cuaderno'); ataque='<img src=x onerror="window.inyectado=true">'; llenar({'nota-titulo':ataque,'nota-contenido':'Detalle\nSegunda línea'}); guardar('form-nota')
 assert pagina.locator('#cuadricula-notas img').count()==0; assert pagina.evaluate('window.inyectado') is None
 with pagina.expect_download() as descarga: pagina.locator('#exportar').click()
 ruta=RAIZ/'pruebas'/'respaldo_prueba.json'; descarga.value.save_as(str(ruta)); copia=json.loads(ruta.read_text(encoding='utf-8')); assert copia['version']==2
 modulo('Clientes'); conteo=pagina.evaluate('datos.pedidos.length')
 for _ in range(2):
  pagina.locator('#importar-db').set_input_files(str(ruta)); pagina.wait_for_function('!ocupado'); assert pagina.evaluate('datos.pedidos.length')==conteo
 # Un archivo parcial no toca ninguna colección.
 antes=pagina.evaluate('JSON.stringify(datos)'); pagina.locator('#importar-db').set_input_files({'name':'invalido.json','mimeType':'application/json','buffer':b'{"pedidos":[]}'})
 pagina.wait_for_function('!ocupado'); assert pagina.evaluate('JSON.stringify(datos)')==antes; assert pagina.locator('#aviso').get_attribute('class')=='aviso error'
 # Dos pestañas no pueden pisar una edición confirmada.
 segunda=contexto.new_page(); segunda.goto(url); segunda.wait_for_function('!ocupado && datos.pedidos?.length === 1')
 pagina.evaluate("async () => { const r=datos.pedidos[0]; await BaseDatos.guardarPedido({...r,cantidad:7},r); await cargar(); }")
 conflicto=segunda.evaluate("async () => { try { const r=datos.pedidos[0]; await BaseDatos.guardarPedido({...r,cantidad:8},r); return false; } catch(e) { return e.message.includes('Otra pestaña'); } }")
 assert conflicto; segunda.close(); assert pagina.evaluate('datos.pedidos[0].cantidad')==7
 # Restauración del formato original y reversión total ante fallo de almacenamiento.
 antiguo={'pedidos':[], 'precios':[], 'envios':[], 'empleados':[], 'caja':[{'fecha':'2026-11-19','concepto':'Respaldo antiguo','monto':0.15}], 'notas':[]}
 pagina.evaluate('async r => { await BaseDatos.importar(Dominio.respaldo(r)); await cargar(); }',antiguo)
 assert pagina.evaluate("datos.caja.some(r=>r.concepto==='Respaldo antiguo' && r.montoCentavos===15)")
 rollback=pagina.evaluate("""async () => {
  const antes=JSON.stringify(await BaseDatos.leer()); const original=IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put=function(){throw Error('Fallo simulado');};
  try { await BaseDatos.importar({pedidos:[{...datos.pedidos[0],id:undefined,uid:'nuevo-fallo',cliente:'No guardar'}],precios:[],envios:[],empleados:[],caja:[],notas:[]}); }
  catch(e) {} finally { IDBObjectStore.prototype.put=original; }
  return antes===JSON.stringify(await BaseDatos.leer());
 }""")
 assert rollback
 pagina.evaluate("document.getElementById('aviso').hidden=true")
 modulo('Pedidos'); pagina.screenshot(path=str(RAIZ/'pruebas'/'escritorio.png'),full_page=True)
 pagina.locator('#tema').click(); pagina.screenshot(path=str(RAIZ/'pruebas'/'oscuro.png'),full_page=True)
 pagina.locator('#tema').click(); pagina.set_viewport_size({'width':390,'height':844})
 for nombre in ['Pedidos','Clientes','Precios y envíos','Producción','Caja diaria','Cuaderno']:
  modulo(nombre); assert pagina.evaluate('document.documentElement.scrollWidth <= innerWidth'), nombre
 modulo('Pedidos'); pagina.screenshot(path=str(RAIZ/'pruebas'/'movil.png'),full_page=True)
 assert not errores, errores
 # Se conserva también la apertura original directa, sin servidor.
 directa=contexto.new_page(); directa.goto((RAIZ/'index.html').as_uri()); directa.wait_for_function("document.getElementById('estado-db').textContent==='Guardado local'"); directa.close()
 print('OK: pedidos, persistencia, edición, entrega/reapertura, búsqueda, caja exacta, tarifas, envíos, producción, XSS, respaldos nuevo/antiguo, importación repetida/inválida, rollback, conflicto entre pestañas, seis módulos móvil, temas y apertura directa. Sin errores JS.')
 navegador.close()
servidor.shutdown()
