# Verify: Court and session management · spec 0005 · updated 2026-09-10
_Steps derived from spec 0005 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [x] Navigate to "Sân bãi" tab, click "Thêm sân", enter "Sân Cầu Lông Kỳ Hòa", "Sân 3", "140.000 đ/giờ", save, expect new venue card rendered with name and default rate, verifies AC-1
- [x] Navigate to "Tính tiền" tab, click venue dropdown, select "Sân Cầu Lông Kỳ Hòa", expect hourly rate auto filled to 140.000 đ, verifies AC-2
- [x] Calculate session with 6 male, 4 female players, open "Xem hóa đơn & Lưu lịch sử", click "Lưu buổi chơi vào lịch sử", expect success toast and button state "Đã lưu vào lịch sử", verifies AC-3
- [x] Navigate to "Lịch sử" tab, expect saved session card displayed with date, venue "Sân Cầu Lông Kỳ Hòa", 10 participants, total expenses, verifies AC-4
- [x] Observe summary statistics header in "Lịch sử" tab, expect accurate total sessions count, total revenue sum, and player count, verifies AC-5
- [x] Click on session history card, expect slide over drawer with participant list, individual payment statuses, and VietQR bill card replay, verifies AC-6
- [x] In session detail drawer, click "Nạp vào máy tính", expect redirected to "Tính tiền" tab with past venue, court fee, and player counts loaded into active calculator, verifies AC-7
- [x] Turn off browser network or test offline save, save session, expect offline queued toast, reconnect network, expect automatic synchronization to backend, verifies AC-8

## Commands
- [x] `cd frontend && npm run build` (build succeeds without type errors), verifies AC-1..AC-8
- [x] `cd frontend && npm test -- --run` (all frontend tests pass), verifies AC-1..AC-8
- [x] `PYTHONPATH=. backend/.venv/bin/pytest backend/tests/` (all backend venue and session tests pass), verifies AC-1, AC-4, AC-5


## Acceptance criteria coverage
- AC-1: covered by venue creation, listing, editing, and soft deletion tests and UI verification
- AC-2: covered by calculator venue quick select and auto fill tests
- AC-3: covered by session persistence endpoint and Save Session button action
- AC-4: covered by session history paginated query and date/venue filter tests
- AC-5: covered by session history summary statistics aggregations
- AC-6: covered by session detail drawer inspector and VietQR bill replay
- AC-7: covered by calculator session replay action
- AC-8: covered by offline queue manager and online reconnect listener
