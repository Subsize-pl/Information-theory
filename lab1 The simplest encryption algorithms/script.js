const RUSSIAN_ALPHABET = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
const MAX_TEXT_LENGTH = 4096;

function filterRussianText(text) {
  let result = "";
  if (!text) return "";
  const upperText = text.toUpperCase();

  for (let i = 0; i < upperText.length; i++) {
    const char = upperText[i];
    if (RUSSIAN_ALPHABET.indexOf(char) !== -1) {
      result += char;
    }
  }

  return result;
}

function hasRussianLetters(text) {
  if (!text) return false;
  const upperText = text.toUpperCase();
  for (let i = 0; i < upperText.length; i++) {
    const char = upperText[i];
    if (RUSSIAN_ALPHABET.indexOf(char) !== -1) return true;
  }
  return false;
}

function getCharIndex(char) {
  return RUSSIAN_ALPHABET.indexOf(char);
}

function getCharByIndex(index) {
  const normalizedIndex =
    ((index % RUSSIAN_ALPHABET.length) + RUSSIAN_ALPHABET.length) %
    RUSSIAN_ALPHABET.length;
  return RUSSIAN_ALPHABET[normalizedIndex];
}

document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const targetId = tab.getAttribute("data-tab");

      tabs.forEach(function (t) {
        t.classList.remove("active");
      });

      tab.classList.add("active");

      const contents = document.querySelectorAll(".tab-content");
      contents.forEach(function (c) {
        c.classList.remove("active");
      });

      document.getElementById(targetId).classList.add("active");
    });
  });

  updateCharCount("railText", "railCharCount");
  updateCharCount("vigText", "vigCharCount");
});

function updateCharCount(textareaId, counterId) {
  const textarea = document.getElementById(textareaId);
  const counter = document.getElementById(counterId);
  if (!textarea || !counter) return;

  counter.textContent = textarea.value.length + " / " + MAX_TEXT_LENGTH;

  textarea.addEventListener("input", function () {
    counter.textContent = textarea.value.length + " / " + MAX_TEXT_LENGTH;
  });
}

function showError(message) {
  const modal = document.getElementById("errorModal");
  const messageEl = document.getElementById("errorMessage");

  if (!modal || !messageEl) {
    alert(message);
    return;
  }

  messageEl.textContent = message;
  modal.classList.add("active");
}

function closeModal() {
  const modal = document.getElementById("errorModal");
  if (modal) modal.classList.remove("active");
}

document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("errorModal");
  if (!modal) return;

  modal.addEventListener("click", function (e) {
    if (e.target.id === "errorModal") closeModal();
  });
});

function loadFile(textareaId) {
  const fileInputId = textareaId.replace(/Text$/, "FileInput");
  const fileInput = document.getElementById(fileInputId);

  if (!fileInput) {
    showError(
      "Внутренняя ошибка: не найден элемент для загрузки файла (" +
        fileInputId +
        ")",
    );
    return;
  }

  fileInput.value = "";

  fileInput.onchange = function () {
    const file = fileInput.files[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".txt")) {
      showError("Можно загружать только .txt файлы!");
      fileInput.value = "";
      return;
    }

    const MAX_FILE_BYTES = MAX_TEXT_LENGTH * 4;
    if (file.size > MAX_FILE_BYTES) {
      showError(
        "Файл слишком большой (" +
          Math.round(file.size / 1024) +
          " KB). Максимальный размер: " +
          Math.round(MAX_FILE_BYTES / 1024) +
          " KB",
      );
      fileInput.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      const content = e.target.result;

      if (content.length > MAX_TEXT_LENGTH) {
        showError(
          "Содержимое файла слишком большое (" +
            content.length +
            " символов). Максимум: " +
            MAX_TEXT_LENGTH +
            " символов",
        );
        fileInput.value = "";
        return;
      }

      const textarea = document.getElementById(textareaId);
      textarea.value = content;

      const event = new Event("input");
      textarea.dispatchEvent(event);
    };

    reader.onerror = function () {
      showError("Ошибка при чтении файла");
      fileInput.value = "";
    };

    reader.readAsText(file, "UTF-8");
  };

  fileInput.click();
}

function saveResult(resultId) {
  const resultEl = document.getElementById(resultId);
  if (!resultEl) return;

  const result = resultEl.textContent;
  if (!result || result.trim().length === 0) {
    showError("Нет результата для сохранения");
    return;
  }

  const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "encrypted_result.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
