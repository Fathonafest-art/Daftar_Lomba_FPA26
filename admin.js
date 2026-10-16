/* Portal Admin — versi 5 (baca dari Google Sheets) */

const PASSWORD_ADMIN = "ulayya01";

const API = "https://script.google.com/macros/s/AKfycbw-z9YIXP9kJ56afifZoK-4gYrztc1UeMKAUKeXv9Npo9tnewNZPiih9_mz7bWPT7MK/exec";

const TOKEN = "fathona-fest-2025-x9k2m";

const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const LABEL_BUKTI = {
  pembayaran: "Bukti Pembayaran",
  instagram: "Bukti Follow Instagram",
  youtube: "Bukti Subscribe YouTube",
  tiktok: "Bukti Follow TikTok",
};

let cacheData = [];
let filterCache = [];
const data = () => cacheData;

async function muatData() {
  const r = await fetch(`${API}?token=${encodeURIComponent(TOKEN)}`);
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "Gagal memuat data dari server");
  cacheData = j.data || [];
}

function tampil(masuk) {
  $("#login").hidden = masuk;
  $("#dash").hidden = !masuk;
  $("#logout").hidden = !masuk;
  if (masuk) render();
}

function terfilter() {
  const q = $("#cari").value.toLowerCase();
  const k = $("#filter").value;
  return data().filter((r) =>
    (!k || r.kelas === k) &&
    `${r.nama} ${r.sekolah} ${r.lomba} ${r.whatsapp}`.toLowerCase().includes(q)
  );
}

async function render() {
  try {
    await muatData();
  } catch (e) {
    alert("Gagal memuat data dari server: " + e.message);
    return;
  }

  const semua = data();
  const f = $("#filter");
  const pilih = f.value;
  f.innerHTML = '<option value="">Semua kelas/kategori</option>' +
    [...new Set(semua.map((r) => r.kelas))].sort().map((k) => `<option>${esc(k)}</option>`).join("");
  f.value = pilih;

  const rows = terfilter();
  filterCache = rows;
  $("#total").textContent = `${semua.length} peserta terdaftar`;

  $("#rows").innerHTML = rows.map((r, i) => {
    const jmlBukti = r.bukti ? Object.keys(r.bukti).length : 0;
    const tombolBukti = jmlBukti
      ? `<button class="alt mini" data-bukti-idx="${i}">Lihat Bukti (${jmlBukti})</button>
         <div id="bukti-${i}" hidden></div>`
      : `<span style="color:#889">Tidak ada</span>`;
    return `<tr>
      <td>${i + 1}</td>
      <td><b>${esc(r.nama)}</b></td>
      <td>${esc(r.kelas)}</td>
      <td>${esc(r.sekolah)}</td>
      <td>${esc(r.lomba)} (${esc(r.kategori)})</td>
      <td>${esc(r.whatsapp) || "—"}</td>
      <td>${esc(r.waktu)}</td>
      <td>${tombolBukti}</td>
    </tr>`;
  }).join("");

  $("#kosong").hidden = rows.length > 0;
  $("#kosong").textContent = semua.length
    ? "Tidak ada peserta yang cocok."
    : "Belum ada peserta terdaftar.";

  $("#rows").querySelectorAll("[data-bukti-idx]").forEach((btn) => {
    btn.addEventListener("click", () => toggleBukti(btn.dataset.buktiIdx));
  });
}

function toggleBukti(idx) {
  const box = document.getElementById(`bukti-${idx}`);
  if (!box) return;

  document.querySelectorAll("[id^='bukti-']").forEach((el) => {
    if (el !== box) el.hidden = true;
  });

  if (!box.hidden) { box.hidden = true; return; }

  const r = filterCache[idx];
  if (!r || !r.bukti) return;

  box.className = "bukti-box";
  box.innerHTML = Object.entries(r.bukti).map(([key, v]) => {
    const label = LABEL_BUKTI[key] || key;
    if (!v || !v.url) {
      return `<div class="bukti-item"><p>${esc(label)}</p>
        <span style="font-size:11px;color:#889">Tidak ada</span></div>`;
    }
    if (v.tipe === "application/pdf") {
      return `<div class="bukti-item pdf">
        <p>${esc(label)}</p>
        <a href="${v.url}" target="_blank" rel="noopener">📄 ${esc(v.nama || "Lihat PDF")}</a>
      </div>`;
    }
    const thumb = `https://drive.google.com/thumbnail?id=${v.id}&sz=w600`;
    return `<div class="bukti-item">
      <p>${esc(label)}</p>
      <a href="${v.url}" target="_blank" rel="noopener" title="Buka di tab baru">
        <img src="${thumb}" alt="${esc(label)}" loading="lazy" />
      </a>
      <a href="${v.url}" target="_blank" rel="noopener" style="display:block;margin-top:4px">Buka ukuran penuh ↗</a>
    </div>`;
  }).join("");

  box.hidden = false;
}

function eksporExcel() {
  const rows = terfilter();
  if (!rows.length) return alert("Belum ada data untuk diekspor.");
  const head = ["No", "Nama Peserta", "Kelas/Kategori", "Asal Sekolah", "Lomba", "Kategori Lomba", "WhatsApp", "Waktu Daftar", "Bukti"];
  const body = rows.map((r, i) => {
    const buktiRingkas = r.bukti
      ? Object.entries(r.bukti).map(([k, v]) => `${LABEL_BUKTI[k] || k}: ${v?.url || "-"}`).join(" | ")
      : "-";
    return [i + 1, r.nama, r.kelas, r.sekolah, r.lomba, r.kategori, r.whatsapp, r.waktu, buktiRingkas];
  });
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${body.map((r) => `<tr>${r.map((c) => `<td style="mso-number-format:'\\@'">${esc(c)}</td>`).join("")}</tr>`).join("")}</table></body></html>`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + html], { type: "application/vnd.ms-excel" }));
  a.download = "rekap-peserta-fathona.xls";
  a.click();
}

$("#login").addEventListener("submit", (e) => {
  e.preventDefault();
  if ($("#pw").value === PASSWORD_ADMIN) {
    sessionStorage.setItem("fathona_admin", "1");
    $("#err").hidden = true;
    $("#pw").value = "";
    tampil(true);
  } else {
    $("#err").hidden = false;
  }
});

$("#logout").onclick = () => {
  sessionStorage.removeItem("fathona_admin");
  tampil(false);
};
$("#cari").oninput = render;
$("#filter").onchange = render;
$("#excel").onclick = eksporExcel;
$("#hapus").onclick = () => {
  alert("Untuk menghapus data, buka Google Sheet langsung.");
};

tampil(sessionStorage.getItem("fathona_admin") === "1");