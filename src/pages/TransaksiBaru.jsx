import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function TransaksiBaru({ navigate, setTransaksiAktif }) {
  const [form, setForm] = useState({
    status: 'Aktif',
    jadwal_ambil: new Date().toISOString().slice(0, 16),
    durasi_hari: 1,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const hitungJadwalKembali = () => {
    if (!form.jadwal_ambil || !form.durasi_hari) return '-'
    const ambil = new Date(form.jadwal_ambil)
    ambil.setDate(ambil.getDate() + parseInt(form.durasi_hari))
    return ambil.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const handleSubmit = async () => {
    if (!form.jadwal_ambil || !form.durasi_hari) {
      setError('Jadwal ambil dan durasi wajib diisi')
      return
    }
    setLoading(true)
    setError('')

    const jadwal_ambil = new Date(form.jadwal_ambil)
    const jadwal_kembali = new Date(jadwal_ambil)
    jadwal_kembali.setDate(jadwal_kembali.getDate() + parseInt(form.durasi_hari))

    const { data, error: err } = await supabase
      .from('transaksi')
      .insert({
        status: form.status,
        jadwal_ambil: jadwal_ambil.toISOString(),
        durasi_hari: parseInt(form.durasi_hari),
        jadwal_kembali: jadwal_kembali.toISOString(),
        total_biaya_sewa: 0,
        total_biaya_jual: 0,
        denda: 0,
        total_bayar: 0,
        dp: 0,
        sisa_bayar: 0,
      })
      .select()
      .single()

    if (err) {
      setError('Gagal membuat transaksi: ' + err.message)
      setLoading(false)
      return
    }

    setTransaksiAktif(data)
    navigate('pos', data)
    setLoading(false)
  }

  return (
    <div>
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('dashboard')}>←</button>
        <h1>Transaksi Baru</h1>
      </div>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Tipe Transaksi</label>
          <select
            className="form-select"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <option value="Aktif">Datang Langsung</option>
            <option value="Booking">Booking</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Jadwal Ambil</label>
          <input
            className="form-input"
            type="datetime-local"
            name="jadwal_ambil"
            value={form.jadwal_ambil}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Durasi Sewa (Hari)</label>
          <input
            className="form-input"
            type="number"
            name="durasi_hari"
            value={form.durasi_hari}
            onChange={handleChange}
            min="1"
          />
        </div>

        <div className="card" style={{ background: 'var(--abu-muda)', marginBottom: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--abu)', marginBottom: 4 }}>Estimasi Jadwal Kembali</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--hijau)' }}>
            {hitungJadwalKembali()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--abu)', marginTop: 4 }}>
            + Toleransi keterlambatan 5 jam
          </div>
        </div>

        {error && (
          <div style={{ color: 'var(--merah)', fontSize: 14, marginTop: 12 }}>{error}</div>
        )}

        <button
          className="btn btn-primary btn-full btn-lg"
          style={{ marginTop: 20 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Memproses...' : 'Lanjut Pilih Produk →'}
        </button>
      </div>
    </div>
  )
}
