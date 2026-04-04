interface EmailParams {
	to: string;
	subject: string;
	html: string;
}

/**
 * Send an email notification.
 * Currently a stub that logs to console — replace with nodemailer SMTP transport in production.
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
	console.log(`[EMAIL] To: ${params.to} | Subject: ${params.subject}`);
	console.log(`[EMAIL] Body: ${params.html.substring(0, 200)}...`);
	return true;
}

/** Build a simple HTML email for workflow notifications */
export function buildWorkflowEmail(opts: {
	recipientName: string;
	stepName: string;
	documentTitle: string;
	actionUrl: string;
	actionLabel: string;
}): string {
	return `
		<div style="font-family: 'Noto Sans Thai', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
			<h2 style="color: #1a5276;">ProSync ERP - แจ้งเตือนงานใหม่</h2>
			<p>สวัสดีค่ะ/ครับ <strong>${opts.recipientName}</strong>,</p>
			<p>คุณมีงานใหม่ที่ต้องดำเนินการ:</p>
			<div style="background: #f0f7ff; border-left: 4px solid #2980b9; padding: 16px; border-radius: 8px; margin: 16px 0;">
				<p style="margin: 0 0 8px 0;"><strong>ขั้นตอน:</strong> ${opts.stepName}</p>
				<p style="margin: 0;"><strong>เอกสาร:</strong> ${opts.documentTitle}</p>
			</div>
			<a href="${opts.actionUrl}" style="display: inline-block; padding: 12px 24px; background: #2980b9; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
				${opts.actionLabel}
			</a>
			<p style="color: #999; font-size: 12px; margin-top: 24px;">
				อีเมลนี้ส่งโดยระบบ ProSync ERP อัตโนมัติ กรุณาอย่าตอบกลับ
			</p>
		</div>
	`;
}
