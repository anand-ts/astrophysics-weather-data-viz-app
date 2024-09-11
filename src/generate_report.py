import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def send_email(subject, body):
    sender = "youremail@example.com"
    receiver = "recipient@example.com"
    msg = MIMEMultipart()
    msg["From"] = sender
    msg["To"] = receiver
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    # Using Gmail SMTP
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(sender, "yourpassword")  # Replace with your email password
    server.sendmail(sender, receiver, msg.as_string())
    server.quit()

    print("Email sent!")
