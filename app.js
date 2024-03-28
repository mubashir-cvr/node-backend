const http = require("http");
const express = require("express");

const app = express();
app.use((req, res, next) => {
    console.log('In the Middleware !');
    next();
});

app.use((req, res, next) => {
    console.log('Another Middleware !');
    res.send("<h1>Nomb Thorakk Ullavar </h1><ul><li>Anu</li><li>Faju</li><li>Kuttan</li><li>Bichu</li></ul>")
});
const server = http.createServer(app);

server.listen(3000);
