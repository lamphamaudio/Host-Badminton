import uuid
from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# --- Session Expense Schemas ---
class SessionExpenseBase(BaseModel):
    category: str = Field(..., max_length=50)  # court, shuttlecock, drink, other
    item_name: str = Field(..., min_length=1, max_length=100)
    quantity: float = Field(default=1.0, gt=0)
    unit_price: float = Field(..., ge=0)
    total_amount: float = Field(..., ge=0)


class SessionExpenseCreate(SessionExpenseBase):
    pass


class SessionExpenseResponse(SessionExpenseBase):
    id: uuid.UUID
    session_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Session Participant Schemas ---
class SessionParticipantBase(BaseModel):
    member_id: uuid.UUID | None = None
    display_name: str = Field(..., min_length=1, max_length=100)
    gender: Literal["male", "female"] = "male"
    play_stage: Literal["full", "early_leaver", "stayer", "custom"] = "full"
    custom_fee_override: float | None = Field(default=None, ge=0)
    calculated_fee: float = Field(default=0.0, ge=0)
    is_paid: bool = False
    paid_amount: float = Field(default=0.0, ge=0)
    payment_method: Literal["vietqr", "cash", "transfer", "other"] | None = None
    paid_at: datetime | None = None
    note: str | None = None


class SessionParticipantCreate(SessionParticipantBase):
    pass


class SessionParticipantUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=100)
    gender: Literal["male", "female"] | None = None
    play_stage: Literal["full", "early_leaver", "stayer", "custom"] | None = None
    custom_fee_override: float | None = Field(default=None, ge=0)
    calculated_fee: float | None = Field(default=None, ge=0)
    is_paid: bool | None = None
    paid_amount: float | None = Field(default=None, ge=0)
    payment_method: Literal["vietqr", "cash", "transfer", "other"] | None = None
    paid_at: datetime | None = None
    note: str | None = None


class SessionParticipantResponse(SessionParticipantBase):
    id: uuid.UUID
    session_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Session Schemas ---
class SessionBase(BaseModel):
    venue_id: uuid.UUID | None = None
    session_date: date
    start_time: time | None = None
    end_time: time | None = None
    status: Literal["draft", "active", "completed", "cancelled"] = "draft"
    court_fee: float = Field(default=0.0, ge=0)
    shuttlecock_fee: float = Field(default=0.0, ge=0)
    shuttlecock_count: int | None = Field(default=None, ge=0)
    shuttlecock_unit_price: float | None = Field(default=None, ge=0)
    total_expenses: float = Field(default=0.0, ge=0)
    gender_split_mode: Literal["equal", "fixed_female", "fixed_male"] = "equal"
    fixed_female_fee: float | None = Field(default=None, ge=0)
    fixed_male_fee: float | None = Field(default=None, ge=0)
    is_multi_stage: bool = False
    stage1_cost: float = Field(default=0.0, ge=0)
    stage2_cost: float = Field(default=0.0, ge=0)
    bank_bin: str | None = Field(default=None, max_length=20)
    bank_account_number: str | None = Field(default=None, max_length=50)
    bank_account_name: str | None = Field(default=None, max_length=100)
    vietqr_memo: str | None = Field(default=None, max_length=255)
    note: str | None = None


class SessionCreate(SessionBase):
    expenses: list[SessionExpenseCreate] = []
    participants: list[SessionParticipantCreate] = []


class SessionUpdate(BaseModel):
    venue_id: uuid.UUID | None = None
    session_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    status: Literal["draft", "active", "completed", "cancelled"] | None = None
    court_fee: float | None = Field(default=None, ge=0)
    shuttlecock_fee: float | None = Field(default=None, ge=0)
    shuttlecock_count: int | None = Field(default=None, ge=0)
    shuttlecock_unit_price: float | None = Field(default=None, ge=0)
    total_expenses: float | None = Field(default=None, ge=0)
    gender_split_mode: Literal["equal", "fixed_female", "fixed_male"] | None = None
    fixed_female_fee: float | None = Field(default=None, ge=0)
    fixed_male_fee: float | None = Field(default=None, ge=0)
    is_multi_stage: bool | None = None
    stage1_cost: float | None = Field(default=None, ge=0)
    stage2_cost: float | None = Field(default=None, ge=0)
    bank_bin: str | None = Field(default=None, max_length=20)
    bank_account_number: str | None = Field(default=None, max_length=50)
    bank_account_name: str | None = Field(default=None, max_length=100)
    vietqr_memo: str | None = Field(default=None, max_length=255)
    note: str | None = None


class SessionResponse(SessionBase):
    id: uuid.UUID
    host_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionDetailResponse(SessionResponse):
    expenses: list[SessionExpenseResponse] = []
    participants: list[SessionParticipantResponse] = []


class SessionSummaryResponse(SessionBase):
    id: uuid.UUID
    host_id: uuid.UUID
    venue_name: str | None = None
    participant_count: int = 0
    paid_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionListResponse(BaseModel):
    items: list[SessionSummaryResponse]
    total_count: int
    total_revenue: float
    total_participants: int
    limit: int
    offset: int



# --- Calculation Engine Schemas ---
class EarlyLeaverInput(BaseModel):
    count: int = Field(default=0, ge=0)
    stage1_ratio: float = Field(default=0.5, ge=0.0, le=1.0)
    stage1_shuttlecocks: int | None = Field(default=None, ge=0)
    stage1_shuttle_fee: float | None = Field(default=None, ge=0)


class SessionCalculationRequest(BaseModel):
    court_fee: float = Field(default=0.0, ge=0)
    shuttlecock_fee: float | None = Field(default=None, ge=0)
    shuttlecock_count: int = Field(default=0, ge=0)
    shuttlecock_unit_price: float = Field(default=0.0, ge=0)
    male_count: int = Field(default=0, ge=0)
    female_count: int = Field(default=0, ge=0)
    split_mode: Literal["even", "fixed_female_discount", "fixed_female", "multi_stage"] = "even"
    female_discount: float | None = Field(default=0.0, ge=0)
    fixed_female_fee: float | None = Field(default=0.0, ge=0)
    early_leaver_config: EarlyLeaverInput | None = None


class SessionCalculationResponse(BaseModel):
    total_expenses: float
    court_fee: float
    shuttlecock_fee: float
    total_participants: int
    male_count: int
    female_count: int
    split_mode: str
    male_fee: float
    female_fee: float
    early_fee: float | None = None
    stay_fee: float | None = None
    early_count: int | None = None
    stay_count: int | None = None
    total_collected: float
    fund_buffer: float

