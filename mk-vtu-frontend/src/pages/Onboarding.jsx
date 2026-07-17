import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Smartphone, Zap, Rocket, Package, Headset, MessageCircle } from "lucide-react";
import "./Onboarding.css";

const slides = [
  {
    id: 1,
    title: "Airtime Solution",
    description: "We provide a solution for purchasing airtime in Nigeria. Simply enter the desired amount you wish to purchase.",
    icon: (
      <div className="icon-3d-wrapper">
        <div className="icon-3d-layer layer-1"><Smartphone size={120} /></div>
        <div className="icon-3d-layer layer-2"><Zap size={60} /></div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Automated Delivery",
    description: "Our range of products, including MTN data, GOTV, Startimes, DSTV subscriptions, and electricity bills, are all handled automatically.",
    icon: (
      <div className="icon-3d-wrapper">
        <div className="icon-3d-layer layer-1"><Rocket size={120} /></div>
        <div className="icon-3d-layer layer-2"><Package size={60} /></div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Customer Support",
    description: "Experience top-notch support in the VTU industry. Resolve issues quickly via live chat.",
    icon: (
      <div className="icon-3d-wrapper">
        <div className="icon-3d-layer layer-1"><Headset size={120} /></div>
        <div className="icon-3d-layer layer-2"><MessageCircle size={60} /></div>
      </div>
    ),
  },
];

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const navigate = useNavigate();

  const minSwipeDistance = 50;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    localStorage.setItem("seenOnboarding", "true");
    navigate("/signup");
  };

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div 
      className="onboarding-container"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <button className="skip-btn" onClick={handleSkip}>
        Skip
      </button>

      <div className="slides-wrapper" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
        {slides.map((slide) => (
          <div key={slide.id} className="slide">
            <div className="slide-top">
              <div className="illustration-container">
                {slide.icon}
              </div>
            </div>
            <div className="slide-bottom">
              <div className="content">
                <h2>{slide.title}</h2>
                <p>{slide.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="onboarding-footer">
        <div className="pagination">
          {slides.map((_, index) => (
            <div 
              key={index} 
              className={`dot ${currentSlide === index ? "active" : ""}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>

        <button className="next-btn" onClick={handleNext}>
          {currentSlide === slides.length - 1 ? (
            <span className="get-started">Get Started</span>
          ) : (
            <ChevronRight size={24} />
          )}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
