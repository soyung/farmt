// src/components/ExportButton.jsx
import React from 'react';
import { supabase } from '../supabaseClient';

export default function ExportButton() {
  const [loading, setLoading] = React.useState(false);

  const exportToCSV = async () => {
    setLoading(true);
    
    try {
      // Fetch all data from Supabase
      const { data, error } = await supabase
        .from('trees')
        .select('*')
        .order('id', { ascending: true })
        .order('date', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        alert('No data to export');
        setLoading(false);
        return;
      }

      // Convert to CSV
      const csv = convertToCSV(data);
      
      // Download file
      downloadCSV(csv, `farm-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`);
      
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    }
    
    setLoading(false);
  };

  const convertToCSV = (data) => {
    // CSV Headers
    const headers = [
      'Tree ID',
      'Date',
      'Season',
      'Power',
      'Balance',
      'Bugs',
      'Comments',
      'Images Count',
      'Season Data'
    ];

    // CSV Rows
    const rows = data.map(row => [
      row.id,
      row.date,
      row.season || '',
      row.power || '',
      row.balance || '',
      row.bugs !== null ? row.bugs : '',
      row.comments || '',
      row.images ? row.images.length : 0,
      row.season_data ? JSON.stringify(row.season_data) : ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Escape commas and quotes in cell content
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  const downloadCSV = (csvContent, filename) => {
    // Create blob with UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={exportToCSV}
      disabled={loading}
      style={{
        padding: '10px 20px',
        background: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: loading ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!loading) e.currentTarget.style.background = '#059669';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#10b981';
      }}
    >
      {loading ? '📥 Exporting...' : '📊 Export to CSV'}
    </button>
  );
}
