// Job processors
const processEmailContext = async (job) => {
    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    if (Math.random() < 0.1) throw new Error('SMTP Connection timed out');
    return { sent: true, recipient: job.payload?.email || 'unknown' };
};

const processImageContext = async (job) => {
    // Simulate image resizing
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
    if (Math.random() < 0.05) throw new Error('Invalid image format');
    return { width: 1024, height: 768, format: 'webp' };
};

const processReportContext = async (job) => {
    // Simulate heavy calculation
    await new Promise(resolve => setTimeout(resolve, 5000));
    return { generated: true, size: '2.4MB' };
};

const processDefault = async (job) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { processed: true };
};

module.exports = {
    email: processEmailContext,
    image: processImageContext,
    report: processReportContext,
    default: processDefault
};
