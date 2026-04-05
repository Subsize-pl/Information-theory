const MAX_FILE_BYTES = 15 * 1024 * 1024 * 1024; // 15 ГБ
const CHUNK_SIZE = 4 * 1024 * 1024; // 4 МБ

let selectedFile = null; // File class object
let originalFileName = "";
let processedBlob = null; // Blob class object - binary container in browser memory

document.addEventListener("DOMContentLoaded", () => {
  const seedInput = document.getElementById("seedInput");
  const seedCounter = document.getElementById("seedCounter");

  seedInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^01]/g, ""); // g - global

    const len = this.value.length;
    seedCounter.textContent = `${len} / ${REGISTER_SIZE}`;

    if (len === REGISTER_SIZE) {
      this.classList.remove("invalid");
      this.classList.add("valid");
      seedCounter.classList.add("valid");
    } else {
      this.classList.remove("valid");
      this.classList.add("invalid");
      seedCounter.classList.remove("valid");
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");

  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) applyFile(fileInput.files[0]);
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    if (e.dataTransfer.files[0]) applyFile(e.dataTransfer.files[0]);
  });
});

function applyFile(file) {
  selectedFile = file;
  originalFileName = file.name;

  document.getElementById("fileName").textContent = file.name;
  document.getElementById("fileSize").textContent = formatBytes(file.size);
  document.getElementById("dropPrompt").style.display = "none";
  document.getElementById("fileInfo").classList.add("visible");
  document.getElementById("dropZone").classList.add("has-file");

  resetResults();
}

function resetResults() {
  processedBlob = null;
  document.getElementById("resultsSection").classList.remove("visible");
  document.getElementById("saveBtn").style.display = "none";
}

async function processFile() {
  const seedStr = document.getElementById("seedInput").value;

  if (seedStr.length !== REGISTER_SIZE) {
    showError(
      `Начальное состояние должно содержать ровно ${REGISTER_SIZE} бит.\n` +
        `Сейчас введено: ${seedStr.length} бит.`,
    );
    return;
  }

  //   if (/^0+$/.test(seedStr)) {
  //     showError(
  //       "Начальное состояние не может быть нулевым — " +
  //         "регистр с нулевым состоянием генерирует только нули " +
  //         "и не обеспечивает шифрование.",
  //     );
  //     return;
  //   }

  if (!selectedFile) {
    showError("Выберите файл для обработки.");
    return;
  }

  if (selectedFile.size > MAX_FILE_BYTES) {
    showError(`Файл слишком большой (${formatBytes(selectedFile.size)}).`);
    return;
  }

  const btn = document.getElementById("processBtn");
  btn.disabled = true;
  btn.innerHTML = "<span>⏳</span> Обработка…";
  showProgress(0);

  const lfsr = new LFSR(seedStr);
  const fileSize = selectedFile.size;
  const outChunks = [];

  const head = { orig: [], key: [], res: [] };
  const tail = { orig: [], key: [], res: [] };

  for (let offset = 0; offset < fileSize; offset += CHUNK_SIZE) {
    const sliceEnd = Math.min(offset + CHUNK_SIZE, fileSize);
    const chunkBlob = selectedFile.slice(offset, sliceEnd); // new Blob object references selectedFile
    const buffer = await chunkBlob.arrayBuffer(); // Blob -> bytes block
    const inChunk = new Uint8Array(buffer); // <- buffer bytes interpretation (without deep copy)
    const keyChunk = new Uint8Array(inChunk.length); // new ArrayBuffer + Uint8Array: [0] * inChunk.length
    const outChunk = new Uint8Array(inChunk.length);

    for (let i = 0; i < inChunk.length; i++) {
      const k = lfsr.nextByte();
      keyChunk[i] = k;
      outChunk[i] = inChunk[i] ^ k;

      if (head.orig.length < SHOW_FIRST) {
        head.orig.push(inChunk[i]);
        head.key.push(k);
        head.res.push(outChunk[i]);
      }
    }

    updateTail(tail.orig, inChunk);
    updateTail(tail.key, keyChunk);
    updateTail(tail.res, outChunk);

    outChunks.push(new Blob([outChunk]));

    showProgress(Math.round((sliceEnd / fileSize) * 100));
    await yieldToBrowser(); // let browser to redraw progress bar
  }

  processedBlob = new Blob(outChunks);

  renderBinaryDisplay(
    "origDisplay",
    { head: head.orig, tail: tail.orig, total: fileSize },
    "origBadge",
  );
  renderBinaryDisplay(
    "keyDisplay",
    { head: head.key, tail: tail.key, total: fileSize },
    "keyBadge",
  );
  renderBinaryDisplay(
    "resDisplay",
    { head: head.res, tail: tail.res, total: fileSize },
    "resBadge",
  );

  document.getElementById("statBytes").textContent = formatNumber(fileSize);
  document.getElementById("statBits").textContent = formatNumber(fileSize * 8);

  hideProgress();
  document.getElementById("resultsSection").classList.add("visible");
  document.getElementById("saveBtn").style.display = "";

  btn.disabled = false;
  btn.innerHTML = "<span>⚙️</span> Зашифровать / Расшифровать";
}

/**
 * @param {number[]} buffer — current tail-buffer (will be modified in-place)
 * @param {Uint8Array} chunk  — new proccessed block
 */
function updateTail(buffer, chunk) {
  if (chunk.length >= SHOW_LAST) {
    buffer.length = 0;
    for (let i = chunk.length - SHOW_LAST; i < chunk.length; i++) {
      buffer.push(chunk[i]);
    }
  } else {
    for (let i = 0; i < chunk.length; i++) {
      buffer.push(chunk[i]);
    }
    if (buffer.length > SHOW_LAST) {
      buffer.splice(0, buffer.length - SHOW_LAST); // delete excess bytes
    }
  }
}

function yieldToBrowser() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function saveResult() {
  if (!processedBlob) {
    showError("Нет результата для сохранения. Сначала обработайте файл.");
    return;
  }

  const baseName = originalFileName.replace(/^(encrypted_|decrypted_)/, "");
  const prefix = originalFileName.startsWith("encrypted_")
    ? "decrypted_"
    : "encrypted_";
  const newName = prefix + baseName;

  // File System Access API
  if (window.showSaveFilePicker) {
    try {
      // file access object
      const handle = await window.showSaveFilePicker({
        suggestedName: newName,
      });
      const writable = await handle.createWritable();
      await writable.write(processedBlob);
      await writable.close();
      return;
    } catch {
      // some logic :)
    }
  }

  const url = URL.createObjectURL(processedBlob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: newName,
  });
  a.click();
  URL.revokeObjectURL(url);
}
