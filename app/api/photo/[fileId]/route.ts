import { NextRequest, NextResponse } from "next/server";
import { getFile, fileDownloadUrl } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// Streams a Telegram photo by file_id. Telegram file paths expire (~1h), so we
// resolve the path via getFile on every request and never persist it.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;

  try {
    const file = await getFile(fileId);
    if (!file.file_path) {
      return NextResponse.json({ error: "file path unavailable" }, { status: 404 });
    }

    const upstream = await fetch(fileDownloadUrl(file.file_path));
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "failed to fetch file" }, { status: 502 });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 502 },
    );
  }
}
