document.addEventListener("DOMContentLoaded", () => {
  const timerElement = document.getElementById("quiz-timer");
  const progressBar = document.querySelector(".progress-bar");

  let timeLimit = parseInt(timerElement.textContent, 10); // segundos
  let elapsed = 0;

  const tick = () => {
    elapsed++;
    const remaining = timeLimit - elapsed;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    if (remaining <= 0) {
      clearInterval(interval);
      alert("Tiempo terminado");
    }
  };

  const interval = setInterval(tick, 1000);

  // Actualización de progreso dinámico (ejemplo)
  document.querySelectorAll("input[type=radio]").forEach(input => {
    input.addEventListener("change", () => {
      const answered = document.querySelectorAll("input[type=radio]:checked").length;
      const total = document.querySelectorAll("article.card").length;
      const percent = (answered / total) * 100;
      progressBar.style.width = `${percent}%`;
      progressBar.textContent = `${answered} de ${total}`;
      progressBar.setAttribute("aria-valuenow", answered);
    });
  });
});
