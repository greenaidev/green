import { NextResponse } from 'next/server';
import { AppError } from '@/types/errors';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  console.log('🔍 Test GET endpoint hit at:', new Date().toISOString());
  console.log('📨 Headers:', Object.fromEntries(request.headers.entries()));
  return NextResponse.json({ status: 'ok', message: 'Test endpoint is working' });
}

export async function POST(request: Request) {
  console.log('\n🤖 Test POST endpoint hit at:', new Date().toISOString());
  console.log('📨 Headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const body = await request.text();
    console.log('📝 Raw body:', body);
    
    try {
      const jsonBody = JSON.parse(body);
      console.log('✅ Parsed JSON body:', JSON.stringify(jsonBody, null, 2));
    } catch {
      console.log('⚠️ Could not parse body as JSON');
    }
    
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Test endpoint received POST',
      receivedAt: new Date().toISOString(),
      body 
    });
  } catch (error) {
    const appError = error as AppError;
    console.error('❌ Error processing request:', appError);
    return NextResponse.json({ 
      status: 'error',
      message: appError.message || 'Unknown error'
    }, { status: 500 });
  }
} 