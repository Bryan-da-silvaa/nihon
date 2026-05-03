import { useState, useEffect, useCallback, useMemo } from 'react';

export function useVocabulary(userId) {
	const [vocabulary, setVocabulary] = useState({}); // { word: { status, reading } }
	const [isLoading, setIsLoading] = useState(false);

	const fetchVocabulary = useCallback(async () => {
		if (!userId) return;
		setIsLoading(true);
		try {
			const res = await fetch(`/api/vocabulary?userId=${userId}`);
			const data = await res.json();
			if (data.vocabulary) {
				const vocabMap = {};
				data.vocabulary.forEach(item => {
					vocabMap[item.word] = { status: item.status, reading: item.reading };
				});
				setVocabulary(vocabMap);
			}
		} catch (err) {
			console.error("Failed to fetch vocabulary:", err);
		} finally {
			setIsLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		fetchVocabulary();
	}, [fetchVocabulary]);

	const updateWordStatus = useCallback(async (word, reading, status) => {
		if (!userId) return;

		// Optimistic update
		setVocabulary(prev => ({
			...prev,
			[word]: { status, reading }
		}));

		try {
			const res = await fetch('/api/vocabulary', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, word, reading, status })
			});
			if (!res.ok) throw new Error('Failed to update vocabulary');
		} catch (err) {
			console.error("Vocabulary sync failed:", err);
			// Rollback if needed (optional)
		}
	}, [userId]);

	const getWordStatus = useCallback((word) => {
		return vocabulary[word]?.status ?? 0;
	}, [vocabulary]);

	return {
		vocabulary,
		isLoading,
		updateWordStatus,
		getWordStatus,
		refresh: fetchVocabulary
	};
}
