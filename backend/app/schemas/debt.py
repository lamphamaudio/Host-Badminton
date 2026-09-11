import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DebtRecordBase(BaseModel):
    member_id: uuid.UUID
    session_id: uuid.UUID | None = None
    amount_owed: float = Field(..., gt=0)
    amount_paid: float = Field(default=0.0, ge=0)
    status: Literal["unpaid", "partially_paid", "settled", "forgiven"] = "unpaid"
    settled_at: datetime | None = None
    note: str | None = None


class DebtRecordCreate(DebtRecordBase):
    pass


class DebtRecordUpdate(BaseModel):
    amount_paid: float | None = Field(default=None, ge=0)
    status: Literal["unpaid", "partially_paid", "settled", "forgiven"] | None = None
    settled_at: datetime | None = None
    note: str | None = None


class DebtRecordResponse(DebtRecordBase):
    id: uuid.UUID
    host_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
