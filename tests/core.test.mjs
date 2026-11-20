import fs from 'fs'; import assert from 'assert';
const html = fs.readFileSync(new URL('../app/index.html', import.meta.url), 'utf8');
const core = html.split('/*CORE-START*/')[1].split('/*CORE-END*/')[0];
const C = new Function(core + '; return {normDigits,scoreScam,findPII,maskPII,analyzePost,parseCSV,analyzeConnections,wrapText,parseSlides,jpegPdf};')();
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
console.log('all core tests passed');
