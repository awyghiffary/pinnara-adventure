import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import TransaksiBaru from './pages/TransaksiBaru'
import POS from './pages/POS'
import Keranjang from './pages/Keranjang'
import Checkout from './pages/Checkout'
import DaftarTransaksi from './pages/DaftarTransaksi'
import Produk from './pages/Produk'
import Pelanggan from './pages/Pelanggan'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [transaksiAktif, setTransaksiAktif] = useState(null)

  const navigate = (p, data = null) => {
    if (p === 'pos' && data) setTransaksiAktif(data)
    setPage(p)
  }

  const pages = {
    dashboard: <Dashboard navigate={navigate} />,
    transaksi_baru: <TransaksiBaru navigate={navigate} setTransaksiAktif={setTransaksiAktif} />,
    pos: <POS navigate={navigate} transaksi={transaksiAktif} />,
    keranjang: <Keranjang navigate={navigate} transaksi={transaksiAktif} />,
    checkout: <Checkout navigate={navigate} transaksi={transaksiAktif} setTransaksiAktif={setTransaksiAktif} />,
    daftar_transaksi: <DaftarTransaksi navigate={navigate} />,
    produk: <Produk navigate={navigate} />,
    pelanggan: <Pelanggan navigate={navigate} />,
  }

  return (
    <div className="app">
      {/* Bottom Nav untuk tablet */}
      <main className="main-content">
        {pages[page] || <Dashboard navigate={navigate} />}
      </main>
      <nav className="bottom-nav">
        <button onClick={() => navigate('dashboard')} className={page === 'dashboard' ? 'active' : ''}>
          <span className="nav-icon">🏠</span>
          <span>Dashboard</span>
        </button>
        <button onClick={() => navigate('transaksi_baru')} className="nav-new-transaksi">
          <span className="nav-icon">+</span>
          <span>Transaksi</span>
        </button>
        <button onClick={() => navigate('daftar_transaksi')} className={page === 'daftar_transaksi' ? 'active' : ''}>
          <span className="nav-icon">📋</span>
          <span>Riwayat</span>
        </button>
        <button onClick={() => navigate('produk')} className={page === 'produk' ? 'active' : ''}>
          <span className="nav-icon">📦</span>
          <span>Produk</span>
        </button>
        <button onClick={() => navigate('pelanggan')} className={page === 'pelanggan' ? 'active' : ''}>
          <span className="nav-icon">👥</span>
          <span>Pelanggan</span>
        </button>
      </nav>
    </div>
  )
}
