import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "~/client/api";
import { encodeFileAsBase64DataURL, useToast } from "~/client/utils";
import { motion } from "framer-motion";
import {
  Upload,
  Leaf,
  AlertCircle,
  ArrowLeft,
  Camera,
  FileUp,
  Loader,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Progress,
  Separator,
} from "~/components/ui";

// Types
type Language = "en" | "hi" | "kn" | "mr" | "te" | "ta";

// Helper function to format treatment steps with each step on a new line
function formatTreatmentSteps(treatment: string, language: Language) {
  // Split the treatment text by numbers followed by periods (e.g., "1. ", "2. ")
  const steps = treatment.split(/(?=\d+\.\s)/g);
  
  return steps.map((step, index) => {
    // Translate common treatment terms based on language
    let translatedStep = step;
    
    // Apply translations for common treatment terms
    if (language !== "en") {
      // Common organic treatment terms
      if (language === "hi") {
        translatedStep = translatedStep
          .replace(/neem oil/gi, "नीम तेल")
          .replace(/compost/gi, "खाद")
          .replace(/organic/gi, "जैविक")
          .replace(/fungicides/gi, "फफूंदनाशक")
          .replace(/remove/gi, "हटाएं")
          .replace(/apply/gi, "लगाएं");
      } else if (language === "kn") {
        translatedStep = translatedStep
          .replace(/neem oil/gi, "ಬೇವಿನ ಎಣ್ಣೆ")
          .replace(/compost/gi, "ಕಾಂಪೋಸ್ಟ್")
          .replace(/organic/gi, "ಜೈವಿಕ")
          .replace(/fungicides/gi, "ಶಿಲೀಂಧ್ರನಾಶಕಗಳು")
          .replace(/remove/gi, "ತೆಗೆದುಹಾಕಿ")
          .replace(/apply/gi, "ಅನ್ವಯಿಸಿ");
      } else if (language === "mr") {
        translatedStep = translatedStep
          .replace(/neem oil/gi, "निंबोळी तेल")
          .replace(/compost/gi, "कंपोस्ट")
          .replace(/organic/gi, "सेंद्रिय")
          .replace(/fungicides/gi, "बुरशीनाशके")
          .replace(/remove/gi, "काढून टाका")
          .replace(/apply/gi, "लावा");
      } else if (language === "te") {
        translatedStep = translatedStep
          .replace(/neem oil/gi, "వేప నూనె")
          .replace(/compost/gi, "కంపోస్ట్")
          .replace(/organic/gi, "ఆర్గానిక్")
          .replace(/fungicides/gi, "శిలీంధ్రనాశినులు")
          .replace(/remove/gi, "తొలగించండి")
          .replace(/apply/gi, "వర్తించండి");
      } else if (language === "ta") {
        translatedStep = translatedStep
          .replace(/neem oil/gi, "வேப்ப எண்ணெய்")
          .replace(/compost/gi, "உரம்")
          .replace(/organic/gi, "இயற்கை")
          .replace(/fungicides/gi, "பூஞ்சைக்கொல்லிகள்")
          .replace(/remove/gi, "அகற்றவும்")
          .replace(/apply/gi, "பயன்படுத்தவும்");
      }
    }
    
    return (
      <div key={index} className="mb-2">
        {translatedStep}
      </div>
    );
  });
}

type Translations = {
  [key: string]: {
    [key in Language]: string;
  };
};

const translations: Translations = {
  appName: {
    en: "GreenShield.AI",
    hi: "ग्रीनशील्ड.एआई",
    kn: "ಗ್ರೀನ್‌ಶೀಲ್ಡ್.ಎಐ",
    mr: "ग्रीनशिल्ड.एआय",
    te: "గ్రీన్‌షీల్డ్.ఎఐ",
    ta: "கிரீன்ஷீல்டு.ஏஐ"
  },
  tagline: {
    en: "Upload a photo of your plant's leaf and our AI will identify potential diseases, provide detailed information, and suggest organic and inorganic treatment solutions.",
    hi: "अपने पौधे की पत्ती की एक तस्वीर अपलोड करें और हमारा AI संभावित बीमारियों की पहचान करेगा, विस्तृत जानकारी प्रदान करेगा, और जैविक और अजैविक उपचार समाधान सुझाएगा।",
    kn: "ನಿಮ್ಮ ಸಸ್ಯದ ಎಲೆಯ ಫೋಟೋವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ನಮ್ಮ AI ಸಂಭಾವ್ಯ ರೋಗಗಳನ್ನು ಗುರುತಿಸುತ್ತದೆ, ವಿವರವಾದ ಮಾಹಿತಿಯನ್ನು ನೀಡುತ್ತದೆ, ಮತ್ತು ಜೈವಿಕ ಮತ್ತು ಅಜೈವಿಕ ಚಿಕಿತ್ಸೆ ಪರಿಹಾರಗಳನ್ನು ಸೂಚಿಸುತ್ತದೆ.",
    mr: "आपल्या वनस्पतीच्या पानाचा फोटो अपलोड करा आणि आमचे AI संभाव्य रोगांची ओळख करेल, तपशीलवार माहिती देईल, आणि सेंद्रिय आणि असेंद्रिय उपचार उपाय सुचवेल.",
    te: "మీ మొక్క ఆకు యొక్క ఫోటోను అప్‌లోడ్ చేయండి మరియు మా AI సంభావ్య వ్యాధులను గుర్తిస్తుంది, వివరణాత్మక సమాచారాన్ని అందిస్తుంది, మరియు ఆర్గానిక్ మరియు అజైవిక చికిత్స పరిష్కారాలను సూచిస్తుంది.",
    ta: "உங்கள் தாவரத்தின் இலையின் படத்தை பதிவேற்றவும், எங்கள் AI சாத்தியமான நோய்களை அடையாளம் காணும், விரிவான தகவலை வழங்கும், மற்றும் இயற்கை மற்றும் இரசாயன சிகிச்சை தீர்வுகளை பரிந்துரைக்கும்."
  },
  uploadPhotoTitle: {
    en: "Upload a leaf photo",
    hi: "पत्ती की फोटो अपलोड करें",
    kn: "ಎಲೆಯ ಫೋಟೋವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    mr: "पानाचा फोटो अपलोड करा",
    te: "ఆకు ఫోటోను అప్‌లోడ్ చేయండి",
    ta: "இலை படத்தை பதிவேற்றவும்"
  },
  dragAndDrop: {
    en: "Drag and drop or click to upload",
    hi: "खींचें और छोड़ें या अपलोड करने के लिए क्लिक करें",
    kn: "ಎಳೆದು ಬಿಡಿ ಅಥವಾ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ",
    mr: "ड्रॅग आणि ड्रॉप करा किंवा अपलोड करण्यासाठी क्लिक करा",
    te: "డ్రాగ్ అండ్ డ్రాప్ చేయండి లేదా అప్‌లోడ్ చేయడానికి క్లిక్ చేయండి",
    ta: "இழுத்து விடவும் அல்லது பதிவேற்ற கிளிக் செய்யவும்"
  },
  browseFiles: {
    en: "Browse Files",
    hi: "फ़ाइलें ब्राउज़ करें",
    kn: "ಫೈಲ್‌ಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ",
    mr: "फाईल्स ब्राउझ करा",
    te: "ఫైల్‌లను బ్రౌజ్ చేయండి",
    ta: "கோப்புகளை உலாவு"
  },
  takePhoto: {
    en: "Take Photo",
    hi: "फोटो लें",
    kn: "ಫೋಟೋ ತೆಗೆಯಿರಿ",
    mr: "फोटो काढा",
    te: "ఫోటో తీయండి",
    ta: "புகைப்படம் எடுக்க"
  },
  analyzing: {
    en: "Analyzing your leaf...",
    hi: "आपकी पत्ती का विश्लेषण किया जा रहा है...",
    kn: "ನಿಮ್ಮ ಎಲೆಯನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
    mr: "आपल्या पानाचे विश्लेषण केले जात आहे...",
    te: "మీ ఆకును విశ్లేషిస్తోంది...",
    ta: "உங்கள் இலையை பகுப்பாய்வு செய்கிறது..."
  },
  takesTime: {
    en: "This may take a few moments",
    hi: "इसमें कुछ समय लग सकता है",
    kn: "ಇದು ಕೆಲವು ಕ್ಷಣಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಬಹುದು",
    mr: "यास काही क्षण लागू शकतात",
    te: "ఇది కొన్ని క్షణాలు పట్టవచ్చు",
    ta: "இது சில நிமிடங்கள் ஆகலாம்"
  },
  howItWorks: {
    en: "How it works",
    hi: "यह कैसे काम करता है",
    kn: "ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ",
    mr: "हे कसे काम करते",
    te: "ఇది ఎలా పనిచేస్తుంది",
    ta: "இது எப்படி செயல்படுகிறது"
  },
  uploadAPhoto: {
    en: "Upload a Photo",
    hi: "एक फोटो अपलोड करें",
    kn: "ಫೋಟೋವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    mr: "फोटो अपलोड करा",
    te: "ఫోటోను అప్‌లోడ్ చేయండి",
    ta: "ஒரு படத்தை பதிவேற்றவும்"
  },
  takeAClearPhoto: {
    en: "Take a clear photo of the affected leaf",
    hi: "प्रभावित पत्ती की एक स्पष्ट तस्वीर लें",
    kn: "ಪ್ರಭಾವಿತ ಎಲೆಯ ಸ್ಪಷ್ಟ ಫೋಟೋವನ್ನು ತೆಗೆಯಿರಿ",
    mr: "प्रभावित पानाचा स्पष्ट फोटो काढा",
    te: "ప్రభావిత ఆకు యొక్క స్పష్టమైన ఫోటోను తీయండి",
    ta: "பாதிக்கப்பட்ட இலையின் தெளிவான படத்தை எடுக்கவும்"
  },
  aiAnalysis: {
    en: "AI Analysis",
    hi: "AI विश्लेषण",
    kn: "AI ವಿಶ್ಲೇಷಣೆ",
    mr: "AI विश्लेषण",
    te: "AI విశ్లేషణ",
    ta: "AI பகுப்பாய்வு"
  },
  aiIdentifies: {
    en: "Our AI identifies the disease and its severity",
    hi: "हमारा AI बीमारी और उसकी गंभीरता की पहचान करता है",
    kn: "ನಮ್ಮ AI ರೋಗ ಮತ್ತು ಅದರ ತೀವ್ರತೆಯನ್ನು ಗುರುತಿಸುತ್ತದೆ",
    mr: "आमचे AI रोग आणि त्याची तीव्रता ओळखते",
    te: "మా AI వ్యాధిని మరియు దాని తీవ్రతను గుర్తిస్తుంది",
    ta: "எங்கள் AI நோயையும் அதன் தீவிரத்தையும் கண்டறிகிறது"
  },
  getTreatment: {
    en: "Get Treatment",
    hi: "उपचार प्राप्त करें",
    kn: "ಚಿಕಿತ್ಸೆ ಪಡೆಯಿರಿ",
    mr: "उपचार मिळवा",
    te: "చికిత్స పొందండి",
    ta: "சிகிச்சை பெறுங்கள்"
  },
  receiveDetailed: {
    en: "Receive detailed treatment recommendations",
    hi: "विस्तृत उपचार सिफारिशें प्राप्त करें",
    kn: "ವಿವರವಾದ ಚಿಕಿತ್ಸೆಯ ಶಿಫಾರಸುಗಳನ್ನು ಪಡೆಯಿರಿ",
    mr: "तपशीलवार उपचार शिफारसी प्राप्त करा",
    te: "వివరణాత్మక చికిత్స సిఫార్సులను పొందండి",
    ta: "விரிவான சிகிச்சை பரிந்துரைகளைப் பெறுங்கள்"
  },
  backToScanner: {
    en: "Back to Scanner",
    hi: "स्कैनर पर वापस जाएं",
    kn: "ಸ್ಕ್ಯಾನರ್‌ಗೆ ಹಿಂತಿರುಗಿ",
    mr: "स्कॅनरकडे परत जा",
    te: "స్కానర్‌కి తిరిగి వెళ్ళండి",
    ta: "ஸ்கேனருக்குத் திரும்பு"
  },
  confidenceLevel: {
    en: "Confidence Level",
    hi: "विश्वास स्तर",
    kn: "ವಿಶ್ವಾಸ ಮಟ್ಟ",
    mr: "विश्वास पातळी",
    te: "నమ్మకం స్థాయి",
    ta: "நம்பிக்கை நிலை"
  },
  scannedOn: {
    en: "Scanned on",
    hi: "स्कैन किया गया",
    kn: "ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ ದಿನಾಂಕ",
    mr: "स्कॅन केलेली तारीख",
    te: "స్కాన్ చేసిన తేదీ",
    ta: "ஸ்கேன் செய்யப்பட்ட தேதி"
  },
  symptoms: {
    en: "Symptoms",
    hi: "लक्षण",
    kn: "ರೋಗಲಕ್ಷಣಗಳು",
    mr: "लक्षणे",
    te: "లక్షణాలు",
    ta: "அறிகுறிகள்"
  },
  treatmentRecommendations: {
    en: "Treatment Recommendations",
    hi: "उपचार की सिफारिशें",
    kn: "ಚಿಕಿತ್ಸೆಯ ಶಿಫಾರಸುಗಳು",
    mr: "उपचार शिफारसी",
    te: "చికిత్స సిఫార్సులు",
    ta: "சிகிச்சை பரிந்துரைகள்"
  },
  scanAnotherLeaf: {
    en: "Scan Another Leaf",
    hi: "एक और पत्ती स्कैन करें",
    kn: "ಮತ್ತೊಂದು ಎಲೆಯನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
    mr: "आणखी एक पान स्कॅन करा",
    te: "మరొక ఆకును స్కాన్ చేయండి",
    ta: "மற்றொரு இலையை ஸ்கேன் செய்யுங்கள்"
  },
  scanner: {
    en: "Scanner",
    hi: "स्कैनर",
    kn: "ಸ್ಕ್ಯಾನರ್",
    mr: "स्कॅनर",
    te: "స్కానర్",
    ta: "ஸ்கேனர்"
  },
  errorLoadingResults: {
    en: "Error Loading Results",
    hi: "परिणाम लोड करने में त्रुटि",
    kn: "ಫಲಿತಾಂಶಗಳನ್ನು ಲೋಡ್ ಮಾಡುವಲ್ಲಿ ದೋಷ",
    mr: "परिणाम लोड करताना त्रुटी",
    te: "ఫలితాలను లోడ్ చేయడంలో లోపం",
    ta: "முடிவுகளை ஏற்றுவதில் பிழை"
  },
  couldntFindResults: {
    en: "We couldn't find the scan results you're looking for.",
    hi: "हम आपके द्वारा खोजे जा रहे स्कैन परिणाम नहीं ढूंढ सके।",
    kn: "ನೀವು ಹುಡುಕುತ್ತಿರುವ ಸ್ಕ್ಯಾನ್ ಫಲಿತಾಂಶಗಳನ್ನು ನಾವು ಕಂಡುಕೊಳ್ಳಲಾಗಲಿಲ್ಲ.",
    mr: "आपण शोधत असलेले स्कॅन परिणाम आम्हाला सापडले नाहीत.",
    te: "మీరు వెతుకుతున్న స్కాన్ ఫలితాలను మేము కనుగొనలేకపోయాము.",
    ta: "நீங்கள் தேடும் ஸ்கேன் முடிவுகளை எங்களால் கண்டுபிடிக்க முடியவில்லை."
  },
  tryAnotherScan: {
    en: "Try Another Scan",
    hi: "एक और स्कैन का प्रयास करें",
    kn: "ಮತ್ತೊಂದು ಸ್ಕ್ಯಾನ್ ಪ್ರಯತ್ನಿಸಿ",
    mr: "आणखी एक स्कॅन प्रयत्न करा",
    te: "మరొక స్కాన్ ప్రయత్నించండి",
    ta: "மற்றொரு ஸ்கேனை முயற்சிக்கவும்"
  },
  errorAnalyzingLeaf: {
    en: "Error analyzing leaf",
    hi: "पत्ती का विश्लेषण करने में त्रुटि",
    kn: "ಎಲೆಯನ್ನು ವಿಶ್ಲೇಷಿಸುವಲ್ಲಿ ದೋಷ",
    mr: "पान विश्लेषण करताना त्रुटी",
    te: "ఆకును విశ్లేషించడంలో లోపం",
    ta: "இலையை பகுப்பாய்வு செய்வதில் பிழை"
  },
  errorProcessingImage: {
    en: "Error processing image",
    hi: "छवि संसाधित करने में त्रुटि",
    kn: "ಚಿತ್ರವನ್ನು ಸಂಸ್ಕರಿಸುವಲ್ಲಿ ದೋಷ",
    mr: "प्रतिमा प्रक्रिया करताना त्रुटी",
    te: "చిత్రాన్ని ప్రాసెస్ చేయడంలో లోపం",
    ta: "படத்தை செயலாக்குவதில் பிழை"
  },
  pleaseAnotherImage: {
    en: "Please try another image",
    hi: "कृपया एक और छवि का प्रयास करें",
    kn: "ದಯವಿಟ್ಟು ಮತ್ತೊಂದು ಚಿತ್ರವನ್ನು ಪ್ರಯತ್ನಿಸಿ",
    mr: "कृपया आणखी एक प्रतिमा प्रयत्न करा",
    te: "దయచేసి మరొక చిత్రాన్ని ప్రయత్నించండి",
    ta: "தயவுசெய்து மற்றொரு படத்தை முயற்சிக்கவும்"
  },
  footer: {
    en: "AI-powered Plant Disease scanning and Solutions",
    hi: "AI-संचालित पौधे के रोग स्कैनिंग और समाधान",
    kn: "AI-ಆಧಾರಿತ ಸಸ್ಯ ರೋಗ ಸ್ಕ್ಯಾನಿಂಗ್ ಮತ್ತು ಪರಿಹಾರಗಳು",
    mr: "AI-संचालित वनस्पती रोग स्कॅनिंग आणि उपाय",
    te: "AI-ఆధారిత మొక్కల వ్యాధి స్కానింగ్ మరియు పరిష్కారాలు",
    ta: "AI-இயக்கப்படும் தாவர நோய் ஸ்கேனிங் மற்றும் தீர்வுகள்"
  },
  organicTreatments: {
    en: "Organic Treatments",
    hi: "जैविक उपचार",
    kn: "ಜೈವಿಕ ಚಿಕಿತ್ಸೆಗಳು",
    mr: "सेंद्रिय उपचार",
    te: "ఆర్గానిక్ చికిత్సలు",
    ta: "இயற்கை சிகிச்சைகள்"
  },
  inorganicTreatments: {
    en: "Inorganic Treatments",
    hi: "अजैविक उपचार",
    kn: "ಅಜೈವಿಕ ಚಿಕಿತ್ಸೆಗಳು",
    mr: "असेंद्रिय उपचार",
    te: "అజైవిక చికిత్సలు",
    ta: "இரசாயன சிகிச்சைகள்"
  },
  changeLanguage: {
    en: "Change Language",
    hi: "भाषा बदलें",
    kn: "ಭಾಷೆ ಬದಲಾಯಿಸಿ",
    mr: "भाषा बदला",
    te: "భాష మార్చండి",
    ta: "மொழியை மாற்று"
  }
};

type ScanResult = {
  id: string;
  imageUrl: string;
  disease: string;
  confidence: number;
  description: string;
  symptoms: string;
  treatment: string;
  createdAt: string;
};

// File Upload Component
function FileUploader({
  onFileSelect,
}: {
  onFileSelect: (file: File) => void;
}) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) {
        onFileSelect(file);
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
        isDragging ? "border-primary bg-primary/10" : "border-border"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="bg-primary/10 p-4 rounded-full">
          <Upload className="h-10 w-10 text-primary" />
        </div>
        <div>
                  <h3 className="text-lg font-semibold">{t("uploadPhotoTitle")}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t("dragAndDrop")}
        </p>
        </div>
        <div className="flex gap-4 mt-4">
          <Button onClick={triggerFileInput} className="gap-2">
            <FileUp className="h-4 w-4" />
            {t("browseFiles")}
          </Button>
          <Button
            variant="outline"
            onClick={triggerFileInput}
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            {t("takePhoto")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Home Page
function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  const analyzeMutation = useMutation(apiClient.analyzePlantLeaf, {
    onSuccess: (data) => {
      navigate(`/results/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: t("errorAnalyzingLeaf"),
        description:
          error instanceof Error ? error.message : t("pleaseAnotherImage"),
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (file: File) => {
    try {
      const base64 = await encodeFileAsBase64DataURL(file);
      analyzeMutation.mutate({ imageBase64: base64 });
    } catch (error) {
      toast({
        title: t("errorProcessingImage"),
        description: t("pleaseAnotherImage"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
            <Leaf className="h-8 w-8 text-primary" />
            {t("appName")}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("tagline")}
          </p>
        </div>

        {analyzeMutation.isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Loader className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold">{t("analyzing")}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t("takesTime")}
            </p>
          </div>
        ) : (
          <FileUploader onFileSelect={handleFileSelect} />
        )}

        <div className="mt-12 bg-accent rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">{t("howItWorks")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">{t("uploadAPhoto")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("takeAClearPhoto")}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">{t("aiAnalysis")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("aiIdentifies")}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <AlertCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">{t("getTreatment")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("receiveDetailed")}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Results Page
function ResultsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();

  const {
    data: scan,
    isLoading,
    error,
  } = useQuery(["scan", id], () => apiClient.getScan({ id: id! }), {
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Loader className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t("errorLoadingResults")}</h2>
        <p className="text-muted-foreground mb-6">
          {t("couldntFindResults")}
        </p>
        <Button onClick={() => navigate("/")}>{t("tryAnotherScan")}</Button>
      </div>
    );
  }

  const confidencePercent = Math.round(scan.confidence * 100);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("backToScanner")}
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <Card className="overflow-hidden">
              <img
                src={scan.imageUrl}
                alt="Plant leaf"
                className="w-full h-64 object-cover"
              />
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{t("confidenceLevel")}</h3>
                  <span className="text-sm font-medium">
                    {confidencePercent}%
                  </span>
                </div>
                <Progress value={confidencePercent} className="h-2" />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{scan.disease}</CardTitle>
                <CardDescription>
                  {t("scannedOn")} {new Date(scan.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {scan.description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>{t("symptoms")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{scan.symptoms}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("treatmentRecommendations")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">{t("organicTreatments")}</h3>
                  <div className="text-sm text-muted-foreground">
                    {formatTreatmentSteps(scan.organicTreatment, language)}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">{t("inorganicTreatments")}</h3>
                  <div className="text-sm text-muted-foreground">
                    {formatTreatmentSteps(scan.inorganicTreatment, language)}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button
                onClick={() => navigate("/")}
                className="w-full md:w-auto"
              >
                {t("scanAnotherLeaf")}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

// Navigation Component
function Navigation() {
  const { t } = useLanguage();
  
  return (
    <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">{t("appName")}</span>
          </Link>
          <nav className="flex items-center gap-4">
            <LanguageSelector />
            <Link to="/">
              <Button variant="ghost" size="sm">
                {t("scanner")}
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

// Language Provider
function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Language Context
type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = React.createContext<LanguageContextType>({
  language: "en",
  setLanguage: (_lang: Language) => { /* Default implementation, will be overridden */ },
  t: (key) => key,
});

const useLanguage = () => React.useContext(LanguageContext);

// Language Selector Component
function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="bg-background border border-input rounded-md text-sm px-2 py-1"
      >
        <option value="en">English</option>
        <option value="hi">हिन्दी</option>
        <option value="kn">ಕನ್ನಡ</option>
        <option value="mr">मराठी</option>
        <option value="te">తెలుగు</option>
        <option value="ta">தமிழ்</option>
      </select>
    </div>
  );
}

// Main App Component
export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          <Navigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/results/:id" element={<ResultsPage />} />
            </Routes>
          </main>
          <footer className="border-t py-6">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} GreenShield.AI •{" "}
              <LanguageContext.Consumer>
                {({ t }) => t("footer")}
              </LanguageContext.Consumer>
            </div>
          </footer>
        </div>
      </LanguageProvider>
    </Router>
  );
}

// Helper Components
function useParams<T extends Record<string, string | undefined>>(): T {
  const params = new URLSearchParams(window.location.search);
  const pathSegments = window.location.pathname.split("/").filter(Boolean);

  // For this simple implementation, we'll assume the last segment is the ID
  const id = pathSegments[pathSegments.length - 1];

  return { id } as unknown as T;
}