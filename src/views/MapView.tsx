import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Plus, MapPin, Clock, Users, Edit, Trash2, Inbox } from 'lucide-react';
import { useStore, useIsAdmin } from '../store';
import { useConfirm } from '../components/ConfirmDialog';
import { formatTimeRange } from '../utils/formatTime';
import { SessionModal } from '../components/SessionModal';
import { VenueModal } from '../components/VenueModal';
import { getInitialDate } from '../utils/dates';
import { geocodeAddress } from '../utils/geocode';
import mapboxgl from 'mapbox-gl';
import dayjs from 'dayjs';
import 'mapbox-gl/dist/mapbox-gl.css';

export const MapView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [venueModalOpen, setVenueModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<{
    id: string;
    name: string;
    location: string;
    capacity: number;
  } | null>(null);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  // Venue currently displayed in the details panel. Click a card or pin to
  // change it. Replaces the previous popup-on-map approach.
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  // Venue id stamped on the SessionModal when creating a new session — set
  // by the "+ Add session" affordances. Distinct from the panel selection.
  const [addSessionVenueId, setAddSessionVenueId] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const { venues, sessions, sessionTypes, tracks, speakers, addVenue, updateVenue, deleteVenue, events, currentEventId } = useStore();
  const isAdmin = useIsAdmin();
  const confirm = useConfirm();
  const currentEvent = events.find(e => e.id === currentEventId);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded && mapContainerRef.current) {
      mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
      
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v10',
        center: [-86.8104, 33.5186], // Birmingham, AL
        zoom: 14
      });
      
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      map.on('load', () => {
        setMapLoaded(true);
        setMapInstance(map);
      });
      
      return () => map.remove();
    }
  }, []);

  // Place a marker per geocoded venue. Markers are click-to-select — they
  // no longer carry popup HTML; the details panel renders session info.
  // Deps are intentionally narrow (venues + map state only) so the marker
  // set isn't recreated every time sessions or other entities change.
  useEffect(() => {
    if (!mapLoaded || !mapInstance) return;

    let cancelled = false;

    const addMarkers = async () => {
      setIsGeocoding(true);

      // Clear existing markers
      markers.forEach(marker => marker.remove());
      const newMarkers: mapboxgl.Marker[] = [];

      const coordsList = await Promise.all(
        venues.map(venue => geocodeAddress(venue.location || ''))
      );
      if (cancelled) return;

      venues.forEach((venue, idx) => {
        const coords = coordsList[idx];
        if (!coords) return;

        const markerEl = document.createElement('div');
        markerEl.className = 'venue-marker';
        markerEl.innerHTML = `
          <div class="venue-marker-inner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `;

        // Click selects the venue — details panel and selected pin styling
        // both watch selectedVenueId.
        markerEl.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedVenueId(venue.id);
        });

        const marker = new mapboxgl.Marker(markerEl)
          .setLngLat([coords.lng, coords.lat])
          .addTo(mapInstance);

        newMarkers.push(marker);
      });

      setMarkers(newMarkers);
      setIsGeocoding(false);

      // Fit bounds to include all markers (only on first load — subsequent
      // selections fly to the chosen venue rather than re-fitting).
      if (newMarkers.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        newMarkers.forEach(marker => bounds.extend(marker.getLngLat()));
        mapInstance.fitBounds(bounds, { padding: 50 });
      }
    };

    addMarkers();

    return () => { cancelled = true; };
  }, [venues, mapLoaded, mapInstance]);

  // Apply/clear the .selected CSS class on the marker that matches
  // selectedVenueId. Cheaper than re-rendering all markers when selection
  // changes — just a class swap.
  useEffect(() => {
    markers.forEach((marker, idx) => {
      const el = marker.getElement();
      if (venues[idx]?.id === selectedVenueId) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }, [selectedVenueId, markers, venues]);

  // Pan/zoom to the selected venue when selection changes.
  useEffect(() => {
    if (!selectedVenueId || !mapInstance) return;
    const idx = venues.findIndex(v => v.id === selectedVenueId);
    const marker = markers[idx];
    if (!marker) return;
    const ll = marker.getLngLat();
    mapInstance.flyTo({
      center: [ll.lng, ll.lat],
      zoom: Math.max(mapInstance.getZoom(), 15),
      duration: 600,
    });
  }, [selectedVenueId, markers, venues, mapInstance]);

  const handleVenueSave = (values: { id?: string; name: string; location: string; capacity: number }) => {
    if (values.id) {
      updateVenue(values.id, values);
    } else {
      addVenue(values);
    }
    setVenueModalOpen(false);
    setEditingVenue(null);
  };

  const handleAddClick = () => {
    setAddSessionVenueId(null);
    setEditingSession(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSession(null);
    setAddSessionVenueId(null);
  };

  const openAddSessionForVenue = (venueId: string) => {
    setAddSessionVenueId(venueId);
    setEditingSession(null);
    setModalOpen(true);
  };

  const openSessionForEdit = (sessionId: string) => {
    setEditingSession(sessionId);
    setAddSessionVenueId(null);
    setModalOpen(true);
  };

  // "Unscheduled" is a pseudo-venue in the list — sessions that exist but
  // haven't been placed at a real venue yet. Selecting it routes the
  // details panel to a different view; no pin highlights on the map.
  const UNSCHEDULED_ID = '__unscheduled__';
  const isUnscheduledView = selectedVenueId === UNSCHEDULED_ID;

  const unscheduledSessions = sessions
    .filter(s => !s.venueId || !venues.some(v => v.id === s.venueId))
    .sort((a, b) =>
      (a.date || '').localeCompare(b.date || '') ||
      (a.startTime || '').localeCompare(b.startTime || ''),
    );

  // Resolve the selected venue's data + sessions once for the details panel.
  const selectedVenue = !isUnscheduledView && selectedVenueId
    ? venues.find(v => v.id === selectedVenueId)
    : null;
  const selectedVenueSessions = selectedVenue
    ? sessions
        .filter(s => s.venueId === selectedVenue.id)
        .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || ''))
    : [];
  const selectedSessionsByDate = selectedVenueSessions.reduce((acc, s) => {
    const d = s.date || 'Unscheduled';
    (acc[d] ??= []).push(s);
    return acc;
  }, {} as Record<string, typeof sessions>);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Venues Map</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setVenueModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <Plus size={16} className="mr-1" />
            Add Venue
          </button>
          <button
            onClick={handleAddClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <Plus size={16} className="mr-1" />
            Add Session
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* — Venues list (narrow, just name + sessions chip) — */}
        <div className="md:col-span-3 bg-white p-4 rounded-lg shadow overflow-y-auto">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Venues</h2>
          <div className="space-y-2">
            {unscheduledSessions.length > 0 && (
              <div
                onClick={() => setSelectedVenueId(UNSCHEDULED_ID)}
                className={`border rounded-md p-2.5 cursor-pointer transition ${
                  isUnscheduledView
                    ? 'border-rose-400 bg-rose-50 ring-1 ring-rose-200'
                    : 'border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Inbox
                    size={14}
                    className={`flex-shrink-0 ${isUnscheduledView ? 'text-rose-600' : 'text-amber-600'}`}
                  />
                  <span className="font-medium text-sm text-gray-900 truncate flex-1">Unscheduled</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded font-medium bg-amber-100 text-amber-700">
                    {unscheduledSessions.length}
                  </span>
                </div>
              </div>
            )}
            {venues.map((venue) => {
              const venueSessions = sessions.filter(s => s.venueId === venue.id);
              const isSelected = venue.id === selectedVenueId;
              return (
                <div
                  key={venue.id}
                  onClick={() => setSelectedVenueId(venue.id)}
                  className={`border rounded-md p-2.5 cursor-pointer transition ${
                    isSelected
                      ? 'border-rose-400 bg-rose-50 ring-1 ring-rose-200'
                      : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin
                      size={14}
                      className={`flex-shrink-0 ${isSelected ? 'text-rose-600' : 'text-indigo-600'}`}
                    />
                    <span className="font-medium text-sm text-gray-900 truncate flex-1">{venue.name}</span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                        venueSessions.length > 0
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {venueSessions.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* — Selected venue details panel — */}
        <div className="md:col-span-4 bg-white rounded-lg shadow overflow-y-auto">
          {isUnscheduledView ? (
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Inbox size={18} className="text-amber-600" />
                  Unscheduled sessions
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Sessions that aren't attached to a venue yet. Click one to assign it.
                </p>
              </div>

              {unscheduledSessions.length === 0 ? (
                <p className="text-sm text-gray-500">Everything is scheduled — nothing here.</p>
              ) : (
                <div className="space-y-2">
                  {unscheduledSessions.map(session => {
                    const sessionType = sessionTypes.find(t => t.id === session.sessionTypeId);
                    const firstTrack = tracks.find(t => session.trackIds?.includes(t.id));
                    const accentColor = firstTrack?.color || sessionType?.color || '#6366f1';
                    const sessionSpeakers = speakers
                      .filter(s => session.speakerIds.includes(s.id))
                      .map(s => s.name)
                      .join(', ');
                    const timeRange = formatTimeRange(session.startTime, session.endTime);
                    const dateLabel = session.date ? dayjs(session.date).format('ddd, MMM D') : null;
                    return (
                      <button
                        key={session.id}
                        onClick={() => openSessionForEdit(session.id)}
                        className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-2 border-l-2 transition"
                        style={{ borderLeftColor: accentColor }}
                      >
                        <div className="font-medium text-sm text-gray-900">{session.title || '(untitled)'}</div>
                        <div className="flex items-center mt-1 gap-2 flex-wrap text-xs">
                          <span className="px-1.5 py-0.5 text-[10px] rounded font-medium bg-amber-100 text-amber-700 uppercase tracking-wide">
                            No venue
                          </span>
                          {dateLabel && (
                            <span className="inline-flex items-center text-gray-500">
                              {dateLabel}
                            </span>
                          )}
                          {timeRange && (
                            <span className="inline-flex items-center text-gray-500">
                              <Clock size={12} className="mr-1" /> {timeRange}
                            </span>
                          )}
                          {sessionType && (
                            <span
                              className="px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: `${sessionType.color}25`, color: sessionType.color }}
                            >
                              {sessionType.name}
                            </span>
                          )}
                        </div>
                        {sessionSpeakers && (
                          <div className="text-xs text-gray-600 mt-1 flex items-center">
                            <Users size={12} className="mr-1" /> {sessionSpeakers}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : selectedVenue ? (
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900">{selectedVenue.name}</h2>
                  {selectedVenue.location && (
                    <div className="text-sm text-gray-500 mt-0.5">{selectedVenue.location}</div>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 text-xs flex-wrap">
                    {selectedVenue.capacity ? (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded font-medium">
                        Cap. {selectedVenue.capacity}
                      </span>
                    ) : null}
                    <span
                      className={`px-1.5 py-0.5 rounded font-medium ${
                        selectedVenueSessions.length > 0
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      {selectedVenueSessions.length} session{selectedVenueSessions.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => { setEditingVenue(selectedVenue); setVenueModalOpen(true); }}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Edit venue"
                  >
                    <Edit size={16} />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={async () => {
                        const ok = await confirm({
                          title: `Delete "${selectedVenue.name}"?`,
                          body: 'This will also remove all associated sessions.',
                          confirmLabel: 'Delete',
                          destructive: true,
                        });
                        if (ok) { deleteVenue(selectedVenue.id); setSelectedVenueId(null); }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete venue"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => openAddSessionForVenue(selectedVenue.id)}
                className="w-full mb-4 inline-flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition"
              >
                <Plus size={14} /> Add session at this venue
              </button>

              {selectedVenueSessions.length === 0 ? (
                <p className="text-sm text-gray-500">No sessions scheduled at this venue yet.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(selectedSessionsByDate).map(([date, dateSessions]) => (
                    <div key={date}>
                      <div className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                        {date === 'Unscheduled' ? 'Unscheduled' : dayjs(date).format('dddd, MMMM D')}
                      </div>
                      <div className="space-y-2">
                        {dateSessions.map(session => {
                          const sessionType = sessionTypes.find(t => t.id === session.sessionTypeId);
                          const firstTrack = tracks.find(t => session.trackIds?.includes(t.id));
                          const accentColor = firstTrack?.color || sessionType?.color || '#6366f1';
                          const sessionSpeakers = speakers
                            .filter(s => session.speakerIds.includes(s.id))
                            .map(s => s.name)
                            .join(', ');
                          const timeRange = formatTimeRange(session.startTime, session.endTime);
                          return (
                            <button
                              key={session.id}
                              onClick={() => openSessionForEdit(session.id)}
                              className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-2 border-l-2 transition"
                              style={{ borderLeftColor: accentColor }}
                            >
                              <div className="font-medium text-sm text-gray-900">{session.title || '(untitled)'}</div>
                              <div className="flex items-center mt-1 gap-2 flex-wrap text-xs">
                                {timeRange && (
                                  <span className="inline-flex items-center text-gray-500">
                                    <Clock size={12} className="mr-1" /> {timeRange}
                                  </span>
                                )}
                                {sessionType && (
                                  <span
                                    className="px-1.5 py-0.5 rounded"
                                    style={{ backgroundColor: `${sessionType.color}25`, color: sessionType.color }}
                                  >
                                    {sessionType.name}
                                  </span>
                                )}
                              </div>
                              {sessionSpeakers && (
                                <div className="text-xs text-gray-600 mt-1 flex items-center">
                                  <Users size={12} className="mr-1" /> {sessionSpeakers}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6 text-center">
              <div>
                <MapPin size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">
                  Select a venue from the list or click a pin on the map to see its sessions.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* — Map — */}
        <div className="md:col-span-5 bg-white rounded-lg shadow overflow-hidden relative h-[600px] md:h-full">
          {(!mapLoaded || isGeocoding) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-gray-500 flex flex-col items-center">
                <MapIcon size={24} className="mb-2 animate-pulse" />
                <p>{isGeocoding ? 'Geocoding addresses...' : 'Loading map...'}</p>
              </div>
            </div>
          )}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Track legend — only shown when tracks exist for this event. */}
          {tracks.length > 0 && (
            <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-md shadow-sm p-2 max-w-[14rem] max-h-[40%] overflow-y-auto">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Tracks</div>
              <div className="space-y-1">
                {tracks.map(track => (
                  <div key={track.id} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: track.color || '#6366f1' }}
                    />
                    <span className="text-gray-700 truncate">{track.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <SessionModal
          isOpen={modalOpen}
          onClose={closeModal}
          sessionId={editingSession}
          initialVenueId={addSessionVenueId}
          initialTimeRange={null}
          initialDate={getInitialDate(sessions, currentEvent?.startDate)}
        />
      )}

      <VenueModal
        isOpen={venueModalOpen}
        onClose={() => {
          setVenueModalOpen(false);
          setEditingVenue(null);
        }}
        initialValues={editingVenue || undefined}
        onSave={handleVenueSave}
      />
    </div>
  );
};