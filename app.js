const http = require("http");
const express = require("express");

const app = express();
app.use((req, res, next) => {
    console.log('In the Middleware !');
    next();
});

app.use((req, res, next) => {
    console.log('Another Middleware !');
    res.send("<h1>Hello From Express </h1>")
});
const server = http.createServer(app);

server.listen(3000);
