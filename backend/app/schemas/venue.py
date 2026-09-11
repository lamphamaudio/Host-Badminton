import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VenueBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    address: str | None = None
    court_number: str | None = Field(default=None, max_length=50)
    default_court_rate: float | None = Field(default=None, ge=0)
    is_active: bool = True


class VenueCreate(VenueBase):
    pass


class VenueUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    address: str | None = None
    court_number: str | None = Field(default=None, max_length=50)
    default_court_rate: float | None = Field(default=None, ge=0)
    is_active: bool | None = None


class VenueResponse(VenueBase):
    id: uuid.UUID
    host_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
