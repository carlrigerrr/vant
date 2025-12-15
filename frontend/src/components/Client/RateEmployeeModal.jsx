import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';

const RateEmployeeModal = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [myRatings, setMyRatings] = useState([]);

    useEffect(() => {
        fetchEmployees();
        fetchMyRatings();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('/api/employees/list');
            setEmployees(response.data || []);
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    const fetchMyRatings = async () => {
        try {
            const response = await axios.get('/api/ratings/my-ratings');
            setMyRatings(response.data || []);
        } catch (err) {
            console.error('Error fetching my ratings:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedEmployee || rating === 0) {
            alert('Please select an employee and provide a rating');
            return;
        }

        try {
            await axios.post('/api/ratings', {
                employeeId: selectedEmployee,
                rating,
                comment
            });
            alert('Rating submitted successfully!');
            setShowForm(false);
            setSelectedEmployee('');
            setRating(0);
            setComment('');
            fetchMyRatings();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error submitting rating');
        }
    };

    const StarIcon = ({ filled, onHover, onClick }) => (
        <svg
            className={`w-8 h-8 cursor-pointer transition-colors ${filled ? 'text-yellow-400' : 'text-gray-300'
                } hover:text-yellow-300`}
            fill="currentColor"
            viewBox="0 0 20 20"
            onMouseEnter={onHover}
            onClick={onClick}
        >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <Card>
            <h3 className="text-lg font-bold text-[var(--text-heading)] mb-4">⭐ Rate Your Service</h3>

            {!showForm ? (
                <Button
                    onClick={() => setShowForm(true)}
                    variant="warning"
                    className="w-full justify-center"
                >
                    + Rate an Employee
                </Button>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-heading)] mb-2">
                            Select Employee
                        </label>
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            required
                            className="block w-full px-4 py-3 
                                text-[var(--text-body)] 
                                bg-[#F5F8FA] border border-transparent 
                                rounded-[10px] 
                                focus:bg-white focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100 focus:outline-none 
                                transition-all duration-200"
                        >
                            <option value="">Choose an employee...</option>
                            {employees.map((emp) => (
                                <option key={emp._id} value={emp._id}>
                                    {emp.username}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-heading)] mb-2">
                            Your Rating
                        </label>
                        <div
                            className="flex gap-1"
                            onMouseLeave={() => setHoverRating(0)}
                        >
                            {[1, 2, 3, 4, 5].map((star) => (
                                <StarIcon
                                    key={star}
                                    filled={star <= (hoverRating || rating)}
                                    onHover={() => setHoverRating(star)}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                                You rated: {rating} star{rating !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>

                    <Input
                        label="Comments (optional)"
                        type="textarea"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience..."
                        rows={3}
                    />

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setRating(0);
                                setComment('');
                                setSelectedEmployee('');
                            }}
                            variant="secondary"
                            className="flex-1 justify-center"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="warning"
                            className="flex-1 justify-center"
                        >
                            Submit Rating
                        </Button>
                    </div>
                </form>
            )}

            {/* My Previous Ratings */}
            {myRatings.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-md font-bold text-[var(--text-heading)] mb-3">Your Previous Ratings</h4>
                    <div className="space-y-3">
                        {myRatings.map((r) => (
                            <div key={r._id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-gray-800">
                                        {r.employeeId?.username || 'Employee'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-yellow-500">★</span>
                                        <span className="font-semibold">{r.rating}/5</span>
                                    </div>
                                </div>
                                {r.comment && (
                                    <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                    {formatDate(r.createdAt)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};

export default RateEmployeeModal;
