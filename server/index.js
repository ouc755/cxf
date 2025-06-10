const express = require('express');
const app = express();
const port = 5000;

app.use(express.json());
app.use('/api/addresses', require('./routes/addressRoutes'));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});