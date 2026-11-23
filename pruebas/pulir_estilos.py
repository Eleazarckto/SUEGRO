from pathlib import Path
p=Path('index.html'); s=p.read_text(encoding='utf-8')
s=s.replace('<link rel="stylesheet" href="style.css">','<link rel="stylesheet" href="style.css">\n    <link rel="stylesheet" href="estilos/detalles.css">')
iconos=[ '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h4"/>', '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 4v2"/>', '<path d="M3 3h8l10 10-8 8L3 11Z"/><circle cx="7.5" cy="7.5" r="1"/>', '<path d="m8 3-5 4 3 5 2-1v10h8V11l2 1 3-5-5-4a4 4 0 0 1-8 0Z"/>', '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18M15 13h6v4h-6zM7 5V3h10"/>', '<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 3v18M3 7h4M3 12h4M3 17h4M12 8h5M12 12h5"/>']
import re
n=[0]
def cambiar(m):
 i=n[0]; n[0]+=1
 return '<span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+iconos[i]+'</svg></span>'
s=re.sub(r'<span aria-hidden="true">.*?</span>',cambiar,s)
s=s.replace('<form id="form-agenda">','<form id="form-agenda"><div class="separador-formulario"><span>01</span><div>Detalles del trabajo<small>Cliente, prenda y diseño del pedido</small></div></div>')
s=s.replace('                <div class="grupo-input">\n                    <label>Fecha de Ingreso:', '                <div class="separador-formulario"><span>02</span><div>Entrega y ubicación<small>Planifica cuándo y dónde recibirá su pedido</small></div></div>\n                <div class="grupo-input">\n                    <label>Fecha de Ingreso:')
s=s.replace('Cliente (Nombre o Empresa):','Cliente o empresa').replace('Tipo de Prenda / Trabajo:','Prenda o trabajo').replace('Detalles del Bordado / Hilos:','Detalles del bordado').replace('Imagen del Logo / Emblema:','Diseño de referencia · opcional').replace('Dirección Exacta / Punto de Referencia:','Dirección o punto de referencia').replace('Zona de Delivery / Envío:','Método de entrega').replace('Fecha de Ingreso:','Fecha de ingreso').replace('Fecha de Entrega:','Fecha de entrega')
p.write_text(s,encoding='utf-8')
p=Path('js/vista.js'); s=p.read_text(encoding='utf-8-sig'); s=s.replace('valores.forEach(v => { const td = nodo(\'td\');', "valores.forEach((v, i) => { const td = nodo('td'); td.dataset.etiqueta = cuerpo.closest('table').querySelectorAll('th')[i]?.textContent || '';")
p.write_text(s,encoding='utf-8')
Path('estilos').mkdir(exist_ok=True)
