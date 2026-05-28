const https = require('https');
require('dotenv').config({ path: '../../.env' });

const options = {
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: `/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
  method: 'GET'
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', d => { data += d; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.models) {
        console.log(parsed.models.map(m => m.name).join('\n'));
      } else {
        console.log(data);
      }
    } catch (e) { console.error(e); }
  });
});

req.on('error', error => {
  console.error(error);
});
req.end();
