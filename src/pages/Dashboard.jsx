import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard({ navigate }) {
  const [stats, setStats] = useState({ aktif: 0, booking: 0, selesaiHariIni: 0, pendapatanHariIni: 0 })
  const [transaksiAktif, setTransaksiAktif] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [aktifRes, bookingRes, selesaiRes, transaksiRes] = await Promise.all([
      supabase.from('transaksi').select('*', { count: 'exact', head: true }).eq('status', 'Aktif'),
      supabase.from('transaksi').select('*', { count: 'exact', head: true }).eq('status', 'Booking'),
      supabase.from('transaksi').select('total_bayar').eq('status', 'Selesai')
        .gte('created_at', today.toISOString()).lt('created_at', tomorrow.toISOString()),
      supabase.from('transaksi').select(`*, pelanggan:pelanggan_id(nama, no_hp)`)
        .in('status', ['Aktif', 'Booking']).order('created_at', { ascending: false }).limit(5),
    ])

    const pendapatan = (selesaiRes.data || []).reduce((a, b) => a + (b.total_bayar || 0), 0)

    setStats({
      aktif: aktifRes.count || 0,
      booking: bookingRes.count || 0,
      selesaiHariIni: selesaiRes.data?.length || 0,
      pendapatanHariIni: pendapatan,
    })
    setTransaksiAktif(transaksiRes.data || [])
    setLoading(false)
  }

  const formatHarga = (a) => 'Rp ' + Number(a).toLocaleString('id-ID')

  const formatTanggal = (d) => d ? new Date(d).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  }) : '-'

  const getBadgeClass = (status) => {
    const map = { Draft: 'badge-draft', Booking: 'badge-booking', Aktif: 'badge-aktif', Selesai: 'badge-selesai' }
    return map[status] || 'badge-draft'
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--abu)' }}>Selamat datang 👋</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--teks)' }}>Rental Outdoor</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Aktif Disewa</div>
          <div className="stat-value">{stats.aktif}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Booking</div>
          <div className="stat-value" style={{ color: 'var(--kuning)' }}>{stats.booking}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Selesai Hari Ini</div>
          <div className="stat-value" style={{ color: 'var(--coklat)' }}>{stats.selesaiHariIni}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendapatan Hari Ini</div>
          <div className="stat-value" style={{ fontSize: 16 }}>{formatHarga(stats.pendapatanHariIni)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Transaksi Aktif</div>
        <button className="btn btn-secondary" style={{ fontSize: 13, padding: '8px 12px', minHeight: 36 }}
          onClick={() => navigate('daftar_transaksi')}>
          Lihat Semua
        </button>
      </div>

      {loading ? (
        <div className="loading">Memuat data...</div>
      ) : transaksiAktif.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>Belum ada transaksi aktif</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('transaksi_baru')}>
            + Transaksi Baru
          </button>
        </div>
      ) : (
        transaksiAktif.map(t => (
          <div key={t.id} className="card" style={{ marginBottom: 12, cursor: 'pointer' }}
            onClick={() => navigate('detail_transaksi', t)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
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
      )}
    </div>
  )
}
