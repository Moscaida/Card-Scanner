#!/usr/bin/env python3
"""
iPhone Text Message Extractor
------------------------------
Extracts SMS/iMessage messages for a specific contact from an iPhone backup
and writes them to a CSV file.

Requirements (Linux):
  sudo apt install libimobiledevice-utils   # for idevicebackup2
  python3 (3.8+, standard library only)

Quick start:
  # Step 1 – create a backup (iPhone must be connected via USB and unlocked):
  python3 extract_messages.py "Contact Name" --create-backup ~/iphone_backup

  # Step 2 – extract (if you already have a backup):
  python3 extract_messages.py "Contact Name" --backup-dir ~/iphone_backup

  # Custom output file:
  python3 extract_messages.py "Contact Name" --backup-dir ~/iphone_backup -o chat.csv
"""

import os
import sys
import csv
import sqlite3
import argparse
import subprocess
import shutil
from pathlib import Path
from datetime import datetime, timezone


# ---------------------------------------------------------------------------
# Backup discovery
# ---------------------------------------------------------------------------

def find_backup_dirs(extra_paths=None):
    """Search common Linux locations for iPhone backup directories."""
    search = [
        Path.home() / ".cache" / "libimobiledevice" / "backups",
        Path.home() / ".local" / "share" / "libimobiledevice",
        Path.home() / "iphone_backup",
        Path("/tmp"),
        Path.cwd(),
    ]
    if extra_paths:
        search = [Path(p) for p in extra_paths] + search

    found = []
    for base in search:
        if not base.exists():
            continue
        for manifest in base.rglob("Manifest.db"):
            backup = manifest.parent
            if backup not in found:
                found.append(backup)
    return found


def pick_backup(backup_dir_arg):
    """Return a resolved backup Path, prompting if multiple are found."""
    if backup_dir_arg:
        root = Path(backup_dir_arg)
        if (root / "Manifest.db").exists():
            return root
        candidates = list(root.rglob("Manifest.db"))
        if not candidates:
            _die(f"No Manifest.db found under {root}")
    else:
        candidates = [p / "Manifest.db" for p in find_backup_dirs()]
        candidates = [p for p in candidates if p.exists()]
        if not candidates:
            _die(
                "No iPhone backup found.\n"
                "  Create one: python3 extract_messages.py --create-backup ~/iphone_backup\n"
                "  Or specify: --backup-dir /path/to/backup"
            )

    dirs = [c.parent for c in candidates]
    if len(dirs) == 1:
        return dirs[0]

    print("Multiple backups found:")
    for i, d in enumerate(dirs):
        print(f"  [{i}] {d}")
    while True:
        try:
            choice = int(input("Enter number to select: "))
            return dirs[choice]
        except (ValueError, IndexError):
            print("Invalid choice, try again.")


# ---------------------------------------------------------------------------
# Backup file lookup via Manifest.db
# ---------------------------------------------------------------------------

def get_backup_file(backup_dir, domain, relative_path):
    """
    Resolve a backup file path using Manifest.db.
    Returns a Path object, or None if not found.
    """
    manifest = backup_dir / "Manifest.db"
    con = sqlite3.connect(str(manifest))
    try:
        row = con.execute(
            "SELECT fileID FROM Files WHERE domain=? AND relativePath=?",
            (domain, relative_path),
        ).fetchone()
    finally:
        con.close()

    if not row:
        return None
    file_id = row[0]
    return backup_dir / file_id[:2] / file_id


# ---------------------------------------------------------------------------
# Contact lookup
# ---------------------------------------------------------------------------

def load_contacts(ab_path):
    """
    Return dict mapping full name -> list[normalized_phone].
    Reads ABPerson + ABMultiValue (property 3 = phone) from AddressBook.sqlitedb.
    """
    con = sqlite3.connect(str(ab_path))
    contacts = {}
    try:
        persons = {}
        for pid, first, last, org in con.execute(
            "SELECT ROWID, First, Last, Organization FROM ABPerson"
        ):
            parts = [p for p in (first, last) if p]
            name = " ".join(parts) if parts else (org or "")
            if name:
                persons[pid] = name

        for record_id, value in con.execute(
            "SELECT record_id, value FROM ABMultiValue WHERE property=3"
        ):
            name = persons.get(record_id)
            if name and value:
                contacts.setdefault(name, []).append(normalize_phone(value))
    finally:
        con.close()
    return contacts


def normalize_phone(number):
    """
    Strip formatting; add +1 for bare 10-digit US numbers.
    Returns a string of digits with optional leading '+'.
    """
    digits = "".join(c for c in number if c.isdigit() or (c == "+" and not number.index(c)))
    if not digits.startswith("+"):
        if len(digits) == 10:
            digits = "+1" + digits
        elif len(digits) == 11 and digits.startswith("1"):
            digits = "+" + digits
    return digits


def search_contacts(contacts, query):
    """Case-insensitive partial-name search. Returns matching sub-dict."""
    q = query.lower()
    return {name: nums for name, nums in contacts.items() if q in name.lower()}


def resolve_contact(contacts, query):
    """
    Find the contact(s) matching query.
    Returns (display_name, [phone_numbers]).
    Prompts the user if multiple names match.
    """
    matches = search_contacts(contacts, query)
    if not matches:
        available = ", ".join(list(contacts.keys())[:30])
        _die(
            f"No contact found matching '{query}'.\n"
            f"Partial list of contacts in backup:\n  {available}"
        )

    if len(matches) == 1:
        name, nums = next(iter(matches.items()))
        return name, nums

    names = list(matches.keys())
    print(f"Multiple contacts match '{query}':")
    for i, n in enumerate(names):
        print(f"  [{i}] {n}  —  {', '.join(matches[n])}")
    while True:
        raw = input("Enter number to select (or 'all' to include all): ").strip()
        if raw.lower() == "all":
            all_nums = [n for nums in matches.values() for n in nums]
            return ", ".join(names), all_nums
        try:
            idx = int(raw)
            name = names[idx]
            return name, matches[name]
        except (ValueError, IndexError):
            print("Invalid choice, try again.")


# ---------------------------------------------------------------------------
# Message extraction
# ---------------------------------------------------------------------------

APPLE_EPOCH = 978307200  # 2001-01-01T00:00:00 UTC in Unix seconds


def apple_date_to_datetime(value):
    """Convert an Apple Core Data timestamp to a local datetime string."""
    if value is None:
        return ""
    # iOS 11+ stores nanoseconds; older versions store seconds
    seconds = value / 1e9 if value > 1_000_000_000_000 else float(value)
    ts = APPLE_EPOCH + seconds
    dt = datetime.fromtimestamp(ts, tz=timezone.utc).astimezone()
    return dt.strftime("%Y-%m-%d %H:%M:%S %Z")


def phones_match(handle, number):
    """
    True if handle and number refer to the same phone.
    Compares last 10 digits to handle country-code variants.
    Also supports bare email handles (iMessage).
    """
    # Email handles (iMessage): exact match
    if "@" in handle or "@" in number:
        return handle.strip().lower() == number.strip().lower()
    da = "".join(c for c in handle if c.isdigit())
    db = "".join(c for c in number if c.isdigit())
    if len(da) >= 10 and len(db) >= 10:
        return da[-10:] == db[-10:]
    return da == db


def extract_messages(sms_path, phone_numbers):
    """
    Pull all messages from sms.db whose handle matches any of phone_numbers.
    Returns list of dicts sorted by date ascending.
    """
    con = sqlite3.connect(str(sms_path))
    rows = []
    try:
        cursor = con.execute(
            """
            SELECT
                m.date,
                m.is_from_me,
                h.id           AS handle_id,
                COALESCE(m.text, '') AS body,
                m.service
            FROM message m
            JOIN handle h ON m.handle_id = h.ROWID
            ORDER BY m.date ASC
            """
        )
        for date_val, is_from_me, handle_id, body, service in cursor:
            if not any(phones_match(handle_id, n) for n in phone_numbers):
                continue
            rows.append(
                {
                    "date": apple_date_to_datetime(date_val),
                    "direction": "Sent" if is_from_me else "Received",
                    "phone_number": handle_id,
                    "text": body,
                    "service": service or "",
                }
            )
    finally:
        con.close()
    return rows


# ---------------------------------------------------------------------------
# Backup creation
# ---------------------------------------------------------------------------

def create_backup(output_dir):
    """Run idevicebackup2 to create a full iPhone backup."""
    if not shutil.which("idevicebackup2"):
        _die(
            "idevicebackup2 not found.\n"
            "Install it with:  sudo apt install libimobiledevice-utils\n"
            "Then re-run with --create-backup."
        )
    dest = Path(output_dir)
    dest.mkdir(parents=True, exist_ok=True)
    print("Connect your iPhone via USB, unlock it, and trust this computer if prompted.")
    print(f"Creating backup in: {dest}  (this may take several minutes…)\n")
    result = subprocess.run(
        ["idevicebackup2", "backup", "--full", str(dest)],
        check=False,
    )
    if result.returncode != 0:
        _die(
            "Backup failed (idevicebackup2 exited with error).\n"
            "Make sure your iPhone is connected, unlocked, and has trusted this computer."
        )
    print("\nBackup complete.")
    return dest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _die(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description=(
            "Extract iPhone SMS/iMessage messages for a contact and write to CSV.\n\n"
            "Example (create backup + extract in one command):\n"
            "  python3 extract_messages.py \"Jane Doe\" "
            "--create-backup ~/iphone_backup -o jane.csv\n\n"
            "Example (use existing backup):\n"
            "  python3 extract_messages.py \"Jane Doe\" "
            "--backup-dir ~/iphone_backup -o jane.csv"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "contact_name",
        help="Name of the contact to extract (partial match, case-insensitive).",
    )
    parser.add_argument(
        "-o", "--output",
        default="messages.csv",
        metavar="FILE",
        help="Output CSV file path (default: messages.csv).",
    )
    parser.add_argument(
        "-b", "--backup-dir",
        metavar="DIR",
        help=(
            "Path to an iPhone backup directory (the folder containing Manifest.db, "
            "or a parent folder if there are multiple backups inside). "
            "If omitted, common locations are searched automatically."
        ),
    )
    parser.add_argument(
        "--create-backup",
        metavar="DIR",
        help=(
            "Create a fresh iPhone backup in DIR before extracting. "
            "Requires idevicebackup2 (sudo apt install libimobiledevice-utils). "
            "iPhone must be connected via USB."
        ),
    )

    args = parser.parse_args()

    # --- Step 1: optionally create backup ---
    if args.create_backup:
        create_backup(args.create_backup)
        # Use that directory for extraction unless --backup-dir was also given
        if not args.backup_dir:
            args.backup_dir = args.create_backup

    # --- Step 2: locate backup ---
    backup_dir = pick_backup(args.backup_dir)
    print(f"Using backup: {backup_dir}")

    # --- Step 3: locate sms.db ---
    sms_path = get_backup_file(backup_dir, "HomeDomain", "Library/SMS/sms.db")
    if not sms_path or not sms_path.exists():
        _die(
            "sms.db not found in the backup.\n"
            "Make sure the backup is complete and was created with encryption disabled."
        )

    # --- Step 4: locate AddressBook ---
    ab_path = get_backup_file(
        backup_dir, "HomeDomain", "Library/AddressBook/AddressBook.sqlitedb"
    )
    if not ab_path or not ab_path.exists():
        _die(
            "AddressBook.sqlitedb not found in the backup.\n"
            "Make sure the backup is complete."
        )

    # --- Step 5: resolve contact ---
    print("Loading contacts…")
    contacts = load_contacts(ab_path)
    contact_name, phone_numbers = resolve_contact(contacts, args.contact_name)
    print(f"Contact : {contact_name}")
    print(f"Numbers : {', '.join(phone_numbers)}")

    # --- Step 6: extract messages ---
    print("Extracting messages…")
    messages = extract_messages(sms_path, phone_numbers)

    if not messages:
        print(f"No messages found for {contact_name}.")
        sys.exit(0)

    # --- Step 7: write CSV ---
    out = Path(args.output)
    fieldnames = ["date", "direction", "contact_name", "phone_number", "service", "text"]
    with open(out, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for msg in messages:
            writer.writerow(
                {
                    "date": msg["date"],
                    "direction": msg["direction"],
                    "contact_name": contact_name,
                    "phone_number": msg["phone_number"],
                    "service": msg["service"],
                    "text": msg["text"],
                }
            )

    print(f"\nDone! {len(messages)} messages written to: {out.resolve()}")


if __name__ == "__main__":
    main()
