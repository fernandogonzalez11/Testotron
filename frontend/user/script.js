async function get(event) {
    event.preventDefault();

    const id = document.getElementById("id").value;

    const res = await fetch(`http://localhost:3000/user/${id}`);

    const json = await res.json();

    editResbox(json);
    document.querySelector("#btn-delete").style = "display: block";
}

async function del() {
    const id = document.getElementById("id").value;

    const res = await fetch(`http://localhost:3000/user/${id}`, {
        method: "DELETE",
    });

    const json = await res.json();

    editResbox(json);
}