import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Edit, Plus, X } from 'lucide-react';
import { useStore } from '../store';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface FilterSectionProps {
  title: string;
  items: {id: string; name: string}[];
  onAddItem: (name: string) => void;
  onEditItem: (id: string, newName: string) => void;
  onSelectItem: (id: string) => void;
  selectedItems: string[];
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  items,
  onAddItem,
  onEditItem,
  onSelectItem,
  selectedItems
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemValue, setNewItemValue] = useState('');

  const handleEditStart = (id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
  };

  const handleEditSave = (id: string) => {
    if (editValue.trim()) {
      onEditItem(id, editValue);
    }
    setEditingId(null);
  };

  const handleAddClick = () => {
    setIsAddingNew(true);
    setNewItemValue('');
    // Use setTimeout to ensure the input is rendered before focusing
    setTimeout(() => {
      const input = document.querySelector('.new-item-input') as HTMLInputElement;
      if (input) input.focus();
    }, 0);
  };

  const handleAddSave = () => {
    if (newItemValue.trim()) {
      onAddItem(newItemValue);
      setNewItemValue('');
    }
    setIsAddingNew(false);
  };

  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddSave();
    } else if (e.key === 'Escape') {
      setIsAddingNew(false);
    }
  };

  return (
    <div className="mb-4">
      <div 
        className="flex items-center justify-between mb-2 cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <h3 className="font-medium text-gray-700 ml-1">{title}</h3>
        </div>
      </div>
      
      {isOpen && (
        <div className="ml-6 space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between group">
              {editingId === item.id ? (
                <div className="flex items-center flex-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleEditSave(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSave(item.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1 py-1 px-2 border border-gray-300 rounded"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex items-center flex-1">
                  <input
                    type="checkbox"
                    id={`filter-${item.id}`}
                    checked={selectedItems.includes(item.id)}
                    onChange={() => onSelectItem(item.id)}
                    className="mr-2"
                  />
                  <label 
                    htmlFor={`filter-${item.id}`}
                    className="text-sm text-gray-600 cursor-pointer flex-1"
                  >
                    {item.name}
                  </label>
                  <button
                    onClick={() => handleEditStart(item.id, item.name)}
                    className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                  >
                    <Edit size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {isAddingNew ? (
            <div className="flex items-center">
              <input
                type="text"
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                onBlur={handleAddSave}
                onKeyDown={handleAddKeyDown}
                className="flex-1 py-1 px-2 border border-gray-300 rounded new-item-input"
                placeholder={`New ${title.toLowerCase().slice(0, -1)}`}
                autoFocus
              />
            </div>
          ) : (
            <button 
              onClick={handleAddClick}
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              <Plus size={14} className="mr-1" />
              Add Option
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { 
    venues, organizations, programs, experiences, accessLevels, 
    sessionTypes, tracks, selectedFilters, toggleFilter,
    addVenue, updateVenue,
    addSessionType, updateSessionType,
    addTrack, updateTrack,
    addOrganization, updateOrganization,
    addProgram, updateProgram,
    addExperience, updateExperience,
    addAccessLevel, updateAccessLevel
  } = useStore();

  if (!isOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="bg-white p-2 rounded-r-md shadow fixed top-20 left-0"
      >
        <ChevronRight size={16} />
      </button>
    );
  }

  return (
    <div className="w-64 bg-white border-r overflow-y-auto flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-medium text-gray-800">Filters</h2>
        <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700">
          <X size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <FilterSection
          title="Venues"
          items={venues}
          onAddItem={(name) => addVenue({ name })}
          onEditItem={(id, name) => updateVenue(id, { name })}
          onSelectItem={(id) => toggleFilter('venues', id)}
          selectedItems={selectedFilters.venues}
        />
        
        <FilterSection
          title="Session Types"
          items={sessionTypes}
          onAddItem={(name) => addSessionType({ name })}
          onEditItem={(id, name) => updateSessionType(id, { name })}
          onSelectItem={(id) => toggleFilter('sessionTypes', id)}
          selectedItems={selectedFilters.sessionTypes}
        />

        <FilterSection
          title="Tracks"
          items={tracks}
          onAddItem={(name) => addTrack({ name })}
          onEditItem={(id, name) => updateTrack(id, { name })}
          onSelectItem={(id) => toggleFilter('tracks', id)}
          selectedItems={selectedFilters.tracks}
        />

        <FilterSection
          title="Partner Organizations"
          items={organizations}
          onAddItem={(name) => addOrganization({ name })}
          onEditItem={(id, name) => updateOrganization(id, { name })}
          onSelectItem={(id) => toggleFilter('organizations', id)}
          selectedItems={selectedFilters.organizations}
        />

        <FilterSection
          title="Programs"
          items={programs}
          onAddItem={(name) => addProgram({ name })}
          onEditItem={(id, name) => updateProgram(id, { name })}
          onSelectItem={(id) => toggleFilter('programs', id)}
          selectedItems={selectedFilters.programs}
        />

        <FilterSection
          title="Experiences"
          items={experiences}
          onAddItem={(name) => addExperience({ name })}
          onEditItem={(id, name) => updateExperience(id, { name })}
          onSelectItem={(id) => toggleFilter('experiences', id)}
          selectedItems={selectedFilters.experiences}
        />

        <FilterSection
          title="Access"
          items={accessLevels}
          onAddItem={(name) => addAccessLevel({ name })}
          onEditItem={(id, name) => updateAccessLevel(id, { name })}
          onSelectItem={(id) => toggleFilter('accessLevels', id)}
          selectedItems={selectedFilters.accessLevels}
        />
      </div>
    </div>
  );
};