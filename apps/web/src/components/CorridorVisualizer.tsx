'use client';

import React from 'react';
import { MapPin, Navigation, Clock, Shield, Fuel } from 'lucide-react';

interface CorridorVisualizerProps {
  currentStage?: 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED';
  pickupName?: string;
  dropoffName?: string;
}

export function CorridorVisualizer({ 
  currentStage = 'SCHEDULED', 
  pickupName = 'TotalEnergies Berger, Lagos',
  dropoffName = 'Iwo Road Interchange, Ibadan'
}: CorridorVisualizerProps) {
  const stops = [
    { name: pickupName, label: 'Origin Hub (Lagos)', status: 'passed' },
    { name: 'Sagamu Interchange', label: 'Mid-Corridor Waypoint', status: currentStage !== 'SCHEDULED' ? 'passed' : 'upcoming' },
    { name: 'Ogere Rest Stop', label: 'Corridor Safety Zone', status: currentStage === 'DELIVERED' ? 'passed' : 'current' },
    { name: dropoffName, label: 'Destination Hub (Ibadan)', status: currentStage === 'DELIVERED' ? 'passed' : 'upcoming' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-amber-300 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 inline-block mb-1">
            Active Corridor Trajectory
          </span>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-sky-600" />
            Lagos-Ibadan Expressway (130 KM)
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-600" />
            <span>Avg. Transit: 2h 15m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-amber-500" />
            <span>5km Geofenced</span>
          </div>
        </div>
      </div>

      {/* Corridor Visual Progress Line */}
      <div className="relative my-6 px-2">
        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-100 -translate-y-1/2 rounded-full" />
        <div 
          className="absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-sky-500 to-amber-400 -translate-y-1/2 rounded-full transition-all duration-700" 
          style={{
            width: currentStage === 'DELIVERED' ? '100%' : currentStage === 'IN_TRANSIT' ? '65%' : '15%'
          }}
        />

        <div className="relative flex justify-between">
          {stops.map((stop, idx) => {
            const isCompleted = stop.status === 'passed';
            const isCurrent = stop.status === 'current';
            return (
              <div key={idx} className="flex flex-col items-center text-center max-w-[110px]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all z-10 border-2 ${
                  isCompleted 
                    ? 'bg-sky-600 text-white border-amber-300 shadow-md shadow-sky-600/30'
                    : isCurrent
                    ? 'bg-amber-400 text-slate-900 border-white ring-4 ring-amber-100 shadow-lg'
                    : 'bg-white text-slate-400 border-slate-300'
                }`}>
                  {idx + 1}
                </div>
                <span className="text-[11px] font-black text-slate-900 mt-2 line-clamp-1">
                  {stop.name}
                </span>
                <span className="text-[9px] font-bold text-slate-500">
                  {stop.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Notice Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Fuel className="w-3.5 h-3.5 text-sky-600" />
          <span>Designated Handover Hubs: TotalEnergies Berger & Iwo Road Terminal</span>
        </span>
        <span className="text-amber-700 font-extrabold">Zero Roadside Deviation Policy</span>
      </div>
    </div>
  );
}
