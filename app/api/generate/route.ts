import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import JSZip from "jszip";
import { parse } from "csv-parse/sync";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("csv") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
  }

  const text = await file.text();

  let records: { id: string; number: string }[];
  try {
    records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    return NextResponse.json({ error: "Failed to parse CSV" }, { status: 400 });
  }

  if (!records.length || !("id" in records[0]) || !("number" in records[0])) {
    return NextResponse.json(
      { error: 'CSV must have "id" and "number" columns' },
      { status: 400 }
    );
  }

  if (records.length > 1000) {
    return NextResponse.json(
      { error: `CSV exceeds 1,000 row limit (got ${records.length} rows)` },
      { status: 400 }
    );
  }

  const zip = new JSZip();

  await Promise.all(
    records.map(async (row) => {
      const id = String(row.id).trim();
      const number = String(row.number).trim();
      if (!id || !number) return;

      const buffer = await QRCode.toBuffer(number, {
        type: "png",
        width: 300,
        margin: 2,
        errorCorrectionLevel: "M",
      });

      zip.file(`${id}.png`, buffer);
    })
  );

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="qrcodes.zip"',
    },
  });
}
