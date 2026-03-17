/**
 * Manages the state of the product page, including user selections,
 * available options, and the currently resolved product variant (alias).
 * Follows a subscriber pattern to notify other parts of the application
 * when the state changes.
 */
export default class StateManager {
    /**
     * @param {object} archetypeData The raw product data from which to derive state.
     */
    constructor(archetypeData) {
        /**
         * @private
         * @type {Set<Function>}
         */
        this.subscribers = new Set();

        /**
         * The single source of truth for the product page's state.
         * @type {{
         *   archetypeData: object,
         *   selections: object.<string, string>,
         *   currentAlias: string|null,
         *   aliasData: object|null,
         *   availableOptions: object.<string, {value: string, label: string}[]>,
         *   inventory: object|null,
         *   blemSelected: boolean
         * }}
         */
        this.state = {
            // The root data object for the product archetype.
            archetypeData: archetypeData, 
            
            // Key-value store of the user's current selections (e.g., { "make": "MINI", "model": "F56" }).
            selections: {},
            
            // The filename of the currently resolved product variant, e.g., "cs-ab-123.json".
            currentAlias: null,
            // The fetched data corresponding to the currentAlias.
            aliasData: null,
            
            // Options available to the user based on the current selections.
            availableOptions: {}, 
            // Inventory data for the current alias.
            inventory: null,
            // Flag indicating if the "blemished" (scratch and dent) option is selected.
            blemSelected: false,
        };

        if (this.state.archetypeData.make_model_index && !this.state.archetypeData.universal_product) {
            const makes = Object.keys(this.state.archetypeData.make_model_index);
            if (makes.length === 1 && makes[0] === 'allvehicles') {
                this.state.archetypeData.universal_product = true;
            }
        }

        this._resolveAutoSelections();
    }
    
    /**
     * Subscribes a callback function to be executed whenever the state changes.
     * @param {Function} callback The function to call with the updated state.
     * @returns {Function} A function to unsubscribe the callback.
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    /**
     * Updates a user's selection for a specific option and recalculates the state.
     * When a selection changes, it clears all subsequent, dependent selections
     * to ensure the user is always presented with a valid path.
     * @param {{option: string, value: string}} selection The option and its new value.
     */
    updateSelection({option, value}) {
        const optionOrder = this._getOptionOrder();
        
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

    /**
     * Sets the detailed data for the currently resolved product alias.
     * This is typically called after fetching the alias-specific JSON file.
     * @param {object} data The alias data.
     */
    setAliasData(data) {
        this.state.aliasData = data;
        this.state.blemSelected = false;
        this._notifySubscribers();
    }

    /**
     * Sets the inventory data for the current alias.
     * @param {object} data The inventory data.
     */
    setInventoryData(data) {
        this.state.inventory = data;
        this._notifySubscribers();
    }

    /**
     * Sets the initial state of all selections at once.
     * Useful for restoring a saved state, like a persisted vehicle, without
     * triggering multiple sequential updates.
     * @param {object} selections A complete object of initial selections.
     */
    setInitialSelections(selections) {
        this.state.selections = selections;
        this._resolveAutoSelections();
        this._notifySubscribers(); // Notify once after all initial selections are set
    }

    /**
     * Toggles the selection of a "blemished" (scratch and dent) product variant.
     * @param {boolean} isSelected Whether the blemished option is selected.
     */
    setBlemSelection(isSelected) {
        this.state.blemSelected = isSelected;
        this._notifySubscribers();
    }

    /**
     * Sets multiple option selections at once and resolves the state.
     * @param {object} options An object of key-value pairs representing selections.
     */
    setOptions(options) {
        if (!options) return;
        Object.assign(this.state.selections, options);
        this._resolveAutoSelections();
        this._notifySubscribers();
    }

    /**
     * Resets selections and applies new ones based on a vehicle fitment.
     * This is a primary entry point for vehicle-driven product configuration.
     * @param {object} vehicle An object containing vehicle fitment data (e.g., make, model).
     */
    setVehicle(vehicle) {
        if (!vehicle) return;

        // Reset selections and apply new vehicle data
        this.state.selections = { ...vehicle };

        this._resolveAutoSelections();

        if (!this.state.currentAlias) {
            this.state.aliasData = null;
        }

        this._notifySubscribers();
    }

    /**
     * Returns a snapshot of the current state.
     * @returns {object} The current state object.
     */
    getState() {
        return this.state;
    }

    /**
     * Finds the starting point for traversal in a "universal" product data structure.
     * Universal products don't have a standard make/model/generation fitment.
     * @private
     * @returns {object|string} The root node for traversal or a direct alias filename.
     */
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

    /**
     * Traverses the archetype data based on the current selections to find
     * the deepest corresponding node or a final alias. This is the core logic
     * that translates user selections into a specific product variant.
     * @private
     * @returns {object|string|null} The resulting node, an alias filename, or null if the path is invalid.
     */
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

    /**
     * Calls the traversal logic and updates the state with the result.
     * If a valid alias (a filename) is found, it's stored in `state.currentAlias`.
     * If the traversal results in a "simple" product object with its own data,
     * it sets that data directly. Otherwise, the alias is cleared.
     * @private
     */
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

    /**
     * Determines which options are available to the user based on the current selections.
     * For example, after selecting a "make," this method calculates the valid "models"
     * to show. The results are stored in `state.availableOptions`.
     * @private
     */
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

    /**
     * Executes all subscribed callback functions, passing them the current state.
     * This is the mechanism by which other parts of the application learn about state changes.
     * @private
     */
    _notifySubscribers() {
        this.subscribers.forEach(callback => {
            callback(this.state);
        });
    }

    /**
     * Determines the logical order of options for traversal and dependency management.
     * The order is crucial for clearing dependent dropdowns and for auto-selection.
     * @private
     * @returns {string[]} An array of option keys in their logical order.
     */
    _getOptionOrder() {
        const { option_title, sub_option_title, universal_product } = this.state.archetypeData;
        if (universal_product) {
            return [option_title, sub_option_title].filter(Boolean);
        } else {
            return ['make', 'model', 'generation', option_title, sub_option_title].filter(Boolean);
        }
    }

    /**
     * Automatically selects options that have only one possible value.
     * For instance, if a selected model only has one generation available,
     * this method will automatically select that generation, simplifying the
     * user's journey. It loops until no more automatic selections can be made.
     * @private
     */
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