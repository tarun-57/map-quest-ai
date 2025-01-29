import React, { useEffect, useState } from 'react';
import { useStateContext } from "../state/StateContext";
import { fetchHints } from '../api';
import "../styles/HintModal.css";

function HintModal(
    { content, onClose, onYes, onNo }
) {
    // console.log("content")
    // console.log(content)
    // content = (content && content.length > 0) ? content : "Use 500 points to ask our AI for a hint?";
    // console.log(content)
    const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

    const { state, updateState } = useStateContext();
    const [hintsUnlocked, setHintsUnlocked] = useState(0);
    const [hints, setHints] = useState([]);
    useEffect(() => {
        console.log("in useeff")
        if(state?.hintsUnlocked){
            setHintsUnlocked(state?.hintsUnlocked);}
        if(state?.hints?.hint1) setHints([state?.hints?.hint1, state?.hints?.hint2, state?.hints?.hint3]);
    }, [])

    const handleYesClick = async () => {
        console.log("fetching hints")
        // setShowModal(true);
        setLoading(true);
        setError(null); // Reset error state before the fetch
        let result;
        try {
          const streetCoord = state?.coords?.streetCoord;
          result = await fetchHints(streetCoord);
          console.log("hints:");
          console.log(result);
        //   setHints(result); // Update state with fetched hints
            // return result;
        } catch (err) {
          setError('Failed to fetch hints'); // Handle errors
          console.error(err);
        } finally {
          setLoading(false); // Stop loading spinner
          return result;
        }
      };

    const unlockHint = async () => {
        console.log("hintsUnlocked", hintsUnlocked)
        setHintsUnlocked(hintsUnlocked + 1);
        if(hintsUnlocked === 0){
            setLoading(true);
            const fetchedHints = await handleYesClick();
            updateState("hints",{
                hint1: fetchedHints[0],
                hint2: fetchedHints[1],
                hint3: fetchedHints[2],
            })
            setHints(fetchedHints);
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
                    {hintsUnlocked > 0 ?
                        <div className="hint">{loading ? "Asking AI...": hints[0]}</div> :
                        <button className='hint-btn' onClick={unlockHint}> {loading ? "Asking AI...": "Unlock Hint 1/3"}</button>
                        }
                    {hintsUnlocked > 1 ?
                        <div className="hint">{hints[1]}</div> :
                        <button
                        className={['hint-btn', hintsUnlocked < 1 ? 'disabled' : ''].join(' ')}
                        // className='hint-btn'
                        disabled={hintsUnlocked < 1}
                        onClick={unlockHint}> Unlock Hint 2/3</button>
                        }
                    {hintsUnlocked > 2 ?
                        <div className="hint">{hints[2]}</div> :
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