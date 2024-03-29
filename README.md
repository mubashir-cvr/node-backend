## Express JS

#### Simple page

```
const express = require('express');
app.use('/', (req, res, next) => {
  res.send('<h1>Hello from Express!</h1>');
});

app.listen(3000);
```

#### Router 

#####  (routes > shop.js)
```

const router = express.Router();

router.get('/', (req, res, next) => {
  res.send('<h1>Hello from Express!</h1>');
});

module.exports = router;
```
#####  (app.js)

```
....
const app = express();
const shopRoutes = require('./routes/shop');

app.use(shopRoutes);

app.listen(3000);
```
