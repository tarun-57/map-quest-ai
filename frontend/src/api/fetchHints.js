const BASE_URL = 'http://localhost:3300';

export const fetchHints = async (input) => {
    try {
      const response = await fetch(`${BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({input: input}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      const hintsArray = responseData.output.split('\n')
                        .map(hint => hint.replace(/^Hint \d+: /, '').trim());
      return hintsArray;
    } catch (error) {
      console.error('Error fetching hints', error);
      throw error;
    }
  };
