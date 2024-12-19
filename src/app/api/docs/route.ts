import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const readmePath = join(process.cwd(), 'README.md');
    const content = readFileSync(readmePath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error reading README.md:', error);
    return NextResponse.json(
      { 
        content: '# Documentation\n\nError loading documentation. Please try again later.' 
      },
      { status: 500 }
    );
  }
} 