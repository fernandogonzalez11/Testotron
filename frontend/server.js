const express = require("express");
const path = require("path");

const app = express();
const PORT = 8080;

app.use(express.static(__dirname, {
    index: "index.html",
    extensions: ["html"]
}));

app.use((req, res, next) => {
    const filePath = path.join(__dirname, req.path, "index.html");
    res.sendFile(filePath, (err) => {
        if (err) next();
    });
});

app.get("/style", (_, res) => res.sendFile(path.join(__dirname, "common", "style.css")));
app.get("/utils", (_, res) => res.sendFile(path.join(__dirname, "common", "utils.js")));


app.listen(PORT, () => {
    console.log(`Frontend server listening on http://localhost:${PORT}`);
});