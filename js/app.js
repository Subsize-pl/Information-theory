const CHUNK_SIZE = 8192;

const MAX_ENCRYPT_SIZE = 512 * 1024 * 1024;

const state = {
  enc: { file: null, fileName: "", result: null }, // result: string of nums
  dec: { file: null, fileName: "", result: null }, // result: Uint8Array
};

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(target).classList.add("active");
    });
  });
});

function parseBigInt(str) {
  const s = str.trim();
  if (!/^\d+$/.test(s)) return null;
  return BigInt(s);
}

// Return object { p, q, b, n } (BigInt) or null(error).
function validateAndShowParams(prefix) {
  const pRaw = document.getElementById(`${prefix}-p`).value;
  const qRaw = document.getElementById(`${prefix}-q`).value;
  const bRaw = document.getElementById(`${prefix}-b`).value;

  let p = null,
    q = null,
    b = null,
    n = null;

  const pVal = parseBigInt(pRaw);
  const pOk = pVal !== null && pVal > 3n && isPrime(pVal) && pVal % 4n === 3n;
  setParamState(
    prefix,
    "p",
    pRaw,
    pOk,
    pOk ? "Правильно" : "Неправильно: простое, = 3 mod 4",
  );
  if (pOk) p = pVal;

  const qVal = parseBigInt(qRaw);
  const qOk =
    qVal !== null &&
    qVal > 3n &&
    isPrime(qVal) &&
    qVal % 4n === 3n &&
    qVal !== p;
  setParamState(
    prefix,
    "q",
    qRaw,
    qOk,
    qOk ? "Правильно" : "Неправильно: простое, = 3 mod 4, != p",
  );
  if (qOk) q = qVal;

  const nEl = document.getElementById(`${prefix}-n`);
  if (p && q) {
    n = p * q;
    const nOk = n > 256n;
    nEl.textContent = `n = p * q = ${n}${nOk ? "" : "   Неправильно: должно быть > 256"}`;
    nEl.className = `n-display ${nOk ? "valid" : "invalid"}`;
    if (!nOk) n = null;
  } else {
    nEl.textContent = "n = p * q = ...";
    nEl.className = "n-display";
  }

  const bVal = parseBigInt(bRaw);
  const bOk = bVal !== null && n !== null && bVal > 0n && bVal < n;
  setParamState(
    prefix,
    "b",
    bRaw,
    bOk,
    bOk ? "Правильно" : `Неправильно: целое, 0 < b < n`,
  );
  if (bOk) b = bVal;

  if (!p || !q || !b || !n) return null;
  return { p, q, b, n };
}

function setParamState(prefix, param, rawValue, isOk, hintText) {
  const input = document.getElementById(`${prefix}-${param}`);
  const hint = document.getElementById(`${prefix}-${param}-hint`);

  input.className = rawValue ? (isOk ? "valid" : "invalid") : "";
  hint.textContent = rawValue ? hintText : "";
  hint.className = `param-hint ${rawValue ? (isOk ? "ok" : "err") : ""}`;
}

document.addEventListener("DOMContentLoaded", () => {
  ["enc", "dec"].forEach((prefix) => {
    ["p", "q", "b"].forEach((param) => {
      document
        .getElementById(`${prefix}-${param}`)
        .addEventListener("input", () => validateAndShowParams(prefix));
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  ["enc", "dec"].forEach((prefix) => {
    const zone = document.getElementById(`${prefix}-dropZone`);
    const input = document.getElementById(`${prefix}-fileInput`);

    input.addEventListener("change", () => {
      if (input.files[0]) applyFile(prefix, input.files[0]);
    });

    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("drag-over");
    });

    zone.addEventListener("dragleave", () =>
      zone.classList.remove("drag-over"),
    );

    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("drag-over");
      if (e.dataTransfer.files[0]) applyFile(prefix, e.dataTransfer.files[0]);
    });
  });
});

function applyFile(prefix, file) {
  state[prefix].file = file;
  state[prefix].fileName = file.name;
  state[prefix].result = null;

  document.getElementById(`${prefix}-fileName`).textContent = file.name;
  document.getElementById(`${prefix}-fileSize`).textContent = formatBytes(
    file.size,
  );
  document.getElementById(`${prefix}-dropPrompt`).style.display = "none";
  document.getElementById(`${prefix}-fileInfo`).classList.add("visible");
  document.getElementById(`${prefix}-dropZone`).classList.add("has-file");
  document
    .getElementById(`${prefix}-resultsSection`)
    .classList.remove("visible");
  document.getElementById(`${prefix}-saveBtn`).style.display = "none";
}

async function processEncrypt() {
  const params = validateAndShowParams("enc");
  if (!params) {
    showError("Исправьте параметры p, q, b перед шифрованием.");
    return;
  }

  if (!state.enc.file) {
    showError("Выберите файл для шифрования.");
    return;
  }

  if (state.enc.file.size > MAX_ENCRYPT_SIZE) {
    showError(
      `Файл слишком большой (${formatBytes(state.enc.file.size)}).\nМаксимум: ${formatBytes(MAX_ENCRYPT_SIZE)}.`,
    );
    return;
  }

  const { p, q, b, n } = params;

  const btn = document.getElementById("enc-processBtn");
  btn.disabled = true;
  btn.innerHTML = "<span>⏳</span> Шифрование…";
  showProgress("enc", 0);

  const buffer = await state.enc.file.arrayBuffer();
  const inputBytes = new Uint8Array(buffer);
  const total = inputBytes.length;

  const encHead = []; // first SHOW_FIRST values
  const encTail = []; // sliding window last SHOW_LAST values
  const parts = []; // all strs of nums (for output file)

  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const end = Math.min(i + CHUNK_SIZE, total);

    for (let j = i; j < end; j++) {
      const cipherVal = rabinEncryptByte(inputBytes[j], b, n).toString();
      parts.push(cipherVal);

      if (encHead.length < SHOW_FIRST) encHead.push(cipherVal);
    }

    showProgress("enc", Math.round((end / total) * 100));
    await yieldToBrowser();
  }

  const tailArr = parts.slice(-SHOW_LAST);

  state.enc.result = parts.join(" ");

  renderDecimalDisplay("enc-display", encHead, tailArr, total);
  document.getElementById("enc-statBytes").textContent = formatNumber(total);
  document.getElementById("enc-resultsSection").classList.add("visible");
  document.getElementById("enc-saveBtn").style.display = "";

  hideProgress("enc");
  btn.disabled = false;
  btn.innerHTML = "<span>🔒</span> Зашифровать";
}

async function processDecrypt() {
  const params = validateAndShowParams("dec");
  if (!params) {
    showError("Исправьте параметры p, q, b перед расшифрованием.");
    return;
  }

  if (!state.dec.file) {
    showError("Выберите зашифрованный файл.");
    return;
  }

  const { p, q, b, n } = params;

  const btn = document.getElementById("dec-processBtn");
  btn.disabled = true;
  btn.innerHTML = "<span>⏳</span> Расшифрование…";
  showProgress("dec", 0);

  const text = await state.dec.file.text();
  const tokens = text
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  const total = tokens.length;

  if (total === 0) {
    showError("Файл пуст или не содержит чисел.");
    btn.disabled = false;
    btn.innerHTML = "<span>🔓</span> Расшифровать";
    hideProgress("dec");
    return;
  }

  const output = new Uint8Array(total);
  const decHead = [];
  let failed = false;

  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const end = Math.min(i + CHUNK_SIZE, total);

    for (let j = i; j < end; j++) {
      const c = parseBigInt(tokens[j]);

      if (c === null) {
        showError(`Неверный формат числа на позиции ${j + 1}: «${tokens[j]}»`);
        failed = true;
        break;
      }

      const m = rabinDecryptValue(c, p, q, b, n);

      if (m === null) {
        showError(
          `Не удалось однозначно расшифровать значение ${c} (позиция ${j + 1}).\n` +
            `Проверьте правильность параметров p, q, b.`,
        );
        failed = true;
        break;
      }

      output[j] = m;
      if (decHead.length < SHOW_FIRST) decHead.push(m.toString());
    }

    if (failed) break;
    showProgress("dec", Math.round((end / total) * 100));
    await yieldToBrowser();
  }

  if (failed) {
    btn.disabled = false;
    btn.innerHTML = "<span>🔓</span> Расшифровать";
    hideProgress("dec");
    return;
  }

  state.dec.result = output;

  const tailArr = Array.from(output.slice(-SHOW_LAST)).map(String);
  renderDecimalDisplay("dec-display", decHead, tailArr, total, "dec-badge");
  document.getElementById("dec-statCount").textContent = formatNumber(total);
  document.getElementById("dec-statSize").textContent = formatBytes(total);
  document.getElementById("dec-resultsSection").classList.add("visible");
  document.getElementById("dec-saveBtn").style.display = "";

  hideProgress("dec");
  btn.disabled = false;
  btn.innerHTML = "<span>🔓</span> Расшифровать";
}

async function saveEncrypted() {
  if (!state.enc.result) {
    showError("Нет результата для сохранения.");
    return;
  }

  const name = "encrypted_" + state.enc.fileName + ".txt";
  const blob = new Blob([state.enc.result], {
    type: "text/plain;charset=utf-8",
  });
  await saveBlob(blob, name);
}

async function saveDecrypted() {
  if (!state.dec.result) {
    showError("Нет результата для сохранения.");
    return;
  }

  let name = state.dec.fileName;
  if (name.startsWith("encrypted_")) name = name.slice("encrypted_".length);
  if (name.endsWith(".txt")) name = name.slice(0, -4);
  name = "decrypted_" + name;

  const blob = new Blob([state.dec.result]);
  await saveBlob(blob, name);
}

async function saveBlob(blob, suggestedName) {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch {
      /* user closes dialogue */
    }
  }

  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: suggestedName,
  });
  a.click();
  URL.revokeObjectURL(url);
}
