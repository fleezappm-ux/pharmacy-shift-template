const fs = require('fs'), vm = require('vm'), assert = require('assert');
const keys = {
  STORE_ID: 'TEST-ONLY', NOTION_API_KEY: 'fake', NOTION_SHIFT_DATABASE_ID: 'shifts',
  NOTION_SHIFT_REQUEST_DATABASE_ID: 'requests', NOTION_STORE_DATABASE_ID: 'store',
  SHIFT_WORK_TIME_MASTER_TEST: 'worktime', SHIFT_WORK_TIME_MASTER_TEST_ONLY: 'saved-worktime',
  SHIFT_EMPLOYEE_MASTER_JSON: 'one-operator'
};
const pages = { shifts: Array.from({length: 22}, (_, i) => ({id: `s${i}`, archived:false})), requests: [{id:'r0',archived:false}], store: [{id:'t0',archived:false}] };
let held = false;
const props = {getProperty:k=>keys[k] || null,setProperty:(k,v)=>{keys[k]=v},deleteProperty:k=>{delete keys[k]},getProperties:()=>({...keys})};
const sandbox = { console, Date, PropertiesService:{getScriptProperties:()=>props}, Utilities:{getUuid:()=>`token-${Date.now()}`}, LockService:{getScriptLock:()=>({tryLock:()=>{held=true;return true},hasLock:()=>held,releaseLock:()=>{held=false}})} };
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('gas/Code.gs','utf8'),sandbox);
sandbox.requireShiftSession=()=>({employeeId:'operator',role:'admin'});sandbox.verifyShiftApiKey=()=>{};
sandbox.assertTemplateResetTarget=()=>props;sandbox.getStoreId=()=> 'TEST_ONLY';
sandbox.readShiftEmployeeMaster=()=>[{id:'operator',active:true,displayName:'テスト'}];sandbox.normalizeShiftEmployeeMaster=x=>x;
sandbox.queryNotionDatabase=(_, db, options)=>pages[db].filter(p=>!p.archived).slice(0,options.page_size);
sandbox.requestNotion=(_,url)=>{const id=url.split('/').pop();for(const db of Object.values(pages)){const page=db.find(p=>p.id===id);if(page){page.archived=true;break}}};
sandbox.createJsonDataResponse=x=>x;sandbox.createJsonResponse=(success,message)=>({success,message});
const preview=sandbox.previewTemplateReset({});assert.equal(preview.success,true);assert.equal(preview.counts[0].count,22);
assert.equal(sandbox.getTemplateResetStatus({token:preview.token}).archived,0);
let first=sandbox.runTemplateReset({token:preview.token,confirmation:'初期化'});assert.equal(first.done,false);assert.equal(first.archived,20);
assert.equal(sandbox.getTemplateResetStatus({token:preview.token}).archived,20);
let second=sandbox.runTemplateReset({token:preview.token,confirmation:'初期化'});assert.equal(second.done,true);assert.equal(second.archived,4);
assert.equal(keys.SHIFT_WORK_TIME_MASTER_TEST_ONLY,undefined);
assert.equal(Object.values(pages).flat().filter(p=>!p.archived).length,0);
assert.equal(held,false);console.log('PASS: reset preview, status after batch, continued processing, completion and working-hour master removal');
