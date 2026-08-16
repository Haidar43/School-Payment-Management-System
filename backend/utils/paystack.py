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
APP_ENV = os.getenv("APP_ENV", "development")  # development, test, production


# Headers for Paystack API calls
def get_headers():
    return {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json"
    }


# ============================================================
# NIN VALIDATION (SKIP IN TEST/DEV MODE)
# ============================================================

def validate_nin(nin: str) -> Dict[str, Any]:
    """
    Validate a NIN (National Identification Number) using Paystack API.
    SKIP in test/development mode - always returns success.
    Only validates in production mode.
    """
    # In test/development mode, skip validation - assume valid
    if APP_ENV == "development" or APP_ENV == "test":
        return {
            "success": True,
            "message": "Test mode - NIN validation bypassed",
            "data": {
                "nin": nin,
                "first_name": "Test",
                "last_name": "User",
                "phone": "08000000000",
                "dob": "2000-01-01"
            }
        }

    # Production mode - call Paystack API
    url = f"{PAYSTACK_BASE_URL}/identity/verify"

    try:
        response = requests.post(
            url,
            headers=get_headers(),
            json={"nin": nin}
        )
        response.raise_for_status()
        result = response.json()

        if result.get("status") and result.get("data"):
            return {
                "success": True,
                "message": "NIN validated successfully",
                "data": result["data"]
            }
        else:
            return {
                "success": False,
                "message": result.get("message", "NIN validation failed"),
                "data": None
            }

    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "message": f"Error validating NIN: {str(e)}",
            "data": None
        }


# ============================================================
# CUSTOMER MANAGEMENT (WORKS IN ALL MODES)
# ============================================================

def create_customer(
        first_name: str,
        last_name: str,
        phone: str,
        email: Optional[str] = None,
        customer_code: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a customer in Paystack.
    WORKS in all modes (test, dev, production).
    """
    url = f"{PAYSTACK_BASE_URL}/customer"

    payload = {
        "first_name": first_name,
        "last_name": last_name,
        "phone": phone,
    }

    if email:
        payload["email"] = email

    if customer_code:
        payload["customer_code"] = customer_code

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
                "message": "Customer created successfully",
                "data": result["data"],
                "customer_code": result["data"].get("customer_code")
            }
        else:
            return {
                "success": False,
                "message": result.get("message", "Failed to create customer"),
                "data": None
            }

    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "message": f"Error creating customer: {str(e)}",
            "data": None
        }


def get_customer(customer_code: str) -> Dict[str, Any]:
    """
    Get customer details from Paystack.
    """
    url = f"{PAYSTACK_BASE_URL}/customer/{customer_code}"

    try:
        response = requests.get(
            url,
            headers=get_headers()
        )
        response.raise_for_status()
        result = response.json()

        if result.get("status") and result.get("data"):
            return {
                "success": True,
                "message": "Customer found",
                "data": result["data"]
            }
        else:
            return {
                "success": False,
                "message": result.get("message", "Customer not found"),
                "data": None
            }

    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "message": f"Error fetching customer: {str(e)}",
            "data": None
        }


# ============================================================
# DEDICATED VIRTUAL ACCOUNT (DVA) - WORKS IN ALL MODES
# ============================================================

def create_dedicated_virtual_account(
        customer_code: str,
        account_name: Optional[str] = None,
        preferred_bank: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a dedicated virtual account for a customer.
    WORKS in all modes (test, dev, production).
    """
    url = f"{PAYSTACK_BASE_URL}/dedicated_account"

    payload = {
        "customer": customer_code,
    }

    if account_name:
        payload["account_name"] = account_name

    if preferred_bank:
        payload["preferred_bank"] = preferred_bank

    try:
        response = requests.post(
            url,
            headers=get_headers(),
            json=payload
        )
        response.raise_for_status()
        result = response.json()

        if result.get("status") and result.get("data"):
            data = result["data"]
            return {
                "success": True,
                "message": "Dedicated virtual account created successfully",
                "data": data,
                "account_number": data.get("account_number"),
                "account_name": data.get("account_name"),
                "bank_name": data.get("bank", {}).get("name") if data.get("bank") else None,
                "bank_code": data.get("bank", {}).get("code") if data.get("bank") else None,
                "customer_code": data.get("customer"),
                "reference": data.get("reference")
            }
        else:
            return {
                "success": False,
                "message": result.get("message", "Failed to create dedicated virtual account"),
                "data": None
            }

    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "message": f"Error creating dedicated virtual account: {str(e)}",
            "data": None
        }


def get_dedicated_virtual_account(account_number: str) -> Dict[str, Any]:
    """
    Get details of a dedicated virtual account.
    """
    url = f"{PAYSTACK_BASE_URL}/dedicated_account/{account_number}"

    try:
        response = requests.get(
            url,
            headers=get_headers()
        )
        response.raise_for_status()
        result = response.json()

        if result.get("status") and result.get("data"):
            return {
                "success": True,
                "message": "Dedicated virtual account found",
                "data": result["data"]
            }
        else:
            return {
                "success": False,
                "message": result.get("message", "Dedicated virtual account not found"),
                "data": None
            }

    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "message": f"Error fetching dedicated virtual account: {str(e)}",
            "data": None
        }


def assign_dva_to_student(
        parent_customer_code: str,
        student_name: str,
        student_admission: str
) -> Dict[str, Any]:
    """
    Assign a dedicated virtual account to a student.
    Uses parent's customer code and student's name for account naming.
    """
    # Account name format: StudentName - Admission
    account_name = f"{student_name} - {student_admission}"

    # Create DVA for the student
    result = create_dedicated_virtual_account(
        customer_code=parent_customer_code,
        account_name=account_name
    )

    return result


# ============================================================
# WEBHOOK VERIFICATION
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
# NO TEST GENERATOR - We use real Paystack API always
# ============================================================
# Removed generate_test_dva() - we always call real API