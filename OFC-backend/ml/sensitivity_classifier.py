import os, re, sys, json, hashlib

class SensitivityClassifier:
    def __init__(self):
        # Regex patterns for detecting sensitive info
        self.keyword_categories = {
            "High": [
                r"password", r"private[_ ]?key", r"secret", r"api[_-]?key",
                r"ssn", r"credit[_ ]?card", r"confidential", r"iban",
                r"passport", r"pin", r"token", r"aadhaar", r"pan",
            ],
            "Moderate": [
                r"email", r"address", r"phone", r"dob", r"user", r"bank",
            ],
        }

    def generate_file_hash(self, file_path):
        h = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                h.update(chunk)
        return h.hexdigest()

    def classify(self, file_path):
        result = {
            "file": os.path.basename(file_path),
            "sensitivity": "Low",
            "matches": [],
            "file_hash": self.generate_file_hash(file_path),
            "confidence": 0.85,
        }
        try:
            # Try reading as text (fallback for binary)
            with open(file_path, "rb") as f:
                raw = f.read(200000)  # limit read
            content = raw.decode("utf-8", errors="ignore")

            # High sensitivity check
            for pattern in self.keyword_categories["High"]:
                if re.search(pattern, content, re.IGNORECASE):
                    result["sensitivity"] = "High"
                    result["matches"].append(pattern)
                    result["confidence"] = 0.98
                    return result

            # Moderate sensitivity check
            for pattern in self.keyword_categories["Moderate"]:
                if re.search(pattern, content, re.IGNORECASE):
                    result["sensitivity"] = "Moderate"
                    result["matches"].append(pattern)
                    result["confidence"] = 0.92

        except Exception as e:
            result["matches"].append(f"Error: {str(e)}")

        return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file"}))
        sys.exit(1)
    fp = sys.argv[1]
    if not os.path.exists(fp):
        print(json.dumps({"error": f"File not found: {fp}"}))
        sys.exit(1)
    clf = SensitivityClassifier()
    print(json.dumps(clf.classify(fp)))
    sys.exit(0)
