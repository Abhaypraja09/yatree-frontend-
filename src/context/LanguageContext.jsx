import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
    en: {
        // General
        logout: 'Logout',
        yes: 'Yes',
        no: 'No',
        capture: 'Capture',

        // Dashboard/Status
        noVehicle: 'No Vehicle Active',
        startDutyMessage: 'Please start your duty to select a vehicle.',
        assignedVehicle: 'YOUR ASSIGNED VEHICLE',
        punchIn: 'START DUTY',
        punchOut: 'END DUTY',
        dutyCompleted: 'Duty Completed',
        offDutyMessage: 'Your reports are submitted. You are now off-duty.',
        startNewDuty: 'Start New Duty',
        waitingAdmin: 'Waiting for Admin',
        reviewMessage: 'Your request is under review. Please wait.',
        total_drivers: 'Total Drivers',
        fleet_size: 'Fleet Size',
        concluded_duty: 'Concluded Duty',
        today: 'Today',
        personnel_hub: 'Personnel Hub',
        approvals: 'Approvals',
        onDuty: 'You are On Duty',
        driveSafely: 'Drive safely! Close duty only after reaching parking.',
        submitReports: 'Submit Reports & End Duty',

        // Punch In/Out Form
        dutyPunchIn: 'Start Duty',
        dutyPunchOut: 'End Duty',
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
        refillNo: 'REFILL NO.',
        meterKm: 'Meter KM',
        captureSlip: 'Capture Slip',
        fuelType: 'Fuel Type',
        petrol: 'Petrol',
        diesel: 'Diesel',
        cng: 'CNG',
        addAnotherBill: 'Add Another Bill',
        parkingQuestion: '2. Did you pay for parking?',
        receipt: 'Receipt',
        addAnotherParking: 'Add Another Parking',
        outsideCityQuestion: '3. Did you go outside city?',
        sameDay: 'SAME DAY (+100)',
        nightStay: 'NIGHT STAY (+500)',

        // Maintenance
        maintenanceIssues: 'DRIVER Service (OPTIONAL)',
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
        modalOtherSlip: 'Expense Slip Photo',
        modalCapturePhoto: 'Capture Photo',

        // Messages
        mandatoryFields: 'KM, Selfie, KM Photo, and Car Selfie are mandatory',
        fuelValidation: 'All fuel entries must have amount, KM and slip photo',
        parkingValidation: 'All parking entries must have amount and receipt',
        punchInSuccess: 'Successfully Punched In!',
        punchOutSuccess: 'Successfully Punched Out!',
        requestSent: 'Request sent to Admin. Awaiting approval.',
        requestFailed: 'Failed to send request',
        cameraError: 'Could not access camera. Please ensure you have given permission or are using HTTPS.',
        logExpense: 'Log Expense',
        addFuelParking: 'Add Fuel/Parking Slip',
        logFuel: 'Log Fuel',
        logParking: 'Log Parking',
        driverSeva: 'Driver Service',
        expenseSubmitted: 'Expense submitted for approval',
        approvalStatus: 'Approval Status',
        type: 'Expense Type',
        submit: 'Submit Log',
        processing: 'Processing...',
        noExpensesYet: 'No expenses added yet',

        // Ledger
        ledger: 'Salary & Duties',
        totalEarned: 'Total Earned',
        totalAdvance: 'Advance Taken',
        pendingAdvance: 'Advance Payment',
        netPayable: 'Net Payable',
        workingDays: 'Duties',
        downloadExcel: 'Download Report',
        dutyHistory: 'Duty History',
        advanceHistory: 'Advance History',
        date: 'Date',
        vehicle: 'Vehicle',
        wage: 'Wage',
        bonus: 'Bonus',
        amount: 'Amount',
        total: 'Total'
    },
    hi: {
        // General
        logout: 'लॉगआउट',
        yes: 'हाँ',
        no: 'नहीं',
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
        total_drivers: 'कुल ड्राइवर',
        fleet_size: 'वाहन बेड़ा',
        concluded_duty: 'ड्यूटी समाप्त',
        today: 'आज',
        personnel_hub: 'कार्मिक हब',
        approvals: 'मंजूरी',
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
        amountWithSymbol: 'राशि (₹)',
        meterKm: 'मीटर KM',
        captureSlip: 'रसीद की फोटो लें',
        fuelType: 'ईंधन का प्रकार',
        petrol: 'पेट्रोल',
        diesel: 'डीजल',
        cng: 'सीएनजी',
        addAnotherBill: 'एक और बिल जोड़ें',
        parkingQuestion: '2. क्या आपने पार्किंग का भुगतान किया?',
        receipt: 'रसीद',
        addAnotherParking: 'एक और पार्किंग जोड़ें',
        outsideCityQuestion: '3. क्या आप शहर के बाहर गए थे?',
        sameDay: 'उसी दिन वापसी (+100)',
        nightStay: 'रात का ठहराव (+500)',

        // Maintenance
        maintenanceIssues: 'ड्राइवर सेवा (वैकल्पिक)',
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
        modalOtherSlip: 'खर्च रसीद फोटो',
        modalCapturePhoto: 'फोटो कैप्चर करें',

        // Messages
        mandatoryFields: 'KM, सेल्फी, KM फोटो और गाड़ी की सेल्फी अनिवार्य हैं',
        fuelValidation: 'सभी ईंधन प्रविष्टियों में राशि, KM और रसीद फोटो होनी चाहिए',
        parkingValidation: 'सभी पार्किंग प्रविष्टियों में राशि और रसीद होनी चाहिए',
        punchInSuccess: 'सफलतापूर्वक पंच-इन हो गया!',
        punchOutSuccess: 'सफलतापूर्वक पंच-आउट हो गया!',
        requestSent: 'एडमिन को अनुरोध भेज दिया गया है। अनुमोदन की प्रतीक्षा है।',
        requestFailed: 'अनुरोध भेजने में विफल',
        cameraError: 'कैमरा एक्सेस नहीं किया जा सका। कृपया सुनिश्चित करें कि आपने अनुमति दी है या HTTPS का उपयोग कर रहे हैं।',
        logExpense: 'खर्च दर्ज करें',
        addFuelParking: 'ईंधन/पार्किंग रसीद जोड़ें',
        logFuel: 'ईंधन दर्ज करें',
        logParking: 'पार्किंग दर्ज करें',
        driverSeva: 'ड्राइवर सेवा',
        expenseSubmitted: 'खर्च अनुमोदन के लिए भेज दिया गया है',
        approvalStatus: 'अनुमोदन स्थिति',
        type: 'खर्च का प्रकार',
        submit: 'लॉग सबमिट करें',

        noExpensesYet: 'अभी तक कोई खर्च नहीं जोड़ा गया है',

        // Ledger
        ledger: 'सैलरी और ड्यूटी',
        totalEarned: 'कुल कमाई',
        totalAdvance: 'लिया गया एडवांस',
        pendingAdvance: 'एडवांस पेमेंट',
        netPayable: 'शुद्ध देय राशि',
        workingDays: 'कुल ड्यूटी',
        downloadExcel: 'रिपोर्ट डाउनलोड करें',
        dutyHistory: 'ड्यूटी का इतिहास',
        advanceHistory: 'एडवांस का इतिहास',
        date: 'तारीख',
        vehicle: 'गाड़ी',
        wage: 'वेतन',
        bonus: 'बोनस',
        amount: 'राशि',
        total: 'कुल'
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
