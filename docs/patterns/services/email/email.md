# Email Service Patterns

**Thesis**: Transactional email is infrastructure. Use a service, don't roll your own.

**Refrain**: Templates for consistency. Queues for reliability. Track deliverability.

> *1-page summary: [1-Page.md](./1-Page.md)*

---

## Service Comparison

| Service | Pricing | Best For |
|---------|---------|----------|
| **Resend** | 3K free, then $20/10K | Modern API, React Email |
| **SendGrid** | 100/day free | Enterprise, high volume |
| **Postmark** | 100 free, $15/10K | Transactional focus |
| **AWS SES** | $0.10/1K | AWS ecosystem, cheapest |
| **Mailgun** | 5K free/3mo | Flexibility |

**Recommendation:** Resend for new projects (modern DX), SendGrid for scale.

---

## Resend (Go)

### Setup

```bash
go get github.com/resendlabs/resend-go
```

```go
import "github.com/resendlabs/resend-go"

var emailClient *resend.Client

func init() {
    emailClient = resend.NewClient(os.Getenv("RESEND_API_KEY"))
}
```

### Send Email

```go
func SendWelcomeEmail(to, name string) error {
    params := &resend.SendEmailRequest{
        From:    "onboarding@yourdomain.com",
        To:      []string{to},
        Subject: "Welcome to Our App!",
        Html:    fmt.Sprintf("<h1>Welcome, %s!</h1><p>Thanks for signing up.</p>", name),
    }
    
    _, err := emailClient.Emails.Send(params)
    return err
}
```

### With Template

```go
func SendPasswordReset(to, resetURL string) error {
    html := renderTemplate("password-reset", map[string]string{
        "ResetURL": resetURL,
    })
    
    params := &resend.SendEmailRequest{
        From:    "security@yourdomain.com",
        To:      []string{to},
        Subject: "Reset Your Password",
        Html:    html,
    }
    
    _, err := emailClient.Emails.Send(params)
    return err
}
```

---

## SendGrid (Go)

### Setup

```bash
go get github.com/sendgrid/sendgrid-go
```

```go
import (
    "github.com/sendgrid/sendgrid-go"
    "github.com/sendgrid/sendgrid-go/helpers/mail"
)

var sgClient *sendgrid.Client

func init() {
    sgClient = sendgrid.NewSendClient(os.Getenv("SENDGRID_API_KEY"))
}
```

### Send Email

```go
func SendEmail(to, toName, subject, htmlContent string) error {
    from := mail.NewEmail("Your App", "hello@yourdomain.com")
    toEmail := mail.NewEmail(toName, to)
    message := mail.NewSingleEmail(from, subject, toEmail, "", htmlContent)
    
    response, err := sgClient.Send(message)
    if err != nil {
        return err
    }
    
    if response.StatusCode >= 400 {
        return fmt.Errorf("sendgrid error: %d", response.StatusCode)
    }
    
    return nil
}
```

### With Dynamic Template

```go
func SendTemplateEmail(to, templateID string, data map[string]interface{}) error {
    m := mail.NewV3Mail()
    m.SetFrom(mail.NewEmail("Your App", "hello@yourdomain.com"))
    m.SetTemplateID(templateID)
    
    p := mail.NewPersonalization()
    p.AddTos(mail.NewEmail("", to))
    for k, v := range data {
        p.SetDynamicTemplateData(k, v)
    }
    m.AddPersonalizations(p)
    
    _, err := sgClient.Send(m)
    return err
}
```

---

## Email Templates (Go)

### HTML Templates

```go
// templates/emails/welcome.html
const welcomeTemplate = `
<!DOCTYPE html>
<html>
<head>
    <style>
        .container { max-width: 600px; margin: 0 auto; font-family: sans-serif; }
        .button { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome, {{.Name}}!</h1>
        <p>Thanks for signing up. Get started by verifying your email:</p>
        <p><a href="{{.VerifyURL}}" class="button">Verify Email</a></p>
    </div>
</body>
</html>
`

func renderTemplate(name string, data interface{}) string {
    tmpl := template.Must(template.New(name).Parse(welcomeTemplate))
    var buf bytes.Buffer
    tmpl.Execute(&buf, data)
    return buf.String()
}
```

---

## Async Email Queue

### With Goroutines (Simple)

```go
var emailQueue = make(chan EmailJob, 100)

type EmailJob struct {
    To      string
    Subject string
    HTML    string
}

func init() {
    // Start worker
    go func() {
        for job := range emailQueue {
            if err := sendEmail(job); err != nil {
                log.Printf("email failed: %v", err)
                // Production: use service.Retry() for exponential backoff
            }
        }
    }()
}

func QueueEmail(to, subject, html string) {
    emailQueue <- EmailJob{To: to, Subject: subject, HTML: html}
}
```

### With Database Queue (Reliable)

```sql
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_address TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, sent, failed
    attempts INT DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);
```

```go
func ProcessEmailQueue(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            return
        default:
            emails, _ := db.GetPendingEmails(10)
            for _, email := range emails {
                err := sendEmail(email)
                if err != nil {
                    db.MarkEmailFailed(email.ID, err.Error())
                } else {
                    db.MarkEmailSent(email.ID)
                }
            }
            time.Sleep(5 * time.Second)
        }
    }
}
```

---

## Common Email Types

| Type | Trigger | Priority |
|------|---------|----------|
| Welcome | User signup | High |
| Email verification | Signup / change | High |
| Password reset | User request | Critical |
| Order confirmation | Purchase | High |
| Shipping notification | Order shipped | Medium |
| Weekly digest | Cron job | Low |
| Marketing | Campaign | Low |

---

## Deliverability

### DNS Records

```
# SPF - who can send
TXT  @  "v=spf1 include:_spf.resend.com ~all"

# DKIM - email signing
CNAME  resend._domainkey  resend._domainkey.resend.com

# DMARC - policy
TXT  _dmarc  "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

### Best Practices

- [ ] Verify domain ownership
- [ ] Set up SPF, DKIM, DMARC
- [ ] Use consistent From address
- [ ] Include unsubscribe link
- [ ] Monitor bounce rates
- [ ] Warm up new domains slowly

---

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Send sync in request | Queue emails |
| Hardcode templates | Use template files |
| Ignore bounces | Handle bounce webhooks |
| Send from gmail.com | Use your domain |
| Skip DNS setup | Configure SPF/DKIM/DMARC |

---

## Cross-References

| Topic | See Also |
|-------|----------|
| Go patterns | [Go](../../go/1-Page.md) |
| Background jobs | Queue patterns above |
