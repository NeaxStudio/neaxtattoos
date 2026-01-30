import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User as UserIcon, LogOut, ArrowLeft } from 'lucide-react';
import { apiClient } from '../App';
import { toast } from 'sonner';

const DashboardPage = ({ user, setAuth }) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await apiClient.get('/bookings/my');
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuth(false);
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="bg-[#050505] text-[#E5E5E5] min-h-screen">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <button
            data-testid="dashboard-back-btn"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#A3A3A3] hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Home
          </button>
          <h1 className="text-2xl font-['Syne'] font-bold">My Dashboard</h1>
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-2 text-[#A3A3A3] hover:text-white transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* User Info */}
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="bg-neutral-900/50 border border-white/10 p-8 mb-12"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
              <UserIcon size={32} className="text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-2xl font-['Syne'] font-bold">{user?.name}</h2>
              <p className="text-[#A3A3A3]">{user?.email}</p>
              {user?.phone && <p className="text-sm text-[#A3A3A3]">{user.phone}</p>}
            </div>
          </div>
        </motion.div>

        {/* Bookings Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-['Syne'] font-bold mb-2">My Appointments</h2>
            <p className="text-[#A3A3A3]">View and manage your bookings</p>
          </div>
          <motion.button
            data-testid="dashboard-new-booking-btn"
            onClick={() => navigate('/book')}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white text-black px-6 py-3 font-bold tracking-widest text-sm hover:bg-gray-200 transition-all duration-300 hover:tracking-[0.2em]"
          >
            NEW BOOKING
          </motion.button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#A3A3A3]">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="bg-neutral-900/50 border border-white/10 p-12 text-center"
            data-testid="no-bookings-message"
          >
            <Calendar size={48} className="mx-auto mb-4 text-[#A3A3A3]" />
            <h3 className="text-xl font-['Syne'] font-bold mb-2">No Appointments Yet</h3>
            <p className="text-[#A3A3A3] mb-6">Book your first tattoo appointment with us</p>
            <motion.button
              onClick={() => navigate('/book')}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white text-black px-8 py-4 font-bold tracking-widest text-sm hover:bg-gray-200 transition-all"
            >
              BOOK NOW
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {bookings.map((booking, idx) => (
              <motion.div
                key={booking.booking_id}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                whileHover={reduceMotion ? undefined : { y: -3 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: reduceMotion ? 0 : idx * 0.06 }}
                data-testid={`booking-card-${idx}`}
                className="bg-neutral-900 border border-white/10 p-6 hover:border-[#D4AF37]/50 transition-all will-change-transform"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-['Syne'] font-bold">{booking.service_name}</h3>
                  <span className={`text-xs px-3 py-1 ${
                    booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                    booking.status === 'confirmed' ? 'bg-green-500/10 text-green-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {booking.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[#A3A3A3]">
                    <UserIcon size={16} />
                    <span className="text-sm">{booking.artist_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#A3A3A3]">
                    <Calendar size={16} />
                    <span className="text-sm">{booking.appointment_date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#A3A3A3]">
                    <Clock size={16} />
                    <span className="text-sm">{booking.appointment_time}</span>
                  </div>
                  {booking.notes && (
                    <div className="pt-3 border-t border-white/5">
                      <p className="text-sm text-[#A3A3A3]"><strong>Notes:</strong> {booking.notes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;