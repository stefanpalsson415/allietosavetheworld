import React, { useState, useEffect } from 'react';
import {
  Calendar,
  RotateCw,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRightLeft,
  FileText,
  Star,
  TrendingUp
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { useFamily } from '../../contexts/FamilyContext';
import RotationManagementService from '../../services/RotationManagementService';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

/**
 * Rotation Calendar View
 * Visualizes domain rotations and handoff schedules
 */
const RotationCalendarView = () => {
  const { familyId, familyMembers } = useFamily();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [rotations, setRotations] = useState([]);
  const [handoffs, setHandoffs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRotation, setSelectedRotation] = useState(null);
  const [showRotationModal, setShowRotationModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Domain colors for visual distinction
  const domainColors = {
    medical: 'bg-red-100 border-red-300 text-red-800',
    meals: 'bg-green-100 border-green-300 text-green-800',
    school: 'bg-blue-100 border-blue-300 text-blue-800',
    activities: 'bg-purple-100 border-purple-300 text-purple-800',
    household: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    finances: 'bg-orange-100 border-orange-300 text-orange-800'
  };

  useEffect(() => {
    if (familyId) {
      loadRotations();
      loadHandoffs();
    }
  }, [familyId, currentMonth]);

  const loadRotations = async () => {
    try {
      const rotationsQuery = query(
        collection(db, 'domainRotations'),
        where('familyId', '==', familyId)
      );

      const unsubscribe = onSnapshot(rotationsQuery, (snapshot) => {
        const rotationData = [];
        snapshot.forEach((doc) => {
          rotationData.push({ id: doc.id, ...doc.data() });
        });
        setRotations(rotationData);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading rotations:', error);
      setLoading(false);
    }
  };

  const loadHandoffs = async () => {
    try {
      const handoffsQuery = query(
        collection(db, 'handoffs'),
        where('familyId', '==', familyId),
        where('status', 'in', ['scheduled', 'in-progress'])
      );

      const handoffs = await getDocs(handoffsQuery);
      const handoffData = [];
      handoffs.forEach((doc) => {
        handoffData.push({ id: doc.id, ...doc.data() });
      });
      setHandoffs(handoffData);
    } catch (error) {
      console.error('Error loading handoffs:', error);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getRotationsForDay = (day) => {
    return rotations.filter((rotation) => {
      if (!rotation.rotationPattern?.schedule) return false;

      return rotation.rotationPattern.schedule.some((period) => {
        const periodStart = period.startDate?.toDate ? period.startDate.toDate() : new Date(period.startDate);
        const periodEnd = period.endDate?.toDate ? period.endDate.toDate() : new Date(period.endDate);

        return isSameDay(periodStart, day) || isSameDay(periodEnd, day);
      });
    });
  };

  const getHandoffsForDay = (day) => {
    return handoffs.filter((handoff) => {
      const scheduledDate = handoff.scheduledDate?.toDate
        ? handoff.scheduledDate.toDate()
        : new Date(handoff.scheduledDate);
      return isSameDay(scheduledDate, day);
    });
  };

  const getCurrentLeadForDomain = (domain) => {
    const rotation = rotations.find(r => r.domain === domain);
    if (!rotation) return null;

    const member = familyMembers.find(m =>
      m.id === rotation.currentState?.lead ||
      m.email === rotation.currentState?.lead
    );

    return member?.name || rotation.currentState?.lead;
  };

  const handleRotationSwap = async (rotation) => {
    // Show swap modal or handle swap logic
    console.log('Swap rotation:', rotation);
    // This would open a modal to select swap participants
  };

  const handleCompleteHandoff = async (handoffId) => {
    try {
      await RotationManagementService.completeHandoff(handoffId);
      loadHandoffs(); // Refresh handoffs
    } catch (error) {
      console.error('Error completing handoff:', error);
    }
  };

  const handleRateRotation = async (rotation, rating) => {
    try {
      await RotationManagementService.rateRotationPeriod(
        familyId,
        rotation.domain,
        rating,
        'Rating from calendar view'
      );
    } catch (error) {
      console.error('Error rating rotation:', error);
    }
  };

  const renderCalendarDay = (day) => {
    const dayRotations = getRotationsForDay(day);
    const dayHandoffs = getHandoffsForDay(day);
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isSelectedDay = selectedDate && isSameDay(day, selectedDate);
    const isTodayDate = isToday(day);

    return (
      <div
        key={day.toString()}
        onClick={() => setSelectedDate(day)}
        className={`
          min-h-24 p-2 border cursor-pointer transition-all
          ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
          ${isSelectedDay ? 'ring-2 ring-purple-600' : ''}
          ${isTodayDate ? 'bg-purple-50' : ''}
          hover:bg-gray-50
        `}
      >
        <div className="flex justify-between items-start mb-1">
          <span className={`text-sm font-medium ${isTodayDate ? 'text-purple-600' : ''}`}>
            {format(day, 'd')}
          </span>
          {(dayRotations.length > 0 || dayHandoffs.length > 0) && (
            <div className="flex gap-1">
              {dayRotations.length > 0 && (
                <RotateCw className="w-3 h-3 text-purple-600" />
              )}
              {dayHandoffs.length > 0 && (
                <AlertCircle className="w-3 h-3 text-orange-600" />
              )}
            </div>
          )}
        </div>

        {/* Mini rotation indicators */}
        <div className="space-y-1">
          {dayRotations.slice(0, 2).map((rotation, idx) => {
            const isStart = rotation.rotationPattern.schedule.some((period) => {
              const periodStart = period.startDate?.toDate ? period.startDate.toDate() : new Date(period.startDate);
              return isSameDay(periodStart, day);
            });

            return (
              <div
                key={idx}
                className={`text-xs px-1 py-0.5 rounded ${domainColors[rotation.domain] || 'bg-gray-100'}`}
              >
                {isStart ? '→' : '←'} {rotation.domain}
              </div>
            );
          })}
          {dayRotations.length > 2 && (
            <div className="text-xs text-gray-500">+{dayRotations.length - 2} more</div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">
          <Calendar className="w-12 h-12 mb-2 mx-auto" />
          <p>Loading rotation calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Rotation Calendar</h2>
            <p className="opacity-90">Track domain rotations and handoff schedules</p>
          </div>
          <button
            onClick={() => setShowRotationModal(true)}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Rotation</span>
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Active Rotations Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.keys(domainColors).map((domain) => {
          const currentLead = getCurrentLeadForDomain(domain);
          const rotation = rotations.find(r => r.domain === domain);

          if (!rotation) return null;

          return (
            <div
              key={domain}
              className={`p-3 rounded-lg border ${domainColors[domain]}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium capitalize">{domain}</span>
                <Settings
                  className="w-3 h-3 cursor-pointer hover:opacity-70"
                  onClick={() => setSelectedRotation(rotation)}
                />
              </div>
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="text-xs truncate">{currentLead || 'Unassigned'}</span>
              </div>
              {rotation.currentState?.periodEnd && (
                <div className="text-xs opacity-75 mt-1">
                  Until {format(
                    rotation.currentState.periodEnd.toDate
                      ? rotation.currentState.periodEnd.toDate()
                      : new Date(rotation.currentState.periodEnd),
                    'MMM d'
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-sm font-medium text-gray-700 text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {getDaysInMonth().map(renderCalendarDay)}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-lg mb-4">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>

          {/* Rotations for selected date */}
          <div className="space-y-3">
            {getRotationsForDay(selectedDate).map((rotation) => {
              const period = rotation.rotationPattern.schedule.find((p) => {
                const start = p.startDate?.toDate ? p.startDate.toDate() : new Date(p.startDate);
                const end = p.endDate?.toDate ? p.endDate.toDate() : new Date(p.endDate);
                return isSameDay(start, selectedDate) || isSameDay(end, selectedDate);
              });

              const isStart = period && isSameDay(
                period.startDate?.toDate ? period.startDate.toDate() : new Date(period.startDate),
                selectedDate
              );

              return (
                <div key={rotation.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <RotateCw className="w-4 h-4 text-purple-600" />
                      <span className="font-medium capitalize">{rotation.domain} Rotation</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${domainColors[rotation.domain]}`}>
                      {isStart ? 'Starting' : 'Ending'}
                    </span>
                  </div>

                  {isStart ? (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{period.lead}</span> takes over from{' '}
                      <span className="font-medium">{rotation.currentState?.lead}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{rotation.currentState?.lead}</span>'s rotation ends
                    </p>
                  )}

                  {rotation.rotationPattern.rules.requireHandoff && (
                    <div className="mt-2 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 text-orange-600" />
                      <span className="text-xs text-orange-600">Handoff required</span>
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleRotationSwap(rotation)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      Swap
                    </button>
                    <button className="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Handoffs for selected date */}
            {getHandoffsForDay(selectedDate).map((handoff) => (
              <div key={handoff.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="font-medium">Handoff: {handoff.domain}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    handoff.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {handoff.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  From <span className="font-medium">{handoff.fromUserId}</span> to{' '}
                  <span className="font-medium">{handoff.toUserId}</span>
                </p>

                {handoff.checklist && (
                  <div className="space-y-1 mb-3">
                    {handoff.checklist.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        {item.completed ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-gray-400" />
                        )}
                        <span className={item.completed ? 'line-through text-gray-500' : ''}>
                          {item.task}
                        </span>
                      </div>
                    ))}
                    {handoff.checklist.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{handoff.checklist.length - 3} more items
                      </span>
                    )}
                  </div>
                )}

                {handoff.status !== 'completed' && (
                  <button
                    onClick={() => handleCompleteHandoff(handoff.id)}
                    className="px-3 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                  >
                    Complete Handoff
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Rotation Details Modal */}
      {selectedRotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold capitalize">
                {selectedRotation.domain} Rotation Details
              </h3>
              <button
                onClick={() => setSelectedRotation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {/* Rotation Performance */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Lead</p>
                <p className="font-medium">{getCurrentLeadForDomain(selectedRotation.domain)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Rotation Frequency</p>
                <p className="font-medium capitalize">{selectedRotation.frequency}</p>
              </div>

              {selectedRotation.performance && (
                <>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Rotations Completed</p>
                    <p className="font-medium">{selectedRotation.performance.rotationsCompleted || 0}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= (selectedRotation.performance.averageRating || 0)
                              ? 'text-yellow-500 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">
                        ({selectedRotation.performance.averageRating?.toFixed(1) || 'N/A'})
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Rate this rotation */}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Rate Current Period</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleRateRotation(selectedRotation, rating)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Star className="w-5 h-5 text-gray-400 hover:text-yellow-500" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RotationCalendarView;