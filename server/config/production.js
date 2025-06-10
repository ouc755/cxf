module.exports = {
  db: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://2542134550:4EB21mxzySAd7DAY@cluster0.tdxavnf.mongodb.net/toyShop?retryWrites=true&w=majority',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'toyShop',
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000
    }
  }
};