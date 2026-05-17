import { NextResponse } from 'next/server';
import { pinecone } from '@/lib/rag';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Connect to the index
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

    // Tell Pinecone to delete all vectors where the "source" metadata matches the filename
    // We use the configured namespace to isolate dev/prod environments correctly
    const namespace = process.env.PINECONE_NAMESPACE || '';
    await index.namespace(namespace).deleteMany({
      source: { $eq: filename }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted all data for ${filename}` 
    });

  } catch (error) {
    console.error('Delete Error:', error);
    return NextResponse.json({ error: 'Failed to delete file from vault' }, { status: 500 });
  }
}