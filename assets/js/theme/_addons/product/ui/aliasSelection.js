export default class AliasSelection {
    constructor(stateManager, productMessages) {
        this.stateManager = stateManager;
        this.productMessages = productMessages;
        this.persistedVehicle = {};
        this.initialLoad = true;
        // Establish event listener on the parent container (Event Delegation)
        this.container = document.querySelector('[data-product-options-container]') || document.body;
        this.form = document.querySelector('.cs-product-form');
        
        this._bindEvents();
        this._initialize();
    }

    _initialize() {
        // Subscribe to state changes first
        this.stateManager.subscribe(this.update.bind(this));

        // Then, handle persistence and initial state setup
        const initialState = this.stateManager.getState();
        this._handlePersistence(initialState.archetypeData);
    }

    _bindEvents() {
        this.container.addEventListener('change', (e) => {
            if (e.target.matches('[data-product-option]')) {
                // When a user starts making a new selection, clear any incompatibility messages
                this.productMessages.hideMessage('vehicle-incompatible');
                if (this.form) {
                    this.form.classList.remove('has-incompatibility-message');
                }

                const rawOption = e.target.dataset.productOption;
                const value = e.target.value;
                console.log(`Change: ${rawOption} selected ${value}`);

                // Resolve dynamic option names (e.g. "option" -> "Color")
                const state = this.stateManager.getState();
                const optionKey = this._resolveOptionKey(rawOption, state.archetypeData);
                this.stateManager.updateSelection({ option: optionKey, value });

                // Save to persistence
                this._savePersistence(rawOption, value, state.archetypeData);
            }
        });
    }

    _handlePersistence(archetypeData) {
        if (!archetypeData || !archetypeData.archetypeName) {
            this.update(this.stateManager.getState());
            return;
        }

        const selections = {};
        
        // Vehicle persistence
        const make = localStorage.getItem('cs_garage_make');
        const model = localStorage.getItem('cs_garage_model');
        const generation = localStorage.getItem('cs_garage_generation');

        if (make) {
            selections.make = make;
            this.persistedVehicle.make = make;
        }
        if (model) {
            selections.model = model;
            this.persistedVehicle.model = model;
        }
        if (generation) {
            selections.generation = generation;
            this.persistedVehicle.generation = generation;
        }

        // Options persistence
        const { archetypeName, option_title, sub_option_title } = archetypeData;
        if (option_title) {
            const optionValue = localStorage.getItem(`cs_options_${archetypeName}_${option_title}`);
            if (optionValue) selections[option_title] = optionValue;
        }
        if (sub_option_title) {
            const subOptionValue = localStorage.getItem(`cs_options_${archetypeName}_${sub_option_title}`);
            if (subOptionValue) selections[sub_option_title] = subOptionValue;
        }
        
        // Apply all selections at once
        this.stateManager.setInitialSelections(selections);
    }

    _savePersistence(option, value, archetypeData) {
        const { archetypeName, option_title, sub_option_title } = archetypeData;
        let key;
        
        if (!archetypeName) return;

        if (['make', 'model', 'generation'].includes(option)) {
            key = `cs_garage_${option}`;
        } else if (option === 'option' && option_title) {
            key = `cs_options_${archetypeName}_${option_title}`;
        } else if (option === 'sub_option' && sub_option_title) {
            key = `cs_options_${archetypeName}_${sub_option_title}`;
        }

        if (key) {
            if (value) {
                localStorage.setItem(key, value);
            } else {
                localStorage.removeItem(key);
            }
        }
    }

    update(state) {
        const { availableOptions, selections, archetypeData } = state;
        const { archetypeName, option_title, sub_option_title } = archetypeData;

        // One-time check on initial load for vehicle compatibility
        if (this.initialLoad && this.persistedVehicle.generation && !archetypeData.universal_product) {
            const isCompatible = availableOptions.generation && availableOptions.generation.find(g => g.value === this.persistedVehicle.generation);
            if (!isCompatible) {
                this.productMessages.showMessage('vehicle-incompatible', 'This product is not compatible with your saved vehicle.');
                if (this.form) {
                    this.form.classList.add('has-incompatibility-message');
                }
            }
            this.initialLoad = false;
        }

        // Sync persistence with current selections (handles auto-selections)
        const persistKeys = ['make', 'model', 'generation'];
        if (option_title) persistKeys.push(option_title);
        if (sub_option_title) persistKeys.push(sub_option_title);

        persistKeys.forEach(key => {
            let storageKey;
            if (['make', 'model', 'generation'].includes(key)) {
                storageKey = `cs_garage_${key}`;
            } else if (archetypeName) {
                storageKey = `cs_options_${archetypeName}_${key}`;
            }

            if (storageKey) {
                if (selections[key]) {
                    localStorage.setItem(storageKey, selections[key]);
                } else {
                    localStorage.removeItem(storageKey);
                }
            }
        });

        const inputs = this.container.querySelectorAll('[data-product-option]');
        inputs.forEach(input => {
            const rawOption = input.dataset.productOption;
            const optionKey = this._resolveOptionKey(rawOption, archetypeData);
            if (!optionKey) return;

            const optionsData = availableOptions[optionKey];
            const currentVal = selections[optionKey] || '';
            const parentKey = this._getParentKey(rawOption, archetypeData);

            this._updateVisibility(input, rawOption, parentKey, selections, optionsData, archetypeData);
            this._updateInputOptions(input, rawOption, optionKey, optionsData, currentVal);
        });

        const nextInput = Array.from(inputs).find(input => !input.disabled && !input.value);
        if (nextInput) {
            // nextInput.focus();
        } else {
            const addToCart = document.getElementById('product-add-button');
            // if (addToCart) addToCart.focus();
        }
    }

    _getParentKey(rawOption, archetypeData) {
        const { option_title } = archetypeData;
        if (rawOption === 'model') return 'make';
        if (rawOption === 'generation') return 'model';
        if (rawOption === 'option') return 'generation';
        if (rawOption === 'sub_option') return option_title;
        return null;
    }

    _updateVisibility(input, rawOption, parentKey, selections, optionsData, archetypeData) {
        const wrapper = input.closest('.cs-form-field') || input.closest('.form-field') || input;
        const isJsonEndpoint = optionsData && optionsData.length === 1 && optionsData[0].value.endsWith('.json');
        const { universal_product } = archetypeData;
        
        let shouldShow = false;

        if (universal_product) {
            if (['make', 'model', 'generation'].includes(rawOption)) {
                wrapper.style.visibility = 'hidden';
                wrapper.style.display = '';
                return;
            }

            // Universal: Show options if they have data
            // First option (usually depends on generation)
            if (parentKey === 'generation') {
                if (optionsData && optionsData.length > 0 && !isJsonEndpoint) shouldShow = true;
            } 
            // Sub-options (depend on parent option)
            else if (parentKey && selections[parentKey]) {
                if (optionsData && optionsData.length > 0 && !isJsonEndpoint) shouldShow = true;
            }
        } else {
            if (['make', 'model', 'generation'].includes(rawOption)) {
                shouldShow = true;
            } else if (parentKey && selections[parentKey]) {
                if (optionsData && optionsData.length > 0 && !isJsonEndpoint) shouldShow = true;
            }
        }

        wrapper.style.display = '';
        wrapper.style.visibility = shouldShow ? '' : 'hidden';
    }

    _getPlaceholder(rawOption) {
        if (rawOption === 'make') return 'Choose your Make';
        if (rawOption === 'model') return 'Choose your Model';
        if (rawOption === 'generation') return 'Choose your Year';
        return 'Choose an Option';
    }

    _updateInputOptions(input, rawOption, optionKey, optionsData, currentVal) {
        if (optionsData && optionsData.length > 0) {
            
            const placeholder = this._getPlaceholder(rawOption);

            // Reset options, keeping a default placeholder
            input.innerHTML = `<option value="">${placeholder}</option>`;
            
            optionsData.forEach(opt => {
                const isSelected = opt.value === currentVal;
                const optionEl = document.createElement('option');
                optionEl.value = opt.value;
                optionEl.textContent = opt.label;
                if (isSelected) optionEl.selected = true;
                
                input.appendChild(optionEl);
            });
            
            input.disabled = false;
        } else {
            // Disable downstream inputs that don't have data yet
            input.disabled = true;
            input.innerHTML = '<option value="">--</option>';
            input.value = '';
        }
    }

    _resolveOptionKey(rawOption, archetypeData) {
        const { option_title, sub_option_title } = archetypeData;
        if (rawOption === 'option' && option_title) return option_title;
        if (rawOption === 'sub_option' && sub_option_title) return sub_option_title;
        return rawOption;
    }
}