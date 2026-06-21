import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Produk({ navigate }) {
  const [produkList, setProdukList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nama_produk: '', kategori: '', tipe_produk: 'Sewa', jenis_varian: 'Tanpa Varian', harga: '', aktif: true })

  useEffect(() => { loadProduk() }, [])

  const loadProduk = async () => {
    const { data } = await supabase.from('produk').select('*').order('kategori')
    setProdukList(data || [])
    setLoading(false)
  }

  const simpanProduk = async () => {
    if (!form.nama_produk || !form.harga) return
    await supabase.from('produk').insert({ ...form, harga: Number(form.harga) })
    setShowForm(false)
    setForm({ nama_produk: '', kategori: '', tipe_produk: 'Sewa', jenis_varian: 'Tanpa Varian', harga: '', aktif: true })
    loadProduk()
  }

  const toggleAktif = async (id, aktif) => {
    await supabase.from('produk').update({ aktif: !aktif }).eq('id', id)
    loadProduk()
  }

  const formatHarga = (a) => 'Rp ' + Number(a).toLocaleString('id-ID')

  return (
    <div>
      <div className="page-header">
        <h1>Produk</h1>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowForm(!showForm)}>
          + Tambah
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Produk Baru</div>
          <div className="form-group">
            <label className="form-label">Nama Produk</label>
            <input className="form-input" placeholder="Nama produk" value={form.nama_produk}
              onChange={e => setForm({ ...form, nama_produk: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <input className="form-input" placeholder="Jaket, Tenda, dll" value={form.kategori}
              onChange={e => setForm({ ...form, kategori: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Tipe Produk</label>
            <select className="form-select" value={form.tipe_produk}
              onChange={e => setForm({ ...form, tipe_produk: e.target.value })}>
              <option value="Sewa">Sewa</option>
              <option value="Jual">Jual</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Jenis Varian</label>
            <select className="form-select" value={form.jenis_varian}
              onChange={e => setForm({ ...form, jenis_varian: e.target.value })}>
              <option value="Tanpa Varian">Tanpa Varian</option>
              <option value="Size">Size</option>
              <option value="Warna">Warna</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Harga {form.tipe_produk === 'Sewa' ? '(per hari)' : '(satuan)'}</label>
            <input className="form-input" type="number" placeholder="0" value={form.harga}
              onChange={e => setForm({ ...form, harga: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Batal</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={simpanProduk}>Simpan Produk</button>
          </div>
        </div>
      )}

      {loading ? <div className="loading">Memuat...</div> :
        produkList.map(p => (
          <div key={p.id} className="card" style={{ marginBottom: 12, opacity: p.aktif ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{p.nama_produk}</div>
                <div style={{ fontSize: 12, color: 'var(--abu)' }}>{p.kategori} · {p.tipe_produk} · {p.jenis_varian}</div>
                <div style={{ fontWeight: 700, color: 'var(--hijau)', marginTop: 4 }}>
                  {formatHarga(p.harga)}{p.tipe_produk === 'Sewa' ? '/hari' : ''}
                </div>
              </div>
              <button
                className={`btn ${p.aktif ? 'btn-secondary' : 'btn-primary'}`}
                style={{ fontSize: 12, padding: '6px 12px', minHeight: 36 }}
                onClick={() => toggleAktif(p.id, p.aktif)}
              >
                {p.aktif ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </div>
          </div>
        ))
      }
    </div>
  )
}
