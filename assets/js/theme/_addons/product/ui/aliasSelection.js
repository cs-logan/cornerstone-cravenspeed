import VehiclePersistence from '../../../_addons/global/vehiclePersistence';
import OptionsPersistence from '../../../_addons/global/optionsPersistence';
import GlobalStateManager from '../../../_addons/global/stateManager';

export default class AliasSelection {
    constructor(stateManager, productMessages) {
        this.stateManager = stateManager;
        this.productMessages = productMessages;
        this.persistedVehicle = {};
        this.initialLoad = true;
        this.persistenceHandled = false;
        // Establish event listener on the parent container (Event Delegation)
        this.container = document.querySelector('[data-product-options-container]') || document.body;
        this.form = document.querySelector('.cs-product-form');
        this.unsubscribe = null;
        this.changeHandler = null;
        
        this._bindEvents();
        this._initialize();
    }

    _initialize() {
        // Subscribe to state changes first
        this.unsubscribe = this.stateManager.subscribe(this.update.bind(this));

        // Then, handle persistence and initial state setup
        const initialState = this.stateManager.getState();
        if (initialState.archetypeData && initialState.archetypeData.archetypeName) {
            this._handlePersistence(initialState.archetypeData);
        } else {
            // If data isn't ready, just run an initial update to set up the DOM state (disable inputs)
            this.update(initialState);
        }
    }

    _bindEvents() {
        this.changeHandler = (e) => {
            if (e.target.matches('[data-product-option]')) {
                // When a user starts making a new selection, clear any incompatibility messages
                this.productMessages.hideMessage('vehicle-incompatible');
                if (this.form) {
                    this.form.classList.remove('has-incompatibility-message');
                }

                const rawOption = e.target.dataset.productOption;
                const value = e.target.value;

                // Resolve dynamic option names (e.g. "option" -> "Color")
                const state = this.stateManager.getState();
                const optionKey = this._resolveOptionKey(rawOption, state.archetypeData);
                this.stateManager.updateSelection({ option: optionKey, value });
            }
        };

        this.container.addEventListener('change', this.changeHandler);
    }

    _handlePersistence(archetypeData) {
        if (this.persistenceHandled || !archetypeData || !archetypeData.archetypeName) return;

        const selections = {};
        
        const globalState = GlobalStateManager.getState();
        
        // 1. Vehicle Data from Global State
        if (globalState.vehicle && globalState.vehicle.selected) {
            this.persistedVehicle = globalState.vehicle.selected;
            Object.assign(selections, this.persistedVehicle);
        }

        // 2. Options Data from new persistence module
        const { archetypeName } = archetypeData;
        const persistedOptions = OptionsPersistence.load(archetypeName);
        if (persistedOptions) {
            Object.assign(selections, persistedOptions);
        }
        
        this.persistenceHandled = true;
        this.stateManager.setInitialSelections(selections);
    }



    update(state) {
        const { availableOptions, selections, archetypeData } = state;
        
        if (!archetypeData) return;

        // Lazy load persistence if it wasn't ready at init
        if (!this.persistenceHandled && archetypeData.archetypeName) {
            this._handlePersistence(archetypeData);
            return; // Exit and wait for re-render triggered by setInitialSelections
        }

        const { archetypeName, option_title, sub_option_title, universal_product } = archetypeData;

        // --- Persistence ---
        if (this.persistenceHandled) {
            // 1. Handle Vehicle Persistence
            if (!universal_product) {
                const { make, model, generation } = selections;
                VehiclePersistence.save({ make, model, generation });
            }

            // 2. Handle Option Persistence
            const optionKeys = [option_title, sub_option_title].filter(Boolean);
            const optionsToSave = optionKeys.reduce((acc, key) => {
                if (selections[key]) {
                    acc[key] = selections[key];
                }
                return acc;
            }, {});

            OptionsPersistence.save(archetypeName, optionsToSave);
        }


        // --- UI Updates ---
        // One-time check on initial load for vehicle compatibility
        if (this.initialLoad && this.persistedVehicle.generation && !universal_product) {
            const isCompatible = availableOptions.generation && availableOptions.generation.find(g => g.value === this.persistedVehicle.generation);
            if (!isCompatible) {
                this.productMessages.showMessage('vehicle-incompatible', 'This product is not compatible with your saved vehicle.');
                if (this.form) {
                    this.form.classList.add('has-incompatibility-message');
                }
            }
            this.initialLoad = false;
        }

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

    destroy() {
        if (this.unsubscribe) this.unsubscribe();
        if (this.container && this.changeHandler) {
            this.container.removeEventListener('change', this.changeHandler);
        }
    }
}