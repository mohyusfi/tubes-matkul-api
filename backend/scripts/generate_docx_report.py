"""
generate_docx_report.py
Skrip generator Laporan Akademik Project Based 1 - Rekayasa API (Kelompok 6)
Standar Akademik:
- Kertas A4, Margin 4-4-3-3 cm
- Times New Roman 12 pt, 1.5 Spasi Murni, Zero Space Before & After
- Teks Font Hitam Pekat (#000000)
- Tabel Akademik: Border All (0.5 pt hitam) & Tanpa Shading/Warna Latar (Zero Shading)
- Heading Berjenjang Native MS Word (Outline Level 0, 1, 2)
- Page Break Mutlak Antar-Bab
"""

import os
import sys
import docx
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_styled_document():
    doc = docx.Document()
    
    # Konfigurasi Halaman A4 & Margin 4-4-3-3 cm
    section = doc.sections[0]
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(4.0)
    section.left_margin = Cm(4.0)
    section.bottom_margin = Cm(3.0)
    section.right_margin = Cm(3.0)
    
    return doc

def set_para_spacing(p, line_spacing=1.5, before=0, after=0, keep_with_next=False):
    p.paragraph_format.line_spacing = line_spacing
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.space_after = Pt(after)
    if keep_with_next:
        p.paragraph_format.keep_with_next = True

def set_outline(p, level: int):
    pPr = p._element.get_or_add_pPr()
    for child in list(pPr):
        if child.tag.endswith('outlineLvl'):
            pPr.remove(child)
    outline = OxmlElement('w:outlineLvl')
    outline.set(qn('w:val'), str(level))
    pPr.append(outline)

def add_run(p, text, bold=False, italic=False, size_pt=12, color_rgb=(0,0,0)):
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(size_pt)
    r.bold = bold
    r.italic = italic
    r.font.color.rgb = RGBColor(*color_rgb)
    return r

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    try:
        p.style = doc.styles['Heading 1']
    except Exception:
        pass
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_para_spacing(p, line_spacing=1.5, before=0, after=0, keep_with_next=True)
    set_outline(p, 0)
    add_run(p, text, bold=True, size_pt=12)
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    try:
        p.style = doc.styles['Heading 2']
    except Exception:
        pass
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    set_para_spacing(p, line_spacing=1.5, before=0, after=0, keep_with_next=True)
    set_outline(p, 1)
    add_run(p, text, bold=True, size_pt=12)
    return p

def add_heading_3(doc, text):
    p = doc.add_paragraph()
    try:
        p.style = doc.styles['Heading 3']
    except Exception:
        pass
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    set_para_spacing(p, line_spacing=1.5, before=0, after=0, keep_with_next=True)
    set_outline(p, 2)
    add_run(p, text, bold=True, size_pt=12)
    return p

def add_body_paragraph(doc, text, first_line_indent_cm=1.27, italic=False):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    set_para_spacing(p, line_spacing=1.5, before=0, after=0)
    if first_line_indent_cm > 0:
        p.paragraph_format.first_line_indent = Cm(first_line_indent_cm)
    add_run(p, text, italic=italic, size_pt=12)
    return p

def add_list_item(doc, number_str, text, level=1):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    set_para_spacing(p, line_spacing=1.5, before=0, after=0)
    # Hanging indent 0.75 cm
    base_indent = 1.27 + (level - 1) * 0.75
    p.paragraph_format.left_indent = Cm(base_indent + 0.75)
    p.paragraph_format.first_line_indent = Cm(-0.75)
    add_run(p, f"{number_str}  ", bold=False, size_pt=12)
    add_run(p, text, bold=False, size_pt=12)
    return p

def add_code_block(doc, code_text):
    for line in code_text.strip().split("\n"):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        set_para_spacing(p, line_spacing=1.0, before=0, after=0)
        p.paragraph_format.left_indent = Cm(1.27)
        r = p.add_run(line)
        r.font.name = 'Consolas'
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(30, 30, 30)

def add_placeholder_image(doc, desc):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_para_spacing(p, line_spacing=1.5, before=0, after=0)
    r = p.add_run(f"[Sisipkan Tangkapan Layar: {desc}]")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(100, 100, 100)
    r.italic = True
    r.bold = True
    return p

def set_table_borders_and_no_shading(table):
    tblPr = table._tbl.tblPr
    for child in list(tblPr):
        if child.tag.endswith('tblBorders'):
            tblPr.remove(child)
            
    borders_xml = parse_xml(r'''
        <w:tblBorders xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders_xml)

def add_academic_table(doc, headers, rows, col_widths_cm=None):
    table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    set_table_borders_and_no_shading(table)
    
    # Header Row
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = ""
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_para_spacing(p, line_spacing=1.15, before=0, after=0)
        add_run(p, title, bold=True, size_pt=10)
        
    # Data Rows
    for r_idx, row_data in enumerate(rows):
        row_cells = table.rows[r_idx + 1].cells
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].text = ""
            p = row_cells[c_idx].paragraphs[0]
            if c_idx == 0 and len(str(val)) <= 4:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            set_para_spacing(p, line_spacing=1.15, before=0, after=0)
            add_run(p, str(val), size_pt=10)
            
    # Set Lebar Kolom
    if col_widths_cm and len(col_widths_cm) == len(headers):
        for row in table.rows:
            for idx, width in enumerate(col_widths_cm):
                row.cells[idx].width = Cm(width)
                
    # Jeda tipis setelah tabel
    p_after = doc.add_paragraph()
    set_para_spacing(p_after, line_spacing=1.0, before=0, after=0)
    return table

def build_report():
    doc = create_styled_document()
    
    # =========================================================================
    # HALAMAN SAMPUL (COVER PAGE)
    # =========================================================================
    for _ in range(3):
        p_b = doc.add_paragraph()
        set_para_spacing(p_b, line_spacing=1.0)
        
    p_cov_title = doc.add_paragraph()
    p_cov_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_para_spacing(p_cov_title, line_spacing=1.5)
    add_run(p_cov_title, "LAPORAN TUGAS BESAR: PROJECT BASED 1\n", bold=True, size_pt=14)
    add_run(p_cov_title, "PENGEMBANGAN APLIKASI BERBASIS API DARI HASIL PRAKTIKUM\n", bold=True, size_pt=12)
    add_run(p_cov_title, "MATA KULIAH: REKAYASA API\n\n", bold=False, size_pt=12)
    add_run(p_cov_title, "WATCHLIST ANIME TRACKER TERINTEGRASI KITSU PUBLIC API BERBASIS NATIVE NODE.JS DAN BASIS DATA SQLITE", bold=True, size_pt=12)
    
    for _ in range(3):
        p_b = doc.add_paragraph()
        set_para_spacing(p_b, line_spacing=1.0)
        
    p_cov_kel = doc.add_paragraph()
    p_cov_kel.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_para_spacing(p_cov_kel, line_spacing=1.5)
    add_run(p_cov_kel, "Disusun Oleh:\n", bold=False, size_pt=12)
    add_run(p_cov_kel, "KELOMPOK 6\n\n", bold=True, size_pt=12)
    
    # Tabel Anggota di Cover
    headers_anggota = ["No.", "Nama Anggota", "NIM / Stambuk", "Peran Utama"]
    rows_anggota = [
        ["1.", "Ilham Arifin", "F5512530109", "Server Architecture & Native HTTP Routing"],
        ["2.", "Akhsan Maulana R_", "F5512530114", "Public API Integration & Data Enrichment"],
        ["3.", "Nefaldi", "F5512520082", "Database Schema & Raw SQL Persistence"],
        ["4.", "ALIFIAS", "F5512520099", "Input Validation, Quality Assurance & Testing"],
        ["5.", "Moh. Yusfi L.", "F5512520089", "Interactive Console Client CLI & Documentation"]
    ]
    add_academic_table(doc, headers_anggota, rows_anggota, [1.0, 4.0, 3.0, 6.0])
    
    for _ in range(3):
        p_b = doc.add_paragraph()
        set_para_spacing(p_b, line_spacing=1.0)
        
    p_cov_inst = doc.add_paragraph()
    p_cov_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_para_spacing(p_cov_inst, line_spacing=1.5)
    add_run(p_cov_inst, "PROGRAM STUDI S1 TEKNIK INFORMATIKA\nJURUSAN TEKNOLOGI INFORMASI\nFAKULTAS TEKNIK\nUNIVERSITAS TADULAKO\n2026", bold=True, size_pt=12)
    
    doc.add_page_break()
    
    # =========================================================================
    # BAB I. PENDAHULUAN & DESKRIPSI APLIKASI
    # =========================================================================
    add_heading_1(doc, "BAB I\nPENDAHULUAN & DESKRIPSI APLIKASI")
    
    add_heading_2(doc, "1.1 Latar Belakang Masalah")
    add_body_paragraph(doc, "Industri animasi Jepang (anime) telah berkembang menjadi fenomena hiburan global dengan ribuan judul baru yang dirilis setiap musimnya. Penggemar anime modern sering kali menonton berbagai serial anime secara simultan di berbagai platform penyiaran digital. Kondisi ini menimbulkan permasalahan nyata berupa fragmentasi pencatatan tontonan (watchlist tracking). Pengguna kerap lupa nomor episode terakhir yang telah mereka selesaikan, bingung menentukan judul yang masih direncanakan untuk ditonton (plan-to-watch), atau tidak mengingat evaluasi/skor pribadi terhadap anime yang telah ditamatkan (completed).")
    add_body_paragraph(doc, "Pencatatan konvensional menggunakan aplikasi catatan teks sederhana (Notepad) atau lembar sebar (Spreadsheet) memiliki kelemahan mendasar: ketiadaan metadata resmi seperti sinopsis dan poster resmi, ketiadaan validasi batas episode, serta keharusan menginstal sistem manajemen basis data server yang berat. Proyek Watchlist Anime Tracker ini hadir untuk menyediakan RESTful API ringan berbasis modul murni Node.js dan SQLite lokal yang terintegrasi secara cerdas dengan katalog publik Kitsu API (Edge Specification / JSON:API).")
    
    add_heading_2(doc, "1.2 Target Pengguna & Manfaat Solusi")
    add_body_paragraph(doc, "Aplikasi ini dirancang untuk memberikan manfaat praktis kepada dua kelompok pengguna:")
    add_list_item(doc, "1.", "Penikmat Anime Aktif: Membantu mencatat daftar tontonan pribadi secara terorganisir, mengakses katalog resmi Kitsu API langsung dari aplikasi, dan memberikan skor pribadi berskala 1 hingga 10 beserta ulasan kustom.")
    add_list_item(doc, "2.", "Pengembang & Mahasiswa Rekayasa API: Menyediakan referensi arsitektur RESTful API yang bersih, aman, dan patuh standar menggunakan modul inti native bawaan runtime (node:http, node:sqlite) tanpa bergantung pada framework pihak ketiga seperti Express.js.")
    
    add_heading_2(doc, "1.3 Alur Kerja Sistem Ringkas")
    add_body_paragraph(doc, "Sistem beroperasi menggunakan pola komunikasi klien-server stateless berbasis HTTP/1.1:")
    add_list_item(doc, "a.", "Klien Konsol CLI (client.js) atau Postman mengirimkan permintaan HTTP terotentikasi Bearer Token JWT ke server Node.js pada port 3000.")
    add_list_item(doc, "b.", "Server Native Node.js (src/web.js) memproses permintaan, memvalidasi otorisasi pengguna, dan memeriksa ketersediaan cache memori.")
    add_list_item(doc, "c.", "Untuk data katalog anime, server memanggil Kitsu Public API secara asinkron dengan in-memory cache TTL 300 detik.")
    add_list_item(doc, "d.", "Untuk data tontonan pengguna, server melakukan persistensi lokal ke berkas basis data SQLite (watchlist.db) menggunakan prepared statements yang aman dari serangan SQL Injection.")
    
    doc.add_page_break()
    
    # =========================================================================
    # BAB II. RANCANGAN API
    # =========================================================================
    add_heading_1(doc, "BAB II\nRANCANGAN API (API DESIGN)")
    
    add_heading_2(doc, "2.1 Resource Utama yang Dikelola")
    add_body_paragraph(doc, "Aplikasi mengelola dua resource utama dalam relasi basis data:")
    add_list_item(doc, "1.", "User (users): Merepresentasikan akun pengguna terdaftar untuk mengisolasi koleksi watchlist tiap akun secara independen.")
    add_list_item(doc, "2.", "WatchlistItem (watchlist_items): Merepresentasikan anime yang disimpan ke daftar pantau pribadi pengguna terintegrasi metadata publik.")
    
    add_heading_2(doc, "2.2 Skema Data & Aturan Validasi")
    add_heading_3(doc, "Tabel 2.1 Skema Data users")
    headers_user = ["Field", "Tipe Data", "Constraint", "Validasi & Keterangan"]
    rows_user = [
        ["id", "INTEGER", "PRIMARY KEY AUTOINCREMENT", "ID unik akun pengguna."],
        ["username", "TEXT", "UNIQUE, NOT NULL", "Nama pengguna unik, minimal 3 karakter."],
        ["password_hash", "TEXT", "NOT NULL", "Hash bcrypt kata sandi (min 6 karakter saat registrasi)."],
        ["created_at", "DATETIME", "DEFAULT CURRENT_TIMESTAMP", "Waktu registrasi akun."]
    ]
    add_academic_table(doc, headers_user, rows_user, [2.5, 2.5, 4.0, 5.0])
    
    add_heading_3(doc, "Tabel 2.2 Skema Data watchlist_items")
    headers_wl = ["Field", "Tipe Data", "Constraint", "Validasi & Keterangan"]
    rows_wl = [
        ["id", "INTEGER", "PRIMARY KEY AUTOINCREMENT", "ID unik item watchlist."],
        ["user_id", "INTEGER", "FOREIGN KEY, NOT NULL", "Relasi ke users(id) ON DELETE CASCADE."],
        ["mal_id", "INTEGER", "NOT NULL", "ID resmi anime di MyAnimeList."],
        ["item_type", "TEXT", "CHECK('anime', 'manga')", "Wajib bernilai 'anime'."],
        ["title", "TEXT", "NOT NULL", "Judul resmi anime, string non-kosong."],
        ["image_url", "TEXT", "NULLABLE", "Tautan URL poster anime dari CDN."],
        ["status", "TEXT", "CHECK enum, NOT NULL", "plan_to_watch, watching, completed, dropped."],
        ["progress", "INTEGER", "NOT NULL, DEFAULT 0", "Episode tontonan, 0 <= progress <= total_units."],
        ["total_units", "INTEGER", "DEFAULT 0", "Total episode resmi anime."],
        ["score", "INTEGER", "CHECK(score >= 0 AND <= 10)", "Penilaian subjektif skala 0-10."],
        ["notes", "TEXT", "NULLABLE", "Catatan ulasan pribadi pengguna."],
        ["created_at", "DATETIME", "DEFAULT CURRENT_TIMESTAMP", "Waktu penambahan item."],
        ["updated_at", "DATETIME", "DEFAULT CURRENT_TIMESTAMP", "Waktu terakhir pembaruan item."]
    ]
    add_academic_table(doc, headers_wl, rows_wl, [2.5, 2.0, 3.5, 6.0])
    
    add_heading_2(doc, "2.3 Tabel Endpoint Lengkap RESTful API")
    headers_ep = ["Metode", "Pola Endpoint", "Autentikasi", "Deskripsi", "Status Code"]
    rows_ep = [
        ["GET", "/", "Tidak", "Pemeriksaan status server & rute.", "200 OK"],
        ["POST", "/api/auth/register", "Tidak", "Registrasi akun pengguna baru.", "201, 400, 409"],
        ["POST", "/api/auth/login", "Tidak", "Login dan penerbitan token JWT.", "200, 400, 401"],
        ["GET", "/api/public/anime", "Tidak", "Pencarian katalog anime Kitsu API.", "200, 429"],
        ["GET", "/api/public/anime/:id", "Tidak", "Detail anime berdasarkan ID Kitsu.", "200, 404"],
        ["GET", "/api/watchlist", "Bearer Token", "Mengambil seluruh watchlist user.", "200, 401"],
        ["GET", "/api/watchlist/:id", "Bearer Token", "Mengambil 1 item watchlist user.", "200, 401, 404"],
        ["POST", "/api/watchlist", "Bearer Token", "Menambah anime ke watchlist.", "201, 400, 401, 409"],
        ["PATCH", "/api/watchlist/:id", "Bearer Token", "Update progress, status, skor.", "200, 400, 401, 404"],
        ["DELETE", "/api/watchlist/:id", "Bearer Token", "Menghapus item dari watchlist.", "200, 401, 404"]
    ]
    add_academic_table(doc, headers_ep, rows_ep, [1.5, 3.5, 2.5, 4.5, 2.0])
    
    doc.add_page_break()
    
    # =========================================================================
    # BAB III. INTEGRASI PUBLIC API
    # =========================================================================
    add_heading_1(doc, "BAB III\nINTEGRASI PUBLIC API")
    
    add_heading_2(doc, "3.1 Alasan Pemilihan Kitsu Public API (Edge Specification)")
    add_body_paragraph(doc, "Kitsu API dipilih karena merupakan penyedia katalog anime dan manga global modern yang mengimplementasikan spesifikasi resmi JSON:API v1.0, memiliki infrastruktur CDN global yang andal dan bebas dari pemblokiran ISP di Indonesia, serta menyediakan metadata lengkap tanpa kewajiban API key berbayar.")
    
    add_heading_2(doc, "3.2 Field Data Spesifik yang Diekstraksi")
    add_body_paragraph(doc, "Dari respon mentah Kitsu API, server mengekstraksi field-field esensial:")
    add_list_item(doc, "1.", "id / mal_id: ID unik numerik anime pada database Kitsu.")
    add_list_item(doc, "2.", "title & title_japanese: Judul internasional dan judul aksara asli Jepang.")
    add_list_item(doc, "3.", "images.jpg.image_url: URL poster anime resmi.")
    add_list_item(doc, "4.", "episodes & type: Jumlah total episode resmi dan format penayangan (TV/Movie/OVA).")
    add_list_item(doc, "5.", "score & synopsis: Rata-rata skor global dan sinopsis ringkas jalan cerita.")
    
    add_heading_2(doc, "3.3 Mekanisme Pengayaan Data (Data Enrichment)")
    add_body_paragraph(doc, "Aplikasi tidak sekadar meneruskan data secara mentah (proxy forwarding). Server mengimplementasikan pola Data Enrichment: saat pengguna menambahkan anime ke daftar pantau, server memadukan metadata resmi dari Kitsu API dengan data personal pengguna (status tontonan, nomor episode yang diselesaikan, skor pribadi, dan catatan ulasan), lalu menyimpannya sebagai satu kesatuan entitas relasional di SQLite lokal.")
    add_body_paragraph(doc, "Untuk mencegah terlampauinya batas laju permintaan (rate limit 3 req/s), server menerapkan in-memory cache dengan Time-To-Live (TTL) 300 detik serta mekanisme mock fallback offline otomatis jika koneksi internet terputus.")
    
    doc.add_page_break()
    
    # =========================================================================
    # BAB IV. KODE PROGRAM LENGKAP & PENJELASAN
    # =========================================================================
    add_heading_1(doc, "BAB IV\nKODE PROGRAM LENGKAP & PENJELASAN TEKNIS")
    
    add_heading_2(doc, "4.1 Entry Point Server (src/server.js)")
    add_body_paragraph(doc, "Menampilkan banner identitas Kelompok 6 ke konsol saat runtime diaktifkan, memuat konfigurasi lingkungan .env secara native, dan menginisialisasi basis data SQLite:")
    add_code_block(doc, """import http from 'node:http';
import web from './web.js';
import { initDatabase } from './db/database.js';
import logger from './services/logger.js';

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch (e) {}
}

initDatabase();

const PORT = parseInt(process.env.PORT || '3000', 10);
const server = http.createServer(web);

server.listen(PORT, () => {
  logger.info('SERVER', `Server berjalan pada http://localhost:${PORT}`);
  logger.info('SERVER', `
==============================================================
 PROJECT BASED 1 - REKAYASA API (KELOMPOK 6)
 Judul: Watchlist Anime Tracker Terintegrasi Kitsu Public API
 --------------------------------------------------------------
 Anggota Tim:
 1. Ilham Arifin       (F5512530109)
 2. Akhsan Maulana R_  (F5512530114)
 3. Nefaldi            (F5512520082)
 4. ALIFIAS            (F5512520099)
 5. Moh. Yusfi L.      (F5512520089)
==============================================================`);
});""")

    add_heading_2(doc, "4.2 Web Dispatcher & Mini-Router (src/web.js)")
    add_body_paragraph(doc, "Berfungsi sebagai router murni tanpa Express yang mengurai stream Buffer body dan mencocokkan URL regex:")
    add_code_block(doc, """export async function web(req, res) {
  const startTime = Date.now();
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  req.pathname = url.pathname;
  req.query = Object.fromEntries(url.searchParams.entries());
  req.params = {};

  res.json = (statusCode, data) => {
    if (res.writableEnded) return;
    const duration = Date.now() - startTime;
    logger.info('HTTP', `${req.method} ${url.pathname} ${statusCode} - ${duration}ms`);
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
  };

  try {
    if (handleCors(req, res)) return;
    await parseJsonBody(req);

    for (const route of routes) {
      if (route.method === req.method) {
        const match = url.pathname.match(route.pattern);
        if (match) {
          req.params = match.groups || {};
          return await route.handler(req, res);
        }
      }
    }
    return res.json(404, { success: false, message: 'Endpoint tidak ditemukan.' });
  } catch (err) {
    return res.json(err.statusCode || 500, { success: false, message: err.message });
  }
}""")

    add_heading_2(doc, "4.3 Interactive Console Client CLI (client.js)")
    add_body_paragraph(doc, "Aplikasi terminal interaktif berbasis perulangan menu (CRUD & Search Kitsu API) dengan penanganan error gracefully:")
    add_code_block(doc, """async function main() {
  banner();
  await checkServerAvailability();
  const rl = readline.createInterface({ input, output });

  try {
    const auth = await authenticate(rl);
    let running = true;
    while (running) {
      console.log(`
MENU UTAMA WATCHLIST TRACKER
[1] Cari Anime di Katalog Publik (Kitsu API)
[2] Lihat Daftar Watchlist Saya
[3] Tambah Anime ke Watchlist
[4] Perbarui Progres / Status Tontonan
[5] Hapus Anime dari Watchlist
[6] Keluar Aplikasi`);

      const choice = (await rl.question('Pilih menu (1-6): ')).trim();
      switch (choice) {
        case '1': await handleSearchAnime(rl); break;
        case '2': await handleViewWatchlist(auth.token); break;
        case '3': await handleAddWatchlist(rl, auth.token); break;
        case '4': await handleUpdateWatchlist(rl, auth.token); break;
        case '5': await handleDeleteWatchlist(rl, auth.token); break;
        case '6': running = false; break;
        default: console.log('[!] Pilihan tidak valid.');
      }
      if (running) await rl.question('Tekan Enter untuk kembali...');
    }
  } finally { rl.close(); }
}""")

    doc.add_page_break()
    
    # =========================================================================
    # BAB V. HASIL PENGUJIAN API
    # =========================================================================
    add_heading_1(doc, "BAB V\nHASIL PENGUJIAN API (TESTING MATRIX)")
    
    add_heading_2(doc, "5.1 Matriks Skenario Pengujian Endpoint Lengkap")
    headers_test = ["No.", "Endpoint & Metode", "Skenario Uji", "Expected", "Hasil Respon", "Status"]
    rows_test = [
        ["1.", "GET /", "Health check sistem online", "200 OK", "status: 'online'", "Lolos"],
        ["2.", "GET /invalid-path", "Rute fiktif tidak terdaftar", "404 Not Found", "Endpoint tidak ditemukan", "Lolos"],
        ["3.", "POST /api/auth/register", "Registrasi user valid", "201 Created", "userId: 1, user terdaftar", "Lolos"],
        ["4.", "POST /api/auth/register", "Validasi password < 6 char", "400 Bad Request", "Password minimal 6 karakter", "Lolos"],
        ["5.", "POST /api/auth/register", "Registrasi username duplikat", "409 Conflict", "Username sudah digunakan", "Lolos"],
        ["6.", "POST /api/auth/login", "Login kredensial benar", "200 OK", "Token JWT berhasil terbit", "Lolos"],
        ["7.", "POST /api/auth/login", "Login kata sandi keliru", "401 Unauthorized", "Username/password salah", "Lolos"],
        ["8.", "GET /api/public/anime", "Pencarian query ?q=naruto", "200 OK", "Ditemukan data katalog anime", "Lolos"],
        ["9.", "GET /api/public/anime/:id", "Detail anime MAL ID 20", "200 OK", "title: 'Naruto', episodes: 220", "Lolos"],
        ["10.", "POST /api/watchlist", "Tambah item valid + token", "201 Created", "Item tersimpan di database", "Lolos"],
        ["11.", "POST /api/watchlist", "Tambah item tanpa token", "401 Unauthorized", "Akses ditolak: token kosong", "Lolos"],
        ["12.", "POST /api/watchlist", "Field wajib title/mal_id kosong", "400 Bad Request", "Field wajib belum lengkap", "Lolos"],
        ["13.", "POST /api/watchlist", "Duplikasi anime pada user sama", "409 Conflict", "Item sudah ada di watchlist", "Lolos"],
        ["14.", "GET /api/watchlist", "Ambil semua watchlist user", "200 OK", "Array watchlist milik user", "Lolos"],
        ["15.", "GET /api/watchlist/:id", "Ambil detail item ID valid", "200 OK", "Data 1 item watchlist", "Lolos"],
        ["16.", "GET /api/watchlist/:id", "Ambil item ID 999999", "404 Not Found", "Item tidak ditemukan", "Lolos"],
        ["17.", "PATCH /api/watchlist/:id", "Update progres & status valid", "200 OK", "Progres episode terbarui", "Lolos"],
        ["18.", "PATCH /api/watchlist/:id", "Update status invalid", "400 Bad Request", "Nilai status tidak valid", "Lolos"],
        ["19.", "DELETE /api/watchlist/:id", "Hapus item ID valid", "200 OK", "Item berhasil dihapus", "Lolos"],
        ["20.", "DELETE /api/watchlist/:id", "Hapus item ID fiktif", "404 Not Found", "Item tidak ditemukan", "Lolos"]
    ]
    add_academic_table(doc, headers_test, rows_test, [1.0, 3.5, 3.5, 2.0, 3.0, 1.0])
    
    add_heading_2(doc, "5.2 Bukti Pengujian Antarmuka Postman & Klien")
    add_placeholder_image(doc, "Postman: Pengujian Endpoint GET / (Status 200 OK)")
    add_placeholder_image(doc, "Postman: Pengujian Endpoint POST /api/auth/register (201 Created & 409 Conflict)")
    add_placeholder_image(doc, "Postman: Pengujian Endpoint POST /api/auth/login (Menerbitkan Token JWT)")
    add_placeholder_image(doc, "Postman: Pengujian Endpoint GET /api/public/anime?q=naruto (Katalog Publik)")
    add_placeholder_image(doc, "Postman: Pengujian Endpoint POST /api/watchlist (201 Created dengan Data Enrichment)")
    add_placeholder_image(doc, "Postman: Pengujian Endpoint GET /api/watchlist (Menampilkan Koleksi User)")
    add_placeholder_image(doc, "Postman: Pengujian Endpoint PATCH & DELETE /api/watchlist/:id (200 OK & 404 Not Found)")
    add_placeholder_image(doc, "Terminal: Eksekusi Aplikasi client.js Menampilkan Menu Interaktif dan CRUD Watchlist")
    
    doc.add_page_break()
    
    # =========================================================================
    # BAB VI. TABEL PEMBAGIAN TUGAS
    # =========================================================================
    add_heading_1(doc, "BAB VI\nTABEL PEMBAGIAN TUGAS KELOMPOK")
    add_body_paragraph(doc, "Seluruh anggota Kelompok 6 berpartisipasi aktif dalam perancangan, pengkodean, pengujian, dan penyusunan laporan akademik dengan pembagian tugas yang merata:")
    
    headers_tugas = ["No.", "Nama Anggota", "NIM", "Peran Spesifik", "Komponen / Modul yang Dikerjakan", "Beban"]
    rows_tugas = [
        ["1.", "Ilham Arifin", "F5512530109", "Server Architecture", "Arsitektur native node:http, regex router src/web.js, entrypoint src/server.js.", "20%"],
        ["2.", "Akhsan Maulana R_", "F5512530114", "Public API Integration", "Client Kitsu API src/services/kitsu.js, in-memory cache, data enrichment.", "20%"],
        ["3.", "Nefaldi", "F5512520082", "Database Persistence", "Skema SQLite src/db/database.js, prepared statements raw SQL, foreign keys.", "20%"],
        ["4.", "ALIFIAS", "F5512520099", "Validation & Testing", "Validasi stream bodyParser.js, test suite test/api.test.js, pengujian Postman.", "20%"],
        ["5.", "Moh. Yusfi L.", "F5512520089", "Client CLI & Docs", "Aplikasi terminal interaktif client.js, error handling, penyusunan laporan Word/MD.", "20%"]
    ]
    add_academic_table(doc, headers_tugas, rows_tugas, [1.0, 3.0, 2.0, 3.0, 4.0, 1.0])
    
    doc.add_page_break()
    
    # =========================================================================
    # BAB VII. LAMPIRAN & KEPATUHAN ETIKA AKADEMIK
    # =========================================================================
    add_heading_1(doc, "BAB VII\nLAMPIRAN & KEPATUHAN ETIKA AKADEMIK")
    
    add_heading_2(doc, "7.1 Deklarasi Penyelesaian 5 Online Course Wajib")
    add_body_paragraph(doc, "Setiap anggota tim telah menuntaskan 5 kursus pemrograman wajib:")
    add_list_item(doc, "1.", "Learn JavaScript Fundamentals")
    add_list_item(doc, "2.", "Learn Intermediate JavaScript")
    add_list_item(doc, "3.", "Learn JavaScript Best Practices")
    add_list_item(doc, "4.", "Learn Node.js")
    add_list_item(doc, "5.", "Learn MongoDB")
    
    headers_cert = ["No.", "Nama Anggota Tim", "NIM / Stambuk", "Status 5 Kursus", "Verifikasi Nama"]
    rows_cert = [
        ["1.", "Ilham Arifin", "F5512530109", "Lengkap (5/5 Kursus)", "Terverifikasi Asli"],
        ["2.", "Akhsan Maulana R_", "F5512530114", "Lengkap (5/5 Kursus)", "Terverifikasi Asli"],
        ["3.", "Nefaldi", "F5512520082", "Lengkap (5/5 Kursus)", "Terverifikasi Asli"],
        ["4.", "ALIFIAS", "F5512520099", "Lengkap (5/5 Kursus)", "Terverifikasi Asli"],
        ["5.", "Moh. Yusfi L.", "F5512520089", "Lengkap (5/5 Kursus)", "Terverifikasi Asli"]
    ]
    add_academic_table(doc, headers_cert, rows_cert, [1.0, 4.0, 3.0, 3.5, 2.5])
    
    add_placeholder_image(doc, "Sertifikat 5 Kursus Online: Ilham Arifin")
    add_placeholder_image(doc, "Sertifikat 5 Kursus Online: Akhsan Maulana R_")
    add_placeholder_image(doc, "Sertifikat 5 Kursus Online: Nefaldi")
    add_placeholder_image(doc, "Sertifikat 5 Kursus Online: ALIFIAS")
    add_placeholder_image(doc, "Sertifikat 5 Kursus Online: Moh. Yusfi L.")
    
    doc.add_page_break()
    
    # =========================================================================
    # DEKLARASI PENGGUNAAN GENERATIVE AI
    # =========================================================================
    add_heading_1(doc, "DEKLARASI PENGGUNAAN GENERATIVE AI")
    add_body_paragraph(doc, "Kami yang bertanda tangan di bawah ini, seluruh anggota Kelompok 6:")
    add_list_item(doc, "1.", "Ilham Arifin (F5512530109)")
    add_list_item(doc, "2.", "Akhsan Maulana R_ (F5512530114)")
    add_list_item(doc, "3.", "Nefaldi (F5512520082)")
    add_list_item(doc, "4.", "ALIFIAS (F5512520099)")
    add_list_item(doc, "5.", "Moh. Yusfi L. (F5512520089)")
    
    add_body_paragraph(doc, "Menyatakan secara sadar, jujur, dan bertanggung jawab atas transparansi penggunaan teknologi Generative Artificial Intelligence (Generative AI) dalam pengerjaan Project Based 1 Rekayasa API:")
    add_list_item(doc, "a.", "Alat AI yang Digunakan: Anthropic Claude 3.7 Sonnet dan Google Gemini 2.5 Pro melalui antarmuka asisten rekayasa kode.")
    add_list_item(doc, "b.", "Tujuan Penggunaan: Membantu perancangan struktur dokumen laporan akademik, refactoring pembacaan Buffer chunks pada body parser native, dan pembuatan skrip otomasi pengujian.")
    add_list_item(doc, "c.", "Pemahaman Penuh & Integritas: Seluruh arsitektur kode, integrasi Public API Kitsu, penanganan CORS, dan query SQLite dipahami secara mendalam oleh seluruh anggota tim. Kami siap mempertanggungjawabkan dan mendemonstrasikan setiap baris kode pada ujian lisan.")
    
    p_sign = doc.add_paragraph()
    set_para_spacing(p_sign, line_spacing=1.5)
    add_run(p_sign, "\nPalu, 28 Oktober 2026\n\nTim Pengembang Kelompok 6:\n", bold=False, size_pt=12)
    add_run(p_sign, "(Tanda Tangan Seluruh Anggota)\n", italic=True, size_pt=11, color_rgb=(100,100,100))
    add_run(p_sign, "1. Ilham Arifin (F5512530109)\n2. Akhsan Maulana R_ (F5512530114)\n3. Nefaldi (F5512520082)\n4. ALIFIAS (F5512520099)\n5. Moh. Yusfi L. (F5512520089)", size_pt=12)
    
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "Laporan_PB1_Kelompok_6.docx")
    output_path = os.path.abspath(output_path)
    doc.save(output_path)
    print(f"[SUCCESS] Laporan Word akademik berhasil dibuat di: {output_path}")

if __name__ == '__main__':
    build_report()
