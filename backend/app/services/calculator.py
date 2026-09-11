"""
Pure calculation service for badminton court session splits.
Clean architecture domain logic with zero framework or database dependencies.
"""

import math

from backend.app.schemas.session import (
    SessionCalculationRequest,
    SessionCalculationResponse,
)


def round_up_to_1000(amount: float) -> float:
    """
    Rounds a VND monetary amount up to the nearest multiple of 1.000 VND.
    e.g. 35100.0 -> 36000.0, 35000.0 -> 35000.0, 0.0 -> 0.0.
    """
    if amount <= 0 or not math.isfinite(amount):
        return 0.0
    return float(math.ceil(amount / 1000.0) * 1000.0)


def calculate_session_split(req: SessionCalculationRequest) -> SessionCalculationResponse:
    """
    Calculates per player fees, total expenses, collected amount, and buffer.
    """
    court_fee = max(0.0, float(req.court_fee))
    if req.shuttlecock_fee is not None and req.shuttlecock_fee >= 0:
        shuttlecock_fee = float(req.shuttlecock_fee)
    else:
        unit_price = max(0.0, float(req.shuttlecock_unit_price))
        shuttlecock_fee = max(0.0, float(req.shuttlecock_count)) * unit_price

    total_expenses = court_fee + shuttlecock_fee
    male_count = max(0, int(req.male_count))
    female_count = max(0, int(req.female_count))
    total_participants = male_count + female_count

    if total_participants == 0 or total_expenses == 0.0:
        return SessionCalculationResponse(
            total_expenses=total_expenses,
            court_fee=court_fee,
            shuttlecock_fee=shuttlecock_fee,
            total_participants=total_participants,
            male_count=male_count,
            female_count=female_count,
            split_mode=req.split_mode,
            male_fee=0.0,
            female_fee=0.0,
            early_fee=None,
            stay_fee=None,
            early_count=None,
            stay_count=None,
            total_collected=0.0,
            fund_buffer=0.0,
        )

    male_fee = 0.0
    female_fee = 0.0
    early_fee: float | None = None
    stay_fee: float | None = None
    early_count: int | None = None
    stay_count: int | None = None

    if req.split_mode == "even":
        raw_fee = total_expenses / total_participants
        fee = round_up_to_1000(raw_fee)
        male_fee = fee if male_count > 0 else 0.0
        female_fee = fee if female_count > 0 else 0.0
        total_collected = (male_count * male_fee) + (female_count * female_fee)

    elif req.split_mode == "fixed_female_discount":
        discount = max(0.0, float(req.female_discount or 0.0))
        if female_count == 0 or discount == 0.0:
            fee = round_up_to_1000(total_expenses / total_participants)
            male_fee = fee if male_count > 0 else 0.0
            female_fee = fee if female_count > 0 else 0.0
        elif male_count == 0:
            fee = round_up_to_1000(total_expenses / female_count)
            male_fee = 0.0
            female_fee = fee
        else:
            raw_female_base = (total_expenses - (female_count * discount)) / total_participants
            female_fee = max(0.0, round_up_to_1000(raw_female_base))
            male_fee = female_fee + discount
        total_collected = (male_count * male_fee) + (female_count * female_fee)

    elif req.split_mode == "fixed_female":
        fixed_fee = max(0.0, float(req.fixed_female_fee or 0.0))
        if female_count == 0:
            male_fee = round_up_to_1000(total_expenses / male_count)
            female_fee = 0.0
        elif male_count == 0:
            male_fee = 0.0
            if fixed_fee > 0.0:
                female_fee = fixed_fee
            else:
                female_fee = round_up_to_1000(total_expenses / female_count)
        else:
            female_fee = fixed_fee
            remaining_expenses = max(0.0, total_expenses - (female_count * fixed_fee))
            male_fee = round_up_to_1000(remaining_expenses / male_count)
        total_collected = (male_count * male_fee) + (female_count * female_fee)

    elif req.split_mode == "multi_stage":
        early_config = req.early_leaver_config
        early_cnt = max(0, int(early_config.count)) if early_config else 0
        early_count = min(total_participants - 1, early_cnt)
        stay_count = total_participants - early_count

        if early_count == 0 or stay_count == 0:
            fee = round_up_to_1000(total_expenses / total_participants)
            male_fee = fee if male_count > 0 else 0.0
            female_fee = fee if female_count > 0 else 0.0
            early_fee = fee
            stay_fee = fee
        else:
            ratio1 = min(1.0, max(0.0, float(early_config.stage1_ratio if early_config else 0.5)))
            stage1_court_cost = court_fee * ratio1

            if early_config and early_config.stage1_shuttle_fee is not None:
                stage1_shuttle_cost = float(early_config.stage1_shuttle_fee)
            elif early_config and early_config.stage1_shuttlecocks is not None:
                u_price = max(0.0, float(req.shuttlecock_unit_price))
                stage1_shuttle_cost = float(early_config.stage1_shuttlecocks) * u_price
            else:
                stage1_shuttle_cost = shuttlecock_fee * ratio1

            cost1 = stage1_court_cost + stage1_shuttle_cost
            cost2 = max(0.0, total_expenses - cost1)

            early_fee = round_up_to_1000(cost1 / total_participants)
            stay_fee = early_fee + round_up_to_1000(cost2 / stay_count)

            male_fee = stay_fee
            female_fee = stay_fee

        total_collected = (early_count * (early_fee or 0.0)) + (stay_count * (stay_fee or 0.0))

    else:
        # Fallback
        fee = round_up_to_1000(total_expenses / total_participants)
        male_fee = fee if male_count > 0 else 0.0
        female_fee = fee if female_count > 0 else 0.0
        total_collected = (male_count * male_fee) + (female_count * female_fee)

    fund_buffer = total_collected - total_expenses

    return SessionCalculationResponse(
        total_expenses=total_expenses,
        court_fee=court_fee,
        shuttlecock_fee=shuttlecock_fee,
        total_participants=total_participants,
        male_count=male_count,
        female_count=female_count,
        split_mode=req.split_mode,
        male_fee=male_fee,
        female_fee=female_fee,
        early_fee=early_fee,
        stay_fee=stay_fee,
        early_count=early_count,
        stay_count=stay_count,
        total_collected=total_collected,
        fund_buffer=fund_buffer,
    )
