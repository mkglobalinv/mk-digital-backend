import nodemailer from 'nodemailer';
const t = nodemailer.createTransport({streamTransport: true});
t.sendMail({
    from: '"9JASUB" <"9JASUB" <hello@9jasub.com>>',
    to: 'test@test.com',
    subject: 'Test',
    html: 'Test'
}).then(info => console.log('Success')).catch(err => console.error('CAUGHT ERROR:', err.message));
