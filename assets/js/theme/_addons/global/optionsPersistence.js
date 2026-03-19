import StateManager from './stateManager';

const storageKeyPrefix = 'cs_options_';

const OptionsPersistence = {
    init(archetypeName) {
        if (!archetypeName) return;
        try {
            const storedOptions = localStorage.getItem(`${storageKeyPrefix}${archetypeName}`);
            if (storedOptions) {
                const options = JSON.parse(storedOptions);
                StateManager.setState({ options: { [archetypeName]: options } });
            }
        } catch (e) {
            console.error('Failed to load options from storage', e);
        }
    },

    save(archetypeName, options) {
        if (!archetypeName) return;
        try {
            const storageKey = `${storageKeyPrefix}${archetypeName}`;
            if (options && Object.keys(options).length > 0) {
                localStorage.setItem(storageKey, JSON.stringify(options));
            } else {
                localStorage.removeItem(storageKey);
            }
            const currentState = StateManager.getState().options || {};
            const newState = { ...currentState, [archetypeName]: options };
            StateManager.setState({ options: newState });
        } catch (e) {
            console.error('Failed to save options to storage', e);
        }
    },

    load(archetypeName) {
        if (!archetypeName) return null;
        try {
            const storedOptions = localStorage.getItem(`${storageKeyPrefix}${archetypeName}`);
            return storedOptions ? JSON.parse(storedOptions) : null;
        } catch (e) {
            console.error('Failed to load options from storage', e);
            return null;
        }
    },
};

export default OptionsPersistence;
