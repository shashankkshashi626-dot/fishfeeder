import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { doc, collection, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, isRealFirebase } from "../firebase";
import { Plus, Trash2, Calendar, Clock, RotateCw, Loader2, ArrowLeft, ToggleLeft, ToggleRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Schedule {
  id: string;
  time: string; // HH:MM
  days: number[]; // 0 = Sun, 1 = Mon ...
  quantity: number; // 1 to 5 scoops
  active: boolean;
}

export const AutoFeed: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Schedule form state
  const [newTime, setNewTime] = useState("08:00");
  const [newDays, setNewDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default weekdays
  const [newQty, setNewQty] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);

  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

  // Fetch schedules
  useEffect(() => {
    if (!user) return;
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        if (isRealFirebase) {
          const colRef = collection(db, "users", user.uid, "schedules");
          const snap = await getDocs(colRef);
          const list: Schedule[] = [];
          snap.forEach(d => {
            list.push({ id: d.id, ...d.data() } as Schedule);
          });
          setSchedules(list);
        } else {
          // Mock fetch
          const localData = localStorage.getItem(`mock_schedules_${user.uid}`);
          if (localData) {
            setSchedules(JSON.parse(localData));
          } else {
            // Seed a default schedule
            const seed = [
              { id: "sched-1", time: "08:00", days: [1, 2, 3, 4, 5], quantity: 1, active: true },
              { id: "sched-2", time: "18:00", days: [1, 3, 5], quantity: 2, active: false }
            ];
            localStorage.setItem(`mock_schedules_${user.uid}`, JSON.stringify(seed));
            setSchedules(seed);
          }
        }
      } catch (e) {
        console.error("Error fetching schedules:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, [user]);

  // Handler: Add schedule
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSaving(true);
      const newSchedule = {
        time: newTime,
        days: newDays,
        quantity: newQty,
        active: true,
      };

      if (isRealFirebase) {
        const colRef = collection(db, "users", user.uid, "schedules");
        const docRef = await addDoc(colRef, newSchedule);
        setSchedules(prev => [...prev, { id: docRef.id, ...newSchedule }]);
      } else {
        const id = `sched-${Date.now()}`;
        const updated = [...schedules, { id, ...newSchedule }];
        localStorage.setItem(`mock_schedules_${user.uid}`, JSON.stringify(updated));
        setSchedules(updated);
      }
      setShowAddForm(false);
    } catch (e) {
      console.error("Error adding schedule:", e);
    } finally {
      setSaving(false);
    }
  };

  // Handler: Delete schedule
  const handleDeleteSchedule = async (id: string) => {
    if (!user) return;
    try {
      if (isRealFirebase) {
        const docRef = doc(db, "users", user.uid, "schedules", id);
        await deleteDoc(docRef);
      } else {
        const updated = schedules.filter(s => s.id !== id);
        localStorage.setItem(`mock_schedules_${user.uid}`, JSON.stringify(updated));
      }
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error("Error deleting schedule:", e);
    }
  };

  // Handler: Toggle schedule status
  const handleToggleSchedule = async (id: string, active: boolean) => {
    if (!user) return;
    try {
      if (isRealFirebase) {
        const docRef = doc(db, "users", user.uid, "schedules", id);
        await updateDoc(docRef, { active });
      } else {
        const updated = schedules.map(s => s.id === id ? { ...s, active } : s);
        localStorage.setItem(`mock_schedules_${user.uid}`, JSON.stringify(updated));
      }
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, active } : s));
    } catch (e) {
      console.error("Error updating schedule status:", e);
    }
  };

  // Toggle Day selection helper
  const toggleDay = (dayIndex: number) => {
    if (newDays.includes(dayIndex)) {
      setNewDays(prev => prev.filter(d => d !== dayIndex));
    } else {
      setNewDays(prev => [...prev, dayIndex].sort());
    }
  };

  return (
    <main className="flex-1 p-6 md:p-8 space-y-6 bg-slate-50/40 dark:bg-slate-950/20 transition-colors duration-300 min-h-screen">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/dashboard")} className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Auto Feed Scheduler
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold leading-none mt-1">
            Automated feeding events for {user?.aquariumName || 'My Aquarium'}
          </p>
        </div>
      </div>

      {/* Global Auto Feed Enabled Switch */}
      <div className="flex justify-between items-center p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/40 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl shadow-lg">
        <div>
          <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
            Enable Auto Feed
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5">
            If turned off, no automated schedules will trigger.
          </p>
        </div>
        <button onClick={() => setEnabled(!enabled)} className="text-slate-500">
          {enabled ? (
            <ToggleRight className="w-12 h-12 text-cyan-400" />
          ) : (
            <ToggleLeft className="w-12 h-12 text-slate-300 dark:text-slate-700" />
          )}
        </button>
      </div>

      {/* Schedule Items List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Schedules List
          </span>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20 hover:bg-cyan-500/15"
            >
              <Plus className="w-3.5 h-3.5" /> Add Schedule
            </button>
          )}
        </div>

        {/* Add Form Card */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddSchedule}
              className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/40 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl shadow-lg space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Time picker */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Time (24h)
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-cyan-400 text-slate-700 dark:text-slate-300 font-mono"
                    required
                  />
                </div>

                {/* Food Quantity */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <RotateCw className="w-3 h-3" /> Food Portions
                  </label>
                  <select
                    value={newQty}
                    onChange={(e) => setNewQty(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-cyan-400 text-slate-700 dark:text-slate-300"
                  >
                    {[1, 2, 3, 4, 5].map(q => (
                      <option key={q} value={q}>{q} {q === 1 ? 'scoop' : 'scoops'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Day selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Repeat Days
                </label>
                <div className="flex gap-2">
                  {daysOfWeek.map((day, idx) => {
                    const active = newDays.includes(idx);
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => toggleDay(idx)}
                        className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                          active 
                            ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/25" 
                            : "bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600 border border-slate-200/50 dark:border-slate-800"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/20"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Schedule"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-950 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Schedule Cards */}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`p-4 rounded-3xl border transition-all ${
                  schedule.active && enabled
                    ? "border-slate-200/80 dark:border-slate-800/40 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl" 
                    : "border-slate-200/40 dark:border-slate-800/20 bg-slate-100/30 dark:bg-slate-900/20 opacity-70"
                } flex flex-col sm:flex-row justify-between sm:items-center gap-4`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                    <Clock className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-slate-800 dark:text-white font-mono">
                        {schedule.time}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-md">
                        {schedule.quantity} {schedule.quantity === 1 ? 'scoop' : 'scoops'}
                      </span>
                    </div>

                    {/* Schedule Days */}
                    <div className="flex gap-1 mt-1.5">
                      {daysOfWeek.map((day, idx) => {
                        const active = schedule.days.includes(idx);
                        return (
                          <span
                            key={idx}
                            className={`w-5 h-5 rounded-full font-bold text-[8px] flex items-center justify-center ${
                              active 
                                ? "bg-cyan-500/20 text-cyan-500" 
                                : "bg-transparent text-slate-300 dark:text-slate-700"
                            }`}
                          >
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3.5 justify-end">
                  <button
                    onClick={() => handleToggleSchedule(schedule.id, !schedule.active)}
                    className="text-slate-400"
                  >
                    {schedule.active ? (
                      <ToggleRight className="w-10 h-10 text-cyan-400" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {schedules.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No active schedules configured yet.
              </div>
            )}
          </div>
        )}
      </div>

    </main>
  );
};

export default AutoFeed;
