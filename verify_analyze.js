const fs = require('fs');
const sharp = require('sharp');

// Load environment variables like Next.js does
const env = fs.readFileSync('.env.local', 'utf8');
env.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
});

async function run() {
  const { POST } = require('./src/app/api/analyze/route.ts');
  const buf = await sharp({
    create: { width: 300, height: 300, channels: 3, background: { r: 240, g: 240, b: 240 } }
  }).composite([{
    input: Buffer.from('<svg width="300" height="300"><rect x="110" y="40" width="80" height="200" rx="20" fill="#2f9e6e"/><rect x="130" y="20" width="40" height="20" fill="#2f86d6"/></svg>'),
    top: 0, left: 0
  }]).jpeg().toBuffer();

  const req = new Request('http://localhost:3000/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: 'data:image/jpeg;base64,' + buf.toString('base64'),
      mode: 'child',
      name: 'Leo'
    })
  });

  const res = await POST(req);
  const data = await res.json();
  console.log('STATUS:', res.status);
  console.log('MATCHED TEMPLATE:', data.matchedTemplate);
  console.log('TITLE:', data.lesson?.title?.child);
  console.log('SOURCE:', data.lesson?.source);
}
run().catch(console.error);
