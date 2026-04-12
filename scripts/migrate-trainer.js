// scripts/migrate-trainer.js
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Manually load .env.local
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) {
    process.env[key.trim()] = rest.join('=').trim();
  }
});

const MONGODB_URI = process.env.MONGODB_URI;
console.log('Connecting to:', MONGODB_URI ? 'URI found ✓' : 'URI MISSING ✗');

await mongoose.connect(MONGODB_URI);
console.log('Connected to MongoDB');

// Migrate schedules: trainerName string → trainer ObjectId
const schedules = await mongoose.connection.db.collection('schedules')
  .find({ trainerName: { $exists: true, $ne: null, $ne: '' } }).toArray();

console.log(`Found ${schedules.length} schedules to migrate`);

for (const s of schedules) {
  const user = await mongoose.connection.db.collection('users')
    .findOne({ name: s.trainerName });

  if (user) {
    await mongoose.connection.db.collection('schedules').updateOne(
      { _id: s._id },
      { $set: { trainer: user._id }, $unset: { trainerName: '' } }
    );
    console.log(`✓ Schedule: "${s.trainerName}" → user found`);
  } else {
    console.log(`✗ Schedule: No user found for trainerName "${s.trainerName}" — skipped`);
  }
}

// Migrate topics: trainerName string → trainer ObjectId
const topics = await mongoose.connection.db.collection('topics')
  .find({ trainerName: { $exists: true, $ne: null, $ne: '' } }).toArray();

console.log(`Found ${topics.length} topics to migrate`);

for (const t of topics) {
  const user = await mongoose.connection.db.collection('users')
    .findOne({ name: t.trainerName });

  if (user) {
    await mongoose.connection.db.collection('topics').updateOne(
      { _id: t._id },
      { $set: { trainer: user._id }, $unset: { trainerName: '' } }
    );
    console.log(`✓ Topic: "${t.trainerName}" → user found`);
  } else {
    console.log(`✗ Topic: No user found for trainerName "${t.trainerName}" — skipped`);
  }
}

console.log('\nMigration complete ✓');
await mongoose.disconnect();

// node scripts/migrate-trainer.js