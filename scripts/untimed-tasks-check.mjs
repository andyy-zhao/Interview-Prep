import assert from 'node:assert/strict';
const base=process.env.TEST_API_URL || 'http://127.0.0.1:3012/api';
const id=crypto.randomUUID();
const task={id,title:'Temporary untimed task verification',category:'Other',scheduled_date:'2026-09-23',start_time:null,end_time:null,completed:false};
async function req(path,method='GET',body){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const d=await r.json();if(!r.ok)throw Error(d.error);return d;}
try {
 await req('/tasks','POST',task);
 let saved=(await req('/data')).data.tasks.find(t=>t.id===id);
 assert.equal(saved.start_time,null);assert.equal(saved.end_time,null);
 await req('/tasks','POST',{...saved,completed:true});
 saved=(await req('/data')).data.tasks.find(t=>t.id===id);assert.equal(saved.completed,true);
 await req('/tasks','POST',{...saved,start_time:'08:00',end_time:'09:00'});
 await req('/tasks','POST',{...saved,start_time:null,end_time:null});
 await assert.rejects(()=>req('/tasks','POST',{...task,start_time:'08:00'}));
 console.log('PASS: untimed save/reload, completion, timed conversion, missing-pair rejection');
} finally { await req('/tasks/'+id,'DELETE'); }
