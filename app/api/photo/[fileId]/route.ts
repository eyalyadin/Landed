import { NextRequest } from "next/server";
import { getFile, fileDownloadUrl } from "@/lib/telegram";
import { corsPreflight, jsonWithCors, responseWithCors } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

// Streams a Telegram photo by file_id. Telegram file paths expire (~1h), so we
// resolve the path via getFile on every request and never persist it.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;

  try {
    const file = await getFile(fileId);
    if (!file.file_path) {
      return jsonWithCors(req, { error: "file path unavailable" }, { status: 404 });
    }

    const upstream = await fetch(fileDownloadUrl(file.file_path));
    if (!upstream.ok || !upstream.body) {
      return jsonWithCors(req, { error: "failed to fetch file" }, { status: 502 });
    }

    return responseWithCors(req, new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    }));
  } catch (err) {
    return jsonWithCors(
      req,
      { error: (err as Error).message },
      { status: 502 },
    );
  }
}
