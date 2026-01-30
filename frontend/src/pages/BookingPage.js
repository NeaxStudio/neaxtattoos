import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { apiClient } from '../App';
import { toast } from 'sonner';
import { Calendar } from '../components/ui/calendar';
import { defaultArtists, defaultServices } from '../lib/defaultData';
import { useMotionEnabled } from '../hooks/useMotionEnabled';

const iconMap = {
  Palette: 'Palette',
  Sparkles: 'Sparkles',
  RefreshCw: 'RefreshCw',
  MessageCircle: 'MessageCircle'
};

const BookingPage = ({ user }) => {
  const navigate = useNavigate();
  const motionEnabled = useMotionEnabled();
  const reduceMotion = !motionEnabled;
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [artists, setArtists] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const timeSlots = [
    '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', 
    '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, artistsRes] = await Promise.all([
          apiClient.get('/services'),
          apiClient.get('/artists')
        ]);
        const loadedServices = Array.isArray(servicesRes.data) ? servicesRes.data : [];
        const loadedArtists = Array.isArray(artistsRes.data) ? artistsRes.data : [];
        setServices(loadedServices.length ? loadedServices : defaultServices);
        setArtists(loadedArtists.length ? loadedArtists : defaultArtists);
      } catch (err) {
        toast.error('Failed to load booking data');
        setServices(defaultServices);
        setArtists(defaultArtists);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!selectedService || !selectedArtist || !selectedDate || !selectedTime) {
      toast.error('Please complete all booking steps');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/bookings', {
        service_id: selectedService.service_id,
        artist_id: selectedArtist.artist_id,
        appointment_date: selectedDate.toISOString().split('T')[0],
        appointment_time: selectedTime,
        notes
      });
      toast.success('Booking confirmed! Check your email for details.');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return selectedService !== null;
    if (step === 2) return selectedArtist !== null;
    if (step === 3) return selectedDate !== null && selectedTime !== null;
    return false;
  };

  return (
    <div className="bg-[#050505] text-[#E5E5E5] min-h-screen">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <button
            data-testid="booking-back-btn"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#A3A3A3] hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <h1 className="text-2xl font-['Syne'] font-bold">Book Appointment</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Progress */}
      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            {['Service', 'Artist', 'Date & Time', 'Confirm'].map((label, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step > idx + 1 ? 'bg-[#D4AF37] text-black' : 
                    step === idx + 1 ? 'bg-white text-black' : 
                    'bg-neutral-900 text-[#A3A3A3]'
                  }`}
                >
                  {step > idx + 1 ? <Check size={20} /> : idx + 1}
                </div>
                <span className={`hidden md:block text-sm ${
                  step >= idx + 1 ? 'text-white' : 'text-[#A3A3A3]'
                }`}>
                  {label}
                </span>
                {idx < 3 && <div className="w-12 md:w-24 h-[2px] bg-neutral-900" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          key={step}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div data-testid="booking-step-1">
              <h2 className="text-4xl font-['Syne'] font-bold mb-3">Choose Your Service</h2>
              <p className="text-[#A3A3A3] mb-8">Select the type of service you want</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                {services.map((service, idx) => (
                  <motion.button
                    key={service.service_id}
                    data-testid={`service-option-${idx}`}
                    onClick={() => setSelectedService(service)}
                    whileHover={
                      reduceMotion
                        ? undefined
                        : {
                            y: -2,
                          }
                    }
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className={`text-left p-6 border transition-all ${
                      selectedService?.service_id === service.service_id
                        ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <h3 className="text-xl font-['Syne'] font-bold mb-2">{service.name}</h3>
                    <p className="text-[#A3A3A3] text-sm mb-4">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[#D4AF37] font-bold">
                        {service.price_start === 0 ? 'FREE' : `From $${service.price_start}`}
                      </span>
                      <span className="text-sm text-[#A3A3A3]">{service.duration_minutes} min</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Artist Selection */}
          {step === 2 && (
            <div data-testid="booking-step-2">
              <h2 className="text-4xl font-['Syne'] font-bold mb-3">Choose Your Artist</h2>
              <p className="text-[#A3A3A3] mb-8">Select the artist you'd like to work with</p>
              
              <div className="grid md:grid-cols-3 gap-6">
                {artists.map((artist, idx) => (
                  <motion.button
                    key={artist.artist_id}
                    data-testid={`artist-option-${idx}`}
                    onClick={() => setSelectedArtist(artist)}
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className={`text-left border transition-all overflow-hidden ${
                      selectedArtist?.artist_id === artist.artist_id
                        ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="aspect-square overflow-hidden">
                      <img 
                        src={artist.image_url}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-['Syne'] font-bold mb-1">{artist.name}</h3>
                      <p className="text-xs text-[#D4AF37] mb-2">{artist.specialty}</p>
                      <p className="text-xs text-[#A3A3A3] line-clamp-2">{artist.bio}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Date & Time Selection */}
          {step === 3 && (
            <div data-testid="booking-step-3">
              <h2 className="text-4xl font-['Syne'] font-bold mb-3">Pick Date & Time</h2>
              <p className="text-[#A3A3A3] mb-8">Choose your preferred appointment slot</p>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold mb-4">Select Date</h3>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="border border-white/10 bg-neutral-900/50 rounded-none p-4"
                    data-testid="booking-calendar"
                  />
                </div>
                
                <div>
                  <h3 className="font-bold mb-4">Select Time</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {timeSlots.map((time, idx) => (
                      <motion.button
                        key={time}
                        data-testid={`time-slot-${idx}`}
                        onClick={() => setSelectedTime(time)}
                        whileHover={reduceMotion ? undefined : { y: -1 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        className={`py-3 text-sm border transition-all ${
                          selectedTime === time
                            ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white'
                            : 'border-white/10 hover:border-white/30 text-[#A3A3A3]'
                        }`}
                      >
                        {time}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div data-testid="booking-step-4">
              <h2 className="text-4xl font-['Syne'] font-bold mb-3">Confirm Booking</h2>
              <p className="text-[#A3A3A3] mb-8">Review your appointment details</p>
              
              <div className="bg-neutral-900 border border-white/10 p-8 mb-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-[#A3A3A3]">Service:</span>
                    <span className="font-bold">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A3A3]">Artist:</span>
                    <span className="font-bold">{selectedArtist?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A3A3]">Date:</span>
                    <span className="font-bold">{selectedDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A3A3]">Time:</span>
                    <span className="font-bold">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A3A3]">Duration:</span>
                    <span className="font-bold">{selectedService?.duration_minutes} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A3A3]">Price:</span>
                    <span className="font-bold text-[#D4AF37]">
                      {selectedService?.price_start === 0 ? 'FREE' : `From $${selectedService?.price_start}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block font-bold mb-2">Additional Notes (Optional)</label>
                <textarea
                  data-testid="booking-notes-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-neutral-950 border border-white/10 focus:border-white/30 text-white placeholder:text-neutral-600 p-4 outline-none transition-colors resize-none"
                  placeholder="Any special requests or design ideas..."
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/10">
          <motion.button
            data-testid="booking-prev-btn"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2 px-6 py-3 border border-white/10 hover:border-white/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
            Previous
          </motion.button>

          {step < 4 ? (
            <motion.button
              data-testid="booking-next-btn"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 bg-white text-black px-8 py-4 font-bold tracking-widest text-sm hover:bg-gray-200 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={20} />
            </motion.button>
          ) : (
            <motion.button
              data-testid="booking-confirm-btn"
              onClick={handleSubmit}
              disabled={loading}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#D4AF37] text-black px-8 py-4 font-bold tracking-widest text-sm hover:bg-[#D4AF37]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'CONFIRMING...' : 'CONFIRM BOOKING'}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;