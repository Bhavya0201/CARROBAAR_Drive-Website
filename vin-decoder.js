/**
 * CARROBAAR PDI - Vehicle VIN Decoder Engine
 * Decodes 17-digit (and extended 19-digit) VINs for Indian & Global Car Brands.
 */

(function () {
    'use strict';

    // WMI (World Manufacturer Identifier) Brand Auto-Detection Map
    const WMI_MAP = {
        'MA3': 'maruti',
        'MBH': 'tata',
        'MAT': 'tata',
        'MAH': 'mahindra',
        'MA1': 'mahindra',
        'MAL': 'hyundai',
        'MZK': 'kia',
        'KNA': 'kia',
        'ME4': 'honda',
        'MAK': 'honda',
        'AHT': 'toyota',
        'MBJ': 'toyota',
        'TMB': 'skoda',
        'MZA': 'skoda',
        'WVW': 'volkswagen',
        'MEX': 'volkswagen',
        'MNB': 'ford',
        'MA6': 'ford',
        'MZB': 'nissan',
        'MCA': 'renault',
        'ZFA': 'fiat',
        'KL1': 'chevrolet',
        'LJ8': 'mg',
        '3D7': 'jeep',
        'VR7': 'citroen'
    };

    // Manufacturer Decoding Rules
    const BRAND_RULES = {
        tata: {
            name: "Tata Motors",
            yearPos: 10,
            monthPos: 12,
            notes: "10th character is Year, 12th character is Month."
        },
        maruti: {
            name: "Maruti Suzuki",
            yearPos: 10,
            monthPos: 11,
            notes: "10th character is Year, 11th character is Month."
        },
        hyundai: {
            name: "Hyundai",
            yearPos: 10,
            monthPos: 19,
            fallbackMonthPos: 11,
            notes: "Hyundai India VINs often contain 19 characters with Month at 19th position (or 11th for 17-digit VINs)."
        },
        mahindra: {
            name: "Mahindra",
            yearPos: 10,
            monthPos: 12,
            notes: "10th character is Year, 11th is Assembly Plant, 12th is Month."
        },
        kia: {
            name: "Kia Motors",
            yearPos: 10,
            monthPos: 11,
            notes: "Follows ISO 3779 standard (10th Year, 11th Month)."
        },
        honda: {
            name: "Honda",
            yearPos: 10,
            monthPos: 9,
            notes: "10th character is Year, 9th character is Month."
        },
        skoda: {
            name: "Skoda",
            yearPos: 10,
            monthPos: 6,
            notes: "10th character is Model Year, 6th character is Month."
        },
        volkswagen: {
            name: "Volkswagen",
            yearPos: 10,
            monthPos: 4,
            isVW: true,
            notes: "4th character is Month, 5th & 6th characters (or 10th) indicate Calendar/Model Year."
        },
        toyota: {
            name: "Toyota",
            yearPos: 10,
            monthPos: 11,
            notes: "10th character is Year. Month varies by factory tag/seatbelt label."
        },
        ford: {
            name: "Ford",
            yearPos: 11,
            monthPos: 12,
            notes: "11th character is Year, 12th character is Month."
        },
        renault: {
            name: "Renault",
            yearPos: 10,
            monthPos: 11,
            notes: "10th character is Year, 11th character is Month."
        },
        nissan: {
            name: "Nissan",
            yearPos: 10,
            monthPos: 11,
            notes: "10th character is Year, 11th character is Month."
        },
        mg: {
            name: "MG Motor",
            yearPos: 10,
            monthPos: 11,
            notes: "10th character is Year, 11th character is Month."
        },
        jeep: {
            name: "Jeep",
            yearPos: 10,
            monthPos: 11,
            notes: "10th character is Year, 11th character is Month."
        },
        citroen: {
            name: "Citroen",
            yearPos: 10,
            monthPos: 11,
            notes: "10th character is Year, 11th character is Month."
        },
        fiat: {
            name: "Fiat",
            yearPos: 19,
            monthPos: 18,
            fallbackYearPos: 10,
            fallbackMonthPos: 11,
            notes: "Fiat uses longer 20-character VINs with Month at 18th and Year at 19-20th positions."
        },
        chevrolet: {
            name: "Chevrolet",
            yearPos: 9,
            monthPos: 7,
            notes: "Effective Feb 2011+: 9th character is Year, 7th character is Month."
        },
        mitsubishi: {
            name: "Mitsubishi",
            yearPos: 10,
            monthPos: 11,
            notes: "10th character is Year, 11th character is Month."
        },
        generic: {
            name: "Standard ISO 3779 (General)",
            yearPos: 10,
            monthPos: 11,
            notes: "Standard ISO 3779 standard (10th Year, 11th Month)."
        }
    };

    // Standard Year Mapping
    const YEAR_MAP = {
        'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
        'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
        'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
        'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
        'Y': 2030,
        '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005,
        '6': 2006, '7': 2007, '8': 2008, '9': 2009, '0': 2010
    };

    // Standard Month Mapping
    const MONTH_MAP = {
        'A': 'January',
        'B': 'February',
        'C': 'March',
        'D': 'April',
        'E': 'May',
        'F': 'June',
        'G': 'July',
        'H': 'August',
        'J': 'September',
        'K': 'October',
        'L': 'November',
        'M': 'December',
        '1': 'January',
        '2': 'February',
        '3': 'March',
        '4': 'April',
        '5': 'May',
        '6': 'June',
        '7': 'July',
        '8': 'August',
        '9': 'September',
        '0': 'October',
        'X': 'October',
        'O': 'October',
        'N': 'November',
        'D': 'December'
    };

    // Initialize VIN Decoder DOM events
    document.addEventListener("DOMContentLoaded", () => {
        const vinInput = document.getElementById("vin-input");
        const brandSelect = document.getElementById("brand-select");
        const decodeBtn = document.getElementById("btn-decode-vin");
        const resetBtn = document.getElementById("btn-reset-vin");
        const charCount = document.getElementById("vin-char-counter");
        const resultSection = document.getElementById("vin-result-section");
        const previewBoxesContainer = document.getElementById("vin-preview-boxes");
        const errorAlert = document.getElementById("vin-error-alert");

        if (!vinInput) return;

        // Auto-convert VIN to uppercase & sanitize invalid characters (I, O, Q are not allowed in standard VINs)
        vinInput.addEventListener("input", (e) => {
            let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
            e.target.value = val;

            if (charCount) {
                charCount.textContent = `${val.length} / 17+`;
                if (val.length >= 17) {
                    charCount.classList.add("valid-length");
                } else {
                    charCount.classList.remove("valid-length");
                }
            }

            // Auto-detect brand if brand is set to "auto"
            if (brandSelect && brandSelect.value === "auto" && val.length >= 3) {
                const wmi = val.substring(0, 3);
                if (WMI_MAP[wmi]) {
                    const detectedBrand = WMI_MAP[wmi];
                    const detectedOption = brandSelect.querySelector(`option[value="${detectedBrand}"]`);
                    if (detectedOption) {
                        const hint = document.getElementById("brand-autodetect-hint");
                        if (hint) {
                            hint.textContent = `⚡ Auto-detected: ${BRAND_RULES[detectedBrand].name}`;
                            hint.style.display = "block";
                        }
                    }
                }
            }

            renderVinPreview(val);
        });

        // Intercept decode request when signed out vs signed in
        function handleDecodeRequest(e) {
            if (e) e.preventDefault();
            const isVerified = localStorage.getItem("carrobaar_google_verified") === "true";
            if (!isVerified) {
                if (typeof window.openLeadModal === 'function') {
                    window.openLeadModal(
                        "Sign In / Sign Up to Decode VIN",
                        "Create a free account or sign in with Google to unlock live 17-digit VIN decoding for all vehicle makes.",
                        { triggerDownload: false }
                    );
                }
                return;
            }
            decodeVin(false);
        }

        // Trigger decode on enter key
        vinInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                handleDecodeRequest(e);
            }
        });

        if (decodeBtn) {
            decodeBtn.addEventListener("click", handleDecodeRequest);
        }

        const unlockBtn = document.getElementById("btn-banner-unlock-vin");
        if (unlockBtn) {
            unlockBtn.addEventListener("click", () => {
                if (typeof window.openLeadModal === 'function') {
                    window.openLeadModal(
                        "Sign In / Sign Up to Decode VIN",
                        "Create a free account or sign in with Google to unlock live 17-digit VIN decoding for all vehicle makes.",
                        { triggerDownload: false }
                    );
                }
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener("click", resetVinForm);
        }

        function checkAuthStateAndInit() {
            const isVerified = localStorage.getItem("carrobaar_google_verified") === "true";
            const previewBanner = document.getElementById("vin-preview-banner");

            if (!isVerified) {
                if (previewBanner) previewBanner.style.display = "flex";
                // Pre-fill sample preview VIN to show how output looks
                if (!vinInput.value || vinInput.value === "MAT622112P3M12345") {
                    vinInput.value = "MAT622112P3M12345";
                    if (charCount) {
                        charCount.textContent = "17 / 17+";
                        charCount.classList.add("valid-length");
                    }
                    renderVinPreview("MAT622112P3M12345");
                    decodeVin(true); // true = preview mode
                }
            } else {
                if (previewBanner) previewBanner.style.display = "none";
                if (vinInput.value === "MAT622112P3M12345") {
                    resetVinForm();
                }
            }
        }

        window.addEventListener("carrobaar_auth_changed", () => {
            checkAuthStateAndInit();
        });

        // Initialize state
        checkAuthStateAndInit();

        function resetVinForm() {
            if (vinInput) vinInput.value = "";
            if (brandSelect) brandSelect.value = "auto";
            if (charCount) {
                charCount.textContent = "0 / 17+";
                charCount.classList.remove("valid-length");
            }
            if (errorAlert) {
                errorAlert.style.display = "none";
                errorAlert.textContent = "";
            }
            
            const placeholderEl = document.getElementById("res-placeholder-card");
            const activeResultEl = document.getElementById("res-active-content");
            if (placeholderEl) placeholderEl.style.display = "flex";
            if (activeResultEl) activeResultEl.style.display = "none";

            const hint = document.getElementById("brand-autodetect-hint");
            if (hint) hint.style.display = "none";
            renderVinPreview("");
        }

        function renderVinPreview(vin) {
            if (!previewBoxesContainer) return;
            previewBoxesContainer.innerHTML = "";

            const selectedBrandKey = getEffectiveBrandKey(vin);
            const rule = BRAND_RULES[selectedBrandKey] || BRAND_RULES.generic;

            const yearPos = rule.yearPos;
            let monthPos = rule.monthPos;
            if (vin.length < 19 && rule.fallbackMonthPos) {
                monthPos = rule.fallbackMonthPos;
            }

            const displayLength = Math.max(17, vin.length);
            for (let i = 1; i <= displayLength; i++) {
                const box = document.createElement("div");
                box.className = "vin-preview-box";
                const char = vin[i - 1] || "";
                box.textContent = char;

                if (i === yearPos) {
                    box.classList.add("box-year");
                    box.title = `Position ${i}: Year Code`;
                } else if (i === monthPos) {
                    box.classList.add("box-month");
                    box.title = `Position ${i}: Month Code`;
                }

                const label = document.createElement("span");
                label.className = "box-index-label";
                label.textContent = i;
                box.appendChild(label);

                previewBoxesContainer.appendChild(box);
            }
        }

        function getEffectiveBrandKey(vin) {
            if (brandSelect && brandSelect.value !== "auto") {
                return brandSelect.value;
            }
            if (vin && vin.length >= 3) {
                const wmi = vin.substring(0, 3);
                if (WMI_MAP[wmi]) {
                    return WMI_MAP[wmi];
                }
            }
            return "generic";
        }

        function decodeVin(isPreview = false) {
            const vin = vinInput.value.trim().toUpperCase();
            if (!vin) {
                showVinError("Please enter your 17-digit Vehicle Identification Number (VIN).");
                return;
            }

            if (vin.length < 17) {
                showVinError(`Your VIN currently has ${vin.length} characters. A standard VIN requires at least 17 characters.`);
                return;
            }

            hideVinError();

            const brandKey = getEffectiveBrandKey(vin);
            const rule = BRAND_RULES[brandKey] || BRAND_RULES.generic;

            let yearPos = rule.yearPos;
            let monthPos = rule.monthPos;

            // Handle fallbacks for 17-character VINs on Hyundai/Fiat
            if (vin.length < 19 && rule.fallbackMonthPos) {
                monthPos = rule.fallbackMonthPos;
            }
            if (vin.length < 19 && rule.fallbackYearPos) {
                yearPos = rule.fallbackYearPos;
            }

            // Extract Year Code
            let yearCode = vin[yearPos - 1] || '';
            let decodedYear = YEAR_MAP[yearCode] || null;

            // Special handling for Volkswagen (5th & 6th characters as calendar year e.g. 12 = 2012, 24 = 2024)
            if (rule.isVW && vin.length >= 6) {
                const vwYearPair = vin.substring(4, 6);
                if (/^\d{2}$/.test(vwYearPair)) {
                    const parsed = parseInt(vwYearPair, 10);
                    if (parsed >= 10 && parsed <= 35) {
                        decodedYear = 2000 + parsed;
                    }
                }
            }

            // Extract Month Code
            let monthCode = vin[monthPos - 1] || '';
            let decodedMonth = MONTH_MAP[monthCode] || null;

            // Format Results UI
            displayVinResults({
                vin,
                brandName: rule.name,
                year: decodedYear || 'Unknown / Check Placard',
                month: decodedMonth || 'Unknown / Check Placard',
                yearPos,
                monthPos,
                yearCode,
                monthCode,
                notes: rule.notes,
                isPreview
            });
        }

        function displayVinResults(res) {
            const vinCodeEl = document.getElementById("res-vin-code");
            if (!vinCodeEl) return;

            vinCodeEl.textContent = res.vin;
            document.getElementById("res-brand-name").textContent = res.brandName;
            document.getElementById("res-prod-month").textContent = res.month;
            document.getElementById("res-prod-year").textContent = res.year;
            document.getElementById("res-year-pos-info").textContent = `Position ${res.yearPos} (Code: '${res.yearCode}')`;
            document.getElementById("res-month-pos-info").textContent = `Position ${res.monthPos} (Code: '${res.monthCode}')`;
            document.getElementById("res-brand-notes").textContent = res.notes || "Standard decoding rules applied.";

            let previewBadge = document.getElementById("res-preview-pill");
            if (res.isPreview) {
                if (!previewBadge) {
                    previewBadge = document.createElement("span");
                    previewBadge.id = "res-preview-pill";
                    previewBadge.style.cssText = "display: inline-block; font-size: 0.72rem; font-weight: 800; color: #7E22CE; background: #F3E8FF; border: 1px solid #C084FC; padding: 2px 8px; border-radius: 6px; margin-left: 8px; vertical-align: middle;";
                    previewBadge.textContent = "SAMPLE PREVIEW";
                    vinCodeEl.parentNode.appendChild(previewBadge);
                } else {
                    previewBadge.style.display = "inline-block";
                }
            } else if (previewBadge) {
                previewBadge.style.display = "none";
            }

            // Calculate Vehicle Age / Freshness Assessment
            const currentYear = new Date().getFullYear();

            let freshnessBadge = document.getElementById("res-freshness-badge");
            if (freshnessBadge) {
                if (typeof res.year === 'number') {
                    const yearDiff = currentYear - res.year;
                    if (yearDiff === 0) {
                        freshnessBadge.className = "freshness-badge fresh-stock";
                        freshnessBadge.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Fresh Factory Stock (${res.year})`;
                    } else if (yearDiff === 1) {
                        freshnessBadge.className = "freshness-badge moderate-stock";
                        freshnessBadge.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Moderate Stock (~1 Year Old)`;
                    } else {
                        freshnessBadge.className = "freshness-badge old-stock";
                        freshnessBadge.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Older Stock (${yearDiff} Years Old - Thorough PDI Advised)`;
                    }
                } else {
                    freshnessBadge.className = "freshness-badge neutral-stock";
                    freshnessBadge.innerHTML = `Verify exact tag in engine bay`;
                }
            }

            const placeholderEl = document.getElementById("res-placeholder-card");
            const activeResultEl = document.getElementById("res-active-content");

            if (placeholderEl) placeholderEl.style.display = "none";
            if (activeResultEl) {
                activeResultEl.style.display = "flex";
            }
        }

        function showVinError(msg) {
            if (errorAlert) {
                errorAlert.textContent = msg;
                errorAlert.style.display = "block";
            }
        }

        function hideVinError() {
            if (errorAlert) {
                errorAlert.style.display = "none";
                errorAlert.textContent = "";
            }
        }

        // Initial preview render
        renderVinPreview("");
    });
})();
