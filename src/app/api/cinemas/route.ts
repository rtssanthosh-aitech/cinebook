import { NextResponse } from "next/server";
import { memoryDb } from "@/services/dataStore";

export async function GET() {
  try {
    const result = memoryDb.cinemas.map((c) => {
      const auds = memoryDb.auditoriums.filter((a) => a.cinemaId === c.id);
      return {
        ...c,
        auditoriumsCount: auds.length,
        screenTypes: Array.from(new Set(auds.map((a) => a.screenType))),
      };
    });

    return NextResponse.json({ cinemas: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch cinemas" }, { status: 500 });
  }
}
