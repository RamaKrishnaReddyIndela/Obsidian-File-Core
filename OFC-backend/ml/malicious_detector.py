import os, sys, json, math, hashlib
try:
    import magic
    MAGIC_AVAILABLE = True
except ImportError:
    MAGIC_AVAILABLE = False

# Known malware hashes
KNOWN_MALWARE_HASHES = {
    "44d88612fea8a8f36de82e1278abb02f",  # EICAR test file
}

def get_file_hash(filepath, algo="md5"):
    h = hashlib.new(algo)
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            h.update(chunk)
    return h.hexdigest()

def get_file_type_fallback(filepath):
    """Fallback file type detection based on extension and content"""
    _, ext = os.path.splitext(filepath.lower())
    extension_map = {
        '.exe': 'application/x-dosexec',
        '.dll': 'application/x-dosexec',
        '.bat': 'application/x-bat',
        '.cmd': 'application/x-bat',
        '.ps1': 'application/x-powershell',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.zip': 'application/zip',
        '.jpg': 'image/jpeg',
        '.png': 'image/png'
    }
    return extension_map.get(ext, 'application/octet-stream')

def calculate_entropy(filepath):
    with open(filepath, "rb") as f:
        data = f.read()
    if not data:
        return 0.0
    entropy = 0
    for x in range(256):
        p_x = float(data.count(bytes([x]))) / len(data)
        if p_x > 0:
            entropy += -p_x * math.log2(p_x)
    return round(entropy, 2)

def scan_file(filepath):
    # Get file type with fallback
    if MAGIC_AVAILABLE:
        try:
            file_type = magic.from_file(filepath, mime=True)
        except Exception:
            file_type = get_file_type_fallback(filepath)
    else:
        file_type = get_file_type_fallback(filepath)
    
    features = {
        "file_name": os.path.basename(filepath),
        "file_size": os.path.getsize(filepath),
        "file_type": file_type,
        "hash": get_file_hash(filepath),
        "entropy": calculate_entropy(filepath),
    }

    verdict = "clean"
    reasons = []

    if features["hash"] in KNOWN_MALWARE_HASHES:
        verdict = "malicious"
        reasons.append("Known malware hash match.")

    if features["entropy"] > 7.8:
        if verdict != "malicious":
            verdict = "suspicious"
        reasons.append("High entropy - possibly packed/encrypted.")

    if features["file_type"] in ["application/x-dosexec", "application/x-executable"]:
        reasons.append("Executable file detected.")

    return {"verdict": verdict, "reasons": reasons, "features": features}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file provided"}))
        sys.exit(1)
    filepath = sys.argv[1]
    if not os.path.exists(filepath):
        print(json.dumps({"error": f"File not found: {filepath}"}))
        sys.exit(1)
    print(json.dumps(scan_file(filepath)))
    sys.exit(0)
