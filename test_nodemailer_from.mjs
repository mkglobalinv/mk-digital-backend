import nodemailer from 'nodemailer';

const t = nodemailer.createTransport({
    streamTransport: true,
    newline: 'windows'
});

async function test() {
    try {
        await t.sendMail({
            from: '"9JASUB" <"MyCompany" <info@mycompany.com>>',
            to: 'test@example.com',
            subject: 'Test',
            html: 'Test'
        });
        console.log("SENDMAIL SUCCEEDED");
    } catch (e) {
        console.log("SENDMAIL FAILED:", e.message);
    }
}
test();
