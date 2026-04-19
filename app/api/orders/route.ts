import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

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

/**
 * Vercel lưu env vars dưới dạng string thuần — dấu xuống dòng thật trong
 * private key bị encode thành literal "\n" (2 ký tự) hoặc "\\n" (escaped).
 * Hàm này chuẩn hóa về dạng PEM hợp lệ bất kể Vercel encode kiểu nào.
 */
function parsePrivateKey(raw: string): string {
  // Bước 1: bỏ dấu nháy đôi bao ngoài nếu có (một số người paste nguyên cả "...")
  let key = raw.trim().replace(/^["']|["']$/g, "");

  // Bước 2: chuyển literal \n (2 ký tự: backslash + n) → newline thật
  // Phải dùng global replace vì có thể xuất hiện nhiều lần
  key = key.replace(/\\n/g, "\n");

  // Bước 3: nếu Vercel encode thêm một lần nữa (\\\\n → \\n → \n)
  // replace lại cho chắc
  if (key.includes("\\n")) {
    key = key.replace(/\\n/g, "\n");
  }

  // Bước 4: đảm bảo header/footer PEM đứng trên dòng riêng
  key = key
    .replace(/-----BEGIN PRIVATE KEY-----\s*/g, "-----BEGIN PRIVATE KEY-----\n")
    .replace(/\s*-----END PRIVATE KEY-----/g, "\n-----END PRIVATE KEY-----");

  // Bước 5: loại bỏ khoảng trắng thừa ở đầu/cuối mỗi dòng base64
  key = key
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  // Bước 6: thêm newline cuối cùng (Node crypto yêu cầu)
  if (!key.endsWith("\n")) key += "\n";

  return key;
}

function getGoogleAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_PRIVATE_KEY ?? "";

  if (!email) {
    throw new Error("Thieu GOOGLE_SERVICE_ACCOUNT_EMAIL");
  }
  if (!rawKey) {
    throw new Error("Thieu GOOGLE_PRIVATE_KEY");
  }

  const privateKey = parsePrivateKey(rawKey);

  // Kiểm tra nhanh định dạng PEM
  if (
    !privateKey.includes("-----BEGIN PRIVATE KEY-----") ||
    !privateKey.includes("-----END PRIVATE KEY-----")
  ) {
    throw new Error(
      "GOOGLE_PRIVATE_KEY sai dinh dang — phai co BEGIN/END PRIVATE KEY"
    );
  }

  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

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

async function getNextSTT(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string
): Promise<number> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:A`,
  });
  const rowCount = res.data.values?.length ?? 1;
  return rowCount;
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
      return NextResponse.json(
        { error: "Thieu thong tin bat buoc" },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Chua cau hinh GOOGLE_SHEET_ID" },
        { status: 500 }
      );
    }

    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    await ensureSheetExists(sheets, spreadsheetId);
    await ensureHeader(sheets, spreadsheetId);

    const qty = Math.max(1, Number(quantity) || 1);
    const total = qty * 55000;
    const stt = await getNextSTT(sheets, spreadsheetId);
    const now = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A:I`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            stt,
            name.trim(),
            phone.trim(),
            address.trim(),
            qty,
            total,
            note?.trim() || "",
            "Cho xac nhan",
            now,
          ],
        ],
      },
    });

    return NextResponse.json({ success: true, orderId: stt });
  } catch (err) {
    console.error("[orders/POST]", err);
    const message =
      err instanceof Error ? err.message : "Loi khong xac dinh";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
