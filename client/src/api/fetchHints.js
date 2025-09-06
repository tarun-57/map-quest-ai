import { apiUrl } from './config';

export const fetchHints = async (input) => {
    try {
      const response = await fetch(apiUrl('/api/generate'), {
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
      const output = typeof responseData.output === 'string' ? responseData.output : '';
      const lines = output.split('\n').map(l => l.trim()).filter(Boolean);
      const cleaned = lines.map(l => l.replace(/^Hint\s*\d+\s*:\s*/i, '').trim()).filter(Boolean);
      // Fallback: try to split by 'Hint X:' inline
      if (cleaned.length === 0 && output.includes('Hint')) {
        const parts = output.split(/Hint\s*\d+\s*:\s*/i).map(s => s.trim()).filter(Boolean);
        if (parts.length > 0) return parts.slice(0, 3);
      }
      return cleaned.slice(0, 3);
    } catch (error) {
      console.error('Error fetching hints', error);
      throw error;
    }
  };
