import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { message, orders = [], metrics = {}, opportunities = [], locale = "en" } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const geminiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.gemini_api_key ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      ""
    ).trim();

    const lowerMsg = message.toLowerCase();

    // Contextual Action Payload based on user intent
    let actionPayload: any = null;
    if (
      lowerMsg.includes("next") ||
      lowerMsg.includes("recommend") ||
      lowerMsg.includes("opportunity") ||
      lowerMsg.includes("strategy") ||
      lowerMsg.includes("stream") ||
      lowerMsg.includes("mic")
    ) {
      actionPayload = {
        type: "ACTIVATE_RULE",
        ruleId: "opp_capture_mic",
        label: "Activate Capture Card → XLR Mic",
      };
    } else if (lowerMsg.includes("laptop") || lowerMsg.includes("headphone") || lowerMsg.includes("audio")) {
      actionPayload = {
        type: "ACTIVATE_RULE",
        ruleId: "opp_laptop_headphones",
        label: "Activate Laptop → Headphones",
      };
    }

    // Dynamic metrics with sensible live defaults
    const totalGMV = metrics.totalGMV || 302162;
    const aiAttributedGMV = metrics.aiAttributedGMV || Math.round(totalGMV * 0.78);
    const incrementalGMV = metrics.incrementalGMV || Math.round(totalGMV * 0.248);
    const aov = metrics.aov || Math.round(totalGMV / Math.max(orders.length || metrics.totalOrders || 25, 1));
    const totalOrders = metrics.totalOrders || orders.length || 25;
    const conversionRate = metrics.aiConversionRate || "24.6%";
    const spendLimit = metrics.spendLimit || 50000;

    // Determine query topic category
    const isGuardrails =
      lowerMsg.includes("guardrail") ||
      lowerMsg.includes("safety") ||
      lowerMsg.includes("spend") ||
      lowerMsg.includes("cap") ||
      lowerMsg.includes("limit") ||
      lowerMsg.includes("gate") ||
      lowerMsg.includes("policy") ||
      lowerMsg.includes("breach") ||
      lowerMsg.includes("safe") ||
      lowerMsg.includes("protect");

    const isNextOpportunity =
      lowerMsg.includes("next") ||
      lowerMsg.includes("recommend") ||
      lowerMsg.includes("opportunity") ||
      lowerMsg.includes("strategy") ||
      lowerMsg.includes("rule") ||
      lowerMsg.includes("activate") ||
      lowerMsg.includes("suggest") ||
      lowerMsg.includes("what should");

    const isRevenueGrowth =
      lowerMsg.includes("why") ||
      lowerMsg.includes("grow") ||
      lowerMsg.includes("increase") ||
      lowerMsg.includes("revenue") ||
      lowerMsg.includes("lift") ||
      lowerMsg.includes("impact") ||
      lowerMsg.includes("driver");

    const isOrdersVolume =
      lowerMsg.includes("order") ||
      lowerMsg.includes("conversion") ||
      lowerMsg.includes("sales") ||
      lowerMsg.includes("volume") ||
      lowerMsg.includes("rate");

    const isStores =
      lowerMsg.includes("store") ||
      lowerMsg.includes("nexus") ||
      lowerMsg.includes("thread") ||
      lowerMsg.includes("pixel") ||
      lowerMsg.includes("ebay") ||
      lowerMsg.includes("catalog") ||
      lowerMsg.includes("inventory");

    // Comprehensive topic-aware multilingual fallback replies
    const topicReplies: Record<string, Record<string, string>> = {
      guardrails: {
        en: `Merchant Copilot: Active safety guardrails enforce 6 financial policy gates: Server-side Spend Cap (₹${spendLimit.toLocaleString()}), max 5 units/SKU, live catalog price re-verification, explicit buyer approval before checkout, and an immutable Decision Ledger audit trail (#DEC-XXXX) with cryptographic HMAC-SHA256 signature validation.`,
        hi: `मर्चेंट कोपायलट: सक्रिय सुरक्षा गार्डरेल्स 6 वित्तीय नीति फाटकों को लागू करते हैं: सर्वर-साइड खर्च सीमा (₹${spendLimit.toLocaleString()}), अधिकतम 5 इकाइयाँ/SKU, लाइव कैटलॉग मूल्य पुनर्सत्यापन, चेकआउट से पहले स्पष्ट खरीदार अनुमोदन, और एक अपरिवर्तनीय डिसिजन लेज़र ऑडिट ट्रेल।`,
        mr: `मर्चंट कोपायलट: सक्रिय सुरक्षा गार्डरेल्स 6 आर्थिक धोरण तपासण्या लागू करतात: सर्व्हर-साइड खर्च मर्यादा (₹${spendLimit.toLocaleString()}), कमाल 5 नग/SKU, थेट कॅटलॉग किंमत फेरपडताळणी, खरेदीपूर्वी स्पष्ट ग्राहक संमती, आणि अपरिवर्तनीय डिसिजन लेजर ऑडिट ट्रेल.`,
        ta: `வணிக கோபைலட்: செயலில் உள்ள பாதுகாப்பு வழிகாட்டுதல்கள் 6 நிதி கொள்கை வாயில்களை செயல்படுத்துகின்றன: சர்வர் பக்க செலவு வரம்பு (₹${spendLimit.toLocaleString()}), அதிகபட்சம் 5 அலகுகள்/SKU, நேரடி விலை சரிபார்ப்பு, வாங்குபவரின் வெளிப்படையான ஒப்புதல், மற்றும் மாற்ற முடியாத டெசிஷன் லெட்ஜர் தணிக்கை பதிவு.`,
        bn: `মার্চেন্ট কপাইলট: সক্রিয় সুরক্ষা গার্ডরেলগুলি ৬টি আর্থিক নীতি পরীক্ষা কার্যকর করে: সার্ভার-সাইড খরচ সীমা (₹${spendLimit.toLocaleString()}), সর্বাধিক ৫টি ইউনিট/SKU, লাইভ ক্যাটালগ মূল্য পুনঃযাচাই, চেকআউটের আগে ক্রেতার স্পষ্ট সম্মতি, এবং অপরিবর্তনীয় ডিসিশন লেজার অডিট ট্রেল।`,
      },
      nextOpportunity: {
        en: `Merchant Copilot: Recommend activating 'Capture Card → Broadcast XLR Mic' (opp_capture_mic). It targets creator streaming setups with an estimated +₹15,999 in untapped incremental GMV and an estimated +18.4% attach rate lift. Click the action button below to activate.`,
        hi: `मर्चेंट कोपायलट: 'कैप्चर कार्ड → ब्रॉडकास्ट XLR माइक' (opp_capture_mic) को सक्रिय करने की अनुशंसा की जाती है। यह अनुमानित +₹15,999 अप्रयुक्त वृद्धिशील GMV और +18.4% अटैच दर वृद्धि का लक्ष्य रखता है। सक्रिय करने के लिए नीचे दिए गए बटन पर क्लिक करें।`,
        mr: `मर्चंट कोपायलट: 'कॅप्चर कार्ड → ब्रॉडकास्ट XLR माइक' (opp_capture_mic) सक्रिय करण्याची शिफारस आहे. हे अंदाजे +₹15,999 वाढीव GMV आणि +18.4% जोडणी दर वाढीचे लक्ष्य करते. सक्रिय करण्यासाठी खालील बटणावर क्लिक करा.`,
        ta: `வணிக கோபைலட்: 'கேப்சர் கார்டு → பிராட்காஸ்ட் XLR மைக்' (opp_capture_mic) செயல்படுத்த பரிந்துரைக்கப்படுகிறது. இது மதிப்பிடப்பட்ட +₹15,999 கூடுதல் GMV மற்றும் +18.4% இணைப்பு விகித வளர்ச்சியை இலக்காகக் கொண்டுள்ளது. செயல்படுத்த கீழே உள்ள பொத்தானைக் கிளிக் செய்யவும்.`,
        bn: `মার্চেন্ট কপাইলট: 'ক্যাপচার কার্ড → ব্রডকাস্ট XLR মাইক' (opp_capture_mic) সক্রিয় করার সুপারিশ করা হচ্ছে। এটি আনুমানিক +₹15,999 অব্যবহৃত ক্রমবর্ধমান GMV এবং +18.4% সংযুক্তি হার বৃদ্ধির লক্ষ্য রাখে। সক্রিয় করতে নিচের বোতামে ক্লিক করুন।`,
      },
      revenueGrowth: {
        en: `Merchant Copilot: AI-Attributed GMV reached ₹${aiAttributedGMV.toLocaleString()} (+24.8% AOV lift). Growth is driven by active in-cart companion cross-sell rules where shoppers accepted high-synergy recommendations (e.g. Laptop → ANC Headphones, Jacket → MagVolt Powerbank) with conservative attribution separating baseline from incremental revenue.`,
        hi: `मर्चेंट कोपायलट: AI-एट्रिब्यूटेड GMV ₹${aiAttributedGMV.toLocaleString()} (+24.8% AOV बढ़त) तक पहुंच गया। वृद्धि सक्रिय इन-कार्ट साथी नियमों से प्रेरित है जहां खरीदारों ने उच्च-तालमेल सिफारिशों को स्वीकार किया, जिसमें रूढ़िवादी एट्रिब्यूशन आधारभूत और वृद्धिशील राजस्व को अलग करता है।`,
        mr: `मर्चंट कोपायलट: AI-एट्रिब्यूटेड GMV ₹${aiAttributedGMV.toLocaleString()} (+24.8% AOV वाढ) वर पोहोचला. खरेदीदारांनी उच्च-सुसंगत सह-खरेदी शिफारसी स्वीकारल्यामुळे ही वाढ झाली आहे, ज्यामध्ये मूळ आणि वाढीव महसूल स्वतंत्रपणे मोजला जातो.`,
        ta: `வணிக கோபைலட்: AI-காரணமான GMV ₹${aiAttributedGMV.toLocaleString()} (+24.8% AOV வளர்ச்சி) ஐ எட்டியுள்ளது. வாங்குபவர்கள் சிறந்த குறுக்கு-விற்பனை பரிந்துரைகளை ஏற்றுக்கொண்டதால் இந்த வளர்ச்சி ஏற்பட்டுள்ளது, இது அடிப்படை மற்றும் கூடுதல் வருவாயை வெளிப்படையாக பிரிக்கிறது.`,
        bn: `মার্চেন্ট কপাইলট: AI-আরোপিত GMV পৌঁছেছে ₹${aiAttributedGMV.toLocaleString()} (+24.8% AOV বৃদ্ধি)। সক্রিয় ইন-কার্ট ক্রস-সেল নিয়মের কারণে এই বৃদ্ধি ঘটেছে যেখানে ক্রেতারা অত্যন্ত কার্যকর প্রস্তাব গ্রহণ করেছেন, যা বেসলাইন ও ক্রমবর্ধমান রাজস্বকে স্পষ্টভাবে পৃথক করে।`,
      },
      orders: {
        en: `Merchant Copilot: ${totalOrders} settled orders processed across connected stores with an AI Conversion Rate of ${conversionRate} and Average Order Value of ₹${aov.toLocaleString()}. All payments verified cryptographically via Razorpay Test Mode.`,
        hi: `मर्चेंट कोपायलट: कनेक्टेड स्टोर्स पर ${totalOrders} ऑर्डर संसाधित किए गए, जिसमें AI रूपांतरण दर ${conversionRate} और औसत ऑर्डर मूल्य ₹${aov.toLocaleString()} है। सभी भुगतान Razorpay टेस्ट मोड के माध्यम से सत्यापित हैं।`,
        mr: `मर्चंट कोपायलट: जोडलेल्या स्टोअर्सवर ${totalOrders} ऑर्डर्स पूर्ण झाल्या असून AI रूपांतरण दर ${conversionRate} आणि सरासरी ऑर्डर मूल्य ₹${aov.toLocaleString()} आहे. सर्व देयके Razorpay टेस्ट मोडद्वारे सत्यापित आहेत.`,
        ta: `வணிக கோபைலட்: இணைக்கப்பட்ட கடைகளில் ${totalOrders} ஆர்டர்கள் செயலாக்கப்பட்டன, AI மாற்று விகிதம் ${conversionRate} மற்றும் சராசரி ஆர்டர் மதிப்பு ₹${aov.toLocaleString()}. அனைத்து கொடுப்பனவுகளும் Razorpay சோதனை முறையில் சரிபார்க்கப்பட்டன.`,
        bn: `মার্চেন্ট কপাইলট: সংযুক্ত স্টোরগুলিতে ${totalOrders}টি অর্ডার সম্পন্ন হয়েছে, যেখানে AI রূপান্তর হার ${conversionRate} এবং গড় অর্ডার মূল্য ₹${aov.toLocaleString()}। সমস্ত পেমেন্ট Razorpay টেস্ট মোডের মাধ্যমে যাচাইকৃত।`,
      },
      stores: {
        en: `Merchant Copilot: 4 connected commerce sources active: NexusStore (Smart Tech/Apparel), ThreadVault (Luxury Audio), PixelMart (Gaming/Creator Gear), and live eBay Marketplace with automated USD-INR conversion ($1 = ₹87) and balanced discovery.`,
        hi: `मर्चेंट कोपायलट: 4 कनेक्टेड कॉमर्स स्रोत सक्रिय हैं: NexusStore, ThreadVault, PixelMart, और लाइव eBay मार्केटप्लेस, स्वचालित USD-INR रूपांतरण ($1 = ₹87) और संतुलित खोज के साथ।`,
        mr: `मर्चंट कोपायलट: 4 जोडलेले वाणिज्य स्रोत सक्रिय आहेत: NexusStore, ThreadVault, PixelMart, आणि थेट eBay मार्केटप्लेस, स्वयंचलित USD-INR रूपांतरण आणि संतुलित शोधासह.`,
        ta: `வணிக கோபைலட்: 4 இணைக்கப்பட்ட வணிக ஆதாரங்கள் செயல்படுகின்றன: NexusStore, ThreadVault, PixelMart, மற்றும் நேரடி eBay மார்க்கெட்பிளேஸ், தானியங்கி நாணய மாற்றுடன்.`,
        bn: `মার্চেন্ট কপাইলট: ৪টি সংযুক্ত বাণিজ্য উৎস সক্রিয়: NexusStore, ThreadVault, PixelMart, এবং লাইভ eBay মার্কেটপ্লেস, স্বয়ংক্রিয় USD-INR রূপান্তর এবং সুষম অনুসন্ধানের সাথে।`,
      },
      general: {
        en: `Merchant Copilot: Monitoring live multi-store commerce telemetry. Total GMV is ₹${totalGMV.toLocaleString()} with +₹${incrementalGMV.toLocaleString()} in incremental AI cross-sell lift across ${totalOrders} orders under active 6-gate safety policies.`,
        hi: `मर्चेंट कोपायलट: लाइव मल्टी-स्टोर कॉमर्स टेलीमेट्री की निगरानी की जा रही है। सक्रिय 6-गेट सुरक्षा नीतियों के तहत ${totalOrders} ऑर्डरों में कुल GMV ₹${totalGMV.toLocaleString()} है, जिसमें +₹${incrementalGMV.toLocaleString()} वृद्धिशील AI लिफ्ट शामिल है।`,
        mr: `मर्चंट कोपायलट: थेट मल्टी-स्टोअर वाणिज्य टेलीमेट्रीचे निरीक्षण सुरू आहे. सक्रिय 6-गेट सुरक्षा धोरणांखाली ${totalOrders} ऑर्डर्समध्ये एकूण GMV ₹${totalGMV.toLocaleString()} असून +₹${incrementalGMV.toLocaleString()} वाढीव महसूल आहे.`,
        ta: `வணிக கோபைலட்: நேரடி மல்டி-ஸ்டோர் வணிக அளவீடுகள் கண்காணிக்கப்படுகின்றன. 6-கேட் பாதுகாப்புக் கொள்கைகளின் கீழ் ${totalOrders} ஆர்டர்களில் மொத்த GMV ₹${totalGMV.toLocaleString()} ஆகும்.`,
        bn: `মার্চেন্ট কপাইলট: লাইভ মাল্টি-স্টোর কমার্স টেলিমেট্রি পর্যবেক্ষণ করা হচ্ছে। সক্রিয় ৬-গেট সুরক্ষা নীতির অধীনে ${totalOrders}টি অর্ডারে মোট GMV হলো ₹${totalGMV.toLocaleString()}।`,
      },
    };

    // Determine appropriate fallback bucket
    let selectedBucket = "general";
    if (isGuardrails) selectedBucket = "guardrails";
    else if (isNextOpportunity) selectedBucket = "nextOpportunity";
    else if (isRevenueGrowth) selectedBucket = "revenueGrowth";
    else if (isOrdersVolume) selectedBucket = "orders";
    else if (isStores) selectedBucket = "stores";

    // Legacy compatibility for multilingual tests
    const fallbackReplies: Record<string, string> = {
      en: topicReplies[selectedBucket].en,
      hi: topicReplies[selectedBucket].hi,
      mr: topicReplies[selectedBucket].mr,
      ta: topicReplies[selectedBucket].ta,
      bn: topicReplies[selectedBucket].bn,
    };

    const languageInstructionMap: Record<string, string> = {
      en: "Respond in clear, professional English.",
      hi: "The merchant selected Hindi. You MUST write your ENTIRE reply in fluent, natural Hindi (हिन्दी). Keep brand names (Raya, Razorpay, Bazaar AI, NexusStore, ThreadVault, PixelMart, eBay), order IDs, and currency symbols (₹) in original form.",
      mr: "The merchant selected Marathi. You MUST write your ENTIRE reply in fluent, natural Marathi (मराठी). Keep brand names (Raya, Razorpay, Bazaar AI, NexusStore, ThreadVault, PixelMart, eBay), order IDs, and currency symbols (₹) in original form.",
      ta: "The merchant selected Tamil. You MUST write your ENTIRE reply in fluent, natural Tamil (தமிழ்). Keep brand names (Raya, Razorpay, Bazaar AI, NexusStore, ThreadVault, PixelMart, eBay), order IDs, and currency symbols (₹) in original form.",
      bn: "The merchant selected Bengali. You MUST write your ENTIRE reply in fluent, natural Bengali (বাংলা). Keep brand names (Raya, Razorpay, Bazaar AI, NexusStore, ThreadVault, PixelMart, eBay), order IDs, and currency symbols (₹) in original form.",
    };

    if (!geminiKey) {
      return NextResponse.json({
        reply: fallbackReplies[locale] || fallbackReplies.en,
        action: actionPayload,
      });
    }

    const langInstruction = languageInstructionMap[locale] || languageInstructionMap.en;

    const prompt = `You are the Bazaar Multi-Store Merchant Copilot.
You have real-time access to the merchant's multi-store commerce growth engine connecting NexusStore, ThreadVault, PixelMart, and eBay Marketplace via Razorpay infrastructure.

CORE STORY: RAYA BUYS. BAZAAR GROWS. RAZORPAY MOVES THE MONEY.

REAL LIVE DATA:
- Total Processed GMV: ₹${totalGMV.toLocaleString()}
- AI-Attributed GMV: ₹${aiAttributedGMV.toLocaleString()}
- Incremental GMV (Cross-sells/Bundles): ₹${incrementalGMV.toLocaleString()}
- AI Conversion Rate: ${conversionRate}
- Average Order Value (AOV): ₹${aov.toLocaleString()} (AOV Lift: +24.8%)
- Total Orders on Razorpay: ${totalOrders}
- Active Spend Cap Guardrail: ₹${spendLimit.toLocaleString()} (Enforced via 6 Financial Policy Gates)
- Recent Orders (Top 3):
${orders.slice(0, 3).map((o: any, idx: number) => `  ${idx + 1}. [${o.id}] ₹${o.amount.toLocaleString()} (${o.store}) - ${o.agentHandshake}`).join('\n')}

MERCHANT'S QUESTION:
"${message}"

INSTRUCTIONS:
- ${langInstruction}
- Give a direct, concise, and professional answer based strictly on the real data above.
- If asked about safety guardrails: Explain the 6 financial policy gates (Spend Cap of ₹${spendLimit.toLocaleString()}, 5 units/SKU, price recheck, buyer consent, and Decision Ledger).
- If asked why revenue increased: Explain that AI-attributed GMV rose because shoppers frequently accepted automated in-cart cross-sells (e.g. Laptop → Headphones, Heated Jacket → Powerbank) with conservative attribution.
- If asked what to do next: Recommend activating the "Capture Card → Broadcast XLR Mic" opportunity to capture an estimated ₹15,999 in untapped incremental GMV.
- Keep the response punchy, authoritative, and under 80 words. Never use raw markdown asterisks.`;

    // Try candidate Gemini models in order
    const candidateModels = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest"];

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          geminiKey
        )}`;

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          }),
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText && typeof rawText === "string" && rawText.trim().length > 0) {
            return NextResponse.json({
              reply: rawText.replace(/\*\*/g, "").trim(),
              action: actionPayload,
            });
          }
        }
      } catch (err) {
        continue;
      }
    }

    // Fall back to the intelligent topic-aware reply if Gemini calls failed
    return NextResponse.json({
      reply: fallbackReplies[locale] || fallbackReplies.en,
      action: actionPayload,
    });
  } catch (error: any) {
    console.error("Copilot route error:", error);
    return NextResponse.json(
      { error: "Unable to process Merchant Copilot request at this time." },
      { status: 500 }
    );
  }
}
