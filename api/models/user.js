const { z } = require("zod");

const vID = z.object({
    // .coerce can autoparse numbers!
    id: z.coerce.number(),
});

const vData = z.object({
    username: z.string().min(1),
    password: z.string().min(6), // min 6 characters
});

const vAll = vID.merge(vData);

class User {
    // use different validators depending on which CRUD operation you choose!
    constructor(data, type = "r") {
        let parsed;
        if (type == "c")
            parsed = vData.parse(data);
        else if (type == "r" || type == "d") 
            parsed = vID.parse(data);
        else if (type == "u")
            parsed = vAll.parse(data);
        else throw Error("Incorrect mode")

        Object.assign(this, parsed);
    }

    toJSON() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
        }
    }
}

module.exports = { User };