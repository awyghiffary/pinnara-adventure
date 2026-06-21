import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Keranjang({ navigate, transaksi }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadKeranjang()
  }, [transaksi])

  const loadKeranjang = async () => {
    if (!transaksi?.id) return
    const { data } = await supabase
      .from('keranjang')
      .select('*')
      .eq('transaksi_id', transaksi.id)
      .order('created_at')
    setItems(data || [])
    setLoading(false)
  }

  const updateQty = async (item, delta) => {
    const newQty = item.qty + delta
    if (newQty <= 0) {
      await supabase.from('keranjang').delete().eq('id', item.id)
    } else {
      const subtotal = item.jenis_baris === 'Sewa'
        ? newQty * item.harga_satuan * item.durasi_hari
        : newQty * item.harga_satuan
      await supabase.from('keranjang').update({ qty: newQty, subtotal }).eq('id', item.id)
    }
    loadKeranjang()
  }

  const hapusItem = async (id) => {
    await supabase.from('keranjang').delete().eq('id', id)
    loadKeranjang()
  }

  const formatHarga = (angka) => 'Rp ' + Number(angka).toLocaleString('id-ID')

  const itemsSewa = items.filter(i => i.jenis_baris === 'Sewa')
  const itemsJual = items.filter(i => i.jenis_baris === 'Jual')
  const totalSewa = itemsSewa.reduce((a, b) => a + b.subtotal, 0)
  const totalJual = itemsJual.reduce((a, b) => a + b.subtotal, 0)
  const totalBayar = totalSewa + totalJual

  const renderItem = (item) => (
    <div key={item.id} className="keranjang-item">
      <div className="keranjang-item-info">
        <div className="keranjang-item-nama">{item.nama_produk}</div>
        {item.nama_varian && (
          <div className="keranjang-item-varian">{item.nama_varian}</div>
        )}
        <div className="keranjang-item-harga">
          {item.jenis_baris === 'Sewa'
            ? `(${formatHarga(item.harga_satuan)} × ${item.durasi_hari} hari) × ${item.qty} = ${formatHarga(item.subtotal)}`
            : `${formatHarga(item.harga_satuan)} × ${item.qty} = ${formatHarga(item.subtotal)}`
          }
        </div>
      </div>
      <div className="keranjang-item-qty">
        <button className="qty-btn" onClick={() => updateQty(item, -1)}>−</button>
        <span className="qty-num">{item.qty}</span>
        <button className="qty-btn" onClick={() => updateQty(item, 1)}>+</button>
        <button
          className="qty-btn"
          style={{ borderColor: 'var(--merah)', color: 'var(--merah)', marginLeft: 4 }}
          onClick={() => hapusItem(item.id)}
        >
          🗑
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('pos')}>←</button>
        <h1>Keranjang</h1>
      </div>

      {loading ? (
        <div className="loading">Memuat keranjang...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <p>Keranjang kosong</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('pos')}>
            Pilih Produk
          </button>
        </div>
      ) : (
        <>
          {itemsSewa.length > 0 && (
            <>
              <div className="section-divider"><span>SEWA</span></div>
              {itemsSewa.map(renderItem)}
            </>
          )}

          {itemsJual.length > 0 && (
            <>
              <div className="section-divider"><span>BARANG DIBELI</span></div>
              {itemsJual.map(renderItem)}
            </>
          )}

          <div className="summary-box">
            {totalSewa > 0 && (
              <div className="summary-row">
                <span>Total Sewa</span>
                <span>{formatHarga(totalSewa)}</span>
              </div>
            )}
            {totalJual > 0 && (
              <div className="summary-row">
                <span>Total Beli</span>
                <span>{formatHarga(totalJual)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>TOTAL</span>
              <span>{formatHarga(totalBayar)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => navigate('pos')}
            >
              + Tambah Produk
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 2 }}
              onClick={() => navigate('checkout')}
            >
              Lanjut Checkout →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
