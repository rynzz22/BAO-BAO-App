import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'BAO BAO',
      tagline: 'Smart Community Transportation for Talibon',
      roles: {
        passenger: 'Passenger',
        driver: 'Driver',
        dispatcher: 'Dispatcher',
        admin: 'Admin',
      },
      channels: {
        APP: 'App Driver',
        SMS: 'SMS / Call',
        DISPATCHER: 'Terminal Dispatcher',
      },
      tracking: {
        LIVE_APP: '🟢 LIVE LOCATION',
        LAST_REPORTED: '🟡 LAST REPORTED',
        TERMINAL: '⚪ TERMINAL QUEUE',
        GPS_TRACKER: '🔵 GPS TRACKER',
        UNKNOWN: '⚪ UNKNOWN',
      },
      rides: {
        requestRide: 'Request a Ride',
        pickupLocation: 'Pickup Location',
        destinationLocation: 'Destination',
        passengers: 'Passengers',
        submitRequest: 'Confirm & Request Ride',
        cancelRide: 'Cancel Ride',
        lookingForDriver: 'Finding nearby drivers in Talibon...',
        driverAssigned: 'Driver assigned to your ride',
      },
      driver: {
        online: 'Online (Available)',
        offline: 'Offline',
        headingToPickup: 'Head to Pickup',
        arrivedAtPickup: 'Arrived at Pickup',
        startTrip: 'Start Trip (Boarded)',
        completeTrip: 'Complete Trip',
      },
    },
  },
  ceb: {
    translation: {
      appName: 'BAO BAO',
      tagline: 'Sakayan sa Komunidad alang sa Talibon',
      roles: {
        passenger: 'Pasahero',
        driver: 'Drayber',
        dispatcher: 'Dispatser',
        admin: 'Admin',
      },
      channels: {
        APP: 'Drayber sa App',
        SMS: 'SMS / Tawag',
        DISPATCHER: 'Dispatser sa Terminal',
      },
      tracking: {
        LIVE_APP: '🟢 LIVE NGA LOKASYON',
        LAST_REPORTED: '🟡 NAHIUNANG REPORT',
        TERMINAL: '⚪ LINYA SA TERMINAL',
        GPS_TRACKER: '🔵 GPS TRACKER',
        UNKNOWN: '⚪ DILI MASIGURO',
      },
      rides: {
        requestRide: 'Pag-book og Sakay',
        pickupLocation: 'Asa Kuhaon',
        destinationLocation: 'Padulngan',
        passengers: 'Gidaghanon sa Pasahero',
        submitRequest: 'Kumpirmaha ug Pag-book',
        cancelRide: 'Kanselahon ang Sakay',
        lookingForDriver: 'Nangita og drayber sa Talibon...',
        driverAssigned: 'Aduna nay drayber nga nadestino',
      },
      driver: {
        online: 'Online (Andam Mokuha)',
        offline: 'Offline',
        headingToPickup: 'Padulong sa Pasahero',
        arrivedAtPickup: 'Niabot na sa Pickup',
        startTrip: 'Nisakay na (Sugod Byahe)',
        completeTrip: 'Nahuman na ang Byahe',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
