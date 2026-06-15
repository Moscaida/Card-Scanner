import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/tcgplayer';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q') ?? '';
  const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
  const offset = Number(searchParams.get('offset') ?? 0);
  const limit = Number(searchParams.get('limit') ?? 20);
  const result = await searchProducts(q, categoryId, offset, limit);
  return NextResponse.json(result);
}
