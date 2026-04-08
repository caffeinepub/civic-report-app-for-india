import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const languages: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "bho", name: "Bhojpuri", nativeName: "भोजपुरी" },
];

// Complete translation keys and their values for each language
const translations: Record<string, Record<string, string>> = {
  en: {
    // Header
    "header.title": "Civic Reporter",
    "header.subtitle": "Building a cleaner, better India",

    // Form
    "form.title": "Submit a Report & Download NFT Certificate",
    "form.subtitle": "Help improve your community by reporting civic issues",
    "form.issueType.title": "What type of civic issue are you reporting?",
    "form.issueType.description":
      "Select the category that best describes the issue",
    "form.photo.title": "Upload Photo of the Issue *",
    "form.photo.description": "Take a clear photo showing the civic issue",
    "form.additionalInfo.title": "Additional Information",
    "form.additionalInfo.description":
      "Optional details about you and the issue",
    "form.username.label": "Username (Optional)",
    "form.username.placeholder": "Enter your name or username",
    "form.notes.label": "Notes/Comments (Optional)",
    "form.notes.placeholder": "Add any additional details about the issue...",
    "form.location.title": "Location & Leaders Information",
    "form.location.description":
      "Your location and local leaders information for the certificate",
    "form.location.current": "Current Location",
    "form.location.refresh": "Refresh",
    "form.location.loading": "Getting your location...",
    "form.location.error":
      "Location access denied. Please enable location services to submit reports.",
    "form.location.success": "✓ Location captured:",
    "form.location.address": "Address:",
    "form.leaders.title": "Your Leaders (for Certificate)",
    "form.mlaMp.title": "MLA/MP Information (Optional)",
    "form.mlaMp.description":
      "Include your local MLA or MP's information to be displayed on the certificate",
    "form.mlaMp.name.label": "MLA/MP Name",
    "form.mlaMp.name.placeholder": "Enter MLA or MP name",
    "form.mlaMp.photo.label": "MLA/MP Photo",
    "form.mlaMp.note":
      "Both name and photo are required to display MLA/MP information on the certificate.",
    "form.customIssue.label": "Please specify the issue type *",
    "form.customIssue.placeholder":
      "Enter the specific civic issue you're reporting",
    "form.submit": "Submit Report",
    "form.submitting": "Submitting Report...",
    "form.disclaimer.title": "IMPORTANT DISCLAIMER:",
    "form.disclaimer.text":
      "This is NOT an official government document. This is a citizen-generated report for civic awareness purposes only. The use of leader photos does not imply official endorsement or government affiliation. No official action is guaranteed from this report.",

    // Issue categories
    "issue.pothole": "Pothole",
    "issue.pothole.desc": "Road damage and potholes",
    "issue.garbage": "Roadside Garbage",
    "issue.garbage.desc": "Litter and waste disposal issues",
    "issue.streetlight": "Broken Streetlight",
    "issue.streetlight.desc": "Non-functioning street lighting",
    "issue.waterlogging": "Waterlogging",
    "issue.waterlogging.desc": "Water accumulation on roads",
    "issue.flood": "Flood",
    "issue.flood.desc": "Flooding in public areas",
    "issue.illegal_dumping": "Illegal Dumping",
    "issue.illegal_dumping.desc": "Unauthorized waste disposal",
    "issue.illegal_parking": "Illegal Parking",
    "issue.illegal_parking.desc": "Vehicles parked in restricted areas",
    "issue.other": "Other",
    "issue.other.desc": "Other civic issues not listed above",

    // Upload buttons
    "upload.takePhoto": "Take Photo",
    "upload.uploadPhoto": "Upload Photo",
    "upload.removePhoto": "Remove photo",

    // Success screen
    "success.title": "Report Submitted Successfully!",
    "success.description":
      "Your civic report has been saved. You can now generate and download your certificate.",
    "success.reportId": "Report ID:",
    "success.reportedBy": "Reported by:",
    "success.mlaMp": "MLA/MP:",
    "success.newReport": "Submit Another Report",

    // Certificate
    "certificate.download": "Certificate",
    "certificate.share": "Share",
    "certificate.title": "Civic Issue Certificate",
    "certificate.titleHindi": "नागरिक मुद्दा प्रमाण पत्र",
    "certificate.tagline": "WE, THE PEOPLE OF INDIA",
    "certificate.taglineHindi": "हम, भारत के लोग",
    "certificate.reportDetails": "Report Details",
    "certificate.reportId": "Report ID:",
    "certificate.date": "Date:",
    "certificate.time": "Time:",
    "certificate.issueType": "Issue Type:",
    "certificate.reportedBy": "Reported by:",
    "certificate.mlaMp": "MLA/MP:",
    "certificate.location": "Location",
    "certificate.coordinates": "Coordinates:",
    "certificate.notes": "Notes",
    "certificate.reportedIssue": "REPORTED ISSUE",
    "certificate.primeMinister": "PRIME MINISTER",
    "certificate.chiefMinister": "CHIEF MINISTER",
    "certificate.verify": "Verify this certificate:",
    "certificate.scanQr": "Scan QR code or visit:",
    "certificate.statement":
      "This certificate acknowledges your contribution to civic improvement.",
    "certificate.initiative": "Digital Civic Initiative",
    "certificate.disclaimer.title": "IMPORTANT DISCLAIMER",
    "certificate.disclaimer.text1":
      "This is NOT an official government document. This is a citizen-generated report for civic awareness purposes only.",
    "certificate.disclaimer.text2":
      "The use of leader photos does not imply official endorsement or government affiliation.",
    "certificate.disclaimer.text3":
      "No official action is guaranteed from this report.",

    // Report list
    "reports.title": "Recent Reports",
    "reports.loading": "Loading reports...",
    "reports.error": "Failed to load reports. Please try again.",
    "reports.empty.title": "No reports yet",
    "reports.empty.description": "Be the first to submit a civic report!",
    "reports.reportedBy": "Reported by:",
    "reports.mlaMp": "MLA/MP:",
    "reports.updateStatus": "Update Status",
    "reports.updateStatusTo": "Update Report Status to Resolved",
    "reports.reporterName": "Reporter Name *",
    "reports.reporterNamePlaceholder": "Enter your name",
    "reports.resolutionNotes": "Resolution Notes (Optional)",
    "reports.resolutionNotesPlaceholder":
      "Add any comments about how the issue was resolved...",
    "reports.proofPhoto": "Proof Photo *",
    "reports.markResolved": "Mark as Resolved",
    "reports.updating": "Updating...",
    "reports.cancel": "Cancel",
    "reports.resolutionDetails": "Resolution Details",
    "reports.resolvedBy": "Resolved by:",
    "reports.resolutionPhoto": "Resolution Photo:",
    "reports.clickToView": "Click to view full size",

    // Roadmap
    "roadmap.title": "Development Roadmap",
    "roadmap.subtitle": "Track our progress and upcoming features",
    "roadmap.implemented.title": "Implemented Features",
    "roadmap.implemented.subtitle":
      "Features that have been completed and are live",
    "roadmap.underConsideration.title": "Under Consideration",
    "roadmap.underConsideration.subtitle":
      "Features being evaluated or in planning phase",
    "roadmap.upcoming.title": "Upcoming/Planned Features",
    "roadmap.upcoming.subtitle": "Features scheduled for future development",
    "roadmap.addFeature": "Add Feature",
    "roadmap.editFeature": "Edit Feature",
    "roadmap.deleteFeature": "Delete Feature",
    "roadmap.createFeature": "Create Feature",
    "roadmap.updateFeature": "Update Feature",
    "roadmap.moveFeature": "Move Feature",
    "roadmap.searchPlaceholder": "Search features by title or description...",
    "roadmap.showCompleted": "Show Completed",
    "roadmap.hideCompleted": "Hide Completed",
    "roadmap.clearFilters": "Clear Filters",
    "roadmap.noFeatures": "No roadmap features yet",
    "roadmap.noFeaturesDescription":
      "The development roadmap will appear here once features are added.",
    "roadmap.addFirstFeature": "Add First Feature",
    "roadmap.noMatchingFeatures": "No features match your filters",
    "roadmap.adjustFilters":
      "Try adjusting your search terms or filters to see more results.",
    "roadmap.dragInstructions":
      "Drag feature cards between sections to update their status. Changes are saved automatically when you drop a card in a new section.",
    "roadmap.adminMode": "Admin Mode Active",
    "roadmap.adminModeDescription":
      "You can add, edit, delete, and drag features between sections. Changes are saved automatically.",
    "roadmap.totalFeatures": "Total Features",
    "roadmap.implemented": "Implemented",
    "roadmap.inProgress": "In Progress",
    "roadmap.planned": "Planned",
    "roadmap.progress": "Progress",
    "roadmap.icon": "Icon",
    "roadmap.title.label": "Title",
    "roadmap.description.label": "Description",
    "roadmap.section": "Section",
    "roadmap.cancel": "Cancel",
    "roadmap.save": "Save",
    "roadmap.creating": "Creating...",
    "roadmap.updating": "Updating...",
    "roadmap.deleting": "Deleting...",
    "roadmap.moving": "Moving...",

    // Verification
    "verify.title": "Report Verified",
    "verify.description":
      "This is an authentic civics issue report submitted through our platform",
    "verify.reportedIssue": "Reported Issue",
    "verify.reportInfo": "Report Information",
    "verify.reportId": "Report ID",
    "verify.reportedBy": "Reported by",
    "verify.dateTime": "Date & Time",
    "verify.location": "Location",
    "verify.mlaMp": "MLA/MP",
    "verify.notes": "Notes",
    "verify.status": "Status",
    "verify.confirmed.title": "Verification Confirmed",
    "verify.confirmed.description":
      "This report has been verified as authentic and was submitted through the official Civics Issue Report App for India. The report details, timestamp, and location data have been cryptographically secured and cannot be tampered with.",
    "verify.notFound.title": "Report Not Found",
    "verify.notFound.description":
      "The report you're looking for doesn't exist or may have been removed.",
    "verify.backHome": "Back to Home",
    "verify.verifying": "Verifying report...",

    // Footer
    "footer.support": "Support this effort and buy me a coffee",

    // Common
    "common.loading": "Loading...",
    "common.loadingImage": "Loading image...",
    "common.characters": "characters",
    "common.status.open": "Open",
    "common.status.resolved": "Resolved",
    "common.status.submitted": "Submitted",
    "common.primeMinister": "Prime Minister",
    "common.chiefMinister": "Chief Minister",
  },

  hi: {
    // Header
    "header.title": "नागरिक रिपोर्टर",
    "header.subtitle": "एक स्वच्छ, बेहतर भारत का निर्माण",

    // Form
    "form.title": "रिपोर्ट जमा करें और एनएफटी प्रमाणपत्र डाउनलोड करें",
    "form.subtitle":
      "नागरिक समस्याओं की रिपोर्ट करके अपने समुदाय को बेहतर बनाने में मदद करें",
    "form.issueType.title": "आप किस प्रकार की नागरिक समस्या की रिपोर्ट कर रहे हैं?",
    "form.issueType.description": "समस्या का सबसे अच्छा वर्णन करने वाली श्रेणी चुनें",
    "form.photo.title": "समस्या की फोटो अपलोड करें *",
    "form.photo.description": "नागरिक समस्या दिखाने वाली स्पष्ट फोटो लें",
    "form.additionalInfo.title": "अतिरिक्त जानकारी",
    "form.additionalInfo.description": "आपके और समस्या के बारे में वैकल्पिक विवरण",
    "form.username.label": "उपयोगकर्ता नाम (वैकल्पिक)",
    "form.username.placeholder": "अपना नाम या उपयोगकर्ता नाम दर्ज करें",
    "form.notes.label": "टिप्पणियां/टिप्पणी (वैकल्पिक)",
    "form.notes.placeholder": "समस्या के बारे में कोई अतिरिक्त विवरण जोड़ें...",
    "form.location.title": "स्थान और नेता जानकारी",
    "form.location.description":
      "प्रमाणपत्र के लिए आपका स्थान और स्थानीय नेताओं की जानकारी",
    "form.location.current": "वर्तमान स्थान",
    "form.location.refresh": "रीफ्रेश",
    "form.location.loading": "आपका स्थान प्राप्त कर रहे हैं...",
    "form.location.error":
      "स्थान पहुंच से इनकार कर दिया गया। रिपोर्ट जमा करने के लिए स्थान सेवाएं सक्षम करें।",
    "form.location.success": "✓ स्थान कैप्चर किया गया:",
    "form.location.address": "पता:",
    "form.leaders.title": "आपके नेता (प्रमाणपत्र के लिए)",
    "form.mlaMp.title": "विधायक/सांसद जानकारी (वैकल्पिक)",
    "form.mlaMp.description":
      "प्रमाणपत्र पर प्रदर्शित होने के लिए अपने स्थानीय विधायक या सांसद की जानकारी शामिल करें",
    "form.mlaMp.name.label": "विधायक/सांसद नाम",
    "form.mlaMp.name.placeholder": "विधायक या सांसद का नाम दर्ज करें",
    "form.mlaMp.photo.label": "विधायक/सांसद फोटो",
    "form.mlaMp.note":
      "प्रमाणपत्र पर विधायक/सांसद जानकारी प्रदर्शित करने के लिए नाम और फोटो दोनों आवश्यक हैं।",
    "form.customIssue.label": "कृपया समस्या का प्रकार निर्दिष्ट करें *",
    "form.customIssue.placeholder":
      "आप जिस विशिष्ट नागरिक समस्या की रिपोर्ट कर रहे हैं उसे दर्ज करें",
    "form.submit": "रिपोर्ट जमा करें",
    "form.submitting": "रिपोर्ट जमा कर रहे हैं...",
    "form.disclaimer.title": "महत्वपूर्ण अस्वीकरण:",
    "form.disclaimer.text":
      "यह एक आधिकारिक सरकारी दस्तावेज नहीं है। यह केवल नागरिक जागरूकता उद्देश्यों के लिए नागरिक-जनित रिपोर्ट है। नेता फोटो का उपयोग आधिकारिक समर्थन या सरकारी संबद्धता का संकेत नहीं देता। इस रिपोर्ट से किसी आधिकारिक कार्रवाई की गारंटी नहीं है।",

    // Issue categories
    "issue.pothole": "गड्ढा",
    "issue.pothole.desc": "सड़क की क्षति और गड्ढे",
    "issue.garbage": "सड़क किनारे कचरा",
    "issue.garbage.desc": "कूड़ा और अपशिष्ट निपटान की समस्याएं",
    "issue.streetlight": "टूटी स्ट्रीट लाइट",
    "issue.streetlight.desc": "गैर-कार्यशील स्ट्रीट लाइटिंग",
    "issue.waterlogging": "जल भराव",
    "issue.waterlogging.desc": "सड़कों पर पानी का जमाव",
    "issue.flood": "बाढ़",
    "issue.flood.desc": "सार्वजनिक क्षेत्रों में बाढ़",
    "issue.illegal_dumping": "अवैध डंपिंग",
    "issue.illegal_dumping.desc": "अनधिकृत अपशिष्ट निपटान",
    "issue.illegal_parking": "अवैध पार्किंग",
    "issue.illegal_parking.desc": "प्रतिबंधित क्षेत्रों में पार्क किए गए वाहन",
    "issue.other": "अन्य",
    "issue.other.desc": "ऊपर सूचीबद्ध नहीं की गई अन्य नागरिक समस्याएं",

    // Upload buttons
    "upload.takePhoto": "फोटो लें",
    "upload.uploadPhoto": "फोटो अपलोड करें",
    "upload.removePhoto": "फोटो हटाएं",

    // Success screen
    "success.title": "रिपोर्ट सफलतापूर्वक जमा की गई!",
    "success.description":
      "आपकी नागरिक रिपोर्ट सहेजी गई है। अब आप अपना प्रमाणपत्र बना और डाउनलोड कर सकते हैं।",
    "success.reportId": "रिपोर्ट आईडी:",
    "success.reportedBy": "द्वारा रिपोर्ट किया गया:",
    "success.mlaMp": "विधायक/सांसद:",
    "success.newReport": "दूसरी रिपोर्ट जमा करें",

    // Certificate
    "certificate.download": "प्रमाणपत्र",
    "certificate.share": "साझा करें",
    "certificate.title": "नागरिक मुद्दा प्रमाणपत्र",
    "certificate.titleHindi": "नागरिक मुद्दा प्रमाण पत्र",
    "certificate.tagline": "WE, THE PEOPLE OF INDIA",
    "certificate.taglineHindi": "हम, भारत के लोग",
    "certificate.reportDetails": "रिपोर्ट विवरण",
    "certificate.reportId": "रिपोर्ट आईडी:",
    "certificate.date": "दिनांक:",
    "certificate.time": "समय:",
    "certificate.issueType": "समस्या प्रकार:",
    "certificate.reportedBy": "द्वारा रिपोर्ट किया गया:",
    "certificate.mlaMp": "विधायक/सांसद:",
    "certificate.location": "स्थान",
    "certificate.coordinates": "निर्देशांक:",
    "certificate.notes": "टिप्पणियां",
    "certificate.reportedIssue": "रिपोर्ट की गई समस्या",
    "certificate.primeMinister": "प्रधान मंत्री",
    "certificate.chiefMinister": "मुख्यमंत्री",
    "certificate.verify": "इस प्रमाणपत्र को सत्यापित करें:",
    "certificate.scanQr": "QR कोड स्कैन करें या विजिट करें:",
    "certificate.statement":
      "यह प्रमाणपत्र नागरिक सुधार में आपके योगदान को स्वीकार करता है।",
    "certificate.initiative": "डिजिटल नागरिक पहल",
    "certificate.disclaimer.title": "महत्वपूर्ण अस्वीकरण",
    "certificate.disclaimer.text1":
      "यह एक आधिकारिक सरकारी दस्तावेज नहीं है। यह केवल नागरिक जागरूकता उद्देश्यों के लिए नागरिक-जनित रिपोर्ट है।",
    "certificate.disclaimer.text2":
      "नेता फोटो का उपयोग आधिकारिक समर्थन या सरकारी संबद्धता का संकेत नहीं देता।",
    "certificate.disclaimer.text3":
      "इस रिपोर्ट से किसी आधिकारिक कार्रवाई की गारंटी नहीं है।",

    // Report list
    "reports.title": "हाल की रिपोर्ट",
    "reports.loading": "रिपोर्ट लोड हो रही हैं...",
    "reports.error": "रिपोर्ट लोड करने में विफल। कृपया पुनः प्रयास करें।",
    "reports.empty.title": "अभी तक कोई रिपोर्ट नहीं",
    "reports.empty.description": "नागरिक रिपोर्ट जमा करने वाले पहले व्यक्ति बनें!",
    "reports.reportedBy": "द्वारा रिपोर्ट किया गया:",
    "reports.mlaMp": "विधायक/सांसद:",
    "reports.updateStatus": "स्थिति अपडेट करें",
    "reports.updateStatusTo": "रिपोर्ट की स्थिति को हल किया गया में अपडेट करें",
    "reports.reporterName": "रिपोर्टर का नाम *",
    "reports.reporterNamePlaceholder": "अपना नाम दर्ज करें",
    "reports.resolutionNotes": "समाधान टिप्पणियां (वैकल्पिक)",
    "reports.resolutionNotesPlaceholder":
      "समस्या कैसे हल की गई इसके बारे में कोई टिप्पणी जोड़ें...",
    "reports.proofPhoto": "प्रमाण फोटो *",
    "reports.markResolved": "हल किया गया के रूप में चिह्नित करें",
    "reports.updating": "अपडेट कर रहे हैं...",
    "reports.cancel": "रद्द करें",
    "reports.resolutionDetails": "समाधान विवरण",
    "reports.resolvedBy": "द्वारा हल किया गया:",
    "reports.resolutionPhoto": "समाधान फोटो:",
    "reports.clickToView": "पूर्ण आकार देखने के लिए क्लिक करें",

    // Roadmap
    "roadmap.title": "विकास रोडमैप",
    "roadmap.subtitle": "हमारी प्रगति और आगामी सुविधाओं को ट्रैक करें",
    "roadmap.implemented.title": "लागू की गई सुविधाएं",
    "roadmap.implemented.subtitle": "सुविधाएं जो पूरी हो गई हैं और लाइव हैं",
    "roadmap.underConsideration.title": "विचाराधीन",
    "roadmap.underConsideration.subtitle":
      "सुविधाएं जिनका मूल्यांकन या योजना चरण में है",
    "roadmap.upcoming.title": "आगामी/नियोजित सुविधाएं",
    "roadmap.upcoming.subtitle": "भविष्य के विकास के लिए निर्धारित सुविधाएं",
    "roadmap.addFeature": "सुविधा जोड़ें",
    "roadmap.editFeature": "सुविधा संपादित करें",
    "roadmap.deleteFeature": "सुविधा हटाएं",
    "roadmap.createFeature": "सुविधा बनाएं",
    "roadmap.updateFeature": "सुविधा अपडेट करें",
    "roadmap.moveFeature": "सुविधा स्थानांतरित करें",
    "roadmap.searchPlaceholder": "शीर्षक या विवरण द्वारा सुविधाएं खोजें...",
    "roadmap.showCompleted": "पूर्ण दिखाएं",
    "roadmap.hideCompleted": "पूर्ण छुपाएं",
    "roadmap.clearFilters": "फिल्टर साफ़ करें",
    "roadmap.noFeatures": "अभी तक कोई रोडमैप सुविधाएं नहीं",
    "roadmap.noFeaturesDescription":
      "सुविधाएं जोड़े जाने पर विकास रोडमैप यहां दिखाई देगा।",
    "roadmap.addFirstFeature": "पहली सुविधा जोड़ें",
    "roadmap.noMatchingFeatures": "कोई सुविधा आपके फिल्टर से मेल नहीं खाती",
    "roadmap.adjustFilters":
      "अधिक परिणाम देखने के लिए अपने खोज शब्दों या फिल्टर को समायोजित करने का प्रयास करें।",
    "roadmap.dragInstructions":
      "उनकी स्थिति अपडेट करने के लिए सुविधा कार्ड को अनुभागों के बीच खींचें। जब आप किसी नए अनुभाग में कार्ड छोड़ते हैं तो परिवर्तन स्वचालित रूप से सहेजे जाते हैं।",
    "roadmap.adminMode": "एडमिन मोड सक्रिय",
    "roadmap.adminModeDescription":
      "आप अनुभागों के बीच सुविधाएं जोड़, संपादित, हटा और खींच सकते हैं। परिवर्तन स्वचालित रूप से सहेजे जाते हैं।",
    "roadmap.totalFeatures": "कुल सुविधाएं",
    "roadmap.implemented": "लागू",
    "roadmap.inProgress": "प्रगति में",
    "roadmap.planned": "नियोजित",
    "roadmap.progress": "प्रगति",
    "roadmap.icon": "आइकन",
    "roadmap.title.label": "शीर्षक",
    "roadmap.description.label": "विवरण",
    "roadmap.section": "अनुभाग",
    "roadmap.cancel": "रद्द करें",
    "roadmap.save": "सहेजें",
    "roadmap.creating": "बना रहे हैं...",
    "roadmap.updating": "अपडेट कर रहे हैं...",
    "roadmap.deleting": "हटा रहे हैं...",
    "roadmap.moving": "स्थानांतरित कर रहे हैं...",

    // Verification
    "verify.title": "रिपोर्ट सत्यापित",
    "verify.description":
      "यह हमारे प्लेटफॉर्म के माध्यम से जमा की गई एक प्रामाणिक नागरिक समस्या रिपोर्ट है",
    "verify.reportedIssue": "रिपोर्ट की गई समस्या",
    "verify.reportInfo": "रिपोर्ट जानकारी",
    "verify.reportId": "रिपोर्ट आईडी",
    "verify.reportedBy": "द्वारा रिपोर्ट किया गया",
    "verify.dateTime": "दिनांक और समय",
    "verify.location": "स्थान",
    "verify.mlaMp": "विधायक/सांसद",
    "verify.notes": "टिप्पणियां",
    "verify.status": "स्थिति",
    "verify.confirmed.title": "सत्यापन पुष्ट",
    "verify.confirmed.description":
      "यह रिपोर्ट प्रामाणिक के रूप में सत्यापित की गई है और भारत के लिए आधिकारिक नागरिक मुद्दा रिपोर्ट ऐप के माध्यम से जमा की गई है। रिपोर्ट विवरण, टाइमस्टैम्प और स्थान डेटा को क्रिप्टोग्राफिक रूप से सुरक्षित किया गया है और इसे छेड़छाड़ नहीं किया जा सकता।",
    "verify.notFound.title": "रिपोर्ट नहीं मिली",
    "verify.notFound.description":
      "आप जिस रिपोर्ट की तलाश कर रहे हैं वह मौजूद नहीं है या हटा दी गई हो सकती है।",
    "verify.backHome": "होम पर वापस जाएं",
    "verify.verifying": "रिपोर्ट सत्यापित कर रहे हैं...",

    // Footer
    "footer.support": "इस प्रयास का समर्थन करें और मुझे एक कॉफी खरीदें",

    // Common
    "common.loading": "लोड हो रहा है...",
    "common.loadingImage": "छवि लोड हो रही है...",
    "common.characters": "अक्षर",
    "common.status.open": "खुला",
    "common.status.resolved": "हल किया गया",
    "common.status.submitted": "जमा किया गया",
    "common.primeMinister": "प्रधान मंत्री",
    "common.chiefMinister": "मुख्यमंत्री",
  },

  ta: {
    // Header
    "header.title": "குடிமக்கள் அறிக்கையாளர்",
    "header.subtitle": "சுத்தமான, சிறந்த இந்தியாவை உருவாக்குதல்",

    // Form
    "form.title": "அறிக்கையை சமர்ப்பிக்கவும் மற்றும் NFT சான்றிதழை பதிவிறக்கவும்",
    "form.subtitle":
      "குடிமக்கள் பிரச்சினைகளை அறிக்கை செய்வதன் மூலம் உங்கள் சமுதாயத்தை மேம்படுத்த உதவுங்கள்",
    "form.issueType.title":
      "நீங்கள் எந்த வகையான குடிமக்கள் பிரச்சினையை அறிக்கை செய்கிறீர்கள்?",
    "form.issueType.description":
      "பிரச்சினையை சிறப்பாக விவரிக்கும் வகையை தேர்ந்தெடுக்கவும்",
    "form.photo.title": "பிரச்சினையின் புகைப்படத்தை பதிவேற்றவும் *",
    "form.photo.description":
      "குடிமக்கள் பிரச்சினையை காட்டும் தெளிவான புகைப்படம் எடுக்கவும்",
    "form.additionalInfo.title": "கூடுதல் தகவல்",
    "form.additionalInfo.description":
      "உங்களைப் பற்றியும் பிரச்சினையைப் பற்றியும் விருப்பமான விவரங்கள்",
    "form.username.label": "பயனர் பெயர் (விருப்பமானது)",
    "form.username.placeholder": "உங்கள் பெயர் அல்லது பயனர் பெயரை உள்ளிடவும்",
    "form.notes.label": "குறிப்புகள்/கருத்துகள் (விருப்பமானது)",
    "form.notes.placeholder": "பிரச்சினையைப் பற்றி கூடுதல் விவரங்களைச் சேர்க்கவும்...",
    "form.location.title": "இடம் மற்றும் தலைவர்கள் தகவல்",
    "form.location.description":
      "சான்றிதழுக்கான உங்கள் இடம் மற்றும் உள்ளூர் தலைவர்களின் தகவல்",
    "form.location.current": "தற்போதைய இடம்",
    "form.location.refresh": "புதுப்பிக்கவும்",
    "form.location.loading": "உங்கள் இடத்தைப் பெறுகிறது...",
    "form.location.error":
      "இட அணுகல் மறுக்கப்பட்டது. அறிக்கைகளை சமர்ப்பிக்க இட சேவைகளை இயக்கவும்.",
    "form.location.success": "✓ இடம் பிடிக்கப்பட்டது:",
    "form.location.address": "முகவரி:",
    "form.leaders.title": "உங்கள் தலைவர்கள் (சான்றிதழுக்கு)",
    "form.mlaMp.title": "MLA/MP தகவல் (விருப்பமானது)",
    "form.mlaMp.description":
      "சான்றிதழில் காட்டப்படுவதற்கு உங்கள் உள்ளூர் MLA அல்லது MP இன் தகவலைச் சேர்க்கவும்",
    "form.mlaMp.name.label": "MLA/MP பெயர்",
    "form.mlaMp.name.placeholder": "MLA அல்லது MP பெயரை உள்ளிடவும்",
    "form.mlaMp.photo.label": "MLA/MP புகைப்படம்",
    "form.mlaMp.note":
      "சான்றிதழில் MLA/MP தகவலைக் காட்ட பெயர் மற்றும் புகைப்படம் இரண்டும் தேவை.",
    "form.customIssue.label": "தயவுசெய்து பிரச்சினை வகையை குறிப்பிடவும் *",
    "form.customIssue.placeholder":
      "நீங்கள் அறிக்கை செய்யும் குறிப்பிட்ட குடிமக்கள் பிரச்சினையை உள்ளிடவும்",
    "form.submit": "அறிக்கையை சமர்ப்பிக்கவும்",
    "form.submitting": "அறிக்கையை சமர்ப்பிக்கிறது...",
    "form.disclaimer.title": "முக்கியமான மறுப்பு:",
    "form.disclaimer.text":
      "இது அதிகாரப்பூர்வ அரசாங்க ஆவணம் அல்ல। இது குடிமக்கள் விழிப்புணர்வு நோக்கங்களுக்காக மட்டுமே குடிமக்களால் உருவாக்கப்பட்ட அறிக்கை. தலைவர் புகைப்படங்களின் பயன்பாடு அதிகாரப்பூர்வ ஒப்புதல் அல்லது அரசாங்க இணைப்பைக் குறிக்காது. இந்த அறிக்கையிலிருந்து எந்த அதிகாரப்பூர்வ நடவடிக்கைக்கும் உத்தரவாதம் இல்லை.",

    // Issue categories
    "issue.pothole": "குழி",
    "issue.pothole.desc": "சாலை சேதம் மற்றும் குழிகள்",
    "issue.garbage": "சாலையோர குப்பை",
    "issue.garbage.desc": "குப்பை மற்றும் கழிவு அகற்றல் பிரச்சினைகள்",
    "issue.streetlight": "உடைந்த தெரு விளக்கு",
    "issue.streetlight.desc": "செயல்படாத தெரு விளக்குகள்",
    "issue.waterlogging": "நீர் தேக்கம்",
    "issue.waterlogging.desc": "சாலைகளில் நீர் தேக்கம்",
    "issue.flood": "வெள்ளம்",
    "issue.flood.desc": "பொது இடங்களில் வெள்ளம்",
    "issue.illegal_dumping": "சட்டவிரோத குப்பை கொட்டுதல்",
    "issue.illegal_dumping.desc": "அங்கீகரிக்கப்படாத கழிவு அகற்றல்",
    "issue.illegal_parking": "சட்டவிரோத பார்க்கிங்",
    "issue.illegal_parking.desc": "தடைசெய்யப்பட்ட பகுதிகளில் நிறுத்தப்பட்ட வாகனங்கள்",
    "issue.other": "மற்றவை",
    "issue.other.desc": "மேலே பட்டியலிடப்படாத பிற குடிமக்கள் பிரச்சினைகள்",

    // Upload buttons
    "upload.takePhoto": "புகைப்படம் எடுக்கவும்",
    "upload.uploadPhoto": "புகைப்படத்தை பதிவேற்றவும்",
    "upload.removePhoto": "புகைப்படத்தை அகற்றவும்",

    // Success screen
    "success.title": "அறிக்கை வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!",
    "success.description":
      "உங்கள் குடிமக்கள் அறிக்கை சேமிக்கப்பட்டுள்ளது. இப்போது நீங்கள் உங்கள் சான்றிதழை உருவாக்கி பதிவிறக்கலாம்.",
    "success.reportId": "அறிக்கை ID:",
    "success.reportedBy": "அறிக்கை செய்தவர்:",
    "success.mlaMp": "MLA/MP:",
    "success.newReport": "மற்றொரு அறிக்கையை சமர்ப்பிக்கவும்",

    // Certificate
    "certificate.download": "சான்றிதழ்",
    "certificate.share": "பகிரவும்",
    "certificate.title": "குடிமக்கள் பிரச்சினை சான்றிதழ்",
    "certificate.titleHindi": "नागरिक मुद्दा प्रमाण पत्र",
    "certificate.tagline": "WE, THE PEOPLE OF INDIA",
    "certificate.taglineHindi": "हम, भारत के लोग",
    "certificate.reportDetails": "அறிக்கை விவரங்கள்",
    "certificate.reportId": "அறிக்கை ID:",
    "certificate.date": "தேதி:",
    "certificate.time": "நேரம்:",
    "certificate.issueType": "பிரச்சினை வகை:",
    "certificate.reportedBy": "அறிக்கை செய்தவர்:",
    "certificate.mlaMp": "MLA/MP:",
    "certificate.location": "இடம்",
    "certificate.coordinates": "ஆயத்தொலைவுகள்:",
    "certificate.notes": "குறிப்புகள்",
    "certificate.reportedIssue": "அறிக்கை செய்யப்பட்ட பிரச்சினை",
    "certificate.primeMinister": "பிரதம மந்திரி",
    "certificate.chiefMinister": "முதலமைச்சர்",
    "certificate.verify": "இந்த சான்றிதழை சரிபார்க்கவும்:",
    "certificate.scanQr": "QR குறியீட்டை ஸ்கேன் செய்யவும் அல்லது பார்வையிடவும்:",
    "certificate.statement":
      "இந்த சான்றிதழ் குடிமக்கள் மேம்பாட்டில் உங்கள் பங்களிப்பை ஒப்புக்கொள்கிறது.",
    "certificate.initiative": "டிஜிட்டல் குடிமக்கள் முன்முயற்சி",
    "certificate.disclaimer.title": "முக்கியமான மறுப்பு",
    "certificate.disclaimer.text1":
      "இது அதிகாரப்பூர்வ அரசாங்க ஆவணம் அல்ல. இது குடிமக்கள் விழிப்புணர்வு நோக்கங்களுக்காக மட்டுமே குடிமக்களால் உருவாக்கப்பட்ட அறிக்கை.",
    "certificate.disclaimer.text2":
      "தலைவர் புகைப்படங்களின் பயன்பாடு அதிகாரப்பூர்வ ஒப்புதல் அல்லது அரசாங்க இணைப்பைக் குறிக்காது.",
    "certificate.disclaimer.text3":
      "இந்த அறிக்கையிலிருந்து எந்த அதிகாரப்பூர்வ நடவடிக்கைக்கும் உத்தரவாதம் இல்லை.",

    // Report list
    "reports.title": "சமீபத்திய அறிக்கைகள்",
    "reports.loading": "அறிக்கைகள் ஏற்றப்படுகின்றன...",
    "reports.error": "அறிக்கைகளை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    "reports.empty.title": "இன்னும் அறிக்கைகள் இல்லை",
    "reports.empty.description":
      "குடிமக்கள் அறிக்கையை சமர்ப்பிக்கும் முதல் நபராக இருங்கள்!",
    "reports.reportedBy": "அறிக்கை செய்தவர்:",
    "reports.mlaMp": "MLA/MP:",
    "reports.updateStatus": "நிலையை புதுப்பிக்கவும்",
    "reports.updateStatusTo": "அறிக்கை நிலையை தீர்க்கப்பட்டது என புதுப்பிக்கவும்",
    "reports.reporterName": "அறிக்கையாளர் பெயர் *",
    "reports.reporterNamePlaceholder": "உங்கள் பெயரை உள்ளிடவும்",
    "reports.resolutionNotes": "தீர்வு குறிப்புகள் (விருப்பமானது)",
    "reports.resolutionNotesPlaceholder":
      "பிரச்சினை எவ்வாறு தீர்க்கப்பட்டது என்பது பற்றி ஏதேனும் கருத்துகளைச் சேர்க்கவும்...",
    "reports.proofPhoto": "ஆதார புகைப்படம் *",
    "reports.markResolved": "தீர்க்கப்பட்டது என குறிக்கவும்",
    "reports.updating": "புதுப்பிக்கிறது...",
    "reports.cancel": "ரத்து செய்",
    "reports.resolutionDetails": "தீர்வு விவரங்கள்",
    "reports.resolvedBy": "தீர்த்தவர்:",
    "reports.resolutionPhoto": "தீர்வு புகைப்படம்:",
    "reports.clickToView": "முழு அளவைப் பார்க்க கிளிக் செய்யவும்",

    // Roadmap
    "roadmap.title": "வளர்ச்சி வரைபடம்",
    "roadmap.subtitle": "எங்கள் முன்னேற்றம் மற்றும் வரவிருக்கும் அம்சங்களைக் கண்காணிக்கவும்",
    "roadmap.implemented.title": "செயல்படுத்தப்பட்ட அம்சங்கள்",
    "roadmap.implemented.subtitle": "முடிக்கப்பட்ட மற்றும் நேரடியாக உள்ள அம்சங்கள்",
    "roadmap.underConsideration.title": "பரிசீலனையில்",
    "roadmap.underConsideration.subtitle":
      "மதிப்பீடு அல்லது திட்டமிடல் கட்டத்தில் உள்ள அம்சங்கள்",
    "roadmap.upcoming.title": "வரவிருக்கும்/திட்டமிடப்பட்ட அம்சங்கள்",
    "roadmap.upcoming.subtitle": "எதிர்கால வளர்ச்சிக்காக திட்டமிடப்பட்ட அம்சங்கள்",
    "roadmap.addFeature": "அம்சம் சேர்க்கவும்",
    "roadmap.editFeature": "அம்சத்தைத் திருத்தவும்",
    "roadmap.deleteFeature": "அம்சத்தை நீக்கவும்",
    "roadmap.createFeature": "அம்சத்தை உருவாக்கவும்",
    "roadmap.updateFeature": "அம்சத்தைப் புதுப்பிக்கவும்",
    "roadmap.moveFeature": "அம்சத்தை நகர்த்தவும்",
    "roadmap.searchPlaceholder":
      "தலைப்பு அல்லது விளக்கத்தின் மூலம் அம்சங்களைத் தேடவும்...",
    "roadmap.showCompleted": "முடிக்கப்பட்டதைக் காட்டு",
    "roadmap.hideCompleted": "முடிக்கப்பட்டதை மறைக்கவும்",
    "roadmap.clearFilters": "வடிப்பான்களை அழிக்கவும்",
    "roadmap.noFeatures": "இன்னும் வரைபட அம்சங்கள் இல்லை",
    "roadmap.noFeaturesDescription":
      "அம்சங்கள் சேர்க்கப்பட்டவுடன் வளர்ச்சி வரைபடம் இங்கே தோன்றும்.",
    "roadmap.addFirstFeature": "முதல் அம்சத்தைச் சேர்க்கவும்",
    "roadmap.noMatchingFeatures": "உங்கள் வடிப்பான்களுடன் எந்த அம்சமும் பொருந்தவில்லை",
    "roadmap.adjustFilters":
      "அதிக முடிவுகளைக் காண உங்கள் தேடல் சொற்கள் அல்லது வடிப்பான்களை சரிசெய்ய முயற்சிக்கவும்.",
    "roadmap.dragInstructions":
      "அவற்றின் நிலையைப் புதுப்பிக்க பிரிவுகளுக்கு இடையே அம்ச அட்டைகளை இழுக்கவும். நீங்கள் ஒரு புதிய பிரிவில் அட்டையை விடும்போது மாற்றங்கள் தானாகவே சேமிக்கப்படும்.",
    "roadmap.adminMode": "நிர்வாக பயன்முறை செயலில்",
    "roadmap.adminModeDescription":
      "நீங்கள் பிரிவுகளுக்கு இடையே அம்சங்களைச் சேர்க்கலாம், திருத்தலாம், நீக்கலாம் மற்றும் இழுக்கலாம். மாற்றங்கள் தானாகவே சேமிக்கப்படும்.",
    "roadmap.totalFeatures": "மொத்த அம்சங்கள்",
    "roadmap.implemented": "செயல்படுத்தப்பட்டது",
    "roadmap.inProgress": "முன்னேற்றத்தில்",
    "roadmap.planned": "திட்டமிடப்பட்டது",
    "roadmap.progress": "முன்னேற்றம்",
    "roadmap.icon": "ஐகான்",
    "roadmap.title.label": "தலைப்பு",
    "roadmap.description.label": "விளக்கம்",
    "roadmap.section": "பிரிவு",
    "roadmap.cancel": "ரத்து செய்",
    "roadmap.save": "சேமிக்கவும்",
    "roadmap.creating": "உருவாக்குகிறது...",
    "roadmap.updating": "புதுப்பிக்கிறது...",
    "roadmap.deleting": "நீக்குகிறது...",
    "roadmap.moving": "நகர்த்துகிறது...",

    // Verification
    "verify.title": "அறிக்கை சரிபார்க்கப்பட்டது",
    "verify.description":
      "இது எங்கள் தளத்தின் மூலம் சமர்ப்பிக்கப்பட்ட ஒரு உண்மையான குடிமக்கள் பிரச்சினை அறிக்கை",
    "verify.reportedIssue": "அறிக்கை செய்யப்பட்ட பிரச்சினை",
    "verify.reportInfo": "அறிக்கை தகவல்",
    "verify.reportId": "அறிக்கை ID",
    "verify.reportedBy": "அறிக்கை செய்தவர்",
    "verify.dateTime": "தேதி மற்றும் நேரம்",
    "verify.location": "இடம்",
    "verify.mlaMp": "MLA/MP",
    "verify.notes": "குறிப்புகள்",
    "verify.status": "நிலை",
    "verify.confirmed.title": "சரிபார்ப்பு உறுதிப்படுத்தப்பட்டது",
    "verify.confirmed.description":
      "இந்த அறிக்கை உண்மையானது என சரிபார்க்கப்பட்டு, இந்தியாவுக்கான அதிகாரப்பூர்வ குடிமக்கள் பிரச்சினை அறிக்கை ஆப்பின் மூலம் சமர்ப்பிக்கப்பட்டுள்ளது. அறிக்கை விவரங்கள், நேர முத்திரை மற்றும் இட தரவு கிரிப்டோகிராஃபிக் முறையில் பாதுகாக்கப்பட்டுள்ளன மற்றும் அவற்றை மாற்ற முடியாது.",
    "verify.notFound.title": "அறிக்கை கிடைக்கவில்லை",
    "verify.notFound.description":
      "நீங்கள் தேடும் அறிக்கை இல்லை அல்லது அகற்றப்பட்டிருக்கலாம்.",
    "verify.backHome": "முகப்புக்கு திரும்பு",
    "verify.verifying": "அறிக்கையை சரிபார்க்கிறது...",

    // Footer
    "footer.support": "இந்த முயற்சியை ஆதரித்து எனக்கு ஒரு காபி வாங்குங்கள்",

    // Common
    "common.loading": "ஏற்றுகிறது...",
    "common.loadingImage": "படம் ஏற்றுகிறது...",
    "common.characters": "எழுத்துகள்",
    "common.status.open": "திறந்த",
    "common.status.resolved": "தீர்க்கப்பட்டது",
    "common.status.submitted": "சமர்ப்பிக்கப்பட்டது",
    "common.primeMinister": "பிரதம மந்திரி",
    "common.chiefMinister": "முதலமைச்சர்",
  },

  // Add basic translations for other languages (Telugu, Bengali, Marathi, Kannada, Bhojpuri)
  // For brevity, I'll add a few key translations for each language
  te: {
    "header.title": "పౌర రిపోర్టర్",
    "header.subtitle": "శుభ్రమైన, మెరుగైన భారతదేశాన్ని నిర్మించడం",
    "form.title": "రిపోర్ట్ సమర్పించండి మరియు NFT సర్టిఫికేట్ డౌన్‌లోడ్ చేయండి",
    "form.subtitle": "పౌర సమస్యలను నివేదించడం ద్వారా మీ సమాజాన్ని మెరుగుపరచడంలో సహాయపడండి",
    "form.issueType.title": "మీరు ఎలాంటి పౌర సమస్యను నివేదిస్తున్నారు?",
    "form.issueType.description": "సమస్యను ఉత్తమంగా వివరించే వర్గాన్ని ఎంచుకోండి",
    "form.photo.title": "సమస్య యొక్క ఫోటోను అప్‌లోడ్ చేయండి *",
    "form.photo.description": "పౌర సమస్యను చూపించే స్పష్టమైన ఫోటో తీయండి",
    "form.submit": "రిపోర్ట్ సమర్పించండి",
    "form.submitting": "రిపోర్ట్ సమర్పిస్తోంది...",
    "certificate.download": "సర్టిఫికేట్",
    "certificate.share": "భాగస్వామ్యం",
    "reports.title": "ఇటీవలి రిపోర్ట్‌లు",
    "roadmap.title": "అభివృద్ధి రోడ్‌మ్యాప్",
    "roadmap.subtitle": "మా పురోగతి మరియు రాబోయే లక్షణాలను ట్రాక్ చేయండి",
    "roadmap.implemented.title": "అమలు చేయబడిన లక్షణాలు",
    "roadmap.underConsideration.title": "పరిశీలనలో",
    "roadmap.upcoming.title": "రాబోయే/ప్రణాళికాబద్ధమైన లక్షణాలు",
    "roadmap.addFeature": "లక్షణం జోడించండి",
    "roadmap.totalFeatures": "మొత్తం లక్షణాలు",
    "roadmap.implemented": "అమలు చేయబడింది",
    "roadmap.inProgress": "పురోగతిలో",
    "roadmap.planned": "ప్రణాళికాబద్ధం",
    "common.loading": "లోడ్ అవుతోంది...",
    "common.status.open": "తెరిచిన",
    "common.status.resolved": "పరిష్కరించబడింది",
    "footer.support": "ఈ ప్రయత్నానికి మద్దతు ఇవ్వండి మరియు నాకు కాఫీ కొనండి",
    "issue.pothole": "గొయ్యి",
    "issue.garbage": "రోడ్‌సైడ్ చెత్త",
    "issue.streetlight": "విరిగిన వీధి దీపం",
    "issue.waterlogging": "నీటి నిలుపుదల",
    "issue.flood": "వరద",
    "issue.illegal_dumping": "అక్రమ డంపింగ్",
    "issue.illegal_parking": "అక్రమ పార్కింగ్",
    "issue.other": "ఇతర",
    "upload.takePhoto": "ఫోటో తీయండి",
    "upload.uploadPhoto": "ఫోటో అప్‌లోడ్ చేయండి",
    "upload.removePhoto": "ఫోటోను తీసివేయండి",
    "success.title": "రిపోర్ట్ విజయవంతంగా సమర్పించబడింది!",
    "success.description":
      "మీ పౌర రిపోర్ట్ సేవ్ చేయబడింది. ఇప్పుడు మీరు మీ సర్టిఫికేట్‌ను రూపొందించి డౌన్‌లోడ్ చేయవచ్చు.",
    "common.primeMinister": "ప్రధాన మంత్రి",
    "common.chiefMinister": "ముఖ్యమంత్రి",
  },

  bn: {
    "header.title": "নাগরিক রিপোর্টার",
    "header.subtitle": "একটি পরিচ্ছন্ন, উন্নত ভারত গড়া",
    "form.title": "রিপোর্ট জমা দিন এবং NFT সার্টিফিকেট ডাউনলোড করুন",
    "form.subtitle": "নাগরিক সমস্যা রিপোর্ট করে আপনার সম্প্রদায়ের উন্নতিতে সাহায্য করুন",
    "form.issueType.title": "আপনি কী ধরনের নাগরিক সমস্যার রিপোর্ট করছেন?",
    "form.issueType.description":
      "সমস্যাটি সবচেয়ে ভালোভাবে বর্ণনা করে এমন বিভাগ নির্বাচন করুন",
    "form.photo.title": "সমস্যার ছবি আপলোড করুন *",
    "form.photo.description": "নাগরিক সমস্যা দেখানো একটি স্পষ্ট ছবি তুলুন",
    "form.submit": "রিপোর্ট জমা দিন",
    "form.submitting": "রিপোর্ট জমা দেওয়া হচ্ছে...",
    "certificate.download": "সার্টিফিকেট",
    "certificate.share": "শেয়ার করুন",
    "reports.title": "সাম্প্রতিক রিপোর্ট",
    "roadmap.title": "উন্নয়ন রোডম্যাপ",
    "roadmap.subtitle": "আমাদের অগ্রগতি এবং আসন্ন বৈশিষ্ট্যগুলি ট্র্যাক করুন",
    "roadmap.implemented.title": "বাস্তবায়িত বৈশিষ্ট্য",
    "roadmap.underConsideration.title": "বিবেচনাধীন",
    "roadmap.upcoming.title": "আসন্ন/পরিকল্পিত বৈশিষ্ট্য",
    "roadmap.addFeature": "বৈশিষ্ট্য যোগ করুন",
    "roadmap.totalFeatures": "মোট বৈশিষ্ট্য",
    "roadmap.implemented": "বাস্তবায়িত",
    "roadmap.inProgress": "অগ্রগতিতে",
    "roadmap.planned": "পরিকল্পিত",
    "common.loading": "লোড হচ্ছে...",
    "common.status.open": "খোলা",
    "common.status.resolved": "সমাধান হয়েছে",
    "footer.support": "এই প্রচেষ্টাকে সমর্থন করুন এবং আমাকে একটি কফি কিনুন",
    "issue.pothole": "গর্ত",
    "issue.garbage": "রাস্তার পাশের আবর্জনা",
    "issue.streetlight": "ভাঙা স্ট্রিট লাইট",
    "issue.waterlogging": "জল জমা",
    "issue.flood": "বন্যা",
    "issue.illegal_dumping": "অবৈধ ডাম্পিং",
    "issue.illegal_parking": "অবৈধ পার্কিং",
    "issue.other": "অন্যান্য",
    "upload.takePhoto": "ছবি তুলুন",
    "upload.uploadPhoto": "ছবি আপলোড করুন",
    "upload.removePhoto": "ছবি সরান",
    "success.title": "রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে!",
    "success.description":
      "আপনার নাগরিক রিপোর্ট সংরক্ষিত হয়েছে। এখন আপনি আপনার সার্টিফিকেট তৈরি এবং ডাউনলোড করতে পারেন।",
    "common.primeMinister": "প্রধানমন্ত্রী",
    "common.chiefMinister": "মুখ্যমন্ত্রী",
  },

  mr: {
    "header.title": "नागरिक रिपोर्टर",
    "header.subtitle": "स्वच्छ, चांगला भारत बनवणे",
    "form.title": "अहवाल सादर करा आणि NFT प्रमाणपत्र डाउनलोड करा",
    "form.subtitle": "नागरी समस्यांचा अहवाल देऊन आपल्या समुदायाला सुधारण्यास मदत करा",
    "form.issueType.title": "तुम्ही कोणत्या प्रकारच्या नागरी समस्येचा अहवाल देत आहात?",
    "form.issueType.description": "समस्येचे सर्वोत्तम वर्णन करणारी श्रेणी निवडा",
    "form.photo.title": "समस्येचा फोटो अपलोड करा *",
    "form.photo.description": "नागरी समस्या दर्शविणारा स्पष्ट फोटो घ्या",
    "form.submit": "अहवाल सादर करा",
    "form.submitting": "अहवाल सादर करत आहे...",
    "certificate.download": "प्रमाणपत्र",
    "certificate.share": "शेअर करा",
    "reports.title": "अलीकडील अहवाल",
    "roadmap.title": "विकास रोडमॅप",
    "roadmap.subtitle": "आमची प्रगती आणि आगामी वैशिष्ट्ये ट्रॅक करा",
    "roadmap.implemented.title": "अंमलबजावणी केलेली वैशिष्ट्ये",
    "roadmap.underConsideration.title": "विचाराधीन",
    "roadmap.upcoming.title": "आगामी/नियोजित वैशिष्ट्ये",
    "roadmap.addFeature": "वैशिष्ट्य जोडा",
    "roadmap.totalFeatures": "एकूण वैशिष्ट्ये",
    "roadmap.implemented": "अंमलबजावणी",
    "roadmap.inProgress": "प्रगतीत",
    "roadmap.planned": "नियोजित",
    "common.loading": "लोड होत आहे...",
    "common.status.open": "उघडा",
    "common.status.resolved": "निराकरण झाले",
    "footer.support": "या प्रयत्नाला पाठिंबा द्या आणि मला कॉफी विकत घ्या",
    "issue.pothole": "खड्डा",
    "issue.garbage": "रस्त्याच्या कडेला कचरा",
    "issue.streetlight": "तुटलेला रस्त्याचा दिवा",
    "issue.waterlogging": "पाणी साचणे",
    "issue.flood": "पूर",
    "issue.illegal_dumping": "बेकायदेशीर डंपिंग",
    "issue.illegal_parking": "बेकायदेशीर पार्किंग",
    "issue.other": "इतर",
    "upload.takePhoto": "फोटो घ्या",
    "upload.uploadPhoto": "फोटो अपलोड करा",
    "upload.removePhoto": "फोटो काढा",
    "success.title": "अहवाल यशस्वीरित्या सादर केला!",
    "success.description":
      "तुमचा नागरी अहवाल जतन केला गेला आहे. आता तुम्ही तुमचे प्रमाणपत्र तयार करू आणि डाउनलोड करू शकता.",
    "common.primeMinister": "पंतप्रधान",
    "common.chiefMinister": "मुख्यमंत्री",
  },

  kn: {
    "header.title": "ನಾಗರಿಕ ವರದಿಗಾರ",
    "header.subtitle": "ಸ್ವಚ್ಛ, ಉತ್ತಮ ಭಾರತವನ್ನು ನಿರ್ಮಿಸುವುದು",
    "form.title": "ವರದಿಯನ್ನು ಸಲ್ಲಿಸಿ ಮತ್ತು NFT ಪ್ರಮಾಣಪತ್ರವನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    "form.subtitle":
      "ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡುವ ಮೂಲಕ ನಿಮ್ಮ ಸಮುದಾಯವನ್ನು ಸುಧಾರಿಸಲು ಸಹಾಯ ಮಾಡಿ",
    "form.issueType.title": "ನೀವು ಯಾವ ರೀತಿಯ ನಾಗರಿಕ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡುತ್ತಿದ್ದೀರಿ?",
    "form.issueType.description": "ಸಮಸ್ಯೆಯನ್ನು ಉತ್ತಮವಾಗಿ ವಿವರಿಸುವ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "form.photo.title": "ಸಮಸ್ಯೆಯ ಫೋಟೋವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ *",
    "form.photo.description": "ನಾಗರಿಕ ಸಮಸ್ಯೆಯನ್ನು ತೋರಿಸುವ ಸ್ಪಷ್ಟ ಫೋಟೋ ತೆಗೆಯಿರಿ",
    "form.submit": "ವರದಿಯನ್ನು ಸಲ್ಲಿಸಿ",
    "form.submitting": "ವರದಿಯನ್ನು ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...",
    "certificate.download": "ಪ್ರಮಾಣಪತ್ರ",
    "certificate.share": "ಹಂಚಿಕೊಳ್ಳಿ",
    "reports.title": "ಇತ್ತೀಚಿನ ವರದಿಗಳು",
    "roadmap.title": "ಅಭಿವೃದ್ಧಿ ರೋಡ್‌ಮ್ಯಾಪ್",
    "roadmap.subtitle": "ನಮ್ಮ ಪ್ರಗತಿ ಮತ್ತು ಮುಂಬರುವ ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    "roadmap.implemented.title": "ಅನುಷ್ಠಾನಗೊಂಡ ವೈಶಿಷ್ಟ್ಯಗಳು",
    "roadmap.underConsideration.title": "ಪರಿಗಣನೆಯಲ್ಲಿ",
    "roadmap.upcoming.title": "ಮುಂಬರುವ/ಯೋಜಿತ ವೈಶಿಷ್ಟ್ಯಗಳು",
    "roadmap.addFeature": "ವೈಶಿಷ್ಟ್ಯ ಸೇರಿಸಿ",
    "roadmap.totalFeatures": "ಒಟ್ಟು ವೈಶಿಷ್ಟ್ಯಗಳು",
    "roadmap.implemented": "ಅನುಷ್ಠಾನಗೊಂಡಿದೆ",
    "roadmap.inProgress": "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
    "roadmap.planned": "ಯೋಜಿತ",
    "common.loading": "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    "common.status.open": "ತೆರೆದ",
    "common.status.resolved": "ಪರಿಹರಿಸಲಾಗಿದೆ",
    "footer.support": "ಈ ಪ್ರಯತ್ನವನ್ನು ಬೆಂಬಲಿಸಿ ಮತ್ತು ನನಗೆ ಕಾಫಿ ಖರೀದಿಸಿ",
    "issue.pothole": "ಗುಂಡಿ",
    "issue.garbage": "ರಸ್ತೆಬದಿಯ ಕಸ",
    "issue.streetlight": "ಮುರಿದ ರಸ್ತೆ ದೀಪ",
    "issue.waterlogging": "ನೀರು ನಿಲುಗಡೆ",
    "issue.flood": "ಪ್ರವಾಹ",
    "issue.illegal_dumping": "ಅಕ್ರಮ ಡಂಪಿಂಗ್",
    "issue.illegal_parking": "ಅಕ್ರಮ ಪಾರ್ಕಿಂಗ್",
    "issue.other": "ಇತರೆ",
    "upload.takePhoto": "ಫೋಟೋ ತೆಗೆಯಿರಿ",
    "upload.uploadPhoto": "ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    "upload.removePhoto": "ಫೋಟೋ ತೆಗೆದುಹಾಕಿ",
    "success.title": "ವರದಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!",
    "success.description":
      "ನಿಮ್ಮ ನಾಗರಿಕ ವರದಿಯನ್ನು ಉಳಿಸಲಾಗಿದೆ. ಈಗ ನೀವು ನಿಮ್ಮ ಪ್ರಮಾಣಪತ್ರವನ್ನು ರಚಿಸಬಹುದು ಮತ್ತು ಡೌನ್‌ಲೋಡ್ ಮಾಡಬಹುದು.",
    "common.primeMinister": "ಪ್ರಧಾನ ಮಂತ್ರಿ",
    "common.chiefMinister": "ಮುಖ್ಯಮಂತ್ರಿ",
  },

  bho: {
    "header.title": "नागरिक रिपोर्टर",
    "header.subtitle": "साफ-सुथरा, बेहतर भारत बनावल",
    "form.title": "रिपोर्ट जमा करीं आ NFT सर्टिफिकेट डाउनलोड करीं",
    "form.subtitle":
      "नागरिक समस्या के रिपोर्ट करके अपना समुदाय के बेहतर बनावे में मदद करीं",
    "form.issueType.title": "रउआ कवन तरह के नागरिक समस्या के रिपोर्ट कर रहल बानी?",
    "form.issueType.description": "समस्या के सबसे बढ़िया बर्णन करे वाला श्रेणी चुनीं",
    "form.photo.title": "समस्या के फोटो अपलोड करीं *",
    "form.photo.description": "नागरिक समस्या देखावे वाला साफ फोटो लीं",
    "form.submit": "रिपोर्ट जमा करीं",
    "form.submitting": "रिपोर्ट जमा हो रहल बा...",
    "certificate.download": "सर्टिफिकेट",
    "certificate.share": "शेयर करीं",
    "reports.title": "हाल के रिपोर्ट",
    "roadmap.title": "विकास रोडमैप",
    "roadmap.subtitle": "हमार प्रगति आ आवे वाला फीचर के ट्रैक करीं",
    "roadmap.implemented.title": "लागू कइल गइल फीचर",
    "roadmap.underConsideration.title": "विचार में",
    "roadmap.upcoming.title": "आवे वाला/योजना बनल फीचर",
    "roadmap.addFeature": "फीचर जोड़ीं",
    "roadmap.totalFeatures": "कुल फीचर",
    "roadmap.implemented": "लागू",
    "roadmap.inProgress": "प्रगति में",
    "roadmap.planned": "योजना बनल",
    "common.loading": "लोड हो रहल बा...",
    "common.status.open": "खुला",
    "common.status.resolved": "हल हो गइल",
    "footer.support": "एह कोशिश के समर्थन करीं आ हमरा एगो कॉफी किनीं",
    "issue.pothole": "गड्ढा",
    "issue.garbage": "सड़क किनारे कचरा",
    "issue.streetlight": "टूटल स्ट्रीट लाइट",
    "issue.waterlogging": "पानी भराव",
    "issue.flood": "बाढ़",
    "issue.illegal_dumping": "गैरकानूनी डंपिंग",
    "issue.illegal_parking": "गैरकानूनी पार्किंग",
    "issue.other": "दोसरा",
    "upload.takePhoto": "फोटो लीं",
    "upload.uploadPhoto": "फोटो अपलोड करीं",
    "upload.removePhoto": "फोटो हटाईं",
    "success.title": "रिपोर्ट सफलता से जमा हो गइल!",
    "success.description":
      "रउआ के नागरिक रिपोर्ट सेव हो गइल बा। अब रउआ अपना सर्टिफिकेट बना के डाउनलोड कर सकत बानी।",
    "common.primeMinister": "प्रधान मंत्री",
    "common.chiefMinister": "मुख्यमंत्री",
  },
};

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    languages[0],
  );

  // Load saved language from localStorage on mount
  useEffect(() => {
    const savedLanguageCode = localStorage.getItem("selectedLanguage");
    if (savedLanguageCode) {
      const savedLanguage = languages.find(
        (lang) => lang.code === savedLanguageCode,
      );
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
      }
    }
  }, []);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem("selectedLanguage", language.code);
  };

  const t = (key: string): string => {
    // Get the current language's translations
    const currentTranslations = translations[currentLanguage.code];

    // If translation exists in current language, return it
    if (currentTranslations && currentTranslations[key]) {
      return currentTranslations[key];
    }

    // Fallback to English if translation not found in current language
    const englishTranslations = translations["en"];
    if (englishTranslations && englishTranslations[key]) {
      return englishTranslations[key];
    }

    // Return the key itself if no translation found anywhere
    console.warn(
      `Translation missing for key: ${key} in language: ${currentLanguage.code}`,
    );
    return key;
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
