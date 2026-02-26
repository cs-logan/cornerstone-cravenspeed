export default class AliasSelection {
    constructor(stateManager) {
        this.stateManager = stateManager;
        // Establish event listener on the parent container (Event Delegation)
        this.container = document.querySelector('[data-product-options-container]') || document.body;
        
        this._bindEvents();
        this._checkPersistence();
        
        // Subscribe to state changes to re-render options (e.g. populate Models after Make is selected)
        this.stateManager.subscribe(this.update.bind(this));

        // Perform initial render to populate "Make" dropdown
        this.update(this.stateManager.getState());
    }

    _bindEvents() {
        this.container.addEventListener('change', (e) => {
            if (e.target.matches('[data-product-option]')) {
                const rawOption = e.target.dataset.productOption;
                const value = e.target.value;
                console.log(`Change: ${rawOption} selected ${value}`);

                // Resolve dynamic option names (e.g. "option" -> "Color")
                const state = this.stateManager.getState();
                const optionKey = this._resolveOptionKey(rawOption, state.archetypeData);
                this.stateManager.updateSelection({ option: optionKey, value });

                // Save to persistence if it's a vehicle selection
                if (['make', 'model', 'generation'].includes(rawOption)) {
                    this._savePersistence(rawOption, value);
                }
            }
        });
    }

    _checkPersistence() {
        const make = localStorage.getItem('cs_garage_make');
        const model = localStorage.getItem('cs_garage_model');
        const generation = localStorage.getItem('cs_garage_generation');

        if (make) this.stateManager.updateSelection({ option: 'make', value: make });
        if (model) this.stateManager.updateSelection({ option: 'model', value: model });
        if (generation) this.stateManager.updateSelection({ option: 'generation', value: generation });
    }

    _savePersistence(option, value) {
        if (value) {
            localStorage.setItem(`cs_garage_${option}`, value);
        } else {
            localStorage.removeItem(`cs_garage_${option}`);
        }
    }

    update(state) {
        const { availableOptions, selections, archetypeData } = state;

        const inputs = this.container.querySelectorAll('[data-product-option]');
        inputs.forEach(input => {
            const rawOption = input.dataset.productOption;
            const optionKey = this._resolveOptionKey(rawOption, archetypeData);
            if (!optionKey) return;

            const optionsData = availableOptions[optionKey];
            const currentVal = selections[optionKey] || '';
            const parentKey = this._getParentKey(rawOption, archetypeData);

            this._updateVisibility(input, rawOption, parentKey, selections, optionsData);
            this._updateInputOptions(input, rawOption, optionKey, optionsData, currentVal);
        });
    }

    _getParentKey(rawOption, archetypeData) {
        const { option_title } = archetypeData;
        if (rawOption === 'model') return 'make';
        if (rawOption === 'generation') return 'model';
        if (rawOption === 'option') return 'generation';
        if (rawOption === 'sub_option') return option_title;
        return null;
    }

    _updateVisibility(input, rawOption, parentKey, selections, optionsData) {
        const wrapper = input.closest('.form-field') || input;
        const isJsonEndpoint = optionsData && optionsData.length === 1 && optionsData[0].value.endsWith('.json');
        
        let shouldShow = false;
        if (['make', 'model', 'generation'].includes(rawOption)) {
            shouldShow = true;
        } else if (parentKey && selections[parentKey]) {
            const hasOptions = optionsData && optionsData.length > 0;
            if (hasOptions && !isJsonEndpoint) {
                shouldShow = true;
            }
        }

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
            // Auto-Advance: If only 1 option exists, select it automatically
            let autoSelectValue = null;
            if (optionsData.length === 1) {
                autoSelectValue = optionsData[0].value;
            }
            
            const placeholder = this._getPlaceholder(rawOption);

            // Reset options, keeping a default placeholder
            input.innerHTML = `<option value="">${placeholder}</option>`;
            
            optionsData.forEach(opt => {
                const isSelected = opt.value === currentVal || (autoSelectValue && opt.value === autoSelectValue);
                const optionEl = document.createElement('option');
                optionEl.value = opt.value;
                optionEl.textContent = opt.label;
                if (isSelected) optionEl.selected = true;
                
                input.appendChild(optionEl);
            });
            
            input.disabled = false;

            // Trigger state update if auto-selected
            if (autoSelectValue && currentVal !== autoSelectValue) {
                setTimeout(() => {
                    this.stateManager.updateSelection({ option: optionKey, value: autoSelectValue });
                    if (['make', 'model', 'generation'].includes(rawOption)) this._savePersistence(rawOption, autoSelectValue);
                }, 0);
            }
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