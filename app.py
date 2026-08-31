from datetime import datetime, timedelta
from random import randint
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

users = [
    {"id": "KYC-1048", "name": "Aarav Mehta", "email": "aarav.mehta@email.com", "phone": "+91 98765 40218", "document": "Passport", "status": "Verified", "risk": "Low", "joined": "Today, 09:42", "initials": "AM"},
    {"id": "KYC-1047", "name": "Maya Thompson", "email": "maya.t@email.com", "phone": "+1 415 555 0198", "document": "Driving license", "status": "In review", "risk": "Medium", "joined": "Today, 08:18", "initials": "MT"},
    {"id": "KYC-1046", "name": "Rohan Shah", "email": "rohan.shah@email.com", "phone": "+91 99887 21045", "document": "National ID", "status": "Verified", "risk": "Low", "joined": "Yesterday, 16:30", "initials": "RS"},
    {"id": "KYC-1045", "name": "Elena Garcia", "email": "elena.g@email.com", "phone": "+34 612 448 210", "document": "Passport", "status": "Needs action", "risk": "High", "joined": "Yesterday, 14:04", "initials": "EG"},
    {"id": "KYC-1044", "name": "Noah Williams", "email": "noah.w@email.com", "phone": "+1 202 555 0134", "document": "Driving license", "status": "Verified", "risk": "Low", "joined": "Yesterday, 11:22", "initials": "NW"},
]

otp_codes = {}

@app.get("/")
def index():
    return render_template("index.html")

@app.get("/api/dashboard")
def dashboard():
    return jsonify({
        "stats": {"total": 1284, "verified": 1106, "pending": 124, "flagged": 54, "verification_rate": 86.1},
        "users": users,
        "activity": [
            {"icon": "check", "title": "Document verified", "detail": "Aarav Mehta passed all checks", "time": "2 min ago", "tone": "success"},
            {"icon": "user", "title": "New application", "detail": "Maya Thompson started KYC", "time": "18 min ago", "tone": "blue"},
            {"icon": "alert", "title": "Review required", "detail": "Elena Garcia has a risk flag", "time": "42 min ago", "tone": "warning"},
            {"icon": "phone", "title": "Mobile verified", "detail": "Rohan Shah confirmed OTP", "time": "1 hr ago", "tone": "purple"},
        ],
        "chart": [58, 66, 62, 74, 69, 82, 78, 88, 84, 91, 86, 94],
        "updated": datetime.now().strftime("%H:%M")
    })

@app.post("/api/send-otp")
def send_otp():
    phone = request.json.get("phone", "")
    if not phone.strip():
        return jsonify({"error": "Enter a mobile number first."}), 400
    code = str(randint(100000, 999999))
    otp_codes[phone] = {"code": code, "expires": datetime.now() + timedelta(minutes=5)}
    return jsonify({"message": f"Demo OTP sent to {phone}", "demo_code": code})

@app.post("/api/verify-otp")
def verify_otp():
    data = request.json or {}
    phone, code = data.get("phone", ""), data.get("code", "")
    record = otp_codes.get(phone)
    if not record or datetime.now() > record["expires"] or code != record["code"]:
        return jsonify({"verified": False, "error": "That code is invalid or expired."}), 400
    return jsonify({"verified": True, "message": "Mobile number verified successfully."})

@app.post("/api/verify-document")
def verify_document():
    data = request.json or {}
    name = data.get("name", "New applicant").strip() or "New applicant"
    document = data.get("document", "Identity document")
    new_user = {"id": f"KYC-{1049 + len(users)}", "name": name, "email": "pending@email.com", "phone": "Pending", "document": document, "status": "In review", "risk": "Low", "joined": "Just now", "initials": "".join(part[0] for part in name.split()[:2]).upper()}
    users.insert(0, new_user)
    return jsonify({"success": True, "user": new_user, "message": "Document queued for verification."})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
