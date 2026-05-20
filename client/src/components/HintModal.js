import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useStateContext } from '../state/StateContext';
import { fetchHints, hintsAsArray } from '../api';
import '../styles/HintModal.css';

const HINT_COST = 500;
const MAX_HINTS = 3;

function HintModal() {
  const { state, updateState } = useStateContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localHints, setLocalHints] = useState([]);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const h = state?.hints;
    if (h?.hint1 || h?.hint2 || h?.hint3) {
      setLocalHints(hintsAsArray(h));
    }
  }, [state?.hints]);

  const fetchOnce = useCallback(async () => {
    const streetCoord = state?.coords?.streetCoord;
    if (!streetCoord) {
      throw new Error('No location loaded yet.');
    }
    const result = await fetchHints(streetCoord);
    if (!result?.hints?.hint1) {
      throw new Error('Invalid hints format');
    }
    return result;
  }, [state?.coords?.streetCoord]);

  const unlockHint = async () => {
    if (loading || fetchingRef.current) return;
    const unlocked = state.hintsUnlocked || 0;
    if (unlocked >= MAX_HINTS) return;

    setError(null);

    if (unlocked === 0) {
      fetchingRef.current = true;
      setLoading(true);
      try {
        const fetched = await fetchOnce();
        updateState('hints', fetched.hints);
        setLocalHints(hintsAsArray(fetched.hints));
      } catch (err) {
        setError(err?.message || 'Failed to fetch hints. Please try again.');
        setLoading(false);
        fetchingRef.current = false;
        return;
      }
      setLoading(false);
      fetchingRef.current = false;
    }

    updateState('hintsUnlocked', unlocked + 1);
    updateState('maxScore', Math.max(0, (state.maxScore || 0) - HINT_COST));
  };

  const hintsUnlocked = state.hintsUnlocked || 0;
  const hints = localHints.length ? localHints : hintsAsArray(state.hints || {});

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-title">
          {HINT_COST} points will be deducted for each hint you unlock.
        </div>
        <div className="btn-container">
          {error ? <div className="hint error">{error}</div> : null}
          {hintsUnlocked > 0 ? (
            <div className="hint">{hints[0] || 'No hint available yet.'}</div>
          ) : (
            <button type="button" className="hint-btn" onClick={unlockHint} disabled={loading}>
              {loading ? 'Asking AI…' : 'Unlock hint 1/3'}
            </button>
          )}
          {hintsUnlocked > 1 ? (
            <div className="hint">{hints[1] || 'No hint available.'}</div>
          ) : (
            <button
              type="button"
              className={['hint-btn', hintsUnlocked < 1 ? 'disabled' : ''].join(' ')}
              disabled={hintsUnlocked < 1 || loading}
              onClick={unlockHint}
            >
              Unlock hint 2/3
            </button>
          )}
          {hintsUnlocked > 2 ? (
            <div className="hint">{hints[2] || 'No hint available.'}</div>
          ) : (
            <button
              type="button"
              className={['hint-btn', hintsUnlocked < 2 ? 'disabled' : ''].join(' ')}
              disabled={hintsUnlocked < 2 || loading}
              onClick={unlockHint}
            >
              Unlock hint 3/3
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default HintModal;
