import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, clearToken, adminFetch } from '@/lib/auth';
import { fetchProject, fetchLayers, fetchUnitTypes } from '@/lib/api';

type EntityStatus = 'available' | 'reserved' | 'sold' | 'not_available';

interface UnitRow {
  id: string;
  label: string;
  name: string;
  parentName?: string;
  status: EntityStatus;
  price: number | null;
  area: number | null;
  areaUnit: string;
  unitTypeName?: string;
  sortOrder: number;
  depth: number;
  type: string;
}

const STATUS_OPTIONS: { value: EntityStatus; label: string; color: string }[] = [
  { value: 'available', label: 'Disponible', color: '#11BB5D' },
  { value: 'reserved', label: 'Reservado', color: '#E07C11' },
  { value: 'sold', label: 'Vendido', color: '#D6254C' },
  { value: 'not_available', label: 'No Disponible', color: '#9CA3AF' },
];

const poppins = "'Poppins', system-ui, sans-serif";

export function AdminDashboard() {
  const navigate = useNavigate();
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin', { replace: true });
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const project = await fetchProject();
      setProjectName(project.name);
      const [layers, unitTypes] = await Promise.all([
        fetchLayers(project.id),
        fetchUnitTypes(project.id),
      ]);

      const parentMap = new Map<string, string>();
      for (const l of layers) {
        parentMap.set(l.id, l.label || l.name);
      }

      const unitTypeMap = new Map<string, string>();
      for (const ut of unitTypes) {
        unitTypeMap.set(ut.id, ut.name);
      }

      const leafLayers = layers
        .filter((l) => l.type === 'unit' || l.type === 'lot')
        .map((l): UnitRow => ({
          id: l.id,
          label: l.label || l.name,
          name: l.name,
          parentName: l.parent_id ? parentMap.get(l.parent_id) : undefined,
          status: (l.status as EntityStatus) || 'available',
          price: l.price ?? null,
          area: l.area ?? null,
          areaUnit: l.area_unit || 'm2',
          unitTypeName: l.unit_type_id ? unitTypeMap.get(l.unit_type_id) : (l.properties?.unit_type as string | undefined),
          sortOrder: l.sort_order,
          depth: l.depth,
          type: l.type,
        }))
        .sort((a, b) => {
          if (a.parentName !== b.parentName) return (a.parentName ?? '').localeCompare(b.parentName ?? '');
          return a.sortOrder - b.sortOrder;
        });

      setUnits(leafLayers);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (unitId: string, newStatus: EntityStatus) => {
    setSaving((p) => ({ ...p, [unitId]: true }));
    try {
      const res = await adminFetch(`/layers/${unitId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Error actualizando estado');
      setUnits((prev) => prev.map((u) => u.id === unitId ? { ...u, status: newStatus } : u));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving((p) => ({ ...p, [unitId]: false }));
    }
  }, []);

  const updatePrice = useCallback(async (unitId: string, newPrice: number | null) => {
    setSaving((p) => ({ ...p, [unitId]: true }));
    try {
      const res = await adminFetch(`/layers/${unitId}`, {
        method: 'PUT',
        body: JSON.stringify({ price: newPrice ?? 0 }),
      });
      if (!res.ok) throw new Error('Error actualizando precio');
      setUnits((prev) => prev.map((u) => u.id === unitId ? { ...u, price: newPrice } : u));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving((p) => ({ ...p, [unitId]: false }));
    }
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    navigate('/admin');
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <p className="text-[16px] text-[#757474]" style={{ fontFamily: poppins }}>Cargando...</p>
      </div>
    );
  }

  const statusCounts = {
    available: units.filter((u) => u.status === 'available').length,
    reserved: units.filter((u) => u.status === 'reserved').length,
    sold: units.filter((u) => u.status === 'sold').length,
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header
        className="sticky top-0 z-10 h-[64px] flex items-center justify-between px-[24px]"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.06)',
        }}
      >
        <h1 className="text-[18px] font-semibold" style={{ color: '#1A1A1A', fontFamily: poppins }}>
          {projectName}
        </h1>
        <div className="flex items-center gap-[16px]">
          <a href="/" className="text-[13px] text-[#757474] hover:text-[#1A1A1A] transition-colors" style={{ fontFamily: poppins }}>
            Ver sitio
          </a>
          <button
            onClick={handleLogout}
            className="text-[13px] text-red-500 hover:text-red-700 transition-colors"
            style={{ fontFamily: poppins }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-[24px] py-[24px]">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-[16px] mb-[24px]">
          {STATUS_OPTIONS.slice(0, 3).map(({ value, label, color }) => (
            <div
              key={value}
              className="rounded-[16px] p-[20px]"
              style={{ background: 'white', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.06)' }}
            >
              <div className="flex items-center gap-[8px] mb-[4px]">
                <span className="w-[10px] h-[10px] rounded-full" style={{ background: color }} />
                <span className="text-[13px] text-[#757474]" style={{ fontFamily: poppins }}>{label}</span>
              </div>
              <span className="text-[28px] font-semibold" style={{ color: '#1A1A1A', fontFamily: poppins }}>
                {statusCounts[value as keyof typeof statusCounts] ?? 0}
              </span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div
          className="rounded-[20px] overflow-hidden"
          style={{ background: 'white', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.06)' }}
        >
          <div className="px-[24px] py-[16px] border-b border-[#F0F0F0]">
            <h2 className="text-[16px] font-semibold" style={{ color: '#1A1A1A', fontFamily: poppins }}>
              Unidades ({units.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0F0F0]">
                  {['Unidad', 'Piso/Zona', 'Tipo', 'Área', 'Precio (USD)', 'Estado', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left px-[16px] py-[12px] text-[12px] font-medium uppercase tracking-wider"
                      style={{ color: '#9CA3AF', fontFamily: poppins }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <UnitTableRow
                    key={unit.id}
                    unit={unit}
                    saving={!!saving[unit.id]}
                    onStatusChange={(s) => updateStatus(unit.id, s)}
                    onPriceChange={(p) => updatePrice(unit.id, p)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnitTableRow({
  unit,
  saving,
  onStatusChange,
  onPriceChange,
}: {
  unit: UnitRow;
  saving: boolean;
  onStatusChange: (s: EntityStatus) => void;
  onPriceChange: (p: number | null) => void;
}) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceValue, setPriceValue] = useState(String(unit.price ?? ''));

  const statusOpt = STATUS_OPTIONS.find((s) => s.value === unit.status);
  const areaLabel = unit.areaUnit === 'ft2' ? 'ft²' : unit.areaUnit === 'ha' ? 'ha' : 'm²';

  const handlePriceSave = () => {
    if (priceValue.trim() === '') {
      onPriceChange(null);
    } else {
      const num = parseFloat(priceValue);
      if (!isNaN(num) && num >= 0) {
        onPriceChange(num);
      }
    }
    setEditingPrice(false);
  };

  return (
    <tr className={`border-b border-[#F0F0F0] last:border-0 transition-colors ${saving ? 'opacity-50' : 'hover:bg-[#FAFAFA]'}`}>
      <td className="px-[16px] py-[14px]">
        <span className="text-[14px] font-semibold" style={{ color: '#1A1A1A', fontFamily: poppins }}>
          {unit.label}
        </span>
      </td>
      <td className="px-[16px] py-[14px]">
        <span className="text-[13px]" style={{ color: '#757474', fontFamily: poppins }}>
          {unit.parentName ?? '—'}
        </span>
      </td>
      <td className="px-[16px] py-[14px]">
        <span className="text-[13px]" style={{ color: '#757474', fontFamily: poppins }}>
          {unit.unitTypeName ?? '—'}
        </span>
      </td>
      <td className="px-[16px] py-[14px]">
        <span className="text-[13px]" style={{ color: '#757474', fontFamily: poppins }}>
          {unit.area ? `${unit.area} ${areaLabel}` : '—'}
        </span>
      </td>
      <td className="px-[16px] py-[14px]">
        {editingPrice ? (
          <div className="flex items-center gap-[6px]">
            <input
              type="number"
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePriceSave()}
              onBlur={handlePriceSave}
              autoFocus
              className="w-[120px] h-[32px] px-[8px] rounded-[8px] text-[13px] outline-none"
              style={{ background: '#F0F0F0', border: '1px solid #E0E0E0', color: '#1A1A1A', fontFamily: poppins }}
            />
          </div>
        ) : (
          <button
            onClick={() => { setPriceValue(String(unit.price ?? '')); setEditingPrice(true); }}
            className="text-[13px] hover:underline cursor-pointer"
            style={{ color: '#1A1A1A', fontFamily: poppins }}
          >
            {unit.price != null ? `$${unit.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
          </button>
        )}
      </td>
      <td className="px-[16px] py-[14px]">
        <select
          value={unit.status}
          onChange={(e) => onStatusChange(e.target.value as EntityStatus)}
          disabled={saving}
          className="h-[32px] px-[10px] rounded-[100px] text-[12px] font-medium outline-none cursor-pointer appearance-none"
          style={{
            background: `${statusOpt?.color}18`,
            color: statusOpt?.color,
            border: `1px solid ${statusOpt?.color}40`,
            fontFamily: poppins,
            paddingRight: '28px',
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </td>
      <td className="px-[16px] py-[14px]">
        {saving && (
          <span className="text-[11px] text-[#757474]" style={{ fontFamily: poppins }}>Guardando...</span>
        )}
      </td>
    </tr>
  );
}
