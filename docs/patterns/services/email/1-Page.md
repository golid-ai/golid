# Email — 1-Page

**Thesis**: Use a service. Queue everything. Track deliverability.

---

## Service Choice

| Service | Use When |
|---------|----------|
| **Resend** | Modern API, new projects |
| **SendGrid** | Enterprise, high volume |
| **AWS SES** | AWS ecosystem, cost |

---

## Resend (Go)

```go
import "github.com/resendlabs/resend-go"

client := resend.NewClient(os.Getenv("RESEND_API_KEY"))

client.Emails.Send(&resend.SendEmailRequest{
    From:    "hello@yourdomain.com",
    To:      []string{email},
    Subject: "Welcome!",
    Html:    "<h1>Hello!</h1>",
})
```

---

## SendGrid (Go)

```go
import "github.com/sendgrid/sendgrid-go/helpers/mail"

message := mail.NewSingleEmail(
    mail.NewEmail("App", "hello@yourdomain.com"),
    "Subject",
    mail.NewEmail("", to),
    "",
    htmlContent,
)
sendgrid.NewSendClient(apiKey).Send(message)
```

---

## Queue Pattern

```go
var emailQueue = make(chan EmailJob, 100)

go func() {
    for job := range emailQueue {
        sendEmail(job)
    }
}()

// Usage
emailQueue <- EmailJob{To: to, Subject: subj, HTML: html}
```

---

## DNS Setup

```
SPF:   v=spf1 include:_spf.resend.com ~all
DKIM:  resend._domainkey → resend.com
DMARC: v=DMARC1; p=quarantine
```

---

## Checklist

- [ ] Domain verified
- [ ] SPF/DKIM/DMARC configured
- [ ] Emails queued (not sync)
- [ ] Templates use variables
- [ ] Unsubscribe link included

---

*Full reference: [email.md](./email.md)*
