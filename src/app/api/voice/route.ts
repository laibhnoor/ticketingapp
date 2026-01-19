import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateEmbedding, cosineSimilarity } from '@/lib/vector/embeddings';
import { VoiceRequest, VoiceResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { text, user_id, conversation_id }: VoiceRequest = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const threshold = parseFloat(
      process.env.NEXT_PUBLIC_FAQ_SIMILARITY_THRESHOLD || '0.75'
    );

    // Generate embedding for user input
    const userEmbedding = await generateEmbedding(text);

    // Search FAQ database
    const { data: faqs, error: faqError } = await supabase
      .from('faq')
      .select('*')
      .limit(10);

    if (faqError) {
      console.error('FAQ fetch error:', faqError);
      return NextResponse.json(
        { error: 'Failed to search FAQ' },
        { status: 500 }
      );
    }

    // Find best matching FAQ
    let bestMatch = null;
    let bestScore = 0;

    if (faqs && faqs.length > 0) {
      for (const faq of faqs) {
        const score = cosineSimilarity(userEmbedding, faq.embedding);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = faq;
        }
      }
    }

    let response: VoiceResponse;

    // If confident match found
    if (bestMatch && bestScore >= threshold) {
      response = {
        success: true,
        message: bestMatch.answer,
        faq_matched: true,
        confidence: bestScore,
      };
    } else {
      // Create support ticket for escalation
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          user_id: user_id || 'anonymous',
          issue_summary: text.substring(0, 200),
          status: 'open',
        })
        .select()
        .single();

      if (ticketError) {
        console.error('Ticket creation error:', ticketError);
        return NextResponse.json(
          { error: 'Failed to create ticket' },
          { status: 500 }
        );
      }

      response = {
        success: true,
        message:
          'Thank you for your question. A human agent will review your issue and get back to you shortly.',
        ticket_created: true,
        ticket_id: ticket.id,
      };
    }

    // Store conversation message
    if (conversation_id) {
      await supabase.from('messages').insert({
        conversation_id,
        sender: 'user',
        content: text,
      });

      await supabase.from('messages').insert({
        conversation_id,
        sender: 'ai',
        content: response.message,
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Voice API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
