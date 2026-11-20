import fs from 'fs'; import assert from 'assert';
const html = fs.readFileSync(new URL('../app/index.html', import.meta.url), 'utf8');
const core = html.split('/*CORE-START*/')[1].split('/*CORE-END*/')[0];
const C = new Function(core + '; return {normDigits,scoreScam,findPII,maskPII,analyzePost,parseCSV,analyzeConnections,wrapText,parseSlides,jpegPdf,normWord,analyzeProfile,matchJob,detectExport,profileFromExport,analyzeShares,readZip};')();
// scam
const s1 = C.scoreScam('يرجى دفع رسوم التسجيل 150 ريال وإرسال صورة الهوية، تواصل على واتساب، بدون خبرة، خلال 24 ساعة');
assert(s1.score >= 6 && s1.level === 'مرتفع', 'high scam ' + s1.score);
const s2 = C.scoreScam('We would like to invite you to a video interview with our hiring team next week at careers@company.com');
assert.equal(s2.score, 0);
const s3 = C.scoreScam('وزارة الموارد: ادفع رسوم التسجيل'); assert(s3.hits.some(h=>h.id==='imp'));
// pii
const t = 'هويتي ١٠٩٨٧٦٥٤٣٢ وجوالي +966 55 123 4567 وبريدي a.b@x.com وآيبان SA0380000000608010167519 وبطاقة 4111 1111 1111 1111';
const f = C.findPII(t); const ids = f.map(x=>x.id);
for (const id of ['nid','mob','mail','iban','card']) assert(ids.includes(id), 'missing ' + id + ' ' + JSON.stringify(f));
const m = C.maskPII(t, f); assert(!m.includes('123 4567') && !m.includes('a.b@x.com'));
assert(C.findPII('رقم الطلب 2026 والمعيار ISO27001').length === 0, 'false positives');
// post
const p = C.analyzePost('سطر\n\nنص #وسم #ثاني https://x.com؟'); assert.equal(p.tags, 2); assert.equal(p.links, 1);
// csv
const csv = 'Notes:\n"x, y"\n\nFirst Name,Last Name,URL,Email Address,Company,Position,Connected On\nA,B,u,,"Acme, Inc",Data Engineer,15 Mar 2023\nC,D,u,e@x.com,Acme, Inc,Director,01 Jan 2025\n';
const a = C.analyzeConnections(csv); assert.equal(a.total, 2); assert.equal(a.email, 1); assert.deepEqual(a.years, [['2023',1],['2025',1]]);
// slides & wrap
assert.equal(C.parseSlides('a\n- b\n---\nc').length, 2);
assert.deepEqual(C.wrapText(s=>s.length, 'aa bb cc', 5), ['aa bb','cc']);
// pdf
const parts = C.jpegPdf([{w:10,h:10,bytes:new Uint8Array([255,216,255,217])}]);
const buf = Buffer.concat(parts.map(p=>Buffer.from(p))); const s = buf.toString('latin1');
const xref = +s.match(/startxref\n(\d+)/)[1]; assert(s.slice(xref).startsWith('xref'));
for (const [i,o] of [...s.matchAll(/(\d{10}) 00000 n/g)].map((m,i)=>[i+1,+m[1]])) assert(s.slice(o).startsWith(i+' 0 obj'), 'offset '+i);
// pii: other Arab countries
const ids0 = s => C.findPII(s).map(x=>x.id);
for (const [txt,id] of [
  ['آيبان إماراتي AE07 0331 2345 6789 0123 456','iban'], ['KW81CBKU0000000000001234560101','iban'], ['QA58DOHB00001234567890ABCDEFG','iban'],
  ['BH67BMAG00001299123456','iban'], ['JO94CBJO0010000000000131000302','iban'], ['EG380019000500000000263180002','iban'],
  ['الهوية الإماراتية 784-1990-1234567-6','eid'], ['الرقم القومي 29001011234567','egnid'], ['الرقم المدني 290010112345','kwcid'],
  ['رقم الهوية القطرية QID: 28763400123','idx'], ['CPR 850412345','idx'], ['الرقم الوطني ٩٨٧١٢٣٤٥٦٧','idx'],
  ['+971 50 123 4567','mob'], ['00965 9876 5432','mob'], ['+974 3312 3456','mob'], ['+973 3612 3456','mob'], ['+968 9123 4567','mob'],
  ['+962 79 123 4567','mob'], ['0791234567','mob'], ['+20 100 123 4567','mob'], ['01012345678','mob']])
  assert(ids0(txt).includes(id), `missing ${id} in ${txt}: ${JSON.stringify(C.findPII(txt))}`);
assert.deepEqual(ids0('two ibans SA0380000000608010167519 AE070331234567890123456'), ['iban','iban']);
assert.equal(C.findPII('AE070331234567890123457').length, 0, 'bad IBAN checksum');
assert.equal(C.findPII('XX070331234567890123456').filter(f=>f.id==='iban').length, 0, 'unknown IBAN country');
assert(!ids0('784-1990-1234567-5').includes('eid'), 'bad EID check digit');
assert(!ids0('29013401234567').includes('egnid'), 'bad Egyptian date');
assert(!ids0('29001019934567').includes('egnid'), 'bad governorate');
assert(!ids0('290139912345').includes('kwcid'), 'bad Kuwaiti date');
assert.equal(C.findPII('رقم الفاتورة 850412345 وكود المنتج 98765432 والسنة 2026').length, 0, 'context-free numbers');
assert.equal(C.findPII('ISO 27001:2022 و +44 20 7946 0958').length, 0, 'non-Arab numbers');
// profile
const pr = C.analyzeProfile({headline:'مهندس بيانات', about:'أنا شغوف بالبيانات.', exp:'مسؤول عن التقارير\nبنيت خطاً خفّض الوقت 50%', role:'محلل بيانات'});
const bad = pr.checks.filter(c=>!c.ok).map(c=>c.k);
for (const k of ['طول العنوان المهني','لغة بلا عبارات مستهلكة','طول النبذة','الخبرات بصيغة الإنجاز','الدور المستهدف في العنوان']) assert(bad.includes(k), 'profile should flag ' + k);
const goodAbout = 'أعمل على تحويل البيانات إلى قرارات. ' + 'ساعدت ثلاث جهات حكومية على خفض وقت التقارير 60٪ عبر خطوط بيانات آلية. '.repeat(12) + 'يسعدني التواصل مع فرق البيانات في القطاع العام.';
const pg = C.analyzeProfile({headline:'مهندس بيانات | أبني خطوط بيانات موثوقة للجهات الحكومية | خبرة 8 سنوات', about:goodAbout, exp:'بنيت 12 لوحة معلومات\nخفّضت التكلفة 30%', role:'مهندس بيانات'});
assert.equal(pg.score, 100, JSON.stringify(pg.checks.filter(c=>!c.ok)));
assert(C.analyzeProfile({about:'He is a data engineer with 5 years of experience. Contact me.'}).checks.find(c=>c.k==='النبذة بضمير المتكلم').ok===false);
assert(!C.analyzeProfile({headline:'Data Engineer | Building reliable pipelines', about:'جوالي 0551234567'}).checks.find(c=>c.k==='لا بيانات شخصية حساسة').ok);
// job match
assert.equal(C.normWord('البيانات'), C.normWord('بيانات')); assert.equal(C.normWord('Skills'), 'skill');
const jd = 'المتطلبات:\n- إجادة SQL وPython\n- خبرة لا تقل عن 3 سنوات في تحليل البيانات\n- يفضل شهادة سحابية';
const j1 = C.matchJob(jd, 'محللة بيانات 2022 - 2026\n- استعلامات SQL وتحليل البيانات\n- Python');
assert(j1.matched.some(w=>/sql/i.test(w)) && j1.matched.some(w=>/python/i.test(w)), JSON.stringify(j1));
assert(j1.missing.some(w=>/سحاب/.test(w))); assert.equal(j1.yearsJD, 3); assert.equal(j1.yearsCV, 4);
assert.equal(j1.reqs.length, 3); assert.equal(j1.reqs[2].kind, 'مفضّل'); assert.equal(j1.mustTotal, 2);
const j0 = C.matchJob(jd, 'طاهٍ في مطعم، أطبخ المعجنات'); assert(j0.score < 15, 'unrelated CV ' + j0.score);
assert(C.matchJob(jd, 'SQL Python تحليل البيانات سحابية شهادة إجادة').score > 80);
// export files
const prof = 'First Name,Last Name,Maiden Name,Address,Birth Date,Headline,Summary,Industry\nA,B,,,,"Data Engineer | Pipelines","Line one\nLine two",IT\n';
const pos = 'Company Name,Title,Description,Location,Started On,Finished On\nAcme,Data Engineer,"Built X\nCut cost 20%",Riyadh,Jan 2022,\n';
assert.equal(C.detectExport(prof).type, 'profile'); assert.equal(C.detectExport(pos).type, 'positions'); assert.equal(C.detectExport(csv).type, 'connections');
const pf = C.profileFromExport(prof, pos); assert.equal(pf.headline, 'Data Engineer | Pipelines'); assert(pf.about.includes('Line two')); assert(pf.exp.startsWith('Data Engineer — Acme\nBuilt X'));
const sh = 'Date,ShareLink,ShareCommentary,SharedUrl,MediaUrl,Visibility\n2026-10-05 08:00:00,u,"منشور أول\nبسطرين #بيانات #البيانات",,m.jpg,PUBLIC\n2026-06-02 09:00:00,u,"ثانٍ ""مقتبس"" #بيانات",https://x.com,,PUBLIC\n2024-01-01 10:00:00,u,,,,PUBLIC\n';
assert.equal(C.detectExport(sh).type, 'shares');
const sa = C.analyzeShares(sh, Date.UTC(2026,10,20));
assert.equal(sa.total, 3); assert.equal(sa.last12, 2); assert.equal(sa.media, 1); assert.equal(sa.links, 1); assert.equal(sa.reshares, 1);
assert.deepEqual(sa.tags[0], ['#بيانات', 2]); assert.equal(sa.months.length, 12); assert.equal(sa.months.at(-2)[1], 1); assert.equal(sa.days[1][1], 2); assert.equal(sa.days[2][1], 1);
assert(C.analyzeShares(csv).error);
// zip (stored + deflated entries)
const zlib = await import('zlib');
function zip(files){ const loc=[], cen=[]; let off=0;
  for (const [name, text, deflate] of files){ const raw=Buffer.from(text), data=deflate?zlib.deflateRawSync(raw):raw, nm=Buffer.from(name);
    const lh=Buffer.alloc(30); lh.writeUInt32LE(0x04034b50,0); lh.writeUInt16LE(deflate?8:0,8); lh.writeUInt32LE(data.length,18); lh.writeUInt32LE(raw.length,22); lh.writeUInt16LE(nm.length,26);
    const ch=Buffer.alloc(46); ch.writeUInt32LE(0x02014b50,0); ch.writeUInt16LE(deflate?8:0,10); ch.writeUInt32LE(data.length,20); ch.writeUInt32LE(raw.length,24); ch.writeUInt16LE(nm.length,28); ch.writeUInt32LE(off,42);
    loc.push(lh,nm,data); cen.push(ch,nm); off+=30+nm.length+data.length; }
  const cd=Buffer.concat(cen), e=Buffer.alloc(22); e.writeUInt32LE(0x06054b50,0); e.writeUInt16LE(files.length,8); e.writeUInt16LE(files.length,10); e.writeUInt32LE(cd.length,12); e.writeUInt32LE(off,16);
  return Buffer.concat([...loc,cd,e]); }
const zbuf = zip([['Basic_LinkedInDataExport/Connections.csv', csv, true], ['Profile.csv', prof, false], ['Ignore.txt', 'x', true]]);
const ents = await C.readZip(zbuf, n=>/\.csv$/.test(n));
assert.deepEqual(ents.map(e=>e.name), ['Basic_LinkedInDataExport/Connections.csv','Profile.csv']);
assert.equal(new TextDecoder().decode(ents[0].data), csv); assert.equal(C.analyzeConnections(new TextDecoder().decode(ents[0].data)).total, 2);
await assert.rejects(C.readZip(Buffer.from('not a zip at all, just text padding....')));
console.log('all core tests passed');
