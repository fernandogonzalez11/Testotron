async function update(event) {
    event.preventDefault();

    const id = document.getElementById("id").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`http://localhost:3000/user/${id}`, {
        method: "PUT",
        body: JSON.stringify({ username, password }),
        headers: {
            "Content-Type": "application/json"
        },
    });

    const json = await res.json();

    editResbox(json);
}