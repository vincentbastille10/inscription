from http.server import BaseHTTPRequestHandler
import json
import os
import base64
import urllib.request
import urllib.error


def _env(*names, default=""):
    for n in names:
        v = os.environ.get(n)
        if v:
            return v
    return default


def _format_email(p):
    courses = p.get("selectedCourses") or []
    lines = []
    for c in courses:
        lines.append(
            "- {title} ({cat}, {sched}) : {price} EUR".format(
                title=c.get("title", ""),
                cat=c.get("category", ""),
                sched=c.get("schedule", ""),
                price=c.get("price", 0),
            )
        )
    total = p.get("total", 0)
    body = (
        "Nouvelle pre-inscription recue depuis le site d'inscription.\n\n"
        "=== COORDONNEES ===\n"
        "Nom du parent : {parent}\n"
        "Nom enfant / eleve : {child}\n"
        "Age declare : {age}\n"
        "Date de naissance : {birth}\n"
        "Telephone : {phone}\n"
        "Email : {email}\n"
        "Adresse : {address}\n"
        "Message : {message}\n\n"
        "=== COURS CHOISIS ===\n{courses}\n\n"
        "=== TOTAL A PAYER : {total} EUR ===\n\n"
        "Rappel : cette pre-inscription ne garantit pas l'adhesion a l'ecole de danse."
    ).format(
        parent=p.get("parentName", ""),
        child=p.get("childName", ""),
        age=p.get("age", ""),
        birth=p.get("birthDate", ""),
        phone=p.get("phone", ""),
        email=p.get("email", ""),
        address=p.get("address", ""),
        message=p.get("message", ""),
        courses="\n".join(lines) if lines else "(aucun)",
        total=total,
    )
    subject = "Nouvelle pre-inscription danse - {} ({} EUR)".format(
        p.get("childName") or p.get("parentName") or "eleve", total
    )
    return subject, body


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Diagnostic : indique QUELLES variables d'env sont vues (jamais leur valeur).
        seen = {
            "MAILJET_API_KEY": bool(os.environ.get("MAILJET_API_KEY")),
            "MAILJET_SECRET_KEY": bool(os.environ.get("MAILJET_SECRET_KEY")),
            "MJ_APIKEY_PUBLIC": bool(os.environ.get("MJ_APIKEY_PUBLIC")),
            "MJ_APIKEY_PRIVATE": bool(os.environ.get("MJ_APIKEY_PRIVATE")),
            "MAIL_FROM": bool(os.environ.get("MAIL_FROM")),
            "MAIL_TO": bool(os.environ.get("MAIL_TO")),
        }
        return self._send(200, {"ok": True, "env_present": seen})

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0) or 0)
            raw = self.rfile.read(length) if length else b"{}"
            payload = json.loads(raw.decode("utf-8") or "{}")
        except Exception:
            return self._send(400, {"ok": False, "error": "invalid_json"})

        api_key = _env("MAILJET_API_KEY", "MJ_APIKEY_PUBLIC")
        api_secret = _env("MAILJET_SECRET_KEY", "MJ_APIKEY_PRIVATE")
        mail_to = _env("MAIL_TO", default="contactdelphineletort@gmail.com")
        # L'expediteur DOIT etre une adresse validee dans le compte Mailjet.
        mail_from = _env("MAIL_FROM", default=mail_to)

        if not api_key or not api_secret:
            return self._send(500, {"ok": False, "error": "mailjet_not_configured"})

        subject, text = _format_email(payload)
        message = {
            "From": {"Email": mail_from, "Name": "Inscriptions Danse Delphine Letort"},
            "To": [{"Email": mail_to, "Name": "Delphine Letort"}],
            "Subject": subject,
            "TextPart": text,
        }
        if payload.get("email"):
            message["ReplyTo"] = {
                "Email": payload["email"],
                "Name": payload.get("parentName", ""),
            }

        data = json.dumps({"Messages": [message]}).encode("utf-8")
        auth = base64.b64encode(
            "{}:{}".format(api_key, api_secret).encode("utf-8")
        ).decode("ascii")
        req = urllib.request.Request(
            "https://api.mailjet.com/v3.1/send",
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": "Basic " + auth,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                resp.read()
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "ignore")
            return self._send(502, {"ok": False, "error": "mailjet_error", "detail": detail})
        except Exception as e:
            return self._send(502, {"ok": False, "error": str(e)})

        return self._send(200, {"ok": True})

    def _send(self, code, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
