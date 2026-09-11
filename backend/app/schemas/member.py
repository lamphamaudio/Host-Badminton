import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


from backend.app.schemas.debt import DebtRecordResponse


class MemberBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    gender: Literal["male", "female"] = "male"
    default_note: str | None = None
    is_active: bool = True


class MemberCreate(MemberBase):
    pass


class MemberUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    gender: Literal["male", "female"] | None = None
    default_note: str | None = None
    is_active: bool | None = None


class MemberResponse(MemberBase):
    id: uuid.UUID
    host_id: uuid.UUID
    total_debt: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MemberDetailResponse(MemberResponse):
    attended_sessions_count: int = 0
    debt_records: list[DebtRecordResponse] = []


class SettleDebtRequest(BaseModel):
    amount: float = Field(..., gt=0)
    note: str | None = None
    forgive_remainder: bool = False


class SettleDebtResponse(BaseModel):
    member_id: uuid.UUID
    settled_amount: float
    remaining_debt: float
    settled_records_count: int
    note: str | None = None

