from typing import Optional


def validate_phone(phone: str) -> bool:
    """
    Basic phone number validation.
    Remove spaces and check length.
    """
    phone = phone.strip().replace(" ", "")
    if not phone:
        return False

    # Basic check: should be at least 10 digits
    if len(phone) < 10:
        return False

    # Should contain only digits and optional +
    allowed_chars = set("0123456789+")
    return all(c in allowed_chars for c in phone)


def validate_amount(amount: float) -> bool:
    """
    Validate that amount is positive and not zero.
    """
    if amount <= 0:
        return False
    return True


def validate_admission_number(admission_number: str) -> bool:
    """
    Validate admission number format.
    """
    if not admission_number:
        return False

    # Remove spaces and check
    admission_number = admission_number.strip()
    if len(admission_number) < 3:
        return False

    return True


def validate_status(status: str, allowed_statuses: list) -> bool:
    """
    Validate if status is in allowed list.
    """
    return status.upper() in [s.upper() for s in allowed_statuses]