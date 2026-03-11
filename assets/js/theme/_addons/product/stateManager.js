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
            blemSelected: false,
        };

        this._resolveAutoSelections();
    }
    
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    updateSelection({option, value}) {
        const optionOrder = this._getOptionOrder();
        console.log(`StateManager: updateSelection ${option} = ${value}`);
        
        this.state.selections[option] = value;

        // Clear subsequent selections
        const currentIndex = optionOrder.indexOf(option);
        if (currentIndex !== -1) {
            for (let i = currentIndex + 1; i < optionOrder.length; i++) {
                delete this.state.selections[optionOrder[i]];
            }
        }

        this._resolveAutoSelections();

        // Only clear aliasData if we ended up without a valid alias after resolution
        if (!this.state.currentAlias) {
            this.state.aliasData = null;
        }

        this._notifySubscribers();
    }

    setAliasData(data) {
        this.state.aliasData = data;
        this.state.blemSelected = false;
        this._notifySubscribers();
    }

    setInventoryData(data) {
        this.state.inventory = data;
        this._notifySubscribers();
    }

    setInitialSelections(selections) {
        console.log('StateManager: setInitialSelections', selections);
        this.state.selections = selections;
        this._resolveAutoSelections();
        this._notifySubscribers(); // Notify once after all initial selections are set
    }

    setBlemSelection(isSelected) {
        this.state.blemSelected = isSelected;
        this._notifySubscribers();
    }

    setOptions(options) {
        if (!options) return;
        console.log('ProductStateManager: Setting options', options);
        Object.assign(this.state.selections, options);
        this._resolveAutoSelections();
        this._notifySubscribers();
    }

    setVehicle(vehicle) {
        console.log('ProductStateManager: Setting vehicle', vehicle);
        if (!vehicle) return;

        // Reset selections and apply new vehicle data
        this.state.selections = { ...vehicle };

        this._resolveAutoSelections();

        if (!this.state.currentAlias) {
            this.state.aliasData = null;
        }

        this._notifySubscribers();
    }

    getState() {
        return this.state;
    }

    _getUniversalRoot() {
        const { archetypeData } = this.state;
        
        // If flat structure (no make_model_index), return root
        if (!archetypeData.make_model_index) return archetypeData;

        try {
            // Universal products with make_model_index are expected to have a single path
            // e.g. allvehicles -> allvehicles -> allvehicles
            const make = Object.values(archetypeData.make_model_index)[0];
            const model = Object.values(make.models)[0];
            
            // Check if the generation key is the alias itself (no-option universal products)
            const genKey = Object.keys(model.generations)[0];
            if (genKey && genKey.endsWith('.json')) {
                return genKey;
            }

            const gen = model.generations[genKey];
            return gen;
        } catch (e) {
            return archetypeData;
        }
    }

    _traverseSelections() {
        const { selections, archetypeData } = this.state;
        const { make_model_index, option_title, sub_option_title, universal_product } = archetypeData;

        if (universal_product) {
            let currentLevel = this._getUniversalRoot();

            // If the resolved root is a string (alias filename), return it immediately
            if (typeof currentLevel === 'string' && currentLevel.endsWith('.json')) {
                return currentLevel;
            }

            // 1. Options
            if (option_title) {
                const selection = selections[option_title];
                if (!selection) return currentLevel;

                if (currentLevel.options && currentLevel.options[selection]) {
                    const nextNode = currentLevel.options[selection];

                    // Check if the selection key itself is the alias
                    const nextHasSubOptions = sub_option_title && nextNode && nextNode.sub_options;
                    if (!nextHasSubOptions && typeof selection === 'string' && selection.endsWith('.json')) {
                        return selection;
                    }

                    if (typeof nextNode === 'string' && nextNode.endsWith('.json')) {
                        return nextNode;
                    }
                    currentLevel = nextNode;
                } else {
                    return null;
                }
            }

            // 2. Sub-Options
            if (sub_option_title) {
                const selection = selections[sub_option_title];
                if (!selection) return currentLevel;

                if (currentLevel.sub_options && currentLevel.sub_options[selection]) {
                    return selection;
                } else {
                    return null;
                }
            }

            // No options? Check for direct alias
            if (!option_title && !sub_option_title) {
                if (currentLevel.alias && currentLevel.alias.endsWith('.json')) {
                    return currentLevel.alias;
                }
            }

            return currentLevel;
        }

        if (!make_model_index) return null;

        const selectionOrder = ['make', 'model', 'generation', option_title, sub_option_title].filter(Boolean);

        let currentLevel = make_model_index;
        for (const key of selectionOrder) {
            const selection = selections[key];
            if (!selection) {
                return currentLevel; // Return the deepest level reached
            }

            console.log(`StateManager: Traversing ${key} -> ${selection}`);

            let nextLevel;
            if (currentLevel[selection]) {
                nextLevel = currentLevel[selection];
            } else if (key === 'model' && selections.make && currentLevel.models && currentLevel.models[selections.make + selection]) {
                nextLevel = currentLevel.models[selections.make + selection];
            } else if (currentLevel.models && currentLevel.models[selection]) {
                nextLevel = currentLevel.models[selection];
            } else if (key === 'generation' && selections.make && currentLevel.generations && currentLevel.generations[selections.make + selection]) {
                const genKey = selections.make + selection;
                if (genKey.endsWith('.json')) {
                    return genKey;
                }
                const nextNode = currentLevel.generations[genKey];
                if (typeof nextNode === 'string' && nextNode.endsWith('.json')) {
                    return nextNode;
                }
                nextLevel = nextNode;
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
                console.warn(`StateManager: Traversal failed at ${key}="${selection}".`, 
                    'Current Level Keys:', Object.keys(currentLevel.models || currentLevel.generations || currentLevel.options || currentLevel));
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
        } else if (typeof result === 'object' && result !== null && result.bc_id) {
            // Handle simple products where the result is the data object itself
            this.state.currentAlias = 'self';
            this.state.aliasData = result;
        } else {
            this.state.currentAlias = null;
        }
    }

    _updateAvailableOptions() {
        const { archetypeData, selections } = this.state;
        const { make_model_index, option_title, sub_option_title, universal_product } = archetypeData;

        const availableOptions = {};

        // Helper to safely get options array
        const getOptions = (node, key, stripPrefix = null) => {
            if (!node || !node[key]) return [];
            return Object.keys(node[key]).map(k => {
                const entry = node[key][k];
                let value = k;
                if (stripPrefix && k.startsWith(stripPrefix)) {
                    value = k.substring(stripPrefix.length);
                }
                return {
                    value: value,
                    label: (entry && entry.name) ? entry.name : k,
                };
            }).sort((a, b) => a.label.localeCompare(b.label));
        };

        if (universal_product) {
            let currentNode = this._getUniversalRoot();

            if (typeof currentNode === 'string') {
                this.state.availableOptions = {};
                return;
            }

            if (option_title) {
                availableOptions[option_title] = getOptions(currentNode, 'options');
                const selectedOption = selections[option_title];
                if (selectedOption && currentNode.options && currentNode.options[selectedOption]) {
                    const nextNode = currentNode.options[selectedOption];
                    currentNode = (typeof nextNode === 'object') ? nextNode : null;
                } else {
                    currentNode = null;
                }
            }

            if (currentNode && sub_option_title) {
                availableOptions[sub_option_title] = getOptions(currentNode, 'sub_options');
            }

            this.state.availableOptions = availableOptions;
            return;
        }

        // Always available: Makes
        if (make_model_index) {
            availableOptions.make = getOptions(archetypeData, 'make_model_index');
        }

        // Pointer for traversal
        let currentNode = (selections.make && make_model_index) ? make_model_index[selections.make] : null;

        // 2. Model
        if (currentNode) {
            availableOptions.model = getOptions(currentNode, 'models', selections.make);
            if (selections.model && currentNode.models) {
                currentNode = currentNode.models[selections.model] || 
                              (selections.make ? currentNode.models[selections.make + selections.model] : null) || 
                              null;
            } else {
                currentNode = null;
            }
        }

        // 3. Generation
        if (currentNode) {
            availableOptions.generation = getOptions(currentNode, 'generations', selections.make);
            if (selections.generation && currentNode.generations) {
                const nextNode = currentNode.generations[selections.generation] || 
                                 (selections.make ? currentNode.generations[selections.make + selections.generation] : null);
                currentNode = (typeof nextNode === 'object') ? nextNode : null;
            } else {
                currentNode = null;
            }
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

    _getOptionOrder() {
        const { option_title, sub_option_title, universal_product } = this.state.archetypeData;
        if (universal_product) {
            return [option_title, sub_option_title].filter(Boolean);
        } else {
            return ['make', 'model', 'generation', option_title, sub_option_title].filter(Boolean);
        }
    }

    _resolveAutoSelections() {
        const optionOrder = this._getOptionOrder();
        let changed = true;
        while (changed) {
            changed = false;
            this._findAlias();
            this._updateAvailableOptions();
            for (const key of optionOrder) {
                if (!this.state.selections[key]) {
                    const opts = this.state.availableOptions[key];
                    if (opts && opts.length === 1) {
                        this.state.selections[key] = opts[0].value;
                        changed = true;
                        break;
                    }
                }
            }
        }
    }
}