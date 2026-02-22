'use client';

import type { Part } from '@prisma/client';
import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
  type Dispatch,
} from 'react';

// --- Types ---

export interface BeySlot {
  blade: Part | null;
  ratchet: Part | null;
  bit: Part | null;
  nickname: string;
}

export type BuilderStep = 'BLADE' | 'RATCHET' | 'BIT';

export interface DeckSummary {
  id: string;
  name: string;
  isActive: boolean;
  updatedAt: string;
}

export interface BuilderState {
  deckId: string | null;
  deckName: string;
  isActive: boolean;
  beys: [BeySlot, BeySlot, BeySlot];
  activeSlotIndex: number;
  activeStep: BuilderStep;
  savedDecks: DeckSummary[];
  loadingDecks: boolean;
  mobileTab: 'catalog' | 'deck';
}

// --- Actions ---

export type BuilderAction =
  | { type: 'SET_PART'; part: Part }
  | { type: 'REMOVE_PART'; slotIndex: number; partType: BuilderStep }
  | { type: 'SET_ACTIVE_SLOT'; slotIndex: number }
  | { type: 'SET_ACTIVE_STEP'; step: BuilderStep }
  | { type: 'SET_DECK_NAME'; name: string }
  | { type: 'SET_IS_ACTIVE'; isActive: boolean }
  | { type: 'SET_NICKNAME'; slotIndex: number; nickname: string }
  | { type: 'LOAD_DECK'; deck: LoadDeckPayload }
  | { type: 'NEW_DECK' }
  | { type: 'SET_SAVED_DECKS'; decks: DeckSummary[] }
  | { type: 'SET_LOADING_DECKS'; loading: boolean }
  | { type: 'DELETE_DECK'; deckId: string }
  | { type: 'SET_MOBILE_TAB'; tab: 'catalog' | 'deck' };

export interface LoadDeckPayload {
  id: string;
  name: string;
  isActive: boolean;
  beys: Array<{
    blade: Part | null;
    ratchet: Part | null;
    bit: Part | null;
    nickname?: string;
  }>;
}

// --- Helpers ---

const emptySlot: BeySlot = { blade: null, ratchet: null, bit: null, nickname: '' };

function createEmptyBeys(): [BeySlot, BeySlot, BeySlot] {
  return [{ ...emptySlot }, { ...emptySlot }, { ...emptySlot }];
}

function getNextStep(slot: BeySlot): BuilderStep {
  if (!slot.blade) return 'BLADE';
  if (!slot.ratchet) return 'RATCHET';
  if (!slot.bit) return 'BIT';
  return 'BLADE';
}

function isSlotComplete(slot: BeySlot): boolean {
  return !!slot.blade && !!slot.ratchet && !!slot.bit;
}

function stepKey(step: BuilderStep): 'blade' | 'ratchet' | 'bit' {
  return step.toLowerCase() as 'blade' | 'ratchet' | 'bit';
}

// --- Initial State ---

export const initialState: BuilderState = {
  deckId: null,
  deckName: '',
  isActive: false,
  beys: createEmptyBeys(),
  activeSlotIndex: 0,
  activeStep: 'BLADE',
  savedDecks: [],
  loadingDecks: false,
  mobileTab: 'catalog',
};

// --- Reducer ---

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'SET_PART': {
      const newBeys: [BeySlot, BeySlot, BeySlot] = [{ ...state.beys[0] }, { ...state.beys[1] }, { ...state.beys[2] }];
      const key = stepKey(state.activeStep);
      const idx = state.activeSlotIndex as 0 | 1 | 2;

      // Validate part type matches the step
      if (action.part.type !== state.activeStep) return state;

      newBeys[idx] = {
        ...newBeys[idx],
        [key]: action.part,
      };

      // Auto-advance logic
      const updatedSlot = newBeys[idx];
      let nextSlotIndex = state.activeSlotIndex;
      let nextStep = state.activeStep;

      if (isSlotComplete(updatedSlot)) {
        // Find next incomplete slot
        const nextIncomplete = newBeys.findIndex((s, i) => i > idx && !isSlotComplete(s)) as 0 | 1 | 2 | -1;
        if (nextIncomplete !== -1) {
          nextSlotIndex = nextIncomplete;
          nextStep = getNextStep(newBeys[nextIncomplete]);
        } else {
          // Check earlier slots
          const earlier = newBeys.findIndex((s) => !isSlotComplete(s)) as 0 | 1 | 2 | -1;
          if (earlier !== -1) {
            nextSlotIndex = earlier;
            nextStep = getNextStep(newBeys[earlier]);
          } else {
            // All complete, stay
            nextStep = 'BLADE';
          }
        }
      } else {
        nextStep = getNextStep(updatedSlot);
      }

      return {
        ...state,
        beys: newBeys,
        activeSlotIndex: nextSlotIndex,
        activeStep: nextStep,
      };
    }

    case 'REMOVE_PART': {
      const newBeys: [BeySlot, BeySlot, BeySlot] = [{ ...state.beys[0] }, { ...state.beys[1] }, { ...state.beys[2] }];
      const rmIdx = action.slotIndex as 0 | 1 | 2;
      const rmKey = stepKey(action.partType);
      newBeys[rmIdx] = {
        ...newBeys[rmIdx],
        [rmKey]: null,
      };
      return {
        ...state,
        beys: newBeys,
        activeSlotIndex: action.slotIndex,
        activeStep: action.partType,
      };
    }

    case 'SET_ACTIVE_SLOT': {
      const saIdx = action.slotIndex as 0 | 1 | 2;
      const slot = state.beys[saIdx];
      return {
        ...state,
        activeSlotIndex: saIdx,
        activeStep: getNextStep(slot),
      };
    }

    case 'SET_ACTIVE_STEP':
      return { ...state, activeStep: action.step };

    case 'SET_DECK_NAME':
      return { ...state, deckName: action.name };

    case 'SET_IS_ACTIVE':
      return { ...state, isActive: action.isActive };

    case 'SET_NICKNAME': {
      const newBeys: [BeySlot, BeySlot, BeySlot] = [{ ...state.beys[0] }, { ...state.beys[1] }, { ...state.beys[2] }];
      const nnIdx = action.slotIndex as 0 | 1 | 2;
      newBeys[nnIdx] = {
        ...newBeys[nnIdx],
        nickname: action.nickname,
      };
      return { ...state, beys: newBeys };
    }

    case 'LOAD_DECK': {
      const newBeys = createEmptyBeys();
      action.deck.beys.forEach((bey, i) => {
        if (i < 3) {
          newBeys[i as 0 | 1 | 2] = {
            blade: bey.blade ?? null,
            ratchet: bey.ratchet ?? null,
            bit: bey.bit ?? null,
            nickname: bey.nickname || '',
          };
        }
      });
      const firstIncomplete = newBeys.findIndex((s) => !isSlotComplete(s)) as 0 | 1 | 2 | -1;
      const ldIdx = (firstIncomplete !== -1 ? firstIncomplete : 0) as 0 | 1 | 2;
      return {
        ...state,
        deckId: action.deck.id,
        deckName: action.deck.name,
        isActive: action.deck.isActive,
        beys: newBeys,
        activeSlotIndex: ldIdx,
        activeStep: getNextStep(newBeys[ldIdx]),
      };
    }

    case 'NEW_DECK':
      return {
        ...state,
        deckId: null,
        deckName: '',
        isActive: false,
        beys: createEmptyBeys(),
        activeSlotIndex: 0,
        activeStep: 'BLADE',
      };

    case 'SET_SAVED_DECKS':
      return { ...state, savedDecks: action.decks };

    case 'SET_LOADING_DECKS':
      return { ...state, loadingDecks: action.loading };

    case 'DELETE_DECK':
      return {
        ...state,
        savedDecks: state.savedDecks.filter((d) => d.id !== action.deckId),
        ...(state.deckId === action.deckId
          ? { deckId: null, deckName: '', isActive: false, beys: createEmptyBeys(), activeSlotIndex: 0, activeStep: 'BLADE' as BuilderStep }
          : {}),
      };

    case 'SET_MOBILE_TAB':
      return { ...state, mobileTab: action.tab };

    default:
      return state;
  }
}

// --- localStorage persistence ---

const LS_KEY = 'rpb-builder-draft';

interface LocalDraft {
  deckId: string | null;
  deckName: string;
  isActive: boolean;
  beys: [BeySlot, BeySlot, BeySlot];
}

function saveDraft(state: BuilderState) {
  try {
    const draft: LocalDraft = {
      deckId: state.deckId,
      deckName: state.deckName,
      isActive: state.isActive,
      beys: state.beys,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(draft));
  } catch { /* quota exceeded or SSR */ }
}

function loadDraft(): Partial<BuilderState> | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const draft: LocalDraft = JSON.parse(raw);
    // Validate structure
    if (!Array.isArray(draft.beys) || draft.beys.length !== 3) return null;
    const hasParts = draft.beys.some((b) => b.blade || b.ratchet || b.bit);
    if (!hasParts && !draft.deckName) return null;
    // Find first incomplete slot
    const firstIncomplete = draft.beys.findIndex((s) => !s.blade || !s.ratchet || !s.bit);
    const idx = (firstIncomplete !== -1 ? firstIncomplete : 0) as 0 | 1 | 2;
    const slot = draft.beys[idx];
    return {
      deckId: draft.deckId,
      deckName: draft.deckName,
      isActive: draft.isActive,
      beys: draft.beys,
      activeSlotIndex: idx,
      activeStep: getNextStep(slot),
    };
  } catch {
    return null;
  }
}

export function clearDraft() {
  try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
}

// --- Context ---

interface BuilderContextValue {
  state: BuilderState;
  dispatch: Dispatch<BuilderAction>;
  usedPartIds: Set<string>;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

function initState(): BuilderState {
  if (typeof window === 'undefined') return initialState;
  const draft = loadDraft();
  if (draft) return { ...initialState, ...draft };
  return initialState;
}

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(builderReducer, undefined, initState);
  const isFirstRender = useRef(true);

  // Persist to localStorage on every relevant change
  useEffect(() => {
    // Skip the first render (initial load from localStorage)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveDraft(state);
  }, [state.beys, state.deckName, state.deckId, state.isActive]);

  const usedPartIds = useMemo(() => {
    const ids = new Set<string>();
    for (const bey of state.beys) {
      if (bey.blade) ids.add(bey.blade.id);
      if (bey.ratchet) ids.add(bey.ratchet.id);
      if (bey.bit) ids.add(bey.bit.id);
    }
    return ids;
  }, [state.beys]);

  const value = useMemo(() => ({ state, dispatch, usedPartIds }), [state, dispatch, usedPartIds]);

  return (
    <BuilderContext.Provider value={value}>
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error('useBuilder must be used within BuilderProvider');
  return ctx;
}
