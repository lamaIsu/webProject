// View/js/calendar.js
(function initCalendar() {
  if (!document.body.classList.contains("home-page")) return;

  // ===== Elements =====
  const monthEl = document.getElementById("calMonth");
  const datesEl = document.getElementById("calendarDates");
  const prevBtn = document.getElementById("calPrev");
  const nextBtn = document.getElementById("calNext");

  const modal = document.getElementById("calModal");
  const modalTitle = document.getElementById("calModalTitle");
  const btnClose = document.getElementById("calModalClose");
  const btnCancel = document.getElementById("calCancelEvent");
  const btnSave = document.getElementById("calSaveEvent");

  const inputTitle = document.getElementById("calEventTitle");
  const inputNote = document.getElementById("calEventNote");
  const msgEl = document.getElementById("calModalMsg");

  const eventsListEl = document.getElementById("calEventsList");
  const clearBtn = document.getElementById("calClearAll");

  if (!monthEl || !datesEl || !prevBtn || !nextBtn || !modal || !eventsListEl) return;

  // ===== State =====
  let current = new Date();
  let selectedDateKey = null; // YYYY-MM-DD
  let allNotes = [];          // كل النوتات من المونجو
  let activeFilterDate = null; // إذا ضغطتي يوم: نخزن اليوم هنا

  // ===== Helpers =====
  const pad2 = (n) => String(n).padStart(2, "0");
  const toKey = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showMsg(text, ok = false) {
    if (!msgEl) return;
    msgEl.style.display = "block";
    msgEl.textContent = text;
    msgEl.style.background = ok ? "#f0fdf4" : "#fef2f2";
    msgEl.style.border = ok ? "1px solid #bbf7d0" : "1px solid #fecaca";
    msgEl.style.color = ok ? "#166534" : "#991b1b";
  }

  function hideMsg() {
    if (!msgEl) return;
    msgEl.style.display = "none";
    msgEl.textContent = "";
  }

  function openModal(dateKey) {
    selectedDateKey = dateKey;
    if (modalTitle) modalTitle.textContent = `Add Note (${dateKey})`;
    if (inputTitle) inputTitle.value = "";
    if (inputNote) inputNote.value = "";
    hideMsg();
    modal.style.display = "flex";
    inputTitle?.focus();
  }

  function closeModal() {
    modal.style.display = "none";
    selectedDateKey = null;
    hideMsg();
  }

  // ===== Calendar Render =====
  function renderCalendar() {
    const year = current.getFullYear();
    const month = current.getMonth();

    monthEl.textContent = current.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    datesEl.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // empty cells
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.className = "cal-empty";
      datesEl.appendChild(empty);
    }

    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cal-date";
      cell.textContent = d;

      const key = toKey(year, month, d);
      cell.dataset.date = key;

      // today highlight
      if (
        d === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      ) {
        cell.classList.add("today");
      }

      // filter highlight (إذا اخترتي يوم)
      if (activeFilterDate === key) {
        cell.classList.add("selected");
      }

      // click: فلترة + فتح مودال
      cell.addEventListener("click", () => {
        activeFilterDate = key;
        renderCalendar();          // عشان يحط كلاس selected
        renderEvents();            // يعرض نوتات اليوم
        openModal(key);            // يفتح إضافة نوت
      });

      datesEl.appendChild(cell);
    }
  }

  // ===== API =====
  async function loadAllNotes() {
    const userId = localStorage.getItem("userId") || "TEST";

    try {
      const res = await fetch(`/api/calendar-notes?userId=${encodeURIComponent(userId)}`, {
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      // يدعم شكلين: [{...}] أو {notes:[...]}
      if (Array.isArray(data)) allNotes = data;
      else if (Array.isArray(data.notes)) allNotes = data.notes;
      else allNotes = [];
    } catch (e) {
      console.error(e);
      allNotes = [];
    }
  }

  function renderEvents() {
    eventsListEl.innerHTML = "";

    let list = allNotes;

    // إذا فيه فلتر يوم
    if (activeFilterDate) {
      list = list.filter((n) => n.date === activeFilterDate);
    }

    if (!list.length) {
      eventsListEl.innerHTML = `<div class="cal-events-empty">No events</div>`;
      return;
    }

    // ترتيب حسب التاريخ
    const sorted = [...list].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

    for (const e of sorted) {
      const item = document.createElement("div");
      item.className = "cal-event-item";
      item.innerHTML = `
        <div class="cal-event-top">
          <strong class="cal-event-title">${escapeHtml(e.title || "Untitled")}</strong>
          <span class="cal-event-date">${escapeHtml(e.date || "")}</span>
        </div>
        ${e.note ? `<div class="cal-event-note">${escapeHtml(e.note)}</div>` : ""}
      `;
      eventsListEl.appendChild(item);
    }
  }

  async function saveNote() {
    if (!selectedDateKey) return;

    const userId = localStorage.getItem("userId") || "TEST";
    const title = (inputTitle?.value || "").trim();
    const note = (inputNote?.value || "").trim();

    if (!title) {
      showMsg("Title required", false);
      return;
    }

    try {
      const res = await fetch("/api/calendar-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          date: selectedDateKey,
          title,
          note,
          type: "note",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showMsg(data.message || "Server error", false);
        return;
      }

      showMsg("Saved ✅", true);

      await loadAllNotes();
      renderEvents();

      setTimeout(() => closeModal(), 350);
    } catch (e) {
      console.error(e);
      showMsg("Network error", false);
    }
  }

  async function clearAllNotes() {
    const userId = localStorage.getItem("userId") || "TEST";

    try {
      const res = await fetch(`/api/calendar-notes?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error(data);
        return;
      }

      activeFilterDate = null;
      await loadAllNotes();
      renderCalendar();
      renderEvents();
    } catch (e) {
      console.error(e);
    }
  }

  // ===== Events =====
  prevBtn.addEventListener("click", async () => {
    current.setMonth(current.getMonth() - 1);
    activeFilterDate = null; // لا تظل فلتره على يوم من شهر ثاني
    renderCalendar();
    renderEvents(); // يعرض كل شيء
  });

  nextBtn.addEventListener("click", async () => {
    current.setMonth(current.getMonth() + 1);
    activeFilterDate = null;
    renderCalendar();
    renderEvents();
  });

  btnClose?.addEventListener("click", closeModal);
  btnCancel?.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  btnSave?.addEventListener("click", saveNote);

  inputTitle?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveNote();
  });

  clearBtn?.addEventListener("click", clearAllNotes);

  // ===== Init =====
  (async function start() {
    renderCalendar();
    await loadAllNotes();
    renderEvents();
  })();
})();
