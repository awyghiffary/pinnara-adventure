import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function POS({ navigate, transaksi }) {
  const [produkList, setProdukList] = useState([])
  const [kategoriList, setKategoriList] = useState([])
  const [filterKategori, setFilterKategori] = useState('Semua')
  const [filterTipe, setFilterTipe] = useState('Semua')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalProduk, setModalProduk] = useState(null)
  const [varianList, setVarianList] = useState([])
  const [toast, setToast] = useState('')
  const [jumlahKeranjang, setJumlahKeranjang] = useState(0)

  useEffect(() => {
    loadProduk()
    loadJumlahKeranjang()
  }, [transaksi])

  const loadProduk = async () => {
    const { data } = await supabase
      .from('produk')
      .select('*')
      .eq('aktif', true)
      .order('kategori')
    setProdukList(data || [])
    const kategori = [...new Set((data || []).map(p => p.kategori).filter(Boolean))]
    setKategoriList(kategori)
    setLoading(false)
  }

  const loadJumlahKeranjang = async () => {
    if (!transaksi?.id) return
    const { count } = await supabase
      .from('keranjang')
      .select('*', { count: 'exact', head: true })
      .eq('transaksi_id', transaksi.id)
    setJumlahKeranjang(count || 0)
  }

  const bukaPilihVarian = async (produk) => {
    setModalProduk(produk)
    const { data } = await supabase
      .from('varian')
      .select('*')
      .eq('product_id', produk.id)
      .order('nama_varian')
    setVarianList(data || [])
  }

  const tambahKeKeranjang = async (varian) => {
    if (!transaksi?.id) return

    // Cek apakah sudah ada di keranjang
    const { data: existing } = await supabase
      .from('keranjang')
      .select('*')
      .eq('transaksi_id', transaksi.id)
      .eq('varian_id', varian.id)
      .single()

    if (existing) {
      // Update qty
      const subtotal = modalProduk.tipe_produk === 'Sewa'
        ? (existing.qty + 1) * modalProduk.harga * transaksi.durasi_hari
        : (existing.qty + 1) * modalProduk.harga

      await supabase
        .from('keranjang')
        .update({ qty: existing.qty + 1, subtotal })
        .eq('id', existing.id)
    } else {
      const subtotal = modalProduk.tipe_produk === 'Sewa'
        ? modalProduk.harga * transaksi.durasi_hari
        : modalProduk.harga

      await supabase.from('keranjang').insert({
        transaksi_id: transaksi.id,
        varian_id: varian.id,
        nama_produk: modalProduk.nama_produk,
        nama_varian: modalProduk.jenis_varian === 'Tanpa Varian' ? '' : varian.nama_varian,
        jenis_baris: modalProduk.tipe_produk,
        qty: 1,
        harga_satuan: modalProduk.harga,
        durasi_hari: transaksi.durasi_hari,
        subtotal,
      })
    }

    setModalProduk(null)
    loadJumlahKeranjang()
    showToast(`${modalProduk.nama_produk} ditambahkan ke keranjang`)
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const produkFiltered = produkList.filter(p => {
    const cocokKategori = filterKategori === 'Semua' || p.kategori === filterKategori
    const cocokTipe = filterTipe === 'Semua' || p.tipe_produk === filterTipe
    const cocokSearch = p.nama_produk.toLowerCase().includes(search.toLowerCase())
    return cocokKategori && cocokTipe && cocokSearch
  })

  const formatHarga = (angka) => 'Rp ' + Number(angka).toLocaleString('id-ID')

  return (
    <div>
      {toast && <div className="toast">{toast}</div>}

      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('dashboard')}>←</button>
        <div style={{ flex: 1 }}>
          <h1>Pilih Produk</h1>
          <div style={{ fontSize: 12, color: 'var(--abu)' }}>
            {transaksi?.durasi_hari} hari · {transaksi?.status}
          </div>
        </div>
        <button
          className="btn btn-primary"
          style={{ position: 'relative' }}
          onClick={() => navigate('keranjang')}
        >
          🛒
          {jumlahKeranjang > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              background: 'var(--merah)', color: 'white',
              borderRadius: '50%', width: 20, height: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700
            }}>
              {jumlahKeranjang}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="search-wrapper">
        <input
          type="text"
          placeholder="Cari produk..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Tipe */}
      <div className="filter-bar">
        {['Semua', 'Sewa', 'Jual'].map(t => (
          <button
            key={t}
            className={`filter-chip ${filterTipe === t ? 'active' : ''}`}
            onClick={() => setFilterTipe(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filter Kategori */}
      <div className="filter-bar">
        <button
          className={`filter-chip ${filterKategori === 'Semua' ? 'active' : ''}`}
          onClick={() => setFilterKategori('Semua')}
        >
          Semua Kategori
        </button>
        {kategoriList.map(k => (
          <button
            key={k}
            className={`filter-chip ${filterKategori === k ? 'active' : ''}`}
            onClick={() => setFilterKategori(k)}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="loading">Memuat produk...</div>
      ) : produkFiltered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <p>Tidak ada produk ditemukan</p>
        </div>
      ) : (
        <div className="pos-grid">
          {produkFiltered.map(produk => (
            <div
              key={produk.id}
              className="pos-card"
              onClick={() => bukaPilihVarian(produk)}
            >
              <div className="pos-card-img">
                {produk.foto_url
                  ? <img src={produk.foto_url} alt={produk.nama_produk} />
                  : '📦'}
              </div>
              <div className="pos-card-info">
                <div className="pos-card-nama">{produk.nama_produk}</div>
                <div className="pos-card-harga">
                  {formatHarga(produk.harga)}
                  {produk.tipe_produk === 'Sewa' ? '/hari' : ''}
                </div>
                <div className="pos-card-tipe">{produk.tipe_produk}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tombol ke Keranjang */}
      {jumlahKeranjang > 0 && (
        <div style={{ position: 'fixed', bottom: 80, left: 0, right: 0, padding: '0 16px', maxWidth: 1024, margin: '0 auto' }}>
          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={() => navigate('keranjang')}
            style={{ boxShadow: '0 4px 16px rgba(45,106,79,0.4)' }}
          >
            🛒 Lihat Keranjang ({jumlahKeranjang} item)
          </button>
        </div>
      )}

      {/* Modal Pilih Varian */}
      {modalProduk && (
        <div className="modal-overlay" onClick={() => setModalProduk(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">{modalProduk.nama_produk}</div>
            <div style={{ fontSize: 13, color: 'var(--abu)', marginBottom: 4 }}>
              {formatHarga(modalProduk.harga)}
              {modalProduk.tipe_produk === 'Sewa' ? `/hari × ${transaksi?.durasi_hari} hari = ${formatHarga(modalProduk.harga * transaksi?.durasi_hari)}` : ''}
            </div>

            {modalProduk.jenis_varian === 'Tanpa Varian' ? (
              <button
                className="btn btn-primary btn-full"
                style={{ marginTop: 16 }}
                onClick={() => tambahKeKeranjang({ id: varianList[0]?.id, nama_varian: 'Default' })}
              >
                + Tambah ke Keranjang
              </button>
            ) : (
              <>
                <div style={{ fontSize: 13, color: 'var(--abu)', fontWeight: 600, marginBottom: 8 }}>
                  Pilih {modalProduk.jenis_varian}:
                </div>
                <div className="varian-list">
                  {varianList.map(v => (
                    <button
                      key={v.id}
                      className={`varian-chip ${v.stok_tersedia <= 0 ? 'habis' : ''}`}
                      onClick={() => tambahKeKeranjang(v)}
                    >
                      {v.nama_varian}
                      {v.stok_tersedia <= 0 && (
                        <div style={{ fontSize: 10, color: 'var(--merah)', fontWeight: 400 }}>Habis</div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
