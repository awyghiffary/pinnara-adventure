import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Checkout({ navigate, transaksi, setTransaksiAktif }) {
  const [form, setForm] = useState({
    pelanggan_search: '',
    pelanggan_id: null,
    pelanggan_nama: '',
    jenis_jaminan: 'KTP',
    nomor_jaminan: '',
    nama_jaminan: '',
    dp: 0,
    catatan: '',
  })
  const [pelangganSuggestions, setPelangganSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showFormBaru, setShowFormBaru] = useState(false)
  const [pelangganBaru, setPelangganBaru] = useState({ nama: '', no_hp: '', kota: '' })
  const [keranjang, setKeranjang] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('identitas')

  useEffect(() => { loadKeranjang() }, [transaksi])

  const loadKeranjang = async () => {
    if (!transaksi?.id) return
    const { data } = await supabase.from('keranjang').select('*').eq('transaksi_id', transaksi.id)
    setKeranjang(data || [])
  }

  const searchPelanggan = async (q) => {
    setForm({ ...form, pelanggan_search: q })
    if (q.length < 2) { setPelangganSuggestions([]); return }
    const { data } = await supabase
      .from('pelanggan')
      .select('*')
      .or(`nama.ilike.%${q}%,no_hp.ilike.%${q}%`)
      .limit(5)
    setPelangganSuggestions(data || [])
    setShowSuggestions(true)
  }

  const pilihPelanggan = (p) => {
    setForm({ ...form, pelanggan_id: p.id, pelanggan_search: `${p.nama} - ${p.no_hp}`, pelanggan_nama: p.nama })
    setShowSuggestions(false)
  }

  const simpanPelangganBaru = async () => {
    if (!pelangganBaru.nama || !pelangganBaru.no_hp) return
    const { data } = await supabase.from('pelanggan').insert(pelangganBaru).select().single()
    if (data) pilihPelanggan(data)
    setShowFormBaru(false)
  }

  const totalSewa = keranjang.filter(i => i.jenis_baris === 'Sewa').reduce((a, b) => a + b.subtotal, 0)
  const totalJual = keranjang.filter(i => i.jenis_baris === 'Jual').reduce((a, b) => a + b.subtotal, 0)
  const totalBayar = totalSewa + totalJual
  const sisaBayar = totalBayar - Number(form.dp)
  const formatHarga = (a) => 'Rp ' + Number(a).toLocaleString('id-ID')

  const handleCheckout = async () => {
    if (!form.pelanggan_id) { alert('Pilih pelanggan dulu'); return }
    setLoading(true)

    // 1. Update transaksi
    await supabase.from('transaksi').update({
      pelanggan_id: form.pelanggan_id,
      jenis_jaminan: form.jenis_jaminan,
      nomor_jaminan: form.nomor_jaminan,
      nama_jaminan: form.nama_jaminan,
      dp: Number(form.dp),
      catatan: form.catatan,
      total_biaya_sewa: totalSewa,
      total_biaya_jual: totalJual,
      total_bayar: totalBayar,
      sisa_bayar: sisaBayar,
      ...(transaksi.status === 'Aktif' ? { jam_ambil_aktual: new Date().toISOString() } : {}),
    }).eq('id', transaksi.id)

    // 2. Copy keranjang ke transaksi_detail
    const details = keranjang.map(k => ({
      transaksi_id: transaksi.id,
      varian_id: k.varian_id,
      jenis_baris: k.jenis_baris,
      qty: k.qty,
      harga_satuan: k.harga_satuan,
      durasi_hari: k.durasi_hari,
      subtotal: k.subtotal,
    }))
    await supabase.from('transaksi_detail').insert(details)

    // 3. Update stok varian
    for (const k of keranjang) {
      const { data: v } = await supabase.from('varian').select('stok_tersedia').eq('id', k.varian_id).single()
      if (v) {
        await supabase.from('varian').update({ stok_tersedia: v.stok_tersedia - k.qty }).eq('id', k.varian_id)
      }
    }

    // 4. Kosongkan keranjang
    await supabase.from('keranjang').delete().eq('transaksi_id', transaksi.id)

    setLoading(false)
    navigate('struk')
  }

  return (
    <div>
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('keranjang')}>←</button>
        <h1>Checkout</h1>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          className={`btn ${activeTab === 'identitas' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
          onClick={() => setActiveTab('identitas')}
        >
          👤 Identitas
        </button>
        <button
          className={`btn ${activeTab === 'pembayaran' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
          onClick={() => setActiveTab('pembayaran')}
        >
          💰 Pembayaran
        </button>
      </div>

      {activeTab === 'identitas' && (
        <div className="card">
          <div className="section-divider"><span>PELANGGAN</span></div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Cari Pelanggan (Nama / No HP)</label>
            <input
              className="form-input"
              placeholder="Ketik nama atau no HP..."
              value={form.pelanggan_search}
              onChange={e => searchPelanggan(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
            />
            {showSuggestions && pelangganSuggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'white', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', zIndex: 50, boxShadow: 'var(--shadow)'
              }}>
                {pelangganSuggestions.map(p => (
                  <div
                    key={p.id}
                    style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                    onClick={() => pilihPelanggan(p)}
                  >
                    <div style={{ fontWeight: 600 }}>{p.nama}</div>
                    <div style={{ fontSize: 12, color: 'var(--abu)' }}>{p.no_hp} · {p.kota}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!form.pelanggan_id && (
            <button
              className="btn btn-outline btn-full"
              onClick={() => setShowFormBaru(!showFormBaru)}
            >
              + Pelanggan Baru
            </button>
          )}

          {showFormBaru && (
            <div style={{ marginTop: 12, padding: 12, background: 'var(--abu-muda)', borderRadius: 'var(--radius)' }}>
              <div className="form-group">
                <label className="form-label">Nama</label>
                <input className="form-input" placeholder="Nama lengkap"
                  value={pelangganBaru.nama} onChange={e => setPelangganBaru({ ...pelangganBaru, nama: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">No HP</label>
                <input className="form-input" placeholder="08xxxxxxxxxx" type="tel"
                  value={pelangganBaru.no_hp} onChange={e => setPelangganBaru({ ...pelangganBaru, no_hp: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Kota</label>
                <input className="form-input" placeholder="Kota asal"
                  value={pelangganBaru.kota} onChange={e => setPelangganBaru({ ...pelangganBaru, kota: e.target.value })} />
              </div>
              <button className="btn btn-primary btn-full" onClick={simpanPelangganBaru}>Simpan Pelanggan</button>
            </div>
          )}

          <div className="section-divider"><span>JAMINAN IDENTITAS</span></div>

          <div className="form-group">
            <label className="form-label">Jenis Jaminan</label>
            <select className="form-select" value={form.jenis_jaminan}
              onChange={e => setForm({ ...form, jenis_jaminan: e.target.value })}>
              <option>KTP</option>
              <option>SIM</option>
              <option>Paspor</option>
              <option>Lainnya</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nomor {form.jenis_jaminan}</label>
            <input className="form-input" placeholder={`Nomor ${form.jenis_jaminan}`}
              value={form.nomor_jaminan} onChange={e => setForm({ ...form, nomor_jaminan: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Nama sesuai {form.jenis_jaminan}</label>
            <input className="form-input" placeholder="Nama pada identitas"
              value={form.nama_jaminan} onChange={e => setForm({ ...form, nama_jaminan: e.target.value })} />
          </div>

          <button className="btn btn-primary btn-full" onClick={() => setActiveTab('pembayaran')}>
            Lanjut ke Pembayaran →
          </button>
        </div>
      )}

      {activeTab === 'pembayaran' && (
        <div className="card">
          <div className="section-divider"><span>RINGKASAN</span></div>

          {keranjang.filter(i => i.jenis_baris === 'Sewa').length > 0 && (
            <>
              <div style={{ fontSize: 12, color: 'var(--abu)', fontWeight: 700, marginBottom: 8 }}>SEWA</div>
              {keranjang.filter(i => i.jenis_baris === 'Sewa').map(i => (
                <div key={i.id} className="summary-row" style={{ fontSize: 13, marginBottom: 4 }}>
                  <span>{i.nama_produk} {i.nama_varian} ×{i.qty}</span>
                  <span>{formatHarga(i.subtotal)}</span>
                </div>
              ))}
            </>
          )}

          {keranjang.filter(i => i.jenis_baris === 'Jual').length > 0 && (
            <>
              <div style={{ fontSize: 12, color: 'var(--abu)', fontWeight: 700, marginBottom: 8, marginTop: 12 }}>BARANG DIBELI</div>
              {keranjang.filter(i => i.jenis_baris === 'Jual').map(i => (
                <div key={i.id} className="summary-row" style={{ fontSize: 13, marginBottom: 4 }}>
                  <span>{i.nama_produk} {i.nama_varian} ×{i.qty}</span>
                  <span>{formatHarga(i.subtotal)}</span>
                </div>
              ))}
            </>
          )}

          <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
            <div className="summary-row" style={{ fontWeight: 700, fontSize: 16 }}>
              <span>Total</span>
              <span>{formatHarga(totalBayar)}</span>
            </div>
          </div>

          <div className="section-divider"><span>PEMBAYARAN</span></div>

          <div className="form-group">
            <label className="form-label">Down Payment (DP)</label>
            <input
              className="form-input"
              type="number"
              placeholder="0"
              value={form.dp}
              onChange={e => setForm({ ...form, dp: e.target.value })}
            />
          </div>

          <div style={{ background: 'var(--abu-muda)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 16 }}>
            <div className="summary-row">
              <span style={{ fontSize: 14 }}>Total Bayar</span>
              <span style={{ fontWeight: 700 }}>{formatHarga(totalBayar)}</span>
            </div>
            <div className="summary-row">
              <span style={{ fontSize: 14 }}>DP</span>
              <span style={{ color: 'var(--hijau)', fontWeight: 700 }}>- {formatHarga(form.dp)}</span>
            </div>
            <div className="summary-row" style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Sisa Bayar</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: sisaBayar > 0 ? 'var(--merah)' : 'var(--hijau)' }}>
                {formatHarga(sisaBayar)}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Catatan</label>
            <textarea
              className="form-input"
              placeholder="Catatan tambahan (opsional)"
              rows={3}
              value={form.catatan}
              onChange={e => setForm({ ...form, catatan: e.target.value })}
            />
          </div>

          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={handleCheckout}
            disabled={loading || !form.pelanggan_id}
          >
            {loading ? 'Memproses...' : '✓ Selesaikan Transaksi'}
          </button>

          {!form.pelanggan_id && (
            <div style={{ textAlign: 'center', color: 'var(--merah)', fontSize: 13, marginTop: 8 }}>
              ⚠️ Lengkapi identitas pelanggan dulu
            </div>
          )}
        </div>
      )}
    </div>
  )
}
