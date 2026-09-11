import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CourtManagementView } from './CourtManagementView'
import * as api from '@/lib/api'

describe('CourtManagementView component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // covers: AC-1
  it('renders court list and allows filtering by name', async () => {
    const mockVenues: api.Venue[] = [
      {
        id: 'v1',
        host_id: 'h1',
        name: 'Sân Cầu Lông Kỳ Hòa',
        address: '238 Ba Tháng Hai',
        court_number: 'Sân 3',
        default_court_rate: 150000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'v2',
        host_id: 'h1',
        name: 'Sân Thống Nhất',
        address: 'Quận 10',
        court_number: 'Sân 1',
        default_court_rate: 120000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    vi.spyOn(api, 'fetchVenues').mockResolvedValue(mockVenues)

    render(<CourtManagementView />)

    expect(screen.getByText('Sân Cầu Lông')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Sân Cầu Lông Kỳ Hòa')).toBeInTheDocument()
      expect(screen.getByText('Sân Thống Nhất')).toBeInTheDocument()
    })

    // Search filter
    const searchInput = screen.getByPlaceholderText('Tìm kiếm sân theo tên, địa chỉ...')
    fireEvent.change(searchInput, { target: { value: 'Kỳ Hòa' } })

    expect(screen.getByText('Sân Cầu Lông Kỳ Hòa')).toBeInTheDocument()
    expect(screen.queryByText('Sân Thống Nhất')).not.toBeInTheDocument()
  })

  // covers: AC-1
  it('displays empty state when no venues exist', async () => {
    vi.spyOn(api, 'fetchVenues').mockResolvedValue([])

    render(<CourtManagementView />)

    await waitFor(() => {
      expect(screen.getByText('Chưa có sân nào được lưu')).toBeInTheDocument()
      expect(screen.getByText('Thêm sân đầu tiên')).toBeInTheDocument()
    })
  })
})
