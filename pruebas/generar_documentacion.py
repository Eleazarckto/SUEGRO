from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.sax.saxutils import escape
raiz=Path(__file__).resolve().parents[1]
texto=(raiz/'docs/DOCUMENTACION.md').read_text(encoding='utf-8-sig')
parrafos=[]
for linea in texto.splitlines():
 estilo='Title' if linea.startswith('# ') else 'Heading1' if linea.startswith('## ') else 'Normal'
 contenido=linea.lstrip('# ').strip() if linea.startswith('#') else linea
 parrafos.append(f'<w:p><w:pPr><w:pStyle w:val="{estilo}"/></w:pPr><w:r><w:t xml:space="preserve">{escape(contenido)}</w:t></w:r></w:p>')
with ZipFile(raiz/'docs/Documentación - TELAS.docx','w',ZIP_DEFLATED) as z:
 z.writestr('[Content_Types].xml','''<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>''')
 z.writestr('_rels/.rels','''<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>''')
 z.writestr('word/_rels/document.xml.rels','''<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>''')
 z.writestr('word/styles.xml','''<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="3D6DE4"/></w:rPr></w:style></w:styles>''')
 z.writestr('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+''.join(parrafos)+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>')
from xml.etree import ElementTree
with ZipFile(raiz/'docs/Documentación - TELAS.docx') as z:
 assert z.testzip() is None
 for archivo in z.namelist(): ElementTree.fromstring(z.read(archivo))
print('Word generado y estructura XML verificada.')
