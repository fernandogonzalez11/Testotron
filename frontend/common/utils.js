function editResbox(res) {
    const text = JSON.stringify(res, null, 2);
    const elem = document.getElementsByClassName("resbox").item(0);
    elem.innerHTML = `<pre>${text}</pre>`;
    elem.style = "display: block";
}