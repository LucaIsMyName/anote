import { ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";

const StickyNav = ({ pageTitle }: any) => {
  const [show, setShow] = useState(false); // Initialize as false
  const [lastScrollY, setLastScrollY] = useState(0);

  // Initial setup effect
  useEffect(() => {
    // Set initial state based on scroll position
    if (window.scrollY < 200) {
      setShow(false);
    }
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      
      // Don't show nav when near top of page (within 200px)
      if (currentScrollY < 200) {
        setShow(false);
        setLastScrollY(currentScrollY);
        return;
      }

      // Show when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY) {
        setShow(true);
      } else {
        setShow(false);
      }

      setLastScrollY(currentScrollY);
    };

    // Add scroll event listener
    window.addEventListener("scroll", controlNavbar);

    // Cleanup
    return () => {
      window.removeEventListener("scroll", controlNavbar);
    };
  }, [lastScrollY]);

  return (
    <nav
      className={`z-50 fixed top-0 right-0 pt-2 px-2 left-[calc(60px)] 
      md:left-[calc(60px)]
      backdrop-blur-sm bg-white/80
      transition-transform duration-300
      ${show ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="py-2 px-3 rounded-lg border-2 border-gray-200 bg-white/90">
        <div className="flex gap-3 justify-between">
          <p className="text-lg italic font-bold">{pageTitle}</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <ChevronUp />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default StickyNav;