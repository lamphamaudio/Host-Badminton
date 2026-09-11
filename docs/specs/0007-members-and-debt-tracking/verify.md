# Verify: Members and debt tracking · spec 0007 · updated 2026-09-11
_Steps derived from spec 0007 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [x] Open "Thành viên" navigation tab → expect member list with search bar, active filter, and Add Member button → AC-1
- [x] Click Add Member button, enter name ("Trần Văn Nam"), phone ("0912345678"), select gender Male, click Save → expect member card in roster with 0 VND debt badge → AC-1
- [x] Switch to "Tính tiền" calculator tab → expect frequent member quick pick chips in player count section → AC-2
- [x] Tap member chip "Trần Văn Nam" → expect participant added with name pre-filled and male count updated → AC-2
- [x] Calculate split and click Save Session with "Trần Văn Nam" toggled as Unpaid → expect session saved and DebtRecord created with member balance updated → AC-3
- [x] Switch back to "Thành viên" tab and tap "Trần Văn Nam" card → expect member detail drawer showing attended session and outstanding debt → AC-4
- [x] Click "Ghi nhận thanh toán" (Settle Debt) button in drawer, enter payment amount (e.g. 50,000 VND), click Confirm → expect debt settled via FIFO and remaining balance updated → AC-5
- [x] Click "Sao chép tin nhắn nhắc nợ" (Copy Debt Reminder) → expect pre-formatted reminder text with VietQR payment link copied to clipboard → AC-6

## Commands
- [x] `PYTHONPATH=. backend/.venv/bin/pytest backend/tests/test_members_api.py` → all member CRUD, debt listing, FIFO settlement, and session debt creation tests pass → AC-1, AC-3, AC-4, AC-5, AC-7
- [x] `npm test --prefix frontend` → all MemberManagementView, MemberDetailDrawer, CalculatorQuickPick, and SettleDebtModal tests pass → AC-1, AC-2, AC-4, AC-5, AC-6
- [x] `npm run build --prefix frontend` → TypeScript type check and Vite production build pass cleanly → AC-1, AC-2, AC-4, AC-5, AC-6

## Value sourcing coverage
- Member roster persistence: Member attributes saved in database and retrieved by host ID → verified by `test_member_crud_lifecycle`
- Calculator quick pick: Roster member name and gender mapped to session participant state → verified by component unit tests
- Automatic session debt creation: Unpaid participant fees converted into `DebtRecord` items → verified by `test_session_unpaid_participant_creates_debt`
- FIFO debt settlement: Payment amounts allocated across oldest pending debts → verified by `test_fifo_debt_settlement`
- VietQR reminder generation: Dynamic VietQR quick link generated with exact member debt amount → verified by `test_vietqr_debt_reminder`

## Acceptance criteria coverage
- AC-1 Member roster CRUD covered by UI step 2 and test `test_member_crud_lifecycle`
- AC-2 Calculator quick pick covered by UI steps 3 and 4
- AC-3 Automatic session debt creation covered by UI step 5 and test `test_session_unpaid_participant_creates_debt`
- AC-4 Member detail and debt summary covered by UI step 6 and test `test_member_detail_and_debt_summary`
- AC-5 Payment and FIFO debt settlement covered by UI step 7 and test `test_fifo_debt_settlement`
- AC-6 VietQR debt reminder generator covered by UI step 8
- AC-7 Multi tenant and guest scoping covered by test `test_members_and_debt_tenant_isolation`
