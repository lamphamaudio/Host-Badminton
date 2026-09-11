# Verify: Core calculator and VietQR bill · spec 0004 · updated 2026-09-10

_Steps derived from spec 0004 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] Open mobile calculator at `/` → adjust court fee to 200.000 VND and 8 shuttles at 20.000 VND with 6 males and 4 females in even split mode → expect 36.000 VND per person displayed instantly → AC-1, AC-2
- [ ] Select female discount split mode with 10.000 VND discount → expect male fee 42.000 VND and female fee 32.000 VND displayed reactively → AC-1, AC-2
- [ ] Select fixed female fee mode with 30.000 VND fixed fee → expect female fee 30.000 VND and male fee 40.000 VND displayed reactively → AC-1, AC-2
- [ ] Select two stage early leaver mode with 2 early leavers, 50% court time, and 4 shuttlecocks → expect early leaver fee 18.000 VND and stayer fee 41.000 VND → AC-1, AC-2
- [ ] Tap "STK VietQR" button → select MB Bank (`970422`), enter STK `0987654321`, account name `PHAM TRAN LAM`, and memo `SAN KY HOA` → tap "Lưu tài khoản" → expect toast confirmation and bank info saved → AC-3, AC-4
- [ ] Reload the browser page → expect entered court fee, shuttlecock quantity, player counts, split mode, and host bank details restored automatically from local storage → AC-4
- [ ] Tap "Xem hóa đơn & Mã VietQR" → expect bottom sheet drawer to open with dark sport card preview containing court name, session datetime, costs, player splits, and scan ready VietQR code → AC-5
- [ ] Tap "Chép hóa đơn" button → expect toast confirmation and clipboard text formatted with emojis ready for Zalo/Messenger → AC-6
- [ ] Tap "Tải ảnh bill" button → expect browser to download clean 4:5 PNG graphic of the bill card → AC-7

## Commands

- [x] `npm test` in `frontend` → all 54 vitest unit, formatters, storage, vietqr, and component tests pass clean → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6
- [x] `npm run build` in `frontend` → TypeScript typecheck and Vite production bundle compile with zero errors → AC-2, AC-5
- [x] `npm run lint` in `frontend` → ESLint passes with zero warnings or errors → AC-2
- [x] `PYTHONPATH=. backend/.venv/bin/pytest backend/tests/` → all 29 pytest calculation, model, schema, and API integration tests pass clean → AC-1, AC-8
- [x] `backend/.venv/bin/ruff check backend/` → Ruff linter reports clean code with zero issues → AC-8

## Acceptance criteria coverage

- **AC-1**: Pure calculation engine formulas for even, discount, fixed fee, and early leavers covered by `frontend/src/lib/calculator.test.ts`, `backend/tests/test_calculator.py`, and UI manual steps.
- **AC-2**: Interactive mobile calculator interface and reactive inputs covered by `frontend/src/components/calculator/CalculatorScreen.test.tsx` and UI manual steps.
- **AC-3**: Bank catalog and VietQR Quicklink generator covered by `frontend/src/lib/vietqr.test.ts`, `backend/tests/test_sessions_api.py`, and UI manual steps.
- **AC-4**: Local storage persistence and auto restore covered by `frontend/src/lib/storage.test.ts` and UI reload manual step.
- **AC-5**: Shareable VietQR bill card preview covered by `frontend/src/components/bill/bill-card-preview.test.tsx` and UI drawer manual step.
- **AC-6**: One tap text summary clipboard copy covered by `frontend/src/components/bill/bill-card-preview.test.tsx` and UI copy step.
- **AC-7**: PNG canvas export covered by `html-to-image` integration in `BillCardPreview` and download button step.
- **AC-8**: FastAPI backend calculation verification and persistence endpoints covered by `backend/tests/test_sessions_api.py` and pytest test suite.
