/* ============================================================
   Fathona Performing Festival — script.js
   Versi 4: kirim ke Google Sheets via Apps Script
   ============================================================ */

const API = "https://script.google.com/macros/s/AKfycbw-z9YIXP9kJ56afifZoK-4gYrztc1UeMKAUKeXv9Npo9tnewNZPiih9_mz7bWPT7MK/exec";

const NOMOR_WA_PANITIA = "";

const KELAS = [
  "<4 tahun", "TK",
  "Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6",
  "Kelas 7", "Kelas 8", "Kelas 9",
  "Guru",
];

const LOMBA = {
  "<4 tahun": ["Membaca Surah Al-Fatihah", "Menyusun Puzzle", "Mengancing Baju"],
  TK: ["Fashion Show", "Sambung Ayat", "Solo Singing", "Menyusun Piramida Gelas"],
  "SD 1-2": ["Solo Singing", "Sambung Ayat", "Fashion Show", "Mewarnai", "FUTSAL SD"],
  "SD 3-4": ["Sambung Ayat", "Da'i dan Da'iyah", "Membaca Puisi", "Ranking 1", "FUTSAL SD"],
  "SD 5-6": ["Tilawah", "Membaca Puisi", "Storytelling", "Olimpiade Math", "Olimpiade Sains", "Cerdas Cermat", "FUTSAL SD"],
  SMP: ["Speech", "Tilawah", "Olimpiade Math", "Olimpiade Sains", "Cerdas Cermat", "Membaca Puisi", "FUTSAL SMP"],
  GURU: ["Solo Singing", "Video Pembelajaran Kreatif"],
};

const BUKTI = [
  { key: "pembayaran", label: "Bukti Pembayaran", hint: "Sertakan keterangan lomba yang diikuti" },
  { key: "instagram", label: "Bukti Follow Instagram", hint: "@SIT_Fathona_Palembang" },
  { key: "youtube", label: "Bukti Subscribe YouTube", hint: "SIT Fathona Palembang" },
  { key: "tiktok", label: "Bukti Follow TikTok", hint: "SIT Fathona Palembang" },
];

const MAKS_MB = 5;

function kategori(kelas) {
  if (kelas === "<4 tahun" || kelas === "TK") return kelas;
  if (kelas === "Guru") return "GURU";
  const n = Number(kelas.replace("Kelas ", ""));
  if (n <= 2) return "SD 1-2";
  if (n <= 4) return "SD 3-4";
  if (n <= 6) return "SD 5-6";
  return "SMP";
}

function labelKelas(kelas) {
  return kelas === "<4 tahun" ? "Usia di bawah 4 tahun" : kelas;
}

const state = {
  step: 0,
  nama: "",
  sekolah: "",
  whatsapp: "",
  kelas: "",
  lomba: "",
  files: {},
};

const $ = (sel) => document.querySelector(sel);
const el = {
  steps: [...document.querySelectorAll(".step")],
  panels: [...document.querySelectorAll(".panel")],
  error: $("#error"),
  back: $("#btn-back"),
  next: $("#btn-next"),
  formView: $("#form-view"),
  doneView: $("#done-view"),
  kelasSelect: $("#kelas-select"),
  kelasTampil: $("#kelas-tampil"),
  gridLomba: $("#grid-lomba"),
  lombaBox: $("#lomba-box"),
  lombaTag: $("#lomba-tag"),
  buktiList: $("#bukti-list"),
  nama: $("#nama"),
  sekolah: $("#sekolah"),
  whatsapp: $("#whatsapp"),
  doneNama: $("#done-nama"),
  doneLomba: $("#done-lomba"),
  download: $("#btn-download"),
  wa: $("#btn-wa"),
  reset: $("#btn-reset"),
};

function renderSteps() {
  el.steps.forEach((li, i) => {
    li.classList.toggle("active", i === state.step);
    li.classList.toggle("done", i < state.step);
    li.querySelector(".dot").textContent = i < state.step ? "✓" : String(i + 1);
  });
  el.panels.forEach((p, i) => p.classList.toggle("show", i === state.step));
  el.back.hidden = state.step === 0;
  el.next.textContent = state.step < 2 ? "Lanjut" : "Kirim Pendaftaran";
}

function showError(msg) {
  el.error.textContent = msg;
  el.error.hidden = !msg;
}

function renderKelasSelect() {
  el.kelasSelect.innerHTML = '<option value="">Pilih kelas/kategori</option>';
  KELAS.forEach((k) => {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = labelKelas(k);
    el.kelasSelect.appendChild(opt);
  });
  el.kelasSelect.value = state.kelas;
}

function renderLomba() {
  if (!state.kelas) {
    el.lombaBox.hidden = true;
    return;
  }
  const kat = kategori(state.kelas);
  el.lombaBox.hidden = false;
  el.lombaTag.textContent = kat;
  el.kelasTampil.textContent = labelKelas(state.kelas);
  el.gridLomba.innerHTML = "";
  (LOMBA[kat] || []).forEach((l) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "opt" + (state.lomba === l ? " sel" : "");
    b.setAttribute("aria-pressed", state.lomba === l ? "true" : "false");
    const span = document.createElement("span");
    span.textContent = l;
    const star = document.createElement("span");
    star.textContent = state.lomba === l ? "★" : "☆";
    b.append(span, star);
    b.addEventListener("click", () => {
      state.lomba = l;
      renderLomba();
      showError("");
    });
    el.gridLomba.appendChild(b);
  });
}

function renderBukti() {
  el.buktiList.innerHTML = "";
  BUKTI.forEach((b) => {
    const f = state.files[b.key];
    const label = document.createElement("label");
    label.className = "bukti" + (f ? " filled" : "");

    const icon = document.createElement("span");
    icon.className = "bukti-icon";
    icon.textContent = f ? "✓" : "↑";

    const body = document.createElement("span");
    body.className = "bukti-body";
    const title = document.createElement("p");
    title.className = "bukti-title";
    title.textContent = b.label;
    const hint = document.createElement("p");
    hint.className = "bukti-hint";
    hint.textContent = f ? `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)` : b.hint;
    body.append(title, hint);

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";
    input.hidden = true;
    input.addEventListener("change", () => {
      const picked = input.files && input.files[0];
      if (!picked) return;
      if (picked.size > MAKS_MB * 1024 * 1024) {
        showError(`${b.label} melebihi ${MAKS_MB}MB`);
        return;
      }
      state.files[b.key] = picked;
      showError("");
      renderBukti();
    });

    label.append(icon, body, input);
    el.buktiList.appendChild(label);
  });
}

function next() {
  showError("");
  if (state.step === 0) {
    state.nama = el.nama.value.trim();
    state.sekolah = el.sekolah.value.trim();
    state.whatsapp = el.whatsapp.value.trim();
    state.kelas = el.kelasSelect.value;
    if (!state.nama) return showError("Nama peserta wajib diisi");
    if (!state.kelas) return showError("Pilih kelas/kategori terlebih dahulu");
    if (!state.sekolah) return showError("Asal sekolah wajib diisi");
    if (!/^[0-9+ ]{8,20}$/.test(state.whatsapp)) return showError("Nomor WhatsApp tidak valid");
  }
  if (state.step === 1 && (!state.kelas || !state.lomba)) {
    return showError("Pilih kelas dan lomba terlebih dahulu");
  }
  state.step += 1;
  renderSteps();
  if (state.step === 1) renderLomba();
  if (state.step === 2) renderBukti();
}

function back() {
  showError("");
  state.step -= 1;
  renderSteps();
  if (state.step === 0) el.kelasSelect.value = state.kelas;
  if (state.step === 1) renderLomba();
}

function fileKeDataURL(file) {
  return new Promise((resolve, reject) => {
    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = () => resolve({
        nama: file.name,
        tipe: file.type,
        data: reader.result,
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const maxW = 800;
      const skala = Math.min(1, maxW / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * skala);
      canvas.height = Math.round(img.height * skala);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve({
        nama: file.name,
        tipe: "image/jpeg",
        data: canvas.toDataURL("image/jpeg", 0.7),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = () => resolve({ nama: file.name, tipe: file.type, data: reader.result });
      reader.readAsDataURL(file);
    };
    img.src = url;
  });
}

function ringkasan() {
  const kat = kategori(state.kelas);
  const bukti = BUKTI.map((b) => {
    const f = state.files[b.key];
    return `  - ${b.label}: ${f ? f.name : "(tidak ada)"}`;
  }).join("\n");
  return [
    "PENDAFTARAN LOMBA FATHONA PERFORMING FESTIVAL",
    "SIT Fathona Palembang",
    "===================================",
    `Nama Peserta : ${state.nama}`,
    `Kelas/Kategori: ${labelKelas(state.kelas)} (${kat})`,
    `Asal Sekolah: ${state.sekolah}`,
    `WhatsApp    : ${state.whatsapp}`,
    `Lomba       : ${state.lomba}`,
    "",
    "Bukti yang dilampirkan:",
    bukti,
    "",
    `Dicetak     : ${new Date().toLocaleString("id-ID")}`,
  ].join("\n");
}

async function submit() {
  showError("");

  for (const b of BUKTI) {
    const f = state.files[b.key];
    if (!f) return showError(`${b.label} belum diunggah`);
    if (f.size > MAKS_MB * 1024 * 1024) return showError(`${b.label} melebihi ${MAKS_MB}MB`);
  }

  el.next.disabled = true;
  el.next.textContent = "Mengirim…";

  try {
    const buktiData = {};
    for (const b of BUKTI) {
      buktiData[b.key] = await fileKeDataURL(state.files[b.key]);
    }

    const kat = kategori(state.kelas);

    const payload = {
      nama: state.nama,
      kelas: state.kelas,
      kategori: kat,
      sekolah: state.sekolah,
      lomba: state.lomba,
      whatsapp: state.whatsapp || "",
      bukti: buktiData,
    };

    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const hasil = await res.json();
    if (!hasil.ok) throw new Error(hasil.error || "Server menolak data");

    const teks = ringkasan();
    const blob = new Blob([teks], { type: "text/plain;charset=utf-8" });
    el.download.href = URL.createObjectURL(blob);
    el.download.download = `pendaftaran-${state.nama.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;

    if (NOMOR_WA_PANITIA) {
      el.wa.hidden = false;
      el.wa.href = `https://wa.me/${NOMOR_WA_PANITIA.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(teks)}`;
    }

    el.doneNama.textContent = state.nama;
    el.doneLomba.textContent = `${state.lomba} (${kat})`;
    el.formView.hidden = true;
    el.doneView.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error(err);
    showError("Gagal mengirim: " + err.message + ". Coba lagi ya.");
  } finally {
    el.next.disabled = false;
    el.next.textContent = state.step < 2 ? "Lanjut" : "Kirim Pendaftaran";
  }
}

function reset() {
  state.step = 0;
  state.nama = state.sekolah = state.whatsapp = state.kelas = state.lomba = "";
  state.files = {};
  el.nama.value = el.sekolah.value = el.whatsapp.value = "";
  el.lombaBox.hidden = true;
  el.doneView.hidden = true;
  el.formView.hidden = false;
  showError("");
  renderKelasSelect();
  renderSteps();
}

el.next.addEventListener("click", () => (state.step < 2 ? next() : submit()));
el.back.addEventListener("click", back);
el.reset.addEventListener("click", reset);

el.kelasSelect.addEventListener("change", () => {
  state.kelas = el.kelasSelect.value;
  state.lomba = "";
  showError("");
});

[el.nama, el.sekolah, el.whatsapp].forEach((i) =>
  i.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      next();
    }
  })
);

renderKelasSelect();
renderSteps();