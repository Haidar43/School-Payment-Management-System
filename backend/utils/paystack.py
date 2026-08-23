import os
import requests
import json
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

# Paystack Configuration
PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "sk_test_xxxxx")
PAYSTACK_PUBLIC_KEY = os.getenv("PAYSTACK_PUBLIC_KEY", "pk_test_xxxxx")
PAYSTACK_BASE_URL = "https://api.paystack.co"
APP_ENV = os.getenv("APP_ENV", "development")


# Headers for Paystack API calls
def get_headers():
    return {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json"
    }


# ============================================================
# TRANSACTION INITIALIZATION
# ============================================================

def initialize_transaction(
        amount: float,
        email: str,
        reference: str,
        callback_url: str,
        metadata: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Initialize a Paystack transaction.
    Returns authorization URL for redirect.
    """
    url = f"{PAYSTACK_BASE_URL}/transaction/initialize"

    # Amount in kobo (1 NGN = 100 kobo)
    amount_kobo = int(amount * 100)

    payload = {
        "amount": amount_kobo,
        "email": email,
        "reference": reference,
        "callback_url": callback_url,
        "metadata": metadata or {}
    }

    try:
        response = requests.post(
            url,
            headers=get_headers(),
            json=payload
        )
        response.raise_for_status()
        result = response.json()

        if result.get("status") and result.get("data"):
            return {
                "success": True,
                "message": "Transaction initialized successfully",
                "data": result["data"],
                "authorization_url": result["data"].get("authorization_url"),
                "reference": result["data"].get("reference"),
                "access_code": result["data"].get("access_code")
            }
        else:
            return {
                "success": False,
                "message": result.get("message", "Failed to initialize transaction"),
                "data": None
            }

    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "message": f"Error initializing transaction: {str(e)}",
            "data": None
        }


# ============================================================
# TRANSACTION VERIFICATION
# ============================================================

def verify_transaction(reference: str) -> Dict[str, Any]:
    """
    Verify a Paystack transaction by reference.
    Called after redirect from Paystack.
    """
    url = f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}"

    try:
        response = requests.get(
            url,
            headers=get_headers()
        )
        response.raise_for_status()
        result = response.json()

        if result.get("status") and result.get("data"):
            data = result["data"]

            # Determine transaction status
            status = data.get("status")
            if status == "success":
                return {
                    "success": True,
                    "message": "Transaction verified successfully",
                    "status": "success",
                    "data": data,
                    "amount": data.get("amount", 0) / 100,  # Convert from kobo
                    "reference": data.get("reference"),
                    "customer": data.get("customer", {}),
                    "metadata": data.get("metadata", {})
                }
            elif status == "failed":
                return {
                    "success": True,
                    "message": "Transaction failed",
                    "status": "failed",
                    "data": data,
                    "failure_reason": data.get("gateway_response", "Unknown failure")
                }
            else:
                return {
                    "success": True,
                    "message": f"Transaction status: {status}",
                    "status": status,
                    "data": data
                }
        else:
            return {
                "success": False,
                "message": result.get("message", "Failed to verify transaction"),
                "data": None
            }

    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "message": f"Error verifying transaction: {str(e)}",
            "data": None
        }


# ============================================================
# WEBHOOK SIGNATURE VERIFICATION
# ============================================================

def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Verify that the webhook is from Paystack.
    """
    import hashlib
    import hmac

    expected_signature = hmac.new(
        PAYSTACK_SECRET_KEY.encode('utf-8'),
        payload,
        hashlib.sha512
    ).hexdigest()

    return hmac.compare_digest(expected_signature, signature)


# ============================================================
# GENERATE UNIQUE REFERENCE
# ============================================================

def generate_payment_reference(student_id: int) -> str:
    """
    Generate a unique payment reference.
    Format: PAY-{student_id}-{timestamp}
    """
    from datetime import datetime
    import time

    timestamp = int(time.time() * 1000)  # milliseconds
    return f"PAY-{student_id}-{timestamp}"