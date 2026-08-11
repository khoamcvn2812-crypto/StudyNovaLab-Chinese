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
