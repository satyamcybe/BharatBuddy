/* ===========================
   LOCALGUIDE - script.js
   Keep it clean, keep it simple
   =========================== */

/* ===== DATA STORE ===== */
let guides = JSON.parse(localStorage.getItem("guides")) || [
  {
    name: "Smit Deshmukh",
    location: "Jaipur, India",
    languages: ["Hindi", "English", "Marwadi"],
    speciality: "Heritage & Culture",
    rating: "5.0",
    bio: "19+ years guiding tourists through Rajasthan's palaces.",
    avatar: "images/image1.png",
    experience: "1 years"
  },
  {
    name: "Satyam Choudhary",
    location: "virar",
    languages: ["hindi", "English", "maithili"],
    speciality: "mountain specialist",
    rating: "4.8",
    bio: "Born and raised in Lisbon. I know every hidden alley!",
    avatar: "images/image.png",
    experience: "2 years"
  },
  {
    name: "Jethalal Champaklal Gada",
    location: "Kutch, Gujrat",
    languages: ["Kutchi", "Gujrati"],
    speciality: "Uttrayn",
    rating: "5.0",
    bio: "chai piyo biscuit khao.",
    avatar: "images/image2.png",
    experience: "12 years"
  }
  
];

let tourists = JSON.parse(localStorage.getItem("tourists")) || [];

let places = JSON.parse(localStorage.getItem("places")) || [
  {
    name: "Jaipur",
    country: "India",
    continent: "Asia",
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600",
    flag: "🇮🇳",
    description: "The Pink City — known for its majestic forts, vibrant bazaars, and royal palaces.",
    language: "Hindi, Rajasthani",
    currency: "INR (₹)",
    bestTime: "Oct – Mar",
    mustEat: "Dal Baati Churma, Ghevar, Pyaaz Kachori",
    popular: "Amber Fort, Hawa Mahal, City Palace"
  },
  {
    name: "Kyoto",
    country: "Japan",
    continent: "Asia",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600",
    flag: "🇯🇵",
    description: "Japan's ancient capital, home to thousands of classical Buddhist temples and shrines.",
    language: "Japanese",
    currency: "JPY (¥)",
    bestTime: "Mar – May, Sep – Nov",
    mustEat: "Kaiseki, Matcha sweets, Yudofu",
    popular: "Fushimi Inari, Arashiyama, Kinkaku-ji"
  },
  {
    name: "Lisbon",
    country: "Portugal",
    continent: "Europe",
    image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600",
    flag: "🇵🇹",
    description: "Europe's westernmost capital, full of fado music, tiled buildings, and ocean views.",
    language: "Portuguese",
    currency: "EUR (€)",
    bestTime: "Mar – May, Sep – Oct",
    mustEat: "Pastel de Nata, Bacalhau, Bifanas",
    popular: "Alfama, Belém Tower, Sintra"
  },
  {
    name: "Marrakech",
    country: "Morocco",
    continent: "Africa",
    image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600",
    flag: "🇲🇦",
    description: "A dazzling city of souks, riads, and the legendary Djemaa el-Fna square.",
    language: "Arabic, Darija, French",
    currency: "MAD (DH)",
    bestTime: "Mar – May, Sep – Nov",
    mustEat: "Tagine, Couscous, Harira",
    popular: "Medina, Bahia Palace, Majorelle Garden"
  },
  {
    name: "Santorini",
    country: "Greece",
    continent: "Europe",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600",
    flag: "🇬🇷",
    description: "Iconic white-washed cliffs, blue-domed churches, and stunning Aegean sunsets.",
    language: "Greek",
    currency: "EUR (€)",
    bestTime: "Apr – Oct",
    mustEat: "Fava, Tomatokeftedes, Fresh seafood",
    popular: "Oia, Akrotiri ruins, Red Beach"
  },
  {
    name: "Cape Town",
    country: "South Africa",
    continent: "Africa",
    image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600",
    flag: "🇿🇦",
    description: "Where mountains meet the ocean — stunning landscapes, rich culture, and wine country nearby.",
    language: "Zulu, Xhosa, Afrikaans, English",
    currency: "ZAR (R)",
    bestTime: "Nov – Mar",
    mustEat: "Braai, Bobotie, Biltong",
    popular: "Table Mountain, V&A Waterfront, Cape of Good Hope"
  }
];


/* ===== TOAST NOTIFICATION ===== */
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}


/* ===== MODAL HELPERS ===== */
function openModal(id) {
  let modal = document.getElementById(id);
  if (modal) modal.classList.add("active");
}

function closeModal(id) {
  let modal = document.getElementById(id);
  if (modal) modal.classList.remove("active");
}

// Close on overlay click
document.addEventListener("click", function(e) {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("active");
  }
});


/* ===== GUIDE REGISTRATION ===== */
function registerGuide() {
  let name = document.getElementById("gName").value.trim();
  let location = document.getElementById("gLocation").value.trim();
  let languages = document.getElementById("gLanguages").value.trim();
  let speciality = document.getElementById("gSpeciality").value.trim();
  let experience = document.getElementById("gExperience").value.trim();
  let bio = document.getElementById("gBio").value.trim();

  if (!name || !location || !languages || !speciality) {
    alert("Please fill in all required fields.");
    return;
  }

  let guide = {
    name: name,
    location: location,
    languages: languages.split(",").map(l => l.trim()),
    speciality: speciality,
    experience: experience,
    bio: bio,
    rating: "New",
    avatar: "https://randomuser.me/api/portraits/lego/" + Math.floor(Math.random() * 9) + ".jpg"
  };

  guides.push(guide);
  localStorage.setItem("guides", JSON.stringify(guides));

  closeModal("guideModal");
  document.getElementById("guideRegForm").reset();
  showToast("🎉 Guide registered successfully! Welcome aboard.");

  if (typeof renderGuides === "function") renderGuides();
}


/* ===== TOURIST REGISTRATION ===== */
function registerTourist() {
  let name = document.getElementById("tName").value.trim();
  let email = document.getElementById("tEmail").value.trim();
  let country = document.getElementById("tCountry").value.trim();
  let interests = document.getElementById("tInterests").value.trim();

  if (!name || !email || !country) {
    alert("Please fill in all required fields.");
    return;
  }

  let tourist = {
    name: name,
    email: email,
    country: country,
    interests: interests
  };

  tourists.push(tourist);
  localStorage.setItem("tourists", JSON.stringify(tourists));

  closeModal("touristModal");
  document.getElementById("touristRegForm").reset();
  showToast("✈️ Welcome " + name + "! You're all set to explore.");
}


/* ===== ADD NEW PLACE ===== */
function addPlace() {
  let name = document.getElementById("pName").value.trim();
  let country = document.getElementById("pCountry").value.trim();
  let continent = document.getElementById("pContinent").value;
  let description = document.getElementById("pDescription").value.trim();
  let language = document.getElementById("pLanguage").value.trim();
  let currency = document.getElementById("pCurrency").value.trim();
  let bestTime = document.getElementById("pBestTime").value.trim();
  let mustEat = document.getElementById("pMustEat").value.trim();
  let popular = document.getElementById("pPopular").value.trim();
  let image = document.getElementById("pImage").value.trim();

  if (!name || !country || !description) {
    alert("Please fill in all required fields.");
    return;
  }

  let flagMap = {
    "Asia": "🌏", "Europe": "🌍", "Africa": "🌍",
    "Americas": "🌎", "Oceania": "🌏", "Other": "🌐"
  };

  let place = {
    name: name,
    country: country,
    continent: continent,
    description: description,
    language: language,
    currency: currency,
    bestTime: bestTime,
    mustEat: mustEat,
    popular: popular,
    image: image || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
    flag: flagMap[continent] || "🌐"
  };

  places.push(place);
  localStorage.setItem("places", JSON.stringify(places));

  closeModal("addPlaceModal");
  document.getElementById("addPlaceForm").reset();
  showToast("📍 " + name + " added to destinations!");

  if (typeof renderPlaces === "function") renderPlaces();
}


/* ===== CONTACT FORM ===== */
function submitContact() {
  let name = document.getElementById("cName").value.trim();
  let email = document.getElementById("cEmail").value.trim();
  let message = document.getElementById("cMessage").value.trim();

  if (!name || !email || !message) {
    alert("Please fill in all fields.");
    return;
  }

  document.getElementById("contactForm").reset();
  showToast("💌 Thanks " + name + "! We'll get back to you soon.");
}


/* ===== FILTER TABS ===== */
function initFilterTabs(containerId, renderFn) {
  let tabs = document.querySelectorAll("#" + containerId + " .filter-tab");
  tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderFn(tab.dataset.filter);
    });
  });
}
