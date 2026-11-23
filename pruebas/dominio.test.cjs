const assert = require('node:assert/strict');
const {test} = require('node:test');
const D = require('../js/dominio');
test('dinero exacto y validación de entradas', () => {
 assert.equal(Array(100).fill(D.centavos('0.01')).reduce((a,b)=>a+b),100);
 assert.equal(D.centavos('123,45'),12345);
 for(const v of ['-1','NaN','Infinity','1.001','','1e5']) assert.throws(()=>D.centavos(v));
 assert.equal(D.decimal(12345),'123.45');
});
test('fechas y cantidades reales',()=>{
 assert.throws(()=>D.fecha('2026-02-30')); assert.throws(()=>D.entero('2.7','cantidad'));
 assert.equal(D.fecha('2024-02-29'),'2024-02-29');
});
test('rechazo de imágenes activas y URL remota',()=>{
 assert.throws(()=>D.imagen('javascript:alert(1)'));
 assert.throws(()=>D.imagen('data:image/svg+xml;base64,AAAA'));
 assert.throws(()=>D.imagen('https://example.org/a.png'));
});
test('respaldos antiguos migran importes sin perder texto',()=>{
 const r=D.respaldo({pedidos:[],precios:[{prenda:'Franela',talla:'M',detal:10.25,mayor:7.5}],envios:[],empleados:[],caja:[],notas:[]});
 assert.equal(r.precios[0].detalCentavos,1025);
 assert.throws(()=>D.respaldo({pedidos:[]}));
 assert.throws(()=>D.respaldo({...r,version:3}));
});
test('restauración repetida preserva multiplicidad sin duplicación',()=>{
 const a={fecha:'2026-11-19',concepto:'Venta',montoCentavos:100};
 const primera=D.fusionar([], [a,a]); assert.equal(primera.length,2);
 assert.equal(D.fusionar(primera,[a,a]).length,2);
 assert.equal(D.fusionar([{...a,uid:'x'}],[{...a,uid:'x',montoCentavos:200}])[0].montoCentavos,100);
 assert.equal(D.fusionar([{...a,uid:'x'}],[{...a,uid:'y'}]).length,2);
});
test('búsqueda ignora mayúsculas y tildes',()=>assert.equal(D.buscar(' LÓPEZ '),'lopez'));
