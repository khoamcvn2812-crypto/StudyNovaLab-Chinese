const test=require('node:test');
const assert=require('node:assert/strict');
const R=require('../assets/review.js');
const words=[
 {id:'1',hanzi:'学习',pinyin:'xué xí',meaning:'học',example:'我每天学习中文。'},
 {id:'2',hanzi:'牛奶',pinyin:'niú nǎi',meaning:'sữa',example:'我喝牛奶。'},
 {id:'3',hanzi:'中国',pinyin:'zhōng guó',meaning:'Trung Quốc'},
 {id:'4',hanzi:'朋友',pinyin:'péng you',meaning:'bạn bè'}
];
test('multiple choice gracefully uses fewer than four unique words',()=>{const x=R.uniqueOptions(words.slice(0,2),words[0],'hanzi',()=>.5);assert.equal(x.length,2);assert.equal(new Set(x.map(w=>w.hanzi)).size,x.length)});
test('multiple choice removes duplicate answer values',()=>{const dup=[...words,{id:'5',hanzi:'朋友'}];const x=R.uniqueOptions(dup,words[0],'hanzi',()=>.4);assert.equal(new Set(x.map(w=>w.hanzi)).size,x.length)});
test('correct answer position is controlled by shuffle randomness',()=>{const first=R.uniqueOptions(words,words[0],'hanzi',()=>0);const last=R.uniqueOptions(words,words[0],'hanzi',()=>.999);assert.notEqual(first.findIndex(x=>x.id==='1'),last.findIndex(x=>x.id==='1'))});
test('exact Hanzi accepts trim but rejects a wrong character',()=>{assert.equal(R.gradeInput('  学习 ',words[0],'hanzi'),true);assert.equal(R.gradeInput('学系',words[0],'hanzi'),false)});
test('Pinyin accepts tone marks, tone numbers, case and spacing',()=>{assert.equal(R.gradeInput('XUÉ  XÍ',words[0],'pinyin'),true);assert.equal(R.gradeInput('xue2xi2',words[0],'pinyin'),true)});
test('blanking only replaces reviewed word and safely handles missing data',()=>{assert.equal(R.blankExample('我每天喝牛奶。','牛奶'),'我每天喝＿＿。');assert.equal(R.blankExample('我每天喝水。','牛奶'),null);assert.equal(R.blankExample('', '牛奶'),null)});
test('missing translation and HSK do not affect core grading',()=>{assert.equal(R.gradeInput('中国',{...words[2],translation:'',hsk:null},'hanzi'),true)});
test('schedule updates level both directions',()=>{const w={level:2};R.updateSchedule(w,true,0);assert.equal(w.level,3);R.updateSchedule(w,false,0);assert.equal(w.level,2)});
test('streak only increments once on the same day',()=>{const s={streak:2,lastStudy:''};R.applyStudyDay(s,'2026-08-11');R.applyStudyDay(s,'2026-08-11');assert.deepEqual(s,{streak:3,lastStudy:'2026-08-11'})});

function makeWords(count=10,overrides={}){return Array.from({length:count},(_,i)=>({id:String(i),hanzi:`词${i}`,pinyin:`ci${i}`,meaning:`word ${i}`,hsk:2,topic:'Bài học',nextReview:0,...overrides}))}
test('empty vocabulary has no valid review words',()=>{assert.deepEqual(R.filterWords([],'due',100).words,[])});
test('ten newly imported words with nextReview zero are immediately due',()=>{assert.equal(R.filterWords(makeWords(),'due',100).words.length,10)});
test('future scheduled words are not due but remain available in all',()=>{const w=makeWords(3,{nextReview:'200'});assert.equal(R.filterWords(w,'due',100).words.length,0);assert.equal(R.filterWords(w,'all',100).words.length,3)});
test('obsolete HSK filter resets to due',()=>{const result=R.filterWords(makeWords(2),'hsk:1',100);assert.equal(result.filter,'due');assert.equal(result.resetFrom,'hsk:1');assert.equal(result.words.length,2)});
test('obsolete normalized topic filter resets to due',()=>{const result=R.filterWords(makeWords(2),'topic:Old topic',100);assert.equal(result.filter,'due');assert.equal(result.resetFrom,'topic:Old topic')});
test('topic matching trims and normalizes case',()=>{assert.equal(R.filterWords(makeWords(2),'topic:  BÀI HỌC  ',100).words.length,2)});
test('empty and deleted-id review sessions are invalid',()=>{const w=makeWords(2),version=R.wordsVersion(w);assert.equal(R.sessionIsValid({queue:[],wordsVersion:version},w),false);assert.equal(R.sessionIsValid({queue:['missing'],wordsVersion:version},w),false)});
test('session created before vocabulary import is stale',()=>{const before=makeWords(1),after=makeWords(2);assert.equal(R.sessionIsValid({queue:['0'],wordsVersion:R.wordsVersion(before)},after),false)});
test('words missing optional example translation topic and HSK are reviewable',()=>{const w=makeWords(1,{example:'',translation:'',topic:'',hsk:null});assert.equal(R.filterWords(w,'all').words.length,1)});
test('all review modes receive the same valid vocabulary pool',()=>{const w=makeWords(4),counts=['choice','fill','listen'].map(()=>R.filterWords(w,'all').words.length);assert.deepEqual(counts,[4,4,4])});
test('quick import completion and undo notify an open review module',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'../assets/quick-import.js'),'utf8');assert.ok((source.match(/StudyNovaReview\?\.refresh\(\)/g)||[]).length>=2)});
test('Review all action persists all filter and starts immediately',()=>{const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'../assets/review.js'),'utf8');assert.match(source,/function startAll\(\)\{session\.filter='all';state\.settings\.reviewFilter='all';[^}]*start\(vocabulary\(\)\)/)});
