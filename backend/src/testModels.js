const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../../.env' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const modelsToTest = [
  'gemini-flash-latest',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
  'gemini-3.5-flash'
];

async function testModels() {
  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say exactly the word: OK');
      console.log(`✅ Success for ${modelName}:`, result.response.text());
      process.exit(0);
    } catch (e) {
      console.error(`❌ Failed for ${modelName}:`, e.message);
    }
  }
}

testModels();
