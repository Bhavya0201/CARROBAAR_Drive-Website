/**
 * CARROBAAR Drive - Smart Car Loan EMI & Prepayment Planner Engine
 * Real-time dual slider + typed input synchronization, Indian currency formatting,
 * advanced prepayment simulation, dynamic SVG donut chart, and amortization schedule.
 */

(function () {
    'use strict';

    // State object holding all calculation inputs
    const state = {
        vehiclePrice: 1500000,     // ₹ 15 Lakh
        downPayment: 300000,        // ₹ 3 Lakh (20%)
        downPaymentPct: 20,         // 20%
        loanAmount: 1200000,        // ₹ 12 Lakh
        interestRate: 8.75,         // 8.75% p.a. (SBI Benchmark)
        tenureYears: 5,             // 5 Years
        tenureMonths: 60,           // 60 Months
        prepaymentActive: true,     // Prepayment Optimizer enabled
        extraMonthly: 2500,         // ₹ 2,500 extra per month
        extraYearlyEMI: true,       // 1 Extra EMI every year (Diwali / Bonus)
        bulkPrepayment: 100000,     // ₹ 1,00,000 lump sum
        bulkPrepaymentMonth: 12,    // In Month 12 (Year 1)
        scheduleView: 'yearly'      // 'yearly' | 'monthly'
    };

    // Cache DOM Elements
    let dom = {};

    function cacheDOM() {
        dom = {
            // Price
            vehiclePriceSlider: document.getElementById('vehicle-price-slider'),
            vehiclePriceInput: document.getElementById('vehicle-price-input'),
            vehiclePriceBadge: document.getElementById('vehicle-price-badge'),
            
            // Down Payment
            downPaymentSlider: document.getElementById('down-payment-slider'),
            downPaymentInput: document.getElementById('down-payment-input'),
            downPaymentPctSlider: document.getElementById('down-payment-pct-slider'),
            downPaymentPctInput: document.getElementById('down-payment-pct-input'),
            
            // Loan Amount
            loanAmountSlider: document.getElementById('loan-amount-slider'),
            loanAmountInput: document.getElementById('loan-amount-input'),
            loanAmountBadge: document.getElementById('loan-amount-badge'),
            
            // Interest Rate
            interestRateSlider: document.getElementById('interest-rate-slider'),
            interestRateInput: document.getElementById('interest-rate-input'),
            
            // Tenure
            tenureYearsSlider: document.getElementById('tenure-years-slider'),
            tenureYearsInput: document.getElementById('tenure-years-input'),
            tenureMonthsBadge: document.getElementById('tenure-months-badge'),
            
            // Mode Tabs
            tabStandard: document.getElementById('tab-mode-standard'),
            tabPrepayment: document.getElementById('tab-mode-prepayment'),
            prepaymentPanel: document.getElementById('prepayment-controls-panel'),
            prepaymentToggleCard: document.getElementById('prepayment-toggle-card'),
            prepaymentToggleSwitch: document.getElementById('prepayment-enable-toggle'),
            
            // Prepayment Inputs
            extraMonthlySlider: document.getElementById('extra-monthly-slider'),
            extraMonthlyInput: document.getElementById('extra-monthly-input'),
            yearlyEmiToggle: document.getElementById('yearly-emi-toggle'),
            bulkAmountSlider: document.getElementById('bulk-amount-slider'),
            bulkAmountInput: document.getElementById('bulk-amount-input'),
            bulkMonthSelect: document.getElementById('bulk-month-select'),
            
            // Quick Pills
            priceChips: document.querySelectorAll('.chip-price'),
            tenureChips: document.querySelectorAll('.chip-tenure'),
            bankChips: document.querySelectorAll('.chip-bank'),
            
            // Results Display
            displayEmi: document.getElementById('display-monthly-emi'),
            displayPrincipal: document.getElementById('display-principal'),
            displayInterest: document.getElementById('display-interest'),
            displayTotalPayable: document.getElementById('display-total-payable'),
            displayTenureOriginal: document.getElementById('display-tenure-original'),
            
            // Prepayment Results Display
            prepaymentResultsCard: document.getElementById('prepayment-results-card'),
            displayInterestSaved: document.getElementById('display-interest-saved'),
            displayTenureSaved: document.getElementById('display-tenure-saved'),
            displayNewTenure: document.getElementById('display-new-tenure'),
            displaySavingsPercentage: document.getElementById('display-savings-percentage'),
            displayNewTotalPayable: document.getElementById('display-new-total-payable'),
            displayDebtFreeDate: document.getElementById('display-debt-free-date'),
            
            // Chart Elements
            chartSvg: document.getElementById('emi-donut-svg'),
            chartSegmentPrincipal: document.getElementById('donut-segment-principal'),
            chartSegmentInterest: document.getElementById('donut-segment-interest'),
            chartSegmentSaved: document.getElementById('donut-segment-saved'),
            chartCenterValue: document.getElementById('donut-center-value'),
            chartCenterLabel: document.getElementById('donut-center-label'),
            chartLegendSaved: document.getElementById('chart-legend-saved'),
            
            // Schedule & Actions
            scheduleTableBody: document.getElementById('schedule-table-body'),
            btnToggleSchedule: document.getElementById('btn-toggle-schedule'),
            scheduleContainer: document.getElementById('schedule-table-container'),
            scheduleViewToggleBtns: document.querySelectorAll('.btn-schedule-view'),
            btnDownloadCsv: document.getElementById('btn-download-csv'),
            btnPrintSummary: document.getElementById('btn-print-summary'),
            
            // Mobile Sticky Bar
            mobileStickyBar: document.getElementById('emi-mobile-sticky-bar'),
            mobileStickyEmi: document.getElementById('mobile-sticky-emi'),
            mobileStickySavings: document.getElementById('mobile-sticky-savings'),
            btnMobileViewResults: document.getElementById('btn-mobile-view-results')
        };
    }

    // Number formatting helper in Indian numbering system
    function formatINR(val, compact = false) {
        if (val === null || val === undefined || isNaN(val)) return '₹ 0';
        val = Math.round(val);
        if (compact) {
            if (val >= 10000000) return '₹ ' + (val / 10000000).toFixed(2) + ' Cr';
            if (val >= 100000) return '₹ ' + (val / 100000).toFixed(2) + ' Lakh';
            if (val >= 1000) return '₹ ' + (val / 1000).toFixed(1) + 'k';
        }
        return '₹ ' + val.toLocaleString('en-IN');
    }

    // Mathematical Core: Calculate Standard Monthly EMI
    function calculateStandardEMI(principal, annualRate, months) {
        if (principal <= 0 || months <= 0) return 0;
        if (annualRate <= 0) return Math.round(principal / months);
        const monthlyRate = annualRate / (12 * 100);
        const factor = Math.pow(1 + monthlyRate, months);
        const emi = (principal * monthlyRate * factor) / (factor - 1);
        return Math.round(emi);
    }

    // Prepayment Simulation Engine: Month-by-month amortization loop
    function simulateLoan(params) {
        const {
            principal,
            annualRate,
            tenureMonths,
            extraMonthly = 0,
            extraYearlyEMI = false,
            bulkAmount = 0,
            bulkMonth = 0
        } = params;

        const monthlyRate = annualRate / (12 * 100);
        const regularEMI = calculateStandardEMI(principal, annualRate, tenureMonths);
        const standardTotalAmount = regularEMI * tenureMonths;
        const standardTotalInterest = standardTotalAmount - principal;

        let balance = principal;
        let totalInterestPaid = 0;
        let totalPrincipalPaid = 0;
        let totalExtraPaid = 0;
        let month = 0;
        const monthlySchedule = [];
        const yearlySchedule = [];

        let currentYear = 1;
        let yearOpeningBalance = principal;
        let yearPrincipal = 0;
        let yearInterest = 0;
        let yearExtra = 0;
        let yearTotalPaid = 0;

        // Loop month-by-month until loan balance is 0 or max 240 months cap
        while (balance > 1 && month < 360) {
            month++;
            const monthInYear = ((month - 1) % 12) + 1;
            const opening = balance;
            const interest = opening * monthlyRate;

            // Compute extra payment for this month
            let extra = 0;
            if (extraMonthly > 0) {
                extra += extraMonthly;
            }
            if (extraYearlyEMI && monthInYear === 12) {
                extra += regularEMI;
            }
            if (bulkAmount > 0 && month === bulkMonth) {
                extra += bulkAmount;
            }

            let normalPayment = regularEMI;
            let totalMonthPayment = normalPayment + extra;

            // Check if final payment is less than total scheduled
            let principalPaid = 0;
            let isFinalMonth = false;

            if (balance + interest <= totalMonthPayment) {
                // Closing loan
                totalMonthPayment = balance + interest;
                principalPaid = balance;
                balance = 0;
                isFinalMonth = true;
            } else {
                principalPaid = totalMonthPayment - interest;
                balance = balance - principalPaid;
            }

            totalInterestPaid += interest;
            totalPrincipalPaid += principalPaid;
            totalExtraPaid += extra;

            // Yearly aggregates
            yearPrincipal += principalPaid;
            yearInterest += interest;
            yearExtra += extra;
            yearTotalPaid += totalMonthPayment;

            monthlySchedule.push({
                month,
                year: Math.ceil(month / 12),
                monthInYear,
                openingBalance: Math.round(opening),
                emi: Math.round(normalPayment),
                extraPayment: Math.round(extra),
                interest: Math.round(interest),
                principal: Math.round(principalPaid),
                totalPayment: Math.round(totalMonthPayment),
                closingBalance: Math.max(0, Math.round(balance))
            });

            // Close year record if month 12 or if loan closed
            if (monthInYear === 12 || isFinalMonth) {
                yearlySchedule.push({
                    year: currentYear,
                    openingBalance: Math.round(yearOpeningBalance),
                    regularEmi: Math.round(yearTotalPaid - yearExtra),
                    extraPayment: Math.round(yearExtra),
                    principalPaid: Math.round(yearPrincipal),
                    interestPaid: Math.round(yearInterest),
                    totalPaid: Math.round(yearTotalPaid),
                    closingBalance: Math.max(0, Math.round(balance)),
                    monthsCount: monthInYear
                });

                currentYear++;
                yearOpeningBalance = balance;
                yearPrincipal = 0;
                yearInterest = 0;
                yearExtra = 0;
                yearTotalPaid = 0;
            }

            if (isFinalMonth) break;
        }

        const newTenureMonths = month;
        const totalPaidWithPrepayment = totalPrincipalPaid + totalInterestPaid;
        const interestSaved = Math.max(0, standardTotalInterest - totalInterestPaid);
        const monthsSaved = Math.max(0, tenureMonths - newTenureMonths);

        return {
            principal,
            annualRate,
            tenureMonths,
            regularEMI,
            standardTotalInterest: Math.round(standardTotalInterest),
            standardTotalAmount: Math.round(standardTotalAmount),
            newTenureMonths,
            monthsSaved,
            totalInterestPaid: Math.round(totalInterestPaid),
            totalPrincipalPaid: Math.round(totalPrincipalPaid),
            totalExtraPaid: Math.round(totalExtraPaid),
            totalPaidWithPrepayment: Math.round(totalPaidWithPrepayment),
            interestSaved: Math.round(interestSaved),
            monthlySchedule,
            yearlySchedule
        };
    }

    // Dynamic SVG Donut Chart Renderer
    function updateDonutChart(data, isPrepaymentActive) {
        if (!dom.chartSvg || !dom.chartSegmentPrincipal || !dom.chartSegmentInterest) return;

        const radius = 64;
        const circumference = 2 * Math.PI * radius; // ~402.12

        // Set circumference on SVG circles
        dom.chartSegmentPrincipal.style.strokeDasharray = `${circumference}`;
        dom.chartSegmentInterest.style.strokeDasharray = `${circumference}`;
        if (dom.chartSegmentSaved) {
            dom.chartSegmentSaved.style.strokeDasharray = `${circumference}`;
        }

        const totalPayableStandard = data.standardTotalAmount;
        if (totalPayableStandard <= 0) return;

        if (!isPrepaymentActive || data.interestSaved <= 0) {
            // Standard 2-segment mode: Principal + Interest
            const principalRatio = data.principal / totalPayableStandard;
            const interestRatio = data.standardTotalInterest / totalPayableStandard;

            const principalDash = principalRatio * circumference;
            const interestDash = interestRatio * circumference;

            dom.chartSegmentPrincipal.style.strokeDashoffset = '0';
            dom.chartSegmentPrincipal.style.strokeDasharray = `${principalDash} ${circumference}`;

            // Rotate interest segment to start after principal
            dom.chartSegmentInterest.style.strokeDashoffset = `-${principalDash}`;
            dom.chartSegmentInterest.style.strokeDasharray = `${interestDash} ${circumference}`;

            if (dom.chartSegmentSaved) {
                dom.chartSegmentSaved.style.display = 'none';
            }
            if (dom.chartLegendSaved) {
                dom.chartLegendSaved.style.display = 'none';
            }

            if (dom.chartCenterValue) {
                dom.chartCenterValue.textContent = formatINR(data.regularEMI, true);
            }
            if (dom.chartCenterLabel) {
                dom.chartCenterLabel.textContent = 'Monthly EMI';
            }
        } else {
            // Prepayment 3-segment mode: Principal + Net Interest Paid + Interest Saved!
            const netInterest = data.totalInterestPaid;
            const savedInterest = data.interestSaved;

            const principalRatio = data.principal / totalPayableStandard;
            const netInterestRatio = netInterest / totalPayableStandard;
            const savedInterestRatio = savedInterest / totalPayableStandard;

            const principalDash = principalRatio * circumference;
            const netInterestDash = netInterestRatio * circumference;
            const savedDash = savedInterestRatio * circumference;

            dom.chartSegmentPrincipal.style.strokeDashoffset = '0';
            dom.chartSegmentPrincipal.style.strokeDasharray = `${principalDash} ${circumference}`;

            dom.chartSegmentInterest.style.strokeDashoffset = `-${principalDash}`;
            dom.chartSegmentInterest.style.strokeDasharray = `${netInterestDash} ${circumference}`;

            if (dom.chartSegmentSaved) {
                dom.chartSegmentSaved.style.display = 'block';
                dom.chartSegmentSaved.style.strokeDashoffset = `-${principalDash + netInterestDash}`;
                dom.chartSegmentSaved.style.strokeDasharray = `${savedDash} ${circumference}`;
            }

            if (dom.chartLegendSaved) {
                dom.chartLegendSaved.style.display = 'inline-flex';
            }

            if (dom.chartCenterValue) {
                dom.chartCenterValue.textContent = formatINR(data.interestSaved, true);
            }
            if (dom.chartCenterLabel) {
                dom.chartCenterLabel.textContent = 'Interest Saved!';
            }
        }
    }

    // Populate Bulk Month Dropdown based on current Tenure
    function populateBulkMonthDropdown() {
        if (!dom.bulkMonthSelect) return;
        const currentVal = parseInt(dom.bulkMonthSelect.value, 10) || state.bulkPrepaymentMonth;
        dom.bulkMonthSelect.innerHTML = '';

        const maxMonths = state.tenureMonths;
        for (let m = 6; m <= maxMonths; m += 6) {
            const opt = document.createElement('option');
            opt.value = m;
            const yr = Math.floor(m / 12);
            const remMo = m % 12;
            let label = `After ${m} Months`;
            if (yr > 0 && remMo === 0) {
                label = `End of Year ${yr} (Month ${m})`;
            } else if (yr > 0) {
                label = `Year ${yr} + ${remMo} Mos (Month ${m})`;
            }
            opt.textContent = label;
            if (m === currentVal || (m <= currentVal && currentVal < m + 6)) {
                opt.selected = true;
            }
            dom.bulkMonthSelect.appendChild(opt);
        }

        // Default to month 12 if available
        if (!dom.bulkMonthSelect.value && dom.bulkMonthSelect.options.length > 0) {
            dom.bulkMonthSelect.selectedIndex = Math.min(1, dom.bulkMonthSelect.options.length - 1);
        }
        state.bulkPrepaymentMonth = parseInt(dom.bulkMonthSelect.value, 10) || 12;
    }

    // Render Amortization Schedule Table
    function renderSchedule(simulationResult) {
        if (!dom.scheduleTableBody) return;
        dom.scheduleTableBody.innerHTML = '';

        const isYearly = state.scheduleView === 'yearly';
        const dataList = isYearly ? simulationResult.yearlySchedule : simulationResult.monthlySchedule;

        dataList.forEach((row) => {
            const tr = document.createElement('tr');
            if (isYearly) {
                tr.innerHTML = `
                    <td class="col-period"><strong>Year ${row.year}</strong> <span class="badge-sub">${row.monthsCount} mos</span></td>
                    <td class="col-currency">${formatINR(row.openingBalance)}</td>
                    <td class="col-currency">${formatINR(row.regularEmi)}</td>
                    <td class="col-currency ${row.extraPayment > 0 ? 'text-saved' : ''}">${row.extraPayment > 0 ? '+ ' + formatINR(row.extraPayment) : '—'}</td>
                    <td class="col-currency font-purple">${formatINR(row.principalPaid)}</td>
                    <td class="col-currency font-orange">${formatINR(row.interestPaid)}</td>
                    <td class="col-currency font-bold">${formatINR(row.closingBalance)}</td>
                `;
            } else {
                tr.innerHTML = `
                    <td class="col-period">Month ${row.month} <span class="badge-sub">Y${row.year}</span></td>
                    <td class="col-currency">${formatINR(row.openingBalance)}</td>
                    <td class="col-currency">${formatINR(row.emi)}</td>
                    <td class="col-currency ${row.extraPayment > 0 ? 'text-saved' : ''}">${row.extraPayment > 0 ? '+ ' + formatINR(row.extraPayment) : '—'}</td>
                    <td class="col-currency font-purple">${formatINR(row.principal)}</td>
                    <td class="col-currency font-orange">${formatINR(row.interest)}</td>
                    <td class="col-currency font-bold">${formatINR(row.closingBalance)}</td>
                `;
            }
            dom.scheduleTableBody.appendChild(tr);
        });
    }

    // Export Schedule as Clean CSV File
    function exportScheduleCSV(simulationResult) {
        const isYearly = state.scheduleView === 'yearly';
        const rows = [
            ['CARROBAAR Drive - Car Loan Amortization Schedule'],
            ['Vehicle Price', formatINR(state.vehiclePrice)],
            ['Loan Principal', formatINR(state.loanAmount)],
            ['Interest Rate', `${state.interestRate}% p.a.`],
            ['Loan Tenure', `${state.tenureYears} Years (${state.tenureMonths} Months)`],
            ['Standard Monthly EMI', formatINR(simulationResult.regularEMI)],
            ['Total Interest Saved', formatINR(simulationResult.interestSaved)],
            ['Tenure Reduced By', `${Math.floor(simulationResult.monthsSaved / 12)} Years ${simulationResult.monthsSaved % 12} Months`],
            []
        ];

        if (isYearly) {
            rows.push(['Period', 'Beginning Balance', 'Regular EMI Paid', 'Extra Prepayment', 'Principal Repaid', 'Interest Paid', 'Year-End Balance']);
            simulationResult.yearlySchedule.forEach(r => {
                rows.push([
                    `Year ${r.year}`,
                    r.openingBalance,
                    r.regularEmi,
                    r.extraPayment,
                    r.principalPaid,
                    r.interestPaid,
                    r.closingBalance
                ]);
            });
        } else {
            rows.push(['Month', 'Beginning Balance', 'EMI Paid', 'Extra Prepayment', 'Principal Repaid', 'Interest Paid', 'Closing Balance']);
            simulationResult.monthlySchedule.forEach(r => {
                rows.push([
                    `Month ${r.month} (Year ${r.year})`,
                    r.openingBalance,
                    r.emi,
                    r.extraPayment,
                    r.principal,
                    r.interest,
                    r.closingBalance
                ]);
            });
        }

        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `CARROBAAR_Car_Loan_Amortization_${state.scheduleView}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Helper: Compute Future Date
    function computeDebtFreeDate(monthsFromNow) {
        const d = new Date();
        d.setMonth(d.getMonth() + monthsFromNow);
        return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }

    // Master Recalculation & UI Refresh
    function recalculate() {
        // Enforce boundary sanity
        if (state.vehiclePrice < 100000) state.vehiclePrice = 100000;
        if (state.downPayment >= state.vehiclePrice) {
            state.downPayment = Math.round(state.vehiclePrice * 0.90);
            state.downPaymentPct = 90;
        }

        state.loanAmount = Math.max(10000, state.vehiclePrice - state.downPayment);
        state.tenureMonths = state.tenureYears * 12;

        // Perform calculation
        const result = simulateLoan({
            principal: state.loanAmount,
            annualRate: state.interestRate,
            tenureMonths: state.tenureMonths,
            extraMonthly: state.prepaymentActive ? state.extraMonthly : 0,
            extraYearlyEMI: state.prepaymentActive && state.extraYearlyEMI,
            bulkAmount: state.prepaymentActive ? state.bulkPrepayment : 0,
            bulkMonth: state.prepaymentActive ? state.bulkPrepaymentMonth : 0
        });

        // 1. Update Primary EMI Displays
        if (dom.displayEmi) {
            dom.displayEmi.textContent = result.regularEMI.toLocaleString('en-IN');
        }
        if (dom.displayPrincipal) {
            dom.displayPrincipal.textContent = formatINR(result.principal);
        }
        if (dom.displayInterest) {
            dom.displayInterest.textContent = formatINR(result.standardTotalInterest);
        }
        if (dom.displayTotalPayable) {
            dom.displayTotalPayable.textContent = formatINR(result.standardTotalAmount);
        }
        if (dom.displayTenureOriginal) {
            dom.displayTenureOriginal.textContent = `${state.tenureYears} Years (${state.tenureMonths} Months)`;
        }

        // 2. Prepayment Results Updates
        const hasSavings = state.prepaymentActive && (result.interestSaved > 0 || result.monthsSaved > 0);

        if (dom.prepaymentResultsCard) {
            if (hasSavings) {
                dom.prepaymentResultsCard.classList.add('has-savings');
                dom.prepaymentResultsCard.style.display = 'block';
            } else if (!state.prepaymentActive) {
                dom.prepaymentResultsCard.style.display = 'none';
            }
        }

        if (dom.displayInterestSaved) {
            dom.displayInterestSaved.textContent = formatINR(result.interestSaved);
        }

        if (dom.displayTenureSaved) {
            const yrs = Math.floor(result.monthsSaved / 12);
            const mos = result.monthsSaved % 12;
            let tenureSavedStr = '';
            if (yrs > 0 && mos > 0) {
                tenureSavedStr = `${yrs} Yr ${mos} Mos Earlier`;
            } else if (yrs > 0) {
                tenureSavedStr = `${yrs} Years Earlier`;
            } else if (mos > 0) {
                tenureSavedStr = `${mos} Months Earlier`;
            } else {
                tenureSavedStr = `0 Months (Tenure unchanged)`;
            }
            dom.displayTenureSaved.textContent = tenureSavedStr;
        }

        if (dom.displayNewTenure) {
            const newYrs = (result.newTenureMonths / 12).toFixed(1);
            dom.displayNewTenure.textContent = `${result.newTenureMonths} Months (${newYrs} Yrs)`;
        }

        if (dom.displaySavingsPercentage) {
            const pct = result.standardTotalInterest > 0 
                ? ((result.interestSaved / result.standardTotalInterest) * 100).toFixed(1) 
                : 0;
            dom.displaySavingsPercentage.textContent = `${pct}% of total interest saved`;
        }

        if (dom.displayNewTotalPayable) {
            dom.displayNewTotalPayable.textContent = formatINR(result.totalPaidWithPrepayment);
        }

        if (dom.displayDebtFreeDate) {
            const dateStr = computeDebtFreeDate(result.newTenureMonths);
            dom.displayDebtFreeDate.textContent = dateStr;
        }

        // 3. Update Chart
        updateDonutChart(result, state.prepaymentActive);

        // 4. Update Amortization Schedule
        renderSchedule(result);

        // 5. Update Mobile Sticky Bar
        if (dom.mobileStickyEmi) {
            dom.mobileStickyEmi.textContent = formatINR(result.regularEMI) + '/mo';
        }
        if (dom.mobileStickySavings) {
            if (hasSavings) {
                dom.mobileStickySavings.innerHTML = `<span class="badge-save">Save ${formatINR(result.interestSaved, true)}</span>`;
                dom.mobileStickySavings.style.display = 'inline-block';
            } else {
                dom.mobileStickySavings.style.display = 'none';
            }
        }

        // Cache last result for export
        state.lastSimulationResult = result;
    }

    // Synchronize Input Fields with State & Controls
    function syncInputs() {
        // Vehicle Price
        if (dom.vehiclePriceSlider) dom.vehiclePriceSlider.value = state.vehiclePrice;
        if (dom.vehiclePriceInput) dom.vehiclePriceInput.value = state.vehiclePrice;
        if (dom.vehiclePriceBadge) dom.vehiclePriceBadge.textContent = formatINR(state.vehiclePrice, true);

        // Down Payment
        if (dom.downPaymentSlider) dom.downPaymentSlider.value = state.downPayment;
        if (dom.downPaymentInput) dom.downPaymentInput.value = state.downPayment;
        if (dom.downPaymentPctSlider) dom.downPaymentPctSlider.value = state.downPaymentPct;
        if (dom.downPaymentPctInput) dom.downPaymentPctInput.value = state.downPaymentPct;

        // Loan Amount
        if (dom.loanAmountSlider) dom.loanAmountSlider.value = state.loanAmount;
        if (dom.loanAmountInput) dom.loanAmountInput.value = state.loanAmount;
        if (dom.loanAmountBadge) dom.loanAmountBadge.textContent = formatINR(state.loanAmount, true);

        // Interest Rate
        if (dom.interestRateSlider) dom.interestRateSlider.value = state.interestRate;
        if (dom.interestRateInput) dom.interestRateInput.value = state.interestRate;

        // Tenure
        if (dom.tenureYearsSlider) dom.tenureYearsSlider.value = state.tenureYears;
        if (dom.tenureYearsInput) dom.tenureYearsInput.value = state.tenureYears;
        if (dom.tenureMonthsBadge) dom.tenureMonthsBadge.textContent = `${state.tenureYears * 12} Mos`;

        // Prepayment Controls
        if (dom.extraMonthlySlider) dom.extraMonthlySlider.value = state.extraMonthly;
        if (dom.extraMonthlyInput) dom.extraMonthlyInput.value = state.extraMonthly;
        if (dom.yearlyEmiToggle) dom.yearlyEmiToggle.checked = state.extraYearlyEMI;
        if (dom.bulkAmountSlider) dom.bulkAmountSlider.value = state.bulkPrepayment;
        if (dom.bulkAmountInput) dom.bulkAmountInput.value = state.bulkPrepayment;
    }

    // Attach Event Listeners
    function attachEventListeners() {
        // 1. Vehicle Price Listeners
        if (dom.vehiclePriceSlider) {
            dom.vehiclePriceSlider.addEventListener('input', (e) => {
                state.vehiclePrice = parseInt(e.target.value, 10);
                // Maintain down payment percentage
                state.downPayment = Math.round(state.vehiclePrice * (state.downPaymentPct / 100));
                syncInputs();
                recalculate();
            });
        }
        if (dom.vehiclePriceInput) {
            dom.vehiclePriceInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 50000) {
                    state.vehiclePrice = val;
                    state.downPayment = Math.round(state.vehiclePrice * (state.downPaymentPct / 100));
                    syncInputs();
                    recalculate();
                }
            });
        }

        // 2. Down Payment Amount Listeners
        if (dom.downPaymentSlider) {
            dom.downPaymentSlider.addEventListener('input', (e) => {
                state.downPayment = parseInt(e.target.value, 10);
                state.downPaymentPct = Math.round((state.downPayment / state.vehiclePrice) * 100);
                syncInputs();
                recalculate();
            });
        }
        if (dom.downPaymentInput) {
            dom.downPaymentInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 0) {
                    state.downPayment = val;
                    state.downPaymentPct = Math.min(95, Math.round((state.downPayment / state.vehiclePrice) * 100));
                    syncInputs();
                    recalculate();
                }
            });
        }

        // 3. Down Payment Percentage Listeners
        if (dom.downPaymentPctSlider) {
            dom.downPaymentPctSlider.addEventListener('input', (e) => {
                state.downPaymentPct = parseFloat(e.target.value);
                state.downPayment = Math.round(state.vehiclePrice * (state.downPaymentPct / 100));
                syncInputs();
                recalculate();
            });
        }
        if (dom.downPaymentPctInput) {
            dom.downPaymentPctInput.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val >= 0 && val <= 90) {
                    state.downPaymentPct = val;
                    state.downPayment = Math.round(state.vehiclePrice * (state.downPaymentPct / 100));
                    syncInputs();
                    recalculate();
                }
            });
        }

        // 4. Direct Loan Amount Listeners
        if (dom.loanAmountSlider) {
            dom.loanAmountSlider.addEventListener('input', (e) => {
                state.loanAmount = parseInt(e.target.value, 10);
                state.downPayment = Math.max(0, state.vehiclePrice - state.loanAmount);
                state.downPaymentPct = Math.round((state.downPayment / state.vehiclePrice) * 100);
                syncInputs();
                recalculate();
            });
        }
        if (dom.loanAmountInput) {
            dom.loanAmountInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 10000) {
                    state.loanAmount = val;
                    state.downPayment = Math.max(0, state.vehiclePrice - state.loanAmount);
                    state.downPaymentPct = Math.round((state.downPayment / state.vehiclePrice) * 100);
                    syncInputs();
                    recalculate();
                }
            });
        }

        // 5. Interest Rate Listeners
        if (dom.interestRateSlider) {
            dom.interestRateSlider.addEventListener('input', (e) => {
                state.interestRate = parseFloat(e.target.value);
                syncInputs();
                recalculate();
            });
        }
        if (dom.interestRateInput) {
            dom.interestRateInput.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val >= 4 && val <= 25) {
                    state.interestRate = val;
                    syncInputs();
                    recalculate();
                }
            });
        }

        // 6. Tenure Listeners
        if (dom.tenureYearsSlider) {
            dom.tenureYearsSlider.addEventListener('input', (e) => {
                state.tenureYears = parseInt(e.target.value, 10);
                state.tenureMonths = state.tenureYears * 12;
                populateBulkMonthDropdown();
                syncInputs();
                recalculate();
            });
        }
        if (dom.tenureYearsInput) {
            dom.tenureYearsInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 10) {
                    state.tenureYears = val;
                    state.tenureMonths = state.tenureYears * 12;
                    populateBulkMonthDropdown();
                    syncInputs();
                    recalculate();
                }
            });
        }

        // 7. Quick Chips (Price, Tenure, Banks)
        dom.priceChips.forEach(chip => {
            chip.addEventListener('click', () => {
                dom.priceChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const price = parseInt(chip.getAttribute('data-price'), 10);
                state.vehiclePrice = price;
                state.downPayment = Math.round(state.vehiclePrice * (state.downPaymentPct / 100));
                syncInputs();
                recalculate();
            });
        });

        dom.tenureChips.forEach(chip => {
            chip.addEventListener('click', () => {
                dom.tenureChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                state.tenureYears = parseInt(chip.getAttribute('data-years'), 10);
                state.tenureMonths = state.tenureYears * 12;
                populateBulkMonthDropdown();
                syncInputs();
                recalculate();
            });
        });

        dom.bankChips.forEach(chip => {
            chip.addEventListener('click', () => {
                dom.bankChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                state.interestRate = parseFloat(chip.getAttribute('data-rate'));
                syncInputs();
                recalculate();
            });
        });

        // 8. Mode Switcher Tabs
        if (dom.tabStandard && dom.tabPrepayment) {
            dom.tabStandard.addEventListener('click', () => {
                state.prepaymentActive = false;
                dom.tabStandard.classList.add('active');
                dom.tabPrepayment.classList.remove('active');
                if (dom.prepaymentPanel) dom.prepaymentPanel.style.display = 'none';
                if (dom.prepaymentToggleCard) dom.prepaymentToggleCard.style.display = 'block';
                if (dom.prepaymentToggleSwitch) dom.prepaymentToggleSwitch.checked = false;
                recalculate();
            });

            dom.tabPrepayment.addEventListener('click', () => {
                state.prepaymentActive = true;
                dom.tabPrepayment.classList.add('active');
                dom.tabStandard.classList.remove('active');
                if (dom.prepaymentPanel) dom.prepaymentPanel.style.display = 'block';
                if (dom.prepaymentToggleCard) dom.prepaymentToggleCard.style.display = 'block';
                if (dom.prepaymentToggleSwitch) dom.prepaymentToggleSwitch.checked = true;
                recalculate();
            });
        }

        if (dom.prepaymentToggleSwitch) {
            dom.prepaymentToggleSwitch.addEventListener('change', (e) => {
                state.prepaymentActive = e.target.checked;
                if (state.prepaymentActive) {
                    dom.tabPrepayment.classList.add('active');
                    dom.tabStandard.classList.remove('active');
                    if (dom.prepaymentPanel) dom.prepaymentPanel.style.display = 'block';
                } else {
                    dom.tabStandard.classList.add('active');
                    dom.tabPrepayment.classList.remove('active');
                    if (dom.prepaymentPanel) dom.prepaymentPanel.style.display = 'none';
                }
                recalculate();
            });
        }

        // 9. Prepayment Input Listeners
        if (dom.extraMonthlySlider) {
            dom.extraMonthlySlider.addEventListener('input', (e) => {
                state.extraMonthly = parseInt(e.target.value, 10);
                syncInputs();
                recalculate();
            });
        }
        if (dom.extraMonthlyInput) {
            dom.extraMonthlyInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 0) {
                    state.extraMonthly = val;
                    syncInputs();
                    recalculate();
                }
            });
        }

        if (dom.yearlyEmiToggle) {
            dom.yearlyEmiToggle.addEventListener('change', (e) => {
                state.extraYearlyEMI = e.target.checked;
                recalculate();
            });
        }

        if (dom.bulkAmountSlider) {
            dom.bulkAmountSlider.addEventListener('input', (e) => {
                state.bulkPrepayment = parseInt(e.target.value, 10);
                syncInputs();
                recalculate();
            });
        }
        if (dom.bulkAmountInput) {
            dom.bulkAmountInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 0) {
                    state.bulkPrepayment = val;
                    syncInputs();
                    recalculate();
                }
            });
        }

        if (dom.bulkMonthSelect) {
            dom.bulkMonthSelect.addEventListener('change', (e) => {
                state.bulkPrepaymentMonth = parseInt(e.target.value, 10);
                recalculate();
            });
        }

        // 10. Amortization Schedule View & CSV
        dom.scheduleViewToggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                dom.scheduleViewToggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.scheduleView = btn.getAttribute('data-view');
                if (state.lastSimulationResult) {
                    renderSchedule(state.lastSimulationResult);
                }
            });
        });

        if (dom.btnToggleSchedule && dom.scheduleContainer) {
            dom.btnToggleSchedule.addEventListener('click', () => {
                const isHidden = dom.scheduleContainer.style.display === 'none';
                dom.scheduleContainer.style.display = isHidden ? 'block' : 'none';
                dom.btnToggleSchedule.querySelector('span').textContent = isHidden 
                    ? 'Hide Amortization Schedule' 
                    : 'View Full Amortization Schedule';
                const icon = dom.btnToggleSchedule.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', isHidden ? 'chevron-up' : 'chevron-down');
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            });
        }

        if (dom.btnDownloadCsv) {
            dom.btnDownloadCsv.addEventListener('click', () => {
                if (state.lastSimulationResult) {
                    exportScheduleCSV(state.lastSimulationResult);
                }
            });
        }

        if (dom.btnPrintSummary) {
            dom.btnPrintSummary.addEventListener('click', () => {
                window.print();
            });
        }

        // 11. Mobile Sticky Button
        if (dom.btnMobileViewResults) {
            dom.btnMobileViewResults.addEventListener('click', () => {
                const resCard = document.getElementById('emi-results-column');
                if (resCard) {
                    resCard.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Mobile Sticky Bar scroll reveal
        window.addEventListener('scroll', () => {
            if (!dom.mobileStickyBar) return;
            const toolCard = document.querySelector('.emi-tool-card');
            if (toolCard) {
                const rect = toolCard.getBoundingClientRect();
                // Show sticky bar once user scrolls past top of tool on mobile
                if (window.innerWidth <= 768 && rect.top < 0 && rect.bottom > 200) {
                    dom.mobileStickyBar.classList.add('visible');
                } else {
                    dom.mobileStickyBar.classList.remove('visible');
                }
            }
        });
    }

    // Initialize Tool
    function init() {
        cacheDOM();
        populateBulkMonthDropdown();
        syncInputs();
        attachEventListeners();
        recalculate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
