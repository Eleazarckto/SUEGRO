from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import re
raiz=Path.cwd()
p=raiz/'BITACORA.md'
s=p.read_text(encoding='utf-8-sig')
entrada='''# Bitácora TELAS

## 2026-11-19 — Publicación GitHub solicitada, bloqueada por el entorno

Destino autorizado: https://github.com/Eleazarckto/proyecto-de-luis-p.git. Se ejecutó git init -b main y se creó .git, pero no se pudo configurar origin: el entorno denegó escritura de .git/config. Git también advirtió propietario diferente; la comprobación puntual safe.directory no resolvió el permiso de escritura. No se alteró la configuración global.

La consulta git ls-remote al destino falló con conexión a github.com:443; no se confirmó el contenido remoto. No existe commit ni push confirmado. El buscador de plugins encontró GitHub disponible pero sin instalar/conectar; ya se había sugerido recientemente, por lo que no se repitió la solicitud de instalación. Hace falta habilitar una sesión con Git escribible y conexión autenticada al destino, o conectar GitHub con capacidad de publicación. No se intentó evadir las restricciones.

Se preparó entregas/proyecto-de-luis-p.zip con código, fuentes, documentación, pruebas, capturas ficticias y originales; excluye metadatos .git, dependencias, temporales y el propio directorio entregas. Añadido .gitignore para secretos habituales y archivos generados. El ZIP es una preparación local, NO una publicación. Siguiente paso: comprobar ramas del remoto, conservar lo existente, crear commit, publicar sin force y comprobar el SHA remoto.

'''
p.write_text(entrada+s.split('\n',1)[1],encoding='utf-8')
archivos=[p for p in raiz.rglob('*') if p.is_file() and not any(x in {'.git','entregas','__pycache__','node_modules'} for x in p.relative_to(raiz).parts)]
patrones=[r'-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----',r'gh[pousr]_[A-Za-z0-9]{30,}',r'github_pat_[A-Za-z0-9_]{40,}',r'sk-[A-Za-z0-9]{30,}']
for p in archivos:
 if p.suffix.lower() in {'.js','.py','.json','.md','.html','.css'}:
  t=p.read_text(encoding='utf-8-sig')
  if any(re.search(patron,t) for patron in patrones): raise RuntimeError('Posible secreto; detener paquete: '+str(p.relative_to(raiz)))
salida=raiz/'entregas';salida.mkdir(exist_ok=True)
with ZipFile(salida/'proyecto-de-luis-p.zip','w',ZIP_DEFLATED) as z:
 for p in archivos:z.write(p,p.relative_to(raiz).as_posix())
with ZipFile(salida/'proyecto-de-luis-p.zip') as z:
 assert z.testzip() is None
 print('Paquete verificado:',len(z.namelist()),'archivos. Sin patrones de credenciales detectados.')
