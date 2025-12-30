
import React, { useEffect, useState } from 'react';
import { Card, Toolbar, Table, LoadingSpinner, ExportModal } from '../../components/UIComponents';
import { api } from '../../services/mockService';
import { StokSummary } from '../../types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const StokSaatIniPage: React.FC = () => {
  const [data, setData] = useState<StokSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Subscribe to aggregated stock data
    const unsubscribe = api.subscribeStokSummary((items) => {
        if (search) {
            const lower = search.toLowerCase();
            setData(items.filter(i => 
              i.namaBahan.toLowerCase().includes(lower) || 
              i.namaSupplier.toLowerCase().includes(lower)
            ));
        } else {
            setData(items);
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, [search]);

  // Determine if a specific item name appears multiple times (implying different suppliers)
  // We use this for visual indication
  const getDuplicateCount = (name: string) => {
      return data.filter(d => d.namaBahan.toLowerCase() === name.toLowerCase()).length;
  };

  const handleExportExcel = () => {
    const dataToExport = data.map(item => ({
      'Nama Bahan': item.namaBahan,
      'Suplayer': item.namaSupplier,
      'Total Stok': item.totalStok,
      'Satuan': item.satuan,
      'Terakhir Update': item.lastUpdated
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stok Saat Ini");
    XLSX.writeFile(wb, "Laporan_Stok_Saat_Ini.xlsx");
  };

  return (
    <div>
      <Toolbar 
        title="Stok Bahan Baku Saat Ini" 
        onSearch={setSearch} 
        onExport={() => setIsExportModalOpen(true)}
        searchPlaceholder="Cari Nama Bahan atau Suplayer..."
      />
      
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Card>
          <Table<StokSummary> 
            isLoading={loading}
            data={data}
            hideActions={true} // Read-only view
            columns={[
              { 
                  header: 'Nama Bahan', 
                  accessor: (item) => {
                      const count = getDuplicateCount(item.namaBahan);
                      const isMulti = count > 1;
                      return (
                          <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">{item.namaBahan}</span>
                              {isMulti && (
                                  <span className="text-orange-500 bg-orange-50 px-2 py-0.5 rounded text-[10px] font-bold border border-orange-100 flex items-center gap-1" title="Item ini memiliki suplayer berbeda">
                                     <AlertCircle size={10} /> Multi-Suplayer
                                  </span>
                              )}
                          </div>
                      )
                  } 
              },
              { header: 'Suplayer', accessor: 'namaSupplier' },
              { 
                  header: 'Total Stok', 
                  accessor: (item) => (
                      <span className="font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
                          {item.totalStok} {item.satuan}
                      </span>
                  ) 
              },
              { header: 'Terakhir Masuk', accessor: 'lastUpdated' }
            ]}
            onEdit={() => {}} 
            onDelete={() => {}}
          />
        </Card>
      )}

      {/* EXPORT MODAL */}
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Laporan Stok Saat Ini"
        data={data}
        columns={[
            { header: 'Nama Bahan', accessor: 'namaBahan' },
            { header: 'Suplayer', accessor: 'namaSupplier' },
            { header: 'Total Stok', accessor: (item) => `${item.totalStok} ${item.satuan}` },
            { header: 'Terakhir Update', accessor: 'lastUpdated' }
        ]}
        onExportExcel={handleExportExcel}
      />
      
      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 flex items-start gap-2">
          <AlertCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
          <p>
             <strong>Catatan:</strong> Stok dihitung berdasarkan akumulasi penerimaan barang (Bahan Masuk). 
             Apabila terdapat <em>Nama Bahan</em> yang sama namun <em>Suplayer</em> berbeda, sistem akan memisahkannya menjadi baris berbeda dan memberikan tanda "Multi-Suplayer".
          </p>
      </div>
    </div>
  );
};
