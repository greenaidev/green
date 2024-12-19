import { NextResponse } from 'next/server';

/**
 * GET endpoint for TradingView chart symbol processing
 * Converts user input symbols to valid TradingView pairs
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { content: '❌ Please provide a valid trading pair symbol' },
      { status: 400 }
    );
  }

  try {
    const cleanSymbol = symbol.toUpperCase().replace(/[^A-Z]/g, '');
    const base = cleanSymbol.slice(0, -3);
    const quote = cleanSymbol.slice(-3);
    
    // Common quote currencies mapping
    const quoteMap: { [key: string]: string } = {
      'USD': 'USDT',  // Map USD to USDT for Binance
      'BTC': 'BTC',
      'ETH': 'ETH',
    };

    const mappedQuote = quoteMap[quote] || quote;
    const pair = `${base}${mappedQuote}`;

    // Return just the symbol for client-side rendering
    return NextResponse.json({ 
      content: `/chart ${pair}`,
      symbol: pair
    });
  } catch (error) {
    console.error('TradingView API error:', error);
    return NextResponse.json(
      { content: '❌ Failed to load trading pair data' },
      { status: 500 }
    );
  }
} 