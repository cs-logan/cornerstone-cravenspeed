/**
 * Extracts the raw slug from a URL pathname.
 * @param {string} pathname - e.g., /the-billet-tachometer-dial...-red/
 * @returns {string} - e.g., the-billet-tachometer-dial...-red
 */
export function extractSlug(pathname) {
    let slug = pathname.split('?')[0];
    slug = slug.replace(/^\/|\/$/g, '');
    slug = slug.replace(/-+$/, '');
    return slug;
}

function stripPrefix(key, prefix) {
    if (prefix && key.startsWith(prefix)) {
        return key.substring(prefix.length);
    }
    return key;
}

/**
 * Resolves the current URL to a selection state object based on archetype data.
 * @param {string} pathname - The current window.location.pathname.
 * @param {Object} archetypeData - The loaded archetype JSON data.
 * @returns {Object|null} - The resolved selection state, or null if not an alias.
 */
export function resolveUrlToSelection(pathname, archetypeData) {
    const slug = extractSlug(pathname);
    const targetFile = `${slug}.json`;

    if (archetypeData.universal_product) {
        return findInUniversal(archetypeData, targetFile);
    } else {
        return findInFitment(archetypeData, targetFile);
    }
}

function findInUniversal(archetypeData, targetFile) {
    const { option_title, sub_option_title } = archetypeData;
    
    let root = archetypeData;
    
    // Universal products sometimes wrap data in a dummy make_model_index
    if (archetypeData.make_model_index) {
        try {
            const make = Object.values(archetypeData.make_model_index)[0];
            const model = Object.values(make.models)[0];
            const genKey = Object.keys(model.generations)[0];
            
            if (genKey === targetFile) return {}; 
            root = model.generations[genKey];
        } catch (e) {
            // Ignore if structure is malformed
        }
    }

    if (root === targetFile || root.alias === targetFile) return {};

    if (root.options && option_title) {
        for (const optKey in root.options) {
            const optNode = root.options[optKey];

            if (optKey === targetFile || optNode === targetFile || (optNode && optNode.alias === targetFile)) {
                return { [option_title]: optKey };
            }

            if (typeof optNode === 'object' && optNode.sub_options && sub_option_title) {
                for (const subOptKey in optNode.sub_options) {
                    const subOptNode = optNode.sub_options[subOptKey];
                    if (subOptKey === targetFile || subOptNode === targetFile || (subOptNode && subOptNode.alias === targetFile)) {
                        return { [option_title]: optKey, [sub_option_title]: subOptKey };
                    }
                }
            }
        }
    }
    return null;
}

function findInFitment(archetypeData, targetFile) {
    const index = archetypeData.make_model_index;
    const { option_title, sub_option_title } = archetypeData;
    if (!index) return null;

    for (const makeKey in index) {
        const makeNode = index[makeKey];
        if (!makeNode || !makeNode.models) continue;

        for (const modelKey in makeNode.models) {
            const strippedModel = stripPrefix(modelKey, makeKey);
            const modelNode = makeNode.models[modelKey];
            if (!modelNode || !modelNode.generations) continue;

            for (const genKey in modelNode.generations) {
                const strippedGen = stripPrefix(genKey, makeKey);
                const genNode = modelNode.generations[genKey];

                if (genKey === targetFile || genNode === targetFile || (genNode && genNode.alias === targetFile)) {
                    return { make: makeKey, model: strippedModel, generation: strippedGen };
                }

                if (typeof genNode === 'object' && genNode.options && option_title) {
                    for (const optKey in genNode.options) {
                        const optNode = genNode.options[optKey];

                        if (optKey === targetFile || optNode === targetFile || (optNode && optNode.alias === targetFile)) {
                            return { make: makeKey, model: strippedModel, generation: strippedGen, [option_title]: optKey };
                        }

                        if (typeof optNode === 'object' && optNode.sub_options && sub_option_title) {
                            for (const subOptKey in optNode.sub_options) {
                                const subOptNode = optNode.sub_options[subOptKey];
                                if (subOptKey === targetFile || subOptNode === targetFile || (subOptNode && subOptNode.alias === targetFile)) {
                                    return { make: makeKey, model: strippedModel, generation: strippedGen, [option_title]: optKey, [sub_option_title]: subOptKey };
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return null;
}