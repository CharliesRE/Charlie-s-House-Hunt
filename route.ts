import { prisma as __prisma } from '@/lib/prisma';
function parseCSV(text: string) {
  const [headerLine, ...rows] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map(h=>h.trim());
  return rows.filter(Boolean).map((line) => {
    const cols = line.split(',');
    const obj: any = {};
    headers.forEach((h, i) => obj[h] = (cols[i] ?? '').trim());
    if (obj.price) obj.price = Number(obj.price);
    if (obj.m2) obj.m2 = Number(obj.m2);
    if (obj.beds !== '') obj.beds = Number(obj.beds);
    if (obj.baths !== '') obj.baths = Number(obj.baths);
    if (obj.furnished !== '') obj.furnished = obj.furnished === 'true';
    return obj;
  });
}
export async function POST(req: Request) {
  const text = await req.text();
  const rows = parseCSV(text);
  let upserts = 0;
  for (const r of rows) {
    if (!r.refCode || !r.street) continue;
    await __prisma.unit.upsert({
      where: { refCode: r.refCode },
      update: {
        purpose: r.purpose || undefined,
        status: r.status || undefined,
        street: r.street || undefined,
        neighborhood: r.neighborhood || undefined,
        areaGroup: r.areaGroup || undefined,
        price: r.price ?? undefined,
        m2: r.m2 ?? undefined,
        beds: r.beds ?? undefined,
        baths: r.baths ?? undefined,
        furnished: typeof r.furnished === 'boolean' ? r.furnished : undefined,
        availability: r.availability ? new Date(r.availability) : undefined,
      },
      create: {
        refCode: r.refCode,
        purpose: r.purpose || 'RENT',
        status: r.status || 'ACTIVE',
        street: r.street,
        neighborhood: r.neighborhood || 'Lisbon',
        areaGroup: r.areaGroup || 'LISBON_CITY',
        price: r.price || 0,
        m2: r.m2 || 0,
        beds: r.beds ?? 0,
        baths: r.baths ?? 1,
        furnished: typeof r.furnished === 'boolean' ? r.furnished : null,
        availability: r.availability ? new Date(r.availability) : null,
      }
    });
    upserts++;
  }
  return Response.json({ ok: true, upserts });
}
