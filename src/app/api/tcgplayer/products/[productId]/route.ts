import { NextRequest, NextResponse } from 'next/server';
import { getProduct } from '@/lib/tcgplayer';

export async function GET(_req: NextRequest, { params }: { params: { productId: string } }) {
  const product = await getProduct(Number(params.productId));
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(product);
}
