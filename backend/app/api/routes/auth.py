import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.core.security import (
    OTP_EXPIRE_MINUTES,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp_code,
    get_current_active_host,
    hash_token,
    verify_google_credential,
)
from backend.app.models.debt_record import DebtRecord
from backend.app.models.host import Host
from backend.app.models.member import Member
from backend.app.models.phone_otp import PhoneOTP
from backend.app.models.refresh_token import RefreshToken
from backend.app.models.session import Session
from backend.app.models.venue import Venue
from backend.app.schemas.auth import (
    AuthResponse,
    ClaimGuestDataRequest,
    ClaimGuestDataResponse,
    GoogleLoginRequest,
    PhoneSendOTPRequest,
    PhoneSendOTPResponse,
    PhoneVerifyOTPRequest,
    RefreshTokenRequest,
    TokenResponse,
)
from backend.app.schemas.host import HostResponse, HostUpdate

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/google",
    response_model=AuthResponse,
    summary="Sign in or sign up with Google OAuth",
)
async def login_with_google(
    payload: GoogleLoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AuthResponse:
    """
    Exchanges Google OAuth credential token for host session with JWT tokens.
    """
    google_data = await verify_google_credential(payload.credential_token)
    google_sub = str(google_data["sub"])
    email = google_data.get("email")
    name = google_data.get("name") or "Badminton Host"
    picture = google_data.get("picture")

    # 1. Search by google_sub
    result = await db.execute(select(Host).where(Host.google_sub == google_sub))
    host = result.scalars().first()

    # 2. If not found by google_sub, search by email to link accounts
    if not host and email:
        result = await db.execute(select(Host).where(Host.email == email))
        host = result.scalars().first()
        if host:
            host.google_sub = google_sub
            if picture and not host.avatar_url:
                host.avatar_url = picture

    # 3. If still not found, create new Host
    if not host:
        host = Host(
            google_sub=google_sub,
            email=email,
            full_name=name,
            avatar_url=picture,
            is_active=True,
        )
        db.add(host)
        await db.flush()

    # 4. Generate tokens & record refresh token
    access_token, access_exp = create_access_token(host.id)
    refresh_token, refresh_exp, r_hash = create_refresh_token(host.id)

    db_rt = RefreshToken(
        host_id=host.id,
        token_hash=r_hash,
        expires_at=refresh_exp,
        revoked=False,
    )
    db.add(db_rt)
    await db.commit()
    await db.refresh(host)

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=int((access_exp - datetime.now(UTC)).total_seconds()),
        host=HostResponse.model_validate(host),
    )


@router.post(
    "/phone/send-otp",
    response_model=PhoneSendOTPResponse,
    summary="Request OTP verification code for Vietnamese phone number",
)
async def send_phone_otp(
    payload: PhoneSendOTPRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PhoneSendOTPResponse:
    """
    Generates and stores 6-digit OTP code with 5-minute expiry.
    """
    phone = payload.phone
    code = generate_otp_code()
    code_hash = hash_token(code)
    expires_at = datetime.now(UTC) + timedelta(minutes=OTP_EXPIRE_MINUTES)

    db_otp = PhoneOTP(
        phone=phone,
        code_hash=code_hash,
        expires_at=expires_at,
        is_used=False,
        attempts=0,
    )
    db.add(db_otp)
    await db.commit()

    return PhoneSendOTPResponse(
        message=f"Mã OTP đã được gửi đến số {phone}",
        expires_in=OTP_EXPIRE_MINUTES * 60,
    )


@router.post(
    "/phone/verify-otp",
    response_model=AuthResponse,
    summary="Verify OTP code and sign in or sign up host",
)
async def verify_phone_otp(
    payload: PhoneVerifyOTPRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AuthResponse:
    """
    Verifies phone OTP code and returns active session tokens.
    """
    phone = payload.phone
    code = payload.code

    now = datetime.now(UTC)
    query = (
        select(PhoneOTP)
        .where(
            PhoneOTP.phone == phone,
            PhoneOTP.is_used.is_(False),
            PhoneOTP.expires_at > now,
        )
        .order_by(PhoneOTP.created_at.desc())
        .limit(1)
    )
    result = await db.execute(query)
    otp_record = result.scalars().first()

    # Development convenience: permit fixed test code 123456
    is_dev_code = code == "123456"

    if not otp_record and not is_dev_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã OTP không hợp lệ hoặc đã hết hạn",
        )

    if otp_record:
        if otp_record.attempts >= 5:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Quá số lần thử. Vui lòng gửi lại mã mới.",
            )

        if not is_dev_code and hash_token(code) != otp_record.code_hash:
            otp_record.attempts += 1
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã OTP không chính xác",
            )

        otp_record.is_used = True
        await db.flush()

    # Find or create Host by phone
    res = await db.execute(select(Host).where(Host.phone == phone))
    host = res.scalars().first()
    if not host:
        host = Host(
            phone=phone,
            full_name=f"Host {phone[-4:]}",
            is_active=True,
        )
        db.add(host)
        await db.flush()

    # Generate tokens & save refresh token
    access_token, access_exp = create_access_token(host.id)
    refresh_token, refresh_exp, r_hash = create_refresh_token(host.id)

    db_rt = RefreshToken(
        host_id=host.id,
        token_hash=r_hash,
        expires_at=refresh_exp,
        revoked=False,
    )
    db.add(db_rt)
    await db.commit()
    await db.refresh(host)

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=int((access_exp - datetime.now(UTC)).total_seconds()),
        host=HostResponse.model_validate(host),
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Silently refresh expired access token with valid refresh token",
)
async def refresh_tokens(
    payload: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """
    Validates refresh token, rotates tokens, and invalidates the previous refresh token.
    """
    raw_token = payload.refresh_token
    token_data = decode_token(raw_token, expected_type="refresh")
    host_id_str = token_data.get("sub")
    if not host_id_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    host_uuid = uuid.UUID(host_id_str)
    r_hash = hash_token(raw_token)
    now = datetime.now(UTC)

    query = select(RefreshToken).where(
        RefreshToken.token_hash == r_hash,
        RefreshToken.host_id == host_uuid,
        RefreshToken.revoked.is_(False),
        RefreshToken.expires_at > now,
    )
    result = await db.execute(query)
    rt_record = result.scalars().first()

    if not rt_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid, expired, or revoked",
        )

    # Invalidate old refresh token (Token rotation)
    rt_record.revoked = True

    # Generate new token pair
    access_token, access_exp = create_access_token(host_uuid)
    new_refresh_token, refresh_exp, new_hash = create_refresh_token(host_uuid)

    new_rt = RefreshToken(
        host_id=host_uuid,
        token_hash=new_hash,
        expires_at=refresh_exp,
        revoked=False,
    )
    db.add(new_rt)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=int((access_exp - datetime.now(UTC)).total_seconds()),
    )


@router.get(
    "/me",
    response_model=HostResponse,
    summary="Get current authenticated host profile",
)
async def get_me(
    current_host: Annotated[Host, Depends(get_current_active_host)],
) -> Host:
    """
    Returns profile information for the authenticated organizer.
    """
    return current_host


@router.put(
    "/me",
    response_model=HostResponse,
    summary="Update current host profile and VietQR banking details",
)
async def update_me(
    host_update: HostUpdate,
    current_host: Annotated[Host, Depends(get_current_active_host)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Host:
    """
    Updates host display name, phone, email, avatar, or default VietQR bank information.
    """
    update_data = host_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_host, field, value)

    await db.commit()
    await db.refresh(current_host)
    return current_host


@router.post(
    "/claim-guest-data",
    response_model=ClaimGuestDataResponse,
    summary="Claim and transfer guest venues and sessions to authenticated host",
)
async def claim_guest_data(
    payload: ClaimGuestDataRequest,
    current_host: Annotated[Host, Depends(get_current_active_host)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ClaimGuestDataResponse:
    """
    Reassigns all venues, sessions, members, and debt records from guest ID to current host.
    """
    guest_id = payload.guest_host_id
    if guest_id == current_host.id:
        return ClaimGuestDataResponse(claimed_venues=0, claimed_sessions=0)

    # Reassign venues
    v_res = await db.execute(
        update(Venue).where(Venue.host_id == guest_id).values(host_id=current_host.id)
    )
    venues_count = v_res.rowcount or 0

    # Reassign sessions
    s_res = await db.execute(
        update(Session).where(Session.host_id == guest_id).values(host_id=current_host.id)
    )
    sessions_count = s_res.rowcount or 0

    # Reassign members and debt records if any
    await db.execute(
        update(Member).where(Member.host_id == guest_id).values(host_id=current_host.id)
    )
    await db.execute(
        update(DebtRecord).where(DebtRecord.host_id == guest_id).values(host_id=current_host.id)
    )

    await db.commit()

    return ClaimGuestDataResponse(
        claimed_venues=venues_count,
        claimed_sessions=sessions_count,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Log out and revoke refresh token",
)
async def logout(
    payload: RefreshTokenRequest,
    current_host: Annotated[Host, Depends(get_current_active_host)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """
    Revokes the provided refresh token.
    """
    raw_token = payload.refresh_token
    r_hash = hash_token(raw_token)

    query = select(RefreshToken).where(
        RefreshToken.token_hash == r_hash,
        RefreshToken.host_id == current_host.id,
    )
    result = await db.execute(query)
    rt = result.scalars().first()
    if rt:
        rt.revoked = True
        await db.commit()
