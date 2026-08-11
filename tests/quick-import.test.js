const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('../assets/quick-import.js');
const fields=['hanzi','pinyin','meaning','topic','pos','hsk','example','translation'];
const line=(i,delimiter=' | ')=>`词${i} ${delimiter} cí ${delimiter} nghĩa ${i}`;
function assertEightFields(row){for(const field of fields)assert.ok(Object.hasOwn(row,field),`missing ${field}`)}
async function parseCount(count,options={}){return core.parseLines(Array.from({length:count},(_,i)=>line(i)).join('\n'),[],{yieldTask:async()=>{},...options})}
(async()=>{
  const one=await parseCount(1);assert.equal(one.rows.length,1);assertEightFields(one.rows[0]);
  const three=core.parseLine('学习 | xuéxí | học tập');assertEightFields(three);assert.equal(three.topic,'Chưa phân loại');assert.equal(three.pos,'Chưa xác định');assert.equal(three.hsk,null);assert.equal(three.example,'');assert.equal(three.translation,'');
  const four=core.parseLine('进步 | jìnbù | tiến bộ | 我每天进步。');assert.equal(four.example,'我每天进步。');assert.equal(four.translation,'');assert.deepEqual(four.warnings,['translation']);
  const five=core.parseLine('进步 | jìnbù | tiến bộ | 我每天进步。 | Tôi tiến bộ mỗi ngày.');assert.equal(five.translation,'Tôi tiến bộ mỗi ngày.');
  const eight=core.parseLine('朋友 | péngyou | bạn | Con người | Danh từ | HSK 1 | 他是朋友。 | Anh ấy là bạn.');assert.equal(eight.topic,'Con người');assert.equal(eight.pos,'Danh từ');assert.equal(eight.hsk,1);
  assert.equal(core.parseLine('学习 | xuéxí | học tập').hanzi,'学习');
  assert.equal(core.parseLine('学习\txuéxí\thọc tập').pinyin,'xuéxí');
  for(const count of [250,1000,5000]){const parsed=await parseCount(count);assert.equal(parsed.rows.length,count);assert.equal(parsed.total,count);assert.equal(parsed.cancelled,false)}
  const existing={id:'old',hanzi:'学习',pinyin:'xuéxí'};const duplicate=core.parseLine('学习 | xuéxí | học tập',0,[existing]);assert.equal(duplicate.duplicate,existing);assert.equal(duplicate.choice,'skip');
  const blankHsk=core.parseLine('学习 | xuéxí | học tập | Giáo dục | Động từ | | 我学习。 | Tôi học.');assert.equal(blankHsk.hsk,null);assert.deepEqual(blankHsk.errors,[]);
  assert.deepEqual(core.parseLine('学习 | xuéxí | học tập | Giáo dục | Động từ | HSK 9 | 我学习。 | Tôi học.').errors,['hsk']);
  assert.ok(core.parseLine(' | xuéxí | học tập').errors.includes('hanzi'));
  let cancel=false;const cancelled=await parseCount(1000,{onProgress:()=>{cancel=true},cancelled:()=>cancel});assert.equal(cancelled.cancelled,true);assert.equal(cancelled.rows.length,core.BATCH_SIZE);
  // A quota failure must leave the previously persisted value and in-memory snapshot recoverable.
  const snapshot=[existing],storage={value:JSON.stringify(snapshot),write(){const error=new Error('full');error.name='QuotaExceededError';throw error}};try{storage.write([])}catch(error){assert.equal(error.name,'QuotaExceededError')}assert.deepEqual(JSON.parse(storage.value),snapshot);
  // The import undo model removes newly-added IDs and restores updated records.
  let words=[{id:'new'}, {id:'old',meaning:'mới'}];const undo={added:['new'],updated:[{id:'old',before:{id:'old',meaning:'cũ'}}]};const ids=new Set(undo.added);words=words.filter(word=>!ids.has(word.id));undo.updated.forEach(item=>words[words.findIndex(word=>word.id===item.id)]=item.before);assert.deepEqual(words,[{id:'old',meaning:'cũ'}]);
  const source=fs.readFileSync(require.resolve('../assets/quick-import.js'),'utf8');assert.ok(!source.includes('slice(0,200)'));assert.ok(!source.includes('maxlength="60000"'));assert.ok(source.includes('},15000)'));assert.ok(source.includes("q().storageFull"));
  console.log('quick-import: all parser, large-list, cancellation, quota, and undo checks passed');
})().catch(error=>{console.error(error);process.exitCode=1});
