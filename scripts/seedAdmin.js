// scripts/seedAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/training-tracker';

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  department: String,
  role: String,
  isActive: Boolean,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@ktex.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.connection.close();
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin12345', 10);
    
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@ktex.com',
      password: hashedPassword,
      department: 'Top Management',
      role: 'admin',
      isActive: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@ktex.com');
    console.log('Password: admin123');
    console.log('\n⚠️  Please change the password after first login!');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();