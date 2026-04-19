const SHOW_FIRST = 9;
const SHOW_LAST = 9;

function formatBytes(n) {
  if (n < 1024) return n + " Б";
  if (n < 1024 ** 2) return (n / 1024).toFixed(1) + " КБ";
  if (n < 1024 ** 3) return (n / 1024 ** 2).toFixed(2) + " МБ";
  return (n / 1024 ** 3).toFixed(2) + " ГБ";
}

function formatNumber(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

/* Fills the decimal-display block with content.
 *
 * @param {string} elementId — block id
 * @param {string[]} head — first SHOW_FIRST values (rows)
 * @param {string[]} tail — last SHOW_LAST values (rows)
 * @param {number} total — total values
 * @param {string} Badge ID — id of the badge with the size
 */
function renderDecimalDisplay(elementId, head, tail, total) {
  const el = document.getElementById(elementId);

  if (total === 0) {
    el.textContent = "(нет данных)";
    return;
  }

  const parts = [...head];

  if (total > SHOW_FIRST + SHOW_LAST) {
    parts.push("...");
    parts.push(...tail);
  } else {
    const tailStart = Math.max(total - SHOW_LAST, SHOW_FIRST);
    const offset = tailStart - (total - tail.length);
    parts.push(...tail.slice(offset));
  }

  el.textContent = parts.join("  ");
}

function showProgress(elementPrefix, percent) {
  document
    .getElementById(`${elementPrefix}-progressWrap`)
    .classList.add("visible");
  document.getElementById(`${elementPrefix}-progressFill`).style.width =
    percent + "%";
  document.getElementById(`${elementPrefix}-progressLabel`).textContent =
    percent + "%";
}

function hideProgress(elementPrefix) {
  document
    .getElementById(`${elementPrefix}-progressWrap`)
    .classList.remove("visible");
  document.getElementById(`${elementPrefix}-progressFill`).style.width = "0%";
  document.getElementById(`${elementPrefix}-progressLabel`).textContent = "0%";
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

function yieldToBrowser() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
