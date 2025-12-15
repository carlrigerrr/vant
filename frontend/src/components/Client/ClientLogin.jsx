import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Input from '../common/Input';
import Button from '../common/Button';
import logo from './../../logos/logo__full-color.svg';

const ClientLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/api/client/login', { email, password });
            if (response.data.client) {
                navigate('/client/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-body)] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-[1.375rem] shadow-[var(--shadow-soft)] p-8 sm:p-10">
                    <div className="text-center mb-10">
                        <div className="flex justify-center mb-6">
                            <img src={logo} alt="Vant" className="h-12 w-auto" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--text-heading)]">Client Portal</h1>
                        <p className="text-[var(--text-body)] mt-2">Sign in to view your service schedule</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />

                        <Button
                            type="submit"
                            disabled={loading}
                            variant="primary"
                            size="lg"
                            className="w-full justify-center !bg-blue-600 hover:!bg-blue-700 text-white"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-8 text-center pt-6 border-t border-gray-100">
                        <a href="/login" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                            Employee login →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientLogin;
