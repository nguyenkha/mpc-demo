const express = require('express');
const db = require('./models/db');

(async function () {
  // Create app
  const app = express();

  // Load common middlewares
  app.use(express.json({
    limit: '1MB',
  }));

  // Load route
  app.get('/', function (req, res) {
    res.json({
      message: 'Unbound MPC Demo',
    });
  });
  app.use('/keys', require('./routes/key'));

  // Error handler
  app.use(require('./middlewares/error'));

  // Connect to database
  await db.sync();
  const port = process.env.PORT || 3000;
  app.listen(port);
  console.log(`Server is listening on port ${port}`);
})().catch(console.error);
