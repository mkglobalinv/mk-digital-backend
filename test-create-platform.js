import mongoose from 'mongoose';
import FuturePlatform from './models/FuturePlatform.js';

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/mkdigital');
  try {
    const platform = new FuturePlatform({
      name: 'TestPlatform_' + Date.now(),
      retailDisplayName: 'Test Retail',
      ownerDisplayNameTemplate: '',
      logoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      url: 'https://test.com',
      mode: 'external',
      status: false,
      displayOrder: 1
    });
    await platform.save();
    console.log("Successfully saved!");
  } catch(e) {
    console.error("Error saving:", e);
  }
  process.exit(0);
}
test();
