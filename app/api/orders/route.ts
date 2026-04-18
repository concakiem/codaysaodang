import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// ─── Cấu hình Google Sheets ───────────────────────────────────────────────────
// Điền vào .env.local:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL=...
//   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
//   GOOGLE_SHEET_ID=...  (lấy từ URL: spreadsheets/d/[ID]/edit)
// ─────────────────────────────────────────────────────────────────────────────

// Dùng tên không có dấu để tránh lỗi encoding với Google Sheets API
const SHEET_NAME = "Orders";

const HEADERS = [
  "STT",
  "Ho ten",
  "So dien thoai",
  "Dia chi",
  "So luong (cuon)",
  "Thanh tien (VND)",
  "Ghi chu",
  "Trang thai",
  "Thoi gian dat",
];

function getGoogleAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error(
      "Thieu bien moi truong GOOGLE_SERVICE_ACCOUNT_EMAIL hoac GOOGLE_PRIVATE_KEY"
    );
  }

  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

// Tự động tạo sheet tab nếu chưa tồn tại
async function ensureSheetExists(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string
) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = meta.data.sheets?.map((s) => s.properties?.title) ?? [];

  if (!existing.includes(SHEET_NAME)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
      },
    });
  }
}

// Ghi header nếu sheet còn trống
async function ensureHeader(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string
) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A1`,
  });

  const hasHeader = res.data.values?.[0]?.[0] === "STT";
  if (!hasHeader) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADERS] },
    });
  }
}

// Đếm số dòng để lấy STT tiếp theo
async function getNextSTT(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string
): Promise<number> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:A`,
  });
  const rowCount = res.data.values?.length ?? 1;
  return rowCount; // header = row 1, đơn đầu = STT 1 (rowCount=1 sau header)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, address, quantity, note } = body as {
      name: string;
      phone: string;
      address: string;
      quantity: number;
      note?: string;
    };

    if (!name?.trim() || !phone?.trim() || !address?.trim()) {
      return NextResponse.json({ error: "Thieu thong tin bat buoc" }, { status: 400 });
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Chua cau hinh GOOGLE_SHEET_ID" }, { status: 500 });
    }

    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    await ensureSheetExists(sheets, spreadsheetId);
    await ensureHeader(sheets, spreadsheetId);

    const qty = Math.max(1, Number(quantity) || 1);
    const total = qty * 55000;
    const stt = await getNextSTT(sheets, spreadsheetId);
    const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A:I`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[stt, name.trim(), phone.trim(), address.trim(), qty, total, note?.trim() || "", "Cho xac nhan", now]],
      },
    });

    return NextResponse.json({ success: true, orderId: stt });
  } catch (err) {
    console.error("[orders/POST]", err);
    const message = err instanceof Error ? err.message : "Loi khong xac dinh";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}