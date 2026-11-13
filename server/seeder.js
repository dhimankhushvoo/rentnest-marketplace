const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load models
const User = require('./models/User');
const Category = require('./models/Category');
const Item = require('./models/Item');
const Rental = require('./models/Rental');
const Deposit = require('./models/Deposit');
const Review = require('./models/Review');
const Dispute = require('./models/Dispute');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rentnest_db';

const seedData = async (shouldExit = true) => {
  try {
    console.log('Connecting to MongoDB at:', mongoUri);
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri);
    }
    console.log('MongoDB connected successfully for seeding.');

    // 1. Clear existing sample data
    console.log('Clearing old collections...');
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Item.deleteMany(),
      Rental.deleteMany(),
      Deposit.deleteMany(),
      Review.deleteMany(),
      Dispute.deleteMany(),
    ]);
    console.log('Old collections cleared.');

    // 3. Create Users (Owners, Renters, Admin)
    // NOTE: Pass plain 'password123' so Mongoose's pre('save') hook hashes it ONCE.
    console.log('Creating users...');
    const users = await User.create([
      {
        name: 'Aarav Sharma',
        email: 'aarav@example.com',
        password: 'password123',
        role: 'owner',
        phone: '+91 98765 43210',
        address: 'Indiranagar, Bengaluru, Karnataka',
      },
      {
        name: 'Priya Patel',
        email: 'priya@example.com',
        password: 'password123',
        role: 'owner',
        phone: '+91 98111 22334',
        address: 'Koramangala 4th Block, Bengaluru, Karnataka',
      },
      {
        name: 'Vikram Sengupta',
        email: 'vikram@example.com',
        password: 'password123',
        role: 'owner',
        phone: '+91 97222 33445',
        address: 'HSR Layout Sector 2, Bengaluru, Karnataka',
      },
      {
        name: 'Rohan Gupta',
        email: 'rohan@example.com',
        password: 'password123',
        role: 'renter',
        phone: '+91 91234 56789',
        address: 'Whitefield, Bengaluru, Karnataka',
      },
      {
        name: 'Ananya Deshmukh',
        email: 'ananya@example.com',
        password: 'password123',
        role: 'renter',
        phone: '+91 95432 10987',
        address: 'Jayanagar 4th Block, Bengaluru, Karnataka',
      },
      {
        name: 'Super Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        phone: '+91 90000 00001',
        address: 'RentNest HQ, MG Road, Bengaluru',
      },
    ]);

    const [aarav, priya, vikram, rohan, ananya, admin] = users;
    console.log(`Created ${users.length} users.`);

    // 4. Create Categories
    console.log('Creating categories...');
    const categories = await Category.create([
      {
        name: 'Camping & Outdoors',
        description: 'Tents, sleeping bags, trekking poles, and outdoor survival equipment',
      },
      {
        name: 'Photography & Filming',
        description: 'Mirrorless cameras, prime lenses, drones, gimbals, and studio lighting',
      },
      {
        name: 'Power Tools & DIY',
        description: 'Cordless drills, miter saws, pressure washers, and home renovation tools',
      },
      {
        name: 'Audio & Event Tech',
        description: 'PA speakers, karaoke systems, DJ mixers, and home theater projectors',
      },
      {
        name: 'Gaming & VR',
        description: 'Next-gen consoles, VR headsets, controllers, and gaming peripherals',
      },
      {
        name: 'Sports & Fitness',
        description: 'Mountain bikes, road bicycles, camping kayaks, and sports gear',
      },
    ]);

    const [catCamping, catPhoto, catTools, catAudio, catGaming, catSports] = categories;
    console.log(`Created ${categories.length} categories.`);

    // 5. Create 12+ Realistic Rental Items
    console.log('Creating rental items...');
    const items = await Item.create([
      // Camping
      {
        owner: aarav._id,
        category: catCamping._id,
        title: 'Quechua 3-Person Waterproof Camping Tent',
        description:
          'High-durability 3-person waterproof tent with dual ventilation windows, easy 10-minute setup, and carry bag. Ideal for Western Ghats and Himalayan weekend treks.',
        images: [
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1000&q=80',
        ],
        pricePerDay: 250,
        depositAmount: 500,
        isAvailable: true,
      },
      {
        owner: aarav._id,
        category: catCamping._id,
        title: 'Coleman Dual-Burner Portable Camping Stove',
        description:
          'Compact propane camping stove with dual 20,000 BTU burners, wind guards, and push-button ignition. Perfect for outdoor barbecue and camping meals.',
        images: [
          'https://images.unsplash.com/photo-1525811902-f2342640856e?auto=format&fit=crop&w=1000&q=80',
        ],
        pricePerDay: 180,
        depositAmount: 400,
        isAvailable: true,
      },
      // Photography
      {
        owner: priya._id,
        category: catPhoto._id,
        title: 'Sony Alpha A7 IV Full-Frame Mirrorless Camera',
        description:
          'Professional 33MP full-frame hybrid camera with 4K 60p 10-bit video, real-time eye AF, 28-70mm lens, 2 spare batteries, and 128GB high-speed SD card.',
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=1000&q=80',
        ],
        pricePerDay: 1200,
        depositAmount: 3000,
        isAvailable: true,
      },
      {
        owner: priya._id,
        category: catPhoto._id,
        title: 'DJI Mini 3 Pro 4K Drone with Smart Controller',
        description:
          'Lightweight under 249g drone featuring 4K HDR video, tri-directional obstacle avoidance, 34-minute flight time, and DJI RC with built-in FHD display.',
        images: [
          'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1000&q=80',
        ],
        pricePerDay: 1400,
        depositAmount: 3500,
        isAvailable: true,
      },
      {
        owner: priya._id,
        category: catPhoto._id,
        title: 'GoPro HERO12 Black Action Camera + Adventure Kit',
        description:
          '5.3K 60fps waterproof action camera with HyperSmooth 6.0 stabilization, chest mount, selfie stick tripod, and 2 Enduro batteries.',
        images: [
          'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1000&q=80',
        ],
        pricePerDay: 450,
        depositAmount: 1000,
        isAvailable: true,
      },
      // Tools
      {
        owner: vikram._id,
        category: catTools._id,
        title: 'Bosch GSB 18V Cordless Impact Drill & 100-Piece Kit',
        description:
          'Heavy-duty cordless hammer drill with 2 lithium-ion batteries, fast charger, masonry/wood/metal drill bit set, and robust carry case.',
        images: [
          'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80',
        ],
        pricePerDay: 350,
        depositAmount: 700,
        isAvailable: true,
      },
      {
        owner: vikram._id,
        category: catTools._id,
        title: 'Karcher K3 High Pressure Car & Patio Washer',
        description:
          '1600 PSI electric high-pressure washer with 6-meter high pressure hose, dirt blaster spray lance, and detergent tank. Ideal for deep car washes and driveway cleaning.',
        images: [
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80',
        ],
        pricePerDay: 400,
        depositAmount: 800,
        isAvailable: true,
      },
      // Audio & Event Tech
      {
        owner: aarav._id,
        category: catAudio._id,
        title: 'JBL PartyBox 310 Portable Bluetooth Speaker (240W)',
        description:
          'High-power 240W party speaker with built-in dynamic light show, dual microphone inputs for karaoke, 18-hour battery, and smooth-glide wheels.',
        images: [
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1000&q=80',
        ],
        pricePerDay: 850,
        depositAmount: 2000,
        isAvailable: true,
      },
      {
        owner: aarav._id,
        category: catAudio._id,
        title: 'Epson Full HD 1080p Home Cinema Projector',
        description:
          '3,400 lumens bright 1080p home theater projector with dual HDMI ports, built-in speaker, and portable 100-inch foldable projector screen included.',
        images: [
          'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1000&q=80',
        ],
        pricePerDay: 750,
        depositAmount: 1800,
        isAvailable: true,
      },
      // Gaming & VR
      {
        owner: vikram._id,
        category: catGaming._id,
        title: 'PlayStation 5 Console + 2 DualSense Controllers',
        description:
          'Sony PS5 Disc Edition console with 2 wireless DualSense controllers, charging dock, FIFA 24, and Spider-Man 2 pre-installed for weekend gaming.',
        images: [
          'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80',
        ],
        pricePerDay: 650,
        depositAmount: 2500,
        isAvailable: true,
      },
      {
        owner: vikram._id,
        category: catGaming._id,
        title: 'Meta Quest 3 (128GB) Virtual Reality Headset',
        description:
          'Next-gen mixed reality VR headset with 4K+ Infinite Display, Touch Plus controllers, silicone hygiene cover, and Beat Saber ready to play.',
        images: [
          'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=1000&q=80',
        ],
        pricePerDay: 900,
        depositAmount: 2500,
        isAvailable: true,
      },
      // Sports & Fitness
      {
        owner: priya._id,
        category: catSports._id,
        title: 'Trek Marlin 7 Hardtail Mountain Bike (21-Speed)',
        description:
          'Lightweight alpha silver aluminum frame with RockShox suspension fork, Shimano Deore 1x10 drivetrain, hydraulic disc brakes, helmet, and lock.',
        images: [
          'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1000&q=80',
        ],
        pricePerDay: 350,
        depositAmount: 1000,
        isAvailable: true,
      },
    ]);

    console.log(`Created ${items.length} rental items.`);

    // 6. Create Sample Completed and Active Rentals with Deposits & Reviews
    console.log('Creating sample rental transactions and reviews...');
    const tentItem = items[0];
    const cameraItem = items[2];
    const ps5Item = items[9];

    // Rental 1: Completed rental of Tent by Rohan
    const r1StartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const r1EndDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const rental1 = await Rental.create({
      item: tentItem._id,
      renter: rohan._id,
      startDate: r1StartDate,
      endDate: r1EndDate,
      returnedOn: r1EndDate,
      status: 'Returned',
      totalAmount: 750,
      penaltyAmount: 0,
      renterNote: 'Going camping in Coorg with friends.',
    });

    await Deposit.create({
      rental: rental1._id,
      renter: rohan._id,
      amount: tentItem.depositAmount,
      refundAmount: tentItem.depositAmount,
      deductedAmount: 0,
      status: 'refunded',
      reason: 'Returned in pristine condition without damages.',
    });

    await Review.create({
      rental: rental1._id,
      item: tentItem._id,
      reviewer: rohan._id,
      reviewee: aarav._id,
      rating: 5,
      comment:
        'The tent was spotless and kept us completely dry during nighttime rain. Aarav was very friendly and handed it over on time.',
    });

    // Rental 2: Completed rental of Sony Camera by Ananya
    const r2StartDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const r2EndDate = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000);
    const rental2 = await Rental.create({
      item: cameraItem._id,
      renter: ananya._id,
      startDate: r2StartDate,
      endDate: r2EndDate,
      returnedOn: r2EndDate,
      status: 'Returned',
      totalAmount: 2400,
      penaltyAmount: 0,
      renterNote: 'Shoot for a college short film festival.',
    });

    await Deposit.create({
      rental: rental2._id,
      renter: ananya._id,
      amount: cameraItem.depositAmount,
      refundAmount: cameraItem.depositAmount,
      deductedAmount: 0,
      status: 'refunded',
      reason: 'Camera, sensor and lens returned clean.',
    });

    await Review.create({
      rental: rental2._id,
      item: cameraItem._id,
      reviewer: ananya._id,
      reviewee: priya._id,
      rating: 5,
      comment:
        'Incredible camera! The 4K footage was crisp and the extra battery was a lifesaver. Will definitely rent again!',
    });

    // Rental 3: Active Handed Over PS5 rental
    const r3StartDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const r3EndDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const rental3 = await Rental.create({
      item: ps5Item._id,
      renter: rohan._id,
      startDate: r3StartDate,
      endDate: r3EndDate,
      status: 'Handed Over',
      totalAmount: 1950,
      penaltyAmount: 0,
      renterNote: 'Weekend FIFA tournament with roommates.',
    });

    await Deposit.create({
      rental: rental3._id,
      renter: rohan._id,
      amount: ps5Item.depositAmount,
      refundAmount: 0,
      deductedAmount: 0,
      status: 'held',
      reason: 'Deposit held in escrow during active rental.',
    });

    console.log('✅ Seeding completed successfully!');
    if (shouldExit) {
      process.exit(0);
    }
    return { success: true, users: users.length, categories: categories.length, items: items.length };
  } catch (error) {
    console.error('❌ Seeder Error:', error);
    if (shouldExit) {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = seedData;

if (require.main === module) {
  seedData(true);
}
