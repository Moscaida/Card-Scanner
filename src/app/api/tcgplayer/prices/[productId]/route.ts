import { NextRequest, NextResponse } from 'next/server';
import { getProductPrices } from '@/lib/tcgplayer';

export async function GET(_req: NextRequest, { params }: { params: { productId: string } }) {
  const prices = await getProductPrices(Number(params.productId));
  return NextResponse.json(prices);
}
