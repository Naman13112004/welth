import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import EmailTemplate from '../../../../emails/template';

const resend = new Resend(process.env.RESEND_API_KEY || "");

export async function POST(req: Request) {
    const { to, subject, templateData } = await req.json();

    try {
        const { data, error } = await resend.emails.send({
            from: 'Finance App <onboarding@resend.dev>',
            to,
            subject,
            react: EmailTemplate(templateData),
        });

        if (error) {
            return NextResponse.json({ error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.log(error);
        return NextResponse.json(
            {
                success: false,
                error,
            },
            { status: 500 }
        );
    }
}