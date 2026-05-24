import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Plus, MapPin, Clock, Users, Edit, Trash2 } from 'lucide-react';
import { useStore } from '../store';
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
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const { venues, sessions, sessionTypes, speakers, addVenue, updateVenue, deleteVenue } = useStore();

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

  // Add markers for venues
  useEffect(() => {
    if (!mapLoaded || !mapInstance) return;

    const addMarkers = async () => {
      setIsGeocoding(true);
      
      // Clear existing markers
      markers.forEach(marker => marker.remove());
      const newMarkers: mapboxgl.Marker[] = [];

      // Geocode all venues
      const coordsList = await Promise.all(
        venues.map(venue => geocodeAddress(venue.location || ''))
      );

      venues.forEach((venue, idx) => {
        const coords = coordsList[idx];
        
        // Get venue sessions
        const venueSessions = sessions.filter(session => session.venueId === venue.id);
        
        // Create marker element
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
        
        // Create popup content
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          maxWidth: '300px',
          className: 'venue-popup'
        });
        
        // Group sessions by date
        const sessionsByDate = venueSessions.reduce((acc, session) => {
          if (!acc[session.date]) acc[session.date] = [];
          acc[session.date].push(session);
          return acc;
        }, {} as Record<string, typeof sessions>);

        // Sort sessions by start time
        Object.values(sessionsByDate).forEach(dateSessions => {
          dateSessions.sort((a, b) => a.startTime.localeCompare(b.startTime));
        });

        // Set popup content
        const popupContent = document.createElement('div');
        popupContent.innerHTML = `
          <div class="p-4">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="font-bold text-gray-900">${venue.name}</h3>
                <div class="text-sm text-gray-600 mt-1">
                  ${venue.location || ''}
                  ${venue.capacity ? `
                    <span class="inline-flex items-center ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">
                      <Users size="12" class="mr-1" />
                      Capacity: ${venue.capacity}
                    </span>
                  ` : ''}
                </div>
              </div>
              <div class="flex space-x-2">
                <button class="edit-venue-btn p-1 text-gray-400 hover:text-indigo-600 transition-colors">
                  <Edit size={16} />
                </button>
                <button class="delete-venue-btn p-1 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            ${Object.keys(sessionsByDate).length > 0 ? `
              <div class="space-y-4">
                ${Object.entries(sessionsByDate).map(([date, dateSessions]) => `
                  <div>
                    <div class="text-xs font-medium text-gray-700 mb-2">
                      ${dayjs(date).format('dddd, MMMM D')}
                    </div>
                    <div class="space-y-2">
                      ${dateSessions.map(session => {
                        const sessionType = sessionTypes.find(t => t.id === session.sessionTypeId);
                        const sessionSpeakers = speakers
                          .filter(s => session.speakerIds.includes(s.id))
                          .map(s => s.name)
                          .join(', ');

                        return `
                          <div class="bg-gray-50 rounded-lg p-2">
                            <div class="font-medium text-sm">${session.title}</div>
                            <div class="flex items-center mt-1 space-x-2">
                              <span class="inline-flex items-center text-xs text-gray-500">
                                <Clock size="12" class="mr-1" />
                                ${session.startTime} - ${session.endTime}
                              </span>
                              ${sessionType ? `
                                <span class="inline-flex items-center text-xs px-1.5 py-0.5 rounded" 
                                      style="background-color: ${sessionType.color}25; color: ${sessionType.color}">
                                  ${sessionType.name}
                                </span>
                              ` : ''}
                            </div>
                            ${sessionSpeakers ? `
                              <div class="text-xs text-gray-600 mt-1">
                                <span class="inline-flex items-center">
                                  <Users size="12" class="mr-1" />
                                  ${sessionSpeakers}
                                </span>
                              </div>
                            ` : ''}
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="text-sm text-gray-500 mb-3">No sessions scheduled</div>
            `}

            <button 
              class="mt-4 w-full bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors add-session-btn"
              data-venue-id="${venue.id}"
            >
              + Add session to this venue
            </button>
          </div>
        `;
        
        // Add click handlers
        const addButton = popupContent.querySelector('.add-session-btn');
        const editButton = popupContent.querySelector('.edit-venue-btn');
        const deleteButton = popupContent.querySelector('.delete-venue-btn');

        if (addButton) {
          addButton.addEventListener('click', () => {
            setSelectedVenue(venue.id);
            setEditingSession(null);
            setModalOpen(true);
          });
        }

        if (editButton) {
          editButton.addEventListener('click', () => {
            setEditingVenue(venue);
            setVenueModalOpen(true);
          });
        }

        if (deleteButton) {
          deleteButton.addEventListener('click', () => {
            if (window.confirm('Are you sure you want to delete this venue? This will also remove all associated sessions.')) {
              deleteVenue(venue.id);
            }
          });
        }
        
        popup.setDOMContent(popupContent);
        
        // Create and add the marker
        const marker = new mapboxgl.Marker(markerEl)
          .setLngLat([coords.lng, coords.lat])
          .setPopup(popup)
          .addTo(mapInstance);
        
        newMarkers.push(marker);
      });
      
      setMarkers(newMarkers);
      setIsGeocoding(false);

      // Fit bounds to include all markers
      if (newMarkers.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        newMarkers.forEach(marker => bounds.extend(marker.getLngLat()));
        mapInstance.fitBounds(bounds, { padding: 50 });
      }
    };

    addMarkers();
  }, [venues, sessions, mapLoaded, mapInstance, sessionTypes, speakers]);

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
    setSelectedVenue(null);
    setEditingSession(null);
    setModalOpen(true);
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setEditingSession(null);
    setSelectedVenue(null);
  };

  const handleVenueClick = (venueId: string) => {
    const marker = markers.find((_, index) => venues[index].id === venueId);
    if (marker) {
      marker.togglePopup();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Venues Map</h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => setVenueModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus size={16} className="mr-1" />
            Add Venue
          </button>
          <button 
            onClick={handleAddClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus size={16} className="mr-1" />
            Add Session
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Venues List */}
        <div className="bg-white p-4 rounded-lg shadow overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-800">Venues</h2>
          </div>
          
          <div className="space-y-3">
            {venues.map((venue) => {
              const venueSessions = sessions.filter(session => session.venueId === venue.id);
              
              return (
                <div 
                  key={venue.id}
                  onClick={() => handleVenueClick(venue.id)}
                  className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center">
                        <MapPin size={14} className="mr-1 text-indigo-600" />
                        {venue.name}
                      </h3>
                      
                      <div className="text-sm text-gray-500 mt-1">
                        {venue.location && <span>{venue.location}</span>}
                        {venue.capacity && (
                          <span className="ml-2">Capacity: {venue.capacity}</span>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-gray-600">
                        {venueSessions.length} sessions scheduled
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingVenue(venue);
                          setVenueModalOpen(true);
                        }}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Edit venue"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this venue? This will also remove all associated sessions.')) {
                            deleteVenue(venue.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete venue"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVenue(venue.id);
                          setEditingSession(null);
                          setModalOpen(true);
                        }}
                        className="flex items-center text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                        title="Add a new session to this venue"
                      >
                        <Plus size={16} className="mr-1" />
                        <span className="text-sm">Add Session</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Map */}
        <div className="bg-white rounded-lg shadow overflow-hidden relative md:col-span-2 h-[600px] md:h-full">
          {(!mapLoaded || isGeocoding) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-gray-500 flex flex-col items-center">
                <MapIcon size={24} className="mb-2 animate-pulse" />
                <p>{isGeocoding ? 'Geocoding addresses...' : 'Loading map...'}</p>
              </div>
            </div>
          )}
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>
      </div>
      
      {modalOpen && (
        <SessionModal
          isOpen={modalOpen}
          onClose={closeModal}
          sessionId={editingSession}
          initialVenueId={selectedVenue}
          initialTimeRange={null}
          initialDate={getInitialDate(sessions)}
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