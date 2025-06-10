const { MongoClient } = require('mongodb');

const atlasUrl = 'mongodb+srv://2542134550:4EB21mxzySAd7DAY@cluster0.tdxavnf.mongodb.net/?retryWrites=true&w=majority';

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    const client = await MongoClient.connect(atlasUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    
    console.log('Successfully connected to MongoDB Atlas!');
    const db = client.db('toyshop');
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Connection error:', error);
  }
}

testConnection(); 