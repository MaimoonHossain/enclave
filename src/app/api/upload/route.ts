import { NextResponse } from 'next/server';
import { processAndEmbed } from '@/lib/rag'; 
import pdf from 'pdf-parse';

export async function POST(request: Request) {
  try {
    // 1. Extract the file from the incoming FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // if (file.size > 100 * 1024) {
    //   return NextResponse.json({ error: 'File size must be less than 100KB.' }, { status: 400 });
    // }

    // Convert the file to a Node.js Buffer for processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = '';

    // 2. Parse the text based on file type
    if (file.type === 'application/pdf') {
      const pdfData = await pdf(buffer);
      extractedText = pdfData.text;
    } else if (file.type === 'text/plain') {
      extractedText = buffer.toString('utf-8');
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or TXT file.' }, 
        { status: 400 }
      );
    }

    // 3. Ensure we actually got text out of the document
    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'No readable text found in file' }, { status: 400 });
    }

    // 4. Send the text to our LangChain/Pinecone utility
    const chunksCreated = await processAndEmbed(extractedText, file.name);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed and embedded ${chunksCreated} chunks from ${file.name}` 
    });

  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json({ error: 'Failed to process document' }, { status: 500 });
  }
}