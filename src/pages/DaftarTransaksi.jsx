import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DaftarTransaksi({ navigate }) {
  const [transaksiList, setTransaksiList] = useState([])
  const [filterStatus, setFilterStatus] = useState('Semua')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadTransaksi() }, [filterStatus])

  const loadTransaksi = async () => {
    let q = supabase.from('transaksi').select(`*, pelanggan:pelanggan_id(nama, no_hp)`)
      .order('created_at', { ascending: false })
    if (filterStatus !== 'Semua') q = q.eq('status', filterStatus)
    const { data } = await q
    setTransaksiList(data || [])
    setLoading(false)
  }

  const formatHarga = (a) => 'Rp ' + Number(a).toLocaleString('id-ID')
  const formatTanggal = (d) => d ? new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'
  const getBadgeClass = (s) => ({ Draft: 'badge-draft', Booking: 'badge-booking', Aktif: 'badge-aktif', Selesai: 'badge-selesai' })[s] || 'badge-draft'

  return (
    <div>
      <div className="page-header">
        <h1>Riwayat Transaksi</h1>
      </div>

      <div className="filter-bar">
        {['Semua', 'Draft', 'Booking', 'Aktif', 'Selesai'].map(s => (
          <button key={s} className={`filter-chip ${filterStatus === s ? 'active' : ''}`}
            onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
      </div>

      {loading ? <div className="loading">Memuat...</div> :
        transaksiList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>Tidak ada transaksi</p>
          </div>
        ) : transaksiList.map(t => (
          <div key={t.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{t.pelanggan?.nama || 'Belum ada pelanggan'}</div>
                <div style={{ fontSize: 12, color: 'var(--abu)' }}>{t.pelanggan?.no_hp}</div>
              </div>
              <span className={`badge ${getBadgeClass(t.status)}`}>{t.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <div>
                <div style={{ color: 'var(--abu)' }}>Ambil: {formatTanggal(t.jadwal_ambil)}</div>
                <div style={{ color: 'var(--abu)' }}>Kembali: {formatTanggal(t.jadwal_kembali)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--hijau)' }}>{formatHarga(t.total_bayar)}</div>
                <div style={{ fontSize: 12, color: 'var(--merah)' }}>Sisa: {formatHarga(t.sisa_bayar)}</div>
              </div>
            </div>
          </div>
        ))
      }
    </div>
  )
}
