import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Pelanggan({ navigate }) {
  const [list, setList] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nama: '', no_hp: '', kota: '' })

  useEffect(() => { loadPelanggan() }, [])

  const loadPelanggan = async () => {
    const { data } = await supabase.from('pelanggan').select('*').order('nama')
    setList(data || [])
    setLoading(false)
  }

  const simpan = async () => {
    if (!form.nama || !form.no_hp) return
    await supabase.from('pelanggan').insert(form)
    setShowForm(false)
    setForm({ nama: '', no_hp: '', kota: '' })
    loadPelanggan()
  }

  const filtered = list.filter(p =>
    p.nama.toLowerCase().includes(search.toLowerCase()) ||
    p.no_hp.includes(search)
  )

  return (
    <div>
      <div className="page-header">
        <h1>Pelanggan</h1>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowForm(!showForm)}>
          + Tambah
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Pelanggan Baru</div>
          <div className="form-group">
            <label className="form-label">Nama</label>
            <input className="form-input" placeholder="Nama lengkap" value={form.nama}
              onChange={e => setForm({ ...form, nama: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">No HP</label>
            <input className="form-input" type="tel" placeholder="08xxxxxxxxxx" value={form.no_hp}
              onChange={e => setForm({ ...form, no_hp: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Kota</label>
            <input className="form-input" placeholder="Kota asal" value={form.kota}
              onChange={e => setForm({ ...form, kota: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Batal</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={simpan}>Simpan</button>
          </div>
        </div>
      )}

      <div className="search-wrapper">
        <input type="text" placeholder="Cari nama atau no HP..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loading">Memuat...</div> :
        filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>Belum ada pelanggan</p>
          </div>
        ) : filtered.map(p => (
          <div key={p.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700 }}>{p.nama}</div>
            <div style={{ fontSize: 13, color: 'var(--abu)', marginTop: 4 }}>📱 {p.no_hp}</div>
            {p.kota && <div style={{ fontSize: 13, color: 'var(--abu)' }}>📍 {p.kota}</div>}
          </div>
        ))
      }
    </div>
  )
}
