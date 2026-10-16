import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore} from '../src/core/store.js';
import {createService} from '../src/core/service.js';
import {handle} from '../src/core/http.js';
process.env.APP_URL='http://localhost:3000';
process.env.ADMIN_PASSWORD='test-password-at-least-16';
const authorization='Basic '+Buffer.from('admin:'+process.env.ADMIN_PASSWORD).toString('base64');
const sample={name:'Alex',email:'alex@example.com',second_name:'Sam',second_email:'sam@example.com',message:'Meet each other.',consent:'on'};
function fixture(t){const store=openStore(':memory:');t.after(()=>store.close());const app=createService({store,deliver:async()=>({status:'accepted',providerId:'fake'})});return (path,options={})=>handle(new Request('http://localhost:3000'+path,options),'test',app)}
test('submit requires Origin and accepts authenticated same-origin JSON',async t=>{
 const call=fixture(t);const options={method:'POST',headers:{authorization,'content-type':'application/json',accept:'application/json'},body:JSON.stringify(sample)};
 assert.equal((await call('/api/submit',options)).status,403);
 const result=await call('/api/submit',{...options,headers:{...options.headers,origin:process.env.APP_URL}});assert.equal(result.status,200);assert.equal((await result.json()).ok,true);
});
test('handler enforces 413 and 415 and authenticates before parsing',async t=>{
 const call=fixture(t);const headers={origin:process.env.APP_URL,authorization,'content-type':'application/json'};
 assert.equal((await call('/api/submit',{method:'POST',headers,body:'x'.repeat(16001)})).status,413);
 assert.equal((await call('/api/submit',{method:'POST',headers:{...headers,'content-type':'text/plain'},body:'hello'})).status,415);
 for(const accept of ['application/json','text/html']){const result=await call('/api/submit',{method:'POST',headers:{origin:process.env.APP_URL,'content-type':'application/json',accept},body:'{'});assert.equal(result.status,401);assert.equal(result.headers.get('www-authenticate'),'Basic realm="Operator", charset="UTF-8"');}
});
test('admin challenges HTML and JSON clients and health is public',async t=>{
 const call=fixture(t);for(const accept of ['text/html','application/json']){const result=await call('/admin',{headers:{accept}});assert.equal(result.status,401);assert.equal(result.headers.get('www-authenticate'),'Basic realm="Operator", charset="UTF-8"');}
 assert.equal((await call('/admin',{headers:{authorization}})).status,200);
 const health=await call('/health');assert.equal(health.status,200);assert.deepEqual(await health.json(),{ok:true});
});
