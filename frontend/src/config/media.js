/**
 * HostelSync — Central Demonstration Media & Photography Registry
 * Institution: Government Polytechnic Sakoli
 * 
 * Images are imported directly via Vite for 100% reliable resolution in dev and production,
 * with local /images/* public paths and verified remote CDN fallbacks.
 */

import campusHeroImg from '../assets/images/campus-hero.jpg';
import boysHostelImg from '../assets/images/boys-hostel.jpg';
import girlsHostelImg from '../assets/images/girls-hostel.jpg';
import roomInteriorImg from '../assets/images/room-interior.jpg';
import commonStudyImg from '../assets/images/common-study.jpg';
import loginHeroImg from '../assets/images/login-hero.jpg';

export const MEDIA_REGISTRY = {
  campusHero: {
    key: 'campusHero',
    src: campusHeroImg,
    localSrc: campusHeroImg,
    publicPath: '/images/campus-hero.jpg',
    fallbackSrc: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    remoteFallback: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Government Polytechnic Sakoli academic campus lawns and collegiate building architecture',
    caption: 'Government Polytechnic Sakoli Campus Premises',
    credit: 'Photo by Vasily Kolotusha on Unsplash',
    aspectRatio: '16/9'
  },
  loginHero: {
    key: 'loginHero',
    src: loginHeroImg,
    localSrc: loginHeroImg,
    publicPath: '/images/login-hero.jpg',
    fallbackSrc: 'https://images.unsplash.com/photo-1525921429624-479b6a26d84d?auto=format&fit=crop&w=1200&q=80',
    remoteFallback: 'https://images.unsplash.com/photo-1525921429624-479b6a26d84d?auto=format&fit=crop&w=1200&q=80',
    alt: 'Academic courtyard with morning sunlight illuminating university campus buildings',
    caption: 'Smart Digital Governance — Government Polytechnic Sakoli',
    credit: 'Photo by Jonathan Kemper on Unsplash',
    aspectRatio: '4/5'
  },
  boysHostel: {
    key: 'boysHostel',
    src: boysHostelImg,
    localSrc: boysHostelImg,
    publicPath: '/images/boys-hostel.jpg',
    fallbackSrc: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    remoteFallback: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    alt: 'Multi-story modern institutional hostel residential block exterior with campus landscaping',
    caption: 'Sahyadri Boys Hostel — Residential Facility',
    credit: 'Photo by Austin Distel on Unsplash',
    aspectRatio: '16/10'
  },
  girlsHostel: {
    key: 'girlsHostel',
    src: girlsHostelImg,
    localSrc: girlsHostelImg,
    publicPath: '/images/girls-hostel.jpg',
    fallbackSrc: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80',
    remoteFallback: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80',
    alt: 'Collegiate residential block with manicured gardens and secure entrance gates',
    caption: 'Jijau Girls Hostel — Residential Facility',
    credit: 'Photo by Nick Fewings on Unsplash',
    aspectRatio: '16/10'
  },
  hostelExterior: {
    key: 'hostelExterior',
    src: boysHostelImg,
    localSrc: boysHostelImg,
    publicPath: '/images/boys-hostel.jpg',
    fallbackSrc: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    remoteFallback: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    alt: 'Campus hostel residence building exterior',
    caption: 'Campus Residential Block',
    credit: 'Photo by Austin Distel on Unsplash',
    aspectRatio: '16/10'
  },
  roomInterior: {
    key: 'roomInterior',
    src: roomInteriorImg,
    localSrc: roomInteriorImg,
    publicPath: '/images/room-interior.jpg',
    fallbackSrc: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
    remoteFallback: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
    alt: 'Clean, well-lit student dormitory accommodation with study desks and twin beds',
    caption: 'Resident Accommodation Room Unit',
    credit: 'Photo by Francesca Tosolini on Unsplash',
    aspectRatio: '16/10'
  },
  commonArea: {
    key: 'commonArea',
    src: commonStudyImg,
    localSrc: commonStudyImg,
    publicPath: '/images/common-study.jpg',
    fallbackSrc: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    remoteFallback: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    alt: 'Students studying and collaborating in modern university common study room',
    caption: 'Hostel Study & Reading Room',
    credit: 'Photo by Brooke Cagle on Unsplash',
    aspectRatio: '16/9'
  }
};

/**
 * Returns the primary media object for a given key.
 */
export function getMedia(key) {
  return MEDIA_REGISTRY[key] || MEDIA_REGISTRY.campusHero;
}

/**
 * Returns appropriate hostel image based on hostel name or type.
 */
export function getHostelImage(hostelName = '', hostelType = '') {
  const lowerName = String(hostelName || '').toLowerCase();
  const lowerType = String(hostelType || '').toLowerCase();
  if (lowerName.includes('girl') || lowerName.includes('jijau') || lowerType === 'girls') {
    return MEDIA_REGISTRY.girlsHostel;
  }
  return MEDIA_REGISTRY.boysHostel;
}

export default MEDIA_REGISTRY;
