from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/banks", tags=["Banks"])


class BankInfoResponse(BaseModel):
    bin: str
    short_name: str
    name: str


VIETNAM_BANKS_CATALOG: list[BankInfoResponse] = [
    BankInfoResponse(bin="970422", short_name="MB Bank", name="Ngân hàng Quân Đội"),
    BankInfoResponse(
        bin="970436", short_name="Vietcombank", name="Ngân hàng Ngoại Thương Việt Nam"
    ),
    BankInfoResponse(
        bin="970407", short_name="Techcombank", name="Ngân hàng Kỹ Thương Việt Nam"
    ),
    BankInfoResponse(
        bin="970415", short_name="VietinBank", name="Ngân hàng Công Thương Việt Nam"
    ),
    BankInfoResponse(
        bin="970418", short_name="BIDV", name="Ngân hàng Đầu tư và Phát triển Việt Nam"
    ),
    BankInfoResponse(bin="970416", short_name="ACB", name="Ngân hàng Á Châu"),
    BankInfoResponse(
        bin="970432", short_name="VPBank", name="Ngân hàng Việt Nam Thịnh Vượng"
    ),
    BankInfoResponse(bin="970423", short_name="TPBank", name="Ngân hàng Tiên Phong"),
    BankInfoResponse(
        bin="970403", short_name="Sacombank", name="Ngân hàng Sài Gòn Thương Tín"
    ),
    BankInfoResponse(bin="970441", short_name="VIB", name="Ngân hàng Quốc Tế Việt Nam"),
    BankInfoResponse(bin="970448", short_name="OCB", name="Ngân hàng Phương Đông"),
    BankInfoResponse(bin="970443", short_name="SHB", name="Ngân hàng Sài Gòn Hà Nội"),
    BankInfoResponse(
        bin="970437", short_name="HDBank", name="Ngân hàng Phát triển TP.HCM"
    ),
    BankInfoResponse(
        bin="970426", short_name="MSB", name="Ngân hàng Hàng Hải Việt Nam"
    ),
    BankInfoResponse(bin="970440", short_name="SeABank", name="Ngân hàng Đông Nam Á"),
    BankInfoResponse(bin="546034", short_name="Cake", name="Cake by VPBank"),
    BankInfoResponse(bin="963388", short_name="Timo", name="Ngân hàng số Timo"),
]


@router.get(
    "",
    response_model=list[BankInfoResponse],
    summary="Get list of supported Vietnamese banks for VietQR",
)
async def get_banks() -> list[BankInfoResponse]:
    return VIETNAM_BANKS_CATALOG
