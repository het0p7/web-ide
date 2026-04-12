import { createTransport } from "nodemailer";

const sendMail = async ({ email, subject, html }) => {
  if (
    typeof email !== "string" ||
    typeof subject !== "string" ||
    typeof html !== "string"
  ) {
    throw new TypeError(
      "sendMail expects string values for email, subject and html"
    );
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error("Missing SMTP_USER or SMTP_PASSWORD environment variables");
  }

  const transport = createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  await transport.verify();

  await transport.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject,
    html,
    text: html.replace(/<[^>]*>?/gm, ""),
  });
};

export default sendMail;
