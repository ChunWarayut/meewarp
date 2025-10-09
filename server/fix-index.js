#!/usr/bin/env node

const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: './.env' });

const WarpPackage = require('./models/WarpPackage');

async function fixIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the collection
    const collection = mongoose.connection.db.collection('warppackages');
    
    console.log('Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log('Index:', index.name, '- Key:', index.key);
    });

    // Drop the incorrect index if it exists
    try {
      console.log('\nDropping incorrect index: seconds_1');
      await collection.dropIndex('seconds_1');
      console.log('Successfully dropped seconds_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('Index seconds_1 does not exist, skipping...');
      } else {
        console.error('Error dropping index:', error.message);
      }
    }

    // Drop the incorrect store_seconds index if it exists
    try {
      console.log('\nDropping incorrect index: store_1_seconds_1');
      await collection.dropIndex('store_1_seconds_1');
      console.log('Successfully dropped store_1_seconds_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('Index store_1_seconds_1 does not exist, skipping...');
      } else {
        console.error('Error dropping index:', error.message);
      }
    }

    // Create the correct compound index
    console.log('\nCreating correct compound index: { store: 1, seconds: 1 }');
    await collection.createIndex(
      { store: 1, seconds: 1 }, 
      { unique: true, sparse: true, name: 'store_1_seconds_1_unique' }
    );
    console.log('Successfully created store_1_seconds_1_unique index');

    // Create the correct compound index for name
    console.log('\nCreating correct compound index: { store: 1, name: 1 }');
    await collection.createIndex(
      { store: 1, name: 1 }, 
      { unique: true, sparse: true, name: 'store_1_name_1_unique' }
    );
    console.log('Successfully created store_1_name_1_unique index');

    console.log('\nFinal indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log('Index:', index.name, '- Key:', index.key);
    });

    console.log('\nIndex fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixIndex();
