import React, { useEffect, useState } from 'react';
import { useStateContext } from "../state/StateContext";
import { fetchHints, hintsAsArray } from '../api';
import "../styles/HintModal.css";

// Displays an unlockable hints modal, fetching hints from the backend once and revealing them progressively.
function HintModal(
    { content, onClose, onYes, onNo }
) {
    const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

    const { state, updateState } = useStateContext();
    const [hintsUnlocked, setHintsUnlocked] = useState(0);
    const [hints, setHints] = useState([]);
    useEffect(() => {
        if(state?.hintsUnlocked){
            setHintsUnlocked(state?.hintsUnlocked);}
        if(state?.hints?.hint1) setHints([state?.hints?.hint1, state?.hints?.hint2, state?.hints?.hint3]);
    }, [])

    const handleYesClick = async () => {
        setLoading(true);
        setError(null);
        let result;
        try {
          const streetCoord = state?.coords?.streetCoord;
          result = await fetchHints(streetCoord);
          if (!result?.hints?.hint1) {
            throw new Error('Invalid hints format');
          }
        } catch (err) {
          setError(err?.message || 'Failed to fetch hints. Please try again.');
          console.error(err);
        } finally {
          setLoading(false);
          return result;
        }
      };

    const unlockHint = async () => {
        console.log("hintsUnlocked", hintsUnlocked)
        setHintsUnlocked(hintsUnlocked + 1);
        if(hintsUnlocked === 0){
            setLoading(true);
            const fetched = await handleYesClick();
            if (fetched?.hints) {
                updateState("hints", fetched.hints);
                setHints(hintsAsArray(fetched.hints));
            } else {
                setError('Hints are not available right now.');
            }
        }

        updateState("hintsUnlocked", hintsUnlocked + 1);
        updateState("maxScore", state.maxScore - 500);
        // setHintsUnlocked(hintsUnlocked + 1);
    }

    return (
        <>
            <div className="modal">
                {/* <div className="modal-content">
                    <p>{content}</p>
                    {content === "Use 500 points to ask our AI for a hint?" ? (
                    <div>
                        <button onClick={onYes}>Yes</button>
                        <button onClick={onNo}>No</button>
                    </div>
                    ) :
                    // }
                    // {content.startsWith("Here's your hint") &&
                    (
                    <button onClick={onClose}>Close</button>
                    )}
                </div> */}
                <div className='modal-content'>
                    {/* <button onClick={onClose}>x</button> */}
                    <div className='modal-title'>500 Points Will Be Deducted For Each Hint You Unlock!</div>
                    <div className='btn-container'>
                    {error && <div className="hint error">{error}</div>}
                    {hintsUnlocked > 0 ?
                        <div className="hint">{loading ? "Asking AI...": (hints[0] || "No hint available yet.")}</div> :
                        <button className='hint-btn' onClick={unlockHint}> {loading ? "Asking AI...": "Unlock Hint 1/3"}</button>
                        }
                    {hintsUnlocked > 1 ?
                        <div className="hint">{hints[1] || "No hint available."}</div> :
                        <button
                        className={['hint-btn', hintsUnlocked < 1 ? 'disabled' : ''].join(' ')}
                        // className='hint-btn'
                        disabled={hintsUnlocked < 1}
                        onClick={unlockHint}> Unlock Hint 2/3</button>
                        }
                    {hintsUnlocked > 2 ?
                        <div className="hint">{hints[2] || "No hint available."}</div> :
                        <button
                        className={['hint-btn', hintsUnlocked < 2 ? 'disabled' : ''].join(' ')}
                        // className='hint-btn'
                        disabled={hintsUnlocked < 2}
                        onClick={unlockHint}> Unlock Hint 3/3</button>
                        }
                        </div>
                </div>
            </div>
        </>
    )
}

export default HintModal;