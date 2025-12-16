
export const NIGERIAN_CITIES = [
    "Abuja (FCT)", "Abakaliki (Ebonyi)", "Abeokuta (Ogun)", "Ado Ekiti (Ekiti)", "Akure (Ondo)", "Asaba (Delta)",
    "Awka (Anambra)", "Bauchi (Bauchi)", "Benin City (Edo)", "Birnin Kebbi (Kebbi)", "Calabar (Cross River)",
    "Damaturu (Yobe)", "Dutse (Jigawa)", "Enugu (Enugu)", "Gombe (Gombe)", "Gusau (Zamfara)", "Ibadan (Oyo)",
    "Ikeja (Lagos)", "Ilorin (Kwara)", "Jalingo (Taraba)", "Jos (Plateau)", "Kaduna (Kaduna)", "Kano (Kano)",
    "Katsina (Katsina)", "Lafia (Nasarawa)", "Lagos", "Lokoja (Kogi)", "Maiduguri (Borno)", "Makurdi (Benue)",
    "Minna (Niger)", "Osogbo (Osun)", "Owerri (Imo)", "Port Harcourt (Rivers)", "Sokoto (Sokoto)",
    "Umuahia (Abia)", "Uyo (Akwa Ibom)", "Yenagoa (Bayelsa)", "Yola (Adamawa)"
].sort();

export const JOB_SECTORS = [
    "Technology & Software", "Legal & Compliance", "Healthcare", "Education", "Finance & Banking",
    "Oil & Gas", "Construction", "Sales & Marketing", "Administrative", "Customer Service", "Creative & Media"
].sort();

export const MOCK_DIRECTORY = {
    "Lagos": [
        { name: "NBA Lagos Branch", type: "Legal Aid", contact: "0800-LAWYER-NG" },
        { name: "Lagos Emergency", type: "Emergency", contact: "112 / 767" },
        { name: "LASUTH Ikeja", type: "Health", contact: "01-555-1234" }
    ],
    "Abuja (FCT)": [
        { name: "Legal Aid Council HQ", type: "Legal Aid", contact: "09-234-5678" },
        { name: "National Hospital", type: "Health", contact: "09-234-1111" }
    ],
    "Port Harcourt (Rivers)": [
        { name: "Rivers State Police Command", type: "Security", contact: "0803-123-4567" }
    ]
};

export const MOCK_JOBS = [
    { title: "Legal Intern", company: "Falana & Falana", location: "Ikeja (Lagos)", salary: "₦150,000", type: "Full-time" },
    { title: "Frontend Developer", company: "Paystack", location: "Remote", salary: "₦800,000", type: "Full-time" },
    { title: "Civic Educator", company: "Yiaga Africa", location: "Abuja (FCT)", salary: "₦250,000", type: "Contract" },
];

export const MOCK_FORUM_TOPICS = [
    { title: "New Tenancy Laws in Lagos", author: "Verified_Landlord", replies: 45, views: 1200 },
    { title: "NPF Checkpoint Rights Thread", author: "Legal_Eagle", replies: 120, views: 5000 },
    { title: "Voter Registration Deadline", author: "INEC_Official", replies: 89, views: 3400 },
];
