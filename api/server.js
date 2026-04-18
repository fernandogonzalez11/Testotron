const express = require("express");
const cors = require("cors");

const { initDB, createSchema } = require("./controllers/db");
const { UserController } = require("./controllers/user");

const app = express();
const PORT = 3000;

app.use(express.json());
// only allow localhost:8080 to make requests to this API
app.use(cors({ origin: "http://localhost:8080" }));

initDB();

// run `npm run api init` to create the schema
if (process.argv[2] == "init")
    createSchema();

app.get("/", (req, res) => {
    res.send("hi");
});

// user calls
app.post("/user", UserController.create);
app.get("/user/:id", UserController.get);
app.put("/user/:id", UserController.update);
app.delete("/user/:id", UserController.delete);

app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
});