const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://timrousseau:XYe4LDZinutqxsBF@pics-cts.rkfhi3f.mongodb.net/?retryWrites=true&w=majority&appName=Pics-CTS";
const dbName = "test";

async function purgeDatabase() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    const db = client.db(dbName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Found collections:', collections.map(c => c.name));

    // Drop each collection
    for (const collection of collections) {
      console.log(`Dropping collection: ${collection.name}`);
      await db.collection(collection.name).drop();
      console.log(`Dropped collection: ${collection.name}`);
    }

    console.log('All collections have been dropped');

    // Verify collections are gone
    const remainingCollections = await db.listCollections().toArray();
    console.log('Remaining collections:', remainingCollections.map(c => c.name));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

purgeDatabase(); 