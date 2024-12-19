import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!process.env.RPC_ENDPOINT) {
      throw new Error('RPC_ENDPOINT not configured');
    }

    const response = await fetch(process.env.RPC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: body.id || 1,
        method: body.method,
        params: body.params || [],
      })
    });

    if (!response.ok) {
      throw new Error(`RPC request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('RPC error:', error);
    return NextResponse.json(
      { 
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'RPC request failed'
        }
      },
      { status: 500 }
    );
  }
} 