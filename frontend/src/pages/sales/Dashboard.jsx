const SalesDashboard = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Sales Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-white rounded-lg shadow">Total Leads: 0</div>
        <div className="p-6 bg-white rounded-lg shadow">Closed Deals: 0</div>
      </div>
    </div>
  );
};

export default SalesDashboard;
