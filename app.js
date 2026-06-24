// Initialize Lucide Icons
document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Sticky Header Scroll Logic
    const header = document.getElementById("header");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
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
            name: "Used Car Inspection (180+ Points)",
            duration: "Approx 2 Hours",
            delivery: "Within 3 Hours",
            inclusions: [
                "180+ Point mechanical and system inspection",
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
        if (currentService === 'buying-assistance' || currentService === 'consultation') {
            ctaBtn.textContent = 'Book This Service';
        } else {
            ctaBtn.textContent = 'Book This Inspection';
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

    calcCta.addEventListener("click", () => {
        formServiceSelect.value = currentService;
        formVehicleSelect.value = currentVehicle;
    });

    // Initialize Calculator display
    updateCalculator();

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

    // Pre-fill date picker to tomorrow by default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    document.getElementById("form-date").min = tomorrowStr;
    document.getElementById("form-date").value = tomorrowStr;

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
        if (nameInput.value.trim() === "") {
            nameInput.closest(".form-group").classList.add("invalid");
            isValid = false;
        }

        // Validate Phone (10 digits)
        const phonePattern = /^[0-9]{10}$/;
        if (!phonePattern.test(phoneInput.value.replace(/\s+/g, ''))) {
            phoneInput.closest(".form-group").classList.add("invalid");
            isValid = false;
        }

        // Validate Service Select
        if (serviceSelect.value === "") {
            serviceSelect.closest(".form-group").classList.add("invalid");
            isValid = false;
        }

        // Validate Date
        if (dateInput.value === "") {
            dateInput.closest(".form-group").classList.add("invalid");
            isValid = false;
        }

        if (isValid) {
            // Get selected options and input elements
            const selectedServiceText = serviceSelect.options[serviceSelect.selectedIndex].text;
            const vehicleSelect = document.getElementById("form-vehicle-type");
            const selectedVehicleText = vehicleSelect.options[vehicleSelect.selectedIndex].text;
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
🚘 *Model:* ${carModelInput.value.trim() || 'Not specified'}
📅 *Date:* ${formattedDate}
📝 *Notes:* ${messageInput.value.trim() || 'None'}`;

            const encodedMsg = encodeURIComponent(whatsappText);
            const whatsappUrl = `https://wa.me/917498013236?text=${encodedMsg}`;

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
                    Car_Model: carModelInput.value.trim() || 'Not specified',
                    Preferred_Date: formattedDate,
                    Message: messageInput.value.trim() || 'None'
                })
            })
            .then(response => response.json())
            .then(data => console.log("Email Notification Sent:", data))
            .catch(err => console.error("Email API Error:", err));

            // Set Success Details in popup modal
            successUserName.textContent = nameInput.value.trim();
            successServiceName.textContent = selectedServiceText;
            successDate.textContent = formattedDate;
            successUserPhone.textContent = phoneInput.value;
            
            // Set loading state on button
            const submitBtn = document.getElementById("submit-btn");
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
                successOverlay.classList.add("active");
                
                // Prevent body scroll when success popup is open
                document.body.style.overflow = "hidden";

                // Open WhatsApp Link in a new tab after 1 second delay
                setTimeout(() => {
                    window.open(whatsappUrl, "_blank");
                }, 1000);
            }, 1200);
        }
    });

    // Close success overlay
    successCloseBtn.addEventListener("click", () => {
        successOverlay.classList.remove("active");
        bookingForm.reset();
        document.body.style.overflow = "auto";
        
        // Re-fill date picker to tomorrow
        document.getElementById("form-date").value = tomorrowStr;
    });

    // ==========================================
    // Conversion Enhancements & Animations
    // ==========================================

    // Site-wide Mouse Glow repositioning
    const mouseGlow = document.getElementById("mouse-glow");
    if (mouseGlow) {
        window.addEventListener("mousemove", (e) => {
            mouseGlow.style.left = `${e.clientX}px`;
            mouseGlow.style.top = `${e.clientY}px`;
            mouseGlow.style.opacity = "1";
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
        window.addEventListener("scroll", handleTimelineScroll);
        window.addEventListener("resize", handleTimelineScroll);
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
});
