export default class StateManager {
    constructor(archetypeData) {
        this.subscribers = new Set();

        this.state = {
            archetypeData: archetypeData, 
            
            selections: {},
            
            currentAlias: null,
            aliasData: null,
            
            availableOptions: {}, 
            inventory: null,
        };

        this._performInitialReconciliation();
    }
    
    subscribe(callback) {
        this.subscribers.add(callback);
    }

    updateSelection({option, value}) {
        const optionOrder = ['make', 'model', 'generation', this.state.archetypeData.option_title, this.state.archetypeData.sub_option_title].filter(Boolean);
        
        this.state.selections[option] = value;

        // Clear subsequent selections
        const currentIndex = optionOrder.indexOf(option);
        if (currentIndex !== -1) {
            for (let i = currentIndex + 1; i < optionOrder.length; i++) {
                delete this.state.selections[optionOrder[i]];
            }
        }

        this._findAlias();
        this._updateAvailableOptions();
        this._notifySubscribers();
    }

    setAliasData(data) {
        this.state.aliasData = data;
        this._notifySubscribers();
    }

    setInventoryData(data) {
        this.state.inventory = data;
        this._notifySubscribers();
    }

    getState() {
        return this.state;
    }

    _traverseSelections() {
        const { selections, archetypeData } = this.state;
        const { make_model_index, option_title, sub_option_title } = archetypeData;

        if (!make_model_index) return null;

        const selectionOrder = ['make', 'model', 'generation', option_title, sub_option_title].filter(Boolean);

        let currentLevel = make_model_index;
        for (const key of selectionOrder) {
            const selection = selections[key];
            if (!selection) {
                return currentLevel; // Return the deepest level reached
            }

            let nextLevel;
            if (currentLevel[selection]) {
                nextLevel = currentLevel[selection];
            } else if (currentLevel.models && currentLevel.models[selection]) {
                nextLevel = currentLevel.models[selection];
            } else if (currentLevel.generations && currentLevel.generations[selection]) {
                if (selection.endsWith('.json')) {
                    return selection;
                }
                const nextNode = currentLevel.generations[selection];
                if (typeof nextNode === 'string' && nextNode.endsWith('.json')) {
                    return nextNode;
                }
                nextLevel = nextNode;
            } else if (currentLevel.options && currentLevel.options[selection]) {
                if (typeof selection === 'string' && selection.endsWith('.json')) {
                    return selection;
                }
                nextLevel = currentLevel.options[selection];
            } else if (currentLevel.sub_options && currentLevel.sub_options[selection]) {
                // Here, the selection is the filename. We have found the alias.
                return selection;
            } else {
                return null; // Invalid path
            }
            currentLevel = nextLevel;
        }
        return currentLevel;
    }

    _findAlias() {
        const result = this._traverseSelections();

        if (typeof result === 'string' && result.endsWith('.json')) {
            this.state.currentAlias = result;
        } else {
            this.state.currentAlias = null;
            this.state.aliasData = null;
        }
    }

    _updateAvailableOptions() {
        const { archetypeData, selections } = this.state;
        const { make_model_index, option_title, sub_option_title } = archetypeData;

        const availableOptions = {};

        // Helper to safely get options array
        const getOptions = (node, key) => {
            if (!node || !node[key]) return [];
            return Object.keys(node[key]).map(k => {
                const entry = node[key][k];
                return {
                    value: k,
                    label: (entry && entry.name) ? entry.name : k,
                };
            }).sort((a, b) => a.label.localeCompare(b.label));
        };

        // Always available: Makes
        if (make_model_index) {
            availableOptions.make = getOptions(archetypeData, 'make_model_index');
        }

        // Pointer for traversal
        let currentNode = (selections.make && make_model_index) ? make_model_index[selections.make] : null;

        // 2. Model
        if (currentNode) {
            availableOptions.model = getOptions(currentNode, 'models');
            currentNode = (selections.model && currentNode.models) ? currentNode.models[selections.model] : null;
        }

        // 3. Generation
        if (currentNode) {
            availableOptions.generation = getOptions(currentNode, 'generations');
            const nextNode = (selections.generation && currentNode.generations) ? currentNode.generations[selections.generation] : null;
            currentNode = (typeof nextNode === 'object') ? nextNode : null;
        }

        // 4. Option
        if (currentNode && option_title) {
            availableOptions[option_title] = getOptions(currentNode, 'options');
            
            const selectedOption = selections[option_title];
            if (selectedOption && currentNode.options && currentNode.options[selectedOption]) {
                const nextNode = currentNode.options[selectedOption];
                // Stop if nextNode is a string (alias filename), otherwise continue
                currentNode = (typeof nextNode === 'object') ? nextNode : null;
            } else {
                currentNode = null;
            }
        }

        // 5. Sub-Option
        if (currentNode && sub_option_title) {
            availableOptions[sub_option_title] = getOptions(currentNode, 'sub_options');
        }

        this.state.availableOptions = availableOptions;
    }

    _notifySubscribers() {
        this.subscribers.forEach(callback => {
            callback(this.state);
        });
    }

    _performInitialReconciliation() {
        this._findAlias();
        this._updateAvailableOptions();
    }
}