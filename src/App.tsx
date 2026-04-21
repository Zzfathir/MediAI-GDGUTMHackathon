import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, 
  BookOpen, 
  Bell, 
  User as UserIcon, 
  AlertCircle, 
  Send, 
  Image as ImageIcon, 
  Plus, 
  Heart, 
  Activity, 
  Moon, 
  Coffee,
  CheckCircle2,
  Trash2,
  Search,
  MapPin
} from 'lucide-react';
import { HealthProvider, useHealth } from './contexts/HealthContext';
import { auth, db } from './lib/firebase';
import { getMediAIResponse, analyzeMedicalImage } from './lib/gemini';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

// --- Components ---

const Login = () => {
  const { login } = useHealth();
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      await login();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled (popup closed). Please try again and keep the window open.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked by your browser. Please allow popups for this site or open the app in a new tab.');
      } else {
        setError('Login failed. Please check your connection or try opening in a new tab.');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
      <div className="w-24 h-24 bg-brand rounded-full flex items-center justify-center mb-6 shadow-lg shadow-brand/20">
        <Heart className="text-white w-12 h-12" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">MediAI</h1>
      <p className="text-slate-500 mb-8 max-w-xs">Your compassionate health companion.</p>
      
      <div className="w-full max-w-xs space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
            <p className="text-red-500 text-xs font-bold mb-2">{error}</p>
            <p className="text-[10px] text-red-400 leading-relaxed font-medium">
              💡 Tip: If you see this often, try opening the app in a <strong>new tab</strong> using the icon in the top-right corner.
            </p>
          </div>
        )}
        <button 
          onClick={handleLogin}
          className="w-full bg-brand text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand/10 transition-transform active:scale-95 flex items-center justify-center gap-3"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" referrerPolicy="no-referrer" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

const Onboarding = () => {
  const { profile, updateProfile } = useHealth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: '',
    age: '',
    bloodType: '',
    weight: '',
    height: '',
    allergies: '',
    conditions: ''
  });

  const handleFinish = async () => {
    await updateProfile({
      ...data,
      age: parseInt(data.age) || 0,
      weight: parseFloat(data.weight) || 0,
      height: parseFloat(data.height) || 0,
      isProfileComplete: true
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white p-8">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 leading-tight">Welcome to MediAI! 👋<br />What is your real name?</h2>
            <input 
              autoFocus
              type="text" value={data.name} onChange={e => setData({...data, name: e.target.value})}
              placeholder="Full Name"
              className="w-full bg-slate-50 border-none rounded-2xl p-6 text-xl font-bold outline-none focus:ring-2 focus:ring-brand shadow-sm"
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 leading-tight">Nice to meet you, {data.name}.<br />How old are you?</h2>
            <input 
              autoFocus
              type="number" value={data.age} onChange={e => setData({...data, age: e.target.value})}
              placeholder="Age"
              className="w-full bg-slate-50 border-none rounded-2xl p-6 text-xl font-bold outline-none focus:ring-2 focus:ring-brand shadow-sm"
            />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 leading-tight">Your body metrics.<br />Weight & Height?</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Weight (KG)</label>
                 <input 
                  type="number" value={data.weight} onChange={e => setData({...data, weight: e.target.value})}
                  placeholder="KG"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-lg font-bold outline-none focus:ring-2 focus:ring-brand shadow-sm"
                />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Height (CM)</label>
                 <input 
                  type="number" value={data.height} onChange={e => setData({...data, height: e.target.value})}
                  placeholder="CM"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-lg font-bold outline-none focus:ring-2 focus:ring-brand shadow-sm"
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 leading-tight">Almost there!<br />What is your blood type?</h2>
            <div className="grid grid-cols-4 gap-2">
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(type => (
                <button 
                  key={type}
                  onClick={() => setData({...data, bloodType: type})}
                  className={`p-4 rounded-xl font-bold border-2 transition-all ${data.bloodType === type ? 'border-brand bg-brand-light text-brand' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 leading-tight">Final important bits.<br />Any allergies or conditions?</h2>
            <div className="space-y-4">
              <input 
                type="text" value={data.allergies} onChange={e => setData({...data, allergies: e.target.value})}
                placeholder="Allergies (e.g. Seafood, Penicillin)"
                className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-brand shadow-sm"
              />
              <input 
                type="text" value={data.conditions} onChange={e => setData({...data, conditions: e.target.value})}
                placeholder="Conditions (e.g. Asthma, Diabetes)"
                className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-brand shadow-sm"
              />
            </div>
          </motion.div>
        )}
      </div>

      <div className="mt-8 max-w-sm mx-auto w-full pb-8">
        <div className="bg-slate-100 h-1 rounded-full mb-8 overflow-hidden">
          <motion.div 
            className="bg-brand h-full" 
            initial={{ width: 0 }} 
            animate={{ width: `${(step/5) * 100}%` }} 
          />
        </div>
        {step < 5 ? (
          <button 
            disabled={step === 1 && !data.name}
            onClick={() => setStep(step + 1)}
            className="w-full bg-brand text-white font-bold py-5 rounded-3xl shadow-lg shadow-brand/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
          >
            Continue
          </button>
        ) : (
          <button 
            onClick={handleFinish}
            className="w-full bg-slate-900 text-white font-bold py-5 rounded-3xl shadow-lg active:scale-95 transition-all"
          >
            Finish Setup 🚀
          </button>
        )}
      </div>
    </div>
  );
};

const ChatTab = () => {
  const { user, profile } = useHealth();
  const [messages, setMessages] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMsg = { role: 'user' as const, parts: [{ text: input }] };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Inject user profile context into the first message or prepend it if needed
      // To keep it simple and effective, we can wrap the user message with context if it's the first message
      let finalPrompt = input;
      if (messages.length === 0) {
        finalPrompt = `
User Health Profile for context:
Name: ${profile?.name || 'User'}
Age: ${profile?.age || 'Unknown'}
Metrics: ${profile?.weight || 'Unknown'}kg, ${profile?.height || 'Unknown'}cm
Blood: ${profile?.bloodType || 'Unknown'}
Allergies: ${profile?.allergies || 'None'}
Conditions: ${profile?.conditions || 'None'}

User Question: ${input}`;
      }

      const aiResponse = await getMediAIResponse([...messages, { role: 'user', parts: [{ text: finalPrompt }] }]);
      setMessages(prev => [...prev, { role: 'model' as const, parts: [{ text: aiResponse }] }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model' as const, parts: [{ text: "I'm sorry, I'm having trouble connecting right now. ⚠️" }] }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setMessages(prev => [...prev, { role: 'user', parts: [{ text: "Scanning image..." }] }]);
      setIsTyping(true);
      try {
        const aiResponse = await analyzeMedicalImage(file.type, base64, "Please analyze this medical document or medication. Use your internal instructions for 'Medication Lens' or 'Medical Document Reader' as appropriate.");
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: aiResponse }] }]);
      } catch (error) {
        console.error(error);
      } finally {
        setIsTyping(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-bottom border-slate-100 p-4 sticky top-0 z-10 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Heart className="text-brand w-5 h-5" /> MediAI Chat
        </h2>
        <div className="text-[10px] bg-brand-light text-brand px-2 py-1 rounded-full font-semibold uppercase tracking-wider">
          AI Assistant
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 inline-block max-w-xs">
              <Activity className="w-10 h-10 text-brand mx-auto mb-3" />
              <p className="text-slate-600 font-medium">How are you feeling today?</p>
              <p className="text-xs text-slate-400 mt-2">I can help with symptoms, medication reading, and document translation.</p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 max-w-md mx-auto">
              {["Headache help 🤒", "Mood check-in 💚", "Meds info 💊", "Nearby doctor 🏥"].map(hint => (
                <button 
                  key={hint} 
                  onClick={() => setInput(hint)}
                  className="bg-white border border-slate-200 p-3 rounded-2xl text-xs font-medium text-slate-700 hover:border-brand transition-colors text-left"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={msg.role === 'user' ? 'chat-bubble-user whitespace-pre-wrap' : 'chat-bubble-ai prose prose-sm max-w-none whitespace-pre-wrap'}>
              {msg.parts[0].text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="chat-bubble-ai flex gap-1 items-center px-4 py-3">
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
          <label className="p-3 bg-slate-100 rounded-2xl text-slate-500 cursor-pointer hover:bg-slate-200 transition-colors shrink-0">
            <ImageIcon className="w-6 h-6" />
            <input type="file" onChange={handleImage} accept="image/*" className="hidden" />
          </label>
          <textarea 
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder="Type your health concern..."
            className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 focus:ring-2 focus:ring-brand focus:bg-white outline-none resize-none min-h-[56px] max-h-32 text-slate-700 font-medium"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-4 bg-brand text-white rounded-2xl disabled:opacity-50 transition-all active:scale-95 shrink-0 shadow-lg shadow-brand/20"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

const JournalTab = () => {
  const { user } = useHealth();
  const [entries, setEntries] = useState<any[]>([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'journal'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user]);

  return (
    <div className="h-full bg-slate-50 overflow-y-auto">
      <header className="bg-white border-bottom border-slate-100 p-4 sticky top-0 z-10 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="text-brand w-5 h-5" /> Health Journal
        </h2>
        <button 
          onClick={() => setIsCheckingIn(true)}
          className="bg-brand text-white p-2 rounded-xl shadow-lg shadow-brand/20 active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="p-4 space-y-4 pb-24">
        {entries.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl p-8 border border-slate-100">
            <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-600 font-semibold text-lg">Empty Journal</p>
            <p className="text-sm text-slate-400">Start your first check-in to track your mood and health patterns.</p>
          </div>
        )}

        {entries.map((entry) => (
          <div key={entry.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative group overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {entry.type === 'Mood' && '💚'}
                  {entry.type === 'Note' && '📓'}
                </span>
                <div>
                  <h4 className="font-bold text-slate-900">{entry.type} Check-in</h4>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    {entry.timestamp?.toDate().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => deleteDoc(doc(db, 'users', user!.uid, 'journal', entry.id))}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Mood</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{entry.moodScore}/10</span>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-brand" style={{ width: `${entry.moodScore * 10}%` }} />
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Energy</p>
                <p className="font-bold text-sm capitalize">{entry.energyLevel}</p>
              </div>
            </div>

            {entry.note && (
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-2xl border-l-4 border-brand italic font-medium leading-relaxed">
                "{entry.note}"
              </p>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isCheckingIn && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-white flex flex-col md:max-w-md md:left-1/2 md:-translate-x-1/2"
          >
            <MentalHealthFlow onClose={() => setIsCheckingIn(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MentalHealthFlow = ({ onClose }: { onClose: () => void }) => {
  const { user } = useHealth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    moodScore: 5,
    energyLevel: 'medium',
    sleepHours: 7,
    stressLevel: 'low',
    note: ''
  });

  const handleFinish = async () => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'journal'), {
      ...data,
      userId: user.uid,
      type: 'Mood',
      timestamp: serverTimestamp()
    });
    onClose();
  };

  return (
    <div className="p-6 h-full flex flex-col bg-white">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold">Daily Check-in</h3>
        <button onClick={onClose} className="text-slate-400"><Trash2 className="w-6 h-6" /></button>
      </div>

      <div className="flex-1">
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <p className="text-5xl mb-4">
                {data.moodScore > 7 ? '😄' : data.moodScore > 4 ? '😐' : '😔'}
              </p>
              <h4 className="text-xl font-bold text-slate-800">How's your mood?</h4>
              <p className="text-slate-500 mt-2">Scale of 1–10</p>
            </div>
            <input 
              type="range" min="1" max="10" 
              value={data.moodScore} 
              onChange={(e) => setData({...data, moodScore: parseInt(e.target.value)})}
              className="w-full accent-brand h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
              <span>Struggling</span>
              <span>Great</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h4 className="text-xl font-bold text-slate-800 text-center">Energy level?</h4>
            <div className="grid grid-cols-1 gap-3">
              {['high', 'medium', 'low', 'drained'].map(level => (
                <button 
                  key={level}
                  onClick={() => setData({...data, energyLevel: level})}
                  className={`py-4 rounded-2xl font-bold capitalize transition-all ${data.energyLevel === level ? 'bg-brand text-white shadow-lg shadow-brand/20 scale-102' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="text-center">
              <Moon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-slate-800">Sleep hours?</h4>
            </div>
            <div className="flex justify-center items-center gap-6">
              <button 
                onClick={() => setData({...data, sleepHours: Math.max(0, data.sleepHours - 0.5)})}
                className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold"
              >-</button>
              <span className="text-4xl font-bold tabular-nums">{data.sleepHours}<span className="text-xl text-slate-400 ml-1">h</span></span>
              <button 
                onClick={() => setData({...data, sleepHours: Math.min(24, data.sleepHours + 0.5)})}
                className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold"
              >+</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-slate-800">One thing you're grateful for?</h4>
            </div>
            <textarea 
              autoFocus
              value={data.note}
              onChange={(e) => setData({...data, note: e.target.value})}
              placeholder="Even something small..."
              className="w-full h-40 bg-slate-50 rounded-3xl p-6 outline-none focus:ring-2 focus:ring-brand resize-none font-medium"
            />
          </div>
        )}
      </div>

      <div className="mt-8">
        {step < 4 ? (
          <button 
            onClick={() => setStep(step + 1)}
            className="w-full bg-brand text-white font-bold py-5 rounded-2xl shadow-lg shadow-brand/20 active:scale-95 transition-transform"
          >
            Next
          </button>
        ) : (
          <button 
            onClick={handleFinish}
            className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            Save Entry
          </button>
        )}
      </div>
    </div>
  );
};

const RemindersTab = () => {
  const { user } = useHealth();
  const [reminders, setReminders] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newSchedule, setNewSchedule] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'reminders'), orderBy('schedule', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setReminders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user]);

  const addReminder = async () => {
    if (!newName || !newSchedule || !user) return;
    await addDoc(collection(db, 'users', user.uid, 'reminders'), {
      userId: user.uid,
      name: newName,
      schedule: newSchedule,
      lastTaken: null
    });
    setNewName('');
    setNewSchedule('');
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto">
      <header className="bg-white border-bottom border-slate-100 p-4 sticky top-0 z-10">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bell className="text-brand w-5 h-5" /> Medical Reminders
        </h2>
      </header>

      <div className="p-4 space-y-6 pb-24">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h4 className="font-bold text-slate-800 mb-4">Add Medication</h4>
          <div className="flex flex-col gap-3">
            <input 
              type="text" value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Medication name (e.g. Paracetamol)"
              className="bg-slate-50 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-brand font-medium"
            />
            <div className="flex gap-2">
              <input 
                type="time" value={newSchedule} onChange={e => setNewSchedule(e.target.value)}
                className="flex-1 bg-slate-50 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-brand font-bold text-center"
              />
              <button 
                onClick={addReminder}
                disabled={!newName || !newSchedule}
                className="bg-brand text-white px-6 rounded-2xl font-bold shadow-lg shadow-brand/10 active:scale-95 disabled:opacity-30"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-slate-400 text-xs uppercase tracking-widest pl-2">TODAY'S SCHEDULE</h4>
          {reminders.map(rem => (
            <div key={rem.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-light text-brand rounded-2xl flex items-center justify-center font-bold">
                  {rem.schedule}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{rem.name}</h4>
                  <p className="text-xs text-slate-400">Daily Reminder</p>
                </div>
              </div>
              <button 
                onClick={() => deleteDoc(doc(db, 'users', user!.uid, 'reminders', rem.id))}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {reminders.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm italic">
              No reminders set for today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfileTab = () => {
  const { user, profile, updateProfile, logout } = useHealth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (profile) setFormData({ ...profile });
  }, [profile]);

  if (!formData) return null;

  const handleSave = async () => {
    await updateProfile(formData);
    setEditing(false);
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto">
      <header className="bg-white border-bottom border-slate-100 p-4 sticky top-0 z-10 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <UserIcon className="text-brand w-5 h-5" /> My Profile
        </h2>
        <button 
          onClick={logout}
          className="text-slate-400 text-sm font-bold"
        >
          Logout
        </button>
      </header>

      <div className="p-4 space-y-6 pb-24">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-brand opacity-20" />
          <div className="w-24 h-24 bg-brand-light rounded-full mx-auto mb-4 flex items-center justify-center text-4xl border-4 border-slate-50 shadow-md">
            👋
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{profile?.name}</h3>
          <p className="text-slate-400 text-sm font-medium">{profile?.email}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-50">
          {[
            { label: 'Name', value: formData.name, key: 'name', icon: '👤' },
            { label: 'Age', value: formData.age, key: 'age', icon: '⏳', type: 'number' },
            { label: 'Weight (kg)', value: formData.weight, key: 'weight', icon: '⚖️', type: 'number' },
            { label: 'Height (cm)', value: formData.height, key: 'height', icon: '📏', type: 'number' },
            { label: 'Blood Type', value: formData.bloodType, key: 'bloodType', icon: '🩸' },
            { label: 'Allergies', value: formData.allergies, key: 'allergies', icon: '🤧' },
            { label: 'Medical Conditions', value: formData.conditions, key: 'conditions', icon: '🏥' },
            { label: 'Medications', value: formData.medications, key: 'medications', icon: '💊' }
          ].map(item => (
            <div key={item.key} className="p-4 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
                <span className="text-base">{item.icon}</span> {item.label}
              </span>
              {editing ? (
                <input 
                  type={item.type || 'text'} 
                  value={formData[item.key]} 
                  onChange={e => setFormData({...formData, [item.key]: item.type === 'number' ? parseFloat(e.target.value) : e.target.value})}
                  className="bg-slate-50 border-none rounded-xl p-2 outline-none focus:ring-2 focus:ring-brand font-medium text-sm mt-1"
                />
              ) : (
                <span className="text-slate-700 font-semibold">{item.value || 'Not set'}</span>
              )}
            </div>
          ))}
        </div>

        <button 
          onClick={editing ? handleSave : () => setEditing(true)}
          className={`w-full py-4 rounded-2xl font-bold transition-all shadow-md active:scale-95 ${editing ? 'bg-brand text-white' : 'bg-slate-900 text-white'}`}
        >
          {editing ? 'Save Changes' : 'Edit Health Profile'}
        </button>
      </div>
    </div>
  );
};

const MapTab = () => {
  const [coords, setCoords] = useState<{lat: number, lon: number} | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => console.error(err)
    );
  }, []);

  return (
    <div className="h-full bg-slate-50 flex flex-col">
       <header className="bg-white border-bottom border-slate-100 p-4 sticky top-0 z-10 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MapPin className="text-brand w-5 h-5" /> Nearby Care
        </h2>
      </header>
      <div className="flex-1 p-4 overflow-y-auto pb-24">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Find Medical Facilities</h3>
          <p className="text-slate-500 text-sm mb-6">Your approximate location allows us to find the most relevant care near you.</p>
          
          <div className="grid grid-cols-1 gap-3">
             <a 
              href={`https://www.google.com/maps/search/hospitals+near+${coords?.lat},${coords?.lon}`} 
              target="_blank" rel="noreferrer"
              className="bg-brand text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand/10"
            >
              <Hospital className="w-5 h-5" /> Hospitals
            </a>
            <a 
              href={`https://www.google.com/maps/search/clinics+near+${coords?.lat},${coords?.lon}`} 
              target="_blank" rel="noreferrer"
              className="bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
            >
              <Activity className="w-5 h-5" /> GP Clinics
            </a>
            <a 
              href={`https://www.google.com/maps/search/pharmacy+near+${coords?.lat},${coords?.lon}`} 
              target="_blank" rel="noreferrer"
              className="bg-white border border-slate-200 text-slate-800 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <Coffee className="w-5 h-5" /> Pharmacies
            </a>
          </div>
        </div>

        <div className="mt-8 bg-brand-light p-6 rounded-3xl border border-brand/10">
          <h4 className="font-bold text-brand mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Recommendation
          </h4>
          <p className="text-slate-700 text-sm leading-relaxed font-medium">
            For emergencies (chest pain, stroke signs), immediately head to a **Hospital ER**. For minor issues like fever or cough, visit a **GP Clinic**. 
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Main App Logic ---

const AppContent = () => {
  const { user, profile, loading } = useHealth();
  const [activeTab, setActiveTab] = useState('chat');
  const [showEmergency, setShowEmergency] = useState(false);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Login />;
  if (profile && !profile.isProfileComplete) return <Onboarding />;

  return (
    <div className="relative max-w-md mx-auto h-screen bg-white shadow-2xl overflow-hidden flex flex-col">
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col"
          >
            {activeTab === 'chat' && <ChatTab />}
            {activeTab === 'journal' && <JournalTab />}
            {activeTab === 'reminders' && <RemindersTab />}
            {activeTab === 'map' && <MapTab />}
            {activeTab === 'profile' && <ProfileTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="w-full max-w-md bg-white border-t border-slate-100 flex justify-around items-center h-20 px-4 z-40 shrink-0">
        {[
          { id: 'chat', icon: MessageCircle, label: 'Chat' },
          { id: 'journal', icon: BookOpen, label: 'Log' },
          { id: 'reminders', icon: Bell, label: 'Alert' },
          { id: 'map', icon: MapPin, label: 'Care' },
          { id: 'profile', icon: UserIcon, label: 'Me' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-brand scale-110' : 'text-slate-400 opacity-60'}`}
          >
            <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'fill-brand/10' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Floating Emergency Button */}
      <button 
        onClick={() => setShowEmergency(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl shadow-red-500/40 flex items-center justify-center z-50 transition-transform active:scale-90 animate-pulse"
      >
        <AlertCircle className="w-8 h-8" />
      </button>

      <AnimatePresence>
        {showEmergency && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-red-600 flex flex-col p-8 text-white overflow-y-auto"
          >
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 border-4 border-white rounded-full flex items-center justify-center mb-6 animate-ping">
                <AlertCircle className="w-16 h-16" />
              </div>
              <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">Emergency Detected</h1>
              <p className="text-xl opacity-90 mb-12 font-medium">Professional help is just a call away.</p>
              
              <div className="w-full space-y-4 max-w-sm">
                <a href="tel:999" className="block w-full bg-white text-red-600 py-6 rounded-3xl text-2xl font-black shadow-2xl">
                  CALL 999
                </a>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-700/50 p-6 rounded-3xl border border-white/20">
                    <p className="text-xs opacity-70 font-bold uppercase mb-1">Ambulance</p>
                    <p className="text-2xl font-bold">999</p>
                  </div>
                   <div className="bg-red-700/50 p-6 rounded-3xl border border-white/20">
                    <p className="text-xs opacity-70 font-bold uppercase mb-1">Poison info</p>
                    <p className="text-sm font-bold">1800-88-8099</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 text-left space-y-6 w-full max-w-sm">
                 <h4 className="font-bold border-b border-white/20 pb-2">IMMEDIATE STEPS</h4>
                 <ul className="space-y-4 text-sm font-semibold opacity-90">
                   <li className="flex gap-4 items-start"><span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">1</span> Stay Calm. Speak clearly to dispatcher.</li>
                   <li className="flex gap-4 items-start"><span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">2</span> Stay on the line until they say to hang up.</li>
                   <li className="flex gap-4 items-start"><span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">3</span> Send your location to a family member.</li>
                 </ul>
              </div>
            </div>

            <button 
              onClick={() => setShowEmergency(false)}
              className="mt-8 text-white/60 font-medium py-4 text-sm"
            >
              Exit Emergency Mode
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <HealthProvider>
      <AppContent />
    </HealthProvider>
  );
}

// Custom Icon for Hospital
const Hospital = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M12 6v4" />
    <path d="M14 14h-4" />
    <path d="M14 18h-4" />
    <path d="M14 8h-4" />
    <path d="M18 12h1" />
    <path d="M18 16h1" />
    <path d="M18 20h1" />
    <path d="M18 8h1" />
    <path d="M22 21h-4" />
    <path d="M22 3h-4" />
    <path d="M2 21h18V3H2v18Z" />
    <path d="M6 14h4" />
    <path d="M6 18h4" />
    <path d="M6 8h4" />
  </svg>
)
