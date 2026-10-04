// Initialize Lucide Icons
function initApp() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Check existing Google Verification status for personalized UI
    checkExistingVerification();
    setupHeaderAuthListeners();
    
    // Sticky Header Scroll Logic
    const header = document.getElementById("header");
    let headerScrollTick = false;
    window.addEventListener("scroll", () => {
        if (!headerScrollTick) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 50) {
                    header.classList.add("scrolled");
                } else {
                    header.classList.remove("scrolled");
                }
                headerScrollTick = false;
            });
            headerScrollTick = true;
        }
    });

    // Mobile Navigation Drawer Logic
    const mobileToggle = document.getElementById("mobile-nav-toggle");
    const navMenu = document.getElementById("nav-menu");
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener("click", () => {
            navMenu.classList.toggle("active");
            const icon = mobileToggle.querySelector("i");
            if (icon) {
                if (navMenu.classList.contains("active")) {
                    icon.setAttribute("data-lucide", "x");
                } else {
                    icon.setAttribute("data-lucide", "menu");
                }
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        });

        // Close mobile nav drawer when clicking any link
        const navLinks = document.querySelectorAll(".nav-link");
        navLinks.forEach(link => {
            link.addEventListener("click", () => {
                if (navMenu.classList.contains("active")) {
                    navMenu.classList.remove("active");
                    const icon = mobileToggle.querySelector("i");
                    if (icon) {
                        icon.setAttribute("data-lucide", "menu");
                        if (typeof lucide !== 'undefined') {
                            lucide.createIcons();
                        }
                    }
                }
            });
        });
    }

    // ==========================================
    // Interactive Pricing Estimator & Calculator
    // ==========================================
    
    // Pricing Matrix [service][vehicleCategory]
    const priceMatrix = {
        'pdi': {
            'hatchback': 999,
            'sedan': 1499,
            'suv': 1999,
            'ev': 2999,
            'luxury': 4999
        },
        'used-inspection': {
            'hatchback': 1499,
            'sedan': 1999,
            'suv': 2499,
            'ev': 2999,
            'luxury': 5999
        },
        'buying-assistance': {
            'hatchback': 999,
            'sedan': 1499,
            'suv': 1699,
            'ev': 1499,
            'luxury': 2499
        },
        'consultation': {
            'hatchback': 999,
            'sedan': 999,
            'suv': 999,
            'ev': 1999,
            'luxury': 1499
        }
    };

    // Metadata & Dynamic Inclusions
    const serviceInclusions = {
        'pdi': {
            name: "New Car Pre-Delivery Inspection",
            duration: "Approx 1.5 Hours",
            delivery: "Within 3 Hours",
            inclusions: [
                "Full exterior paint depth inspection (accident check)",
                "Panel alignment & cosmetic blemishes inspection",
                "Internal electrical and dashboard checks",
                "Engine bay visual scan & fluid levels analysis",
                "Odometer verification & tyre check",
                "Official pre-delivery check status report"
            ]
        },
        'used-inspection': {
            name: "Used Car Inspection (300+ Points)",
            duration: "Approx 2 Hours",
            delivery: "Within 3 Hours",
            inclusions: [
                "300+ Point mechanical and system inspection",
                "Structural welds & accident repair checks",
                "Sub-frame suspension & engine mounts checks",
                "Comprehensive road test performance log",
                "Interior diagnostics and battery load tests",
                "High-resolution digital report with photos"
            ]
        },
        'buying-assistance': {
            name: "Buying & Negotiation Assistance",
            duration: "End-to-End Support",
            delivery: "Instant Updates",
            inclusions: [
                "Fair valuation advisory",
                "Verification of registration and insurance papers",
                "RTO ownership transfer paperwork vetting",
                "Dealer/seller negotiation assistance",
                "Final settlement checklist oversight"
            ]
        },
        'consultation': {
            name: "Personal Automotive Consultation",
            duration: "1 Hour Session",
            delivery: "Immediate",
            inclusions: [
                "Budget and daily running cost analysis",
                "EV vs Petrol vs Diesel vs Hybrid comparison",
                "Detailed review of 3 short-listed car models",
                "Maintenance expense calculations",
                "Unbiased recommendations based on your needs"
            ]
        }
    };

    // Selector Nodes
    const vehicleButtons = document.querySelectorAll("#vehicle-options button");
    const serviceButtons = document.querySelectorAll("#service-options button");
    
    // Output Nodes
    const displayPlanName = document.getElementById("display-plan-name");
    const displayVehicleType = document.getElementById("display-vehicle-type");
    const displayPrice = document.getElementById("display-price");
    const displayInclusions = document.getElementById("display-inclusions");
    const displayDuration = document.getElementById("display-duration");
    const displayDelivery = document.getElementById("display-delivery");

    let currentVehicle = 'hatchback';
    let currentService = 'pdi';

    const vehicleDurations = {
        'hatchback': '1.5 Hours',
        'sedan': '2 Hours',
        'suv': '2.5 Hours',
        'ev': '2 Hours',
        'luxury': 'Custom Duration'
    };

    function updateCalculator() {
        if (!displayPlanName || !displayVehicleType || !displayPrice || !displayInclusions || !displayDuration || !displayDelivery) {
            return;
        }
        const price = priceMatrix[currentService][currentVehicle];
        const data = serviceInclusions[currentService];
        
        // Update texts
        displayPlanName.textContent = data.name;
        if (currentVehicle === 'ev') {
            displayVehicleType.textContent = "EV Category";
        } else {
            displayVehicleType.textContent = `${currentVehicle.charAt(0).toUpperCase() + currentVehicle.slice(1)} Category`;
        }
        
        // Animate price change
        animateValue(displayPrice, parseInt(displayPrice.textContent.replace(/,/g, '')), price, 400);
        
        displayDuration.textContent = vehicleDurations[currentVehicle];
        displayDelivery.textContent = data.delivery;

        // Dynamic Button Text based on service type
        const ctaBtn = document.getElementById("calc-cta-btn");
        if (ctaBtn) {
            if (currentService === 'buying-assistance' || currentService === 'consultation') {
                ctaBtn.textContent = 'Book This Service';
            } else {
                ctaBtn.textContent = 'Book This Inspection';
            }
        }

        // Update Inclusions list
        displayInclusions.innerHTML = '';
        data.inclusions.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `<i data-lucide="check" class="inc-icon"></i> ${item}`;
            displayInclusions.appendChild(li);
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Smooth counter animation
    function animateValue(obj, start, end, duration) {
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString('en-IN');
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end.toLocaleString('en-IN');
            }
        };
        window.requestAnimationFrame(step);
    }

    // Button event listeners
    vehicleButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            vehicleButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentVehicle = btn.getAttribute("data-vehicle");
            updateCalculator();
        });
    });

    serviceButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            serviceButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentService = btn.getAttribute("data-service");
            updateCalculator();
        });
    });

    // Connect Calculator CTA Button to Form pre-fill
    const calcCta = document.getElementById("calc-cta-btn");
    const formServiceSelect = document.getElementById("form-service");
    const formVehicleSelect = document.getElementById("form-vehicle-type");

    // Dynamic Price Calculation for Booking Request Form
    const bookingFormService = document.getElementById("form-service");
    const bookingFormVehicle = document.getElementById("form-vehicle-type");
    const bookingPriceAmount = document.getElementById("booking-price-amount");
    const bookingPriceSubtext = document.getElementById("booking-price-subtext");
    const bookingPriceTag = document.getElementById("booking-price-tag");

    const vehicleCategoryNames = {
        'hatchback': 'Hatchback',
        'sedan': 'Sedan',
        'suv': 'SUV / MUV',
        'ev': 'Electric Vehicle (EV)',
        'luxury': 'Luxury'
    };

    const serviceShortNames = {
        'pdi': 'New Car PDI',
        'used-inspection': 'Used Car Inspection',
        'buying-assistance': 'Buying Assistance',
        'consultation': 'Consultation'
    };

    function updateBookingFormPrice() {
        if (!bookingFormService || !bookingFormVehicle || !bookingPriceAmount) return;

        let serviceVal = bookingFormService.value || 'pdi';
        let vehicleVal = bookingFormVehicle.value || 'hatchback';

        if (priceMatrix[serviceVal] && priceMatrix[serviceVal][vehicleVal] !== undefined) {
            const price = priceMatrix[serviceVal][vehicleVal];
            const formattedPrice = price.toLocaleString('en-IN');
            
            bookingPriceAmount.textContent = formattedPrice;
            
            const sName = serviceShortNames[serviceVal] || 'Inspection';
            const vName = vehicleCategoryNames[vehicleVal] || 'Vehicle';
            
            if (bookingPriceSubtext) {
                bookingPriceSubtext.textContent = `${sName} • ${vName}`;
            }

            if (bookingPriceTag) {
                bookingPriceTag.classList.add("pulse");
                setTimeout(() => {
                    bookingPriceTag.classList.remove("pulse");
                }, 250);
            }
        }
    }

    if (bookingFormService && bookingFormVehicle) {
        bookingFormService.addEventListener("change", updateBookingFormPrice);
        bookingFormVehicle.addEventListener("change", updateBookingFormPrice);
        updateBookingFormPrice();
    }

    if (calcCta && formServiceSelect && formVehicleSelect) {
        calcCta.addEventListener("click", () => {
            formServiceSelect.value = currentService;
            formVehicleSelect.value = currentVehicle;
            updateBookingFormPrice();
        });
    }

    // Initialize Calculator display
    if (displayPlanName && displayVehicleType && displayPrice && displayInclusions && displayDuration && displayDelivery) {
        updateCalculator();
    }

    // ==========================================
    // FAQ Accordion Toggle Actions
    // ==========================================
    const faqItems = document.querySelectorAll(".faq-item");
    
    faqItems.forEach(item => {
        const questionBtn = item.querySelector(".faq-question");
        const answer = item.querySelector(".faq-answer");
        
        questionBtn.addEventListener("click", () => {
            const isActive = item.classList.contains("active");
            
            // Close all items
            faqItems.forEach(i => {
                i.classList.remove("active");
                i.querySelector(".faq-answer").style.maxHeight = null;
            });
            
            // If item wasn't active, open it
            if (!isActive) {
                item.classList.add("active");
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // ==========================================
    // Booking Form Submission & Validation
    // ==========================================
    const bookingForm = document.getElementById("booking-form");
    const successOverlay = document.getElementById("form-success-overlay");
    const successCloseBtn = document.getElementById("success-close-btn");
    
    // Success Dialog DOM Elements
    const successUserName = document.getElementById("success-user-name");
    const successServiceName = document.getElementById("success-service-name");
    const successDate = document.getElementById("success-date");
    const successUserPhone = document.getElementById("success-user-phone");

    if (bookingForm) {
        // Pre-fill date picker to tomorrow by default
        const formDate = document.getElementById("form-date");
        let tomorrowStr = '';
        if (formDate) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrowStr = tomorrow.toISOString().split('T')[0];
            formDate.min = tomorrowStr;
            formDate.value = tomorrowStr;
        }

        bookingForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const nameInput = document.getElementById("form-name");
            const phoneInput = document.getElementById("form-phone");
            const serviceSelect = document.getElementById("form-service");
            const dateInput = document.getElementById("form-date");
            
            let isValid = true;
            
            // Reset previous validation styles
            document.querySelectorAll(".form-group").forEach(group => {
                group.classList.remove("invalid");
            });

            // Validate Name
            if (nameInput && nameInput.value.trim() === "") {
                nameInput.closest(".form-group").classList.add("invalid");
                isValid = false;
            }

            // Validate Phone (10 digits)
            const phonePattern = /^[0-9]{10}$/;
            if (phoneInput && !phonePattern.test(phoneInput.value.replace(/\s+/g, ''))) {
                phoneInput.closest(".form-group").classList.add("invalid");
                isValid = false;
            }

            // Validate Service Select
            if (serviceSelect && serviceSelect.value === "") {
                serviceSelect.closest(".form-group").classList.add("invalid");
                isValid = false;
            }

            // Validate Date
            if (dateInput && dateInput.value === "") {
                dateInput.closest(".form-group").classList.add("invalid");
                isValid = false;
            }

            if (isValid && nameInput && phoneInput && serviceSelect && dateInput) {
                // Get selected options and input elements
                const selectedServiceText = serviceSelect.options[serviceSelect.selectedIndex].text;
                const vehicleSelect = document.getElementById("form-vehicle-type");
                const selectedVehicleText = vehicleSelect ? vehicleSelect.options[vehicleSelect.selectedIndex].text : '';
                const carModelInput = document.getElementById("form-car-model");
                const messageInput = document.getElementById("form-message");
                
                // Format date nicely (e.g. DD-MM-YYYY)
                const dateVal = new Date(dateInput.value);
                const formattedDate = dateVal.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });

                // Construct WhatsApp Text Message
                const whatsappText = 
`*CARROBAAR_Drive - New Booking Inquiry*
----------------------------------------
👤 *Name:* ${nameInput.value.trim()}
📞 *Phone:* ${phoneInput.value.trim()}
🛠️ *Service:* ${selectedServiceText}
🚗 *Category:* ${selectedVehicleText}
🚘 *Model:* ${carModelInput ? carModelInput.value.trim() : 'Not specified'}
📅 *Date:* ${formattedDate}
📝 *Notes:* ${messageInput ? messageInput.value.trim() : 'None'}`;

                const encodedMsg = encodeURIComponent(whatsappText);
                const whatsappUrl = `https://wa.me/917498013236?text=${encodedMsg}`;

                // Trigger Twilio WhatsApp & SMS Notifications via local API Backend
                fetch("/api/bookings", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        fullName: nameInput.value.trim(),
                        phoneNumber: phoneInput.value.trim(),
                        requiredService: serviceSelect.value,
                        vehicleCategory: vehicleSelect ? vehicleSelect.value : 'hatchback',
                        carModel: carModelInput ? carModelInput.value.trim() : 'Not specified',
                        preferredDate: dateInput.value,
                        notes: messageInput ? messageInput.value.trim() : 'None'
                    })
                })
                .then(response => response.json())
                .then(data => console.log("Twilio API response:", data))
                .catch(err => console.error("Twilio API Error:", err));

                // Trigger Email Notification in background via FormSubmit.co API
                fetch("https://formsubmit.co/ajax/bhavya.rambhia@gmail.com", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        _subject: `New Booking Inquiry: ${nameInput.value.trim()} (${selectedServiceText})`,
                        Name: nameInput.value.trim(),
                        Phone: phoneInput.value.trim(),
                        Service: selectedServiceText,
                        Vehicle_Category: selectedVehicleText,
                        Car_Model: carModelInput ? carModelInput.value.trim() : 'Not specified',
                        Preferred_Date: formattedDate,
                        Message: messageInput ? messageInput.value.trim() : 'None'
                    })
                })
                .then(response => response.json())
                .then(data => console.log("Email Notification Sent:", data))
                .catch(err => console.error("Email API Error:", err));

                // Set Success Details in popup modal
                if (successUserName) successUserName.textContent = nameInput.value.trim();
                if (successServiceName) successServiceName.textContent = selectedServiceText;
                if (successDate) successDate.textContent = formattedDate;
                if (successUserPhone) successUserPhone.textContent = phoneInput.value;
                
                // Set loading state on button
                const submitBtn = document.getElementById("submit-btn");
                if (submitBtn) {
                    const originalBtnText = submitBtn.innerHTML;
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = `<i class="btn-spinner" data-lucide="loader-2"></i> <span>Verifying...</span>`;
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                    
                    // Simulate Technical Checkoff delay
                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnText;
                        if (typeof lucide !== 'undefined') {
                            lucide.createIcons();
                        }
                        
                        // Trigger Success Popup Anim
                        if (successOverlay) successOverlay.classList.add("active");
                        
                        // Prevent body scroll when success popup is open
                        document.body.style.overflow = "hidden";

                        // Open WhatsApp Link in a new tab after 1 second delay
                        setTimeout(() => {
                            window.open(whatsappUrl, "_blank");
                        }, 1000);
                    }, 1200);
                }
            }
        });

        // Close success overlay
        if (successCloseBtn) {
            successCloseBtn.addEventListener("click", () => {
                if (successOverlay) successOverlay.classList.remove("active");
                bookingForm.reset();
                document.body.style.overflow = "auto";
                
                // Re-fill date picker to tomorrow
                if (formDate) formDate.value = tomorrowStr;
            });
        }
    }

    // ==========================================
    // Conversion Enhancements & Animations
    // ==========================================

    // Site-wide Mouse Glow repositioning
    const mouseGlow = document.getElementById("mouse-glow");
    if (mouseGlow) {
        let mouseGlowTick = false;
        window.addEventListener("mousemove", (e) => {
            if (!mouseGlowTick) {
                window.requestAnimationFrame(() => {
                    // Offset by 250px because the glow is 500x500 to keep it centered on cursor
                    mouseGlow.style.transform = `translate3d(${e.clientX - 250}px, ${e.clientY - 250}px, 0)`;
                    mouseGlow.style.opacity = "1";
                    mouseGlowTick = false;
                });
                mouseGlowTick = true;
            }
        });
        window.addEventListener("mouseleave", () => {
            mouseGlow.style.opacity = "0";
        });
    }

    // Sequentially reveal trust badges on hero load
    const trustBadgesContainer = document.getElementById("hero-trust-badges");
    if (trustBadgesContainer) {
        // Trigger reveal shortly after page loads
        setTimeout(() => {
            trustBadgesContainer.classList.add("revealed");
        }, 300);
    }

    // Scroll reveal observers for defects cards, features, and scope lists
    const revealOnScrollElements = document.querySelectorAll(".defect-card, .feature-item, .scope-list li");
    if (revealOnScrollElements.length > 0 && typeof IntersectionObserver !== 'undefined') {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: "0px 0px -50px 0px"
        };
        const scrollObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("reveal-active");
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        revealOnScrollElements.forEach(el => {
            scrollObserver.observe(el);
        });
    }

    // Before-After Simulator Slider logic
    const sliderRange = document.getElementById("slider-range");
    const beforeImg = document.getElementById("slider-before-img");
    const sliderHandle = document.getElementById("slider-handle");
    const sliderWrapper = document.querySelector(".before-after-slider");
    
    if (sliderRange && beforeImg && sliderHandle && sliderWrapper) {
        const updateSliderInnerWidth = () => {
            const width = sliderWrapper.offsetWidth;
            const innerImg = beforeImg.querySelector("img");
            if (innerImg) {
                innerImg.style.width = `${width}px`;
            }
        };
        
        sliderRange.addEventListener("input", (e) => {
            const val = e.target.value;
            beforeImg.style.width = `${val}%`;
            sliderHandle.style.left = `${val}%`;
        });
        
        // Initial setup and window resize tracking
        updateSliderInnerWidth();
        window.addEventListener("resize", updateSliderInnerWidth);
    }

    // Process Timeline vertical/horizontal scroll line progress bar tracker
    const timeline = document.querySelector(".process-timeline");
    const progressBar = document.querySelector(".process-timeline-progress-bar");
    const timelineSteps = document.querySelectorAll(".process-step");
    
    if (timeline && progressBar && timelineSteps.length > 0) {
        let timelineScrollTick = false;
        const handleTimelineScroll = () => {
            const rect = timeline.getBoundingClientRect();
            const viewHeight = window.innerHeight;
            
            // Start scrolling progress when timeline top crosses 80% of screen height
            const start = viewHeight * 0.8;
            // Finish when bottom of timeline crosses 20% of screen height
            const end = viewHeight * 0.2;
            
            const totalDist = rect.height + start - end;
            const currentDist = start - rect.top;
            
            let progress = currentDist / totalDist;
            progress = Math.max(0, Math.min(1, progress));
            
            progressBar.style.width = `${progress * 100}%`;
            
            // Sequentially highlight the step badges
            const stepCount = timelineSteps.length;
            timelineSteps.forEach((step, idx) => {
                const triggerPoint = (idx + 0.5) / stepCount;
                if (progress >= triggerPoint) {
                    step.classList.add("active");
                } else {
                    step.classList.remove("active");
                }
            });
        };
        
        window.addEventListener("scroll", () => {
            if (!timelineScrollTick) {
                window.requestAnimationFrame(() => {
                    handleTimelineScroll();
                    timelineScrollTick = false;
                });
                timelineScrollTick = true;
            }
        });
        window.addEventListener("resize", () => {
            if (!timelineScrollTick) {
                window.requestAnimationFrame(() => {
                    handleTimelineScroll();
                    timelineScrollTick = false;
                });
                timelineScrollTick = true;
            }
        });
        // Call once initially
        handleTimelineScroll();
    }

    // Founder stats counter animation observer
    const founderSection = document.querySelector(".founder-section");
    const statNumbers = document.querySelectorAll(".founder-stat-num");
    let founderCountStarted = false;
    
    if (founderSection && statNumbers.length > 0 && typeof IntersectionObserver !== 'undefined') {
        const founderObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !founderCountStarted) {
                    founderCountStarted = true;
                    statNumbers.forEach(num => {
                        const target = parseInt(num.getAttribute("data-target"), 10);
                        animateValue(num, 0, target, 1500);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        founderObserver.observe(founderSection);
    }

    // 3D Tilt mouse effect on CAYA Gallery cards
    const galleryCards = document.querySelectorAll(".gallery-card-box");
    galleryCards.forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Normalize values between -0.5 and 0.5
            const normalizeX = (x / rect.width) - 0.5;
            const normalizeY = (y / rect.height) - 0.5;
            
            // Rotate max 10 degrees
            const rotateY = normalizeX * 12; 
            const rotateX = -normalizeY * 12; 
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });
        
        card.addEventListener("mouseleave", () => {
            card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)";
        });
    });

    // Floating WhatsApp expansion and collapse sequence
    const whatsappBtn = document.getElementById("whatsapp-floating-btn");
    if (whatsappBtn) {
        setTimeout(() => {
            whatsappBtn.classList.add("expanded");
            // Collapse after 6 seconds
            setTimeout(() => {
                whatsappBtn.classList.remove("expanded");
            }, 6000);
        }, 15000);
    }

    // ==========================================
    // Interactive PDI Spotter Click Handlers
    // ==========================================
    const hotspots = document.querySelectorAll(".spotter-hotspot");
    const spotterArea = document.getElementById("spotter-area");
    const spotterIssue = document.getElementById("spotter-issue");
    const spotterTool = document.getElementById("spotter-tool");
    const spotterCost = document.getElementById("spotter-cost");
    const spotterDesc = document.getElementById("spotter-desc");
    const spotterImg = document.getElementById("spotter-img");

    if (hotspots.length > 0) {
        hotspots.forEach(hotspot => {
            hotspot.addEventListener("click", () => {
                // Remove active class from all
                hotspots.forEach(h => h.classList.remove("active"));
                
                // Add active to current
                hotspot.classList.add("active");
                
                // Get data attributes
                const area = hotspot.getAttribute("data-area");
                const issue = hotspot.getAttribute("data-issue");
                const tool = hotspot.getAttribute("data-tool");
                const cost = hotspot.getAttribute("data-cost");
                const img = hotspot.getAttribute("data-img");
                const desc = hotspot.getAttribute("data-desc");
                
                // Update dashboard with fade effect
                if (spotterArea) spotterArea.textContent = area;
                if (spotterIssue) spotterIssue.textContent = issue;
                if (spotterTool) spotterTool.textContent = tool;
                if (spotterCost) spotterCost.textContent = cost;
                if (spotterDesc) spotterDesc.textContent = desc;
                
                if (spotterImg) {
                    spotterImg.style.opacity = "0.3";
                    setTimeout(() => {
                        spotterImg.src = img;
                        spotterImg.style.opacity = "0.85";
                    }, 150);
                }
            });
        });
    }

    // ==========================================
    // Paint Coating Thickness Gauge Scanner Simulator
    // ==========================================
    const paintSlider = document.getElementById("paint-slider");
    const paintLaser = document.getElementById("paint-laser");
    const paintProbe = document.getElementById("paint-probe");
    const lcdScreen = document.getElementById("lcd-screen");
    const lcdMicron = document.getElementById("lcd-micron");
    const lcdStatusBox = document.getElementById("lcd-status-box");
    const lcdStatusBadge = document.getElementById("lcd-status-badge");
    const lcdStatusMsg = document.getElementById("lcd-status-msg");
    const scanAlertBox = document.getElementById("scan-alert-box");
    const calloutAlertTitle = document.getElementById("callout-alert-title");
    const calloutAlertDesc = document.getElementById("callout-alert-desc");
    const calloutAlertIcon = document.getElementById("callout-alert-icon");

    // Legends
    const legendFactory = document.getElementById("legend-factory");
    const legendRepaint = document.getElementById("legend-repaint");

    if (paintSlider && paintLaser && paintProbe) {
        const updateScanner = () => {
            const val = parseInt(paintSlider.value, 10);
            
            // Move laser and probe line
            paintLaser.style.left = `${val}%`;
            paintProbe.style.left = `${val}%`;
            
            // Calculate simulated paint thickness depth in microns (µm)
            let thickness = 100;
            
            if (val >= 0 && val < 40) {
                // Factory Paint Front Fender/Hood area (95 - 115 um)
                thickness = Math.floor(98 + (val % 5) * 3 - (val % 3));
            } else if (val >= 40 && val < 45) {
                // Transition Zone (115 to 250 um)
                const ratio = (val - 40) / 5;
                thickness = Math.floor(110 + ratio * 140);
            } else if (val >= 45 && val < 75) {
                // Driver/Rear Doors Repaint Zone (240 to 285 um)
                const baseVal = 250;
                thickness = Math.floor(baseVal + ((val * 7) % 25) + ((val * 3) % 11));
            } else if (val >= 75 && val < 80) {
                // Transition Zone back (250 to 110 um)
                const ratio = (val - 75) / 5;
                thickness = Math.floor(250 - ratio * 140);
            } else {
                // Factory Paint Rear Quarter/Boot (95 - 110 um)
                thickness = Math.floor(96 + ((val * 11) % 15));
            }
            
            // Update number readout
            lcdMicron.textContent = thickness;
            
            // Update state visual alerts based on readings
            if (thickness > 180) {
                // Repaint detected
                lcdScreen.classList.add("warning-state");
                lcdStatusBadge.textContent = "REPAINT ALERT";
                lcdStatusBadge.className = "lcd-status-badge red-badge";
                lcdStatusMsg.textContent = "Non-factory paint coating / filler detected";
                
                if (legendRepaint) legendRepaint.classList.add("active-row");
                if (legendFactory) legendFactory.classList.remove("active-row");
                
                if (scanAlertBox) scanAlertBox.classList.add("warning-state");
                if (calloutAlertTitle) calloutAlertTitle.textContent = "CRITICAL ALERT: Repaint Detected";
                if (calloutAlertDesc) calloutAlertDesc.textContent = `Micron reading at ${thickness} µm is double the normal specification. Left Driver-side panel has been resprayed with body filler, likely from transit or yard damage.`;
                if (calloutAlertIcon) {
                    calloutAlertIcon.setAttribute("data-lucide", "alert-octagon");
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            } else {
                // Factory OK
                lcdScreen.classList.remove("warning-state");
                lcdStatusBadge.textContent = "FACTORY OK";
                lcdStatusBadge.className = "lcd-status-badge green-badge";
                lcdStatusMsg.textContent = "Paint layer thickness is within normal OEM specs";
                
                if (legendFactory) legendFactory.classList.add("active-row");
                if (legendRepaint) legendRepaint.classList.remove("active-row");
                
                if (scanAlertBox) scanAlertBox.classList.remove("warning-state");
                if (calloutAlertTitle) calloutAlertTitle.textContent = "Factory Finish Spec";
                if (calloutAlertDesc) calloutAlertDesc.textContent = `Coating reading of ${thickness} µm is standard factory uniform paint thickness. No signs of repair or panel replacement found.`;
                if (calloutAlertIcon) {
                    calloutAlertIcon.setAttribute("data-lucide", "check-circle");
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            }
        };
        
        paintSlider.addEventListener("input", updateScanner);
        paintSlider.addEventListener("change", updateScanner);
        
        // Initial trigger
        updateScanner();
    }

    // ==========================================
    // Floating Quick Navigation Menu Toggle
    // ==========================================
    const qNavTrigger = document.getElementById("quick-nav-trigger");
    const qNavOverlay = document.getElementById("quick-nav-overlay");
    const qNavClose = document.getElementById("quick-nav-close");

    if (qNavTrigger && qNavOverlay && qNavClose) {
        qNavTrigger.addEventListener("click", () => {
            qNavOverlay.classList.add("active");
        });

        const closeOverlay = () => {
            qNavOverlay.classList.remove("active");
        };

        qNavClose.addEventListener("click", closeOverlay);

        qNavOverlay.addEventListener("click", (e) => {
            if (e.target === qNavOverlay) {
                closeOverlay();
            }
        });

        const qNavItems = qNavOverlay.querySelectorAll(".quick-nav-item");
        qNavItems.forEach(item => {
            item.addEventListener("click", closeOverlay);
        });
    }

    // Hide preview switcher bar & floating ribbon inside iframe viewports
    if (window.self !== window.top) {
        document.documentElement.classList.add("in-iframe");
        document.body.classList.add("in-iframe");
        const bar = document.getElementById("device-preview-bar");
        if (bar) bar.style.display = "none";
        const floatRibbon = document.getElementById("floating-beta-ribbon");
        if (floatRibbon) floatRibbon.style.display = "none";
        const headerBeta = document.getElementById("header-beta-tester");
        if (headerBeta) headerBeta.style.display = "none";
    }

    // ==========================================
    // Translucent Iframe Device Preview Switcher (Beta Testing)
    // ==========================================
    const deviceBar = document.getElementById("device-preview-bar");
    const toggleBtn = document.getElementById("device-preview-toggle");
    const statusText = document.getElementById("device-preview-status");
    const modeBtns = document.querySelectorAll(".preview-mode-btn");
    const mockupModal = document.getElementById("device-mockup-modal");
    const mockupBackdrop = document.getElementById("mockup-modal-backdrop");
    const previewIframe = document.getElementById("device-preview-iframe");

    if (modeBtns.length > 0) {
        if (toggleBtn && deviceBar) {
            toggleBtn.addEventListener("click", () => {
                deviceBar.classList.toggle("minimized");
            });
        }

        const closeMockupStage = () => {
            if (mockupModal) {
                mockupModal.classList.remove("active", "mode-mobile", "mode-tablet");
            }
            const floatRibbon = document.getElementById("floating-beta-ribbon");
            if (floatRibbon) {
                floatRibbon.classList.remove("visible");
            }
            modeBtns.forEach(b => {
                if (b.getAttribute("data-mode") === "laptop") {
                    b.classList.add("active");
                } else {
                    b.classList.remove("active");
                }
            });
            if (statusText) statusText.textContent = "Full Screen Desktop View (100%)";
            if (previewIframe) previewIframe.src = "about:blank";
        };

        if (mockupBackdrop) {
            mockupBackdrop.addEventListener("click", closeMockupStage);
        }

        modeBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const mode = btn.getAttribute("data-mode");

                // Sync active state across all preview-mode-btn elements sharing the same data-mode
                modeBtns.forEach(b => {
                    if (b.getAttribute("data-mode") === mode) {
                        b.classList.add("active");
                    } else {
                        b.classList.remove("active");
                    }
                });

                if (mode === "laptop") {
                    closeMockupStage();
                } else {
                    const floatRibbon = document.getElementById("floating-beta-ribbon");
                    if (floatRibbon) {
                        floatRibbon.classList.add("visible");
                    }
                    if (mockupModal) {
                        mockupModal.classList.add("active");
                        mockupModal.classList.remove("mode-mobile", "mode-tablet");
                        mockupModal.classList.add(`mode-${mode}`);
                    }

                    if (previewIframe) {
                        const targetUrl = window.location.href;
                        if (previewIframe.src !== targetUrl) {
                            previewIframe.src = targetUrl;
                        }
                    }

                    if (mode === "tablet") {
                        if (statusText) statusText.textContent = "iPad Tablet Mockup (768px Viewport)";
                    } else if (mode === "mobile") {
                        if (statusText) statusText.textContent = "iPhone Mobile Mockup (390px Viewport)";
                    }
                }
            });
        });
    }

    // ==========================================
    // Google Account Verification Modal for Sample Report Download
    // ==========================================
    function ensureLeadModalInDom() {
        let modal = document.getElementById("download-lead-modal");
        if (!modal) {
            const modalWrapper = document.createElement("div");
            modalWrapper.innerHTML = `
            <div class="lead-modal-overlay" id="download-lead-modal" aria-hidden="true">
                <div class="lead-modal-backdrop" id="lead-modal-backdrop"></div>
                <div class="lead-modal-dialog google-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
                    <button class="lead-modal-close" id="lead-modal-close" aria-label="Close modal">&times;</button>
                    
                    <div class="lead-modal-header text-center">
                        <div class="google-badge-pill">
                            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                            <span>CARROBAAR PDI Verification</span>
                        </div>
                        <h3 class="lead-modal-title" id="lead-modal-title">Sign In / Sign Up</h3>
                        <p class="lead-modal-subtitle" id="lead-modal-subtitle">Sign in or create a free account to unlock live 17-digit VIN decoding and download 300+ point sample PDI reports.</p>
                    </div>

                    <div class="lead-step-form active" id="lead-step-1">
                        <div class="google-signin-wrapper">
                            <div id="google-signin-btn-container" class="google-btn-flex-center"></div>
                            <button type="button" class="btn-google-oneclick" id="btn-google-oneclick" style="margin-top: 0.5rem;">
                                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                                <span>Continue via Google</span>
                            </button>
                            
                            <div class="google-or-divider" style="margin: 1.1rem 0;"><span>OR QUICK SIGN UP / SIGN IN</span></div>

                            <form id="direct-auth-form" style="text-align: left;">
                                <div style="margin-bottom: 0.65rem;">
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #1E1B4B; margin-bottom: 0.2rem;">Full Name *</label>
                                    <input type="text" id="auth-input-name" placeholder="Enter your full name" class="vin-input" style="height: 40px; font-size: 0.88rem; width: 100%; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 0 0.75rem;" required>
                                </div>
                                <div style="margin-bottom: 0.65rem;">
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #1E1B4B; margin-bottom: 0.2rem;">Email Address *</label>
                                    <input type="email" id="auth-input-email" placeholder="name@example.com" class="vin-input" style="height: 40px; font-size: 0.88rem; width: 100%; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 0 0.75rem;" required>
                                </div>
                                <div style="margin-bottom: 0.85rem;">
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #1E1B4B; margin-bottom: 0.2rem;">Mobile Phone Number</label>
                                    <input type="tel" id="auth-input-phone" placeholder="10-digit mobile number" class="vin-input" style="height: 40px; font-size: 0.88rem; width: 100%; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 0 0.75rem;" maxlength="10">
                                </div>
                                <button type="submit" class="btn btn-primary" id="btn-direct-auth-submit" style="width: 100%; height: 42px; font-size: 0.9rem; font-weight: 700; justify-content: center;">
                                    Sign In / Sign Up Free
                                </button>
                            </form>
                        </div>
                        <div class="lead-alert-box error" id="lead-step1-error" style="display: none; margin-top: 0.75rem;"></div>
                        <p class="google-privacy-text" style="margin-top: 0.75rem;">🔒 We respect your privacy. Your details are strictly used for report access and authentication.</p>
                    </div>

                    <div class="lead-step-form text-center" id="lead-step-3">
                        <div class="google-user-card" id="google-user-card" style="display: none;">
                            <img src="" alt="Google Profile Avatar" class="google-avatar-img" id="google-avatar-img" referrerpolicy="no-referrer">
                            <div class="google-user-details">
                                <h4 class="google-user-name" id="google-user-name">User Name</h4>
                                <span class="google-email-pill" id="google-email-pill">user@gmail.com</span>
                            </div>
                        </div>

                        <div class="success-checkmark-wrapper" style="margin-top: 1rem;">
                            <div class="checkmark-circle">
                                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="checkmark-icon"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                        </div>
                        <h4 class="success-title">Account Verified!</h4>
                        <p class="success-desc">Welcome <strong id="success-lead-name"></strong>. Your account is now active!</p>
                        <a href="assets/CARROBAAR_Drive_Sample_PDI_Report.pdf" download="CARROBAAR_Drive_Sample_PDI_Report.pdf" class="btn btn-secondary btn-sm" id="manual-pdf-download-link" style="margin-top: 1rem;">
                            <i data-lucide="download"></i> Download Sample PDI Report PDF
                        </a>
                    </div>
                </div>
            </div>`;
            document.body.appendChild(modalWrapper.firstElementChild);
            modal = document.getElementById("download-lead-modal");
        }

        // Attach backdrop & close listeners
        const backdrop = document.getElementById("lead-modal-backdrop");
        const closeBtn = document.getElementById("lead-modal-close");
        if (backdrop && !backdrop.dataset.bound) {
            backdrop.dataset.bound = "true";
            backdrop.addEventListener("click", closeLeadModal);
        }
        if (closeBtn && !closeBtn.dataset.bound) {
            closeBtn.dataset.bound = "true";
            closeBtn.addEventListener("click", closeLeadModal);
        }

        // Attach direct auth form submit handler
        const directAuthForm = document.getElementById("direct-auth-form");
        if (directAuthForm && !directAuthForm.dataset.bound) {
            directAuthForm.dataset.bound = "true";
            directAuthForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const nameInput = document.getElementById("auth-input-name");
                const emailInput = document.getElementById("auth-input-email");
                const phoneInput = document.getElementById("auth-input-phone");
                const submitBtn = document.getElementById("btn-direct-auth-submit");
                const step1Error = document.getElementById("lead-step1-error");

                if (!nameInput || !emailInput) return;
                const name = nameInput.value.trim();
                const email = emailInput.value.trim();
                const phone = phoneInput ? phoneInput.value.trim() : "";

                if (!name || !email) {
                    showError(step1Error, "Please enter your full name and email address.");
                    return;
                }

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = "Verifying Account...";
                }

                fetch("/api/auth/direct", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, phone })
                })
                .then(res => res.json())
                .then(data => {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = "Sign In / Sign Up Free";
                    }

                    if (data.success) {
                        onAuthSuccess(data);
                    } else {
                        showError(step1Error, data.message || "Authentication failed.");
                    }
                })
                .catch(err => {
                    if (submitBtn) submitBtn.disabled = false;
                    showError(step1Error, "Network error. Please try again.");
                });
            });
        }

        // Attach quick verify click listener (Google OAuth 2.0 Popup Flow)
        const btnOneclick = document.getElementById("btn-google-oneclick");
        if (btnOneclick && !btnOneclick.dataset.bound) {
            btnOneclick.dataset.bound = "true";
            btnOneclick.addEventListener("click", () => {
                const step1Error = document.getElementById("lead-step1-error");
                showError(step1Error, "");
                btnOneclick.disabled = true;
                const defaultIconHtml = `<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg><span>Continue via Google</span>`;
                btnOneclick.innerHTML = `<span>Connecting to Google...</span>`;

                const restoreBtn = () => {
                    btnOneclick.disabled = false;
                    btnOneclick.innerHTML = defaultIconHtml;
                };

                ensureGoogleSdkLoaded(() => {
                    if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
                        try {
                            const tokenClient = google.accounts.oauth2.initTokenClient({
                                client_id: "338996362181-r943fv7neouam7m3sae36uff79e8gd8s.apps.googleusercontent.com",
                                scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
                                callback: async (tokenResponse) => {
                                    if (tokenResponse && tokenResponse.access_token) {
                                        try {
                                            const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                                                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                                            });
                                            const gUser = await res.json();
                                            if (gUser && (gUser.email || gUser.sub)) {
                                                verifyGoogleLeadOnBackend({ gUser });
                                                restoreBtn();
                                                return;
                                            }
                                        } catch (err) {
                                            console.error("Error fetching Google profile:", err);
                                        }
                                    }
                                    restoreBtn();
                                    showError(step1Error, "Google login popup was closed or cancelled.");
                                },
                                error_callback: (err) => {
                                    console.error("Google Token Client error:", err);
                                    restoreBtn();
                                    showError(step1Error, "Could not open Google popup. Please check popup permissions or use Direct Sign In below.");
                                }
                            });
                            tokenClient.requestAccessToken();
                        } catch (err) {
                            console.error("OAuth init error:", err);
                            restoreBtn();
                            showError(step1Error, "Google authentication error. Please try Direct Sign In below.");
                        }
                    } else if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                        // Fallback to Google ID OneTap prompt if available
                        google.accounts.id.prompt((notification) => {
                            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                                restoreBtn();
                                showError(step1Error, "Please click the Google button or use Direct Sign In below.");
                            }
                        });
                    } else {
                        restoreBtn();
                        showError(step1Error, "Google Identity SDK is loading. Please try again in a moment or use Direct Sign In below.");
                    }
                });
            });
        }

        return modal;
    }

    let pendingDownloadOnAuth = false;
    let pendingDownloadUrl = "/download-sample-report";

    function openLeadModal(customTitle, customSubtitle, options = {}) {
        if (typeof options === "boolean") {
            pendingDownloadOnAuth = options;
        } else if (options && typeof options === "object") {
            pendingDownloadOnAuth = !!options.triggerDownload;
            if (options.downloadUrl) {
                pendingDownloadUrl = options.downloadUrl;
            }
        } else {
            pendingDownloadOnAuth = false;
        }

        const modal = ensureLeadModalInDom();
        if (modal) {
            const titleEl = document.getElementById("lead-modal-title");
            const subEl = document.getElementById("lead-modal-subtitle");
            if (titleEl) {
                titleEl.textContent = customTitle || "Sign In / Sign Up";
            }
            if (subEl) {
                subEl.textContent = customSubtitle || "Sign in or create a free account to unlock live 17-digit VIN decoding and full access.";
            }

            modal.classList.add("active");
            modal.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
            resetLeadModal();
            initGoogleSdkButton();
        }
    }

    function closeLeadModal() {
        const modal = document.getElementById("download-lead-modal");
        if (modal) {
            modal.classList.remove("active");
            modal.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "auto";
        }
    }

    function resetLeadModal() {
        const step1Form = document.getElementById("lead-step-1");
        const step3Form = document.getElementById("lead-step-3");
        const step1Error = document.getElementById("lead-step1-error");
        const googleUserCard = document.getElementById("google-user-card");

        if (step1Form) step1Form.classList.add("active");
        if (step3Form) step3Form.classList.remove("active");
        if (step1Error) step1Error.style.display = "none";
        if (googleUserCard) googleUserCard.style.display = "none";
    }

    // Check and apply existing verified user UI from LocalStorage
    function checkExistingVerification() {
        try {
            const isVerified = localStorage.getItem("carrobaar_google_verified") === "true";
            const userInfoStr = localStorage.getItem("carrobaar_user_info");
            if (isVerified && userInfoStr) {
                const userInfo = JSON.parse(userInfoStr);
                applyVerifiedUserUi(userInfo);
                return userInfo;
            } else {
                applyLoggedOutUi();
            }
        } catch (e) {
            console.warn("Error reading verification state:", e);
            applyLoggedOutUi();
        }
        return null;
    }

    function applyLoggedOutUi() {
        const headerUserBadge = document.getElementById("header-user-badge");
        const signinBtn = document.getElementById("header-signin-btn");
        if (headerUserBadge) headerUserBadge.style.display = "none";
        if (signinBtn) signinBtn.style.display = "inline-flex";
    }

    // Generate a sleek SVG Initials avatar URL as a foolproof fallback
    function getInitialsAvatar(name) {
        const initials = (name || "U")
            .split(" ")
            .map(n => n[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase() || "U";
        
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7E22CE"/><stop offset="100%" stop-color="#312E81"/></linearGradient></defs><circle cx="48" cy="48" r="48" fill="url(#grad)"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="38" font-weight="700">${initials}</text></svg>`;
        
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    // Safely apply avatar URL with referrerpolicy="no-referrer" to bypass Google referrer blocks & graceful error fallback
    function setAvatarSrc(imgElement, pictureUrl, userName) {
        if (!imgElement) return;
        imgElement.setAttribute("referrerpolicy", "no-referrer");
        imgElement.onerror = function() {
            this.onerror = null;
            this.src = getInitialsAvatar(userName);
        };
        
        if (pictureUrl && pictureUrl.trim()) {
            let cleanUrl = pictureUrl.trim();
            // Ensure Google photo requested with high-quality crop
            if (cleanUrl.includes("googleusercontent.com") && !cleanUrl.includes("=s")) {
                cleanUrl += "=s120-c";
            }
            imgElement.src = cleanUrl;
        } else {
            imgElement.src = getInitialsAvatar(userName);
        }
    }

    // Apply Verified User Personal Recognition UI across Navbar & CTAs
    function applyVerifiedUserUi(userInfo) {
        if (!userInfo) return;

        const headerUserBadge = document.getElementById("header-user-badge");
        const signinBtn = document.getElementById("header-signin-btn");
        const headerUserAvatar = document.getElementById("header-user-avatar");
        const headerUserName = document.getElementById("header-user-name");
        const headerMenuAvatar = document.getElementById("header-menu-avatar");
        const headerMenuFullname = document.getElementById("header-menu-fullname");

        if (headerUserBadge) {
            headerUserBadge.style.display = "inline-flex";
        }
        if (signinBtn) {
            signinBtn.style.display = "none";
        }

        const userName = userInfo.name || "Member";
        if (headerUserAvatar) setAvatarSrc(headerUserAvatar, userInfo.picture, userName);
        if (headerMenuAvatar) setAvatarSrc(headerMenuAvatar, userInfo.picture, userName);

        if (userInfo.name) {
            const firstName = userInfo.name.split(" ")[0] || userInfo.name;
            if (headerUserName) headerUserName.textContent = firstName;
            if (headerMenuFullname) headerMenuFullname.textContent = userInfo.name;
        }

        // Update all download buttons on page to indicate verified instant download state
        document.querySelectorAll(".btn-download-report, .btn-download, #download-report-btn, [data-action='download-report']").forEach(btn => {
            if (btn.id === "manual-pdf-download-link") return;
            const spanText = btn.querySelector("span");
            if (spanText) {
                spanText.textContent = "Download Sample PDF (Verified)";
            }
            btn.classList.add("btn-verified-download");
        });
    }

    // Setup Header Auth & Account Dropdown Listeners
    function setupHeaderAuthListeners() {
        const signinBtn = document.getElementById("header-signin-btn");
        const menuToggle = document.getElementById("header-user-menu-toggle");
        const menuDropdown = document.getElementById("header-user-menu-dropdown");
        const logoutBtn = document.getElementById("header-logout-btn");
        const headerUserBadge = document.getElementById("header-user-badge");

        if (signinBtn) {
            signinBtn.addEventListener("click", () => {
                openLeadModal(
                    "Sign In / Sign Up",
                    "Sign in or create a free account to unlock live 17-digit VIN decoding and full access.",
                    { triggerDownload: false }
                );
            });
        }

        if (menuToggle && menuDropdown) {
            menuToggle.addEventListener("click", (e) => {
                e.stopPropagation();
                const isOpen = menuDropdown.classList.contains("show");
                menuDropdown.classList.toggle("show", !isOpen);
                menuToggle.classList.toggle("active", !isOpen);
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                try {
                    localStorage.removeItem("carrobaar_google_verified");
                    localStorage.removeItem("carrobaar_user_info");
                } catch (err) {}

                if (menuDropdown) menuDropdown.classList.remove("show");
                if (menuToggle) menuToggle.classList.remove("active");
                applyLoggedOutUi();

                // Reset download button labels
                document.querySelectorAll(".btn-download-report, .btn-download, #download-report-btn, [data-action='download-report']").forEach(btn => {
                    if (btn.id === "manual-pdf-download-link") return;
                    const spanText = btn.querySelector("span");
                    if (spanText) {
                        spanText.textContent = "Download Sample PDF";
                    }
                    btn.classList.remove("btn-verified-download");
                });
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (menuDropdown && menuDropdown.classList.contains("show")) {
                if (!e.target.closest("#header-user-badge")) {
                    menuDropdown.classList.remove("show");
                    if (menuToggle) menuToggle.classList.remove("active");
                }
            }
        });

        // Developer / Beta Mode visibility check
        const urlParams = new URLSearchParams(window.location.search);
        const isDev = urlParams.has("dev") || urlParams.has("beta") || localStorage.getItem("carrobaar_dev_mode") === "true";
        const betaTester = document.getElementById("header-beta-tester");
        if (betaTester) {
            if (isDev) {
                betaTester.classList.add("dev-active");
            } else {
                betaTester.classList.remove("dev-active");
            }
        }
    }

    // Global Document Click Delegate for ALL Download triggers
    document.addEventListener("click", (e) => {
        const trigger = e.target.closest("a, button, .ribbon-card, [data-action='download-report']");
        if (!trigger) return;

        const text = (trigger.textContent || "").toLowerCase();
        const href = (trigger.getAttribute("href") || "").toLowerCase();
        const action = trigger.getAttribute("data-action");

        const isDownloadTrigger = 
            action === "download-report" ||
            trigger.classList.contains("btn-download-report") ||
            trigger.classList.contains("btn-download") ||
            trigger.classList.contains("btn-open-full-report") ||
            trigger.id === "download-report-btn" ||
            href.includes("inspx pro_pdi report.pdf") ||
            href.includes("carrobaar_drive_sample_pdi_report.pdf") ||
            href.includes("sample-pdi-report.html") ||
            text.includes("get sample pdf") ||
            text.includes("download pdf report") ||
            text.includes("download sample report") ||
            text.includes("sample report") ||
            text.includes("interactive report") ||
            text.includes("download pdf");

        if (isDownloadTrigger) {
            if (trigger.id === "manual-pdf-download-link") return;
            e.preventDefault();
            e.stopPropagation();

            const isVerified = localStorage.getItem("carrobaar_google_verified") === "true";
            if (isVerified) {
                // User already verified! No repeat prompt - download PDF instantly
                triggerInstantPdfDownload("/download-sample-report");
            } else {
                openLeadModal(
                    "Sign in to Download PDI Report",
                    "Quick verification with your account to get instant access to the official 300+ point sample report.",
                    { triggerDownload: true, downloadUrl: "/download-sample-report" }
                );
            }
        }
    });

    // Ensure Google Identity SDK is dynamically loaded across all pages
    function ensureGoogleSdkLoaded(callback) {
        if (typeof google !== 'undefined' && google.accounts) {
            if (callback) callback();
            return;
        }
        let script = document.getElementById("google-gsi-sdk");
        if (!script) {
            script = document.createElement("script");
            script.id = "google-gsi-sdk";
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }
        if (callback) {
            script.addEventListener("load", () => {
                setTimeout(callback, 100);
            }, { once: true });
            
            // Poll in case event already fired
            let attempts = 0;
            const checkInt = setInterval(() => {
                attempts++;
                if (typeof google !== 'undefined' && google.accounts) {
                    clearInterval(checkInt);
                    callback();
                } else if (attempts > 20) {
                    clearInterval(checkInt);
                }
            }, 150);
        }
    }

    // Initialize Google Identity SDK & Render Standard Google Button
    function initGoogleSdkButton() {
        ensureGoogleSdkLoaded(() => {
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                try {
                    google.accounts.id.initialize({
                        client_id: "338996362181-r943fv7neouam7m3sae36uff79e8gd8s.apps.googleusercontent.com",
                        callback: handleGoogleCredentialResponse,
                        auto_select: false,
                        use_fedcm_for_prompt: false
                    });

                    const container = document.getElementById("google-signin-btn-container");
                    if (container) {
                        container.innerHTML = '';
                        google.accounts.id.renderButton(container, {
                            theme: "filled_blue",
                            size: "large",
                            width: 320,
                            text: "continue_with",
                            shape: "rectangular"
                        });
                    }
                } catch (err) {
                    console.log("Google GIS init info:", err.message);
                }
            }
        });
    }

    // Handle Official Google Credential Callback
    function handleGoogleCredentialResponse(response) {
        if (!response || !response.credential) return;
        verifyGoogleLeadOnBackend({ credential: response.credential });
    }

    function onAuthSuccess(data) {
        const step1Form = document.getElementById("lead-step-1");
        const step3Form = document.getElementById("lead-step-3");
        const successNameEl = document.getElementById("success-lead-name");
        const googleUserName = document.getElementById("google-user-name");
        const googleEmailPill = document.getElementById("google-email-pill");
        const googleAvatarImg = document.getElementById("google-avatar-img");
        const googleUserCard = document.getElementById("google-user-card");
        const manualPdfLink = document.getElementById("manual-pdf-download-link");
        const successDesc = document.querySelector("#lead-step-3 .success-desc");

        if (step1Form) step1Form.classList.remove("active");
        if (step3Form) step3Form.classList.add("active");

        if (data.user) {
            if (successNameEl) successNameEl.textContent = data.user.name;
            if (googleUserName) googleUserName.textContent = data.user.name;
            if (googleEmailPill) googleEmailPill.textContent = data.user.email;
            if (googleAvatarImg) {
                setAvatarSrc(googleAvatarImg, data.user.picture, data.user.name);
            }
            if (googleUserCard) googleUserCard.style.display = "flex";
        }

        const downloadUrl = data.downloadUrl || pendingDownloadUrl || '/download-sample-report';
        if (manualPdfLink) manualPdfLink.href = downloadUrl;

        try {
            localStorage.setItem("carrobaar_google_verified", "true");
            if (data.user) {
                localStorage.setItem("carrobaar_user_info", JSON.stringify(data.user));
                applyVerifiedUserUi(data.user);
            }
        } catch (e) {}

        // Notify app components (e.g. VIN decoder) of auth state change
        window.dispatchEvent(new CustomEvent('carrobaar_auth_changed', { detail: data.user }));

        // ONLY auto-trigger download if user initiated sign in by pressing "Download Sample Report"
        if (pendingDownloadOnAuth) {
            if (successDesc) {
                successDesc.innerHTML = `Thank you <strong id="success-lead-name">${(data.user && data.user.name) || ''}</strong>. Your Sample PDI Report PDF download is starting automatically...`;
            }
            triggerInstantPdfDownload(downloadUrl);
            pendingDownloadOnAuth = false;
            setTimeout(() => {
                closeLeadModal();
            }, 2200);
        } else {
            if (successDesc) {
                successDesc.innerHTML = `Welcome <strong id="success-lead-name">${(data.user && data.user.name) || ''}</strong>! Your account is verified and full access is unlocked.`;
            }
            setTimeout(() => {
                closeLeadModal();
            }, 1600);
        }
    }

    function verifyGoogleLeadOnBackend(payload) {
        const btnOneclick = document.getElementById("btn-google-oneclick");
        const step1Error = document.getElementById("lead-step1-error");

        fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (btnOneclick) {
                btnOneclick.disabled = false;
                btnOneclick.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg><span>Continue via Google</span>`;
            }

            if (data.success) {
                onAuthSuccess(data);
            } else {
                showError(step1Error, data.message || "Google verification failed.");
            }
        })
        .catch(err => {
            console.error("Google Auth error:", err);
            if (btnOneclick) {
                btnOneclick.disabled = false;
            }
            showError(step1Error, "Network error during Google authentication. Please try again.");
        });
    }

    function triggerInstantPdfDownload(url) {
        const downloadEndpoint = url || '/download-sample-report';

        // 1. Direct location navigation (forces file attachment download without popup block)
        try {
            window.location.href = downloadEndpoint;
        } catch(e) {}

        // 2. Hidden iframe fallback
        let iframe = document.getElementById("auto-download-iframe");
        if (!iframe) {
            iframe = document.createElement("iframe");
            iframe.id = "auto-download-iframe";
            iframe.style.display = "none";
            document.body.appendChild(iframe);
        }
        iframe.src = downloadEndpoint;
    }

    function showError(el, msg) {
        if (!el) return;
        if (msg) {
            el.textContent = msg;
            el.style.display = "block";
        } else {
            el.textContent = "";
            el.style.display = "none";
        }
    }

    // Export modal functions to window for app-wide gatekeeping
    window.openLeadModal = openLeadModal;
    window.closeLeadModal = closeLeadModal;
    window.checkExistingVerification = checkExistingVerification;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
