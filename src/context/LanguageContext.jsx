import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
    en: {
        // General
        logout: 'Logout',
        yes: 'Yes',
        no: 'No',
        processing: 'Processing...',
        submit: 'Submit',
        save: 'Save',
        capture: 'Capture',

        // Dashboard/Status
        noVehicle: 'No Vehicle Active',
        startDutyMessage: 'Please start your duty to select a vehicle.',
        assignedVehicle: 'YOUR ASSIGNED VEHICLE',
        punchIn: 'PUNCH IN',
        punchOut: 'PUNCH OUT',
        dutyCompleted: 'Duty Completed',
        offDutyMessage: 'Your reports are submitted. You are now off-duty.',
        startNewDuty: 'Start New Duty',
        waitingAdmin: 'Waiting for Admin',
        reviewMessage: 'Your request is under review. Please wait.',
        onDuty: 'You are On Duty',
        driveSafely: 'Drive safely! Close duty only after reaching parking.',
        submitReports: 'Submit Reports & End Duty',

        // Punch In/Out Form
        dutyPunchIn: 'Duty Punch-In',
        dutyPunchOut: 'Duty Punch-Out',
        start: 'START',
        end: 'END',
        currentKm: 'CURRENT KM METER READING',
        enterKm: 'Enter KM',
        selectVehicle: 'Select Assigned Vehicle',
        selectCar: '-- Select Available Car --',
        driverSelfie: '1. DRIVER SELFIE',
        takeSelfie: 'Take Selfie',
        kmPhoto: '2. KM PHOTO',
        takeKmPhoto: 'Take KM Photo',
        carSelfie: '3. CAR SELFIE',
        takeCarPhoto: 'Take Car Photo',

        // Expenditure
        expenditureDetails: 'EXPENDITURE & TRIP DETAILS',
        fuelQuestion: '1. Did you refill Petrol/Diesel?',
        refillNo: 'REFILL NO.',
        amount: 'Amount (₹)',
        meterKm: 'Meter KM',
        captureSlip: 'Capture Slip',
        addAnotherBill: 'Add Another Bill',
        parkingQuestion: '2. Did you pay for parking?',
        receipt: 'Receipt',
        addAnotherParking: 'Add Another Parking',
        outsideCityQuestion: '3. Did you go outside city?',
        sameDay: 'SAME DAY (+100)',
        nightStay: 'NIGHT STAY (+500)',

        // Maintenance
        maintenanceIssues: 'MAINTENANCE ISSUES (OPTIONAL)',
        carWash: 'Car Wash',
        lightIssue: 'Light Issue',
        puncture: 'Puncture',
        mechanical: 'Mechanical',
        accident: 'Accident/Dent',
        other: 'Other',
        otherRemarks: 'Other Issues/Remarks',
        explainOptional: 'Explain (Optional)',
        remarksAdmin: 'REMARKS FOR ADMIN',
        enterRemarks: 'Enter remarks',
        submitPunchIn: 'Submit Punch-In',
        submitPunchOut: 'Submit Punch-Out',

        // Modals
        modalTakeSelfie: 'Take Selfie',
        modalCaptureKm: 'Capture KM Meter',
        modalTakeCarSelfie: 'Take Car Selfie',
        modalFuelSlip: 'Refill Slip Photo',
        modalParkingSlip: 'Parking Slip Photo',
        modalCapturePhoto: 'Capture Photo',

        // Messages
        mandatoryFields: 'KM, Selfie, KM Photo, and Car Selfie are mandatory',
        fuelValidation: 'All fuel entries must have amount, KM and slip photo',
        parkingValidation: 'All parking entries must have amount and receipt',
        punchInSuccess: 'Successfully Punched In!',
        punchOutSuccess: 'Successfully Punched Out!',
        requestSent: 'Request sent to Admin. Waiting for approval.',
        requestFailed: 'Failed to send request',
        cameraError: 'Could not access camera. Please ensure you have given permission or are using HTTPS.'
    },
    hi: {
        // General
        logout: 'लॉगआउट',
        yes: 'हाँ',
        no: 'नहीं',
        processing: 'प्रोसेसिंग...',
        submit: 'सबमिट करें',
        save: 'सहेजें',
        capture: 'फोटो लें',

        // Dashboard/Status
        noVehicle: 'कोई वाहन सक्रिय नहीं है',
        startDutyMessage: 'वाहन चुनने के लिए कृपया अपनी ड्यूटी शुरू करें।',
        assignedVehicle: 'आपका आवंटित वाहन',
        punchIn: 'पंच इन',
        punchOut: 'पंच आउट',
        dutyCompleted: 'ड्यूटी पूरी हुई',
        offDutyMessage: 'आपकी रिपोर्ट सबमिट हो गई है। अब आप ड्यूटी पर नहीं हैं।',
        startNewDuty: 'नई ड्यूटी शुरू करें',
        waitingAdmin: 'एडमिन का इंतज़ार है',
        reviewMessage: 'आपका अनुरोध विचाराधीन है। कृपया प्रतीक्षा करें।',
        onDuty: 'आप ड्यूटी पर हैं',
        driveSafely: 'सुरक्षित ड्राइव करें! पार्किंग स्थल पर पहुँचने के बाद ही ड्यूटी बंद करें।',
        submitReports: 'रिपोर्ट सबमिट करें और ड्यूटी समाप्त करें',

        // Punch In/Out Form
        dutyPunchIn: 'ड्यूटी पंच-इन',
        dutyPunchOut: 'ड्यूटी पंच-आउट',
        start: 'शुरू',
        end: 'समाप्त',
        currentKm: 'वर्तमान KM मीटर रीडिंग',
        enterKm: 'KM दर्ज करें',
        selectVehicle: 'आवंटित वाहन चुनें',
        selectCar: '-- उपलब्ध गाड़ी चुनें --',
        driverSelfie: '1. ड्राइवर सेल्फी',
        takeSelfie: 'सेल्फी लें',
        kmPhoto: '2. KM फोटो',
        takeKmPhoto: 'KM फोटो लें',
        carSelfie: '3. गाड़ी की सेल्फी',
        takeCarPhoto: 'गाड़ी की फोटो लें',

        // Expenditure
        expenditureDetails: 'खर्च और यात्रा विवरण',
        fuelQuestion: '1. क्या आपने पेट्रोल/डीजल भरवाया?',
        refillNo: 'रीफिल नंबर',
        amount: 'राशि (₹)',
        meterKm: 'मीटर KM',
        captureSlip: 'रसीद की फोटो लें',
        addAnotherBill: 'एक और बिल जोड़ें',
        parkingQuestion: '2. क्या आपने पार्किंग का भुगतान किया?',
        receipt: 'रसीद',
        addAnotherParking: 'एक और पार्किंग जोड़ें',
        outsideCityQuestion: '3. क्या आप शहर के बाहर गए थे?',
        sameDay: 'उसी दिन वापसी (+100)',
        nightStay: 'रात का ठहराव (+500)',

        // Maintenance
        maintenanceIssues: 'अनुरक्षण मुद्दे (वैकल्पिक)',
        carWash: 'गाड़ी धुलाई',
        lightIssue: 'लाइट की समस्या',
        puncture: 'पंचर',
        mechanical: 'मैकेनिकल',
        accident: 'दुर्घटना/डेंट',
        other: 'अन्य',
        otherRemarks: 'अन्य मुद्दे/टिप्पणियां',
        explainOptional: 'समझाएं (वैकल्पिक)',
        remarksAdmin: 'एडमिन के लिए टिप्पणियां',
        enterRemarks: 'टिप्पणियां दर्ज करें',
        submitPunchIn: 'पंच-इन सबमिट करें',
        submitPunchOut: 'पंच-आउट सबमिट करें',

        // Modals
        modalTakeSelfie: 'सेल्फी लें',
        modalCaptureKm: 'KM मीटर कैप्चर करें',
        modalTakeCarSelfie: 'गाड़ी की सेल्फी लें',
        modalFuelSlip: 'ईंधन रसीद फोटो',
        modalParkingSlip: 'पार्किंग रसीद फोटो',
        modalCapturePhoto: 'फोटो कैप्चर करें',

        // Messages
        mandatoryFields: 'KM, सेल्फी, KM फोटो और गाड़ी की सेल्फी अनिवार्य हैं',
        fuelValidation: 'सभी ईंधन प्रविष्टियों में राशि, KM और रसीद फोटो होनी चाहिए',
        parkingValidation: 'सभी पार्किंग प्रविष्टियों में राशि और रसीद होनी चाहिए',
        punchInSuccess: 'सफलतापूर्वक पंच-इन हो गया!',
        punchOutSuccess: 'सफलतापूर्वक पंच-आउट हो गया!',
        requestSent: 'एडमिन को अनुरोध भेज दिया गया है। अनुमोदन की प्रतीक्षा है।',
        requestFailed: 'अनुरोध भेजने में विफल',
        cameraError: 'कैमरा एक्सेस नहीं किया जा सका। कृपया सुनिश्चित करें कि आपने अनुमति दी है या HTTPS का उपयोग कर रहे हैं।'
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
