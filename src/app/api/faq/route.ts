import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateEmbedding, cosineSimilarity } from '@/lib/vector/embeddings';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);

    // Get all FAQs
    const { data: faqs, error } = await supabase
      .from('faq')
      .select('*')
      .limit(10);

    if (error) {
      throw error;
    }

    // Calculate similarity scores
    const results = (faqs || [])
      .map((faq) => ({
        ...faq,
        similarity: cosineSimilarity(queryEmbedding, faq.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to search FAQ' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { question, answer } = await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Generate embedding for the question
    const embedding = await generateEmbedding(question);

    const { data, error } = await supabase
      .from('faq')
      .insert({
        question,
        answer,
        embedding,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}
