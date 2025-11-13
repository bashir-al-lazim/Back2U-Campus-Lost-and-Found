// ========================
// DATABASE SEED SCRIPT
// ========================
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Item from './models/Item.js';
import LostReport from './models/LostReport.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const sampleUsers = [
  {
    name: 'John Smith',
    email: 'admin@back2u.com',
    password: 'admin123',
    role: 'Admin',
    phone: '+1234567890',
  },
  {
    name: 'Sarah Johnson',
    email: 'staff@back2u.com',
    password: 'staff123',
    role: 'Staff',
    phone: '+1234567891',
  },
  {
    name: 'Mike Brown',
    email: 'student1@back2u.com',
    password: 'student123',
    role: 'Student',
    studentId: 'STU001',
    phone: '+1234567892',
  },
  {
    name: 'Emma Davis',
    email: 'student2@back2u.com',
    password: 'student123',
    role: 'Student',
    studentId: 'STU002',
    phone: '+1234567893',
  },
];

const sampleItems = [
  {
    title: 'Blue Student ID Card',
    category: 'ID Card',
    description: 'Student ID, name starts with M.',
    location: 'Library information',
    locationText: 'Library information desk',
    photoUrl: 'https://via.placeholder.com/300x200?text=ID+Card',
    photo: 'https://via.placeholder.com/300x200?text=ID+Card',
    internalTag: 'AUTH-0002',
    dateFound: new Date('2025-11-08'),
    status: 'Open',
  },
  {
    title: 'Red Student ID Card',
    category: 'ID Card',
    description: 'Student ID card with red lanyard, name starts with S.',
    location: 'Cafeteria',
    locationText: 'Main cafeteria near counter 3',
    photoUrl: 'https://via.placeholder.com/300x200?text=Red+ID+Card',
    photo: 'https://via.placeholder.com/300x200?text=Red+ID+Card',
    internalTag: 'AUTH-0003',
    dateFound: new Date('2025-11-10'),
    status: 'Open',
  },
  {
    title: 'iPhone 13 Pro',
    category: 'Electronics',
    description: 'Black iPhone 13 Pro, cracked screen on bottom right corner.',
    location: 'Lecture Hall B',
    locationText: 'Lecture Hall B, row 5 seat 12',
    photoUrl: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=300&h=200&fit=crop',
    internalTag: 'ELEC-0045',
    dateFound: new Date('2025-11-09'),
    status: 'Open',
  },
  {
    title: 'Black Wallet',
    category: 'Accessories',
    description: 'Leather wallet containing credit cards and cash.',
    location: 'Gym',
    locationText: 'Main gym locker room bench',
    photoUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=300&h=200&fit=crop',
    internalTag: 'ACC-0078',
    dateFound: new Date('2025-11-11'),
    status: 'Open',
  },
  {
    title: 'Blue Backpack',
    category: 'Bags',
    description: 'Navy blue JanSport backpack with laptop inside.',
    location: 'Computer Lab',
    locationText: 'Computer Lab C, workstation 15',
    photoUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=200&fit=crop',
    internalTag: 'BAG-0112',
    dateFound: new Date('2025-11-07'),
    status: 'Claimed',
  },
  {
    title: 'AirPods Pro',
    category: 'Electronics',
    description: 'White AirPods Pro with charging case, some scratches.',
    location: 'Student Union',
    locationText: 'Student Union building 2nd floor lounge',
    photoUrl: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=300&h=200&fit=crop',
    internalTag: 'ELEC-0089',
    dateFound: new Date('2025-11-10'),
    status: 'Open',
  },
  {
    title: 'Silver House Keys',
    category: 'Keys',
    description: 'Set of 3 silver keys on Toyota keychain.',
    location: 'Parking Lot A',
    locationText: 'Parking Lot A near entrance gate',
    photoUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=300&h=200&fit=crop',
    internalTag: 'KEY-0034',
    dateFound: new Date('2025-11-09'),
    status: 'Open',
  },
  {
    title: 'Calculus Textbook',
    category: 'Books',
    description: 'Calculus: Early Transcendentals, 9th Edition with notes.',
    location: 'Math Building',
    locationText: 'Math Building room 205, front desk',
    photoUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=200&fit=crop',
    internalTag: 'BOOK-0156',
    dateFound: new Date('2025-11-08'),
    status: 'Open',
  },
  {
    title: 'Green Jacket',
    category: 'Clothing',
    description: 'North Face green winter jacket, size L.',
    location: 'Library',
    locationText: 'Main library 3rd floor study area',
    photoUrl: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=300&h=200&fit=crop',
    internalTag: 'CLOTH-0091',
    dateFound: new Date('2025-11-11'),
    status: 'Open',
  },
  {
    title: 'Prescription Glasses',
    category: 'Accessories',
    description: 'Black frame prescription glasses in brown case.',
    location: 'Engineering Building',
    locationText: 'Engineering Building lab 102',
    photoUrl: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=300&h=200&fit=crop',
    internalTag: 'ACC-0145',
    dateFound: new Date('2025-11-07'),
    status: 'Resolved',
  },
  {
    title: 'Samsung Galaxy Buds',
    category: 'Electronics',
    description: 'Black Samsung Galaxy Buds in white case.',
    location: 'Cafeteria',
    locationText: 'South cafeteria table 12',
    photoUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=200&fit=crop',
    internalTag: 'ELEC-0098',
    dateFound: new Date('2025-11-10'),
    status: 'Open',
  },
  {
    title: 'USB Flash Drive 64GB',
    category: 'Electronics',
    description: 'SanDisk 64GB USB drive, blue color.',
    location: 'Computer Lab',
    locationText: 'Computer Lab A, station 8',
    photoUrl: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=300&h=200&fit=crop',
    internalTag: 'ELEC-0102',
    dateFound: new Date('2025-11-09'),
    status: 'Open',
  },
  {
    title: 'Water Bottle - Hydro Flask',
    category: 'Others',
    description: 'Purple Hydro Flask 32oz with name sticker.',
    location: 'Basketball Court',
    locationText: 'Basketball court bleachers section B',
    photoUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&h=200&fit=crop',
    internalTag: 'OTHER-0067',
    dateFound: new Date('2025-11-11'),
    status: 'Open',
  },
  {
    title: 'Biology Notebook',
    category: 'Books',
    description: 'Spiral notebook with biology notes, name on cover.',
    location: 'Science Building',
    locationText: 'Science Building room 310',
    photoUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=300&h=200&fit=crop',
    internalTag: 'BOOK-0178',
    dateFound: new Date('2025-11-08'),
    status: 'Open',
  },
  {
    title: 'Nike Sports Shoes',
    category: 'Clothing',
    description: 'Black Nike running shoes, size 10.',
    location: 'Gym',
    locationText: 'Gym locker room near showers',
    photoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=200&fit=crop',
    internalTag: 'CLOTH-0134',
    dateFound: new Date('2025-11-10'),
    status: 'Open',
  },
  {
    title: 'MacBook Charger',
    category: 'Electronics',
    description: 'Apple 61W USB-C MacBook Pro charger with cable.',
    location: 'Library',
    locationText: 'Library study room 7',
    photoUrl: 'https://images.unsplash.com/photo-1591290619762-d2c6588f5b89?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1591290619762-d2c6588f5b89?w=300&h=200&fit=crop',
    internalTag: 'ELEC-0115',
    dateFound: new Date('2025-11-09'),
    status: 'Open',
  },
  {
    title: 'Silver Watch',
    category: 'Accessories',
    description: 'Fossil silver watch with leather strap.',
    location: 'Gym',
    locationText: 'Gym reception desk',
    photoUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=200&fit=crop',
    internalTag: 'ACC-0189',
    dateFound: new Date('2025-11-07'),
    status: 'Open',
  },
  {
    title: 'Red Umbrella',
    category: 'Others',
    description: 'Red compact umbrella in black case.',
    location: 'Bus Stop',
    locationText: 'Campus bus stop shelter',
    photoUrl: 'https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?w=300&h=200&fit=crop',
    internalTag: 'OTHER-0098',
    dateFound: new Date('2025-11-11'),
    status: 'Open',
  },
  {
    title: 'Car Keys - Honda',
    category: 'Keys',
    description: 'Honda car keys with blue keychain.',
    location: 'Parking Lot C',
    locationText: 'Parking Lot C section 3',
    photoUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
    internalTag: 'KEY-0056',
    dateFound: new Date('2025-11-10'),
    status: 'Open',
  },
  {
    title: 'Wireless Mouse',
    category: 'Electronics',
    description: 'Logitech wireless mouse, black color.',
    location: 'Computer Lab',
    locationText: 'Computer Lab B, station 22',
    photoUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=200&fit=crop',
    internalTag: 'ELEC-0134',
    dateFound: new Date('2025-11-09'),
    status: 'Open',
  },
  {
    title: 'Yellow Scarf',
    category: 'Clothing',
    description: 'Yellow knitted scarf, handmade.',
    location: 'Lecture Hall A',
    locationText: 'Lecture Hall A, back row',
    photoUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=300&h=200&fit=crop',
    internalTag: 'CLOTH-0167',
    dateFound: new Date('2025-11-08'),
    status: 'Open',
  },
  {
    title: 'Sunglasses - Ray-Ban',
    category: 'Accessories',
    description: 'Black Ray-Ban sunglasses in original case.',
    location: 'Student Center',
    locationText: 'Student Center outdoor patio',
    photoUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300&h=200&fit=crop',
    internalTag: 'ACC-0201',
    dateFound: new Date('2025-11-11'),
    status: 'Open',
  },
  {
    title: 'Chemistry Lab Manual',
    category: 'Books',
    description: 'Chemistry lab manual with student notes.',
    location: 'Chemistry Lab',
    locationText: 'Chemistry Lab room 405',
    photoUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&h=200&fit=crop',
    internalTag: 'BOOK-0192',
    dateFound: new Date('2025-11-07'),
    status: 'Open',
  },
  {
    title: 'Pink Lunchbox',
    category: 'Others',
    description: 'Pink insulated lunchbox with name tag.',
    location: 'Cafeteria',
    locationText: 'Main cafeteria table area',
    photoUrl: 'https://images.unsplash.com/photo-1593002521169-e9c5c86f90d5?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1593002521169-e9c5c86f90d5?w=300&h=200&fit=crop',
    internalTag: 'OTHER-0123',
    dateFound: new Date('2025-11-10'),
    status: 'Open',
  },
  {
    title: 'Tennis Racket',
    category: 'Sports Equipment',
    description: 'Wilson tennis racket in blue bag.',
    location: 'Tennis Court',
    locationText: 'Tennis court bench area',
    photoUrl: 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=300&h=200&fit=crop',
    photo: 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=300&h=200&fit=crop',
    internalTag: 'SPORT-0045',
    dateFound: new Date('2025-11-09'),
    status: 'Open',
  },
];

const sampleLostReports = [
  {
    title: 'Lost MacBook Pro',
    description: 'Silver MacBook Pro 14" with coding stickers on the lid. Lost somewhere in the library.',
    category: 'Electronics',
    lastSeenLocation: 'Library - 3rd Floor',
    dateLost: new Date('2025-11-09'),
    status: 'Active',
  },
  {
    title: 'Lost Wallet',
    description: 'Brown leather wallet with student ID and credit cards inside.',
    category: 'Accessories',
    lastSeenLocation: 'Student Union Building',
    dateLost: new Date('2025-11-08'),
    status: 'Active',
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Item.deleteMany({});
    await LostReport.deleteMany({});

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = await User.create(sampleUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Get staff user for posting items
    const staffUser = createdUsers.find((user) => user.role === 'Staff');
    const studentUser = createdUsers.find((user) => user.role === 'Student');

    // Create items
    console.log('📦 Creating items...');
    const itemsWithUser = sampleItems.map((item) => ({
      ...item,
      postedBy: staffUser._id,
      claimedBy: item.status === 'Claimed' ? studentUser._id : null,
    }));
    const createdItems = await Item.create(itemsWithUser);
    console.log(`✅ Created ${createdItems.length} items`);

    // Create lost reports
    console.log('📝 Creating lost reports...');
    const reportsWithUser = sampleLostReports.map((report) => ({
      ...report,
      reportedBy: studentUser._id,
    }));
    const createdReports = await LostReport.create(reportsWithUser);
    console.log(`✅ Created ${createdReports.length} lost reports`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Items: ${createdItems.length}`);
    console.log(`   - Lost Reports: ${createdReports.length}`);
    console.log('\n🔐 Test Credentials:');
    console.log('   Admin:   admin@back2u.com / admin123');
    console.log('   Staff:   staff@back2u.com / staff123');
    console.log('   Student: student1@back2u.com / student123');
    console.log('   Student: student2@back2u.com / student123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
};

seedDatabase();
