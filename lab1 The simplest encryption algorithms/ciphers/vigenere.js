function validateVigenereInput(text, key) {
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

  const cleanKey = filterRussianText(key);
  if (!key || key.trim().length === 0) {
    errors.push("Ключевое слово не может быть пустым.");
  } else if (cleanKey.length === 0) {
    errors.push("Ключевое слово должно содержать русские буквы.");
  } else if (cleanKey.length < 3) {
    errors.push("Ключевое слово должно содержать минимум 3 буквы.");
  } else if (cleanKey.length > 20) {
    errors.push("Ключевое слово должно содержать максимум 20 букв.");
  }

  return errors;
}

function shiftKey(key, shiftAmount) {
  let result = "";
  for (let i = 0; i < key.length; i++) {
    const charIndex = getCharIndex(key[i]);
    const newIndex = charIndex + shiftAmount;
    result += getCharByIndex(newIndex);
  }
  return result;
}

function encryptVigenere(text, key) {
  const cleanText = filterRussianText(text);
  const cleanKey = filterRussianText(key);

  if (cleanText.length === 0 || cleanKey.length === 0) return "";

  let result = "";
  let currentKey = cleanKey;
  let keyCycleCount = 0;

  for (let i = 0; i < cleanText.length; i++) {
    const textChar = cleanText[i];
    const keyChar = currentKey[i % currentKey.length];

    const textIndex = getCharIndex(textChar);
    const keyIndex = getCharIndex(keyChar);
    const encryptedIndex = (textIndex + keyIndex) % RUSSIAN_ALPHABET.length;
    result += getCharByIndex(encryptedIndex);

    if ((i + 1) % currentKey.length === 0) {
      keyCycleCount++;
      currentKey = shiftKey(cleanKey, keyCycleCount);
    }
  }

  return result;
}

function decryptVigenere(text, key) {
  const cleanText = filterRussianText(text);
  const cleanKey = filterRussianText(key);
  if (cleanText.length === 0 || cleanKey.length === 0) return "";

  let result = "";
  let currentKey = cleanKey;
  let keyCycleCount = 0;

  for (let i = 0; i < cleanText.length; i++) {
    const textChar = cleanText[i];
    const keyChar = currentKey[i % currentKey.length];

    const textIndex = getCharIndex(textChar);
    const keyIndex = getCharIndex(keyChar);
    const decryptedIndex =
      (textIndex - keyIndex + RUSSIAN_ALPHABET.length) %
      RUSSIAN_ALPHABET.length;
    result += getCharByIndex(decryptedIndex);

    if ((i + 1) % currentKey.length === 0) {
      keyCycleCount++;
      currentKey = shiftKey(cleanKey, keyCycleCount);
    }
  }

  return result;
}

function visualizeVigenere(text, key) {
  const cleanText = filterRussianText(text);
  const cleanKey = filterRussianText(key);
  if (cleanText.length === 0 || cleanKey.length === 0) return "";

  const maxShow = Math.min(cleanText.length, 50);
  let html = "<h4>Процесс шифрования:</h4>";
  html += '<div style="overflow-x: auto;"><table style="font-size: 0.9rem;">';

  html +=
    '<tr><th style="padding: 8px; border: 1px solid #e2e8f0; background: #f7fafc;">Текст</th>';
  for (let i = 0; i < maxShow; i++) {
    html +=
      '<td style="padding: 8px; border: 1px solid #e2e8f0;">' +
      cleanText[i] +
      "</td>";
  }
  if (cleanText.length > maxShow) {
    html += '<td style="padding: 8px; border: 1px solid #e2e8f0;">...</td>';
  }
  html += "</tr>";

  html +=
    '<tr><th style="padding: 8px; border: 1px solid #e2e8f0; background: #f7fafc;">Ключ</th>';
  let currentKey = cleanKey;
  let keyCycleCount = 0;

  for (let i = 0; i < maxShow; i++) {
    const keyChar = currentKey[i % currentKey.length];
    //const isNewCycle = i > 0 && i % currentKey.length === 0;
    //const cellClass = isNewCycle ? 'class="highlight"' : "";
    html +=
      "<td " +
      //cellClass +
      ' style="padding: 8px; border: 1px solid #e2e8f0;">' +
      keyChar +
      "</td>";

    if ((i + 1) % currentKey.length === 0) {
      keyCycleCount++;
      currentKey = shiftKey(cleanKey, keyCycleCount);
    }
  }
  if (cleanText.length > maxShow) {
    html += '<td style="padding: 8px; border: 1px solid #e2e8f0;">...</td>';
  }
  html += "</tr>";

  const result = encryptVigenere(cleanText, cleanKey);
  html +=
    '<tr><th style="padding: 8px; border: 1px solid #e2e8f0; background: #f7fafc;">Результат</th>';
  for (let i = 0; i < maxShow; i++) {
    html +=
      '<td class="highlight" style="padding: 8px; border: 1px solid #e2e8f0;">' +
      result[i] +
      "</td>";
  }
  if (result.length > maxShow) {
    html += '<td style="padding: 8px; border: 1px solid #e2e8f0;">...</td>';
  }
  html += "</tr>";

  html += "</table></div>";

  if (cleanText.length > maxShow) {
    html +=
      '<p style="margin-top: 12px; color: #718096; font-size: 0.85rem;">Показаны первые ' +
      maxShow +
      " символов из " +
      cleanText.length +
      "</p>";
  }

  return html;
}

function handleEncryptVigenere() {
  const text = document.getElementById("vigText").value;
  const key = document.getElementById("vigKey").value;

  const errors = validateVigenereInput(text, key);
  if (errors.length > 0) {
    showError(errors.join("\n"));
    return;
  }

  const result = encryptVigenere(text, key);
  document.getElementById("vigResult").textContent = result;

  const visualization = visualizeVigenere(text, key);
  const vizEl = document.getElementById("vigVisualization");
  vizEl.innerHTML = visualization;
  vizEl.classList.add("active");
}

function handleDecryptVigenere() {
  const text = document.getElementById("vigText").value;
  const key = document.getElementById("vigKey").value;

  const errors = validateVigenereInput(text, key);
  if (errors.length > 0) {
    showError(errors.join("\n"));
    return;
  }

  const result = decryptVigenere(text, key);
  document.getElementById("vigResult").textContent = result;
  document.getElementById("vigVisualization").classList.remove("active");
}
