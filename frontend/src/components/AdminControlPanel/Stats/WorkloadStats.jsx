import { useState, useEffect } from 'react';
import axios from 'axios';
import { HashLoader } from 'react-spinners';

const WorkloadStats = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/api/stats/workload');
                setStats(response.data);
            } catch (err) {
                console.error('Error fetching workload stats:', err);
                setError('Failed to load workload statistics');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-4">
                <HashLoader size={30} color="#3B82F6" />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center p-4">{error}</div>;
    }

    const maxShifts = Math.max(...stats.map(s => s.shiftCount), 0);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Employee Workload (Current Schedule)</h2>
            <div className="space-y-4">
                {stats.map(user => (
                    <div key={user.userId} className="flex items-center">
                        <div className="w-32 text-sm font-medium text-gray-600 truncate" title={user.username}>
                            {user.username}
                        </div>
                        <div className="flex-1 mx-4">
                            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${user.shiftCount > 5 ? 'bg-red-500' :
                                            user.shiftCount > 3 ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}
                                    style={{ width: `${maxShifts > 0 ? (user.shiftCount / maxShifts) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="w-12 text-sm font-bold text-gray-700 text-right">
                            {user.shiftCount}
                        </div>
                    </div>
                ))}

                {stats.length === 0 && (
                    <p className="text-center text-gray-500">No data available</p>
                )}
            </div>
            <div className="mt-4 flex justify-end space-x-4 text-xs text-gray-500">
                <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div> Normal (0-3)</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div> Heavy (4-5)</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div> Overload (&gt;5)</div>
            </div>
        </div>
    );
};

export default WorkloadStats;
