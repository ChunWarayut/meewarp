import { useAuth } from '../../contexts/AuthContext';
import { useStoreContext } from '../../contexts/StoreContext';
import AdminForm from '../../components/AdminForm';

const AdminCreateWarpPage = () => {
  const { token } = useAuth();
  const { selectedStoreId, selectedStore, locked } = useStoreContext();

  if (!token) {
    return null;
  }

  if (!locked && !selectedStoreId) {
    return <p className="text-sm text-slate-300">เลือกสาขาเพื่อเพิ่ม Warp Profile</p>;
  }

  if (!selectedStoreId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Profiles</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Create Warp Profile</h1>
        <p className="mt-1 text-sm text-slate-300">
          ใช้สำหรับเพิ่มศิลปิน/ดีเจใหม่ให้ลูกค้าเลือกจากหน้าจอหลัก หรือใช้ในโปรโมชันพิเศษ
        </p>
        {selectedStore ? (
          <p className="mt-1 text-xs uppercase tracking-[0.35em] text-indigo-200">{selectedStore.name}</p>
        ) : null}
      </header>
      <AdminForm authToken={token} storeId={selectedStoreId} />
    </div>
  );
};

export default AdminCreateWarpPage;
