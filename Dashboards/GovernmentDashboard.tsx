import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Users, Building2, Factory, TrendingUp, AlertTriangle, CheckCircle, 
  MapPin, IndianRupee, Sprout, Target, FileText, ArrowRight, Filter, X
} from 'lucide-react';
import { getGovernmentStats, getLaggingEntities, getAllEntities, EntityPerformance } from '../services/analyticsService';
import { GovernmentStats } from '../types';

interface GovernmentDashboardProps {
  lang: string;
}

const GovernmentDashboard: React.FC<GovernmentDashboardProps> = ({ lang }) => {
  const [stats, setStats] = useState<GovernmentStats | null>(null);
  const [laggingEntities, setLaggingEntities] = useState<EntityPerformance[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'farmer' | 'fpo' | 'processor'>('all');
  const [selectedEntity, setSelectedEntity] = useState<EntityPerformance | null>(null);

  useEffect(() => {
    const loadStats = () => {
      const governmentStats = getGovernmentStats();
      setStats(governmentStats);
      setLaggingEntities(governmentStats.laggingEntities);
    };
    loadStats();
  }, []);

  const filteredLagging = selectedFilter === 'all' 
    ? laggingEntities 
    : laggingEntities.filter(e => e.type === selectedFilter);

  const COLORS = {
    'excellent': '#10b981',
    'on-track': '#3b82f6',
    'at-risk': '#f59e0b',
    'lagging': '#ef4444',
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-enam-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Chart data
  const entityTypeData = [
    { name: lang === 'en' ? 'Farmers' : 'କୃଷକ', value: stats.totalFarmers, active: stats.activeFarmers },
    { name: lang === 'en' ? 'FPOs' : 'FPO', value: stats.totalFPOs, active: stats.activeFPOs },
    { name: lang === 'en' ? 'Processors' : 'ପ୍ରକ୍ରିୟାକରଣ', value: stats.totalProcessors, active: stats.activeProcessors },
  ];

  const statusDistribution = [
    { name: lang === 'en' ? 'Excellent' : 'ଉତ୍କୃଷ୍ଟ', value: getAllEntities().filter(e => e.status === 'excellent').length, color: COLORS.excellent },
    { name: lang === 'en' ? 'On Track' : 'ଟ୍ରାକ୍ ଉପରେ', value: getAllEntities().filter(e => e.status === 'on-track').length, color: COLORS['on-track'] },
    { name: lang === 'en' ? 'At Risk' : 'ବିପଦରେ', value: getAllEntities().filter(e => e.status === 'at-risk').length, color: COLORS['at-risk'] },
    { name: lang === 'en' ? 'Lagging' : 'ପଛୁଆ', value: getAllEntities().filter(e => e.status === 'lagging').length, color: COLORS.lagging },
  ];

  const districtData = stats.districtWiseStats.map(dist => ({
    name: dist.district,
    farmers: dist.farmers,
    fpos: dist.fpos,
    processors: dist.processors,
    production: dist.production,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-govt-orange to-govt-green rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {lang === 'en' ? 'Government Dashboard' : 'ସରକାରୀ ଡ୍ୟାସବୋର୍ଡ୍'}
              </h1>
              <p className="text-white/90">
                {lang === 'en' 
                  ? 'NMEO-OP Initiative Monitoring & Support System'
                  : 'NMEO-OP ପ୍ରୟାସ ମନିଟରିଂ ଏବଂ ସହାୟତା ସିଷ୍ଟମ୍'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{stats.nmeoCompliance.toFixed(1)}%</div>
              <div className="text-sm text-white/80">
                {lang === 'en' ? 'NMEO-OP Compliance' : 'NMEO-OP ଅନୁପାଳନ'}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users size={24} className="text-green-600" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                stats.activeFarmers / stats.totalFarmers > 0.7 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {((stats.activeFarmers / stats.totalFarmers) * 100).toFixed(0)}% {lang === 'en' ? 'Active' : 'ସକ୍ରିୟ'}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalFarmers}</div>
            <div className="text-sm text-gray-600">{lang === 'en' ? 'Total Farmers' : 'ମୋଟ କୃଷକ'}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.activeFarmers} {lang === 'en' ? 'active' : 'ସକ୍ରିୟ'}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Building2 size={24} className="text-indigo-600" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                stats.activeFPOs / stats.totalFPOs > 0.7 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {((stats.activeFPOs / stats.totalFPOs) * 100).toFixed(0)}% {lang === 'en' ? 'Active' : 'ସକ୍ରିୟ'}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalFPOs}</div>
            <div className="text-sm text-gray-600">{lang === 'en' ? 'Total FPOs' : 'ମୋଟ FPO'}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.activeFPOs} {lang === 'en' ? 'active' : 'ସକ୍ରିୟ'}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Factory size={24} className="text-orange-600" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                stats.activeProcessors / stats.totalProcessors > 0.7 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {((stats.activeProcessors / stats.totalProcessors) * 100).toFixed(0)}% {lang === 'en' ? 'Active' : 'ସକ୍ରିୟ'}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalProcessors}</div>
            <div className="text-sm text-gray-600">{lang === 'en' ? 'Total Processors' : 'ମୋଟ ପ୍ରକ୍ରିୟାକରଣ'}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.activeProcessors} {lang === 'en' ? 'active' : 'ସକ୍ରିୟ'}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Sprout size={24} className="text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalOilseedAcreage.toFixed(1)}</div>
            <div className="text-sm text-gray-600">{lang === 'en' ? 'Total Oilseed Acreage' : 'ମୋଟ ତେଲବିହନ ଏକର'}</div>
            <div className="text-xs text-gray-500 mt-1">
              ₹{stats.averageProfitPerAcre.toLocaleString()}/{lang === 'en' ? 'acre' : 'ଏକର'}
            </div>
          </div>
        </div>

        {/* Production & Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">{lang === 'en' ? 'Total Production' : 'ମୋଟ ଉତ୍ପାଦନ'}</div>
            <div className="text-3xl font-bold text-blue-600">{stats.totalProduction.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">{lang === 'en' ? 'quintals' : 'କ୍ୱିଣ୍ଟାଲ'}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">{lang === 'en' ? 'Total Revenue' : 'ମୋଟ ଆୟ'}</div>
            <div className="text-3xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">{lang === 'en' ? 'across all entities' : 'ସମସ୍ତ ସଂସ୍ଥା ମଧ୍ୟରେ'}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">{lang === 'en' ? 'NMEO-OP Compliance' : 'NMEO-OP ଅନୁପାଳନ'}</div>
            <div className="text-3xl font-bold text-orange-600">{stats.nmeoCompliance.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {lang === 'en' ? 'scheme utilization & MSP compliance' : 'ଯୋଜନା ବ୍ୟବହାର ଏବଂ MSP ଅନୁପାଳନ'}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={20} className="text-enam-green" />
              {lang === 'en' ? 'Performance Status Distribution' : 'କାର୍ଯ୍ୟସମ୍ପାଦନ ସ୍ଥିତି ବିତରଣ'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* District-wise Production */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-enam-green" />
              {lang === 'en' ? 'District-wise Production' : 'ଜିଲ୍ଲା-ଉଇଜ୍ ଉତ୍ପାଦନ'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={districtData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="production" fill="#84c225" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lagging Entities - Priority Support */}
        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={24} className="text-red-600" />
              {lang === 'en' ? 'Entities Needing Support' : 'ସହାୟତା ଆବଶ୍ୟକ ସଂସ୍ଥା'}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  selectedFilter === 'all' ? 'bg-enam-green text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {lang === 'en' ? 'All' : 'ସମସ୍ତ'}
              </button>
              <button
                onClick={() => setSelectedFilter('farmer')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  selectedFilter === 'farmer' ? 'bg-enam-green text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {lang === 'en' ? 'Farmers' : 'କୃଷକ'}
              </button>
              <button
                onClick={() => setSelectedFilter('fpo')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  selectedFilter === 'fpo' ? 'bg-enam-green text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {lang === 'en' ? 'FPOs' : 'FPO'}
              </button>
              <button
                onClick={() => setSelectedFilter('processor')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  selectedFilter === 'processor' ? 'bg-enam-green text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {lang === 'en' ? 'Processors' : 'ପ୍ରକ୍ରିୟାକରଣ'}
              </button>
            </div>
          </div>

          {filteredLagging.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
              <p>
                {lang === 'en' 
                  ? 'No entities currently need support. All are performing well!'
                  : 'ବର୍ତ୍ତମାନ କୌଣସି ସଂସ୍ଥାକୁ ସହାୟତା ଆବଶ୍ୟକ ନାହିଁ | ସମସ୍ତେ ଭଲ କାର୍ଯ୍ୟ କରୁଛନ୍ତି!'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLagging.map((entity) => (
                <div 
                  key={entity.id} 
                  className="bg-gray-50 rounded-xl p-6 border-2 border-red-200 hover:border-red-300 transition cursor-pointer"
                  onClick={() => setSelectedEntity(entity)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">{entity.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          entity.status === 'lagging' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {entity.status === 'lagging' 
                            ? (lang === 'en' ? 'Lagging' : 'ପଛୁଆ')
                            : (lang === 'en' ? 'At Risk' : 'ବିପଦରେ')}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700 capitalize">
                          {entity.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-semibold">{lang === 'en' ? 'Location:' : 'ସ୍ଥାନ:'}</span> {entity.location}
                        </div>
                        {entity.type === 'farmer' && (
                          <div>
                            <span className="font-semibold">{lang === 'en' ? 'Acreage:' : 'ଏକର:'}</span> {entity.oilseedAcreage}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold">{lang === 'en' ? 'Production:' : 'ଉତ୍ପାଦନ:'}</span> {entity.production} qtl
                        </div>
                        <div>
                          <span className="font-semibold">{lang === 'en' ? 'Engagement:' : 'ସଂଲଗ୍ନତା:'}</span> {entity.engagementScore}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">
                        {entity.profit < 0 
                          ? (lang === 'en' ? 'Loss' : 'କ୍ଷତି')
                          : (lang === 'en' ? 'Profit' : 'ଲାଭ')
                        }
                      </div>
                      <div className={`text-xl font-bold ${
                        entity.profit < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ₹{Math.abs(entity.profit).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Support Needed */}
                  {entity.supportNeeded.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4 mb-3 border border-red-200">
                      <div className="font-bold text-red-900 mb-2 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        {lang === 'en' ? 'Support Needed:' : 'ସହାୟତା ଆବଶ୍ୟକ:'}
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                        {entity.supportNeeded.map((need, idx) => (
                          <li key={idx}>{need}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {entity.recommendations.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <FileText size={16} />
                        {lang === 'en' ? 'Government Recommendations:' : 'ସରକାରୀ ସୁପାରିଶ:'}
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                        {entity.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {lang === 'en' ? 'Scheme Utilization:' : 'ଯୋଜନା ବ୍ୟବହାର:'} {entity.schemeUtilization}%
                    </span>
                    {entity.type === 'farmer' && (
                      <span>
                        {lang === 'en' ? 'MSP Compliance:' : 'MSP ଅନୁପାଳନ:'} {entity.mspCompliance}%
                      </span>
                    )}
                    <span>
                      {lang === 'en' ? 'Last Activity:' : 'ଶେଷ କାର୍ଯ୍ୟକଳାପ:'} {new Date(entity.lastActivity).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Entity Detail Modal */}
        {selectedEntity && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{selectedEntity.name}</h3>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">{lang === 'en' ? 'Type' : 'ପ୍ରକାର'}</div>
                    <div className="font-bold text-gray-900 capitalize">{selectedEntity.type}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">{lang === 'en' ? 'Status' : 'ସ୍ଥିତି'}</div>
                    <div className={`font-bold ${
                      selectedEntity.status === 'excellent' ? 'text-green-600' :
                      selectedEntity.status === 'on-track' ? 'text-blue-600' :
                      selectedEntity.status === 'at-risk' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {selectedEntity.status}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-2">{lang === 'en' ? 'Action Plan' : 'କାର୍ଯ୍ୟ ଯୋଜନା'}</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                    {selectedEntity.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GovernmentDashboard;

