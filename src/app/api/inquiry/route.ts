import { NextResponse } from 'next/server';
import { z } from 'zod';

const inquirySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  messengerType: z.string().optional(),
  messengerId: z.string().optional(),
  procedureInterest: z.string().min(1),
  message: z.string().min(10),
  hospitalId: z.string().nullable().optional(),
  locale: z.string().default('en'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = inquirySchema.parse(body);

    // In production, save to Supabase
    // const supabase = await createAdminClient();
    // const { data: inquiry, error } = await supabase
    //   .from('inquiries')
    //   .insert({
    //     name: data.name,
    //     email: data.email,
    //     phone: data.phone,
    //     messenger_type: data.messengerType,
    //     messenger_id: data.messengerId,
    //     procedure_interest: data.procedureInterest,
    //     message: data.message,
    //     hospital_id: data.hospitalId,
    //     locale: data.locale,
    //     status: 'new',
    //   })
    //   .select()
    //   .single();

    // For now, just log and return success
    console.log('New inquiry:', data);

    // In production, also send notification email/webhook

    return NextResponse.json({
      success: true,
      message: 'Inquiry submitted successfully',
      // id: inquiry?.id,
    });
  } catch (error) {
    console.error('Inquiry API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid form data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit inquiry' },
      { status: 500 }
    );
  }
}
