const SHOW_FIRST = 8;
const SHOW_LAST = 4;

function formatBytes(n) {
  if (n < 1024) return n + " Б";
  if (n < 1024 ** 2) return (n / 1024).toFixed(1) + " КБ";
  if (n < 1024 ** 3) return (n / 1024 ** 2).toFixed(2) + " МБ";
  return (n / 1024 ** 3).toFixed(2) + " ГБ";
}

function formatNumber(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

/**
 * @param {string} elementId — block id <div class="binary-display">
 * @param {Object} capture — object { head: number[], tail: number[], total: number }
 */
function renderBinaryDisplay(elementId, { head, tail, total }) {
  const el = document.getElementById(elementId);

  if (total === 0) {
    el.textContent = "(пустой файл)";
    return;
  }

  const toBin = (b) => b.toString(2).padStart(8, "0"); // int 5 -> str '00000101'
  const parts = [];

  head.forEach((b) => parts.push(toBin(b)));

  if (total > head.length + tail.length) {
    parts.push("…");
    tail.forEach((b) => parts.push(toBin(b)));
  } else if (total > head.length) {
    const tailStartGlobal = total - tail.length; // global tail start index
    const firstNotInHead = Math.max(tailStartGlobal, head.length); // first needed
    const tailOffset = firstNotInHead - tailStartGlobal; //  offset in tail

    tail.slice(tailOffset).forEach((b) => parts.push(toBin(b)));
  }
  // if total <= head.length it means all bytes in head, therefore do nothing

  el.textContent = parts.join(" ");
}

function showProgress(percent) {
  document.getElementById("progressWrap").classList.add("visible");
  document.getElementById("progressFill").style.width = percent + "%";
  document.getElementById("progressLabel").textContent = percent + "%";
}

function hideProgress() {
  document.getElementById("progressWrap").classList.remove("visible");
  document.getElementById("progressFill").style.width = "0%";
  document.getElementById("progressLabel").textContent = "0%";
}

function showError(message) {
  document.getElementById("errorMessage").textContent = message;
  document.getElementById("errorModal").classList.add("active");
}

function closeModal() {
  document.getElementById("errorModal").classList.remove("active");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("errorModal").addEventListener("click", (e) => {
    if (e.target.id === "errorModal") closeModal();
  });
});
