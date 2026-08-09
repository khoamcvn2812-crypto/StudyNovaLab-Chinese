const test = require('node:test');
const assert = require('node:assert/strict');
const qi = require('../assets/quick-import.js');

test('parses short, standard, full, and tab-separated formats', () => {
  const text = [
    '学习 | xuéxí | học tập',
    '努力 | nǔlì | nỗ lực, cố gắng | 只要努力，就会有进步。 | Chỉ cần cố gắng thì sẽ tiến bộ.',
    '环境 | huánjìng | môi trường | Môi trường | Danh từ | hsk 2 | 我们应该保护环境。 | Chúng ta nên bảo vệ môi trường.',
    '女儿\tnü3 er2\tcon gái'
  ].join('\n');
  const result = qi.parse(text);
  assert.equal(result.valid, 4);
  assert.equal(result.invalid, 0);
  assert.equal(result.items[1].meaning, 'nỗ lực, cố gắng');
  assert.equal(result.items[2].hsk, 2);
  assert.equal(result.items[3].pinyin, 'nü3 er2');
});

test('ignores blank lines and rejects missing fields, invalid counts, and non-Chinese text', () => {
  const result = qi.parse('\n | pinyin | meaning\n学习 | | học\n学习 | xuéxí |\n学习 | xuéxí\nhello | hello | greeting\n');
  assert.equal(result.total, 5);
  assert.deepEqual(result.items.map(x => x.errors[0]), ['requiredHanzi', 'requiredPinyin', 'requiredMeaning', 'fieldCount', 'invalidHanzi']);
});

test('allows tone marks, numbered pinyin, commas, and missing optional translation warnings', () => {
  const result = qi.parse('学习 | xuéxí | học, học tập\n女儿 | nü3 er2 | daughter\n努力 | nu3li4 | effort | 只要努力，就会进步。 |');
  assert.equal(result.valid, 3);
  assert.deepEqual(result.items[2].warnings, ['missingTranslation']);
});

test('normalizes supported HSK variants and rejects unsupported levels', () => {
  for (const value of ['1', 'HSK1', 'HSK 1', 'hsk 1']) assert.deepEqual(qi.normalizeHsk(value), {value:1,label:'HSK 1'});
  assert.equal(qi.normalizeHsk('').value, 0);
  assert.equal(qi.normalizeHsk('HSK 9').value, null);
});

test('detects duplicates by normalized Hanzi and pinyin but permits another reading', () => {
  const existing = [{id:'old',hanzi:'还',pinyin:'hái',meaning:'still',level:4,nextReview:123}];
  const result = qi.parse('还 |  HÁI  | still\n还 | huán | return', existing);
  assert.equal(result.duplicates, 1);
  assert.equal(result.ready, 1);
});

test('limits a batch to 200 non-empty items', () => {
  const result = qi.parse(Array.from({length:201},(_,i)=>`词${i} | ci2 | word`).join('\n'));
  assert.equal(result.items.length, 200);
  assert.equal(result.total, 201);
  assert.equal(result.overflow, true);
});

test('merge and update preserve id and SRS fields', () => {
  const old={id:'stable',hanzi:'学习',pinyin:'xuéxí',meaning:'',topic:'old',example:'',hsk:1,level:5,nextReview:999,correct:8};
  const merge=qi.parse('学习 | xuéxí | học tập | Giáo dục | Động từ | HSK 2 | 我学习。 | Tôi học.',[old]);merge.items[0].duplicateAction='merge';qi.buildChanges(merge,[old],()=> 'new');
  assert.equal(old.id,'stable');assert.equal(old.level,5);assert.equal(old.nextReview,999);assert.equal(old.topic,'old');assert.equal(old.meaning,'học tập');
  const update=qi.parse('学习 | xuéxí | study | Education | Verb | 3 | 我学习。 | I study.',[old]);update.items[0].duplicateAction='update';qi.buildChanges(update,[old],()=> 'new');
  assert.equal(old.id,'stable');assert.equal(old.level,5);assert.equal(old.nextReview,999);assert.equal(old.meaning,'study');assert.equal(old.hsk,3);
});

test('undo removes only imported ids and restores only updated fields', () => {
  const words=[{id:'new',hanzi:'新',level:0},{id:'old',hanzi:'旧',meaning:'updated',level:4,nextReview:77},{id:'other',hanzi:'别',meaning:'untouched'}];
  qi.undoSnapshot(words,{addedIds:new Set(['new']),updates:[{id:'old',before:{meaning:'original',topic:undefined}}]});
  assert.deepEqual(words.map(x=>x.id),['old','other']);
  assert.equal(words[0].meaning,'original');assert.equal(words[0].level,4);assert.equal(words[0].nextReview,77);assert.equal('topic' in words[0],false);
  assert.equal(words[1].meaning,'untouched');
});
