const fs = require('fs');
const sharp = require('sharp');

// Load environment variables like Next.js does
const env = fs.readFileSync('.env.local', 'utf8');
env.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
});

async function run() {
  const { generateJson, buildAnalyzePrompt, buildAnalyzeSchema } = require('./src/lib/gemini.ts');
  const buf = await sharp({
    create: { width: 300, height: 300, channels: 3, background: { r: 240, g: 240, b: 240 } }
  }).composite([{
    input: Buffer.from('<svg width="300" height="300"><rect x="110" y="40" width="80" height="200" rx="20" fill="#2f9e6e"/><rect x="130" y="20" width="40" height="20" fill="#2f86d6"/></svg>'),
    top: 0, left: 0
  }]).jpeg().toBuffer();

  const available = ['bottle', 'camera', 'book', 'phone', 'charger', 'mug', 'pencil'];
  const prompt = buildAnalyzePrompt({ available, name: 'Leo', interests: [] });
  const schema = buildAnalyzeSchema(available);

  console.log('Testing generateJson with gemini-2.5-flash-lite...');
  const res = await generateJson({
    prompt,
    schema,
    image: { mimeType: 'image/jpeg', data: buf.toString('base64') },
    timeoutMs: 15000,
    maxOutputTokens: 3000
  });

  console.log('SUCCESS! Result:');
  console.log('Matched Template:', res.matchedTemplate);
  console.log('Parts count:', res.parts?.length);
}
run().catch(console.error);
