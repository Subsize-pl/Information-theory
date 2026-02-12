function validateRailInput(text, key) {
  const errors = [];

  if (!text || text.trim().length === 0) {
    errors.push("Текст не может быть пустым.");
  }

  if (text.length > MAX_TEXT_LENGTH) {
    errors.push(
      "Текст слишком длинный (" +
        text.length +
        " символов). Максимум " +
        MAX_TEXT_LENGTH +
        " символов.",
    );
  }

  if (!hasRussianLetters(text)) {
    errors.push("Текст должен содержать хотя бы одну русскую букву.");
  }

  const keyNum = parseInt(key);
  if (isNaN(keyNum)) {
    errors.push("Ключ должен быть числом.");
  } else if (keyNum < 2) {
    errors.push("Ключ должен быть не менее 2.");
  } else if (keyNum > 10) {
    errors.push("Ключ должен быть не более 10.");
  }

  return errors;
}

function encryptRailFence(text, key) {
  const cleanText = filterRussianText(text);

  if (cleanText.length === 0) {
    return "";
  }

  const rails = [];
  for (let i = 0; i < key; i++) rails[i] = [];

  let currentRail = 0;
  let direction = 1;

  for (let i = 0; i < cleanText.length; i++) {
    rails[currentRail].push(cleanText[i]);
    currentRail += direction;
    if (currentRail === 0 || currentRail === key - 1) direction = -direction;
  }

  let result = "";
  for (let i = 0; i < key; i++) {
    for (let j = 0; j < rails[i].length; j++) result += rails[i][j];
    if (i < key - 1) result += " ";
  }

  return result;
}

function decryptRailFence(text, key) {
  const cleanText = filterRussianText(text);
  const len = cleanText.length;
  if (len === 0) return "";

  const pattern = [];
  for (let i = 0; i < key; i++) {
    pattern[i] = [];
    for (let j = 0; j < len; j++) pattern[i][j] = "";
  }

  let currentRail = 0;
  let direction = 1;
  for (let i = 0; i < len; i++) {
    pattern[currentRail][i] = "*";
    currentRail += direction;
    if (currentRail === 0 || currentRail === key - 1) direction = -direction;
  }

  let textIndex = 0;
  for (let i = 0; i < key; i++) {
    for (let j = 0; j < len; j++) {
      if (pattern[i][j] === "*") {
        pattern[i][j] = cleanText[textIndex++];
      }
    }
  }

  let result = "";
  currentRail = 0;
  direction = 1;
  for (let i = 0; i < len; i++) {
    result += pattern[currentRail][i];
    currentRail += direction;
    if (currentRail === 0 || currentRail === key - 1) direction = -direction;
  }

  return result;
}

function visualizeRailFence(text, key) {
  const cleanText = filterRussianText(text);
  if (cleanText.length === 0) return "";

  let html = "<h4>Визуализация шифрования:</h4>";
  html +=
    '<div class="rail-viz-wrapper" style="max-width:100%; overflow-x:auto;">';
  html += '<table class="rail-viz">';

  for (let railNum = 0; railNum < key; railNum++) {
    html += "<tr>";
    let currentRail = 0;
    let direction = 1;

    for (let i = 0; i < cleanText.length; i++) {
      if (currentRail === railNum) {
        html += '<td class="highlight">' + cleanText[i] + "</td>";
      } else {
        html += "<td>·</td>";
      }

      currentRail += direction;
      if (currentRail === 0 || currentRail === key - 1) direction = -direction;
    }

    html += "</tr>";
  }

  html += "</table></div>";
  return html;
}

function handleEncryptRail() {
  const text = document.getElementById("railText").value;
  const key = document.getElementById("railKey").value;

  const errors = validateRailInput(text, key);
  if (errors.length > 0) {
    showError(errors.join("\n"));
    return;
  }

  const result = encryptRailFence(text, parseInt(key));
  document.getElementById("railResult").textContent = result;

  const visualization = visualizeRailFence(text, parseInt(key));
  const vizEl = document.getElementById("railVisualization");
  vizEl.innerHTML = visualization;
  vizEl.classList.add("active");
}

function handleDecryptRail() {
  const text = document.getElementById("railText").value;
  const key = document.getElementById("railKey").value;

  const errors = validateRailInput(text, key);
  if (errors.length > 0) {
    showError(errors.join("\n"));
    return;
  }

  const result = decryptRailFence(text, parseInt(key));
  document.getElementById("railResult").textContent = result;

  document.getElementById("railVisualization").classList.remove("active");
}
