const ALL_COLUMNS = [
  "ID RUTE", "NAMA RUTE", "TIPE RUTE", "ID SALES", "NAMA SALES",
  "ID PELANGGAN", "NAMA PELANGGAN", "SENIN", "SELASA", "RABU",
  "KAMIS", "JUMAT", "SABTU", "MINGGU", "MINGGU_1", "MINGGU_2",
  "MINGGU_3", "MINGGU_4"
];

const DAY_COLUMNS = [
  "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU",
  "MINGGU_1", "MINGGU_2", "MINGGU_3", "MINGGU_4"
];

const EXACT_ROUTE_MAP: Record<string, string> = {
  "CAN MIX JUGS": "CAN", "CAN MIX SPS": "CAN", "BDR AFH": "TKO", 
  "BDR MT": "TKO", "BDR AHS": "TKO", "BDR AHS & IOD": "TKO", 
  "BDR IOD": "TKO", "BDR WS": "TKO", "BDR SO & WS": "TKO", 
  "PRESELLER SPS": "TKO", "PRESELLER JUGS": "TKO", "MOTORIS": "TKO", 
  "CRL AFH & IOD": "CRL", "CRL GT-I": "CRL"
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type" // Tambahkan ini
};

const safe = (v: any) => v !== undefined && v !== null ? String(v).trim() : "";
const upper = (v: any) => safe(v).toUpperCase();

export default {
  async fetch(request: Request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });

    try {
      // Sekarang kita menerima format JSON ringan dari Frontend
      const payload = await request.json() as any;
      const data = payload.data;

      if (!data || !Array.isArray(data)) {
        return new Response(JSON.stringify({ error: "Format data tidak valid." }), { status: 400, headers: cors });
      }

      const errors: any[] = [];
      const seenCust = new Set<string>();
      const salesMap = new Map<string, string>();
      const idSalesRegex = /^\d+-[A-Za-z0-9]+$/;
      
      let mappedRow = 2; 

      for (const row of data) {
        const originRow = row._originRow; // Ambil baris asli dari frontend
        const norm = row;

        // Aturan 1: Kosong
        ALL_COLUMNS.forEach(col => {
          if (col !== "TIPE RUTE" && !norm[col]) {
            errors.push({ row: originRow, mappedRow, col, msg: "Cell kosong (Wajib diisi)" });
          }
        });

        // Aturan 2: Format & Konsistensi ID
        if (norm["ID SALES"] && !idSalesRegex.test(norm["ID SALES"])) {
          errors.push({ row: originRow, mappedRow, col: "ID SALES", msg: "Format salah (Wajib Angka-Strip-Alfanumerik)" });
        }
        if (norm["NAMA SALES"] && norm["ID SALES"]) {
          if (salesMap.has(norm["NAMA SALES"]) && salesMap.get(norm["NAMA SALES"]) !== norm["ID SALES"]) {
            errors.push({ row: originRow, mappedRow, col: "NAMA SALES", msg: "Inkonsisten: ID berbeda untuk Sales yang sama" });
          } else {
            salesMap.set(norm["NAMA SALES"], norm["ID SALES"]);
          }
        }
        if (norm["ID RUTE"] && norm["ID SALES"] && norm["ID RUTE"] !== norm["ID SALES"]) {
          errors.push({ row: originRow, mappedRow, col: "ID RUTE", msg: "ID RUTE harus sama dengan ID SALES" });
        }

        // Aturan 3: Master Rute (Auto-fill Tipe Rute)
        if (norm["NAMA RUTE"]) {
          const master = EXACT_ROUTE_MAP[upper(norm["NAMA RUTE"])];
          if (!master) {
            errors.push({ row: originRow, mappedRow, col: "NAMA RUTE", msg: "Nama Rute tidak terdaftar" });
          } else {
            norm["TIPE RUTE"] = master; 
          }
        }

        // Aturan 4: Jadwal 1 atau 0
        DAY_COLUMNS.forEach(col => {
          if (norm[col] !== "" && norm[col] !== "0" && norm[col] !== "1") {
            errors.push({ row: originRow, mappedRow, col, msg: "Jadwal wajib mutlak angka 1 atau 0" });
          }
        });

        // Aturan 5: Duplikat Outlet
        if (norm["ID PELANGGAN"]) {
          if (seenCust.has(norm["ID PELANGGAN"])) {
            errors.push({ row: originRow, mappedRow, col: "ID PELANGGAN", msg: "Duplikat Outlet" });
          } else {
            seenCust.add(norm["ID PELANGGAN"]);
          }
        }
        mappedRow++;
      }

      return new Response(JSON.stringify({
        status: errors.length ? "FAIL" : "PASS",
        errors,
        extractedData: data // Kembalikan data yang sudah di-auto-fill tipe rutenya
      }), { status: 200, headers: { "Content-Type": "application/json", ...cors } });

    } catch (e: any) {
      return new Response(JSON.stringify({ error: "Gagal memproses validasi di server." }), { status: 500, headers: cors });
    }
  }
};