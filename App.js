import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    query, 
    doc, 
    updateDoc, 
    increment,
    onSnapshot 
} from 'firebase/firestore';
import { 
    Home, 
    Info, 
    Users, 
    Waves, 
    BatteryLow, 
    BatteryMedium, 
    BatteryFull, 
    MapPin, 
    Globe, 
    Phone, 
    X, 
    Check 
} from 'lucide-react';

// --- CONFIGURATION AND SERVICE LOGIC ---

// Firebase Configuration & Context
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

export const COLLECTION_NAMES = {
    VENUES: 'venues',
};

const getPublicCollectionPath = (collectionName) => {
    return `artifacts/${appId}/public/data/${collectionName}`;
};

let dbInstance;
let authInstance;
let currentUserId = null; // Store the user ID globally for service functions

const initializeFirebase = () => {
    if (!dbInstance) {
        try {
            const app = initializeApp(firebaseConfig);
            dbInstance = getFirestore(app);
            authInstance = getAuth(app);
        } catch (error) {
            console.error("Firebase App initialization error:", error);
        }
    }
};

/**
 * Utility function to format Firestore Timestamps or Date objects into relative time strings.
 * @param {Date | firebase.firestore.Timestamp | null} dateInput 
 * @returns {string} Relative time string (e.g., "5 min ago", "Yesterday at 10:30 AM").
 */
const formatRelativeTime = (dateInput) => {
    if (!dateInput) return 'Never Reported';

    // Convert Firestore Timestamp to Date object if necessary
    const date = dateInput.toDate ? dateInput.toDate() : dateInput;

    if (!(date instanceof Date)) return 'Invalid Date';

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Less than 60 seconds (1 minute)
    if (seconds < 60) {
        return 'Just now';
    }
    // Less than 60 minutes
    if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes} min ago`;
    }
    // Less than 24 hours
    if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${hours} hr${hours > 1 ? 's' : ''} ago at ${time}`;
    }

    // Check if it was yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    if (date.toDateString() === yesterday.toDateString()) {
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `Yesterday at ${time}`;
    }

    // For older dates, show date and time
    const datePart = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${datePart} at ${timePart}`;
};


/**
 * Updates a venue's vibe status and increments the live report count.
 */
const updateVibeReport = async (venueId, newVibeStatus) => {
    // Only proceed if DB is initialized and we have a user ID
    if (!dbInstance || !venueId || !newVibeStatus || !currentUserId) {
        console.error("updateVibeReport: Prerequisites missing.");
        return false;
    }

    try {
        const collectionPath = getPublicCollectionPath(COLLECTION_NAMES.VENUES);
        const venueDocRef = doc(dbInstance, collectionPath, venueId);

        await updateDoc(venueDocRef, {
            vibe_status: newVibeStatus,
            live_count: increment(1),
            lastVibeReportedAt: new Date(), 
        });

        console.log(`Vibe Report submitted for venue ${venueId}. Status: ${newVibeStatus}`);
        return true;
    } catch (e) {
        console.error("Error submitting vibe report: ", e);
        return false;
    }
};

// --- SCREENS ---

// Navigation State Management (replacing @react-navigation)
const PAGE_VENUE_LIST = 'VenueList';
const PAGE_DETAILS = 'Details';
const PAGE_VIBE_REPORT = 'VibeReport';

const VIBE_OPTIONS = [
    { key: 'Quiet', label: 'Quiet (Plenty of space)', icon: BatteryFull, color: 'text-sky-500', bgColor: 'bg-sky-50' },
    { key: 'Normal', label: 'Normal (Comfortable)', icon: BatteryMedium, color: 'text-green-500', bgColor: 'bg-green-50' },
    { key: 'Busy', label: 'Busy (Getting crowded)', icon: BatteryLow, color: 'text-orange-500', bgColor: 'bg-orange-50' },
];

/**
 * VibeReportScreen Component (Converted from React Native to Tailwind/HTML)
 */
const VibeReportScreen = ({ venue, navigate }) => {
    const [selectedVibe, setSelectedVibe] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async () => {
        if (!selectedVibe) {
            setMessage({ type: 'error', text: 'Please select one of the current vibe statuses before submitting.' });
            return;
        }

        setIsSubmitting(true);
        setMessage(null);
        
        const success = await updateVibeReport(venue.id, selectedVibe);

        setIsSubmitting(false);

        if (success) {
            setMessage({ type: 'success', text: `Your Vibe Report for ${venue.name} has been submitted!` });
            // Navigate back to the details page, which will now show the updated data thanks to real-time listener
            setTimeout(() => navigate(PAGE_DETAILS, { ...venue, vibe_status: selectedVibe, lastVibeReportedAt: new Date() }), 1500); 
        } else {
            setMessage({ type: 'error', text: 'Failed to submit the Vibe Report. Please try again.' });
        }
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-1">Report the Current Vibe</h1>
            <h2 className="text-xl font-semibold text-red-500 text-center mb-4">{venue.name}</h2>
            <p className="text-sm text-gray-600 text-center mb-8">Help others by sharing the current crowd level.</p>

            <div className="flex justify-center space-x-3 max-w-lg mx-auto mb-10">
                {VIBE_OPTIONS.map(vibe => {
                    const Icon = vibe.icon;
                    const isSelected = selectedVibe === vibe.key;
                    return (
                        <div key={vibe.key} 
                            className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-lg cursor-pointer transition-all duration-200 
                                ${vibe.bgColor} ${isSelected ? 'ring-4 ring-offset-2 ring-red-500' : 'hover:shadow-xl'} w-1/3`}
                            onClick={() => setSelectedVibe(vibe.key)}
                        >
                            <Icon className={`w-8 h-8 ${vibe.color}`} />
                            <p className={`text-lg font-bold mt-2 ${vibe.color}`}>{vibe.key}</p>
                            <p className="text-xs text-gray-500 text-center mt-1">{vibe.label}</p>
                        </div>
                    );
                })}
            </div>

            {message && (
                <div className={`p-3 rounded-lg max-w-sm mx-auto mb-4 flex items-center ${
                    message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {message.type === 'success' ? <Check className="w-5 h-5 mr-2" /> : <X className="w-5 h-5 mr-2" />}
                    {message.text}
                </div>
            )}

            <div className="flex flex-col items-center max-w-sm mx-auto">
                <button
                    className={`flex items-center justify-center w-full py-3 rounded-lg text-white font-bold transition-colors duration-200 shadow-md ${
                        !selectedVibe || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                    }`}
                    onClick={handleSubmit}
                    disabled={!selectedVibe || isSubmitting}
                >
                    {isSubmitting ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <><Waves className="w-5 h-5 mr-2" /> Submit Vibe Report</>
                    )}
                </button>
                
                <button
                    className="mt-4 text-sky-600 hover:text-sky-700 font-medium"
                    onClick={() => navigate(PAGE_DETAILS, venue)}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};


/**
 * DetailsScreen Component
 */
const DetailsScreen = ({ venue, navigate }) => {
    // Determine the color and icon for the Vibe Status
    const { color: vibeColorClass, icon: VibeIcon } = useMemo(() => {
        switch (venue.vibe_status) {
            case 'Busy':
                return { color: 'text-orange-500', icon: BatteryLow }; 
            case 'Normal':
                return { color: 'text-green-500', icon: BatteryMedium }; 
            case 'Quiet':
                return { color: 'text-sky-500', icon: BatteryFull }; 
            default:
                return { color: 'text-gray-500', icon: Info }; 
        }
    }, [venue.vibe_status]);

    // --- UPDATED: Use the new formatRelativeTime utility ---
    const lastReportDate = useMemo(() => {
        return formatRelativeTime(venue.lastVibeReportedAt);
    }, [venue.lastVibeReportedAt]);
    // --- END UPDATED SECTION ---

    const handleReportVibe = () => {
        navigate(PAGE_VIBE_REPORT, venue);
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-red-500 shadow-md p-4 flex items-center">
                <button onClick={() => navigate(PAGE_VENUE_LIST)} className="text-white mr-4">
                    <Home className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-white truncate">{venue.name}</h1>
            </header>
            
            <div className="overflow-y-auto">
                {/* Placeholder Image */}
                <img
                    src={`https://placehold.co/600x300/FF6347/FFFFFF?text=${encodeURIComponent(venue.name)}`}
                    alt={venue.name}
                    className="w-full h-64 object-cover"
                />

                <div className="p-4">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">{venue.name}</h1>

                    {/* Vibe Status Card */}
                    <div className={`flex items-center p-4 rounded-xl border-2 ${vibeColorClass.replace('text', 'border')} mb-6 bg-white shadow-sm`}>
                        <VibeIcon className={`w-8 h-8 mr-4 ${vibeColorClass}`} />
                        <div>
                            <p className="text-sm text-gray-600 font-semibold">Current Vibe Status</p>
                            <p className={`text-2xl font-black ${vibeColorClass}`}>
                                {venue.vibe_status}
                            </p>
                        </div>
                    </div>

                    {/* Report Stats */}
                    <div className="flex justify-between items-center p-3 mb-6 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center text-sm text-gray-700">
                            <Users className="w-4 h-4 text-sky-500 mr-2" />
                            Total Vibe Reports: <span className="ml-1 font-bold">{venue.live_count || 0}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                            <Info className="w-4 h-4 text-sky-500 mr-2" />
                            Last Reported: <span className="ml-1 font-medium">{lastReportDate}</span>
                        </div>
                    </div>

                    {/* Report Vibe Button */}
                    <button 
                        className="flex items-center justify-center w-full py-3 rounded-lg text-white font-bold bg-red-500 hover:bg-red-600 transition-colors duration-200 shadow-md mb-8" 
                        onClick={handleReportVibe}
                    >
                        <Waves className="w-5 h-5 mr-2" /> Report Current Vibe
                    </button>

                    {/* General Information */}
                    <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-3">Information</h3>
                    
                    <div className="flex items-start mb-3">
                        <MapPin className="w-5 h-5 text-gray-500 mt-1 mr-3 flex-shrink-0" />
                        <p className="text-gray-700">{venue.address}</p>
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">{venue.description}</p>

                    {/* External Links */}
                    <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-3">Contact & Links</h3>
                    
                    {venue.website && (
                        <a href={venue.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-red-500 hover:text-red-600 py-2">
                            <Globe className="w-5 h-5 mr-3" />
                            <span className="underline">Visit Website</span>
                        </a>
                    )}
                    {venue.phone && (
                        <a href={`tel:${venue.phone}`} className="flex items-center text-red-500 hover:text-red-600 py-2">
                            <Phone className="w-5 h-5 mr-3" />
                            <span className="underline">Call: {venue.phone}</span>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * VenueListScreen Component
 */
const VenueListScreen = ({ navigate, isAuthReady }) => {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Real-time listener setup using onSnapshot
    useEffect(() => {
        if (!isAuthReady || !dbInstance) {
            setLoading(true); 
            return;
        }

        const collectionPath = getPublicCollectionPath(COLLECTION_NAMES.VENUES);
        const q = query(collection(dbInstance, collectionPath));

        setLoading(true);
        setError(null);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            try {
                const fetchedVenues = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    vibe_status: doc.data().vibe_status || 'Unknown', 
                    live_count: doc.data().live_count || 0,
                    lastVibeReportedAt: doc.data().lastVibeReportedAt || null, 
                }));

                setVenues(fetchedVenues);
                setLoading(false);
            } catch (e) {
                console.error("Error processing real-time snapshot: ", e);
                setError("An error occurred while receiving live data.");
                setLoading(false);
            }
        }, (err) => {
            console.error("Firestore real-time listener failed:", err);
            setError("Failed to connect to the live data stream. Check console for details.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isAuthReady]);

    const getVibeStatusDisplay = (vibe_status) => {
        const option = VIBE_OPTIONS.find(opt => opt.key === vibe_status) || { key: 'Unknown', color: 'text-gray-500', icon: Info };
        const Icon = option.icon;
        return (
            <div className={`flex items-center ${option.color} text-sm font-semibold`}>
                <Icon className="w-4 h-4 mr-1" />
                {option.key}
            </div>
        );
    };

    if (loading || !isAuthReady) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-500 border-t-transparent"></div>
                <p className="ml-4 text-red-500 font-semibold">Loading Live Vibe Data...</p>
                <div className="absolute bottom-4 left-4 text-xs text-gray-400">
                    User ID: {currentUserId || 'Authenticating...'}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-red-50 p-4">
                <p className="text-lg text-red-700 font-medium mb-4">Error loading data: {error}</p>
                <p className="text-sm text-red-600 mt-2">The app will automatically try to reconnect.</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-100 min-h-screen">
            <header className="bg-red-500 rounded-b-xl shadow-lg p-4 mb-4">
                <h1 className="text-2xl font-extrabold text-white text-center">Live Vibe Check</h1>
                <div className="text-center text-xs text-red-200 mt-1">
                    User ID: {currentUserId}
                </div>
            </header>

            <h2 className="text-lg font-semibold text-gray-700 mb-3 ml-2">Popular Venues ({venues.length})</h2>

            <div className="space-y-3 pb-8">
                {venues.length === 0 ? (
                    <div className="text-center p-10 bg-white rounded-xl shadow-md text-gray-500">
                        No venues found. Add some to Firestore!
                    </div>
                ) : (
                    venues.map(venue => (
                        <div 
                            key={venue.id} 
                            className="bg-white p-4 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-150 border border-gray-200"
                            onClick={() => navigate(PAGE_DETAILS, venue)}
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold text-gray-800">{venue.name}</h3>
                                <div className="text-xs font-medium text-gray-500 flex items-center">
                                    <Users className="w-3 h-3 mr-1" /> {venue.live_count || 0} reports
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-sm text-gray-600 flex items-center">
                                    <MapPin className="w-4 h-4 mr-1 text-red-400" />
                                    {venue.category}
                                </p>
                                {getVibeStatusDisplay(venue.vibe_status)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};


/**
 * Main App Component (Controls Routing and Firebase Auth)
 */
const App = () => {
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentPage, setCurrentPage] = useState(PAGE_VENUE_LIST);
    const [currentPageData, setCurrentPageData] = useState(null);

    // Initialization and Authentication Logic
    useEffect(() => {
        initializeFirebase();
        
        const signIn = async () => {
            if (authInstance) {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(authInstance, initialAuthToken);
                    } else {
                        await signInAnonymously(authInstance);
                    }
                } catch (error) {
                    console.error("Authentication failed:", error);
                }
            }
        };
        
        let unsubscribe;
        if (authInstance) {
            unsubscribe = onAuthStateChanged(authInstance, (user) => {
                // IMPORTANT: Set the global user ID once auth state is confirmed
                currentUserId = user ? user.uid : crypto.randomUUID(); 
                setIsAuthReady(true);
            });
        }

        signIn();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Simple navigation function
    const navigate = useCallback((page, data = null) => {
        setCurrentPage(page);
        setCurrentPageData(data);
    }, []);

    const renderPage = () => {
        switch (currentPage) {
            case PAGE_DETAILS:
                return <DetailsScreen venue={currentPageData} navigate={navigate} />;
            case PAGE_VIBE_REPORT:
                return <VibeReportScreen venue={currentPageData} navigate={navigate} />;
            case PAGE_VENUE_LIST:
            default:
                return <VenueListScreen navigate={navigate} isAuthReady={isAuthReady} />;
        }
    };

    if (!isAuthReady) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-500 border-t-transparent"></div>
                <p className="ml-4 text-red-500 font-semibold">Connecting to Vibe System...</p>
            </div>
        );
    }

    return (
        <div className="App font-sans max-w-xl mx-auto border-x min-h-screen border-gray-200">
            {renderPage()}
        </div>
    );
};

export default App;