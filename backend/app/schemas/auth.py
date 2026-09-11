import re
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator

from backend.app.schemas.host import HostResponse

# Vietnamese phone numbers: starts with 03, 05, 07, 08, 09, followed by 8 digits (10 digits total)
# Or with international prefix +84
VN_PHONE_REGEX = re.compile(r"^(?:\+84|84|0)(3|5|7|8|9)\d{8}$")


def normalize_vn_phone(phone: str) -> str:
    cleaned = re.sub(r"[\s\-\.]", "", phone)
    if cleaned.startswith("+84"):
        cleaned = "0" + cleaned[3:]
    elif cleaned.startswith("84") and len(cleaned) == 11:
        cleaned = "0" + cleaned[2:]
    return cleaned


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 1800  # 30 minutes in seconds

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(TokenResponse):
    host: HostResponse


class GoogleLoginRequest(BaseModel):
    credential_token: str = Field(..., min_length=1)


class PhoneSendOTPRequest(BaseModel):
    phone: str = Field(..., min_length=9, max_length=20)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        normalized = normalize_vn_phone(v)
        if not VN_PHONE_REGEX.match(normalized):
            raise ValueError("Số điện thoại không hợp lệ (cần 10 số đầu 03, 05, 07, 08, 09)")
        return normalized


class PhoneSendOTPResponse(BaseModel):
    message: str
    expires_in: int = 300  # 5 minutes in seconds


class PhoneVerifyOTPRequest(BaseModel):
    phone: str = Field(..., min_length=9, max_length=20)
    code: str = Field(..., min_length=4, max_length=8)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        normalized = normalize_vn_phone(v)
        if not VN_PHONE_REGEX.match(normalized):
            raise ValueError("Số điện thoại không hợp lệ")
        return normalized


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


class ClaimGuestDataRequest(BaseModel):
    guest_host_id: uuid.UUID


class ClaimGuestDataResponse(BaseModel):
    claimed_venues: int
    claimed_sessions: int
