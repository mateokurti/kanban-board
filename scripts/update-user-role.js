const mongoose = require('mongoose');

async function updateUserRole() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kanban-board');
    console.log('Connected to MongoDB');

    // Define User schema
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      role: String
    });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Update the user role
    const email = 'klek766@gmail.com';
    const result = await User.findOneAndUpdate(
      { email: email },
      { role: 'admin' },
      { new: true }
    );

    if (result) {
      console.log('✓ User role updated successfully!');
      console.log(`  Name: ${result.name}`);
      console.log(`  Email: ${result.email}`);
      console.log(`  Role: ${result.role}`);
      console.log('\n⚠️  You must sign out and sign back in for changes to take effect!');
    } else {
      console.log('✗ User not found');
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateUserRole();
