import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Palette, Sparkles, RefreshCw, MessageCircle, Instagram, MapPin, Phone, Mail, Menu, X, Calendar } from 'lucide-react';
import AuthModal from '../components/AuthModal';
import { apiClient } from '../App';
import { defaultArtists, defaultServices } from '../lib/defaultData';
import { useMotionEnabled } from '../hooks/useMotionEnabled';

const iconMap = {
  Palette: Palette,
  Sparkles: Sparkles,
  RefreshCw: RefreshCw,
  MessageCircle: MessageCircle
};

const LandingPage = ({ setAuth, setUser }) => {
  const navigate = useNavigate();
  const motionEnabled = useMotionEnabled();
  const reduceMotion = !motionEnabled;
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [artists, setArtists] = useState([]);
  const [services, setServices] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const uniqueArtists = (() => {
    const seen = new Set();
    return artists.filter((artist) => {
      const nameKey = (artist?.name || '').toString().trim().toLowerCase();
      const instagramKey = (artist?.instagram || '').toString().trim().toLowerCase();
      const idKey = (artist?.artist_id || '').toString().trim().toLowerCase();
      const key = nameKey || instagramKey || idKey;
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  useEffect(() => {
    const initData = async () => {
      try {
        await apiClient.post('/seed');
        const [artistsRes, servicesRes] = await Promise.all([
          apiClient.get('/artists'),
          apiClient.get('/services')
        ]);
        const loadedArtists = Array.isArray(artistsRes.data) ? artistsRes.data : [];
        const loadedServices = Array.isArray(servicesRes.data) ? servicesRes.data : [];
        setArtists(loadedArtists.length ? loadedArtists : defaultArtists);
        setServices(loadedServices.length ? loadedServices : defaultServices);
      } catch (err) {
        console.error('Failed to load data:', err);
        setArtists(defaultArtists);
        setServices(defaultServices);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('[data-animate]'));
    if (!elements.length) return;

    document.documentElement.classList.add('reveal-ready');

    const reveal = (el) => {
      if (!el.classList.contains('animate-in')) {
        el.classList.add('animate-in');
      }
    };

    const inView = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.9;
    };

    let observer;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              reveal(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
      );

      elements.forEach((el) => observer.observe(el));
    }

    const onScroll = () => {
      elements.forEach((el) => {
        if (inView(el)) reveal(el);
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [artists, services]);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const handleBookNow = () => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/book');
    } else {
      setAuthMode('login');
      setShowAuth(true);
    }
  };

  const transitionSmooth = { duration: 0.6, ease: [0.22, 1, 0.36, 1] };
  const transitionStagger = { duration: 0.5, ease: [0.22, 1, 0.36, 1] };

  const heroContainer = reduceMotion
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.6 } },
      }
    : {
        hidden: { opacity: 0, y: 22, filter: 'blur(12px)' },
        show: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: {
            duration: 0.9,
            ease: [0.19, 1, 0.22, 1],
            when: 'beforeChildren',
            staggerChildren: 0.08,
          },
        },
      };

  const heroItem = reduceMotion
    ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 12, filter: 'blur(8px)' },
        show: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] },
        },
      };

  const staggerContainer = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const revealItem = {
    hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: transitionStagger },
  };

  const revealYInitial = reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 };
  const revealYInView = { opacity: 1, y: 0 };

  const revealXLeftInitial = reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 };
  const revealXRightInitial = reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 };
  const revealXInView = { opacity: 1, x: 0 };

  return (
    <div className="bg-[#050505] text-[#E5E5E5] min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-['Syne'] font-bold tracking-tight"
          >
            NEAX<span className="text-[#D4AF37]">.</span>
          </motion.div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('artists')} className="text-sm tracking-wider hover:text-[#D4AF37] transition-colors">ARTISTS</button>
            <button onClick={() => scrollToSection('services')} className="text-sm tracking-wider hover:text-[#D4AF37] transition-colors">SERVICES</button>
            <button onClick={() => scrollToSection('gallery')} className="text-sm tracking-wider hover:text-[#D4AF37] transition-colors">GALLERY</button>
            <button onClick={() => scrollToSection('contact')} className="text-sm tracking-wider hover:text-[#D4AF37] transition-colors">CONTACT</button>
            <motion.button 
              data-testid="nav-book-btn"
              onClick={handleBookNow}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white text-black px-6 py-3 font-bold tracking-widest text-sm hover:bg-gray-200 transition-all duration-300 hover:tracking-[0.2em]"
            >
              BOOK NOW
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            data-testid="mobile-menu-btn"
            className="md:hidden text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-[#0F0F0F] border-t border-white/10 px-6 py-6 space-y-4"
          >
            <button onClick={() => scrollToSection('artists')} className="block w-full text-left text-sm tracking-wider hover:text-[#D4AF37] transition-colors">ARTISTS</button>
            <button onClick={() => scrollToSection('services')} className="block w-full text-left text-sm tracking-wider hover:text-[#D4AF37] transition-colors">SERVICES</button>
            <button onClick={() => scrollToSection('gallery')} className="block w-full text-left text-sm tracking-wider hover:text-[#D4AF37] transition-colors">GALLERY</button>
            <button onClick={() => scrollToSection('contact')} className="block w-full text-left text-sm tracking-wider hover:text-[#D4AF37] transition-colors">CONTACT</button>
            <motion.button 
              data-testid="mobile-book-btn"
              onClick={handleBookNow}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="w-full bg-white text-black px-6 py-3 font-bold tracking-widest text-sm mt-4"
            >
              BOOK NOW
            </motion.button>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-end">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1604449325317-4967c715538a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwyfHx0YXR0b28lMjBhcnRpc3QlMjB3b3JraW5nJTIwY2xvc2UlMjB1cCUyMGJsYWNrJTIwYW5kJTIwd2hpdGV8ZW58MHx8fHwxNzY5Nzc3OTk0fDA&ixlib=rb-4.1.0&q=85')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/60 to-[#050505]" />
        
        <div className="relative z-10 px-6 md:px-12 pb-24 max-w-7xl mx-auto w-full hero-entrance">
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="show"
          >
            <motion.p variants={heroItem} className="text-sm font-['Cinzel'] tracking-[0.3em] text-[#D4AF37] mb-4">
              EST. 2024 — LOS ANGELES
            </motion.p>
            <motion.h1 variants={heroItem} className="text-6xl md:text-8xl lg:text-9xl font-['Syne'] font-bold leading-none mb-6">
              INK IS<br />ETERNAL
            </motion.h1>
            <motion.p variants={heroItem} className="text-lg md:text-xl text-[#A3A3A3] max-w-lg mb-8">
              Art is Pain. Premium tattoo artistry in the heart of Los Angeles.
            </motion.p>
            <motion.button
              variants={heroItem}
              data-testid="hero-book-btn"
              onClick={handleBookNow}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              whileHover={reduceMotion ? undefined : { y: -1 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white text-black px-10 py-5 font-bold tracking-widest text-sm hover:bg-gray-200 transition-all duration-300 hover:tracking-[0.2em] inline-flex items-center gap-3"
            >
              <Calendar size={20} />
              BOOK APPOINTMENT
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div data-animate="left-blur" style={{ '--reveal-delay': '0ms', '--reveal-duration': '880ms' }}>
            <h2 className="text-5xl md:text-6xl font-['Syne'] font-bold mb-6">Where Art<br />Meets Skin</h2>
            <p className="text-lg text-[#A3A3A3] leading-relaxed mb-6">
              At Neax Tattoos, we don't just create tattoos — we craft permanent art that tells your story. Our award-winning artists bring decades of combined experience to every piece.
            </p>
            <p className="text-lg text-[#A3A3A3] leading-relaxed">
              From intricate blackwork to delicate fine lines, we specialize in custom designs that push the boundaries of what's possible.
            </p>
          </div>
          <div data-animate="right-blur" style={{ '--reveal-delay': '140ms', '--reveal-duration': '920ms' }} className="relative h-[500px]">
            <img 
              src="https://images.unsplash.com/photo-1644165571949-3455b964db98?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwxfHxlZGd5JTIwaW5kdXN0cmlhbCUyMHRhdHRvbyUyMHN0dWRpbyUyMGludGVyaW9yJTIwZGFya3xlbnwwfHx8fDE3Njk3Nzc5OTZ8MA&ixlib=rb-4.1.0&q=85"
              alt="Studio"
              className="w-full h-full object-cover border border-white/5"
            />
          </div>
        </div>
      </section>

      {/* Artists Section */}
      <section id="artists" className="py-32 px-6 md:px-12 bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto">
          <div data-animate="up-blur" style={{ '--reveal-delay': '0ms', '--reveal-duration': '820ms' }} className="mb-16">
            <h2 className="text-5xl md:text-6xl font-['Syne'] font-bold mb-4">Our Artists</h2>
            <p className="text-lg text-[#A3A3A3]">Meet the masters behind the ink</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {uniqueArtists.map((artist, idx) => {
              const Icon = Instagram;
              return (
                <motion.div
                  key={artist.artist_id || artist.name}
                  data-testid={`artist-card-${idx}`}
                  data-animate={
                    idx % 3 === 0 ? 'up-blur' : idx % 3 === 1 ? 'left-blur' : 'right-blur'
                  }
                  style={{ '--reveal-delay': `${idx * 70}ms`, '--reveal-duration': '860ms' }}
                  whileHover={reduceMotion ? undefined : { y: -3 }}
                  className="group relative h-full overflow-hidden bg-neutral-900/50 border border-white/5 hover:border-white/20 transition-all duration-500 will-change-transform"
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    <img 
                      src={artist.image_url}
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-['Syne'] font-bold mb-2">{artist.name}</h3>
                    <p className="text-sm text-[#D4AF37] mb-3 tracking-wider">{artist.specialty}</p>
                    <p className="text-sm text-[#A3A3A3] mb-4 leading-relaxed">{artist.bio}</p>
                    <div className="flex items-center gap-2 text-sm text-[#A3A3A3]">
                      <Icon size={16} />
                      <span>{artist.instagram}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div data-animate="up-blur" style={{ '--reveal-delay': '0ms', '--reveal-duration': '820ms' }} className="mb-16 text-center">
            <h2 className="text-5xl md:text-6xl font-['Syne'] font-bold mb-4">Services</h2>
            <p className="text-lg text-[#A3A3A3]">Professional tattoo services tailored to you</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service, idx) => {
              const Icon = iconMap[service.icon] || Palette;
              return (
                <motion.div
                  key={service.service_id || service.name}
                  data-testid={`service-card-${idx}`}
                  data-animate={idx % 2 === 0 ? 'up-blur' : 'scale-blur'}
                  style={{ '--reveal-delay': `${idx * 60}ms`, '--reveal-duration': '800ms' }}
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                  className="bg-neutral-900 h-full border border-white/10 p-8 hover:border-[#D4AF37]/50 transition-all group will-change-transform"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-[#D4AF37]/10 p-4 group-hover:bg-[#D4AF37]/20 transition-colors">
                      <Icon size={32} className="text-[#D4AF37]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-['Syne'] font-bold mb-2">{service.name}</h3>
                      <p className="text-[#A3A3A3] mb-4 leading-relaxed">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[#D4AF37] font-bold text-xl">
                          {service.price_start === 0 ? 'FREE' : `From $${service.price_start}`}
                        </span>
                        <span className="text-sm text-[#A3A3A3]">{service.duration_minutes} min</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-32 px-6 md:px-12 bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto">
          <div data-animate="up-blur" style={{ '--reveal-delay': '0ms', '--reveal-duration': '820ms' }} className="mb-16">
            <h2 className="text-5xl md:text-6xl font-['Syne'] font-bold mb-4">Gallery</h2>
            <p className="text-lg text-[#A3A3A3]">Recent work from our studio</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              'https://images.unsplash.com/photo-1769605767707-80909ec160cc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwxfHxhcnRpc3RpYyUyMHRhdHRvbyUyMHBvcnRyYWl0JTIwcGhvdG9ncmFwaHl8ZW58MHx8fHwxNzY5Nzc4MDAwfDA&ixlib=rb-4.1.0&q=85',
              'https://images.unsplash.com/photo-1764698072603-2dd6f166513e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHw0fHxhcnRpc3RpYyUyMHRhdHRvbyUyMHBvcnRyYWl0JTIwcGhvdG9ncmFwaHl8ZW58MHx8fHwxNzY5Nzc4MDAwfDA&ixlib=rb-4.1.0&q=85',
              'https://images.unsplash.com/photo-1700133653790-9e5da9041167?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwzfHx0YXR0b28lMjBhcnRpc3QlMjB3b3JraW5nJTIwY2xvc2UlMjB1cCUyMGJsYWNrJTIwYW5kJTIwd2hpdGV8ZW58MHx8fHwxNzY5Nzc3OTk0fDA&ixlib=rb-4.1.0&q=85',
              'https://images.unsplash.com/photo-1655960556432-b74f6ff0a54b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwxfHx0YXR0b28lMjBhcnRpc3QlMjB3b3JraW5nJTIwY2xvc2UlMjB1cCUyMGJsYWNrJTIwYW5kJTIwd2hpdGV8ZW58MHx8fHwxNzY5Nzc3OTk0fDA&ixlib=rb-4.1.0&q=85',
              'https://images.unsplash.com/photo-1767887874488-5f715c7db794?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwzfHxhcnRpc3RpYyUyMHRhdHRvbyUyMHBvcnRyYWl0JTIwcGhvdG9ncmFwaHl8ZW58MHx8fHwxNzY5Nzc4MDAwfDA&ixlib=rb-4.1.0&q=85',
              'https://images.unsplash.com/photo-1604449325317-4967c715538a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwyfHx0YXR0b28lMjBhcnRpc3QlMjB3b3JraW5nJTIwY2xvc2UlMjB1cCUyMGJsYWNrJTIwYW5kJTIwd2hpdGV8ZW58MHx8fHwxNzY5Nzc3OTk0fDA&ixlib=rb-4.1.0&q=85'
            ].map((img, idx) => (
              <div
                key={idx}
                data-animate="scale-blur"
                style={{ '--reveal-delay': `${idx * 40}ms`, '--reveal-duration': '760ms' }}
                className="aspect-square overflow-hidden border border-white/5 group cursor-pointer"
              >
                <img 
                  src={img}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div data-animate="up-blur" style={{ '--reveal-delay': '0ms', '--reveal-duration': '820ms' }} className="mb-16 text-center">
            <h2 className="text-5xl md:text-6xl font-['Syne'] font-bold mb-4">Client Stories</h2>
            <p className="text-lg text-[#A3A3A3]">What our clients say about us</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Chen', text: 'Marcus is an absolute artist. My geometric sleeve is a masterpiece. The attention to detail is unmatched.' },
              { name: 'David Kim', text: 'Aria\'s fine line work is incredible. She brought my vision to life perfectly. Highly recommend!' },
              { name: 'Emma Rodriguez', text: 'Jake\'s traditional work is top-tier. Professional, clean studio, and amazing results. Worth every penny.' }
            ].map((testimonial, idx) => (
              <div
                key={idx}
                data-animate="up-blur"
                style={{ '--reveal-delay': `${idx * 70}ms`, '--reveal-duration': '800ms' }}
                className="bg-neutral-900 border border-white/10 p-8"
              >
                <div className="text-[#D4AF37] text-4xl mb-4 font-['Cinzel']">"</div>
                <p className="text-[#A3A3A3] leading-relaxed mb-6">{testimonial.text}</p>
                <p className="font-['Syne'] font-bold">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 px-6 md:px-12 bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            <div data-animate="left-blur" style={{ '--reveal-delay': '0ms', '--reveal-duration': '880ms' }}>
              <h2 className="text-5xl md:text-6xl font-['Syne'] font-bold mb-8">Visit Us</h2>
              
              <div className="space-y-6">
                <div data-animate="up-blur" style={{ '--reveal-delay': '40ms', '--reveal-duration': '760ms' }} className="flex items-start gap-4">
                  <MapPin size={24} className="text-[#D4AF37] mt-1" />
                  <div>
                    <p className="font-bold mb-1">Location</p>
                    <p className="text-[#A3A3A3]">1234 Sunset Blvd<br />Los Angeles, CA 90028</p>
                  </div>
                </div>
                
                <div data-animate="up-blur" style={{ '--reveal-delay': '120ms', '--reveal-duration': '760ms' }} className="flex items-start gap-4">
                  <Phone size={24} className="text-[#D4AF37] mt-1" />
                  <div>
                    <p className="font-bold mb-1">Phone</p>
                    <p className="text-[#A3A3A3]">(310) 555-0123</p>
                  </div>
                </div>
                
                <div data-animate="up-blur" style={{ '--reveal-delay': '200ms', '--reveal-duration': '760ms' }} className="flex items-start gap-4">
                  <Mail size={24} className="text-[#D4AF37] mt-1" />
                  <div>
                    <p className="font-bold mb-1">Email</p>
                    <p className="text-[#A3A3A3]">hello@neaxtattoos.com</p>
                  </div>
                </div>
              </div>

              <div data-animate="up-blur" style={{ '--reveal-delay': '260ms', '--reveal-duration': '760ms' }} className="mt-12">
                <p className="font-bold mb-3">Hours</p>
                <div className="text-[#A3A3A3] space-y-1">
                  <p>Mon - Fri: 11am - 8pm</p>
                  <p>Saturday: 12pm - 9pm</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>

            <div data-animate="right-blur" style={{ '--reveal-delay': '120ms', '--reveal-duration': '900ms' }} className="flex items-center justify-center">
              <button 
                data-testid="contact-book-btn"
                onClick={handleBookNow}
                className="bg-white text-black px-12 py-6 font-bold tracking-widest text-lg hover:bg-gray-200 transition-all duration-300 hover:tracking-[0.2em]"
              >
                BOOK APPOINTMENT
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[#A3A3A3] text-sm">
            © 2024 Neax Tattoos. All rights reserved. | Ink is Eternal. Art is Pain.
          </p>
          <p className="text-[#525252] text-xs mt-2">v2.1.0</p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal 
          mode={authMode}
          setMode={setAuthMode}
          onClose={() => setShowAuth(false)}
          setAuth={setAuth}
          setUser={setUser}
        />
      )}
    </div>
  );
};

export default LandingPage;