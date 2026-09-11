import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class HostBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    avatar_url: str | None = Field(default=None, max_length=500)
    bank_bin: str | None = Field(default=None, max_length=20)
    bank_name: str | None = Field(default=None, max_length=100)
    bank_account_number: str | None = Field(default=None, max_length=50)
    bank_account_name: str | None = Field(default=None, max_length=100)


class HostCreate(HostBase):
    pass


class HostUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    avatar_url: str | None = Field(default=None, max_length=500)
    bank_bin: str | None = Field(default=None, max_length=20)
    bank_name: str | None = Field(default=None, max_length=100)
    bank_account_number: str | None = Field(default=None, max_length=50)
    bank_account_name: str | None = Field(default=None, max_length=100)


class HostResponse(HostBase):
    id: uuid.UUID
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

