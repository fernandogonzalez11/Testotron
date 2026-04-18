async function register(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("http://localhost:3000/user", {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: {
            "Content-Type": "application/json"
        },
    });

    const json = await res.json();

    editResbox(json);
}